import React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, CheckCircle2, HelpCircle, AlertTriangle, Layers } from "lucide-react";
import { SessionStats } from "./types";

export interface FlashcardProgressProps {
  currentIndex: number;
  totalCards: number;
  stats: SessionStats;
  deckTitle: string;
}

export function FlashcardProgress({
  currentIndex,
  totalCards,
  stats,
  deckTitle,
}: FlashcardProgressProps) {
  const percent = totalCards > 0 ? Math.min(100, Math.round((currentIndex / totalCards) * 100)) : 0;
  const remaining = Math.max(0, totalCards - currentIndex);

  return (
    <div className="w-full space-y-3" role="region" aria-label="Progresso da sessão de estudo">
      {/* Top Row: Title, Counter & Streak */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-base sm:text-lg font-bold text-foreground leading-tight truncate max-w-xs sm:max-w-md">
              {deckTitle}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Cartão <span className="font-semibold text-foreground">{currentIndex + 1}</span> de{" "}
            <span className="font-semibold text-foreground">{totalCards}</span> ({remaining}{" "}
            restantes)
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {stats.streak > 1 && (
            <Badge
              variant="outline"
              className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-xs font-semibold gap-1"
            >
              <Flame
                className="h-3.5 w-3.5 text-orange-400 fill-orange-400 animate-pulse"
                aria-hidden="true"
              />
              <span>{stats.streak} seguidos</span>
            </Badge>
          )}

          {/* Quick breakdown mini badges */}
          <div className="flex items-center gap-1 text-[11px] font-mono">
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary/15 text-secondary border border-secondary/20 font-bold"
              title="Cartões avaliados como Fácil"
            >
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              {stats.easyCount}
            </span>
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-tertiary/15 text-gold border border-gold/20 font-bold"
              title="Cartões avaliados como Médio"
            >
              <HelpCircle className="h-3 w-3" aria-hidden="true" />
              {stats.mediumCount}
            </span>
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/20 font-bold"
              title="Cartões avaliados como Difícil"
            >
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              {stats.hardCount}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <Progress
          value={percent}
          className="h-2 bg-surface-container-high border border-border/40"
          aria-label={`Progresso da sessão: ${percent}% concluído`}
        />
        <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
          <span>Início</span>
          <span>{percent}% concluído</span>
          <span>Fim</span>
        </div>
      </div>
    </div>
  );
}
