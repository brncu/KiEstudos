/**
 * Domain types for Edital Verticalizado (Syllabus Tracker)
 * Supporting hierarchical disciplines, topics, weights, study checkpoints, and filtering.
 */

export type StudyCheckpoint = "theory_read" | "questions_solved" | "reviewed";

export type StatusFilter = "todos" | "concluidos" | "em_andamento" | "nao_iniciados";

export interface EditalTopic {
  id: string;
  exam_name: string;
  discipline: string;
  disciplineCode: string;
  topic: string;
  subtopic?: string | null;
  weight: number; // e.g. 1.0, 1.5, 2.0
  order_index: number;
  theory_read: boolean;
  questions_solved: boolean;
  reviewed: boolean;
}

export interface EditalDiscipline {
  id: string;
  name: string;
  code: string;
  iconName: string;
  weightAvg: number;
  topics: EditalTopic[];
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  notStartedTopics: number;
  totalCheckpoints: number;
  completedCheckpoints: number;
  percentComplete: number; // 0 to 100
}

export interface EditalGlobalStats {
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  notStartedTopics: number;
  totalCheckpoints: number;
  completedCheckpoints: number;
  percentComplete: number; // 0 to 100
  totalDisciplines: number;
  weightedPercentComplete?: number;
}

export type TopicProgressMap = Record<
  string,
  {
    theory_read: boolean;
    questions_solved: boolean;
    reviewed: boolean;
  }
>;
