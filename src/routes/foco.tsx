import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Target,
  Layers,
  Search,
  Users,
  DollarSign,
  Building2,
  GraduationCap,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Loader2,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ActiveFocusCard } from "@/components/foco/ActiveFocusCard";
import { ConcursoFilterBar } from "@/components/foco/ConcursoFilterBar";
import { useTargetExam } from "@/hooks/useTargetExam";
import { toast } from "sonner";
import { sanitizeErrorMessage } from "@/lib/errors";
import type { ConcursoExam, ConcursoFilterState } from "@/types/concurso";

export const Route = createFileRoute("/foco")({
  head: () => ({
    meta: [
      { title: "Concurso Foco — KiEstudos" },
      {
        name: "description",
        content:
          "Gerencie seu concurso alvo, explore editais abertos e previstos, consulte o Edital Mágico por IA e calibre seus simulados.",
      },
    ],
  }),
  component: ConcursoFocoPage,
});

/**
 * Normalizes text for case and accent-insensitive search.
 */
function normalizeText(text?: string | null): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

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

/**
 * Maps status slugs to user-facing labels
 */
function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    inscricoes_abertas: "Inscrições Abertas",
    edital_publicado: "Edital Publicado",
    autorizado: "Autorizado",
    previsto: "Previsto",
    encerrado: "Encerrado",
  };
  return map[status] ?? status;
}

/**
 * Maps status slugs to color classes
 */
function getStatusColor(status: string): string {
  switch (status) {
    case "inscricoes_abertas":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "edital_publicado":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "autorizado":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "previsto":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    case "encerrado":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    default:
      return "bg-surface-container-high text-on-surface-variant border-outline-variant/40";
  }
}

function ConcursoFocoPage() {
  const { activeExam, allExams, isLoading, setTargetExam, isUpdating } =
    useTargetExam();

  // Filter state
  const [filters, setFilters] = useState<ConcursoFilterState>({
    search: "",
    sphere: "all",
    state: "all",
    education_level: "all",
    status: "all",
    exam_date_range: "all",
  });

  const [savingExamId, setSavingExamId] = useState<string | null>(null);

  // Filtered exams calculation
  const filteredExams = useMemo(() => {
    return allExams.filter((exam) => {
      // 1. Text search
      if (filters.search.trim()) {
        const term = normalizeText(filters.search);
        const title = normalizeText(exam.title);
        const inst = normalizeText(exam.institution);
        const role = normalizeText(exam.role);
        const board = normalizeText(exam.exam_board);
        const matches =
          title.includes(term) ||
          inst.includes(term) ||
          role.includes(term) ||
          board.includes(term);

        if (!matches) return false;
      }

      // 2. Sphere filter
      if (filters.sphere !== "all" && exam.sphere !== filters.sphere) {
        return false;
      }

      // 3. State/UF filter
      if (filters.state !== "all" && exam.state !== filters.state) {
        return false;
      }

      // 4. Education level filter
      if (
        filters.education_level !== "all" &&
        exam.education_level !== filters.education_level
      ) {
        return false;
      }

      // 5. Status filter
      if (filters.status !== "all" && exam.status !== filters.status) {
        return false;
      }

      // 6. Exam date range filter
      if (filters.exam_date_range && filters.exam_date_range !== "all") {
        const range = filters.exam_date_range;
        const isTbdFilter =
          range === "tbd" || range.toLowerCase().includes("definir");

        if (isTbdFilter) {
          if (exam.exam_date && exam.exam_date.trim() !== "") {
            return false;
          }
        } else {
          if (!exam.exam_date || exam.exam_date.trim() === "") {
            return false;
          }

          const parts = exam.exam_date.split("-");
          if (
            parts.length !== 3 ||
            !parts[0] ||
            !parts[1] ||
            !parts[2]
          ) {
            return false;
          }

          const examYear = parseInt(parts[0], 10);
          const examMonth = parseInt(parts[1], 10) - 1;
          const examDay = parseInt(parts[2], 10);

          if (isNaN(examYear) || isNaN(examMonth) || isNaN(examDay)) {
            return false;
          }

          const examDateObj = new Date(examYear, examMonth, examDay);
          const now = new Date();
          const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );

          const diffTime = examDateObj.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (range === "30_days" || range.includes("30")) {
            if (diffDays < 0 || diffDays > 30) return false;
          } else if (range === "60_days" || range.includes("60")) {
            if (diffDays < 0 || diffDays > 60) return false;
          } else if (range === "90_days" || range.includes("90")) {
            if (diffDays < 0 || diffDays > 90) return false;
          } else if (range === "year_2026" || range.includes("2026")) {
            if (examYear !== 2026) return false;
          }
        }
      }

      return true;
    });
  }, [allExams, filters]);

  const handleResetFilters = () => {
    setFilters({
      search: "",
      sphere: "all",
      state: "all",
      education_level: "all",
      status: "all",
      exam_date_range: "all",
    });
  };

  const handleSetFocus = async (exam: ConcursoExam) => {
    setSavingExamId(exam.id);
    try {
      await setTargetExam(exam);
      toast.success("Concurso Foco atualizado!", {
        description: `Agora seu foco é: ${exam.title}`,
      });
    } catch (err: unknown) {
      toast.error(
        sanitizeErrorMessage(
          err,
          "Não foi possível salvar o concurso foco.",
        ),
      );
    } finally {
      setSavingExamId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Sidebar Navigation */}
      <AppNav />

      {/* Main Content Viewport */}
      <div className="lg:pl-72 pt-16 lg:pt-0 flex-1 w-full flex flex-col">
        <main className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
          {/* ========================================================================= */}
          {/* Page Header                                                               */}
          {/* ========================================================================= */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-secondary/15 text-secondary">
                  <Target className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold text-secondary uppercase tracking-widest">
                  Gestão Estratégica de Certames
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-on-surface tracking-tight">
                Concurso Foco &amp; Catálogo de Editais
              </h1>
              <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
                Centralize toda a sua preparação. O concurso ativo calibra seus
                simulados, questões prioritárias, métricas de aprovação e o
                resumo inteligente de edital.
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 1. Hero Card: Active Target Exam                                          */}
          {/* ========================================================================= */}
          <ActiveFocusCard
            activeExam={activeExam}
            isLoading={isLoading}
            onSwitchExam={() => {
              const el = document.getElementById("catalogo-concursos");
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />

          {/* ========================================================================= */}
          {/* Visual Catalog Section: Filter Bar & High-Resolution Concurso Cards       */}
          {/* ========================================================================= */}
          <section
            id="catalogo-concursos"
            aria-labelledby="catalogo-concursos-title"
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    Explorar Oportunidades
                  </span>
                </div>
                <h2
                  id="catalogo-concursos-title"
                  className="text-xl sm:text-2xl font-black text-on-surface tracking-tight"
                >
                  Catálogo Nacional de Concursos
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant">
                  Explore os concursos disponíveis e clique em &ldquo;Salvar como
                  Concurso Foco&rdquo; para alternar seu certame ativo.
                </p>
              </div>
            </div>

            {/* Filter Bar Component */}
            <ConcursoFilterBar
              filters={filters}
              onFilterChange={setFilters}
              onReset={handleResetFilters}
              totalCount={allExams.length}
              filteredCount={filteredExams.length}
            />

            {/* Concurso Cards Grid */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm">
                  Carregando catálogo de concursos...
                </span>
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant gap-3 rounded-xl border border-outline-variant/20 bg-surface-container/50">
                <Search className="w-8 h-8 text-on-surface-variant/50" />
                <p className="text-sm">
                  Nenhum concurso encontrado com os filtros selecionados.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-xs"
                >
                  Limpar Filtros
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredExams.map((exam) => {
                  const isActive = activeExam?.id === exam.id;
                  const isSaving = savingExamId === exam.id;
                  const hasMaterials = !!(
                    exam.programmatic_content &&
                    Array.isArray(exam.programmatic_content) &&
                    exam.programmatic_content.length > 0
                  );

                  return (
                    <div
                      key={exam.id}
                      className={`group relative rounded-xl border overflow-hidden transition-all hover:shadow-lg ${
                        isActive
                          ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30 shadow-md"
                          : "border-outline-variant/30 bg-surface-container/60 hover:border-outline-variant/50"
                      }`}
                    >
                      {/* Banner / Image area */}
                      <div className="relative h-36 sm:h-40 bg-gradient-to-br from-surface-container-high to-surface-container overflow-hidden">
                        {exam.banner_url ? (
                          <img
                            src={exam.banner_url}
                            alt={exam.title}
                            className="w-full h-full object-cover opacity-75 group-hover:opacity-95 group-hover:scale-105 transition-all duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-12 h-12 text-on-surface-variant/20" />
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-3 left-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold px-2 py-0.5 backdrop-blur-sm ${getStatusColor(exam.status)}`}
                          >
                            {getStatusLabel(exam.status)}
                          </Badge>
                        </div>

                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 gap-1 shadow-md">
                              <CheckCircle2 className="w-3 h-3" />
                              Foco Atual
                            </Badge>
                          </div>
                        )}

                        {/* Materials tag */}
                        {hasMaterials && (
                          <div className="absolute bottom-3 right-3">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold px-2 py-0.5 bg-secondary/20 text-secondary border-secondary/40 backdrop-blur-md shadow-sm gap-1"
                            >
                              <BookOpen className="w-3 h-3" />
                              Temos Materiais
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-3">
                        {/* Title & Institution */}
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-on-surface leading-snug line-clamp-2">
                            {exam.title}
                          </h3>
                          <p className="text-xs text-on-surface-variant flex items-center gap-1 truncate">
                            <Building2 className="w-3 h-3 shrink-0" />
                            {exam.institution}
                          </p>
                        </div>

                        {/* Meta Info Grid */}
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="flex items-center gap-1.5 text-on-surface-variant">
                            <DollarSign className="w-3 h-3 text-secondary shrink-0" />
                            <span className="font-semibold text-secondary truncate">
                              {formatCurrency(exam.salary)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-on-surface-variant">
                            <Users className="w-3 h-3 text-primary shrink-0" />
                            <span className="font-medium text-primary truncate">
                              {exam.vacancies > 0
                                ? `${exam.vacancies.toLocaleString("pt-BR")} vagas`
                                : "Vagas a definir"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-on-surface-variant">
                            <GraduationCap className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {exam.education_level === "superior"
                                ? "Superior"
                                : exam.education_level === "medio"
                                  ? "Médio"
                                  : exam.education_level === "tecnico"
                                    ? "Técnico"
                                    : "Fundamental"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-on-surface-variant">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {exam.exam_board ?? "Banca a definir"}
                            </span>
                          </div>
                        </div>

                        {/* State & Sphere tags */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {exam.state && (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 border-outline-variant/40 bg-surface-container-high"
                            >
                              {exam.state === "BR" ? "Nacional" : exam.state}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 px-1.5 border-outline-variant/40 bg-surface-container-high capitalize"
                          >
                            {exam.sphere}
                          </Badge>
                        </div>

                        {/* Action Button */}
                        <div className="pt-1">
                          {isActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="w-full text-xs font-bold border-secondary/40 text-secondary bg-secondary/10 cursor-default gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Concurso Foco Atual
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={isSaving || isUpdating}
                              onClick={() => handleSetFocus(exam)}
                              className="w-full bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold cursor-pointer gap-1.5"
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Salvando...
                                </>
                              ) : (
                                <>
                                  <Target className="w-3.5 h-3.5" />
                                  Salvar como Concurso Foco
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
