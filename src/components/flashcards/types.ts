export type FlashcardDifficulty = "easy" | "medium" | "hard";

export interface FlashcardItem {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  hint?: string | undefined;
  explanation?: string | undefined;
  discipline?: string | undefined;
  topic?: string | undefined;
  difficulty?: FlashcardDifficulty | undefined;
  repetitions?: number | undefined;
  interval_days?: number | undefined;
  ease_factor?: number | undefined;
  last_reviewed_at?: string | null | undefined;
}

export interface DeckItem {
  id: string;
  user_id?: string | undefined;
  title: string;
  discipline: string;
  topic?: string | undefined;
  description?: string | undefined;
  cardCount: number;
  dueCount: number;
  mastery: number; // 0 - 100
  cards: FlashcardItem[];
  isDefault?: boolean | undefined;
  created_at?: string | undefined;
}

export interface SessionStats {
  totalReviewed: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  streak: number;
  bestStreak: number;
}
