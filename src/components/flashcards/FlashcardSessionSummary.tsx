import React from "react";
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
import {
  Trophy,
  RotateCcw,
  Layers,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { SessionStats } from "./types";

export interface FlashcardSessionSummaryProps {
  deckTitle: string;
  stats: SessionStats;
  onRestartSession: (onlyHard?: boolean) => void;
  onBackToDecks: () => void;
}

export function FlashcardSessionSummary({
  deckTitle,
  stats,
  onRestartSession,
  onBackToDecks,
}: FlashcardSessionSummaryProps) {
  const total = stats.totalReviewed || 1;
  const easyPct = Math.round((stats.easyCount / total) * 100);
  const mediumPct = Math.round((stats.mediumCount / total) * 100);
  const hardPct = Math.round((stats.hardCount / total) * 100);

  // Overall retention score (weighted: easy = 100%, medium = 65%, hard = 20%)
  const retentionScore = Math.round(
    ((stats.easyCount * 1.0 + stats.mediumCount * 0.65 + stats.hardCount * 0.2) / total) * 100,
  );

  let feedbackTitle = "Parabéns pela Revisão!";
  let feedbackMessage = "Seu cérebro consolidou novas memórias de longo prazo.";
  if (retentionScore >= 80) {
    feedbackTitle = "Excelente Retenção!";
    feedbackMessage = "Você demonstrou alto domínio sobre os tópicos deste baralho.";
  } else if (retentionScore >= 50) {
    feedbackTitle = "Bom Progresso!";
    feedbackMessage = "A maior parte dos conceitos foi recuperada com sucesso.";
  } else {
    feedbackTitle = "Revisão Necessária!";
    feedbackMessage = "Vários conceitos foram difíceis. Recomendamos revisar os pontos críticos.";
  }

  return (
    <Card className="w-full max-w-2xl mx-auto border-border bg-card shadow-2xl animate-in zoom-in-95 duration-300">
      <CardHeader className="text-center pb-4 pt-8">
        <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary shadow-lg">
          <Trophy className="h-9 w-9" aria-hidden="true" />
        </div>
        <Badge
          variant="outline"
          className="mx-auto mb-2 text-xs bg-primary/10 text-primary border-primary/30"
        >
          Sessão Finalizada • {deckTitle}
        </Badge>
        <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">
          {feedbackTitle}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
          {feedbackMessage}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-2 pb-6">
        {/* Retention Score Banner */}
        <div className="rounded-2xl bg-surface-container-high/60 border border-outline-variant/40 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/15 text-primary">
              <TrendingUp className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Índice de Retenção
              </span>
              <p className="text-2xl font-black text-foreground">{retentionScore}%</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-center">
              <span className="text-muted-foreground block">Cartões</span>
              <span className="text-base font-bold text-foreground">{stats.totalReviewed}</span>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div className="text-center">
              <span className="text-muted-foreground block">Melhor Sequência</span>
              <span className="text-base font-bold text-orange-400 flex items-center justify-center gap-1">
                <Flame className="h-4 w-4 fill-orange-400" aria-hidden="true" />
                {stats.bestStreak}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown by Rating */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Distribuição de Desempenho
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Fácil */}
            <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-secondary">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Fácil
                </span>
                <span className="text-xs font-mono font-semibold">{easyPct}%</span>
              </div>
              <p className="text-xl font-extrabold text-foreground mt-2">
                {stats.easyCount}{" "}
                <span className="text-xs font-normal text-muted-foreground">cartões</span>
              </p>
            </div>

            {/* Médio */}
            <div className="rounded-xl border border-gold/30 bg-tertiary/10 p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-gold">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4" aria-hidden="true" />
                  Médio
                </span>
                <span className="text-xs font-mono font-semibold">{mediumPct}%</span>
              </div>
              <p className="text-xl font-extrabold text-foreground mt-2">
                {stats.mediumCount}{" "}
                <span className="text-xs font-normal text-muted-foreground">cartões</span>
              </p>
            </div>

            {/* Difícil */}
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-destructive">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  Difícil
                </span>
                <span className="text-xs font-mono font-semibold">{hardPct}%</span>
              </div>
              <p className="text-xl font-extrabold text-foreground mt-2">
                {stats.hardCount}{" "}
                <span className="text-xs font-normal text-muted-foreground">cartões</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 pb-6 border-t border-border/40">
        <Button
          type="button"
          variant="outline"
          onClick={onBackToDecks}
          className="border-border text-foreground hover:bg-surface-container-high cursor-pointer"
        >
          <Layers className="h-4 w-4 mr-2" aria-hidden="true" />
          Voltar aos Baralhos
        </Button>

        <div className="flex items-center gap-2 flex-col sm:flex-row">
          {stats.hardCount > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onRestartSession(true)}
              className="w-full sm:w-auto border-destructive/40 text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <AlertTriangle className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Revisar Apenas Difíceis ({stats.hardCount})
            </Button>
          )}

          <Button
            type="button"
            onClick={() => onRestartSession(false)}
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
            Revisar Baralho Completo
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
