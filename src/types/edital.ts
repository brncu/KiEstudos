/**
 * Domain types for Edital Verticalizado / Syllabus Tracker Module (R2)
 */

export type StudyStatus = "nao_iniciado" | "em_andamento" | "concluido";

export interface EditalTopic {
  id: string;
  exam_name: string;
  discipline: string;
  topic: string;
  subtopic?: string | null | undefined;
  weight?: number | null | undefined;
  order_index?: number | undefined;
  theory_read?: boolean | undefined;
  questions_solved?: boolean | undefined;
  reviewed?: boolean | undefined;
}

export interface TopicProgress {
  id?: string | undefined;
  user_id?: string | undefined;
  topic_id: string;
  theory_read: boolean;
  summary_made?: boolean | undefined;
  exercises_done: number;
  reviews_count: number;
  confidence_level: number; // 0 to 5
  updated_at?: string | undefined;
}

export interface EditalTopicWithProgress extends EditalTopic {
  progress?: TopicProgress | undefined;
  status: StudyStatus;
}

export interface EditalDiscipline {
  name: string;
  code?: string | undefined;
  topics: EditalTopicWithProgress[];
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  percentComplete: number;
}

export interface EditalGlobalStats {
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  percentComplete: number;
  weightedScore?: number | undefined;
}

export interface TopicCheckpoints {
  theory_read: boolean;
  questions_solved: boolean;
  reviewed: boolean;
}
