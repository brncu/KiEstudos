import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Target,
  Sparkles,
  Search,
  Check,
  Building2,
  Users,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Loader2,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { sanitizeErrorMessage } from "@/lib/errors";
import { useTargetExam } from "@/hooks/useTargetExam";
import type { ConcursoExam } from "@/types/concurso";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Bem-vindo — Defina seu Concurso Foco" },
      {
        name: "description",
        content:
          "Selecione o concurso para o qual você está se preparando e personalize toda a plataforma.",
      },
    ],
  }),
  component: OnboardingPage,
});

/**
 * Format currency to BRL
 */
function formatCurrency(val?: number | null): string {
  if (val == null) return "A definir";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(val);
}

function OnboardingPage() {
  const navigate = useNavigate();
  const { allExams, activeExam, setTargetExam, isUpdating, isLoading } =
    useTargetExam();

  const [search, setSearch] = useState("");
  const [selectedExamId, setSelectedExamId] = useState<string | null>(
    activeExam?.id ?? allExams[0]?.id ?? null,
  );

  // Keep selectedExamId synced when data arrives
  const effectiveSelectedId = selectedExamId ?? activeExam?.id ?? allExams[0]?.id ?? null;

  // Filter exams by quick search term
  const filteredExams = useMemo(() => {
    if (!search.trim()) return allExams;
    const term = search.toLowerCase().trim();
    return allExams.filter((exam) => {
      return (
        exam.title.toLowerCase().includes(term) ||
        exam.institution.toLowerCase().includes(term) ||
        exam.role.toLowerCase().includes(term) ||
        (exam.exam_board && exam.exam_board.toLowerCase().includes(term))
      );
    });
  }, [allExams, search]);

  const selectedExam = useMemo(() => {
    return allExams.find((e) => e.id === effectiveSelectedId) ?? null;
  }, [allExams, effectiveSelectedId]);

  const handleConfirm = async () => {
    if (!selectedExam) return;

    try {
      await setTargetExam(selectedExam);
      toast.success("Concurso Foco definido com sucesso!", {
        description: `Sua preparação agora está calibrada para ${selectedExam.title}.`,
      });
      navigate({ to: "/" });
    } catch (err: unknown) {
      toast.error(
        sanitizeErrorMessage(
          err,
          "Não foi possível salvar o concurso foco. Tente novamente mais tarde.",
        ),
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      {/* Header Banner */}
      <header className="relative z-10 border-b border-outline-variant/20 bg-gradient-to-r from-primary/10 via-surface-container to-secondary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary shadow-inner shrink-0">
              <Target className="w-7 h-7" />
            </div>
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-secondary/15 border border-secondary/30">
                  Passo Essencial
                </span>
                <span className="flex items-center gap-1 text-[11px] text-primary font-medium">
                  <Sparkles className="w-3 h-3" />
                  Personalização KiEstudos
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-on-surface tracking-tight">
                Bem-vindo! Defina seu Concurso Foco
              </h1>
              <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">
                Selecione o certame para o qual você está se preparando. Todo o
                seu ecossistema — simulados, cronogramas de revisão, métricas de
                desempenho e o{" "}
                <strong>Edital Mágico por IA</strong> — será ajustado sob medida
                para este alvo.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Body & Selector */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            <Input
              placeholder="Buscar concurso pelo órgão, cargo ou banca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 bg-surface-container border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/60 focus-visible:ring-primary text-sm"
            />
          </div>

          {/* Exam Selection Cards */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm">Carregando concursos disponíveis...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExams.length === 0 ? (
                <div className="p-8 text-center text-sm text-on-surface-variant rounded-xl border border-outline-variant/20 bg-surface-container/50">
                  Nenhum concurso encontrado para &ldquo;{search}&rdquo;.
                </div>
              ) : (
                filteredExams.map((exam) => {
                  const isSelected = effectiveSelectedId === exam.id;

                  return (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => setSelectedExamId(exam.id)}
                      className={`w-full text-left p-4 sm:p-5 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(77,142,255,0.15)] ring-1 ring-primary"
                          : "border-outline-variant/30 bg-surface-container/60 hover:bg-surface-container hover:border-outline-variant/60"
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm sm:text-base text-on-surface">
                            {exam.title}
                          </span>
                          {exam.state && (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 border-outline-variant/40 bg-surface-container-high shrink-0"
                            >
                              {exam.state === "BR" ? "Nacional" : exam.state}
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-on-surface-variant flex items-center gap-1.5 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 shrink-0" />
                            {exam.institution}
                          </span>
                          {exam.exam_board && (
                            <span className="flex items-center gap-1">
                              • {exam.exam_board}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-on-surface-variant">
                          <span className="flex items-center gap-1 text-primary font-medium">
                            <Users className="w-3 h-3" />
                            {exam.vacancies > 0
                              ? `${exam.vacancies.toLocaleString("pt-BR")} vagas`
                              : "Vagas a definir"}
                          </span>
                          <span className="flex items-center gap-1 text-secondary font-semibold">
                            <DollarSign className="w-3 h-3" />
                            {formatCurrency(exam.salary)}
                          </span>
                          <span className="flex items-center gap-1 text-on-surface-variant/80">
                            <GraduationCap className="w-3 h-3" />
                            {exam.education_level === "superior"
                              ? "Nível Superior"
                              : exam.education_level === "medio"
                                ? "Nível Médio"
                                : exam.education_level === "tecnico"
                                  ? "Nível Técnico"
                                  : "Nível Fundamental"}
                          </span>
                        </div>
                      </div>

                      {/* Radio Checkmark */}
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-colors ${
                          isSelected
                            ? "bg-primary border-primary text-on-primary"
                            : "border-outline-variant/60 bg-surface-container"
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions - Sticky */}
      <footer className="relative z-10 border-t border-outline-variant/20 bg-surface-container/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-secondary shrink-0" />
            <span>Você pode trocar de concurso foco a qualquer momento na página Foco.</span>
          </div>

          <Button
            size="lg"
            disabled={!selectedExam || isUpdating}
            onClick={handleConfirm}
            className="bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm px-6 cursor-pointer shadow-lg shadow-primary/20"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2 shrink-0" />
                Salvando...
              </>
            ) : (
              <>
                Confirmar e Começar
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
