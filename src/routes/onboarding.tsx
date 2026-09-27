import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Target,
  Sparkles,
  Search,
  ShieldCheck,
  Loader2,
  Layers,
  GraduationCap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useTargetExam } from "@/hooks/useTargetExam";
import { ConcursoDataTable } from "@/components/foco/ConcursoDataTable";
import type { ConcursoExam } from "@/types/concurso";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Bem-vindo — Defina seu Concurso Foco | KiEstudos" },
      {
        name: "description",
        content:
          "Selecione o concurso para o qual você está se preparando e personalize toda a sua plataforma de estudos.",
      },
    ],
  }),
  component: OnboardingPage,
});

/**
 * Normalizes text for case- and accent-insensitive search.
 */
function normalizeText(text?: string | null): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    allExams,
    activeExam,
    setTargetExam,
    isLoading: isTargetExamLoading,
    needsOnboarding,
  } = useTargetExam();

  const [search, setSearch] = useState("");

  // Redirection Guards:
  // 1. If not authenticated and auth check finished -> redirect to /auth
  // 2. If authenticated and onboarding already completed -> redirect to dashboard /
  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth" });
    } else if (!authLoading && user && !isTargetExamLoading && !needsOnboarding) {
      navigate({ to: "/" });
    }
  }, [user, authLoading, isTargetExamLoading, needsOnboarding, navigate]);

  // Filter exams by search input
  const filteredExams = useMemo(() => {
    if (!search.trim()) return allExams;
    const term = normalizeText(search);
    return allExams.filter((exam) => {
      const title = normalizeText(exam.title);
      const inst = normalizeText(exam.institution);
      const role = normalizeText(exam.role);
      const board = normalizeText(exam.exam_board);
      const state = normalizeText(exam.state);
      return (
        title.includes(term) ||
        inst.includes(term) ||
        role.includes(term) ||
        board.includes(term) ||
        state.includes(term)
      );
    });
  }, [allExams, search]);

  // Handle selection from ConcursoDataTable
  const handleSelectExam = async (exam: ConcursoExam) => {
    await setTargetExam(exam);
    // Smoothly redirect to dashboard after selection
    navigate({ to: "/" });
  };

  // Fullscreen loading spinner while determining auth or initial data
  if (authLoading || (user && isTargetExamLoading)) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <div className="w-12 h-12 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary shadow-inner">
          <Target className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Carregando ecossistema de concursos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground relative overflow-x-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      {/* Header Banner - Fullscreen Experience */}
      <header className="relative z-10 border-b border-outline-variant/20 bg-gradient-to-r from-primary/10 via-surface-container to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary shadow-inner shrink-0">
                <Target className="w-7 h-7" />
              </div>
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-secondary/15 border border-secondary/30">
                    Passo Inaugural
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-primary font-medium">
                    <Sparkles className="w-3 h-3" />
                    Personalização Completa KiEstudos
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-on-surface tracking-tight">
                  Bem-vindo! Escolha seu Concurso Foco
                </h1>
                <p className="text-sm text-on-surface-variant leading-relaxed max-w-3xl">
                  Selecione o certame para o qual você está se preparando. Todo o
                  seu ecossistema — simulados personalizados, cronogramas de
                  revisão espaçada (SM-2), métricas de desempenho e o{" "}
                  <strong>Edital Mágico por IA</strong> — será calibrado
                  exclusivamente para este alvo.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 shrink-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface-variant">
                <ShieldCheck className="w-4 h-4 text-secondary shrink-0" />
                <span>Escolha reversível a qualquer momento</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface-variant">
                <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                <span>Mais de 10 carreiras nacionais</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content: Concurso Table View */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Table Controls & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Tabela Oficial de Certames
              </span>
            </div>
            <h2 className="text-xl font-bold text-on-surface">
              Explore e Defina seu Certame Inaugural
            </h2>
            <p className="text-xs text-on-surface-variant">
              Clique em &ldquo;Definir como Foco&rdquo; na tabela abaixo para iniciar imediatamente sua jornada.
            </p>
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            <Input
              placeholder="Buscar por órgão, cargo, banca ou UF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-surface-container border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/60 focus-visible:ring-primary text-xs"
            />
          </div>
        </div>

        {/* ConcursoDataTable Integration */}
        <ConcursoDataTable
          exams={filteredExams}
          activeExam={activeExam}
          onSelectExam={handleSelectExam}
          isLoading={isTargetExamLoading}
          onResetFilters={() => setSearch("")}
        />
      </main>

      {/* Reassurance Footer */}
      <footer className="relative z-10 border-t border-outline-variant/20 bg-surface-container/80 backdrop-blur-sm py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-secondary shrink-0" />
            <span>
              Você poderá alternar ou explorar novos concursos a qualquer momento no menu <strong>Concurso Foco</strong>.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-outline-variant/40">
              KiEstudos v2.0
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  );
}
