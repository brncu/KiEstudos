import { supabase } from "@/lib/supabase";

export interface Deck {
  id: string;
  user_id: string;
  title: string;
  discipline?: string;
  topic?: string;
  created_at: string;
}

export interface DeckWithStats extends Deck {
  cardCount: number;
  dueCount: number;
  mastery: number;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  card_id: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  next_review_date: string;
  last_rating: number;
  reviewed_at: string;
}

export interface FlashcardWithReview extends Flashcard {
  review: {
    interval_days: number;
    ease_factor: number;
    repetitions: number;
  };
}

export async function fetchDecks(userId: string): Promise<Deck[]> {
  const { data, error } = await supabase
    .from("flashcard_decks")
    .select(`*`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Deck[];
}

export async function fetchDecksWithStats(userId: string): Promise<DeckWithStats[]> {
  const { data: decks, error: decksError } = await supabase
    .from("flashcard_decks")
    .select("id, title, discipline, topic, created_at, user_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (decksError) throw decksError;

  const { data: cards, error: cardsError } = await supabase
    .from("flashcards")
    .select("id, deck_id");

  if (cardsError) throw cardsError;

  const { data: reviews, error: reviewsError } = await supabase
    .from("user_flashcard_reviews")
    .select("card_id, next_review_date, repetitions")
    .eq("user_id", userId);

  if (reviewsError) throw reviewsError;

  const today = new Date().toISOString();

  return (decks as Deck[]).map((deck) => {
    const deckCards = cards.filter((c) => c.deck_id === deck.id);
    const cardIds = deckCards.map((c) => c.id);
    const deckReviews = reviews.filter((r) => cardIds.includes(r.card_id));

    const dueCount =
      deckReviews.filter((r) => r.next_review_date <= today).length +
      (deckCards.length - deckReviews.length); // Cards never reviewed are due

    const mastery =
      deckCards.length === 0
        ? 0
        : Math.round(
            (deckReviews.filter((r) => r.repetitions > 2).length / deckCards.length) * 100,
          );

    return {
      ...deck,
      cardCount: deckCards.length,
      dueCount,
      mastery,
    };
  });
}

export async function fetchCards(deckId: string): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("deck_id", deckId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Flashcard[];
}

export async function fetchDueCards(
  userId: string,
  deckId: string,
): Promise<FlashcardWithReview[]> {
  const { data: cards, error: cardsError } = await supabase
    .from("flashcards")
    .select("*")
    .eq("deck_id", deckId);

  if (cardsError) throw cardsError;

  const { data: reviews, error: reviewsError } = await supabase
    .from("user_flashcard_reviews")
    .select("*")
    .eq("user_id", userId);

  if (reviewsError) throw reviewsError;

  const today = new Date().toISOString();

  return cards
    .filter((card) => {
      const review = reviews.find((r) => r.card_id === card.id);
      if (!review) return true;
      return review.next_review_date <= today;
    })
    .map((card) => {
      const review = reviews.find((r) => r.card_id === card.id);
      return {
        ...card,
        review: review || { interval_days: 0, ease_factor: 2.5, repetitions: 0 },
      } as FlashcardWithReview;
    });
}

export async function createDeck({
  userId,
  title,
  discipline,
  topic,
}: {
  userId: string;
  title: string;
  discipline?: string;
  topic?: string;
}): Promise<Deck> {
  const { data, error } = await supabase
    .from("flashcard_decks")
    .insert({ user_id: userId, title, discipline: discipline ?? "Geral", topic: topic ?? null })
    .select()
    .single();

  if (error) throw error;
  return data as Deck;
}

export async function createCard({
  deckId,
  front,
  back,
}: {
  deckId: string;
  front: string;
  back: string;
}): Promise<Flashcard> {
  const { data, error } = await supabase
    .from("flashcards")
    .insert({ deck_id: deckId, front, back })
    .select()
    .single();

  if (error) throw error;
  return data as Flashcard;
}

export async function saveReview({
  userId,
  cardId,
  rating,
  interval,
  easeFactor,
  repetitions,
  nextReviewDate,
}: {
  userId: string;
  cardId: string;
  rating: number;
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReviewDate: string;
}): Promise<Review> {
  // Upsert review
  const { data: existing, error: fetchError } = await supabase
    .from("user_flashcard_reviews")
    .select("id")
    .eq("user_id", userId)
    .eq("card_id", cardId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing) {
    const { data, error } = await supabase
      .from("user_flashcard_reviews")
      .update({
        interval_days: interval,
        ease_factor: easeFactor,
        repetitions,
        next_review_date: nextReviewDate,
        last_rating: rating,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as Review;
  } else {
    const { data, error } = await supabase
      .from("user_flashcard_reviews")
      .insert({
        user_id: userId,
        card_id: cardId,
        interval_days: interval,
        ease_factor: easeFactor,
        repetitions,
        next_review_date: nextReviewDate,
        last_rating: rating,
        reviewed_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data as Review;
  }
}
