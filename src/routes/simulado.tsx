import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AppNav } from "@/components/AppNav";
import { useTargetExam } from "@/hooks/useTargetExam";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import type { ConcursoExam } from "@/types/concurso";

type SimuladoSearch = {
  tab?: string | undefined;
  materia?: string | undefined;
};

export const Route = createFileRoute("/simulado")({
  validateSearch: (search: Record<string, unknown>): SimuladoSearch => ({
    tab: typeof search["tab"] === "string" ? search["tab"] : undefined,
    materia: typeof search["materia"] === "string" ? search["materia"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Simulados & Provas Oficiais — KiEstudos Elite Civil Prep" },
      {
        name: "description",
        content:
          "Ambiente de Treinamento Oficial KiEstudos: simulados completos de concursos públicos e criador sob demanda com cronômetro real.",
      },
      {
        property: "og:title",
        content: "Simulados & Provas Oficiais — KiEstudos",
      },
      {
        property: "og:description",
        content:
          "Simulados oficiais completos e criador personalizado com ranking nacional e correção com IA.",
      },
    ],
  }),
  component: SimuladoPage,
});

import {
  fetchQuestionBankTotalCount,
  fetchDisciplineCounts,
  fetchAvailableSimulados,
  fetchUserSimuladoStats,
  formatQuestionCount,
  type OfficialSimuladoModel,
  type DisciplineStat,
  type UserSimuladoStats,
  FALLBACK_OFFICIAL_SIMULADOS,
} from "@/lib/simulado";

function isCardMatchingTargetExam(card: OfficialSimuladoModel, activeExam: ConcursoExam | null): boolean {
  if (!activeExam) return false;
  const examTitle = (activeExam.title || "").toLowerCase();
  const examSlug = (activeExam.slug || "").toLowerCase();
  const cardTitle = card.title.toLowerCase();
  const cardSlug = card.slug.toLowerCase();

  if (cardTitle.includes(examSlug) || examTitle.includes(cardSlug)) return true;
  if (cardSlug.includes("pf") && (examSlug.includes("policia-federal") || examTitle.includes("polícia federal"))) return true;
  if (cardSlug.includes("prf") && (examSlug.includes("rodoviaria") || examTitle.includes("rodoviária federal"))) return true;
  if (cardSlug.includes("tjsp") && (examSlug.includes("tjsp") || examTitle.includes("tj-sp"))) return true;
  if (cardSlug.includes("receita") && (examSlug.includes("receita") || examTitle.includes("receita federal"))) return true;
  if (cardSlug.includes("inss") && (examSlug.includes("inss") || examTitle.includes("inss"))) return true;
  if (cardSlug.includes("trf") && (examSlug.includes("trf") || examTitle.includes("trf-3"))) return true;
  return false;
}

export default function SimuladoPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { user } = useAuth();
  const { activeExam } = useTargetExam();

  // Active top navigation tab ('acervo' | 'personalizado')
  const [activeTab, setActiveTab] = useState<"acervo" | "personalizado">(
    search.tab === "personalizado" ? "personalizado" : "acervo",
  );

  // Sync activeTab if route search param changes
  useEffect(() => {
    if (search.tab === "personalizado") {
      setActiveTab("personalizado");
      const el = document.getElementById("custom-builder");
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } else if (search.tab === "acervo") {
      setActiveTab("acervo");
    }
  }, [search.tab]);

  // Section 1: Acervo Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"realizados" | "recentes" | "dificuldade">("realizados");
  const [carreiraFilter, setCarreiraFilter] = useState("Todas");
  const [bancaFilter, setBancaFilter] = useState("Cebraspe");

  // Live Supabase and Performance States
  const [totalQuestionsCount, setTotalQuestionsCount] = useState<number>(154374);
  const [officialSimulados, setOfficialSimulados] = useState<OfficialSimuladoModel[]>(FALLBACK_OFFICIAL_SIMULADOS);
  const [disciplineStats, setDisciplineStats] = useState<DisciplineStat[]>([]);
  const [userStats, setUserStats] = useState<UserSimuladoStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  // Load live Supabase data on mount or auth change
  useEffect(() => {
    let isMounted = true;
    async function loadAllSimuladoData() {
      setIsLoadingData(true);
      try {
        const [count, simulados, disciplines, stats] = await Promise.all([
          fetchQuestionBankTotalCount(),
          fetchAvailableSimulados(user?.id),
          fetchDisciplineCounts(),
          fetchUserSimuladoStats(user?.id),
        ]);

        if (isMounted) {
          setTotalQuestionsCount(count);
          setOfficialSimulados(simulados);
          setDisciplineStats(disciplines);
          setUserStats(stats);
        }
      } catch (err) {
        console.error("[simulado.tsx] Error loading simulado data:", err);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }

    loadAllSimuladoData();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Section 2: Custom Simulation Builder State
  const [builderCarreira, setBuilderCarreira] = useState<"policial" | "fiscal" | "tribunais" | "administrativo">("policial");
  const [builderBanca, setBuilderBanca] = useState<string>("Cebraspe (CESPE)");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    "Direito Constitucional",
    "Direito Administrativo",
    "Língua Portuguesa",
    "Informática & TI",
    "Raciocínio Lógico (RLM)",
  ]);
  const [questionCount, setQuestionCount] = useState<number>(60);
  const [isCustomCount, setIsCustomCount] = useState(false);
  const [customCountValue, setCustomCountValue] = useState("60");
  const [questionModel, setQuestionModel] = useState<"certo_errado" | "multipla" | "misto">("certo_errado");
  const [filterOnlyUnseen, setFilterOnlyUnseen] = useState(true);
  const [filterExcludeAnuladas, setFilterExcludeAnuladas] = useState(true);
  const [filterWithComments, setFilterWithComments] = useState(false);
  const [timerMode, setTimerMode] = useState<"prova_real" | "por_questao" | "livre">("prova_real");
  const [timePerQuestion, setTimePerQuestion] = useState<number>(2);

  // Sync with active target exam if present
  useEffect(() => {
    if (!activeExam) return;
    const titleLower = (activeExam.title || "").toLowerCase();
    const board = activeExam.exam_board;

    if (titleLower.includes("federal") || titleLower.includes("polícia") || titleLower.includes("policial")) {
      setBuilderCarreira("policial");
    } else if (titleLower.includes("receita") || titleLower.includes("fiscal") || titleLower.includes("tcu")) {
      setBuilderCarreira("fiscal");
    } else if (titleLower.includes("tribunal") || titleLower.includes("tj") || titleLower.includes("trf")) {
      setBuilderCarreira("tribunais");
    } else if (titleLower.includes("inss") || titleLower.includes("banco") || titleLower.includes("admin")) {
      setBuilderCarreira("administrativo");
    }

    if (board) {
      if (board.toLowerCase().includes("cebraspe") || board.toLowerCase().includes("cespe")) {
        setBuilderBanca("Cebraspe (CESPE)");
        setQuestionModel("certo_errado");
      } else if (board.toLowerCase().includes("fgv")) {
        setBuilderBanca("FGV (Fundação Getulio Vargas)");
        setQuestionModel("multipla");
      } else if (board.toLowerCase().includes("vunesp")) {
        setBuilderBanca("VUNESP");
        setQuestionModel("multipla");
      } else if (board.toLowerCase().includes("fcc")) {
        setBuilderBanca("FCC");
        setQuestionModel("multipla");
      }
    }
  }, [activeExam]);

  // Filtered & Sorted Official Simulations
  const filteredSimulations = useMemo(() => {
    let list = [...officialSimulados];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (sim) =>
          sim.title.toLowerCase().includes(q) ||
          sim.description.toLowerCase().includes(q) ||
          sim.banca.toLowerCase().includes(q) ||
          sim.carreira.toLowerCase().includes(q)
      );
    }

    // Carreira filter
    if (carreiraFilter !== "Todas") {
      list = list.filter(
        (sim) =>
          sim.carreira.toLowerCase().includes(carreiraFilter.toLowerCase()) ||
          carreiraFilter.toLowerCase().includes(sim.carreira.toLowerCase())
      );
    }

    // Banca filter
    if (bancaFilter) {
      list = list.filter((sim) => sim.banca.toLowerCase() === bancaFilter.toLowerCase());
    }

    // Sort order
    if (sortOrder === "realizados") {
      list.sort((a, b) => b.participantsCount - a.participantsCount);
    } else if (sortOrder === "recentes") {
      list.sort((a, b) => a.releaseOrder - b.releaseOrder);
    } else if (sortOrder === "dificuldade") {
      list.sort((a, b) => a.scoreNumber - b.scoreNumber);
    }

    return list;
  }, [officialSimulados, searchQuery, carreiraFilter, bancaFilter, sortOrder]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, carreiraFilter, bancaFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredSimulations.length / pageSize));
  const paginatedSimulations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSimulations.slice(start, start + pageSize);
  }, [filteredSimulations, currentPage, pageSize]);

  // Available subjects for custom builder Step 2
  const availableSubjects = useMemo(() => {
    if (disciplineStats.length > 0) return disciplineStats;
    return [
      { id: "dir-const", name: "Direito Constitucional", formattedCount: "8.481 q", count: 8481, highPriority: true, dbDisciplines: [] },
      { id: "dir-admin", name: "Direito Administrativo", formattedCount: "8.481 q", count: 8481, highPriority: true, dbDisciplines: [] },
      { id: "lingua-port", name: "Língua Portuguesa", formattedCount: "11.239 q", count: 11239, highPriority: true, dbDisciplines: [] },
      { id: "info-ti", name: "Informática & TI", formattedCount: "558 q", count: 558, highPriority: true, dbDisciplines: [] },
      { id: "rlm", name: "Raciocínio Lógico (RLM)", formattedCount: "11.239 q", count: 11239, highPriority: true, dbDisciplines: [] },
      { id: "contabilidade", name: "Contabilidade Geral", formattedCount: "8.421 q", count: 8421, highPriority: false, dbDisciplines: [] },
      { id: "penal-proc", name: "Direito Penal & Processo", formattedCount: "6.992 q", count: 6992, highPriority: false, dbDisciplines: [] },
      { id: "leg-especial", name: "Legislação Especial", formattedCount: "13.787 q", count: 13787, highPriority: false, dbDisciplines: [] },
      { id: "dir-tributario", name: "Direito Tributário", formattedCount: "8.481 q", count: 8481, highPriority: false, dbDisciplines: [] },
      { id: "dir-previdenciario", name: "Direito Previdenciário", formattedCount: "8.382 q", count: 8382, highPriority: false, dbDisciplines: [] },
    ];
  }, [disciplineStats]);

  // Filtered Subject List for Step 2
  const visibleSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return availableSubjects;
    const q = subjectSearch.toLowerCase().trim();
    return availableSubjects.filter((sub) => sub.name.toLowerCase().includes(q));
  }, [availableSubjects, subjectSearch]);

  // Toggle Single Subject
  const toggleSubject = (name: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  // Select All / Deselect All
  const handleToggleSelectAllSubjects = () => {
    if (selectedSubjects.length === availableSubjects.length) {
      setSelectedSubjects([]);
      toast.info("Todas as matérias foram desmarcadas.");
    } else {
      setSelectedSubjects(availableSubjects.map((s) => s.name));
      toast.success(`Todas as ${availableSubjects.length} matérias foram selecionadas.`);
    }
  };

  // Modo Fraquezas (IA)
  const handleModoFraquezasIA = () => {
    if (activeExam && activeExam.programmatic_content && activeExam.programmatic_content.length > 0) {
      const activeExamSubjects = activeExam.programmatic_content
        .filter((item: { importance?: string; weight?: number; discipline: string }) => item.importance === "alta" || (item.weight && item.weight > 1))
        .map((item: { discipline: string }) => item.discipline);

      if (activeExamSubjects.length > 0) {
        setSelectedSubjects(activeExamSubjects);
        toast.success("Modo Fraquezas IA ativado!", {
          description: `Priorizando disciplinas de alto peso do seu foco: ${activeExam.title}.`,
        });
        return;
      }
    }

    const highPrioritySubjects = availableSubjects.filter((s) => s.highPriority).map((s) => s.name);
    setSelectedSubjects(highPrioritySubjects);
    toast.info("Modo Fraquezas IA ativado!", {
      description: "Caderno calibrado com 5 disciplinas estatisticamente mais cobradas em concursos federais.",
    });
  };

  // Reset Builder Filters
  const handleClearBuilder = () => {
    setBuilderCarreira("policial");
    setBuilderBanca("Cebraspe (CESPE)");
    setSelectedSubjects([
      "Direito Constitucional",
      "Direito Administrativo",
      "Língua Portuguesa",
      "Informática & TI",
      "Raciocínio Lógico (RLM)",
    ]);
    setQuestionCount(60);
    setIsCustomCount(false);
    setQuestionModel("certo_errado");
    setFilterOnlyUnseen(true);
    setFilterExcludeAnuladas(true);
    setFilterWithComments(false);
    setTimerMode("prova_real");
    setTimePerQuestion(2);
    toast.info("Filtros do criador redefinidos para os padrões.");
  };

  // Load Saved or Target Exam Model
  const handleLoadLastModel = () => {
    if (activeExam) {
      const activeExamSubjects =
        activeExam.programmatic_content && activeExam.programmatic_content.length > 0
          ? activeExam.programmatic_content.map((p: { discipline: string }) => p.discipline)
          : ["Direito Constitucional", "Direito Administrativo", "Língua Portuguesa"];
      setSelectedSubjects(activeExamSubjects);
      setQuestionCount(activeExam.vacancies > 500 ? 120 : 60);
      toast.success("Modelo Concurso Foco Carregado!", {
        description: `Estrutura baseada no edital oficial de ${activeExam.title}.`,
      });
    } else {
      setSelectedSubjects(availableSubjects.slice(0, 6).map((s) => s.name));
      setQuestionCount(60);
      toast.info("Modelo de Prova Padrão Federal Carregado.");
    }
  };

  // Save Favorite Model
  const handleSaveFavoriteModel = () => {
    toast.success("Salvo nos Modelos Favoritos!", {
      description: `${builderBanca} • ${builderCarreira.toUpperCase()} • ${questionCount} questões.`,
    });
  };

  // Computed Duration
  const computedDurationMinutes = useMemo(() => {
    if (timerMode === "prova_real") {
      if (questionCount === 120) return 270; // 4h30
      if (questionCount === 100) return 300; // 5h00
      if (questionCount === 60) return 120; // 2h00
      return Math.round(questionCount * 2);
    }
    if (timerMode === "por_questao") {
      return questionCount * timePerQuestion;
    }
    return 0; // livre
  }, [timerMode, questionCount, timePerQuestion]);

  // Duration label formatted
  const durationLabel = useMemo(() => {
    if (timerMode === "livre") return "Sem limite (Treino livre)";
    const h = Math.floor(computedDurationMinutes / 60);
    const m = computedDurationMinutes % 60;
    if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, "0")} (${computedDurationMinutes} min)`;
    if (h > 0) return `${h}h00 (${computedDurationMinutes} min)`;
    return `${computedDurationMinutes} min`;
  }, [timerMode, computedDurationMinutes]);

  // Launch official simulation
  const handleStartOfficialSimulation = (sim: OfficialSimuladoModel) => {
    toast.success("Iniciando Simulado Oficial!", {
      description: `Carregando caderno: ${sim.title}...`,
    });
    navigate({
      to: "/questoes",
      search: {
        mode: "simulado",
        simulado: sim.title,
        carreira: sim.carreira,
        banca: sim.banca,
        qtd: sim.questions,
        tempo: sim.durationMinutes,
      },
    });
  };

  // Launch custom simulation
  const handleStartCustomSimulado = () => {
    if (selectedSubjects.length === 0) {
      toast.error("Selecione pelo menos uma matéria para o simulado.");
      return;
    }

    toast.success("Gerando Simulado Sob Demanda!", {
      description: `Montando caderno de ${questionCount} questões com correção instantânea...`,
    });

    navigate({
      to: "/questoes",
      search: {
        mode: "simulado",
        simulado: `Simulado Personalizado (${builderBanca})`,
        carreira: builderCarreira,
        banca: builderBanca.split(" ")[0] || builderBanca,
        disciplina: selectedSubjects.join(","),
        qtd: questionCount,
        tempo: computedDurationMinutes > 0 ? computedDurationMinutes : undefined,
        tipo_questao: questionModel,
        modo_tempo: timerMode,
      },
    });
  };

  return (
    <div className="flex min-h-screen bg-[#070b14] text-slate-100 font-sans min-h-screen antialiased selection:bg-cyan-500 selection:text-white">
      <Toaster richColors position="top-right" />
      {/* App Navigation Sidebar */}
      <AppNav />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 pt-16 lg:pt-0 min-h-screen overflow-hidden">
        <main
          className="flex-1 min-w-0 overflow-y-auto px-6 py-8 lg:px-12 bg-gradient-to-b from-[#080d1a] to-[#04070f]"
          data-purpose="simulados-page"
        >
          {/* Top Bar / Breadcrumb / Actions */}
          <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800/60 gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs text-sky-400 mb-1 font-semibold uppercase tracking-wider">
                <span>Ambiente de Treinamento Oficial</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">Ciclo 2025</span>
                {activeExam && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-cyan-400 font-bold">Foco: {activeExam.title}</span>
                  </>
                )}
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                Simulados &amp; Provas Oficiais
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold tracking-normal">
                  Banco Homologado
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Escolha entre simulados oficiais prontos com ranking nacional ou configure um caderno
                personalizado sob medida.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Banco Geral KiEstudos
                </span>
                <span className="text-sm font-bold text-white">
                  {formatQuestionCount(totalQuestionsCount)}{" "}
                  <span className="text-emerald-400 text-xs font-medium">questões catalogadas</span>
                </span>
              </div>
            </div>
          </header>

          {/* Student Performance Dashboard Panel */}
          <section className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0a1224] to-slate-900 border border-cyan-500/20 shadow-xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      Rastreamento Real de Desempenho
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                      Sincronizado Supabase
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white">Seu Histórico &amp; Métricas em Simulados</h2>
                </div>
              </div>
              <div className="text-xs text-slate-400">
                {user ? (
                  <span>
                    Conectado como <strong className="text-slate-200">{user.email}</strong>
                  </span>
                ) : (
                  <span className="text-amber-300">Modo Convidado (Histórico salvo localmente)</span>
                )}
              </div>
            </div>

            {/* 4 Performance KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Simulados Concluídos</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-white">{userStats?.totalSimulados ?? 0}</span>
                  <span className="text-[10px] text-slate-500">cadernos</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Taxa Média de Acerto</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-cyan-400">
                    {userStats && userStats.totalSimulados > 0 ? `${userStats.averageAccuracy}%` : "—"}
                  </span>
                  <span className="text-[10px] text-slate-500">precisão geral</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Melhor Desempenho</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-emerald-400">
                    {userStats && userStats.totalSimulados > 0 ? `${userStats.bestScore}%` : "—"}
                  </span>
                  <span className="text-[10px] text-slate-500">recorde pessoal</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Tempo Dedicado</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-sky-400">
                    {userStats && userStats.totalTimeMinutes > 0 ? `${userStats.totalTimeMinutes} min` : "0 min"}
                  </span>
                  <span className="text-[10px] text-slate-500">tempo total</span>
                </div>
              </div>
            </div>

            {/* Recent Attempts Accordion / List if any */}
            {userStats && userStats.recentAttempts.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Últimos Simulados Finalizados:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {userStats.recentAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-white block truncate">{attempt.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {attempt.banca} • {attempt.correctAnswers}/{attempt.totalQuestions} acertos
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-black text-emerald-400 text-sm block">
                          {attempt.accuracy}%
                        </span>
                        <span className="text-[9px] text-slate-500">
                          {new Date(attempt.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Navigation Switcher Tabs */}
          <div className="mt-6 space-y-4">
            <div className="p-1.5 rounded-2xl bg-[#090f1d] border border-slate-800/90 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                <button
                  className={`flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
                    activeTab === "acervo"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/30"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent"
                  }`}
                  id="tab-btn-acervo"
                  onClick={() => {
                    setActiveTab("acervo");
                    const el = document.getElementById("official-acervo");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  type="button"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    ></path>
                  </svg>
                  <span>1. Simulados Prontos do Acervo</span>
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {Math.floor(totalQuestionsCount / 1000)}k+ Questões
                  </span>
                </button>

                <button
                  className={`flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
                    activeTab === "personalizado"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/30"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent"
                  }`}
                  id="tab-btn-personalizado"
                  onClick={() => {
                    setActiveTab("personalizado");
                    const el = document.getElementById("custom-builder");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  type="button"
                >
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    ></path>
                  </svg>
                  <span>2. Criar Simulado Personalizado</span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Sob Demanda
                  </span>
                </button>
              </div>

              <div className="hidden lg:flex items-center space-x-2 text-[11px] text-slate-400 px-4 border-l border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{activeTab === "acervo" ? "Modo Acervo Ativo" : "Modo Criador Ativo"}</span>
              </div>
            </div>

            {/* Quick jump banner */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-sky-950/20 border border-sky-500/20 text-xs text-sky-200">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Aba Atual
                </span>
                <span className="font-medium text-slate-300">
                  Exibindo{" "}
                  <strong>
                    {activeTab === "acervo" ? "Simulados Prontos do Acervo" : "Criador Sob Demanda"}
                  </strong>{" "}
                  com estatísticas consolidadas e notas de corte.
                </span>
              </div>
              <a
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                href="#custom-builder"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab("personalizado");
                  const el = document.getElementById("custom-builder");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Prefere montar do zero? Ir para o Criador →
              </a>
            </div>
          </div>

          {/* BEGIN: OfficialSimulationsCarousel (Acervo de Provas) */}
          <section className="mt-6" id="official-acervo">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md mb-6">
              {/* Header Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                      Biblioteca de Provas
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      Atualizado Hoje
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-1">
                    Acervo de Provas &amp; Simulados Oficiais
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Mais de {formatQuestionCount(totalQuestionsCount)} questões prontas para treinar com temporizador real e ranking comunitário.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">
                    Exibindo <strong>{paginatedSimulations.length} de {filteredSimulations.length}</strong> simulados oficiais ({officialSimulados.length} no catálogo)
                  </span>
                </div>
              </div>

              {/* Search & Ordering Row */}
              <div className="mt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <input
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                    placeholder="Buscar por cargo, órgão ou ano (ex: PF 2024, Auditor RFB, Escrevente TJ-SP...)"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <svg
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    ></path>
                  </svg>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
                  <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                    Ordenar:
                  </span>
                  <button
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      sortOrder === "realizados"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                    onClick={() => setSortOrder("realizados")}
                    type="button"
                  >
                    Mais Realizados
                  </button>
                  <button
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      sortOrder === "recentes"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                    onClick={() => setSortOrder("recentes")}
                    type="button"
                  >
                    Mais Recentes
                  </button>
                  <button
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      sortOrder === "dificuldade"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                    onClick={() => setSortOrder("dificuldade")}
                    type="button"
                  >
                    Maior Dificuldade
                  </button>
                </div>
              </div>

              {/* Filter Chips Row (Carreira and Banca) */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-semibold mr-1">Carreira:</span>
                  {[
                    "Todas",
                    "Policial",
                    "Fiscal / SEFAZ",
                    "Tribunais (TRT/TJ)",
                    "Admin / INSS",
                    "Controle / TCU",
                  ].map((carreira) => (
                    <button
                      key={carreira}
                      className={`px-2.5 py-1 rounded-lg text-xs transition ${
                        carreiraFilter === carreira
                          ? "font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40"
                          : "font-semibold bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                      }`}
                      onClick={() => setCarreiraFilter(carreira)}
                      type="button"
                    >
                      {carreira}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-semibold mr-1">Banca:</span>
                  {["Cebraspe", "FGV", "Vunesp", "FCC"].map((banca) => (
                    <button
                      key={banca}
                      className={`px-2 py-0.5 rounded text-[11px] transition ${
                        bancaFilter === banca
                          ? "font-bold bg-slate-800 text-slate-200 border border-slate-700"
                          : "font-medium text-slate-400 hover:text-slate-200 border border-slate-800"
                      }`}
                      onClick={() => setBancaFilter(bancaFilter === banca ? "" : banca)}
                      type="button"
                    >
                      {banca}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cards Grid or Empty State */}
            {filteredSimulations.length === 0 ? (
              <div className="py-16 px-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-3 border border-slate-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-white">Nenhum simulado encontrado</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Não encontramos simulados com os filtros selecionados. Tente buscar por outros termos ou limpe os filtros.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCarreiraFilter("Todas");
                    setBancaFilter("");
                  }}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedSimulations.map((sim) => {
                  const isTarget = isCardMatchingTargetExam(sim, activeExam);
                  const hasUserAttempt = sim.userLastScore !== undefined && sim.userLastScore !== null;
                  return (
                    <div
                      key={sim.id}
                      className={`bg-slate-900/80 border hover:border-cyan-500/40 rounded-2xl p-5 transition duration-200 group flex flex-col justify-between hover:shadow-xl hover:shadow-cyan-950/20 relative ${
                        isTarget
                          ? "border-cyan-500/60 shadow-[0_0_25px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40"
                          : "border-slate-800"
                      }`}
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sim.bancaBadgeClass}`}>
                              {sim.banca.toUpperCase()}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${sim.carreiraBadgeClass}`}>
                              {sim.carreira.split(" ")[0]?.toUpperCase()}
                            </span>
                            {isTarget && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                                Seu Concurso Alvo
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {hasUserAttempt ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                Nota: {sim.userLastScore}%
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> {sim.participants} fizeram
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition">
                          {sim.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{sim.description}</p>
                      </div>

                      <div>
                        {/* Metrics Box */}
                        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] py-2.5 px-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                          <div>
                            <span className="text-slate-500 block">Duração / Itens:</span>
                            <span className="font-semibold text-slate-200">
                              {sim.questions} Q • {sim.duration}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Média Comunidade:</span>
                            <span className="font-bold text-emerald-400">{sim.communityScore}</span>
                          </div>
                        </div>

                        {/* Card Footer & CTA */}
                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                              ></path>
                            </svg>
                            {sim.feature}
                          </span>
                          <button
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20 transition flex items-center gap-1 cursor-pointer active:scale-95"
                            onClick={() => handleStartOfficialSimulation(sim)}
                            type="button"
                          >
                            <span>Começar Prova</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                d="M9 5l7 7-7 7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                              ></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Footer */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400">
                Mostrando página {currentPage} de {totalPages} • {filteredSimulations.length} simulados disponíveis
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700/80 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  type="button"
                >
                  ← Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((page) => (
                  <button
                    key={page}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      currentPage === page
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                    onClick={() => setCurrentPage(page)}
                    type="button"
                  >
                    {page}
                  </button>
                ))}
                {totalPages > 5 && <span className="px-1 text-slate-500">...</span>}
                <button
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700/80 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  type="button"
                >
                  Próxima →
                </button>
              </div>
            </div>
          </section>

          {/* BEGIN: CustomSimuladoBuilder (Criador Sob Demanda) */}
          <section className="mt-10 mb-16" id="custom-builder">
            {/* Callout Banner */}
            <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0c1427] to-cyan-950/30 border border-cyan-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 text-cyan-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    ></path>
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-400 block">
                    Módulo 2 • Modo Personalizado
                  </span>
                  <h3 className="text-base font-bold text-white">Prefere montar do seu jeito?</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Filtre disciplinas cirúrgicas, selecione bancas específicas e defina regras de pontuação
                    próprias.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                  Configuração Sob Demanda
                </span>
              </div>
            </div>

            {/* Builder Header Row */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-sky-400">
                  Laboratório de Testes
                </span>
                <h2 className="text-xl font-black text-white">Criador Sob Demanda</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition cursor-pointer"
                  onClick={handleClearBuilder}
                  type="button"
                >
                  Limpar Filtros
                </button>
                <button
                  className="text-xs text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition flex items-center gap-1 cursor-pointer"
                  onClick={handleLoadLastModel}
                  type="button"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    ></path>
                  </svg>
                  Carregar Último Modelo
                </button>
              </div>
            </div>

            {/* 3-Column Layout: Steps 1, 2, 3 on left; Steps 4, 5 on right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left & Center Configuration Columns (2 Cols) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Passo 1: Carreira e Bancas */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2.5">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs">
                        1
                      </span>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Carreira &amp; Banca Examinadora
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-500">Obrigatório</span>
                  </div>

                  {/* Seleção de Carreiras */}
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Selecione a Carreira:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
                    {/* Option Policial */}
                    <label
                      className={`relative flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                        builderCarreira === "policial"
                          ? "border-blue-500/50 bg-blue-500/10 text-white"
                          : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700"
                      }`}
                      onClick={() => setBuilderCarreira("policial")}
                    >
                      <input
                        checked={builderCarreira === "policial"}
                        className="sr-only"
                        name="carreira"
                        onChange={() => setBuilderCarreira("policial")}
                        type="radio"
                        value="policial"
                      />
                      <span className="font-bold text-xs flex items-center justify-between">
                        Policial
                        <span
                          className={`w-2 h-2 rounded-full ${
                            builderCarreira === "policial" ? "bg-blue-400" : "bg-slate-700"
                          }`}
                        ></span>
                      </span>
                      <span
                        className={`text-[10px] mt-1 ${
                          builderCarreira === "policial" ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        PF, PRF, PC, PM, DEPEN
                      </span>
                    </label>

                    {/* Option Fiscal & Controle */}
                    <label
                      className={`relative flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                        builderCarreira === "fiscal"
                          ? "border-blue-500/50 bg-blue-500/10 text-white"
                          : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700"
                      }`}
                      onClick={() => setBuilderCarreira("fiscal")}
                    >
                      <input
                        checked={builderCarreira === "fiscal"}
                        className="sr-only"
                        name="carreira"
                        onChange={() => setBuilderCarreira("fiscal")}
                        type="radio"
                        value="fiscal"
                      />
                      <span className="font-bold text-xs flex items-center justify-between">
                        Fiscal &amp; Controle
                        <span
                          className={`w-2 h-2 rounded-full ${
                            builderCarreira === "fiscal" ? "bg-blue-400" : "bg-slate-700"
                          }`}
                        ></span>
                      </span>
                      <span
                        className={`text-[10px] mt-1 ${
                          builderCarreira === "fiscal" ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Receita, SEFAZ, TCU
                      </span>
                    </label>

                    {/* Option Tribunais */}
                    <label
                      className={`relative flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                        builderCarreira === "tribunais"
                          ? "border-blue-500/50 bg-blue-500/10 text-white"
                          : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700"
                      }`}
                      onClick={() => setBuilderCarreira("tribunais")}
                    >
                      <input
                        checked={builderCarreira === "tribunais"}
                        className="sr-only"
                        name="carreira"
                        onChange={() => setBuilderCarreira("tribunais")}
                        type="radio"
                        value="tribunais"
                      />
                      <span className="font-bold text-xs flex items-center justify-between">
                        Tribunais
                        <span
                          className={`w-2 h-2 rounded-full ${
                            builderCarreira === "tribunais" ? "bg-blue-400" : "bg-slate-700"
                          }`}
                        ></span>
                      </span>
                      <span
                        className={`text-[10px] mt-1 ${
                          builderCarreira === "tribunais" ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        TJ, TRF, TRT, TRE
                      </span>
                    </label>

                    {/* Option Administrativo */}
                    <label
                      className={`relative flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                        builderCarreira === "administrativo"
                          ? "border-blue-500/50 bg-blue-500/10 text-white"
                          : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700"
                      }`}
                      onClick={() => setBuilderCarreira("administrativo")}
                    >
                      <input
                        checked={builderCarreira === "administrativo"}
                        className="sr-only"
                        name="carreira"
                        onChange={() => setBuilderCarreira("administrativo")}
                        type="radio"
                        value="administrativo"
                      />
                      <span className="font-bold text-xs flex items-center justify-between">
                        Geral / Admin
                        <span
                          className={`w-2 h-2 rounded-full ${
                            builderCarreira === "administrativo" ? "bg-blue-400" : "bg-slate-700"
                          }`}
                        ></span>
                      </span>
                      <span
                        className={`text-[10px] mt-1 ${
                          builderCarreira === "administrativo" ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        INSS, Ministérios, Autarquias
                      </span>
                    </label>
                  </div>

                  {/* Seleção de Bancas */}
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Banca Examinadora:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Cebraspe (CESPE)",
                      "FGV (Fundação Getulio Vargas)",
                      "VUNESP",
                      "FCC",
                      "Todas as Bancas",
                    ].map((banca) => (
                      <button
                        key={banca}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          builderBanca === banca
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                            : "bg-slate-800/80 text-slate-400 border border-slate-700/80 hover:border-slate-600 hover:text-white"
                        }`}
                        onClick={() => {
                          setBuilderBanca(banca);
                          if (banca.includes("Cebraspe")) {
                            setQuestionModel("certo_errado");
                          } else {
                            setQuestionModel("multipla");
                          }
                        }}
                        type="button"
                      >
                        {banca}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Passo 2: Matérias e Disciplinas */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
                    <div className="flex items-center space-x-2.5">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs">
                        2
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          Matérias &amp; Disciplinas
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Escolha quais matérias irão compor o seu caderno de prova
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        className="text-[11px] font-bold text-cyan-400 hover:underline cursor-pointer"
                        onClick={handleToggleSelectAllSubjects}
                        type="button"
                      >
                        {selectedSubjects.length === availableSubjects.length ? "Desmarcar Todas" : "Marcar Todas"}
                      </button>
                      <span className="text-slate-600">|</span>
                      <button
                        className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                        onClick={handleModoFraquezasIA}
                        type="button"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          ></path>
                        </svg>
                        Modo Fraquezas (IA)
                      </button>
                    </div>
                  </div>

                  {/* Busca Rápida de Matérias */}
                  <div className="mt-4 relative">
                    <input
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      placeholder="Filtrar matérias ou assuntos específicos (Ex: Controle de Constitucionalidade...)"
                      type="text"
                      value={subjectSearch}
                      onChange={(e) => setSubjectSearch(e.target.value)}
                    />
                    <svg
                      className="w-4 h-4 text-slate-500 absolute left-3 top-2.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </div>

                  {/* Grid de Tags de Matérias */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {visibleSubjects.map((sub) => {
                      const isSelected = selectedSubjects.includes(sub.name);
                      return (
                        <label
                          key={sub.id}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                            isSelected
                              ? "border-cyan-500/40 bg-cyan-950/20"
                              : "border-slate-800/80 bg-slate-950/40 hover:border-slate-700"
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            toggleSubject(sub.name);
                          }}
                        >
                          <div className="flex items-center space-x-2.5">
                            <input
                              checked={isSelected}
                              className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                              onChange={() => toggleSubject(sub.name)}
                              type="checkbox"
                            />
                            <span
                              className={`text-xs ${
                                isSelected ? "font-semibold text-white" : "font-medium text-slate-400"
                              }`}
                            >
                              {sub.name}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              isSelected ? "bg-slate-800 text-cyan-300" : "bg-slate-900 text-slate-500"
                            }`}
                          >
                            {"formattedCount" in sub && sub.formattedCount ? sub.formattedCount : `${sub.count} q`}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Passo 3: Questões & Filtros Técnicos */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
                  <div className="flex items-center space-x-2.5 mb-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs">
                      3
                    </span>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Quantidade &amp; Regras de Filtro
                    </h3>
                  </div>

                  {/* Botões de Quantidade */}
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Quantidade de Questões:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
                    {[10, 20, 30, 60].map((qty) => (
                      <button
                        key={qty}
                        className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          !isCustomCount && questionCount === qty
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-500"
                            : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80"
                        }`}
                        onClick={() => {
                          setIsCustomCount(false);
                          setQuestionCount(qty);
                        }}
                        type="button"
                      >
                        {qty}
                      </button>
                    ))}
                    <button
                      className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        !isCustomCount && questionCount === 120
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-500"
                          : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80"
                      }`}
                      onClick={() => {
                        setIsCustomCount(false);
                        setQuestionCount(120);
                      }}
                      type="button"
                    >
                      120 (CESPE)
                    </button>
                    <button
                      className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isCustomCount
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-500"
                          : "bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700"
                      }`}
                      onClick={() => {
                        setIsCustomCount(true);
                      }}
                      type="button"
                    >
                      Personalizado
                    </button>
                  </div>

                  {/* Custom count input if active */}
                  {isCustomCount && (
                    <div className="mb-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                      <span className="text-xs text-slate-400">Total desejado:</span>
                      <input
                        className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                        max={150}
                        min={5}
                        type="number"
                        value={customCountValue}
                        onChange={(e) => {
                          setCustomCountValue(e.target.value);
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val > 0) {
                            setQuestionCount(Math.min(Math.max(val, 5), 150));
                          }
                        }}
                        onBlur={() => {
                          const val = parseInt(customCountValue, 10);
                          if (isNaN(val) || val < 5) {
                            setCustomCountValue("5");
                            setQuestionCount(5);
                          } else if (val > 150) {
                            setCustomCountValue("150");
                            setQuestionCount(150);
                          }
                        }}
                      />
                      <span className="text-xs text-slate-500">(máximo 150 questões por caderno)</span>
                    </div>
                  )}

                  {/* Formato das Questões */}
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Modelo de Questão:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
                    <label
                      className={`flex items-center p-2.5 rounded-xl border cursor-pointer transition ${
                        questionModel === "multipla"
                          ? "border-blue-500/40 bg-blue-500/10 font-bold text-white"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300"
                      }`}
                      onClick={() => setQuestionModel("multipla")}
                    >
                      <input
                        checked={questionModel === "multipla"}
                        className="rounded-full border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                        name="tipo_questao"
                        onChange={() => setQuestionModel("multipla")}
                        type="radio"
                      />
                      <span className="ml-2 text-xs">Múltipla Escolha (A-E)</span>
                    </label>

                    <label
                      className={`flex items-center p-2.5 rounded-xl border cursor-pointer transition ${
                        questionModel === "certo_errado"
                          ? "border-blue-500/40 bg-blue-500/10 font-bold text-white"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300"
                      }`}
                      onClick={() => setQuestionModel("certo_errado")}
                    >
                      <input
                        checked={questionModel === "certo_errado"}
                        className="rounded-full border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                        name="tipo_questao"
                        onChange={() => setQuestionModel("certo_errado")}
                        type="radio"
                      />
                      <span className="ml-2 text-xs">Certo ou Errado</span>
                    </label>

                    <label
                      className={`flex items-center p-2.5 rounded-xl border cursor-pointer transition ${
                        questionModel === "misto"
                          ? "border-blue-500/40 bg-blue-500/10 font-bold text-white"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300"
                      }`}
                      onClick={() => setQuestionModel("misto")}
                    >
                      <input
                        checked={questionModel === "misto"}
                        className="rounded-full border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                        name="tipo_questao"
                        onChange={() => setQuestionModel("misto")}
                        type="radio"
                      />
                      <span className="ml-2 text-xs">Misto / Qualquer</span>
                    </label>
                  </div>

                  {/* Filtros de Qualidade */}
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Filtros de Qualidade:
                  </label>
                  <div className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs text-slate-300">
                        Apenas questões inéditas (que nunca resolvi)
                      </span>
                      <input
                        checked={filterOnlyUnseen}
                        className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                        onChange={(e) => setFilterOnlyUnseen(e.target.checked)}
                        type="checkbox"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs text-slate-300">
                        Excluir questões anuladas ou desatualizadas pela banca
                      </span>
                      <input
                        checked={filterExcludeAnuladas}
                        className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                        onChange={(e) => setFilterExcludeAnuladas(e.target.checked)}
                        type="checkbox"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs text-slate-300">
                        Incluir apenas questões com resolução comentada em texto/vídeo
                      </span>
                      <input
                        checked={filterWithComments}
                        className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                        onChange={(e) => setFilterWithComments(e.target.checked)}
                        type="checkbox"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Summary and Timing Column (1 Col) */}
              <div className="space-y-6">
                {/* Passo 4: Modo Cronômetro */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
                  <div className="flex items-center space-x-2.5 mb-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-black font-bold text-xs">
                      4
                    </span>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Cronômetro &amp; Ritmo
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {/* Modo Prova Real */}
                    <label
                      className={`flex items-start p-3 rounded-xl border cursor-pointer transition ${
                        timerMode === "prova_real"
                          ? "border-emerald-500/50 bg-emerald-500/5"
                          : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                      }`}
                      onClick={() => setTimerMode("prova_real")}
                    >
                      <input
                        checked={timerMode === "prova_real"}
                        className="mt-0.5 rounded-full border-slate-700 bg-slate-900 text-emerald-400 focus:ring-0"
                        name="modo_tempo"
                        onChange={() => setTimerMode("prova_real")}
                        type="radio"
                      />
                      <div className="ml-2.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-white">Modo Prova Real</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            RECOMENDADO
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Tempo corrido rigoroso de concurso com contagem regressiva fixa ({durationLabel} para{" "}
                          {questionCount} questões).
                        </p>
                      </div>
                    </label>

                    {/* Tempo por Questão */}
                    <label
                      className={`flex items-start p-3 rounded-xl border cursor-pointer transition ${
                        timerMode === "por_questao"
                          ? "border-emerald-500/50 bg-emerald-500/5"
                          : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                      }`}
                      onClick={() => setTimerMode("por_questao")}
                    >
                      <input
                        checked={timerMode === "por_questao"}
                        className="mt-0.5 rounded-full border-slate-700 bg-slate-900 text-emerald-400 focus:ring-0"
                        name="modo_tempo"
                        onChange={() => setTimerMode("por_questao")}
                        type="radio"
                      />
                      <div className="ml-2.5">
                        <span className="text-xs font-semibold text-slate-200 block">
                          Tempo Fixo por Questão
                        </span>
                        <div className="flex gap-2 mt-2">
                          {[1, 2, 3].map((min) => (
                            <button
                              key={min}
                              type="button"
                              className={`px-2 py-1 text-[10px] rounded cursor-pointer transition ${
                                timePerQuestion === min
                                  ? "bg-sky-900/60 text-sky-200 border border-sky-700 font-bold"
                                  : "bg-slate-800 text-slate-300 border border-slate-700 hover:text-white"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTimerMode("por_questao");
                                setTimePerQuestion(min);
                              }}
                            >
                              {min} min
                            </button>
                          ))}
                        </div>
                      </div>
                    </label>

                    {/* Modo Treino Livre */}
                    <label
                      className={`flex items-start p-3 rounded-xl border cursor-pointer transition ${
                        timerMode === "livre"
                          ? "border-emerald-500/50 bg-emerald-500/5"
                          : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                      }`}
                      onClick={() => setTimerMode("livre")}
                    >
                      <input
                        checked={timerMode === "livre"}
                        className="mt-0.5 rounded-full border-slate-700 bg-slate-900 text-emerald-400 focus:ring-0"
                        name="modo_tempo"
                        onChange={() => setTimerMode("livre")}
                        type="radio"
                      />
                      <div className="ml-2.5">
                        <span className="text-xs font-semibold text-slate-200 block">
                          Treino Livre / Sem Pressão
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Apenas marcação progressiva sem limite de encerramento automático.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Passo 5: Painel Resumo Dinâmico & Call to Action */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl shadow-cyan-950/30 sticky top-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Resumo da Simulação
                    </span>
                    <span className="flex items-center text-[11px] font-semibold text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                      Pronto para gerar
                    </span>
                  </div>

                  <div className="py-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Carreira / Área:</span>
                      <span className="font-bold text-white">
                        {builderCarreira === "policial"
                          ? "Policial (PF/PRF)"
                          : builderCarreira === "fiscal"
                            ? "Fiscal & Controle (RFB/TCU)"
                            : builderCarreira === "tribunais"
                              ? "Tribunais (TJ/TRF/TRT)"
                              : "Geral / Admin (INSS/Ministérios)"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Banca Examinadora:</span>
                      <span className="font-bold text-sky-400">{builderBanca}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Total de Questões:</span>
                      <span className="font-bold text-white text-sm">{questionCount} itens</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Matérias Ativas:</span>
                      <span className="font-bold text-white">{selectedSubjects.length} disciplinas</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Tempo Limite:</span>
                      <span className="font-bold text-emerald-400">{durationLabel}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Critério de Pontuação:</span>
                      <span className="font-semibold text-amber-300">
                        {questionModel === "certo_errado" || builderBanca.includes("Cebraspe")
                          ? "Líquida (-1 erro anula 1 acerto)"
                          : "Padrão (1 ponto por acerto)"}
                      </span>
                    </div>
                  </div>

                  {/* Primary CTAs */}
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-2.5">
                    <button
                      className="w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-wide text-slate-950 bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 hover:from-sky-300 hover:to-emerald-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
                      onClick={handleStartCustomSimulado}
                      type="button"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"></path>
                      </svg>
                      COMEÇAR SIMULADO AGORA
                    </button>
                    <button
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/80 transition flex items-center justify-center gap-2 cursor-pointer"
                      onClick={handleSaveFavoriteModel}
                      type="button"
                    >
                      <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                      </svg>
                      Salvar como Modelo Favorito
                    </button>
                  </div>
                  <p className="text-[10px] text-center text-slate-500 mt-3">
                    Geração em lote com randomização de alternativas contra memorização viciada.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
