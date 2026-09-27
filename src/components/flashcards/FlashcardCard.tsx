import React, { useState, useEffect, useCallback, useRef } from "react";
import { FlashcardItem, FlashcardDifficulty } from "./types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  RotateCw,
  Lightbulb,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FlashcardCardProps {
  card: FlashcardItem;
  currentIndex: number;
  totalCards: number;
  flipped: boolean;
  onFlip: () => void;
  onRate: (difficulty: FlashcardDifficulty) => void;
}

export function FlashcardCard({
  card,
  currentIndex,
  totalCards,
  flipped,
  onFlip,
  onRate,
}: FlashcardCardProps) {
  const [showHint, setShowHint] = useState(false);
  const backFirstButtonRef = useRef<HTMLButtonElement>(null);
  const frontTriggerRef = useRef<HTMLDivElement>(null);

  // Reset hint state when card changes
  useEffect(() => {
    setShowHint(false);
  }, [card.id]);

  // Focus management: when flipped to back, focus the medium/easy rating button; when back to front, focus front
  useEffect(() => {
    if (flipped) {
      const timer = setTimeout(() => {
        backFirstButtonRef.current?.focus();
      }, 250);
      return () => clearTimeout(timer);
    } else {
      frontTriggerRef.current?.focus();
      return undefined;
    }
  }, [flipped]);

  // Global keydown shortcuts:
  // Space/Enter: flip (if not focusing an input or button)
  // 1: Difícil, 2: Médio, 3: Fácil (when flipped)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      const isInput = activeTag === "input" || activeTag === "textarea" || activeTag === "select";
      if (isInput) return;

      if (!flipped) {
        if (e.code === "Space" || e.key === "Enter") {
          e.preventDefault();
          onFlip();
        }
      } else {
        if (e.key === "1") {
          e.preventDefault();
          onRate("hard");
        } else if (e.key === "2") {
          e.preventDefault();
          onRate("medium");
        } else if (e.key === "3") {
          e.preventDefault();
          onRate("easy");
        } else if (e.key === "Escape") {
          e.preventDefault();
          onFlip();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipped, onFlip, onRate]);

  const handleFrontKeyDown = (e: React.KeyboardEvent) => {
    if (!flipped && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onFlip();
    }
  };

  return (
    <div className="w-full perspective-1000 select-none py-2">
      <div
        className={cn(
          "relative min-h-[420px] sm:min-h-[440px] w-full rounded-2xl border border-border bg-card shadow-xl transition-transform duration-500 transform-style-3d",
          flipped ? "rotate-y-180" : "",
        )}
      >
        {/* ===================== FRONT FACE ===================== */}
        <div
          className={cn(
            "absolute inset-0 backface-hidden rounded-2xl flex flex-col justify-between p-6 sm:p-8 bg-card border border-border/80 transition-opacity duration-200",
            flipped ? "pointer-events-none opacity-0" : "opacity-100",
          )}
        >
          {/* Front Header */}
          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold"
              >
                <BookOpen className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                {card.discipline || "Conhecimentos Gerais"}
              </Badge>
              {card.topic && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-surface-container-high text-on-surface-variant"
                >
                  {card.topic}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {card.hint && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHint((prev) => !prev);
                  }}
                  className={cn(
                    "h-8 px-2.5 text-xs gap-1.5 transition-colors",
                    showHint ? "text-gold bg-gold/10" : "text-muted-foreground hover:text-gold",
                  )}
                  aria-label={showHint ? "Ocultar dica mnemônica" : "Ver dica mnemônica"}
                  aria-expanded={showHint}
                >
                  <Lightbulb className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{showHint ? "Ocultar Dica" : "Ver Dica"}</span>
                </Button>
              )}
              <span className="text-xs font-mono font-medium text-muted-foreground">
                {currentIndex + 1} / {totalCards}
              </span>
            </div>
          </div>

          {/* Hint Banner (Collapsible without flipping) */}
          {showHint && card.hint && (
            <div
              className="mt-3 p-3 rounded-lg bg-gold/10 border border-gold/30 text-gold text-xs sm:text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-200"
              role="note"
              aria-label="Dica para o cartão"
            >
              <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="font-semibold">Dica de Fixação: </strong>
                <span>{card.hint}</span>
              </div>
            </div>
          )}

          {/* Front Body (Accessible Clickable & Keyboard Trigger) */}
          <div
            ref={frontTriggerRef}
            role="button"
            tabIndex={flipped ? -1 : 0}
            aria-label={`Frente do cartão: ${card.front}. Pressione Espaço ou Enter para virar o cartão.`}
            aria-expanded={flipped}
            onClick={onFlip}
            onKeyDown={handleFrontKeyDown}
            className="my-auto flex-1 flex flex-col items-center justify-center text-center cursor-pointer py-6 px-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors hover:bg-surface-container-high/30"
          >
            <p className="text-lg sm:text-2xl font-bold leading-relaxed text-foreground max-w-2xl">
              {card.front}
            </p>
          </div>

          {/* Front Footer Prompt */}
          <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline">Atalho:</span>
              <kbd className="px-2 py-0.5 rounded bg-muted border border-border text-[11px] font-mono text-foreground font-semibold">
                Espaço
              </kbd>
              <span className="text-muted-foreground">ou Enter</span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onFlip}
              className="h-8 gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
            >
              <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Virar card</span>
            </Button>
          </div>
        </div>

        {/* ===================== BACK FACE ===================== */}
        <div
          role="region"
          aria-label="Resposta do cartão e avaliação de dificuldade"
          className={cn(
            "absolute inset-0 backface-hidden rotate-y-180 rounded-2xl flex flex-col justify-between p-6 sm:p-8 bg-card border border-border/80 transition-opacity duration-200",
            !flipped ? "pointer-events-none opacity-0" : "opacity-100",
          )}
        >
          {/* Back Header */}
          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-4">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-secondary/15 text-secondary border-secondary/30 text-xs font-semibold"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                Gabarito / Resposta
              </Badge>
              {card.discipline && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {card.discipline}
                </span>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onFlip}
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              aria-label="Voltar para a frente do cartão"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Ver pergunta</span>
            </Button>
          </div>

          {/* Back Body (Answer & Explanation) */}
          <div className="my-auto flex-1 flex flex-col justify-center py-4 space-y-4 overflow-y-auto max-h-[220px] sm:max-h-[240px] pr-1">
            <div className="space-y-2">
              <p className="text-base sm:text-lg font-medium leading-relaxed text-foreground">
                {card.back}
              </p>
            </div>

            {card.explanation && (
              <div className="rounded-xl bg-surface-container-high/60 border border-outline-variant/40 p-3.5 text-xs sm:text-sm text-on-surface-variant flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong className="font-semibold text-foreground">Fundamentação: </strong>
                  <span>{card.explanation}</span>
                </div>
              </div>
            )}
          </div>

          {/* Back Footer: Difficulty Rating Bar with 3 distinct buttons */}
          <div className="pt-4 border-t border-border/40 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                Como foi responder a este cartão?
              </span>
              <span className="hidden sm:inline text-[11px]">Use os atalhos 1, 2 ou 3</span>
            </div>

            <div
              role="group"
              aria-label="Avalie o nível de dificuldade do cartão"
              className="grid grid-cols-3 gap-2 sm:gap-3"
            >
              {/* DIFÍCIL (destructive token) */}
              <button
                ref={backFirstButtonRef}
                type="button"
                onClick={() => onRate("hard")}
                aria-label="Avaliar como Difícil (atalho: tecla 1)"
                className={cn(
                  "group flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive transition-all duration-150 cursor-pointer",
                  "hover:bg-destructive/20 hover:border-destructive/50 hover:scale-[1.02] active:scale-[0.98]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                )}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Difícil</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] opacity-80 mt-0.5">
                  <span>Revisar logo</span>
                  <kbd className="hidden sm:inline-block px-1 rounded bg-destructive/20 text-[10px] font-mono font-bold">
                    1
                  </kbd>
                </div>
              </button>

              {/* MÉDIO (gold token) */}
              <button
                type="button"
                onClick={() => onRate("medium")}
                aria-label="Avaliar como Médio (atalho: tecla 2)"
                className={cn(
                  "group flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border border-gold/30 bg-tertiary/10 text-gold transition-all duration-150 cursor-pointer",
                  "hover:bg-tertiary/20 hover:border-gold/50 hover:scale-[1.02] active:scale-[0.98]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                )}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                  <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Médio</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] opacity-80 mt-0.5">
                  <span>Relembrei</span>
                  <kbd className="hidden sm:inline-block px-1 rounded bg-gold/20 text-[10px] font-mono font-bold">
                    2
                  </kbd>
                </div>
              </button>

              {/* FÁCIL (green secondary token) */}
              <button
                type="button"
                onClick={() => onRate("easy")}
                aria-label="Avaliar como Fácil (atalho: tecla 3)"
                className={cn(
                  "group flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border border-secondary/30 bg-secondary/10 text-secondary transition-all duration-150 cursor-pointer",
                  "hover:bg-secondary/20 hover:border-secondary/50 hover:scale-[1.02] active:scale-[0.98]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                )}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Fácil</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] opacity-80 mt-0.5">
                  <span>Dominado</span>
                  <kbd className="hidden sm:inline-block px-1 rounded bg-secondary/20 text-[10px] font-mono font-bold">
                    3
                  </kbd>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
