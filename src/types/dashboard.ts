/**
 * Domain types for Dashboard, Visual Analytics and Performance KPIs (R3)
 */

export interface DashboardStats {
  accuracy: number; // 0 to 100 percentage
  accuracyChangeWeekly: number; // e.g. +3.8
  simuladosCount: number;
  averageSimuladoScore: number; // e.g. 84
  flashcardsReviewed: number;
  flashcardRetentionRate: number; // e.g. 92
  flashcardsDueToday: number;
  editalProgressPercent: number; // e.g. 68
  editalTopicsCovered: number;
  editalTotalTopics: number;
  weeklyGoalHours: number;
  completedGoalHours: number;
  streakDays: number;
  totalXP?: number | undefined;
  userLevel?: number | undefined;
}

export interface ExamAccuracyDataPoint {
  examName: string;
  date: string;
  accuracy: number; // 0 to 100
  questionsCount: number;
  target?: number | undefined; // target cutoff score, e.g. 75
  score?: number | undefined;
  total?: number | undefined;
}

export interface SubjectProgress {
  discipline: string;
  accuracy: number; // 0 to 100 percentage
  targetAccuracy: number; // e.g. 75
  questionsAnswered: number;
  statusTone: "primary" | "success" | "gold" | "muted";
}

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  to: string;
  badgeText: string;
  badgeTone?: "primary" | "secondary" | "gold" | "destructive" | undefined;
  iconName: string;
}

export interface SimuladoRecentAttempt {
  id: string;
  title: string;
  discipline?: string | null | undefined;
  score: number;
  total: number;
  accuracyPercentage: number;
  attemptType: "simulado" | "treino_rapido" | "prova_oficial";
  completedAt: string;
}
