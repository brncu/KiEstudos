import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import {
  DeckItem,
  FlashcardItem,
  FlashcardDifficulty,
  SessionStats,
  DEFAULT_DECKS,
  FlashcardCard,
  FlashcardProgress,
  FlashcardDeckSelector,
  FlashcardSessionSummary,
  AddCardDialog,
} from "@/components/flashcards";
import {
  fetchDecksWithStats,
  fetchDueCards,
  createDeck as apiCreateDeck,
  createCard as apiCreateCard,
  saveReview,
} from "@/lib/flashcards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Sparkles, Layers } from "lucide-react";

export const Route = createFileRoute("/flashcards")({
  head: () => ({
    meta: [
      { title: "Flashcards Interativos — KiEstudos" },
      {
        name: "description",
        content:
          "Revise conteúdos de concursos públicos com flashcards interativos em 3D e repetição espaçada SM-2.",
      },
    ],
  }),
  component: FlashcardsPage,
});

function calculateSM2(
  difficulty: FlashcardDifficulty,
  easeFactor = 2.5,
  interval = 0,
  repetitions = 0,
) {
  // Map difficulty to SM-2 rating (1 to 5)
  const rating = difficulty === "hard" ? 1 : difficulty === "medium" ? 3 : 5;

  let newRepetitions = repetitions;
  let newInterval = interval;
  let newEaseFactor = easeFactor;

  if (rating < 3) {
    newRepetitions = 0;
    newInterval = 1;
  } else {
    if (newRepetitions === 0) {
      newInterval = 1;
    } else if (newRepetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(newInterval * newEaseFactor);
    }
    newRepetitions += 1;
  }

  newEaseFactor = Math.max(
    1.3,
    newEaseFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)),
  );

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    rating,
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions,
    nextReviewDate: nextReviewDate.toISOString(),
  };
}

export function FlashcardsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Local state for custom created decks and card overrides
  const [localCustomDecks, setLocalCustomDecks] = useState<DeckItem[]>([]);
  const [deckCardOverrides, setDeckCardOverrides] = useState<Record<string, FlashcardItem[]>>({});

  // Active study session state
  const [selectedDeck, setSelectedDeck] = useState<DeckItem | null>(null);
  const [sessionCards, setSessionCards] = useState<FlashcardItem[]>([]);
  const [hardCardsHistory, setHardCardsHistory] = useState<FlashcardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);

  // Session performance stats
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalReviewed: 0,
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0,
    streak: 0,
    bestStreak: 0,
  });

  // Query remote user decks if authenticated
  const { data: remoteDecks, isLoading: isRemoteDecksLoading } = useQuery({
    queryKey: ["decks", user?.id],
    queryFn: () => fetchDecksWithStats(user!.id),
    enabled: !!user?.id,
  });

  // Query remote cards if a remote deck is selected
  const { data: remoteDueCards } = useQuery({
    queryKey: ["due-cards", selectedDeck?.id],
    queryFn: () => fetchDueCards(user!.id, selectedDeck!.id),
    enabled: !!user?.id && !!selectedDeck && !selectedDeck.isDefault,
  });

  // Mutations
  const createDeckMutation = useMutation({
    mutationFn: apiCreateDeck,
    onSuccess: (newDeck) => {
      queryClient.invalidateQueries({ queryKey: ["decks", user?.id] });
      const converted: DeckItem = {
        id: newDeck.id,
        user_id: newDeck.user_id,
        title: newDeck.title,
        discipline: newDeck.discipline || "Geral",
        topic: newDeck.topic ?? undefined,
        cardCount: 0,
        dueCount: 0,
        mastery: 0,
        cards: [],
        created_at: newDeck.created_at,
      };
      setLocalCustomDecks((prev) => [converted, ...prev]);
    },
  });

  const createCardMutation = useMutation({
    mutationFn: apiCreateCard,
    onSuccess: (newCard) => {
      queryClient.invalidateQueries({ queryKey: ["due-cards", selectedDeck?.id] });
      queryClient.invalidateQueries({ queryKey: ["decks", user?.id] });
      if (selectedDeck) {
        const item: FlashcardItem = {
          id: newCard.id,
          deck_id: newCard.deck_id,
          front: newCard.front,
          back: newCard.back,
        };
        setDeckCardOverrides((prev) => ({
          ...prev,
          [selectedDeck.id]: [...(prev[selectedDeck.id] || selectedDeck.cards || []), item],
        }));
        setSessionCards((prev) => [...prev, item]);
      }
    },
  });

  const saveReviewMutation = useMutation({
    mutationFn: saveReview,
  });

  // Merge default decks with local custom decks and remote user decks
  const allDecks = useMemo<DeckItem[]>(() => {
    const list: DeckItem[] = [...DEFAULT_DECKS];

    // Add local custom decks
    localCustomDecks.forEach((ld) => {
      if (!list.some((d) => d.id === ld.id)) {
        list.unshift(ld);
      }
    });

    // Add remote Supabase decks if available
    if (remoteDecks && remoteDecks.length > 0) {
      remoteDecks.forEach((rd) => {
        if (!list.some((d) => d.id === rd.id)) {
          list.unshift({
            id: rd.id,
            user_id: rd.user_id,
            title: rd.title,
            discipline: rd.discipline || "Geral",
            topic: rd.topic ?? undefined,
            cardCount: rd.cardCount,
            dueCount: rd.dueCount,
            mastery: rd.mastery,
            cards: [],
            isDefault: false,
            created_at: rd.created_at,
          });
        }
      });
    }

    // Apply any local card overrides to deck counts
    return list.map((deck) => {
      const overrides = deckCardOverrides[deck.id];
      if (overrides) {
        return {
          ...deck,
          cardCount: overrides.length,
          dueCount: overrides.length,
          cards: overrides,
        };
      }
      return deck;
    });
  }, [remoteDecks, localCustomDecks, deckCardOverrides]);

  // Start study session on a selected deck
  const handleSelectDeck = useCallback(
    (deck: DeckItem) => {
      setSelectedDeck(deck);
      const cardsToUse = deckCardOverrides[deck.id] || deck.cards || [];

      // If it's a remote deck with loaded cards, use them
      if (!deck.isDefault && remoteDueCards && remoteDueCards.length > 0) {
        const mapped: FlashcardItem[] = remoteDueCards.map((rc) => ({
          id: rc.id,
          deck_id: rc.deck_id,
          front: rc.front,
          back: rc.back,
          ease_factor: rc.review.ease_factor,
          interval_days: rc.review.interval_days,
          repetitions: rc.review.repetitions,
        }));
        setSessionCards(mapped);
      } else {
        setSessionCards(cardsToUse);
      }

      setCurrentIndex(0);
      setFlipped(false);
      setHardCardsHistory([]);
      setSessionStats({
        totalReviewed: 0,
        easyCount: 0,
        mediumCount: 0,
        hardCount: 0,
        streak: 0,
        bestStreak: 0,
      });
    },
    [deckCardOverrides, remoteDueCards],
  );

  // Handle Card Flip
  const handleFlip = useCallback(() => {
    setFlipped((prev) => !prev);
  }, []);

  // Handle Difficulty Rating
  const handleRate = useCallback(
    async (difficulty: FlashcardDifficulty) => {
      const currentCard = sessionCards[currentIndex];
      if (!currentCard) return;

      // Track if card was hard for later targeted review
      if (difficulty === "hard") {
        setHardCardsHistory((prev) => [...prev, currentCard]);
      }

      // Update session statistics
      setSessionStats((prev) => {
        const isCorrect = difficulty === "easy" || difficulty === "medium";
        const newStreak = isCorrect ? prev.streak + 1 : 0;
        return {
          totalReviewed: prev.totalReviewed + 1,
          easyCount: difficulty === "easy" ? prev.easyCount + 1 : prev.easyCount,
          mediumCount: difficulty === "medium" ? prev.mediumCount + 1 : prev.mediumCount,
          hardCount: difficulty === "hard" ? prev.hardCount + 1 : prev.hardCount,
          streak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
        };
      });

      // If user is authenticated and this is a registered card in Supabase, persist review
      if (user?.id && !selectedDeck?.isDefault) {
        const sm2 = calculateSM2(
          difficulty,
          currentCard.ease_factor,
          currentCard.interval_days,
          currentCard.repetitions,
        );
        try {
          await saveReviewMutation.mutateAsync({
            userId: user.id,
            cardId: currentCard.id,
            rating: sm2.rating,
            interval: sm2.interval,
            easeFactor: sm2.easeFactor,
            repetitions: sm2.repetitions,
            nextReviewDate: sm2.nextReviewDate,
          });
        } catch {
          // Graceful fallback for demo or offline review
        }
      }

      // Turn card back and move to next
      setFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    },
    [sessionCards, currentIndex, user, selectedDeck, saveReviewMutation],
  );

  // Restart session
  const handleRestartSession = useCallback(
    (onlyHard = false) => {
      if (onlyHard && hardCardsHistory.length > 0) {
        setSessionCards([...hardCardsHistory]);
      } else if (selectedDeck) {
        const cardsToUse = deckCardOverrides[selectedDeck.id] || selectedDeck.cards || [];
        setSessionCards(cardsToUse);
      }
      setCurrentIndex(0);
      setFlipped(false);
      setHardCardsHistory([]);
      setSessionStats({
        totalReviewed: 0,
        easyCount: 0,
        mediumCount: 0,
        hardCount: 0,
        streak: 0,
        bestStreak: 0,
      });
    },
    [hardCardsHistory, selectedDeck, deckCardOverrides],
  );

  // Return to decks
  const handleBackToDecks = useCallback(() => {
    setSelectedDeck(null);
    setSessionCards([]);
    setCurrentIndex(0);
    setFlipped(false);
  }, []);

  // Create new deck handler
  const handleCreateDeck = useCallback(
    async (deckData: {
      title: string;
      discipline: string;
      topic?: string | undefined;
      description?: string | undefined;
    }) => {
      if (user?.id) {
        await createDeckMutation.mutateAsync({
          userId: user.id,
          title: deckData.title,
          discipline: deckData.discipline,
          ...(deckData.topic ? { topic: deckData.topic } : {}),
        });
      } else {
        // Local mode
        const localDeck: DeckItem = {
          id: `local-deck-${Date.now()}`,
          title: deckData.title,
          discipline: deckData.discipline,
          topic: deckData.topic,
          description: deckData.description,
          cardCount: 0,
          dueCount: 0,
          mastery: 0,
          cards: [],
          created_at: new Date().toISOString(),
        };
        setLocalCustomDecks((prev) => [localDeck, ...prev]);
      }
    },
    [user, createDeckMutation],
  );

  // Add card to current deck handler
  const handleAddCard = useCallback(
    async (cardData: {
      front: string;
      back: string;
      hint?: string | undefined;
      explanation?: string | undefined;
    }) => {
      if (!selectedDeck) return;

      if (user?.id && !selectedDeck.isDefault) {
        await createCardMutation.mutateAsync({
          deckId: selectedDeck.id,
          front: cardData.front,
          back: cardData.back,
        });
      } else {
        // Local deck or default deck expansion
        const newCard: FlashcardItem = {
          id: `card-${Date.now()}`,
          deck_id: selectedDeck.id,
          front: cardData.front,
          back: cardData.back,
          hint: cardData.hint,
          explanation: cardData.explanation,
          discipline: selectedDeck.discipline,
          topic: selectedDeck.topic,
        };
        setDeckCardOverrides((prev) => ({
          ...prev,
          [selectedDeck.id]: [...(prev[selectedDeck.id] || selectedDeck.cards || []), newCard],
        }));
        setSessionCards((prev) => [...prev, newCard]);
      }
    },
    [selectedDeck, user, createCardMutation],
  );

  const isSessionFinished = sessionCards.length > 0 && currentIndex >= sessionCards.length;
  const currentCard = sessionCards[currentIndex];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Navigation sidebar */}
      <AppNav />

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen lg:pl-72 w-full flex flex-col pt-4 lg:pt-0">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col justify-start">
          {!selectedDeck ? (
            /* ================= VIEW 1: DECK SELECTOR ================= */
            <FlashcardDeckSelector
              decks={allDecks}
              onSelectDeck={handleSelectDeck}
              onCreateDeck={handleCreateDeck}
              isCreatingDeck={createDeckMutation.isPending}
            />
          ) : (
            /* ================= VIEW 2: STUDY SESSION ================= */
            <div className="w-full space-y-6 flex-1 flex flex-col">
              {/* Study Header: Back button & Add Card button */}
              <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToDecks}
                  className="text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Voltar aos Baralhos</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="hidden sm:inline-flex text-xs bg-primary/10 text-primary border-primary/20"
                  >
                    <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
                    Modo Estudo Ativo
                  </Badge>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddCardOpen(true)}
                    className="h-8 text-xs gap-1.5 border-border hover:bg-surface-container-high cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Adicionar Cartão</span>
                  </Button>
                </div>
              </div>

              {sessionCards.length === 0 ? (
                /* Empty deck state */
                <div className="my-auto py-16 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-container-high flex items-center justify-center text-muted-foreground">
                    <Layers className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h3 className="text-lg font-bold text-foreground">
                      Este baralho ainda não tem cartões
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Adicione seu primeiro flashcard para começar a praticar.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setIsAddCardOpen(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                  >
                    <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    Adicionar Primeiro Cartão
                  </Button>
                </div>
              ) : isSessionFinished ? (
                /* Session finished summary */
                <div className="my-auto py-4">
                  <FlashcardSessionSummary
                    deckTitle={selectedDeck.title}
                    stats={sessionStats}
                    onRestartSession={handleRestartSession}
                    onBackToDecks={handleBackToDecks}
                  />
                </div>
              ) : (
                /* Active Study Mode: Progress Bar + 3D Card */
                <div className="space-y-6 max-w-3xl mx-auto w-full flex-1 flex flex-col justify-center">
                  <FlashcardProgress
                    currentIndex={currentIndex}
                    totalCards={sessionCards.length}
                    stats={sessionStats}
                    deckTitle={selectedDeck.title}
                  />

                  {currentCard && (
                    <FlashcardCard
                      card={currentCard}
                      currentIndex={currentIndex}
                      totalCards={sessionCards.length}
                      flipped={flipped}
                      onFlip={handleFlip}
                      onRate={handleRate}
                    />
                  )}
                </div>
              )}

              {/* Add Card Dialog */}
              <AddCardDialog
                open={isAddCardOpen}
                onOpenChange={setIsAddCardOpen}
                deckTitle={selectedDeck.title}
                onAddCard={handleAddCard}
                isPending={createCardMutation.isPending}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
export default FlashcardsPage;
