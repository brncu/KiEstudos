import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { saveSimuladoAttempt, DISCIPLINE_MAPPING } from "@/lib/simulado";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Clock,
  Flag,
  RotateCcw,
  Trophy,
  Check,
  X,
  ArrowRight,
  HelpCircle,
  Eye,
} from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { cn } from "@/lib/utils";

export type QuestoesSearch = {
  mode?: string | undefined;
  simulado?: string | undefined;
  carreira?: string | undefined;
  banca?: string | undefined;
  disciplina?: string | undefined;
  qtd?: number | undefined;
  tempo?: number | undefined;
  tipo_questao?: string | undefined;
  modo_tempo?: string | undefined;
};

export const Route = createFileRoute("/questoes")({
  validateSearch: (search: Record<string, unknown>): QuestoesSearch => ({
    mode: typeof search["mode"] === "string" ? search["mode"] : undefined,
    simulado: typeof search["simulado"] === "string" ? search["simulado"] : undefined,
    carreira: typeof search["carreira"] === "string" ? search["carreira"] : undefined,
    banca: typeof search["banca"] === "string" ? search["banca"] : undefined,
    disciplina: typeof search["disciplina"] === "string" ? search["disciplina"] : undefined,
    qtd:
      typeof search["qtd"] === "number"
        ? search["qtd"]
        : typeof search["qtd"] === "string"
          ? parseInt(search["qtd"], 10)
          : undefined,
    tempo:
      typeof search["tempo"] === "number"
        ? search["tempo"]
        : typeof search["tempo"] === "string"
          ? parseInt(search["tempo"], 10)
          : undefined,
    tipo_questao: typeof search["tipo_questao"] === "string" ? search["tipo_questao"] : undefined,
    modo_tempo: typeof search["modo_tempo"] === "string" ? search["modo_tempo"] : undefined,
  }),
  component: QuestoesPage,
});

/**
 * Pure helper that normalizes diverse options shapes (dicts, arrays, HuggingFace choices, stringified JSON)
 * into standardized uppercase letter keys (A, B, C, D) and strictly excludes any corrupted "raw"/"RAW" entries.
 */
export function normalizeOptions(options: unknown): Record<string, string> {
  if (!options) return {};

  let parsed: unknown = options;
  if (typeof options === "string") {
    try {
      parsed = JSON.parse(options);
    } catch {
      return {};
    }
  }

  if (typeof parsed !== "object" || parsed === null) return {};

  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

  // Case 1: Corrupted scraped options: {"raw": "Not provided"} or {"RAW": "Not provided"}
  const obj = parsed as Record<string, unknown>;
  const rawVal = obj["raw"] ?? obj["RAW"];
  if (typeof rawVal === "string" && rawVal.toLowerCase().includes("not provided")) {
    return {};
  }

  // Case 2: Array of strings or objects: ["A) ...", "B) ..."] or ["Opção 1", "Opção 2"]
  if (Array.isArray(parsed)) {
    const result: Record<string, string> = {};
    parsed.forEach((opt: unknown, idx: number) => {
      if (typeof opt === "string") {
        const trimmed = opt.trim();
        const match = trimmed.match(/^\(?([A-Za-z0-9])[\)\.\:\-\s]\s*(.*)$/);
        if (match && match[1]) {
          result[match[1].toUpperCase()] = (match[2] || trimmed).trim();
        } else {
          result[letters[idx] || String(idx)] = trimmed;
        }
      } else if (opt && typeof opt === "object") {
        const itemObj = opt as Record<string, unknown>;
        const text = itemObj["text"] ?? itemObj["description"] ?? itemObj["value"];
        const label = itemObj["label"] ?? itemObj["key"] ?? letters[idx] ?? String(idx);
        if (text !== undefined && text !== null) {
          result[String(label).trim().toUpperCase()] = String(text).trim();
        }
      }
    });
    return result;
  }

  // Case 3: HuggingFace Choices format: { text: [...], label: [...] }
  const objText = obj["text"];
  const objLabel = obj["label"];
  if (Array.isArray(objText) && Array.isArray(objLabel)) {
    const result: Record<string, string> = {};
    objLabel.forEach((lbl: unknown, idx: number) => {
      const textItem = objText[idx];
      if (lbl !== undefined && lbl !== null && textItem !== undefined && textItem !== null) {
        result[String(lbl).trim().toUpperCase()] = String(textItem).trim();
      }
    });
    return result;
  }

  // Case 4: Standard dictionary { A: "...", B: "..." }
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const trimmedKey = key.trim();
    if (trimmedKey.toLowerCase() === "raw") continue; // Strictly filter out raw/RAW
    if (value === null || value === undefined) continue;

    const m = trimmedKey.match(/^\(?([A-Za-z0-9])[\)\.\:\-]?$/);
    const cleanKey = (m && m[1] ? m[1] : trimmedKey).toUpperCase();
    if (cleanKey === "RAW") continue;

    result[cleanKey] = typeof value === "string" ? value.trim() : JSON.stringify(value);
  }

  return result;
}

const FALLBACK_QUESTIONS = [
  {
    id: "demo-1",
    discipline: "Direito Constitucional",
    topic: "Direitos e Garantias Fundamentais",
    statement:
      "Acerca dos direitos e garantias fundamentais previstos na Constituição Federal de 1988, assinale a opção correta:",
    options: {
      A: "A casa é asilo inviolável do indivíduo, ninguém nela podendo penetrar sem consentimento do morador, salvo em caso de flagrante delito ou desastre, ou para prestar socorro, ou, durante o dia, por determinação judicial.",
      B: "É plena a liberdade de associação para quaisquer fins, inclusive de caráter paramilitar.",
      C: "A lei penal produzirá efeitos retroativos para alcançar condutas pretéritas, mesmo se não beneficiar o réu.",
      D: "A criação de associações independe de autorização, sendo permitida, contudo, a interferência estatal em seu funcionamento.",
    },
    correct_answer: "A",
    explanation:
      "Art. 5º, XI, CF/88: 'a casa é asilo inviolável do indivíduo, ninguém nela podendo penetrar sem consentimento do morador, salvo em caso de flagrante delito ou desastre, ou para prestar socorro, ou, durante o dia, por determinação judicial'. As demais alternativas contrariam frontalmente o texto constitucional.",
  },
  {
    id: "demo-2",
    discipline: "Direito Administrativo",
    topic: "Regime Jurídico Administrativo",
    statement:
      "Segundo o princípio da legalidade administrativa consagrado na CF/88, o administrador público:",
    options: {
      A: "Pode fazer tudo aquilo que a lei não proíbe expressamente.",
      B: "Só pode agir nos termos estritos em que a lei expressamente autorize ou determine.",
      C: "Possui ampla discricionariedade para revogar atos vinculados sem respaldo legal.",
      D: "Fica dispensado de observar a impessoalidade e a moralidade em situações de conveniência política.",
    },
    correct_answer: "B",
    explanation:
      "Na Administração Pública vigora o princípio da legalidade estrita (critério de subordinação à lei): enquanto aos particulares é lícito fazer tudo o que a lei não proíbe (art. 5º, II), o agente público só pode agir quando houver expressa autorização ou imposição legal (art. 37, caput).",
  },
  {
    id: "demo-3",
    discipline: "Língua Portuguesa",
    topic: "Concordância Verbal e Sintaxe",
    statement:
      "Assinale a alternativa em que a concordância verbal está em estrita conformidade com a norma-padrão da língua portuguesa:",
    options: {
      A: "Fazem muitos anos que não se realizavam concursos com tantas vagas na área fiscal.",
      B: "Haviam muitos candidatos inscritos no certame aguardando o início da prova.",
      C: "Devem existir razões suficientes para a interposição de recursos contra o gabarito preliminar.",
      D: "Tratam-se de questões de alta complexidade doutrinária e jurisprudencial.",
    },
    correct_answer: "C",
    explanation:
      "O verbo 'existir' é pessoal e admite sujeito ('razões suficientes'), devendo a locução verbal 'devem existir' flexionar no plural. Em A e B, os verbos 'fazer' (tempo decorrido) e 'haver' (sentido de existir) são impessoais ('Faz muitos anos', 'Havia muitos candidatos'). Em D, 'tratar-se de' com índice de indeterminação do sujeito fica no singular ('Trata-se de questões').",
  },
  {
    id: "demo-4",
    discipline: "Informática & TI",
    topic: "Segurança da Informação",
    statement:
      "No contexto dos pilares clássicos da Segurança da Informação (CID - Confidencialidade, Integridade e Disponibilidade), o atributo de Integridade assegura que:",
    options: {
      A: "Apenas pessoas e processos autorizados tenham conhecimento do teor da informação.",
      B: "A informação e os sistemas estejam acessíveis sempre que requisitados pelos usuários legítimos.",
      C: "A informação não seja modificada, adulterada ou destruída de forma não autorizada ou fraudulenta.",
      D: "O autor de uma mensagem eletrônica não possa repudiar ou negar a autoria do envio.",
    },
    correct_answer: "C",
    explanation:
      "A integridade garante a fidedignidade e exatidão dos dados, impedindo alterações não autorizadas. A confidencialidade protege o segredo/sigilo (opção A), a disponibilidade garante o acesso contínuo (opção B) e a irretratabilidade/não-repúdio previne a recusa de autoria (opção D).",
  },
  {
    id: "demo-5",
    discipline: "Raciocínio Lógico (RLM)",
    topic: "Lógica Sentencial & Equivalências",
    statement:
      "Considere a proposição condicional: 'Se o candidato mantém constância nos estudos, então conquista a aprovação no certame'. Uma proposição logicamente equivalente a ela é:",
    options: {
      A: "Se o candidato não conquista a aprovação no certame, então ele não mantém constância nos estudos.",
      B: "Se o candidato mantém constância nos estudos, então ele não conquista a aprovação.",
      C: "O candidato não mantém constância nos estudos e conquista a aprovação.",
      D: "Se o candidato conquistou a aprovação no certame, então ele necessariamente manteve constância nos estudos.",
    },
    correct_answer: "A",
    explanation:
      "Pela regra fundamental da contraposição lógica, a proposição condicional (P -> Q) equivale à sua contrapositiva (~Q -> ~P). Negando o consequente e o antecedente e invertendo as posições, obtém-se exatamente: 'Se não conquista a aprovação, então não mantém constância'.",
  },
];

function getRelevantFallbackQuestions(disciplinaFilter?: string): typeof FALLBACK_QUESTIONS {
  if (!disciplinaFilter || !disciplinaFilter.trim()) {
    return FALLBACK_QUESTIONS;
  }
  const terms = disciplinaFilter
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (terms.length === 0) return FALLBACK_QUESTIONS;

  const matched = FALLBACK_QUESTIONS.filter((q) =>
    terms.some(
      (term) =>
        q.discipline.toLowerCase().includes(term) ||
        (q.topic && q.topic.toLowerCase().includes(term)),
    ),
  );

  return matched.length > 0 ? matched : FALLBACK_QUESTIONS;
}

export default function QuestoesPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { user } = useAuth();

  const isSimuladoMode = search.mode === "simulado" || Boolean(search.simulado);
  const initialDurationMinutes = search.tempo || (search.qtd ? Math.round(search.qtd * 2) : 60);
  const totalDurationSeconds = initialDurationMinutes * 60;

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filters initialized from URL search params if present
  const [bancaFilter, setBancaFilter] = useState(search.banca ?? "");
  const [disciplinaFilter, setDisciplinaFilter] = useState(search.disciplina ?? "");

  // Resolution State (Practice & Review Mode)
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Simulado Mode Timer State
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(totalDurationSeconds);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Simulado Answers Mapping: questionId -> option key ('A', 'B', etc.)
  const [userSimuladoAnswers, setUserSimuladoAnswers] = useState<Record<string, string>>({});

  // Simulado Completion Modals
  const [showConfirmFinishModal, setShowConfirmFinishModal] = useState(false);
  const [isSubmittingSimulado, setIsSubmittingSimulado] = useState(false);
  const [isSimuladoFinished, setIsSimuladoFinished] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [simuladoResult, setSimuladoResult] = useState<{
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
    scoreRaw: number;
    scoreNet: number;
    accuracy: number;
    scoringRule: "padrao" | "cespe_liquida";
    timeSpentSeconds: number;
  } | null>(null);

  // Reset timer if search param changes
  useEffect(() => {
    setTimeRemainingSeconds(totalDurationSeconds);
    setUserSimuladoAnswers({});
    setIsSimuladoFinished(false);
    setIsReviewMode(false);
    setSimuladoResult(null);
  }, [search.tempo, search.simulado]);

  // Countdown Timer Interval
  useEffect(() => {
    if (!isSimuladoMode || isSimuladoFinished || isTimerPaused) return;

    const interval = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimuladoMode, isSimuladoFinished, isTimerPaused]);

  // Auto-finish on timer expiry
  useEffect(() => {
    if (
      isSimuladoMode &&
      !isSimuladoFinished &&
      timeRemainingSeconds === 0 &&
      questions.length > 0 &&
      !isSubmittingSimulado
    ) {
      toast.warning("Tempo Esgotado!", {
        description: "O tempo estipulado encerrou. O simulado foi concluído automaticamente.",
      });
      handleConfirmFinish();
    }
  }, [timeRemainingSeconds, isSimuladoMode, isSimuladoFinished, questions.length, isSubmittingSimulado]);

  useEffect(() => {
    fetchQuestions();
  }, [bancaFilter, disciplinaFilter, search.qtd, search.mode]);

  async function fetchQuestions() {
    setLoading(true);
    const limit = search.qtd && search.qtd > 0 ? Math.min(search.qtd, 150) : 20;
    let query = supabase
      .from("question_bank" as any)
      .select("*")
      .not("options->>raw", "eq", "Not provided")
      .not("correct_answer", "eq", "N/A")
      .limit(limit);

    // Multi-discipline support with fast index mapping
    if (disciplinaFilter && disciplinaFilter.trim()) {
      const parts = disciplinaFilter
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);

      const mappedDbDisciplines = new Set<string>();
      for (const p of parts) {
        if (DISCIPLINE_MAPPING[p]) {
          DISCIPLINE_MAPPING[p].forEach((db) => mappedDbDisciplines.add(db));
        } else {
          mappedDbDisciplines.add(p);
        }
      }

      if (mappedDbDisciplines.size > 0) {
        query = query.in("discipline", Array.from(mappedDbDisciplines));
      }
    }

    query = query.order("id", { ascending: true });

    try {
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        setQuestions(data);
      } else {
        const fallbacks = getRelevantFallbackQuestions(disciplinaFilter);
        setQuestions(fallbacks);
      }
    } catch {
      const fallbacks = getRelevantFallbackQuestions(disciplinaFilter);
      setQuestions(fallbacks);
    }

    setCurrentIndex(0);
    setSelectedOption(null);
    setShowAnswer(false);
    setShowExplanation(false);
    setLoading(false);
  }

  const currentQ = questions[currentIndex];
  const normalizedOptions = currentQ ? normalizeOptions(currentQ.options) : {};
  const optionEntries = Object.entries(normalizedOptions);

  const effectiveSelectedOption =
    isSimuladoMode && !isReviewMode
      ? (currentQ ? userSimuladoAnswers[currentQ.id] || null : null)
      : selectedOption;

  const answeredCount = useMemo(() => {
    return questions.reduce((acc, q) => {
      return userSimuladoAnswers[q.id] ? acc + 1 : acc;
    }, 0);
  }, [questions, userSimuladoAnswers]);

  const answeredPercent =
    questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  function formatTimer(totalSecs: number) {
    const s = Math.max(0, totalSecs);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  function handleSelect(key: string) {
    if (isSimuladoMode && !isReviewMode) {
      if (!currentQ) return;
      setUserSimuladoAnswers((prev) => {
        const next = { ...prev };
        if (next[currentQ.id] === key) {
          delete next[currentQ.id];
        } else {
          next[currentQ.id] = key;
        }
        return next;
      });
      return;
    }

    if (showAnswer) return;
    setSelectedOption(key);
    setShowAnswer(true);
    setShowExplanation(true);
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (isReviewMode) {
        const nextQ = questions[nextIdx];
        setSelectedOption(userSimuladoAnswers[nextQ?.id] || null);
        setShowAnswer(true);
        setShowExplanation(true);
      } else if (!isSimuladoMode) {
        setSelectedOption(null);
        setShowAnswer(false);
        setShowExplanation(false);
      }
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      if (isReviewMode) {
        const prevQ = questions[prevIdx];
        setSelectedOption(userSimuladoAnswers[prevQ?.id] || null);
        setShowAnswer(true);
        setShowExplanation(true);
      } else if (!isSimuladoMode) {
        setSelectedOption(null);
        setShowAnswer(false);
        setShowExplanation(false);
      }
    }
  }

  function jumpToQuestion(idx: number) {
    if (idx >= 0 && idx < questions.length) {
      setCurrentIndex(idx);
      if (isReviewMode) {
        const targetQ = questions[idx];
        setSelectedOption(userSimuladoAnswers[targetQ?.id] || null);
        setShowAnswer(true);
        setShowExplanation(true);
      } else if (!isSimuladoMode) {
        setSelectedOption(null);
        setShowAnswer(false);
        setShowExplanation(false);
      }
    }
  }

  async function handleConfirmFinish() {
    setIsSubmittingSimulado(true);
    setShowConfirmFinishModal(false);

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const answersSummary = questions.map((q) => {
      const selected = userSimuladoAnswers[q.id];
      const hasAnswered = selected !== undefined && selected !== null && selected !== "";
      const isCorrect =
        hasAnswered &&
        q.correct_answer &&
        selected.toUpperCase() === q.correct_answer.toUpperCase();

      if (!hasAnswered) {
        unansweredCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      return {
        questionId: q.id,
        discipline: q.discipline || "Geral",
        topic: q.topic || "Geral",
        selectedAnswer: selected || "BRANCO",
        correctAnswer: q.correct_answer || "A",
        isCorrect: Boolean(isCorrect),
      };
    });

    const isCespe =
      (search.banca && search.banca.toLowerCase().includes("cebraspe")) ||
      (search.banca && search.banca.toLowerCase().includes("cespe")) ||
      (search.simulado && search.simulado.toLowerCase().includes("cespe")) ||
      search.tipo_questao === "certo_errado";

    const scoringRule: "padrao" | "cespe_liquida" = isCespe ? "cespe_liquida" : "padrao";
    const scoreNet = isCespe
      ? Math.max(0, correctCount - wrongCount)
      : correctCount;
    const totalQ = questions.length;
    const scoreRaw = totalQ > 0 ? (correctCount / totalQ) * 100 : 0;
    const accuracy = totalQ > 0 ? (correctCount / totalQ) * 100 : 0;
    const timeSpent = Math.max(1, totalDurationSeconds - timeRemainingSeconds);

    const result = {
      correctCount,
      wrongCount,
      unansweredCount,
      scoreRaw: parseFloat(scoreRaw.toFixed(1)),
      scoreNet: parseFloat(scoreNet.toFixed(1)),
      accuracy: parseFloat(accuracy.toFixed(1)),
      scoringRule,
      timeSpentSeconds: timeSpent,
    };

    setSimuladoResult(result);
    setIsSimuladoFinished(true);

    try {
      await saveSimuladoAttempt({
        userId: user?.id,
        simuladoId: search.simulado,
        title: search.simulado || "Simulado Personalizado",
        banca: search.banca || "Cebraspe",
        carreira: search.carreira || "Geral",
        totalQuestions: totalQ,
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        unanswered: unansweredCount,
        scoreRaw: result.scoreRaw,
        scoreNet: result.scoreNet,
        accuracy: result.accuracy,
        durationMinutes: initialDurationMinutes,
        timeSpentSeconds: timeSpent,
        scoringRule,
        answersSummary,
      });

      toast.success("Simulado Concluído!", {
        description: `Nota registrada e sincronizada com sucesso.`,
      });
    } catch (err) {
      console.error("[questoes.tsx] Error saving simulado attempt:", err);
    } finally {
      setIsSubmittingSimulado(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020813] text-slate-50 flex">
      {/* Sidebar Navigation */}
      <AppNav />

      <div className="flex-1 flex flex-col lg:flex-row h-[100dvh] lg:pl-72 pt-16 lg:pt-0 overflow-hidden">
        {/* Left Column: Filters */}
        <aside className="w-full md:w-80 bg-[#0a1122] border-r border-white/5 p-6 flex flex-col gap-6 overflow-y-auto">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Filter size={20} className="text-emerald-500" />
              Filtros Avançados
            </h2>
            <p className="text-sm text-slate-400 mt-1">Refine seu banco de questões.</p>
          </div>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Banca
              </label>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Ex: CESPE, FGV"
                  value={bancaFilter}
                  onChange={(e) => setBancaFilter(e.target.value)}
                  className="w-full bg-[#020813] border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Disciplina
              </label>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Ex: Direito Constitucional"
                  value={disciplinaFilter}
                  onChange={(e) => setDisciplinaFilter(e.target.value)}
                  className="w-full bg-[#020813] border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              onClick={fetchQuestions}
              className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-[#020813] font-bold py-3 rounded-xl transition-colors cursor-pointer"
            >
              Aplicar Filtros
            </button>
          </div>
        </aside>

        {/* Right Column: Question Resolution */}
        <main className="flex-1 flex flex-col p-6 lg:p-12 overflow-y-auto">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : !currentQ ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <AlertCircle size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium text-white">Nenhuma questão encontrada.</p>
              <p className="text-sm mt-1">Tente ajustar os filtros ao lado.</p>
            </div>
          ) : (
            <div className="max-w-4xl w-full mx-auto flex flex-col gap-8">
              {/* Simulation Header HUD */}
              {isSimuladoMode && (
                <div className="sticky top-0 z-20 -mt-2 p-5 rounded-2xl bg-[#0a1122]/95 backdrop-blur-md border border-cyan-500/30 shadow-xl shadow-cyan-950/20 flex flex-col gap-4">
                  {/* Top Bar: Title & Status & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0 border border-cyan-500/30">
                        {isReviewMode ? <CheckCircle2 size={20} className="text-emerald-400" /> : <Sparkles size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                              isReviewMode
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
                            )}
                          >
                            {isReviewMode ? "Modo Revisão • Gabarito Comentado" : "Simulado Oficial em Andamento"}
                          </span>
                          {search.banca && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/5">
                              {search.banca}
                            </span>
                          )}
                          {search.carreira && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/5 uppercase">
                              {search.carreira}
                            </span>
                          )}
                        </div>
                        <h1 className="text-base sm:text-lg font-bold text-white mt-1">
                          {search.simulado || "Caderno de Simulado Oficial"}
                        </h1>
                      </div>
                    </div>

                    {/* Timer & Finish/Review CTA */}
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      {!isReviewMode ? (
                        <>
                          <div
                            className={cn(
                              "flex items-center gap-2 px-3.5 py-2 rounded-xl border font-mono font-bold text-sm tracking-wider shadow-inner",
                              timeRemainingSeconds < 300
                                ? "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse"
                                : "bg-slate-900 border-cyan-500/30 text-cyan-300",
                            )}
                            title="Tempo Restante"
                          >
                            <Clock size={16} className={timeRemainingSeconds < 300 ? "text-rose-400" : "text-cyan-400"} />
                            <span>{formatTimer(timeRemainingSeconds)}</span>
                          </div>
                          <button
                            onClick={() => setShowConfirmFinishModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                          >
                            <Flag size={16} />
                            Finalizar Simulado
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsSimuladoFinished(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                          >
                            <Trophy size={14} className="text-amber-400" />
                            Ver Resultado
                          </button>
                          <button
                            onClick={() => navigate({ to: "/simulado" })}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold border border-cyan-500/40 transition-colors cursor-pointer"
                          >
                            Voltar aos Simulados
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar & Counter */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span>
                        Respondidas: <strong className="text-white">{answeredCount}</strong> de <strong className="text-white">{questions.length}</strong> ({answeredPercent}%)
                      </span>
                      <span>
                        Questão atual: <strong className="text-cyan-400">{currentIndex + 1}</strong> de {questions.length}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300 rounded-full"
                        style={{ width: `${answeredPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Question Navigator Strip (Pills) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin scrollbar-thumb-white/10">
                    {questions.map((q, idx) => {
                      const isCurrent = idx === currentIndex;
                      const hasAnswer = userSimuladoAnswers[q.id];

                      let pillBg = "bg-slate-900 text-slate-400 border-white/5 hover:border-slate-500";
                      if (isReviewMode) {
                        const isCorrect =
                          hasAnswer &&
                          q.correct_answer &&
                          hasAnswer.toUpperCase() === q.correct_answer.toUpperCase();
                        if (isCorrect) {
                          pillBg = "bg-emerald-500/20 text-emerald-300 border-emerald-500/50";
                        } else if (hasAnswer) {
                          pillBg = "bg-red-500/20 text-red-300 border-red-500/50";
                        } else {
                          pillBg = "bg-slate-800 text-slate-500 border-dashed border-white/10";
                        }
                      } else if (hasAnswer) {
                        pillBg = "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
                      }

                      return (
                        <button
                          key={q.id || idx}
                          onClick={() => jumpToQuestion(idx)}
                          className={cn(
                            "w-8 h-8 rounded-lg text-xs font-bold shrink-0 border flex items-center justify-center transition-all cursor-pointer",
                            pillBg,
                            isCurrent && "ring-2 ring-cyan-400 border-cyan-400 text-white scale-105 shadow-md shadow-cyan-500/20",
                          )}
                          title={`Ir para questão ${idx + 1}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Question Meta */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold tracking-wider uppercase">
                <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-emerald-400">
                  {currentQ.topic || "Tópico Geral"}
                </span>
                <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-blue-400">
                  {"2024"}
                </span>
                <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-slate-300">
                  {search.banca || "Simulado"}
                </span>
                <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-slate-300">
                  {currentQ.discipline || "Disciplina Geral"}
                </span>
              </div>

              {/* Enunciado */}
              <div className="text-lg md:text-xl leading-relaxed text-slate-200 font-medium whitespace-pre-line">
                {currentQ.statement}
              </div>

              {/* Alternativas */}
              {optionEntries.length === 0 ? (
                <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex flex-col gap-3">
                  <div className="font-bold flex items-center gap-2 text-base">
                    <AlertCircle size={20} />
                    Questão sem alternativas de múltipla escolha
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Esta questão é discursiva ou não possui alternativas estruturadas no banco de dados.
                  </p>
                  {!showAnswer && (
                    <button
                      onClick={() => {
                        setShowAnswer(true);
                        setShowExplanation(true);
                      }}
                      className="mt-2 self-start px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Revelar Gabarito e Justificativa
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3 mt-4" data-testid="options-list">
                  {optionEntries.map(([key, text]) => {
                    const isSelected = effectiveSelectedOption === key;
                    const isReviewOrPractice = !isSimuladoMode || isReviewMode;
                    const isCorrectAnswer =
                      isReviewOrPractice &&
                      showAnswer &&
                      currentQ.correct_answer &&
                      key.toUpperCase() === currentQ.correct_answer.toUpperCase();
                    const isWrongSelected =
                      isReviewOrPractice &&
                      showAnswer &&
                      isSelected &&
                      currentQ.correct_answer &&
                      key.toUpperCase() !== currentQ.correct_answer.toUpperCase();

                    return (
                      <button
                        key={key}
                        onClick={() => handleSelect(key)}
                        disabled={isReviewMode || (!isSimuladoMode && showAnswer)}
                        className={cn(
                          "text-left p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 group cursor-pointer",
                          (isReviewMode || (!isSimuladoMode && showAnswer)) && "cursor-default",

                          // Default unselected state
                          !isSelected &&
                            !isCorrectAnswer &&
                            "bg-[#0a1122] border-white/5 hover:border-cyan-500/40 hover:bg-white/[0.02]",

                          // Selected in Simulado Mode (no spoilers)
                          isSelected &&
                            isSimuladoMode &&
                            !isReviewMode &&
                            "bg-cyan-500/15 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-white",

                          // Selected state before evaluation in normal mode
                          isSelected &&
                            !isSimuladoMode &&
                            !showAnswer &&
                            "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]",

                          // Right Answer Highlight
                          isCorrectAnswer &&
                            "bg-emerald-500/20 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.15)]",

                          // Wrong Selected Highlight
                          isWrongSelected && "bg-red-500/20 border-red-500 text-white",
                        )}
                      >
                        <div
                          className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center font-bold text-sm transition-colors",
                            isCorrectAnswer
                              ? "bg-emerald-500 border-emerald-500 text-[#020813]"
                              : isWrongSelected
                                ? "bg-red-500 border-red-500 text-white"
                                : isSelected && isSimuladoMode && !isReviewMode
                                  ? "bg-cyan-500 border-cyan-500 text-[#020813]"
                                  : isSelected
                                    ? "bg-emerald-500 border-emerald-500 text-[#020813]"
                                    : "border-slate-600 text-slate-400 group-hover:border-slate-400",
                          )}
                        >
                          {isCorrectAnswer ? (
                            <CheckCircle2 size={18} />
                          ) : isWrongSelected ? (
                            <XCircle size={18} />
                          ) : (
                            key.toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 mt-1 font-medium leading-relaxed">{text}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Explicação / Justificativa revelada */}
              {(!isSimuladoMode || isReviewMode) && showExplanation && (
                <div
                  data-testid="explanation-container"
                  className={cn(
                    "mt-6 p-6 rounded-2xl border transition-all animate-in fade-in duration-300",
                    effectiveSelectedOption &&
                      currentQ.correct_answer &&
                      effectiveSelectedOption.toUpperCase() === currentQ.correct_answer.toUpperCase()
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-blue-500/10 border-blue-500/30",
                  )}
                >
                  <div className="flex items-center gap-2 font-bold mb-3 text-sm">
                    <Sparkles
                      size={18}
                      className={
                        effectiveSelectedOption &&
                        currentQ.correct_answer &&
                        effectiveSelectedOption.toUpperCase() === currentQ.correct_answer.toUpperCase()
                          ? "text-emerald-400"
                          : "text-blue-400"
                      }
                    />
                    <span
                      className={
                        effectiveSelectedOption &&
                        currentQ.correct_answer &&
                        effectiveSelectedOption.toUpperCase() === currentQ.correct_answer.toUpperCase()
                          ? "text-emerald-400"
                          : "text-blue-400"
                      }
                    >
                      {effectiveSelectedOption &&
                      currentQ.correct_answer &&
                      effectiveSelectedOption.toUpperCase() === currentQ.correct_answer.toUpperCase()
                        ? "Você acertou!"
                        : "Resposta Comentada"}
                    </span>
                    {currentQ.correct_answer && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 font-mono text-slate-300 ml-auto">
                        Gabarito Oficial: {currentQ.correct_answer.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div
                    data-testid="question-explanation"
                    className="text-sm md:text-base leading-relaxed text-slate-200 whitespace-pre-wrap"
                  >
                    {currentQ.explanation ? (
                      currentQ.explanation
                    ) : (
                      <span className="text-slate-400 italic">
                        Gabarito oficial: alternativa {currentQ.correct_answer?.toUpperCase() || "N/A"}. Sem comentário cadastrado para esta questão.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Questão Anterior"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm font-bold text-slate-400 tracking-wider">
                    {currentIndex + 1} / {questions.length}
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === questions.length - 1}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Próxima Questão"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {isSimuladoMode && !isReviewMode ? (
                    <>
                      <button
                        onClick={handleNext}
                        disabled={currentIndex === questions.length - 1}
                        className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Próxima Questão
                        <ChevronRight size={16} />
                      </button>
                      <button
                        onClick={() => setShowConfirmFinishModal(true)}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Flag size={16} />
                        Finalizar Simulado
                      </button>
                    </>
                  ) : !showAnswer ? (
                    <span className="text-xs text-slate-500 italic hidden sm:inline-block">
                      Selecione uma alternativa para responder imediatamente
                    </span>
                  ) : (
                    <button
                      onClick={handleNext}
                      disabled={currentIndex === questions.length - 1}
                      className="px-8 py-3 rounded-xl bg-white text-[#020813] font-extrabold hover:bg-slate-200 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próxima
                      <ChevronRight size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* Modal 1: Confirmação de Finalização do Simulado */}
      {/* ========================================================================= */}
      {showConfirmFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0a1122] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Flag size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Finalizar Simulado?</h3>
                <p className="text-xs text-slate-400">Revise seu progresso antes de entregar.</p>
              </div>
            </div>

            {/* Resumo rápido */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#020813] border border-white/5 text-center">
              <div>
                <span className="text-xs text-slate-400 block">Respondidas</span>
                <span className="text-xl font-bold text-emerald-400">
                  {answeredCount} <span className="text-xs text-slate-500">/ {questions.length}</span>
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Em Branco</span>
                <span className="text-xl font-bold text-amber-400">
                  {questions.length - answeredCount}
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-cyan-300">
                <Clock size={14} />
                <span>Tempo restante: <strong>{formatTimer(timeRemainingSeconds)}</strong></span>
              </div>
            </div>

            {questions.length - answeredCount > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-400" />
                <span>
                  Você possui <strong>{questions.length - answeredCount}</strong> questão(ões) em branco. Elas não pontuarão no gabarito final.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmFinishModal(false)}
                disabled={isSubmittingSimulado}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-colors cursor-pointer"
              >
                Continuar Respondendo
              </button>
              <button
                onClick={handleConfirmFinish}
                disabled={isSubmittingSimulado}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingSimulado ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Gravando...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Confirmar e Entregar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal 2: Tela / Modal de Conclusão do Simulado */}
      {/* ========================================================================= */}
      {isSimuladoFinished && simuladoResult && !isReviewMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-[#0a1122] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 relative my-8">
            {/* Header */}
            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-cyan-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-lg shadow-amber-500/10">
                <Trophy size={32} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                Simulado Finalizado com Sucesso
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                {search.simulado || "Simulado KiEstudos Concluído"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {simuladoResult.scoringRule === "cespe_liquida"
                  ? "Critério Cebraspe / CESPE: 1 Erro anula 1 Acerto."
                  : "Pontuação tradicional baseada no total de acertos."}
              </p>
            </div>

            {/* Scorecard Hero */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#020813] to-[#040e24] border border-white/10 flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Aproveitamento Geral
              </span>
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                {simuladoResult.accuracy}%
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                  Pontos Líquidos: {simuladoResult.scoreNet} / {questions.length}
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-white/5 font-medium">
                  {simuladoResult.scoringRule === "cespe_liquida" ? "Fator Líquido Ativo" : "Pontuação Padrão"}
                </span>
              </div>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-[#020813] border border-emerald-500/20">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Acertos</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">
                  {simuladoResult.correctCount}
                </span>
                <span className="text-[10px] text-emerald-400/80 font-medium">questões</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#020813] border border-rose-500/20">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Erros</span>
                <span className="text-2xl font-black text-rose-400 mt-1 block">
                  {simuladoResult.wrongCount}
                </span>
                <span className="text-[10px] text-rose-400/80 font-medium">questões</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#020813] border border-amber-500/20">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Em Branco</span>
                <span className="text-2xl font-black text-amber-400 mt-1 block">
                  {simuladoResult.unansweredCount}
                </span>
                <span className="text-[10px] text-amber-400/80 font-medium">sem marcação</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#020813] border border-cyan-500/20">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Tempo</span>
                <span className="text-xl font-black text-cyan-300 mt-1.5 block font-mono">
                  {formatTimer(simuladoResult.timeSpentSeconds)}
                </span>
                <span className="text-[10px] text-cyan-400/80 font-medium">gasto no total</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setIsReviewMode(true);
                  setCurrentIndex(0);
                  const first = questions[0];
                  if (first) {
                    setSelectedOption(userSimuladoAnswers[first.id] || null);
                    setShowAnswer(true);
                    setShowExplanation(true);
                  }
                }}
                className="w-full sm:flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye size={18} />
                Revisar Gabarito Comentado
              </button>
              <button
                onClick={() => navigate({ to: "/simulado" })}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Voltar aos Simulados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Provider */}
      <Toaster richColors position="top-right" />
    </div>
  );
}
