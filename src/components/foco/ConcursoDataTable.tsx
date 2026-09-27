import { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  CheckCircle2,
  ExternalLink,
  Calendar,
  Building2,
  Users,
  DollarSign,
  Globe,
  GraduationCap,
  Sparkles,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import type { ConcursoExam } from "@/types/concurso";

export interface ConcursoDataTableProps {
  exams: ConcursoExam[];
  activeExam: ConcursoExam | null;
  onSelectExam: (exam: ConcursoExam) => Promise<unknown>;
  isLoading?: boolean;
  onResetFilters?: () => void;
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
 * Format ISO date to DD/MM/YYYY
 */
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "A definir";
  try {
    const [year, month, day] = dateStr.split("-");
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Maps sphere code to human-friendly text.
 */
function formatSphere(sphere: string): string {
  switch (sphere) {
    case "federal":
      return "Federal";
    case "estadual":
      return "Estadual";
    case "municipal":
      return "Municipal";
    default:
      return sphere;
  }
}

/**
 * Maps education level code to human-friendly text.
 */
function formatEducation(education: string): string {
  switch (education) {
    case "superior":
      return "Superior";
    case "medio":
      return "Médio";
    case "tecnico":
      return "Técnico";
    case "fundamental":
      return "Fundamental";
    default:
      return education;
  }
}

/**
 * Maps status code to label and styling classes.
 */
function getStatusBadge(status: string) {
  switch (status) {
    case "inscricoes_abertas":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary/15 text-secondary border border-secondary/30 whitespace-nowrap">
          Inscrições Abertas
        </span>
      );
    case "edital_publicado":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/30 whitespace-nowrap">
          Edital Publicado
        </span>
      );
    case "autorizado":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-tertiary/20 text-tertiary border border-tertiary/30 whitespace-nowrap">
          Autorizado
        </span>
      );
    case "previsto":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30 whitespace-nowrap">
          Previsto
        </span>
      );
    case "encerrado":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border whitespace-nowrap">
          Encerrado
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border whitespace-nowrap">
          {status}
        </span>
      );
  }
}

export function ConcursoDataTable({
  exams,
  activeExam,
  onSelectExam,
  isLoading,
  onResetFilters,
}: ConcursoDataTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [dateSort, setDateSort] = useState<"asc" | "desc" | null>(null);

  const toggleDateSort = () => {
    setDateSort((current) => {
      if (current === null) return "asc";
      if (current === "asc") return "desc";
      return null;
    });
  };

  const sortedExams = useMemo(() => {
    if (!dateSort) return exams;

    return [...exams].sort((a, b) => {
      // Exams with undefined or empty dates are placed at the end
      if (!a.exam_date && !b.exam_date) return 0;
      if (!a.exam_date) return 1;
      if (!b.exam_date) return -1;

      const timeA = new Date(a.exam_date).getTime();
      const timeB = new Date(b.exam_date).getTime();

      return dateSort === "asc" ? timeA - timeB : timeB - timeA;
    });
  }, [exams, dateSort]);

  const handleSelect = async (exam: ConcursoExam) => {
    try {
      setUpdatingId(exam.id);
      await onSelectExam(exam);
      toast.success("Concurso foco definido com sucesso!", {
        description: `${exam.title} foi salvo como seu certame principal.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Tente novamente.";
      toast.error("Erro ao definir concurso foco: " + message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 w-full rounded-lg bg-surface-container animate-pulse" />
        ))}
      </div>
    );
  }

  // Empty State
  if (exams.length === 0) {
    return (
      <div className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low p-10 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant">
          <Target className="w-6 h-6 opacity-60" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-on-surface">Nenhum concurso encontrado</h3>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mx-auto">
            Não encontramos nenhum certame correspondente aos critérios de busca e filtros
            selecionados.
          </p>
        </div>
        {onResetFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="border-outline-variant/40 hover:bg-surface-container-high text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-2" />
            Limpar Filtros de Busca
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* ========================================================================= */}
      {/* 1. Desktop View (hidden on mobile, visible on lg screens)                 */}
      {/* ========================================================================= */}
      <div className="hidden lg:block w-full overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low shadow-sm">
        <Table>
          <TableHeader className="bg-surface-container/80 border-b border-outline-variant/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[320px] text-on-surface font-bold text-xs uppercase tracking-wider py-3.5 pl-6">
                Concurso / Órgão
              </TableHead>
              <TableHead className="text-on-surface font-bold text-xs uppercase tracking-wider py-3.5">
                Esfera &amp; UF
              </TableHead>
              <TableHead className="text-on-surface font-bold text-xs uppercase tracking-wider py-3.5">
                Escolaridade
              </TableHead>
              <TableHead className="text-on-surface font-bold text-xs uppercase tracking-wider py-3.5">
                Vagas &amp; Salário
              </TableHead>
              <TableHead className="text-on-surface font-bold text-xs uppercase tracking-wider py-3.5">
                <button
                  type="button"
                  onClick={toggleDateSort}
                  className="inline-flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer select-none font-bold uppercase group"
                  title="Clique para alternar ordenação por data da prova (crescente / decrescente)"
                  aria-label={`Ordenar por data da prova: ${
                    dateSort === "asc"
                      ? "ordem crescente ativa"
                      : dateSort === "desc"
                        ? "ordem decrescente ativa"
                        : "sem ordenação ativa"
                  }`}
                >
                  <span>Data da Prova</span>
                  {dateSort === "asc" ? (
                    <ArrowUp className="w-3.5 h-3.5 text-primary shrink-0" />
                  ) : dateSort === "desc" ? (
                    <ArrowDown className="w-3.5 h-3.5 text-primary shrink-0" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-on-surface-variant/50 group-hover:text-primary shrink-0" />
                  )}
                </button>
              </TableHead>
              <TableHead className="text-on-surface font-bold text-xs uppercase tracking-wider py-3.5">
                Status
              </TableHead>
              <TableHead className="text-right text-on-surface font-bold text-xs uppercase tracking-wider py-3.5 pr-6">
                Ação
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedExams.map((exam) => {
              const isActive = activeExam?.id === exam.id || activeExam?.slug === exam.slug;
              const isUpdatingThis = updatingId === exam.id;

              return (
                <TableRow
                  key={exam.id}
                  className={`border-b border-outline-variant/20 transition-colors ${
                    isActive
                      ? "bg-secondary/5 hover:bg-secondary/10"
                      : "hover:bg-surface-container-high/50"
                  }`}
                >
                  {/* Column 1: Concurso / Órgão */}
                  <TableCell className="py-4 pl-6 align-top">
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-on-surface leading-snug">
                        {exam.title}
                      </div>
                      <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
                        <span>{exam.institution}</span>
                        {exam.exam_board && (
                          <>
                            <span>•</span>
                            <span className="text-primary font-medium">{exam.exam_board}</span>
                          </>
                        )}
                      </div>
                      <div className="text-[11px] text-on-surface-variant/80">{exam.role}</div>
                    </div>
                  </TableCell>

                  {/* Column 2: Esfera & UF */}
                  <TableCell className="py-4 align-top">
                    <div className="space-y-1">
                      <Badge
                        variant="outline"
                        className="bg-surface-container text-on-surface text-[11px] border-outline-variant/40"
                      >
                        {formatSphere(exam.sphere)}
                      </Badge>
                      <div className="text-xs text-on-surface-variant font-medium">
                        {exam.state === "BR" ? "Nacional" : exam.state}
                        {exam.city ? ` - ${exam.city}` : ""}
                      </div>
                    </div>
                  </TableCell>

                  {/* Column 3: Escolaridade */}
                  <TableCell className="py-4 align-top">
                    <div className="text-xs font-medium text-on-surface">
                      {formatEducation(exam.education_level)}
                    </div>
                  </TableCell>

                  {/* Column 4: Vagas & Salário */}
                  <TableCell className="py-4 align-top">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-on-surface flex items-center gap-1">
                        <Users className="w-3 h-3 text-primary" />
                        <span>
                          {exam.vacancies > 0
                            ? `${exam.vacancies.toLocaleString("pt-BR")} vagas`
                            : "A definir"}
                        </span>
                      </div>
                      <div className="text-xs text-secondary font-semibold flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>{formatCurrency(exam.salary)}</span>
                      </div>
                      {exam.vacancies_reserve != null && exam.vacancies_reserve > 0 && (
                        <div className="text-[10px] text-on-surface-variant">
                          +{exam.vacancies_reserve} CR
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Column 5: Data da Prova */}
                  <TableCell className="py-4 align-top">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-on-surface flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-purple-400" />
                        <span>{formatDate(exam.exam_date)}</span>
                      </div>
                      {exam.registration_end_date && (
                        <div className="text-[10px] text-on-surface-variant">
                          Inscrições até {formatDate(exam.registration_end_date)}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Column 6: Status */}
                  <TableCell className="py-4 align-top">{getStatusBadge(exam.status)}</TableCell>

                  {/* Column 7: Ação */}
                  <TableCell className="py-4 pr-6 text-right align-top">
                    <div className="flex items-center justify-end gap-2">
                      {/* Official Registration External Link */}
                      {exam.registration_link && (
                        <a
                          href={exam.registration_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Acessar página de inscrição oficial"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-on-surface-variant hover:text-primary hover:bg-surface-container"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      )}

                      {/* Select Target Exam Button / Active Badge */}
                      {isActive ? (
                        <Badge className="bg-secondary/15 text-secondary border border-secondary/30 font-bold px-3 py-1 flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Foco Ativo</span>
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isUpdatingThis}
                          onClick={() => handleSelect(exam)}
                          className="h-8 px-3 text-xs font-semibold border-outline-variant/40 hover:border-primary hover:bg-primary hover:text-on-primary transition-all flex items-center gap-1.5"
                        >
                          <Target className="w-3.5 h-3.5" />
                          <span>{isUpdatingThis ? "Salvando..." : "Definir Foco"}</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ========================================================================= */}
      {/* 2. Mobile View (visible on mobile, hidden on lg screens)                  */}
      {/* ========================================================================= */}
      <div className="block lg:hidden space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-on-surface-variant font-medium">
            {sortedExams.length} {sortedExams.length === 1 ? "certame" : "certames"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDateSort}
            className="h-7 text-xs text-on-surface-variant hover:text-primary flex items-center gap-1.5 px-2"
          >
            <span>Ordenar Data</span>
            {dateSort === "asc" ? (
              <ArrowUp className="w-3.5 h-3.5 text-primary" />
            ) : dateSort === "desc" ? (
              <ArrowDown className="w-3.5 h-3.5 text-primary" />
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-on-surface-variant/50" />
            )}
          </Button>
        </div>

        {sortedExams.map((exam) => {
          const isActive = activeExam?.id === exam.id || activeExam?.slug === exam.slug;
          const isUpdatingThis = updatingId === exam.id;

          return (
            <div
              key={exam.id}
              className={`rounded-xl border p-4 space-y-3 transition-colors ${
                isActive
                  ? "border-secondary/40 bg-gradient-to-br from-surface-container-low to-secondary/5 shadow-sm"
                  : "border-outline-variant/30 bg-surface-container-low"
              }`}
            >
              {/* Badges Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {getStatusBadge(exam.status)}
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-surface-container border-outline-variant/40"
                  >
                    {formatSphere(exam.sphere)} • {exam.state === "BR" ? "Nacional" : exam.state}
                  </Badge>
                </div>

                {isActive && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20">
                    <CheckCircle2 className="w-3 h-3" />
                    Foco Ativo
                  </span>
                )}
              </div>

              {/* Title & Organization */}
              <div className="space-y-0.5">
                <h4 className="font-bold text-base text-on-surface leading-tight">{exam.title}</h4>
                <p className="text-xs text-on-surface-variant">
                  {exam.institution} {exam.exam_board ? `• ${exam.exam_board}` : ""}
                </p>
                <p className="text-[11px] text-primary font-medium">{exam.role}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-surface-container/60 border border-outline-variant/20 text-xs">
                <div>
                  <span className="text-[10px] text-on-surface-variant block">
                    Vagas &amp; Nível
                  </span>
                  <span className="font-semibold text-on-surface block">
                    {exam.vacancies > 0
                      ? `${exam.vacancies.toLocaleString("pt-BR")} vagas`
                      : "A definir"}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    {formatEducation(exam.education_level)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-on-surface-variant block">Remuneração</span>
                  <span className="font-semibold text-secondary block">
                    {formatCurrency(exam.salary)}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    Prova: {formatDate(exam.exam_date)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {isActive ? (
                  <Button
                    disabled
                    size="sm"
                    className="flex-1 bg-secondary/15 text-secondary border border-secondary/30 font-bold text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Concurso Foco Atual
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={isUpdatingThis}
                    onClick={() => handleSelect(exam)}
                    className="flex-1 bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs"
                  >
                    <Target className="w-3.5 h-3.5 mr-1.5" />
                    {isUpdatingThis ? "Definindo..." : "Definir como Foco"}
                  </Button>
                )}

                {exam.registration_link && (
                  <a
                    href={exam.registration_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-outline-variant/40 text-on-surface text-xs px-2.5"
                      title="Inscrição Oficial"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
