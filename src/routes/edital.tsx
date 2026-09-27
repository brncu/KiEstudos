import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Layers, Target } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditalAccordion, EditalOverallProgress, useEditalProgress } from "@/components/edital";

export const Route = createFileRoute("/edital")({
  head: () => ({
    meta: [
      { title: "Edital Verticalizado — Syllabus Tracker | KiEstudos" },
      {
        name: "description",
        content:
          "Acompanhe seu progresso detalhado por matéria, tópico e subtópico com checkpoints de teoria, questões e revisões.",
      },
    ],
  }),
  component: EditalPage,
});

function EditalPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const {
    disciplines,
    filteredDisciplines,
    globalStats,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    toggleCheckpoint,
    markAllInDiscipline,
    resetAllProgress,
  } = useEditalProgress(userId);

  const [notification, setNotification] = useState<string | null>(null);

  const userName = useMemo(() => {
    if (!user) return "estudante";
    return (
      (user.user_metadata?.["full_name"] as string | undefined) ||
      user.email?.split("@")[0] ||
      "estudante"
    );
  }, [user]);

  const handleExportSummary = () => {
    const summaryText = `KiEstudos - Resumo do Edital Verticalizado\nProgresso Geral: ${globalStats.percentComplete}%\nCheckpoints: ${globalStats.completedCheckpoints}/${globalStats.totalCheckpoints}\nTópicos Dominados: ${globalStats.completedTopics}/${globalStats.totalTopics}\nDisciplinas: ${globalStats.totalDisciplines}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setNotification("Resumo copiado para a área de transferência!");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Sidebar navigation */}
      <AppNav />

      {/* Responsive layout container with sidebar offset */}
      <div className="lg:pl-72 pt-16 lg:pt-0 flex-1 w-full flex flex-col">
        <main className="w-full flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Layers className="h-4 w-4" aria-hidden="true" />
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                  Edital Verticalizado
                </h1>
                <Badge
                  variant="secondary"
                  className="text-[11px] font-semibold tracking-wide uppercase bg-secondary/15 text-secondary border border-secondary/25"
                >
                  Syllabus Tracker
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Mapeie cada assunto do edital, marque suas leituras teóricas, resolução de questões
                e revisões programadas com recálculo dinâmico de aproveitamento.
              </p>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center gap-2 self-start md:self-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportSummary}
                className="h-8 text-xs font-semibold border-border hover:bg-muted/50 cursor-pointer"
              >
                <FileSpreadsheet
                  className="h-3.5 w-3.5 mr-1.5 text-muted-foreground"
                  aria-hidden="true"
                />
                Copiar Resumo
              </Button>
            </div>
          </div>

          {/* Toast / inline notification */}
          {notification && (
            <div
              role="alert"
              aria-live="polite"
              className="flex items-center gap-2 p-3 text-xs rounded-xl bg-secondary/10 border border-secondary/30 text-secondary font-medium animate-in fade-in"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{notification}</span>
            </div>
          )}

          {/* Overall progress header card */}
          <EditalOverallProgress
            stats={globalStats}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onResetProgress={resetAllProgress}
          />

          {/* Disciplines and Topics Accordion */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Conteúdo Programático por Disciplina</span>
              </h2>

              <span className="text-xs text-muted-foreground tabular-nums">
                {filteredDisciplines.length} de {disciplines.length} disciplinas visíveis
              </span>
            </div>

            <EditalAccordion
              disciplines={filteredDisciplines}
              onToggleCheckpoint={toggleCheckpoint}
              onMarkAllInDiscipline={markAllInDiscipline}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
