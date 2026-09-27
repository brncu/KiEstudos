/**
 * Types and Interfaces for Concurso Foco, Focus Management, and Edital Mágico
 * Location: src/types/concurso.ts
 */

export type ConcursoSphere = "federal" | "estadual" | "municipal";

export type ConcursoEducation = "fundamental" | "medio" | "tecnico" | "superior";

export type ConcursoStatus =
  "inscricoes_abertas" | "edital_publicado" | "autorizado" | "previsto" | "encerrado";

export interface ProgrammaticSubject {
  discipline: string;
  weight?: number | undefined;
  topicsCount?: number | undefined;
  topics: string[];
  importance?: "alta" | "media" | "baixa" | undefined;
}

export interface SummaryAIData {
  resumo?: string | undefined;
  destaques?: string[] | undefined;
  vagas_detalhadas?: string | undefined;
  estrategia?: string | undefined;
}

export interface ConcursoExam {
  id: string;
  slug: string;
  title: string;
  institution: string;
  role: string;
  exam_board: string | null;
  sphere: ConcursoSphere;
  state: string; // "BR" or UF ("SP", "RJ", "DF", etc.)
  city?: string | null | undefined;
  education_level: ConcursoEducation;
  status: ConcursoStatus;
  vacancies: number;
  vacancies_reserve?: number | undefined;
  salary: number | null;
  registration_fee?: number | null | undefined;
  registration_start_date?: string | null | undefined;
  registration_end_date?: string | null | undefined;
  exam_date?: string | null | undefined;
  registration_link: string; // Official registration URL
  edital_url?: string | null | undefined;
  banner_url?: string | null | undefined;
  summary_ai?: SummaryAIData | any;
  programmatic_content?: ProgrammaticSubject[] | any;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

export interface ConcursoFilterState {
  search: string;
  sphere: string; // "all" | ConcursoSphere
  state: string; // "all" | UF
  education_level: string; // "all" | ConcursoEducation
  status: string; // "all" | ConcursoStatus
  exam_date_range?: string | undefined;
}

export interface AISyllabusSummary {
  examTitle: string;
  institution: string;
  banca: string;
  vacancies: {
    total: number;
    immediate: number;
    reserve: number;
    breakdown: string;
    cotasPCD?: string | undefined;
    cotasNegros?: string | undefined;
  };
  remuneration: {
    initialSalary: string;
    benefits?: string | undefined;
    totalEstimated: string;
  };
  registration: {
    officialLink: string;
    fee: string;
    startDate: string;
    endDate: string;
    status: "abertas" | "previstas" | "encerradas" | "em_breve";
  };
  keyDates: Array<{
    label: string;
    date: string;
    type: "inscricao" | "pagamento" | "isencao" | "prova" | "gabarito" | "resultado";
    description?: string | undefined;
    daysRemaining?: number | undefined;
  }>;
  programmaticContent: Array<{
    discipline: string;
    weight: number;
    topics: string[];
    importance: "alta" | "media" | "baixa";
  }>;
  studyStrategy: {
    focusAreas: string[];
    tips: string[];
    estimatedHoursRecommended: number;
  };
  generatedAt: string;
  source: "gemini_ai" | "cached_db" | "deterministic_fallback";
}

export interface ProfileTargetExam {
  id: string;
  full_name: string | null;
  target_exam: string | null;
  target_exam_id: string | null;
  weekly_goal_hours: number | null;
  onboarding_completed: boolean;
}

export interface UseTargetExamReturn {
  profile: ProfileTargetExam | null;
  activeExam: ConcursoExam | null;
  allExams: ConcursoExam[];
  isLoading: boolean;
  needsOnboarding: boolean;
  setTargetExam: (concurso: ConcursoExam) => Promise<ConcursoExam>;
  isUpdating: boolean;
}
