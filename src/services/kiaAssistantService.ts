/**
 * KiA AI Study Assistant Service
 * Location: src/services/kiaAssistantService.ts
 *
 * Provides the intelligence layer for KiA:
 * - Mode A: Google Gemini 2.5 Flash via REST API (when VITE_GEMINI_API_KEY is configured)
 * - Mode B: Deterministic Structured Offline Engine with 100% resilience & zero crashes
 * - Deep injection of Concurso Foco context (active exam, exam board rules, syllabus weights)
 * - Cross-component trigger dispatcher (openKiAAssistant) for global navigation
 */

import type { ConcursoExam, AISyllabusSummary } from "@/types/concurso";
import { generateDeterministicSyllabus, calculateDaysRemaining, formatDateToBR } from "./deterministicSyllabus";

// =============================================================================
// Interfaces & Types
// =============================================================================

export interface ChatMessage {
  id: string;
  sender: "user" | "kia";
  text: string;
  timestamp: string;
  source?: "gemini_ai" | "deterministic_engine";
}

export interface SendKiAMessageParams {
  message: string;
  history?: ChatMessage[];
  activeExam?: ConcursoExam | null;
  syllabusSummary?: AISyllabusSummary | null;
}

export interface KiAResponse {
  id: string;
  text: string;
  source: "gemini_ai" | "deterministic_engine";
  timestamp: string;
}

export interface EditalQuickInsights {
  examTitle: string;
  institution: string;
  banca: string;
  role: string;
  status: string;
  statusLabel: string;
  examDate: string | null;
  formattedExamDate: string;
  daysRemaining: number | null;
  salary: string;
  vacanciesTotal: number | string;
  vacanciesImmediate: number | string;
  vacanciesReserve: number | string;
  registrationLink: string;
  registrationStatus: string;
  registrationPeriod: string;
  topDisciplines: Array<{
    discipline: string;
    weight: number;
    importance: string;
    topics: string[];
  }>;
  tacticalTips: string[];
}

export interface BancaStrategyAdvice {
  banca: string;
  fullName: string;
  penaltyRule: string;
  portugueseStyle: string;
  lawStyle: string;
  mathLogicStyle: string;
  trapsToAvoid: string[];
  timeManagement: string;
  goldenRule: string;
}

// =============================================================================
// Environment & Helper Utilities
// =============================================================================

/**
 * Checks whether a Gemini API key is available in Vite environment.
 */
export function isGeminiAvailable(): boolean {
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  return Boolean(envKey && typeof envKey === "string" && envKey.trim().length > 0);
}

/**
 * Global event dispatcher to open the KiA Assistant drawer from any UI component
 * (such as AppNav's "Rotina com IA" button).
 */
export function openKiAAssistant(tab: "chat" | "raio-x" | "bancas" = "chat"): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("open-kia-assistant", {
        detail: { tab },
      })
    );
  }
}

// =============================================================================
// Curated Exam Board Strategies (Bancas Examinadoras Brasileiras)
// =============================================================================

export const BANCA_STRATEGIES: Record<
  "cebraspe" | "fgv" | "fcc" | "vunesp" | "cesgranrio",
  BancaStrategyAdvice
> = {
  cebraspe: {
    banca: "Cebraspe",
    fullName: "Cebraspe / Cespe (Centro Brasileiro de Pesquisa em Avaliação e Seleção)",
    penaltyRule:
      "Modelo clássico de Certo/Errado: uma assertiva incorreta anula uma assertiva correta (-1 ponto líquido). Na dúvida razoável, deixar o item EM BRANCO é tática matemática vencedora para proteger seu escore líquido.",
    portugueseStyle:
      "Assertivas extensas exigindo interpretação textual contextual, coesão referencial e reescrita de fragmentos. O examinador avalia se a substituição de conectivos ou termos mantém o sentido estrito e a correção gramatical original.",
    lawStyle:
      "Foco dominante em jurisprudência qualificada: Súmulas Vinculantes, teses de Repercussão Geral do STF e Recursos Repetitivos do STJ. Fique atento a julgados recentes dos últimos 18 a 24 meses.",
    mathLogicStyle:
      "Estruturas lógicas de argumentação, diagramas lógicos de conjuntos e equivalências de proposições condicionais (especialmente a contrapositiva e a negação de proposições compostas).",
    trapsToAvoid: [
      "Palavras generalistas ou excludentes ('sempre', 'nunca', 'exclusivamente', 'indubitavelmente') tendem a tornar o item ERRADO.",
      "Dupla negação no enunciado construída para induzir o candidato ao cansaço cognitivo.",
      "Assertivas que contêm premissas verdadeiras mas concluem com uma relação de causalidade falsa.",
      "Inversão sutil de competências constitucionais privativas vs concorrentes.",
    ],
    timeManagement:
      "Planeje 1 minuto a 1m15s por item em provas de 120 assertivas. Reserve impreterivelmente 35 minutos para o preenchimento da folha de respostas com dupla checagem dos itens deixados em branco.",
    goldenRule:
      "No Cebraspe, quem passa não é quem sabe mais, é quem comete menos erros impensados. Valorize o escore líquido!",
  },

  fgv: {
    banca: "FGV",
    fullName: "Fundação Getulio Vargas",
    penaltyRule:
      "Múltipla escolha tradicional com 5 alternativas (A, B, C, D, E). Não há anulação por erro. Jamais deixe questões em branco: utilize eliminação criteriosa de distratores e chute técnico.",
    portugueseStyle:
      "Considerada a prova de Língua Portuguesa mais desafiadora do país. Textos curtos com exigência de inferências semânticas profundas, figuras de linguagem, ironia, pressupostos e intenção pragmática do autor. A gramática é sempre contextualizada.",
    lawStyle:
      "Casos hipotéticos complexos com nomes fictícios ('João, servidor da autarquia X...'). Sublinhe no enunciado as datas, cargos, órgãos de vinculação e a linha temporal dos fatos antes de ler as alternativas.",
    mathLogicStyle:
      "Problemas aritméticos práticos, combinatória, probabilidade e raciocínio indutivo/dedutivo aplicados a cenários econômicos ou sociais.",
    trapsToAvoid: [
      "Alternativas que contêm afirmações juridicamente corretas em tese, mas que NÃO respondem ao caso concreto narrado no enunciado.",
      "Distratores semânticos em Português com palavras sinônimas que alteram sutilmente a carga de formalidade ou julgamento de valor do autor.",
      "Prazos processuais misturados entre dias úteis e dias corridos.",
    ],
    timeManagement:
      "Média de 2m45s a 3 minutos por questão. Textos densos provocam fadiga visual: adote pausas estratégicas de 15 segundos para respiração a cada 15 questões.",
    goldenRule:
      "Na FGV, leia sempre o comando do enunciado e as alternativas ANTES de mergulhar no texto-base de Língua Portuguesa.",
  },

  fcc: {
    banca: "FCC",
    fullName: "Fundação Carlos Chagas",
    penaltyRule:
      "Múltipla escolha com 5 alternativas (A, B, C, D, E) sem penalização por erro. Adoção frequente de escore padronizado (desvio-padrão) com pesos diferenciados entre conhecimentos gerais e específicos.",
    portugueseStyle:
      "Gramática normativa formal e rigorosa: concordância verbal com sujeito paciente ('alugam-se casas'), regência verbal com pronome relativo ('a lei a que obedecemos'), crase e reescritura clássica.",
    lawStyle:
      "A rainha da 'Lei Seca'. As alternativas reproduzem quase literalmente a letra dos artigos da Constituição Federal, Códigos e Legislações Especiais, alterando prazos, quóruns ou órgãos.",
    mathLogicStyle:
      "Raciocínio lógico-matemático tradicional com sequências lógicas, verdades e mentiras, diagramas de Venn e matrizes de associação lógica.",
    trapsToAvoid: [
      "Troca sutil de palavras legislativas: 'prescindível' por 'imprescindível', 'poderá' por 'deverá', 'maioria absoluta' por 'maioria simples'.",
      "Prazos alterados em um único dia (ex: 5 dias em vez de 10 dias).",
      "Confusão intencional entre competências exclusivas do Presidente vs privativas do Congresso.",
    ],
    timeManagement:
      "2m15s a 2m30s por questão. Questões de lei seca bem memorizadas devem ser resolvidas em menos de 1 minuto, gerando gordura de tempo para RLM e Discursiva.",
    goldenRule:
      "A aprovação na FCC é construída com leitura diária de legislação seca e resolução exaustiva de provas anteriores dos últimos 3 anos.",
  },

  vunesp: {
    banca: "Vunesp",
    fullName: "Fundação Vunesp (Vestibular da Universidade Estadual Paulista)",
    penaltyRule:
      "Múltipla escolha (5 alternativas) sem anulação por erros. Provas com notas de corte tradicionalmente muito elevadas (>85% a 90%).",
    portugueseStyle:
      "Enunciados diretos, claros e acessíveis. Mais de 40% da prova é focada em interpretação objetiva de charges/crônicas, crase, pontuação e colocação pronominal.",
    lawStyle:
      "Literalidade legalista quase integral. Pouquíssima cobrança de doutrina divergente ou jurisprudência minoritária. O que vale é a letra da lei seca constante no edital.",
    mathLogicStyle:
      "Matemática básica, frações, porcentagens, regra de três composta, equações de 1º grau e lógica proposicional elementar.",
    trapsToAvoid: [
      "Enunciados que solicitam a alternativa INCORRETA ou a EXCEÇÃO (grife imediatamente a palavra NÃO ou INCORRETA no caderno).",
      "Erros simples de cálculo por afobação em questões fáceis de matemática.",
      "Descuido com a pontuação de corte alta: perder uma questão fácil na Vunesp custa posições vitais.",
    ],
    timeManagement:
      "2 minutos por questão. O ritmo de prova é ágil e permite concluir com 40 a 50 minutos de antecedência para revisão calma.",
    goldenRule:
      "Na Vunesp, quem erra questão fácil é punido pela nota de corte. Foco em precisão total nos conteúdos básicos!",
  },

  cesgranrio: {
    banca: "Cesgranrio",
    fullName: "Fundação Cesgranrio",
    penaltyRule:
      "Múltipla escolha com 5 alternativas (A, B, C, D, E) sem penalização por erro. É a banca tradicional dos certames bancários (Banco do Brasil, Caixa Econômica) e empresas públicas federais.",
    portugueseStyle:
      "Textos de crônicas, atualidades ou divulgação científica. Interpretação textual sem pegadinhas mirabolantes aliada a questões de coesão, concordância e regência.",
    lawStyle:
      "Cobrança aplicada ao cotidiano das carreiras bancárias e administrativas: compliance, sigilo bancário, crimes contra o SFN, LGPD e ética no serviço público.",
    mathLogicStyle:
      "Matemática Financeira e Estatística Aplicada: juros simples e compostos, taxas equivalentes, séries de pagamentos e interpretação de gráficos/tabelas.",
    trapsToAvoid: [
      "Enunciados longos com histórias do dia a dia de clientes bancários que ocultam uma operação matemática simples.",
      "Fórmulas de amortização (Tabela Price vs SAC) em certames bancários.",
      "Novidades regulatórias do BACEN, Pix, Open Finance e resoluções do CMN que foram atualizadas após a publicação do edital.",
    ],
    timeManagement:
      "2m30s a 2m45s por questão. Guarde tempo extra para as matérias de cálculo (Matemática e Matemática Financeira).",
    goldenRule:
      "Domine os conceitos e atualidades do Sistema Financeiro Nacional (SFN) e produtos bancários para gabaritar a Cesgranrio.",
  },
};

/**
 * Returns the strategic advice for a given exam board.
 */
export function getBancaStrategy(banca: string): BancaStrategyAdvice {
  if (!banca) {
    return BANCA_STRATEGIES["cebraspe"];
  }
  const lower = banca.toLowerCase();
  if (lower.includes("cebraspe") || lower.includes("cespe")) return BANCA_STRATEGIES["cebraspe"];
  if (lower.includes("fgv") || lower.includes("getulio")) return BANCA_STRATEGIES["fgv"];
  if (lower.includes("fcc") || lower.includes("carlos chagas")) return BANCA_STRATEGIES["fcc"];
  if (lower.includes("vunesp")) return BANCA_STRATEGIES["vunesp"];
  if (lower.includes("cesgranrio")) return BANCA_STRATEGIES["cesgranrio"];

  // Fallback generic strategy for regional/smaller boards
  return {
    banca: banca,
    fullName: banca,
    penaltyRule:
      "Múltipla escolha (geralmente 4 ou 5 alternativas). Verifique no edital oficial se há previsão de nota mínima por disciplina para não ser eliminado.",
    portugueseStyle:
      "Gramática normativa tradicional: ortografia, pontuação, crase, concordância verbal e interpretação textual direta.",
    lawStyle:
      "Predominância absoluta de leitura da lei seca. Destaque artigos que estipulam prazos, vedações, sanções e competências de autoridades.",
    mathLogicStyle:
      "Raciocínio lógico proposicional e matemática básica (regra de três, porcentagem, conjuntos).",
    trapsToAvoid: [
      "Falta de leitura do edital específico sobre critérios de desempate.",
      "Questões que pedem a alternativa incorreta sem destaque visual.",
    ],
    timeManagement:
      "Calcule em média 2m30s por questão, mantendo pelo menos 30 minutos finais para preenchimento com tranquilidade da folha de respostas.",
    goldenRule:
      "Resolva pelo menos 100 questões recentes elaboradas por esta mesma banca examinadora para mapear o vocabulário e o estilo do examinador.",
  };
}

// =============================================================================
// Quick Edital Insights Extractor
// =============================================================================

/**
 * Extracts immediate, high-value edital insights from active exam and syllabus.
 */
export function getEditalQuickInsights(activeExam: ConcursoExam): EditalQuickInsights {
  const syllabus = generateDeterministicSyllabus(activeExam);
  const days = calculateDaysRemaining(activeExam.exam_date);

  const statusMap: Record<string, string> = {
    inscricoes_abertas: "Inscrições Abertas",
    edital_publicado: "Edital Publicado",
    autorizado: "Concurso Autorizado",
    previsto: "Edital Previsto (Não Publicado)",
    encerrado: "Certame Encerrado",
  };

  const statusLabel = statusMap[activeExam.status] || "Edital em Andamento";

  const salaryFormatted =
    activeExam.salary && activeExam.salary > 0
      ? `R$ ${activeExam.salary.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : syllabus.remuneration?.initialSalary || "A definir pelo órgão";

  const formattedExamDate = activeExam.exam_date
    ? formatDateToBR(activeExam.exam_date)
    : "Sem edital publicado";

  const regPeriod =
    activeExam.registration_start_date && activeExam.registration_end_date
      ? `${formatDateToBR(activeExam.registration_start_date)} até ${formatDateToBR(activeExam.registration_end_date)}`
      : syllabus.registration?.startDate &&
        syllabus.registration?.endDate &&
        !syllabus.registration.startDate.includes("A definir") &&
        !syllabus.registration.startDate.includes("Sem edital")
      ? `${syllabus.registration.startDate} até ${syllabus.registration.endDate}`
      : "Sem edital publicado / A definir";

  const topDisciplines = (syllabus.programmaticContent || []).slice(0, 5).map((d) => ({
    discipline: d.discipline,
    weight: typeof d.weight === "number" ? d.weight : 2.0,
    importance: d.importance || "alta",
    topics: Array.isArray(d.topics) ? d.topics.slice(0, 4) : ["Conteúdo programático oficial"],
  }));

  return {
    examTitle: activeExam.title,
    institution: activeExam.institution,
    banca: activeExam.exam_board || syllabus.banca || "A definir",
    role: activeExam.role,
    status: activeExam.status,
    statusLabel,
    examDate: activeExam.exam_date ?? null,
    formattedExamDate,
    daysRemaining: typeof days === "number" && days >= 0 ? days : null,
    salary: salaryFormatted,
    vacanciesTotal: activeExam.vacancies || syllabus.vacancies?.total || "A definir",
    vacanciesImmediate: syllabus.vacancies?.immediate || activeExam.vacancies || "A definir",
    vacanciesReserve: activeExam.vacancies_reserve ?? syllabus.vacancies?.reserve ?? "CR",
    registrationLink: activeExam.registration_link || syllabus.registration?.officialLink || "",
    registrationStatus: syllabus.registration?.status || activeExam.status,
    registrationPeriod: regPeriod,
    topDisciplines,
    tacticalTips: syllabus.studyStrategy?.tips || [
      "Priorize a resolução de questões diárias da banca organizadora.",
      "Mantenha um ciclo de revisão espaçada (SM-2) para tópicos de alta incidência.",
      "Estude a legislação seca com marcação de palavras-chave e prazos.",
    ],
  };
}

// =============================================================================
// Deterministic Offline Study Tutor Engine
// =============================================================================

function generateDeterministicKiAResponse(
  userQuery: string,
  activeExam?: ConcursoExam | null,
  syllabusSummary?: AISyllabusSummary | null
): string {
  const query = userQuery.toLowerCase().trim();
  const contestName = activeExam?.title || "seu concurso foco";
  const boardName = activeExam?.exam_board || "a banca organizadora";
  const roleName = activeExam?.role || "seu cargo alvo";

  // 1. Organização dos estudos / Cronograma / Ciclo de estudos / Rotina
  if (
    query.includes("organizar") ||
    query.includes("cronograma") ||
    query.includes("planejar") ||
    query.includes("rotina") ||
    query.includes("começar") ||
    query.includes("ciclo")
  ) {
    const subjects = syllabusSummary?.programmaticContent?.slice(0, 4).map((s) => s.discipline) || [
      "Língua Portuguesa",
      "Raciocínio Lógico",
      "Direito Administrativo",
      "Conhecimentos Específicos",
    ];

    return `
### 🎯 Plano de Estudos Tático para ${contestName}

Para ser aprovado no cargo de **${roleName}**, a chave não é estudar 12 horas esgotantes, mas manter **consistência com método ativo**:

#### 1. Ciclo de Estudos Intercalado (Alternância Cognitiva)
Em vez de estudar a mesma matéria o dia inteiro, divida suas sessões em blocos de **60 a 90 minutos** alternando entre teoria e exatas:
${subjects.map((sub, idx) => `- **Bloco ${idx + 1}**: ${sub} (Teoria focada + 10 questões imediatas)`).join("\n")}

#### 2. Proporção Teoria × Questões
- **Pré-Edital**: 65% Teoria / Leitura de Lei Seca + 35% Resolução de Questões comentadas.
- **Pós-Edital**: 30% Teoria pontual para sanar lacunas + 70% Questões e Simulados da banca **${boardName}**.

#### 3. Método Pomodoro Adaptado
- 50 minutos de imersão total (sem notificações ou redes sociais).
- 10 minutos de descanso ativo (hidratação e alongamento).
- A cada 3 blocos, faça um intervalo maior de 30 minutos.

> **💡 Dica do KiA:** Reserve sempre as manhãs para as disciplinas de maior peso ou onde você possui maior dificuldade cognitiva. O cérebro descansa à noite e tem pico de retenção nas primeiras horas do dia!
`.trim();
  }

  // 2. Priorização de Matérias / Pesos / O que estudar primeiro
  if (
    query.includes("priorizar") ||
    query.includes("matéria") ||
    query.includes("disciplina") ||
    query.includes("peso") ||
    query.includes("importante") ||
    query.includes("conteúdo")
  ) {
    const content = syllabusSummary?.programmaticContent || [];
    if (content.length > 0) {
      const topItems = content.slice(0, 4);
      return `
### ⚖️ Priorização Estratégica de Matérias — ${contestName}

Analisando a estrutura do edital de **${roleName}** junto à banca **${boardName}**, identificamos a seguinte hierarquia de pontuação:

${topItems
  .map(
    (item, index) =>
      `#### ${index + 1}. ${item.discipline} (Peso estimado: ${item.weight?.toFixed(1) || "2.0"} • Importância: ${item.importance?.toUpperCase() || "ALTA"})\n` +
      `- **Tópicos mais incidentes**: ${item.topics.slice(0, 3).join(", ")}.\n` +
      `- **Recomendação**: Dedique ao menos 2 a 3 sessões semanais com simulados temáticos.`
  )
  .join("\n\n")}

#### 📌 Regra de Distribuição Semanal
1. **Disciplinas de Peso 3.0 / Específicas**: 45% da sua carga horária semanal.
2. **Língua Portuguesa**: 25% da carga (fundamental em critérios de desempate de todas as bancas).
3. **Legislação & Básicas**: 30% da carga (leitura de lei seca e memorização de prazos).
`.trim();
    }

    return `
### ⚖️ Como Priorizar Matérias em Concursos Públicos

Para definir o que estudar primeiro sem perder tempo:
1. **Analise o Peso no Edital**: Multiplique a quantidade de questões pelo peso de cada questão. As disciplinas que representam mais de 60% da nota líquida devem receber 60% do seu tempo de estudo.
2. **Identifique a sua Taxa de Acerto**: No nosso menu de Questões e Simulados, veja em quais matérias sua taxa de acerto está abaixo de 70%. É nelas que está sua maior margem de crescimento.
3. **Português é Obrigatório**: Em quase todos os certames brasileiros (Cebraspe, FGV, FCC), Língua Portuguesa é o primeiro critério de desempate e responde por 20% a 30% da prova.
`.trim();
  }

  // 3. Estratégia de Banca / Cebraspe / FGV / FCC / Vunesp / Cesgranrio
  if (
    query.includes("cespe") ||
    query.includes("cebraspe") ||
    query.includes("fgv") ||
    query.includes("fcc") ||
    query.includes("vunesp") ||
    query.includes("cesgranrio") ||
    query.includes("banca") ||
    query.includes("estratégia")
  ) {
    let targetBancaKey: "cebraspe" | "fgv" | "fcc" | "vunesp" | "cesgranrio" = "cebraspe";
    if (query.includes("fgv") || boardName.toLowerCase().includes("fgv")) targetBancaKey = "fgv";
    else if (query.includes("fcc") || boardName.toLowerCase().includes("fcc")) targetBancaKey = "fcc";
    else if (query.includes("vunesp") || boardName.toLowerCase().includes("vunesp")) targetBancaKey = "vunesp";
    else if (query.includes("cesgranrio") || boardName.toLowerCase().includes("cesgranrio")) targetBancaKey = "cesgranrio";
    else if (boardName.toLowerCase().includes("cebraspe") || boardName.toLowerCase().includes("cespe")) targetBancaKey = "cebraspe";

    const advice = BANCA_STRATEGIES[targetBancaKey] || BANCA_STRATEGIES["cebraspe"];

    return `
### 🛡️ Manual Tático da Banca: ${advice.fullName}

#### 1. Regra de Pontuação & Chutes
${advice.penaltyRule}

#### 2. Perfil de Língua Portuguesa
${advice.portugueseStyle}

#### 3. Cobrança de Legislação e Direito
${advice.lawStyle}

#### 4. Armadilhas Mais Comuns (Distratores)
${advice.trapsToAvoid.map((t) => `- ⚠️ ${t}`).join("\n")}

#### 5. Gestão de Tempo no Dia da Prova
${advice.timeManagement}

> **🏆 Regra de Ouro:** ${advice.goldenRule}
`.trim();
  }

  // 4. Penalização de Chutes e Questões em Branco
  if (
    query.includes("chute") ||
    query.includes("penaliza") ||
    query.includes("branco") ||
    query.includes("anula") ||
    query.includes("errada")
  ) {
    return `
### 📊 Matemática dos Chutes em Concursos Públicos

A decisão de chutar depende estritamente do modelo da banca examinadora:

#### A. Modelo Cebraspe (1 Errada Anula 1 Certa)
- **Esperança Matemática de Chute Cego**: Em 100 chutes aleatórios em itens C/E, a probabilidade é acertar 50 e errar 50. Como 50 erradas anulam 50 certas, seu ganho líquido esperado é **Zero** (com alto risco de pontuação negativa!).
- **Quando Deixar em Branco**: Se você não faz ideia da assertiva ou se está em dúvida total, **deixe em branco**. Proteger pontos líquidos já garantidos é o segredo dos aprovados.
- **Quando Chutar (Chute Qualificado)**: Se você detectou um termo generalista extremo ('sempre', 'em hipótese alguma') que quase certamente invalida o item, o risco compensa.

#### B. Múltipla Escolha (FGV, FCC, Vunesp, Cesgranrio — 5 alternativas)
- **Regra Absoluta**: **Nunca deixe em branco!** Erros não anulam questões corretas.
- **Eliminação Técnica**: Mesmo que não saiba a resposta exata, elimine as 2 ou 3 alternativas patentemente absurdas. Ao reduzir para 2 alternativas, sua chance de acerto sobe de 20% para 50%!
`.trim();
  }

  // 5. Data da Prova / Situação do Edital
  if (
    query.includes("quando") ||
    query.includes("data") ||
    query.includes("edital") ||
    query.includes("publicado") ||
    query.includes("prazo") ||
    query.includes("inscrição")
  ) {
    if (activeExam) {
      if (activeExam.status === "previsto" || !activeExam.exam_date) {
        return `
### 📅 Situação Oficial do Edital: ${activeExam.title}

- **Situação Atual**: **${activeExam.status === "previsto" ? "PREVISTO (Não Publicado)" : "Em Definição"}**
- **Data da Prova**: **Sem edital publicado / A definir oficialmente**
- **Banca Prevista**: ${activeExam.exam_board || "A definir pela comissão do certame"}
- **Remuneração Prevista**: R$ ${activeExam.salary?.toLocaleString("pt-BR") || "A definir"}

> **⚠️ Alerta de Integridade KiEstudos:** O edital oficial ainda não foi publicado pelo órgão! Tome muito cuidado com cronogramas e datas fictícias divulgadas na internet.
> 
> **Sua Missão Agora:** O momento ideal para garantir a vaga é **antes da publicação do edital**. Feche o núcleo comum de matérias básicas (Português, RLM e Legislação do órgão) para que, quando o edital sair, você apenas revise e faça simulados!
`.trim();
      }

      const days = calculateDaysRemaining(activeExam.exam_date);
      const isEncerrado = activeExam.status === "encerrado";
      return `
### 📅 Calendário Oficial de Prova: ${activeExam.title}

- **Situação**: **${isEncerrado ? "Certame Encerrado (Prova Realizada)" : "Edital Publicado"}**
- **Data Oficial da Prova**: **${formatDateToBR(activeExam.exam_date)}**
- **Contagem Regressiva**: **${isEncerrado ? "Prova realizada (Histórico Oficial)" : typeof days === "number" && days >= 0 ? `${days} dias restantes` : "Prova realizada"}**
- **Inscrições**: ${activeExam.registration_start_date ? formatDateToBR(activeExam.registration_start_date) : "Conforme edital"} até ${activeExam.registration_end_date ? formatDateToBR(activeExam.registration_end_date) : "Conforme edital"}
${activeExam.registration_link ? `- **Link Oficial da Banca**: [Acessar Página do Concurso](${activeExam.registration_link})` : ""}

#### 🚀 Recomendações Táticas KiA
${isEncerrado
  ? "1. Utilize as provas anteriores deste certame histórico para testar seu nível com resolução comentada.\n2. Mapeie o perfil de cobrança da banca para os próximos certames da carreira."
  : "1. Faça ao menos 1 simulado completo a cada 7 dias simulando exatamente o horário de prova.\n2. Não estude matérias novas a menos de 10 dias da prova; concentre-se em refazer seus cadernos de erros."}
`.trim();
    }

    return `
### 📅 Calendário de Concursos

Para conferir datas exatas de provas e inscrições, selecione um **Concurso Foco** no menu lateral ou acesse a aba **Raio-X do Edital**.
Lembre-se: em certames com status "Previsto", não há datas oficiais de prova. O concurseiro profissional estuda o núcleo básico com antecedência!
`.trim();
  }

  // 6. Vagas e Remuneração
  if (
    query.includes("vaga") ||
    query.includes("salário") ||
    query.includes("remuneração") ||
    query.includes("benefício") ||
    query.includes("cota")
  ) {
    if (activeExam) {
      const salaryFormatted = activeExam.salary
        ? `R$ ${activeExam.salary.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : "A definir no edital";

      return `
### 💰 Vagas e Remuneração — ${activeExam.title}

- **Cargo Alvo**: ${activeExam.role}
- **Remuneração Inicial**: **${salaryFormatted}** (+ benefícios do órgão, como auxílio-alimentação e plano de saúde)
- **Vagas Imediatas**: **${activeExam.vacancies || "Conforme edital"} vagas**
- **Cadastro Reserva**: ${activeExam.vacancies_reserve ?? "Previsto em edital"}
- **Escolaridade Exigida**: Nível ${activeExam.education_level.toUpperCase()}
- **Link Oficial para Inscrição**: [Página Oficial da Banca](${activeExam.registration_link})

> **💡 Dica:** Órgãos federais e estaduais historicamente nomeiam muito além do número de vagas imediatas ao longo da validade de 2 anos do certame. Mantenha o foco em ficar no cadastro reserva inicial!
`.trim();
    }
  }

  // 7. Redação Discursiva
  if (
    query.includes("redação") ||
    query.includes("discursiva") ||
    query.includes("texto") ||
    query.includes("dissertação")
  ) {
    return `
### ✍️ Guia Prático de Redação Discursiva Nota 10

A prova discursiva elimina centenas de candidatos bem posicionados na prova objetiva. Siga este esqueleto estrutural de 30 linhas:

#### 1. Introdução (5 a 6 linhas)
- **Contextualização**: Apresente o tema proposto com vocabulário técnico e formal.
- **Tese Principal**: Posicione-se com clareza.
- **Roteiro Temático**: Mencione de forma sintética os 2 ou 3 tópicos exigidos no comando da banca.

#### 2. Desenvolvimento 1 (8 a 9 linhas)
- Responda pontualmente e em profundidade ao primeiro tópico exigido pelo espelho de correção da banca.
- Traga fundamentação jurídica (artigo de lei, súmula) ou dados estatísticos concretos.

#### 3. Desenvolvimento 2 (8 a 9 linhas)
- Responda ao segundo tópico conectando-o harmonicamente ao primeiro usando conectivos adequados (*'Ademais', 'Outrossim', 'Nesse diapasão'*).

#### 4. Conclusão Propositiva (5 a 6 linhas)
- Retome a tese central e apresente uma solução ou síntese alinhada aos preceitos constitucionais e éticos da Administração Pública.

> **⚠️ Atenção:** O examinador corrige por um espelho de tópicos (checklist de pontuação). Responda a cada tópico explicitamente no texto para garantir a pontuação integral!
`.trim();
  }

  // 8. Revisão Espaçada / Flashcards / SM-2
  if (
    query.includes("revisão") ||
    query.includes("flashcard") ||
    query.includes("esquecimento") ||
    query.includes("sm-2") ||
    query.includes("memorizar")
  ) {
    return `
### 🧠 Como Funciona a Revisão Espaçada (Algoritmo SM-2)

O cérebro humano descarta naturalmente cerca de 70% das informações lidas após 48 horas se não houver reforço sináptico (a famosa **Curva do Esquecimento de Hermann Ebbinghaus**).

#### O Ciclo de Repetição Ativa KiEstudos
1. **D+1 (24 horas após o estudo)**: Revisão relâmpago de 10 minutos com flashcards para consolidar a memória recente.
2. **D+7 (1 semana após)**: Resolução de 10 a 15 questões sobre o tópico para transferir o conhecimento para a memória de médio prazo.
3. **D+30 (1 mês após)**: Simulado cumulativo com questões mistas para fixação permanente na memória de longo prazo.

#### Como Usar no KiEstudos
Acesse o menu **Flashcards** no painel lateral. Ao virar o card, avalie honestamente sua facilidade: nosso algoritmo ajusta os intervalos automaticamente para que você só gaste tempo revisando o que está prestes a esquecer!
`.trim();
  }

  // Resposta padrão contextualizada e acolhedora
  return `
### Olá! Sou o KiA, seu Tutor de Inteligência Artificial 🎓

Estou conectado aos dados do seu concurso foco: **${contestName}** (${roleName} • ${boardName}).

Como posso acelerar sua aprovação hoje? Você pode me perguntar:
- *"Como organizar meu ciclo de estudos semanal?"*
- *"Quais matérias têm maior peso na banca ${boardName}?"*
- *"Como funciona a penalização de chutes nesta prova?"*
- *"Quais são as principais armadilhas da banca ${boardName}?"*
- *"Como estruturar uma redação discursiva nota máxima?"*

Digite sua dúvida ou selecione uma das sugestões rápidas acima!
`.trim();
}

// =============================================================================
// Gemini 2.5 Flash REST Client
// =============================================================================

async function callGeminiAssistant(
  message: string,
  history: ChatMessage[],
  activeExam: ConcursoExam | null | undefined,
  syllabusSummary: AISyllabusSummary | null | undefined,
  apiKey: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // Assemble system instruction with active contest context
  const contestInfo = activeExam
    ? `
DADOS DO CONCURSO ATIVO DO ALUNO:
- Concurso: ${activeExam.title} (${activeExam.institution})
- Cargo: ${activeExam.role}
- Banca Organizadora: ${activeExam.exam_board || "Não informada"}
- Situação do Edital: ${activeExam.status}
- Data da Prova: ${activeExam.exam_date ? formatDateToBR(activeExam.exam_date) : "Sem edital publicado / A definir"}
- Vagas: ${activeExam.vacancies} imediatas
- Salário Inicial: R$ ${activeExam.salary ?? "A definir"}
- Disciplinas Principais: ${syllabusSummary?.programmaticContent?.map((d) => d.discipline).join(", ") || "Conhecimentos Básicos e Específicos"}
`.trim()
    : "O aluno ainda não selecionou um Concurso Foco específico. Responda orientando para as principais bancas e métodos gerais de estudo.";

  const systemPrompt = `
Você é o KiA, o Tutor de Inteligência Artificial da plataforma KiEstudos.
Você é um mentor de alto desempenho especialista em concursos públicos brasileiros, metodologia de estudos (ciclo de estudos, repetição espaçada SM-2, resolução tática de questões) e nas principais bancas examinadoras (Cebraspe, FGV, FCC, Vunesp, Cesgranrio).

${contestInfo}

DIRETRIZES DE RESPOSTA:
1. Responda em português brasileiro de forma técnica, empática, motivadora e estruturada.
2. Utilize formatação Markdown rica (títulos ##, listas organizadas, destaques em negrito e blocos de citação).
3. Se o edital do concurso estiver como 'previsto' ou sem data de prova, NUNCA invente datas ou prazos fictícios; esclareça que o edital não foi lançado e recomende o estudo pré-edital do núcleo comum.
4. Forneça conselhos táticos específicos para o estilo da banca examinadora indicada.
`.trim();

  // Convert conversation history into Gemini format
  const formattedContents = [
    ...history.slice(-8).map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    })),
    {
      role: "user",
      parts: [{ text: message }],
    },
  ];

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
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: formattedContents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gemini API HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText || typeof generatedText !== "string" || generatedText.trim().length === 0) {
      throw new Error("Empty candidate response from Gemini API");
    }

    return generatedText.trim();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// =============================================================================
// Main Service Entrypoint: sendKiAMessage
// =============================================================================

/**
 * Sends a message to the KiA AI Assistant.
 * Uses Gemini 2.5 Flash if VITE_GEMINI_API_KEY is present; otherwise falls back
 * immediately to the rich deterministic offline engine with 100% reliability.
 */
export async function sendKiAMessage(params: SendKiAMessageParams): Promise<KiAResponse> {
  const { message, history = [], activeExam, syllabusSummary } = params;
  const messageId = `kia_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  // 1. Attempt Gemini 2.5 Flash if API Key is available
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (apiKey && typeof apiKey === "string" && apiKey.trim().length > 0) {
    try {
      const responseText = await callGeminiAssistant(
        message,
        history,
        activeExam,
        syllabusSummary,
        apiKey.trim()
      );

      return {
        id: messageId,
        text: responseText,
        source: "gemini_ai",
        timestamp,
      };
    } catch (geminiError) {
      console.warn(
        "[kiaAssistantService] Gemini 2.5 Flash request failed. Falling back to deterministic engine.",
        geminiError
      );
    }
  }

  // 2. Deterministic Engine Fallback (guaranteed 100% availability)
  const fallbackText = generateDeterministicKiAResponse(message, activeExam, syllabusSummary);

  return {
    id: messageId,
    text: fallbackText,
    source: "deterministic_engine",
    timestamp,
  };
}
