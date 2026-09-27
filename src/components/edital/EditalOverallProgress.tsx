import React from "react";
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  RotateCcw,
  Search,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EditalGlobalStats, StatusFilter } from "./types";
import { cn } from "@/lib/utils";

export interface EditalOverallProgressProps {
  stats: EditalGlobalStats;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  onResetProgress: () => void;
}

export function EditalOverallProgress({
  stats,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onResetProgress,
}: EditalOverallProgressProps) {
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);

  const filterButtons: Array<{
    id: StatusFilter;
    label: string;
    count: number;
    toneClass?: string;
  }> = [
    { id: "todos", label: "Todos", count: stats.totalTopics },
    {
      id: "concluidos",
      label: "Concluídos",
      count: stats.completedTopics,
      toneClass: "text-secondary",
    },
    {
      id: "em_andamento",
      label: "Em Andamento",
      count: stats.inProgressTopics,
      toneClass: "text-tertiary",
    },
    {
      id: "nao_iniciados",
      label: "Não Iniciados",
      count: stats.notStartedTopics,
      toneClass: "text-muted-foreground",
    },
  ];

  return (
    <Card className="border-border bg-card shadow-sm overflow-hidden">
      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Top Section: Progress Headline & Metrics */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Cobertura Geral do Edital
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground tabular-nums">
                {stats.percentComplete}%
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                {stats.completedCheckpoints} de {stats.totalCheckpoints} checkpoints concluídos
              </span>
            </div>

            {/* Overall Progress Bar */}
            <div className="pt-1 w-full">
              <Progress value={stats.percentComplete} className="h-3 bg-muted rounded-full" />
            </div>
          </div>

          {/* Quick KPI Stat Pills */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:w-auto">
            {/* Concluídos */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/60 bg-muted/20 min-w-[90px]">
              <div className="flex items-center gap-1 text-secondary text-xs font-semibold">
                <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Dominados</span>
              </div>
              <span className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                {stats.completedTopics}
              </span>
              <span className="text-[10px] text-muted-foreground">
                de {stats.totalTopics} tópicos
              </span>
            </div>

            {/* Em Andamento */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/60 bg-muted/20 min-w-[90px]">
              <div className="flex items-center gap-1 text-tertiary text-xs font-semibold">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Em estudo</span>
              </div>
              <span className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                {stats.inProgressTopics}
              </span>
              <span className="text-[10px] text-muted-foreground">iniciados</span>
            </div>

            {/* Disciplinas */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/60 bg-muted/20 min-w-[90px]">
              <div className="flex items-center gap-1 text-primary text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Matérias</span>
              </div>
              <span className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                {stats.totalDisciplines}
              </span>
              <span className="text-[10px] text-muted-foreground">no edital</span>
            </div>
          </div>
        </div>

        {/* Middle Toolbar: Search & Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-4 border-t border-border/40">
          {/* Accessible Search Input */}
          <div className="relative flex-1 max-w-md">
            <label htmlFor="edital-search-input" className="sr-only">
              Pesquisar tópicos ou disciplinas
            </label>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              id="edital-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por tópico, subtópico ou disciplina..."
              className="pl-9 pr-9 h-9 text-xs border-outline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Limpar pesquisa"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded cursor-pointer"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {filterButtons.map((btn) => {
              const active = statusFilter === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => onStatusFilterChange(btn.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <span>{btn.label}</span>
                  <Badge
                    variant={active ? "secondary" : "outline"}
                    className={cn(
                      "text-[10px] px-1 py-0 h-4 min-w-[18px] justify-center tabular-nums",
                      active
                        ? "bg-primary-foreground/20 text-primary-foreground border-transparent"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {btn.count}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Reset Progress Action */}
          <div className="flex items-center justify-end">
            {showResetConfirm ? (
              <div className="flex items-center gap-2 bg-destructive/10 p-1.5 rounded-lg border border-destructive/30">
                <span className="text-xs text-destructive font-medium pl-1">Zerar tudo?</span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onResetProgress();
                    setShowResetConfirm(false);
                  }}
                  className="h-6 text-xs px-2 cursor-pointer"
                >
                  Sim
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResetConfirm(false)}
                  className="h-6 text-xs px-2 cursor-pointer"
                >
                  Não
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowResetConfirm(true)}
                aria-label="Zerar progresso do edital"
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                <span className="hidden sm:inline">Reiniciar</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
