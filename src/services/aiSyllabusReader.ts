/**
 * AI Syllabus Reader Service ("Edital Mágico")
 * Location: src/services/aiSyllabusReader.ts
 *
 * Provides a resilient dual-mode AI summarizer for Brazilian public contest syllabi:
 * - Mode A: Google Gemini 2.5 Flash via REST API (when VITE_GEMINI_API_KEY is available) with JSON mode
 * - Mode B: Deterministic Structured Fallback Engine (guaranteeing 100% availability)
 *
 * Implements a 3-tier caching strategy:
 * Tier 1: In-memory cache (fastest, persists during session)
 * Tier 2: localStorage cache (persists across page reloads)
 * Tier 3: Database / exam record summary (instant pre-loaded data)
 */

import type { ConcursoExam, AISyllabusSummary } from "@/types/concurso";
import { generateDeterministicSyllabus, calculateDaysRemaining } from "./deterministicSyllabus";

// =============================================================================
// Cache Store Definitions
// =============================================================================

interface CacheEntry {
  summary: AISyllabusSummary;
  timestamp: number;
}

const MEMORY_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const LOCAL_STORAGE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const memoryCache = new Map<string, CacheEntry>();

/**
 * Returns cache key for a given exam.
 */
function getCacheKey(concurso: ConcursoExam): string {
  return concurso.slug || concurso.id || "concurso_default";
}

/**
 * Reads from localStorage safely (handles SSR / private browsing exceptions).
 */
function getLocalStorageCache(key: string): CacheEntry | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(`kiestudos_ai_summary_${key}`);
    if (!raw) return null;
    const parsed: CacheEntry = JSON.parse(raw);
    if (!parsed || !parsed.summary || !parsed.timestamp) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Saves to localStorage safely.
 */
function setLocalStorageCache(key: string, summary: AISyllabusSummary): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const entry: CacheEntry = {
      summary,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(`kiestudos_ai_summary_${key}`, JSON.stringify(entry));
  } catch (err) {
    console.warn("[aiSyllabusReader] Could not save to localStorage:", err);
  }
}

/**
 * Clears cache for a specific exam or all exams.
 */
export function clearSyllabusCache(examIdOrSlug?: string): void {
  if (examIdOrSlug) {
    memoryCache.delete(examIdOrSlug);
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(`kiestudos_ai_summary_${examIdOrSlug}`);
    }
  } else {
    memoryCache.clear();
    if (typeof window !== "undefined" && window.localStorage) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith("kiestudos_ai_summary_")) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    }
  }
}

/**
 * Checks whether a Gemini API key is configured in the environment.
 */
export function isGeminiAvailable(): boolean {
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  return Boolean(envKey && typeof envKey === "string" && envKey.trim().length > 0);
}

// =============================================================================
// Gemini 2.5 Flash REST Client
// =============================================================================

/**
 * Constructs prompt instructing Gemini to analyze the contest and produce
 * strict JSON adhering to the AISyllabusSummary contract.
 */
function buildGeminiPrompt(concurso: ConcursoExam): string {
  return `
Você é o "Edital Mágico", o auditor e especialista sênior de IA da plataforma KiEstudos em concursos públicos brasileiros.
Analise os dados do edital abaixo e gere uma síntese estruturada executiva com alta precisão técnica.

DADOS DO CONCURSO:
- Título: ${concurso.title}
- Instituição / Órgão: ${concurso.institution}
- Cargo: ${concurso.role}
- Banca Organizadora: ${concurso.exam_board || "Não informada"}
- Esfera: ${concurso.sphere}
- Estado / UF: ${concurso.state}
- Escolaridade: ${concurso.education_level}
- Vagas Imediatas: ${concurso.vacancies}
- Vagas Cadastro Reserva: ${concurso.vacancies_reserve ?? "A definir"}
- Salário Inicial: R$ ${concurso.salary ?? "A definir"}
- Taxa de Inscrição: R$ ${concurso.registration_fee ?? "A definir"}
- Início das Inscrições: ${concurso.registration_start_date ?? "A definir"}
- Término das Inscrições: ${concurso.registration_end_date ?? "A definir"}
- Data da Prova: ${concurso.exam_date ?? "A definir"}
- Link Oficial de Inscrição da Banca: ${concurso.registration_link}
- Link do Edital Oficial: ${concurso.edital_url ?? "Não informado"}

REGRAS DE EXTRAÇÃO:
1. "vacancies": Total, imediatas, cadastro reserva, texto explicativo da distribuição, cotas PCD (geralmente 5% a 10%) e cotas negros (20%).
2. "remuneration": Salário base, benefícios comuns da carreira e remuneração estimada total.
3. "registration": Link oficial fornecido (${concurso.registration_link}), taxa formatada em R$, datas de início e fim, e status ("abertas" | "previstas" | "encerradas" | "em_breve").
4. "keyDates": Array cronológico com marcos críticos (período de inscrição, prazo de isenção, limite de pagamento, data da prova objetiva, gabarito preliminar, resultado).
5. "programmaticContent": Array das disciplinas principais do certame com peso estimado (1.0 a 4.0), lista de tópicos prioritários mais cobrados pela banca e nível de importância ("alta" | "media" | "baixa").
6. "studyStrategy": Áreas de maior foco, dicas táticas específicas para a banca organizadora (${concurso.exam_board}) e total de horas recomendadas de estudo.

Retorne EXCLUSIVAMENTE um objeto JSON válido, sem markdown, sem explicações extras, seguindo este formato exato:
{
  "examTitle": "string",
  "institution": "string",
  "banca": "string",
  "vacancies": {
    "total": 0,
    "immediate": 0,
    "reserve": 0,
    "breakdown": "string",
    "cotasPCD": "string",
    "cotasNegros": "string"
  },
  "remuneration": {
    "initialSalary": "string",
    "benefits": "string",
    "totalEstimated": "string"
  },
  "registration": {
    "officialLink": "string",
    "fee": "string",
    "startDate": "string",
    "endDate": "string",
    "status": "abertas"
  },
  "keyDates": [
    {
      "label": "string",
      "date": "string",
      "type": "inscricao",
      "description": "string",
      "daysRemaining": 0
    }
  ],
  "programmaticContent": [
    {
      "discipline": "string",
      "weight": 2.0,
      "topics": ["string"],
      "importance": "alta"
    }
  ],
  "studyStrategy": {
    "focusAreas": ["string"],
    "tips": ["string"],
    "estimatedHoursRecommended": 250
  }
}
`.trim();
}

/**
 * Calls Gemini 2.5 Flash REST API with timeout and JSON mode.
 */
async function callGemini25Flash(concurso: ConcursoExam, apiKey: string): Promise<AISyllabusSummary> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const prompt = buildGeminiPrompt(concurso);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gemini API HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Empty candidate text response from Gemini API");
    }

    const parsed = JSON.parse(rawText);

    // Merge with deterministic baseline to assure all mandatory fields and calculated days
    const fallback = generateDeterministicSyllabus(concurso);

    const mergedKeyDates = Array.isArray(parsed.keyDates) && parsed.keyDates.length > 0
      ? parsed.keyDates.map((item: any) => ({
          label: item.label || "Data do Certame",
          date: item.date || "A definir",
          type: item.type || "inscricao",
          description: item.description,
          daysRemaining:
            typeof item.daysRemaining === "number"
              ? item.daysRemaining
              : calculateDaysRemaining(item.date),
        }))
      : fallback.keyDates;

    const mergedContent = Array.isArray(parsed.programmaticContent) && parsed.programmaticContent.length > 0
      ? parsed.programmaticContent.map((item: any) => ({
          discipline: item.discipline || "Conhecimentos",
          weight: typeof item.weight === "number" ? item.weight : 2.0,
          topics: Array.isArray(item.topics) ? item.topics : ["Tópicos fundamentais do edital"],
          importance: ["alta", "media", "baixa"].includes(item.importance)
            ? item.importance
            : "alta",
        }))
      : fallback.programmaticContent;

    const summary: AISyllabusSummary = {
      examTitle: parsed.examTitle || fallback.examTitle,
      institution: parsed.institution || fallback.institution,
      banca: parsed.banca || fallback.banca,
      vacancies: {
        total: Number(parsed.vacancies?.total) || fallback.vacancies.total,
        immediate: Number(parsed.vacancies?.immediate) || fallback.vacancies.immediate,
        reserve: Number(parsed.vacancies?.reserve) || fallback.vacancies.reserve,
        breakdown: parsed.vacancies?.breakdown || fallback.vacancies.breakdown,
        cotasPCD: parsed.vacancies?.cotasPCD || fallback.vacancies.cotasPCD,
        cotasNegros: parsed.vacancies?.cotasNegros || fallback.vacancies.cotasNegros,
      },
      remuneration: {
        initialSalary: parsed.remuneration?.initialSalary || fallback.remuneration.initialSalary,
        benefits: parsed.remuneration?.benefits || fallback.remuneration.benefits,
        totalEstimated: parsed.remuneration?.totalEstimated || fallback.remuneration.totalEstimated,
      },
      registration: {
        officialLink:
          concurso.registration_link ||
          parsed.registration?.officialLink ||
          fallback.registration.officialLink,
        fee: parsed.registration?.fee || fallback.registration.fee,
        startDate: parsed.registration?.startDate || fallback.registration.startDate,
        endDate: parsed.registration?.endDate || fallback.registration.endDate,
        status: parsed.registration?.status || fallback.registration.status,
      },
      keyDates: mergedKeyDates,
      programmaticContent: mergedContent,
      studyStrategy: {
        focusAreas: Array.isArray(parsed.studyStrategy?.focusAreas)
          ? parsed.studyStrategy.focusAreas
          : fallback.studyStrategy.focusAreas,
        tips: Array.isArray(parsed.studyStrategy?.tips)
          ? parsed.studyStrategy.tips
          : fallback.studyStrategy.tips,
        estimatedHoursRecommended:
          Number(parsed.studyStrategy?.estimatedHoursRecommended) ||
          fallback.studyStrategy.estimatedHoursRecommended,
      },
      generatedAt: new Date().toISOString(),
      source: "gemini_ai",
    };

    return summary;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// =============================================================================
// Main Exported AI Syllabus Reader Entrypoint
// =============================================================================

/**
 * Retrieves the AI Syllabus Summary for an exam using a 3-tier caching strategy
 * with seamless fallback to high-fidelity deterministic generation.
 *
 * @param concurso - The ConcursoExam to analyze.
 * @param forceRefresh - If true, bypasses in-memory and localStorage cache to re-analyze.
 */
export async function getAISyllabusSummary(
  concurso: ConcursoExam,
  forceRefresh = false
): Promise<AISyllabusSummary> {
  const cacheKey = getCacheKey(concurso);
  const now = Date.now();

  // Tier 1: In-Memory Cache
  if (!forceRefresh) {
    const memoryHit = memoryCache.get(cacheKey);
    if (memoryHit && now - memoryHit.timestamp < MEMORY_CACHE_TTL_MS) {
      return memoryHit.summary;
    }
  }

  // Tier 2: LocalStorage Cache
  if (!forceRefresh) {
    const localHit = getLocalStorageCache(cacheKey);
    if (localHit && now - localHit.timestamp < LOCAL_STORAGE_TTL_MS) {
      memoryCache.set(cacheKey, localHit);
      return localHit.summary;
    }
  }

  // Tier 3: Pre-seeded / Database AI summary
  if (!forceRefresh && concurso.summary_ai?.ai_syllabus_summary) {
    const dbSummary: AISyllabusSummary = {
      ...concurso.summary_ai.ai_syllabus_summary,
      source: "cached_db",
    };
    memoryCache.set(cacheKey, { summary: dbSummary, timestamp: now });
    setLocalStorageCache(cacheKey, dbSummary);
    return dbSummary;
  }

  // Mode A: Attempt Gemini 2.5 Flash if API Key is configured
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (apiKey && typeof apiKey === "string" && apiKey.trim().length > 0) {
    try {
      const aiSummary = await callGemini25Flash(concurso, apiKey.trim());
      memoryCache.set(cacheKey, { summary: aiSummary, timestamp: now });
      setLocalStorageCache(cacheKey, aiSummary);
      return aiSummary;
    } catch (geminiError) {
      console.warn(
        `[aiSyllabusReader] Gemini 2.5 Flash request failed for ${concurso.title}. Falling back to deterministic engine.`,
        geminiError
      );
    }
  }

  // Mode B: Deterministic Fallback Engine (Guaranteed 100% Availability)
  const fallbackSummary = generateDeterministicSyllabus(concurso);
  memoryCache.set(cacheKey, { summary: fallbackSummary, timestamp: now });
  setLocalStorageCache(cacheKey, fallbackSummary);

  return fallbackSummary;
}
