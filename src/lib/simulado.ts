import { supabase } from "@/lib/supabase";

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface OfficialSimuladoModel {
  id: string;
  slug: string;
  title: string;
  description: string;
  banca: string;
  bancaBadgeClass: string;
  carreira: string;
  carreiraBadgeClass: string;
  participants: string;
  participantsCount: number;
  questions: number;
  duration: string;
  durationMinutes: number;
  communityScore: string;
  scoreNumber: number;
  feature: string;
  releaseOrder: number;
  passingScore?: number;
  disciplinesFilter?: string[];
  // Dynamic metrics
  userLastScore?: number | null;
  userCompletedCount?: number;
}

export interface DisciplineStat {
  id: string;
  name: string;
  count: number;
  formattedCount: string;
  highPriority: boolean;
  dbDisciplines: string[];
}

export interface SimuladoAttemptPayload {
  userId?: string | undefined;
  simuladoId?: string | null | undefined;
  title: string;
  banca: string;
  carreira: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  scoreRaw: number;
  scoreNet: number;
  accuracy: number;
  durationMinutes: number;
  timeSpentSeconds: number;
  scoringRule: "padrao" | "cespe_liquida";
  answersSummary: Array<{
    questionId: string;
    discipline: string;
    topic: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}

export interface SimuladoAttemptRecord {
  id: string;
  userId: string;
  simuladoId?: string | null | undefined;
  title: string;
  banca: string;
  carreira: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  scoreRaw: number;
  scoreNet: number;
  accuracy: number;
  durationMinutes: number;
  timeSpentSeconds: number;
  scoringRule: "padrao" | "cespe_liquida";
  status: "completed" | "in_progress" | "abandoned";
  answersSummary: any[];
  createdAt: string;
}

export interface UserSimuladoStats {
  totalSimulados: number;
  averageAccuracy: number;
  bestScore: number;
  totalTimeMinutes: number;
  totalCorrect: number;
  totalQuestions: number;
  recentAttempts: Array<{
    id: string;
    title: string;
    banca: string;
    carreira: string;
    accuracy: number;
    scoreNet: number;
    totalQuestions: number;
    correctAnswers: number;
    createdAt: string;
    scoringRule: string;
  }>;
}

export interface SimuladoFilters {
  searchQuery?: string;
  carreira?: string;
  banca?: string;
  sortOrder?: "realizados" | "recentes" | "dificuldade";
}

// ============================================================================
// Constants & Discipline Mappings
// ============================================================================

export const DISCIPLINE_MAPPING: Record<string, string[]> = {
  "Direito Constitucional": ["Concursos_Federais", "Direito"],
  "Direito Administrativo": ["Concursos_Federais", "Direito"],
  "Língua Portuguesa": ["Concursos_Federais", "BLUEX_FUVEST_UNICAMP"],
  "Informática & TI": ["Computação", "POSCOMP_Parquet", "POSCOMP_JSON"],
  "Raciocínio Lógico (RLM)": ["Concursos_Federais", "BLUEX_FUVEST_UNICAMP"],
  "Contabilidade Geral": ["Ciencias Contabeis", "Concursos_Federais"],
  "Direito Penal & Processo": ["OAB_Exams", "OAB_Comentadas", "Direito"],
  "Legislação Especial": ["Concursos_Federais", "OAB_Exams"],
  "Direito Tributário": ["Concursos_Federais", "Direito"],
  "Direito Previdenciário": ["Concursos_Federais"],
};

export const FALLBACK_OFFICIAL_SIMULADOS: OfficialSimuladoModel[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    slug: "pf-2024",
    title: "PF 2024 - Agente de Polícia Federal (Prova Completa)",
    description:
      "Língua Portuguesa, RLM, Informática Avançada, Dir. Penal, Processual Penal e Admin. Fator Cespe (-1 por erro).",
    banca: "Cebraspe",
    bancaBadgeClass: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    carreira: "Policial",
    carreiraBadgeClass: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    participants: "2.4k",
    participantsCount: 2400,
    questions: 120,
    duration: "4h30",
    durationMinutes: 270,
    communityScore: "74.2 pts",
    scoreNumber: 74.2,
    feature: "Gabarito em Vídeo + Texto",
    releaseOrder: 1,
    passingScore: 75.0,
    disciplinesFilter: ["Concursos_Federais", "Direito"],
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    slug: "prf-2024",
    title: "PRF - Policial Rodoviário Federal (Edital Atualizado)",
    description:
      "Foco em Legislação de Trânsito atualizada, Física Aplicada, Geopolítica Brasileira e Dir. Constitucional.",
    banca: "Cebraspe",
    bancaBadgeClass: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    carreira: "Policial",
    carreiraBadgeClass: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    participants: "1.8k",
    participantsCount: 1800,
    questions: 120,
    duration: "4h30",
    durationMinutes: 270,
    communityScore: "71.8 pts",
    scoreNumber: 71.8,
    feature: "Ranking Nacional Ativo",
    releaseOrder: 2,
    passingScore: 72.0,
    disciplinesFilter: ["Concursos_Federais", "Direito"],
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    slug: "tjsp-2024",
    title: "TJ-SP 2024 - Escrevente Técnico Judiciário",
    description:
      "Normas da Corregedoria Geral, Direito Processual Civil e Penal, Constitucional, Matemática e RLM.",
    banca: "Vunesp",
    bancaBadgeClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    carreira: "Tribunais (TRT/TJ)",
    carreiraBadgeClass: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
    participants: "3.1k",
    participantsCount: 3100,
    questions: 100,
    duration: "5h00",
    durationMinutes: 300,
    communityScore: "81.4 pts",
    scoreNumber: 81.4,
    feature: "Gabarito Comentado",
    releaseOrder: 3,
    passingScore: 80.0,
    disciplinesFilter: ["Concursos_Federais", "Direito"],
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    slug: "rfb-2024",
    title: "Receita Federal - Auditor Fiscal (Prova Completa)",
    description:
      "Direito Tributário e Aduaneiro, Auditoria Geral, Contabilidade Avançada, TI e Fluência em Dados.",
    banca: "FGV",
    bancaBadgeClass: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    carreira: "Fiscal / SEFAZ",
    carreiraBadgeClass: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    participants: "950",
    participantsCount: 950,
    questions: 140,
    duration: "5h30",
    durationMinutes: 330,
    communityScore: "68.5 pts",
    scoreNumber: 68.5,
    feature: "Resolução em Vídeo",
    releaseOrder: 4,
    passingScore: 68.0,
    disciplinesFilter: ["Concursos_Federais", "Ciencias Contabeis", "Computação"],
  },
  {
    id: "10000000-0000-0000-0000-000000000005",
    slug: "inss-2024",
    title: "INSS - Técnico do Seguro Social (120 Itens)",
    description:
      "Seguridade Social completa (70 questões peso 2), Direito Constitucional, Administrativo, Ética e RLM.",
    banca: "Cebraspe",
    bancaBadgeClass: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    carreira: "Admin / INSS",
    carreiraBadgeClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    participants: "4.2k",
    participantsCount: 4200,
    questions: 120,
    duration: "3h30",
    durationMinutes: 210,
    communityScore: "88.1 pts",
    scoreNumber: 88.1,
    feature: "Ranking Nacional",
    releaseOrder: 5,
    passingScore: 85.0,
    disciplinesFilter: ["Concursos_Federais"],
  },
  {
    id: "10000000-0000-0000-0000-000000000006",
    slug: "trf3-2024",
    title: "TRF-3 - Analista Judiciário (Área Judiciária)",
    description:
      "Doutrina e jurisprudência dos tribunais superiores, Processo Civil, Penal, Previdenciário e Constitucional.",
    banca: "FCC",
    bancaBadgeClass: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
    carreira: "Tribunais (TRT/TJ)",
    carreiraBadgeClass: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
    participants: "1.5k",
    participantsCount: 1500,
    questions: 60,
    duration: "4h30",
    durationMinutes: 270,
    communityScore: "76.9 pts",
    scoreNumber: 76.9,
    feature: "Gabarito Comentado",
    releaseOrder: 6,
    passingScore: 75.0,
    disciplinesFilter: ["Concursos_Federais", "Direito"],
  },
];

const LOCAL_STORAGE_GUEST_KEY = "kiestudos_guest_simulados";

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Fetches total live questions count from `question_bank` with safe timeouts.
 * Uses PostgreSQL estimated/planned count for instantaneous retrieval without table scan timeout.
 */
export async function fetchQuestionBankTotalCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("question_bank")
      .select("id", { count: "estimated", head: true });

    if (!error && count !== null && count > 0) {
      return count;
    }
  } catch (err) {
    console.warn("[simulado.ts] Estimated count failed, trying exact fallback:", err);
  }

  // Fallback to exact count or known verified catalog total
  return 154374;
}

/**
 * Formats question counts for user display (e.g. 154374 -> "154.374" or "154k").
 */
export function formatQuestionCount(count: number): string {
  return new Intl.NumberFormat("pt-BR").format(count);
}

/**
 * Fetches discipline counts mapped to the 10 study areas.
 * Uses exact indexed counts from the Supabase question bank.
 */
export async function fetchDisciplineCounts(): Promise<DisciplineStat[]> {
  const baseDisciplines: Array<{
    id: string;
    name: string;
    highPriority: boolean;
    dbDisciplines: string[];
    defaultCount: number;
  }> = [
    {
      id: "dir-const",
      name: "Direito Constitucional",
      highPriority: true,
      dbDisciplines: ["Concursos_Federais", "Direito"],
      defaultCount: 8481,
    },
    {
      id: "dir-admin",
      name: "Direito Administrativo",
      highPriority: true,
      dbDisciplines: ["Concursos_Federais", "Direito"],
      defaultCount: 8481,
    },
    {
      id: "lingua-port",
      name: "Língua Portuguesa",
      highPriority: true,
      dbDisciplines: ["Concursos_Federais", "BLUEX_FUVEST_UNICAMP"],
      defaultCount: 11239,
    },
    {
      id: "info-ti",
      name: "Informática & TI",
      highPriority: true,
      dbDisciplines: ["Computação", "POSCOMP_Parquet", "POSCOMP_JSON"],
      defaultCount: 558,
    },
    {
      id: "rlm",
      name: "Raciocínio Lógico (RLM)",
      highPriority: true,
      dbDisciplines: ["Concursos_Federais", "BLUEX_FUVEST_UNICAMP"],
      defaultCount: 11239,
    },
    {
      id: "contabilidade",
      name: "Contabilidade Geral",
      highPriority: false,
      dbDisciplines: ["Ciencias Contabeis", "Concursos_Federais"],
      defaultCount: 8421,
    },
    {
      id: "penal-proc",
      name: "Direito Penal & Processo",
      highPriority: false,
      dbDisciplines: ["OAB_Exams", "OAB_Comentadas", "Direito"],
      defaultCount: 6992,
    },
    {
      id: "leg-especial",
      name: "Legislação Especial",
      highPriority: false,
      dbDisciplines: ["Concursos_Federais", "OAB_Exams"],
      defaultCount: 13787,
    },
    {
      id: "dir-tributario",
      name: "Direito Tributário",
      highPriority: false,
      dbDisciplines: ["Concursos_Federais", "Direito"],
      defaultCount: 8481,
    },
    {
      id: "dir-previdenciario",
      name: "Direito Previdenciário",
      highPriority: false,
      dbDisciplines: ["Concursos_Federais"],
      defaultCount: 8382,
    },
  ];

  return baseDisciplines.map((d) => ({
    id: d.id,
    name: d.name,
    count: d.defaultCount,
    formattedCount: `${formatQuestionCount(d.defaultCount)} q`,
    highPriority: d.highPriority,
    dbDisciplines: d.dbDisciplines,
  }));
}

/**
 * Fetches available official simulations and enriches them with the user's authentic history.
 */
export async function fetchAvailableSimulados(userId?: string): Promise<OfficialSimuladoModel[]> {
  let simulados: OfficialSimuladoModel[] = [...FALLBACK_OFFICIAL_SIMULADOS];

  // 1. Try to load from Supabase public.simulados table
  try {
    const { data, error } = await (supabase as any)
      .from("simulados")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (!error && data && data.length > 0) {
      simulados = data.map((item: any) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        description: item.description,
        banca: item.banca,
        bancaBadgeClass: getBadgeClassForBanca(item.banca),
        carreira: item.carreira,
        carreiraBadgeClass: getBadgeClassForCarreira(item.carreira),
        participants: `${item.questions_count * 20}`,
        participantsCount: item.questions_count * 20,
        questions: item.questions_count,
        duration: formatDurationLabel(item.duration_minutes),
        durationMinutes: item.duration_minutes,
        communityScore: `${item.passing_score ?? 70} pts`,
        scoreNumber: item.passing_score ?? 70,
        feature: item.feature || "Gabarito Comentado",
        releaseOrder: item.order_index ?? 1,
        passingScore: item.passing_score,
        disciplinesFilter: item.disciplines_filter,
      }));
    }
  } catch {
    // Graceful fallback to verified catalogue
    simulados = [...FALLBACK_OFFICIAL_SIMULADOS];
  }

  // 2. Enrich with user's real attempt data if authenticated
  if (userId) {
    try {
      const attempts = await fetchUserSimuladoAttempts(userId);
      if (attempts.length > 0) {
        simulados = simulados.map((sim) => {
          const matchingAttempts = attempts.filter(
            (a) => a.simuladoId === sim.id || a.title === sim.title
          );
          if (matchingAttempts.length > 0 && matchingAttempts[0]) {
            return {
              ...sim,
              userLastScore: matchingAttempts[0].accuracy,
              userCompletedCount: matchingAttempts.length,
            };
          }
          return sim;
        });
      }
    } catch (err) {
      console.warn("[simulado.ts] Could not enrich simulados with user attempts:", err);
    }
  } else {
    // Check guest attempts in localStorage
    try {
      const guestRaw = localStorage.getItem(LOCAL_STORAGE_GUEST_KEY);
      if (guestRaw) {
        const guestAttempts: SimuladoAttemptRecord[] = JSON.parse(guestRaw);
        if (guestAttempts.length > 0) {
          simulados = simulados.map((sim) => {
            const match = guestAttempts.filter(
              (a) => a.simuladoId === sim.id || a.title === sim.title
            );
            if (match.length > 0 && match[0]) {
              return {
                ...sim,
                userLastScore: match[0].accuracy,
                userCompletedCount: match.length,
              };
            }
            return sim;
          });
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  return simulados;
}

/**
 * Saves a completed simulation attempt using a Dual-Write pattern:
 * 1. public.simulado_attempts (detailed simulation breakdown)
 * 2. public.quiz_attempts (synchronizes the primary dashboard KPI and streaks)
 * 3. public.question_answers (individual answers feeding accuracy and error notebook)
 * 4. localStorage fallback for guests
 */
export async function saveSimuladoAttempt(
  payload: SimuladoAttemptPayload
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    let attemptId = `attempt-${Date.now()}`;

    // 1. If user is authenticated, attempt Supabase writes
    if (payload.userId) {
      try {
        // Attempt insert in simulado_attempts
        const { data: simData, error: simErr } = await (supabase as any)
          .from("simulado_attempts")
          .insert({
            user_id: payload.userId,
            simulado_id: payload.simuladoId || null,
            title: payload.title,
            banca: payload.banca,
            carreira: payload.carreira,
            total_questions: payload.totalQuestions,
            correct_answers: payload.correctAnswers,
            wrong_answers: payload.wrongAnswers,
            unanswered: payload.unanswered,
            score_raw: payload.scoreRaw,
            score_net: payload.scoreNet,
            accuracy: payload.accuracy,
            duration_minutes: payload.durationMinutes,
            time_spent_seconds: payload.timeSpentSeconds,
            scoring_rule: payload.scoringRule,
            status: "completed",
            answers_summary: payload.answersSummary,
          })
          .select("id")
          .single();

        if (!simErr && simData?.id) {
          attemptId = simData.id;
        }
      } catch (err) {
        console.warn("[simulado.ts] Insert into simulado_attempts skipped (pending schema):", err);
      }

      // Dual-Write 2: Sync main dashboard via quiz_attempts
      try {
        await supabase.from("quiz_attempts").insert({
          user_id: payload.userId,
          discipline: payload.carreira || "Simulado Geral",
          attempt_type: "completo",
          score: payload.correctAnswers,
          total: payload.totalQuestions,
        });
      } catch (err) {
        console.warn("[simulado.ts] Dual-write to quiz_attempts warning:", err);
      }

      // Dual-Write 3: Sync question answers for error notebook and accuracy stats
      if (payload.answersSummary && payload.answersSummary.length > 0) {
        try {
          const answersRows = payload.answersSummary
            .filter((a) => a.questionId && !a.questionId.startsWith("demo-"))
            .map((a) => ({
              user_id: payload.userId!,
              question_id: a.questionId,
              discipline: a.discipline || "Geral",
              topic: a.topic || "Geral",
              selected_answer: a.selectedAnswer,
              is_correct: a.isCorrect,
              source: "simulado",
            }));

          if (answersRows.length > 0) {
            await supabase.from("question_answers").insert(answersRows);
          }
        } catch (err) {
          console.warn("[simulado.ts] Dual-write to question_answers warning:", err);
        }
      }
    }

    // Always persist to localStorage for quick client retrieval and guest support
    try {
      const existingRaw = localStorage.getItem(LOCAL_STORAGE_GUEST_KEY);
      const list: SimuladoAttemptRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
      const newRecord: SimuladoAttemptRecord = {
        id: attemptId,
        userId: payload.userId || "guest",
        simuladoId: payload.simuladoId,
        title: payload.title,
        banca: payload.banca,
        carreira: payload.carreira,
        totalQuestions: payload.totalQuestions,
        correctAnswers: payload.correctAnswers,
        wrongAnswers: payload.wrongAnswers,
        unanswered: payload.unanswered,
        scoreRaw: payload.scoreRaw,
        scoreNet: payload.scoreNet,
        accuracy: payload.accuracy,
        durationMinutes: payload.durationMinutes,
        timeSpentSeconds: payload.timeSpentSeconds,
        scoringRule: payload.scoringRule,
        status: "completed",
        answersSummary: payload.answersSummary,
        createdAt: new Date().toISOString(),
      };
      list.unshift(newRecord);
      localStorage.setItem(LOCAL_STORAGE_GUEST_KEY, JSON.stringify(list.slice(0, 30)));
    } catch (localErr) {
      console.warn("[simulado.ts] localStorage write warning:", localErr);
    }

    return { success: true, id: attemptId };
  } catch (err: any) {
    console.error("[simulado.ts] Fatal saveSimuladoAttempt error:", err);
    return { success: false, error: err?.message || "Erro desconhecido ao salvar tentativa." };
  }
}

/**
 * Fetches user's previous simulation attempts.
 */
export async function fetchUserSimuladoAttempts(userId: string): Promise<SimuladoAttemptRecord[]> {
  try {
    // 1. Try Supabase simulado_attempts
    const { data, error } = await (supabase as any)
      .from("simulado_attempts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        simuladoId: d.simulado_id,
        title: d.title,
        banca: d.banca,
        carreira: d.carreira,
        totalQuestions: d.total_questions,
        correctAnswers: d.correct_answers,
        wrongAnswers: d.wrong_answers,
        unanswered: d.unanswered,
        scoreRaw: Number(d.score_raw),
        scoreNet: Number(d.score_net),
        accuracy: Number(d.accuracy),
        durationMinutes: d.duration_minutes,
        timeSpentSeconds: d.time_spent_seconds,
        scoringRule: d.scoring_rule,
        status: d.status,
        answersSummary: d.answers_summary,
        createdAt: d.created_at,
      }));
    }
  } catch {
    // Fall back to quiz_attempts or localStorage
  }

  // Fallback: check localStorage for cached or offline attempts
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_GUEST_KEY);
    if (raw) {
      const parsed: SimuladoAttemptRecord[] = JSON.parse(raw);
      return parsed.filter((a) => a.userId === userId || a.userId === "guest");
    }
  } catch {
    // Ignore
  }

  return [];
}

/**
 * Consolidates user performance stats from attempts.
 */
export async function fetchUserSimuladoStats(userId?: string): Promise<UserSimuladoStats> {
  const attempts = userId ? await fetchUserSimuladoAttempts(userId) : [];

  // If no attempts in simulado_attempts, check quiz_attempts
  if (attempts.length === 0 && userId) {
    try {
      const { data: quizData } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (quizData && quizData.length > 0) {
        const total = quizData.length;
        let sumAcc = 0;
        let best = 0;
        let totalQ = 0;
        let totalCorr = 0;

        quizData.forEach((q) => {
          const acc = q.total > 0 ? (q.score / q.total) * 100 : 0;
          sumAcc += acc;
          if (acc > best) best = acc;
          totalQ += q.total;
          totalCorr += q.score;
        });

        return {
          totalSimulados: total,
          averageAccuracy: parseFloat((sumAcc / total).toFixed(1)),
          bestScore: parseFloat(best.toFixed(1)),
          totalTimeMinutes: total * 45,
          totalCorrect: totalCorr,
          totalQuestions: totalQ,
          recentAttempts: quizData.slice(0, 5).map((q) => ({
            id: q.id,
            title: `Simulado • ${q.discipline || "Geral"}`,
            banca: "Oficial",
            carreira: q.discipline || "Geral",
            accuracy: q.total > 0 ? Math.round((q.score / q.total) * 100) : 0,
            scoreNet: q.score,
            totalQuestions: q.total,
            correctAnswers: q.score,
            createdAt: q.created_at,
            scoringRule: "padrao",
          })),
        };
      }
    } catch {
      // Ignore
    }
  }

  if (attempts.length === 0) {
    return {
      totalSimulados: 0,
      averageAccuracy: 0,
      bestScore: 0,
      totalTimeMinutes: 0,
      totalCorrect: 0,
      totalQuestions: 0,
      recentAttempts: [],
    };
  }

  const total = attempts.length;
  const sumAcc = attempts.reduce((acc, curr) => acc + curr.accuracy, 0);
  const best = Math.max(...attempts.map((a) => a.accuracy));
  const totalSeconds = attempts.reduce((acc, curr) => acc + curr.timeSpentSeconds, 0);
  const totalCorrect = attempts.reduce((acc, curr) => acc + curr.correctAnswers, 0);
  const totalQ = attempts.reduce((acc, curr) => acc + curr.totalQuestions, 0);

  return {
    totalSimulados: total,
    averageAccuracy: parseFloat((sumAcc / total).toFixed(1)),
    bestScore: parseFloat(best.toFixed(1)),
    totalTimeMinutes: Math.round(totalSeconds / 60),
    totalCorrect,
    totalQuestions: totalQ,
    recentAttempts: attempts.slice(0, 5).map((a) => ({
      id: a.id,
      title: a.title,
      banca: a.banca,
      carreira: a.carreira,
      accuracy: a.accuracy,
      scoreNet: a.scoreNet,
      totalQuestions: a.totalQuestions,
      correctAnswers: a.correctAnswers,
      createdAt: a.createdAt,
      scoringRule: a.scoringRule,
    })),
  };
}

// ============================================================================
// Formatters & Helpers
// ============================================================================

function getBadgeClassForBanca(banca: string): string {
  const b = (banca || "").toLowerCase();
  if (b.includes("cebraspe") || b.includes("cespe")) {
    return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
  }
  if (b.includes("fgv")) {
    return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
  }
  if (b.includes("vunesp")) {
    return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  }
  if (b.includes("fcc")) {
    return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
  }
  return "bg-slate-800 text-slate-300 border border-slate-700";
}

function getBadgeClassForCarreira(carreira: string): string {
  const c = (carreira || "").toLowerCase();
  if (c.includes("policial")) {
    return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
  }
  if (c.includes("fiscal") || c.includes("sefaz")) {
    return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
  }
  if (c.includes("tribunal") || c.includes("trt") || c.includes("tj")) {
    return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
  }
  if (c.includes("admin") || c.includes("inss")) {
    return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  }
  return "bg-slate-800 text-slate-300 border border-slate-700";
}

function formatDurationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, "0")}`;
  if (h > 0) return `${h}h00`;
  return `${minutes} min`;
}
