import React, { useState, useMemo } from "react";
import { DeckItem } from "./types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Layers,
  Plus,
  Search,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";
import { CreateDeckDialog } from "./CreateDeckDialog";
import { cn } from "@/lib/utils";

export interface FlashcardDeckSelectorProps {
  decks: DeckItem[];
  onSelectDeck: (deck: DeckItem) => void;
  onCreateDeck: (deckData: {
    title: string;
    discipline: string;
    topic?: string | undefined;
    description?: string | undefined;
  }) => void;
  isCreatingDeck?: boolean | undefined;
}

export function FlashcardDeckSelector({
  decks,
  onSelectDeck,
  onCreateDeck,
  isCreatingDeck = false,
}: FlashcardDeckSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Extract unique disciplines
  const disciplines = useMemo(() => {
    const set = new Set<string>();
    decks.forEach((d) => {
      if (d.discipline) set.add(d.discipline);
    });
    return Array.from(set).sort();
  }, [decks]);

  // Filtered decks
  const filteredDecks = useMemo(() => {
    return decks.filter((deck) => {
      const matchesSearch =
        searchQuery === "" ||
        deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (deck.topic && deck.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
        deck.discipline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (deck.description && deck.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDiscipline =
        selectedDiscipline === "all" || deck.discipline === selectedDiscipline;

      return matchesSearch && matchesDiscipline;
    });
  }, [decks, searchQuery, selectedDiscipline]);

  // Total stats across decks
  const totalCards = decks.reduce((acc, d) => acc + d.cardCount, 0);
  const totalDue = decks.reduce((acc, d) => acc + d.dueCount, 0);

  return (
    <div className="space-y-6" role="region" aria-label="Seleção de baralhos de flashcards">
      {/* Top Header & Metrics Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Brain className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Flashcards Interativos
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Memorização espaçada ativa (Algoritmo SM-2) com cartões 3D
              </p>
            </div>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Novo Baralho</span>
        </Button>
      </div>

      {/* Global Quick Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-border bg-card">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
            Baralhos Ativos
          </span>
          <p className="text-xl font-black text-foreground mt-0.5">{decks.length}</p>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
            Total de Cartões
          </span>
          <p className="text-xl font-black text-primary mt-0.5">{totalCards}</p>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
            Prontos para Estudo
          </span>
          <p className="text-xl font-black text-secondary mt-0.5">{totalDue}</p>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
            Método de Repetição
          </span>
          <p className="text-sm font-bold text-gold mt-1 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            SM-2 Adaptativo
          </p>
        </div>
      </div>

      {/* Search & Discipline Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Buscar por baralho, matéria ou assunto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border focus-visible:ring-primary text-sm"
              aria-label="Buscar baralhos"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedDiscipline("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer",
              selectedDiscipline === "all"
                ? "bg-primary text-primary-foreground font-bold shadow-sm"
                : "bg-surface-container-high/60 text-muted-foreground hover:text-foreground hover:bg-surface-container-high",
            )}
          >
            Todos ({decks.length})
          </button>

          {disciplines.map((disc) => {
            const count = decks.filter((d) => d.discipline === disc).length;
            const isSelected = selectedDiscipline === disc;
            return (
              <button
                key={disc}
                type="button"
                onClick={() => setSelectedDiscipline(disc)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "bg-surface-container-high/60 text-muted-foreground hover:text-foreground hover:bg-surface-container-high",
                )}
              >
                {disc} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Decks Grid */}
      {filteredDecks.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-border bg-card/50">
          <Layers className="h-10 w-10 mx-auto text-muted-foreground/60 mb-3" aria-hidden="true" />
          <h3 className="text-base font-bold text-foreground">Nenhum baralho encontrado</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Não encontramos nenhum baralho correspondente aos filtros selecionados. Tente ajustar a
            busca ou crie um novo baralho.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setSelectedDiscipline("all");
            }}
            className="mt-4 text-xs"
          >
            Limpar Filtros
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDecks.map((deck) => {
            return (
              <Card
                key={deck.id}
                className="flex flex-col justify-between border-border bg-card hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className="bg-primary/10 text-primary border-primary/20 text-[11px] font-semibold"
                    >
                      <BookOpen className="h-3 w-3 mr-1" aria-hidden="true" />
                      {deck.discipline}
                    </Badge>
                    {deck.isDefault && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-surface-container-high text-muted-foreground">
                        Oficial
                      </span>
                    )}
                  </div>

                  <CardTitle className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                    {deck.title}
                  </CardTitle>

                  {deck.topic && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {deck.topic}
                    </p>
                  )}

                  {deck.description && (
                    <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                      {deck.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="p-5 pt-0 pb-3 space-y-3">
                  {/* Stats Row */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        <strong className="text-foreground">{deck.cardCount}</strong> cartões
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
                      <span className="text-secondary font-semibold">
                        {deck.dueCount} para estudo
                      </span>
                    </div>
                  </div>

                  {/* Mastery Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Domínio estimado</span>
                      <span className="font-semibold text-secondary font-mono">
                        {deck.mastery}%
                      </span>
                    </div>
                    <Progress value={deck.mastery} className="h-1.5 bg-surface-container-high" />
                  </div>
                </CardContent>

                <CardFooter className="p-5 pt-2 border-t border-border/40">
                  <Button
                    type="button"
                    onClick={() => onSelectDeck(deck)}
                    disabled={deck.cardCount === 0}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold gap-2 text-xs h-9 cursor-pointer"
                  >
                    <span>Praticar Flashcards</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Deck Dialog */}
      <CreateDeckDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreateDeck={onCreateDeck}
        isPending={isCreatingDeck}
      />
    </div>
  );
}
