import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { AccuracyEvolutionChart } from "@/components/dashboard/AccuracyEvolutionChart";
import { SubjectPerformanceBreakdown } from "@/components/dashboard/SubjectPerformanceBreakdown";
import { QuickActionCards } from "@/components/dashboard/QuickActionCards";
import { Badge } from "@/components/ui/badge";
import { BarChart3, CalendarDays, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard de Simulados — KiEstudos" },
      {
        name: "description",
        content:
          "Acompanhe seu desempenho nos simulados, taxa de acerto por disciplina e evolução ao longo do tempo.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();

  const userName = useMemo(() => {
    if (!user) return "estudante";
    return (
      (user.user_metadata?.["full_name"] as string | undefined) ||
      user.email?.split("@")[0] ||
      "estudante"
    );
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Sidebar navigation */}
      <AppNav />

      {/* Responsive layout container with sidebar offset */}
      <div className="lg:pl-72 pt-16 lg:pt-0 flex-1 w-full flex flex-col">
        <main className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                  Dashboard de Simulados
                </h1>
                <Badge
                  variant="secondary"
                  className="text-[11px] font-semibold tracking-wide uppercase bg-secondary/15 text-secondary border border-secondary/25"
                >
                  Analytics
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Visão consolidada do seu desempenho em simulados cronometrados, taxa de acerto por
                disciplina e evolução semanal com atalhos rápidos para os módulos de estudo.
              </p>
            </div>

            {/* Right-side meta info */}
            <div className="flex items-center gap-2 self-start md:self-center">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high border border-outline-variant/40 text-xs text-on-surface-variant font-label-code">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  Atualizado:{" "}
                  {new Date().toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-secondary/10 border border-secondary/20 text-xs text-secondary font-label-caps font-bold">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Evolução</span>
              </div>
            </div>
          </div>

          {/* KPI Cards Row */}
          <DashboardKPIs />

          {/* Charts Row: Evolution + Subject Breakdown side-by-side on larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AccuracyEvolutionChart />
            <SubjectPerformanceBreakdown />
          </div>

          {/* Quick Action Shortcuts */}
          <QuickActionCards />
        </main>
      </div>
    </div>
  );
}
