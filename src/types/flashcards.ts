/**
 * Domain types for Flashcards and SM-2 Spaced Repetition Module (R1)
 */

export type DifficultyRating = "facil" | "medio" | "dificil" | "errei";

export type SM2Rating = 1 | 2 | 3 | 4;
// 1 = Errei (Again), 2 = Difícil (Hard), 3 = Médio/Bom (Good), 4 = Fácil (Easy)

export interface Flashcard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  created_at?: string | undefined;
  difficulty?: "easy" | "medium" | "hard" | undefined;
  review_count?: number | undefined;
  last_reviewed_at?: string | null | undefined;
}

export interface Deck {
  id: string;
  user_id: string;
  title: string;
  discipline: string;
  topic?: string | null | undefined;
  created_at: string;
}

export interface DeckWithStats extends Deck {
  cardCount: number;
  dueCount: number;
  mastery: number; // 0-100 percentage
}

export interface ReviewLog {
  id: string;
  user_id: string;
  card_id: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  next_review_date: string;
  last_rating: SM2Rating;
  reviewed_at: string;
}

export interface SM2ReviewResult {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  nextReviewDate: string;
}

export interface FlashcardWithReview extends Flashcard {
  review?:
    | {
        interval_days: number;
        ease_factor: number;
        repetitions: number;
        next_review_date?: string | undefined;
      }
    | undefined;
}

export interface FlashcardStudySessionState {
  deckId: string;
  deckTitle: string;
  cards: FlashcardWithReview[];
  currentIndex: number;
  isFlipped: boolean;
  isCompleted: boolean;
  history: Array<{
    cardId: string;
    rating: SM2Rating;
    timeSpentMs: number;
  }>;
  summary: {
    totalReviewed: number;
    againCount: number;
    hardCount: number;
    goodCount: number;
    easyCount: number;
  };
}
