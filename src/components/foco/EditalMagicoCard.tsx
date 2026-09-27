import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  RefreshCw,
  ExternalLink,
  Users,
  DollarSign,
  Calendar,
  Clock,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  Target,
  Award,
  Layers,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getAISyllabusSummary } from "@/services/aiSyllabusReader";
import type { ConcursoExam, AISyllabusSummary } from "@/types/concurso";
import { cn } from "@/lib/utils";

interface EditalMagicoCardProps {
  activeExam: ConcursoExam | null;
  className?: string;
}

/**
 * Returns icon corresponding to date milestone type.
 */
function getDateIcon(type: AISyllabusSummary["keyDates"][number]["type"]) {
  switch (type) {
    case "inscricao":
      return <ExternalLink className="w-4 h-4 text-emerald-500 shrink-0" />;
    case "isencao":
      return <Award className="w-4 h-4 text-amber-500 shrink-0" />;
    case "pagamento":
      return <DollarSign className="w-4 h-4 text-primary shrink-0" />;
    case "prova":
      return <Calendar className="w-4 h-4 text-rose-500 shrink-0" />;
    case "gabarito":
      return <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />;
    case "resultado":
      return <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0" />;
    default:
      return <Clock className="w-4 h-4 text-secondary shrink-0" />;
  }
}

/**
 * Formats countdown badge text and styling for key dates.
 */
function renderCountdownBadge(daysRemaining?: number) {
  if (daysRemaining == null) return null;

  if (daysRemaining < 0) {
    return (
      <Badge
        variant="outline"
        className="text-[11px] font-semibold text-muted-foreground border-outline-variant/30 bg-surface-container-high/40"
      >
        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
        Concluído
      </Badge>
    );
  }

  if (daysRemaining === 0) {
    return (
      <Badge className="bg-rose-500 text-white text-[11px] font-bold animate-pulse">
        É HOJE!
      </Badge>
    );
  }

  if (daysRemaining === 1) {
    return (
      <Badge className="bg-rose-500 text-white text-[11px] font-bold">
        Amanhã
      </Badge>
    );
  }

  if (daysRemaining <= 15) {
    return (
      <Badge className="bg-amber-500 text-white text-[11px] font-bold">
        Faltam {daysRemaining} dias
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold"
    >
      Faltam {daysRemaining} dias
    </Badge>
  );
}

/**
 * Returns importance badge styling for programmatic content disciplines.
 */
function renderImportanceBadge(importance: "alta" | "media" | "baixa") {
  switch (importance) {
    case "alta":
      return (
        <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold uppercase">
          Alta Relevância
        </Badge>
      );
    case "media":
      return (
        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold uppercase">
          Média Relevância
        </Badge>
      );
    case "baixa":
      return (
        <Badge
          variant="outline"
          className="text-on-surface-variant border-outline-variant/30 text-[10px] uppercase"
        >
          Complementar
        </Badge>
      );
  }
}

/**
 * Formats registration status badge.
 */
function renderRegistrationStatusBadge(
  status: AISyllabusSummary["registration"]["status"]
) {
  switch (status) {
    case "abertas":
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-0.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse" />
          Inscrições Abertas
        </Badge>
      );
    case "em_breve":
      return (
        <Badge className="bg-amber-500 text-white text-xs font-bold px-2.5 py-0.5">
          Inscrições em Breve
        </Badge>
      );
    case "previstas":
      return (
        <Badge
          variant="secondary"
          className="text-xs font-semibold px-2.5 py-0.5"
        >
          Edital Previsto
        </Badge>
      );
    case "encerradas":
      return (
        <Badge
          variant="outline"
          className="text-on-surface-variant border-outline-variant/40 text-xs px-2.5 py-0.5"
        >
          Inscrições Encerradas
        </Badge>
      );
  }
}

export function EditalMagicoCard({
  activeExam,
  className,
}: EditalMagicoCardProps) {
  const [summary, setSummary] = useState<AISyllabusSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch summary whenever activeExam changes
  useEffect(() => {
    if (!activeExam) {
      setSummary(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    getAISyllabusSummary(activeExam, false)
      .then((data) => {
        if (isMounted) {
          setSummary(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("[EditalMagicoCard] Error loading syllabus summary:", err);
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeExam?.id, activeExam?.slug]);

  // Handle explicit refresh request
  const handleRefresh = async () => {
    if (!activeExam) return;
    setRefreshing(true);
    try {
      const refreshed = await getAISyllabusSummary(activeExam, true);
      setSummary(refreshed);
    } catch (err) {
      console.error("[EditalMagicoCard] Error refreshing summary:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Empty State: No active exam selected
  // ---------------------------------------------------------------------------
  if (!activeExam) {
    return (
      <section
        id="edital-magico-container"
        aria-labelledby="edital-magico-title"
        className={cn(
          "w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6 sm:p-8 text-center space-y-4",
          className
        )}
      >
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h2
            id="edital-magico-title"
            className="text-lg sm:text-xl font-bold text-on-surface"
          >
            Edital Mágico com IA
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Selecione um concurso no catálogo abaixo ou utilize o assistente para
            ativar a análise automatizada por inteligência artificial.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const el = document.getElementById("catalogo-concursos");
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="border-primary/30 text-primary hover:bg-primary/5 text-xs font-semibold gap-1.5"
        >
          <Target className="w-3.5 h-3.5" />
          <span>Explorar Catálogo de Concursos</span>
        </Button>
      </section>
    );
  }

  // ---------------------------------------------------------------------------
  // Loading Skeleton State
  // ---------------------------------------------------------------------------
  if (loading && !summary) {
    return (
      <section
        id="edital-magico-container"
        aria-labelledby="edital-magico-title"
        className={cn(
          "w-full rounded-2xl border border-primary/30 bg-gradient-to-br from-surface-container-low via-surface-container to-primary/5 p-6 sm:p-7 shadow-lg relative overflow-hidden space-y-6",
          className
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-64" />
            </div>
          </div>
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>

        {/* Skeleton Registration Banner */}
        <Skeleton className="h-24 w-full rounded-xl" />

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>

        {/* Skeleton Timeline */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>

        {/* Skeleton Accordion */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </section>
    );
  }

  if (!summary) return null;

  return (
    <section
      id="edital-magico-container"
      aria-labelledby="edital-magico-title"
      className={cn(
        "w-full rounded-2xl border border-primary/30 bg-gradient-to-br from-surface-container-low via-surface-container to-primary/5 p-6 sm:p-7 shadow-lg relative overflow-hidden space-y-6",
        className
      )}
    >
      {/* Decorative ambient background blur */}
      <div
        className="absolute -top-24 -right-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* ===================================================================== */}
      {/* 1. Header: Title, AI Badges, Refresh Button                           */}
      {/* ===================================================================== */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30">
                Inteligência Artificial KiEstudos
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                Síntese Automatizada do Edital
              </span>
            </div>
            <h2
              id="edital-magico-title"
              className="text-lg sm:text-xl font-black text-on-surface tracking-tight"
            >
              Edital Mágico com IA —{" "}
              <span className="text-primary">{summary.examTitle}</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {summary.source === "gemini_ai" && (
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold py-1 px-2.5 gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              Gemini 2.5 Flash • IA Ativa
            </Badge>
          )}

          {summary.source === "cached_db" && (
            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-semibold py-1 px-2.5 gap-1.5">
              <Zap className="w-3 h-3 text-blue-500" />
              Síntese em Cache
            </Badge>
          )}

          {summary.source === "deterministic_fallback" && (
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/30 text-xs font-semibold py-1 px-2.5 gap-1.5"
            >
              <Zap className="w-3 h-3 text-primary" />
              Síntese Estruturada
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-outline-variant/40 hover:bg-surface-container-high text-on-surface text-xs font-semibold gap-1.5 h-8"
            title="Recalcular análise do edital com IA"
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5 text-primary", refreshing && "animate-spin")}
            />
            <span className="hidden sm:inline">
              {refreshing ? "Atualizando..." : "Atualizar Análise"}
            </span>
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. Official Registration Callout (CRITICAL ACCEPTANCE CRITERIA)        */}
      {/* ===================================================================== */}
      <div className="relative z-10 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-emerald-900/15 to-surface-container-high border border-emerald-500/30 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {renderRegistrationStatusBadge(summary.registration.status)}
            <span className="text-xs font-medium text-on-surface-variant">
              Banca Organizadora:{" "}
              <strong className="text-on-surface">{summary.banca}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs sm:text-sm text-on-surface">
            <span>
              <strong>Período de Inscrição:</strong> {summary.registration.startDate} até{" "}
              {summary.registration.endDate}
            </span>
            <span>
              <strong>Taxa de Inscrição:</strong>{" "}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {summary.registration.fee}
              </span>
            </span>
          </div>

          <p className="text-[11px] text-on-surface-variant">
            Inscreva-se diretamente no sistema oficial da banca para garantir sua vaga e confirmação de pagamento.
          </p>
        </div>

        <div className="w-full md:w-auto shrink-0">
          <Button
            asChild
            size="lg"
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md hover:shadow-lg transition-all gap-2 h-11 px-5"
          >
            <a
              href={summary.registration.officialLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Inscrever-se na Banca Oficial (${summary.banca}) - abre em nova aba`}
            >
              <span>Inscrever-se na Banca Oficial ({summary.banca})</span>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </a>
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. Vacancies & Remuneration Cards Grid                                */}
      {/* ===================================================================== */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vacancies Card */}
        <Card className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest/80 border border-outline-variant/20 space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-outline-variant/15 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-secondary/10 text-secondary">
                <Users className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-on-surface">
                Vagas &amp; Distribuição do Certame
              </h3>
            </div>
            <span className="text-lg font-black text-secondary">
              {summary.vacancies.total.toLocaleString("pt-BR")}{" "}
              <span className="text-xs font-semibold text-on-surface-variant">
                vagas totais
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge
              variant="outline"
              className="bg-secondary/10 text-secondary border-secondary/30 font-bold"
            >
              {summary.vacancies.immediate.toLocaleString("pt-BR")} imediatas
            </Badge>
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/30 font-bold"
            >
              {summary.vacancies.reserve.toLocaleString("pt-BR")} cadastro de reserva
            </Badge>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed">
            {summary.vacancies.breakdown}
          </p>

          {(summary.vacancies.cotasPCD || summary.vacancies.cotasNegros) && (
            <div className="pt-2 border-t border-outline-variant/15 space-y-1 text-[11px] text-on-surface-variant">
              {summary.vacancies.cotasPCD && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                  <span>
                    <strong>Cotas PCD:</strong> {summary.vacancies.cotasPCD}
                  </span>
                </div>
              )}
              {summary.vacancies.cotasNegros && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>
                    <strong>Cotas Negros / PPP:</strong> {summary.vacancies.cotasNegros}
                  </span>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Remuneration Card */}
        <Card className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest/80 border border-outline-variant/20 space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-outline-variant/15 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-on-surface">
                Remuneração &amp; Benefícios
              </h3>
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {summary.remuneration.totalEstimated}
              </div>
              <span className="text-[10px] text-on-surface-variant uppercase font-bold">
                Estimativa Total Inicial
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-baseline py-1 border-b border-outline-variant/10">
              <span className="text-on-surface-variant">Vencimento Básico / Salário Base:</span>
              <strong className="text-on-surface font-bold">
                {summary.remuneration.initialSalary}
              </strong>
            </div>

            {summary.remuneration.benefits && (
              <div className="pt-1 text-on-surface-variant text-xs leading-relaxed">
                <strong className="text-on-surface">Benefícios Adicionais:</strong>{" "}
                {summary.remuneration.benefits}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ===================================================================== */}
      {/* 4. Key Dates Timeline Section                                         */}
      {/* ===================================================================== */}
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Calendar className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-on-surface">
              Cronograma de Datas Críticas &amp; Prazos do Edital
            </h3>
          </div>
          <span className="text-xs text-on-surface-variant">
            {summary.keyDates.length} marcos mapeados
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {summary.keyDates.map((milestone, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/20 space-y-2 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {getDateIcon(milestone.type)}
                  <span className="text-xs font-bold text-on-surface truncate">
                    {milestone.label}
                  </span>
                </div>
                {renderCountdownBadge(milestone.daysRemaining)}
              </div>

              <div className="text-sm font-black text-primary">
                {milestone.date}
              </div>

              {milestone.description && (
                <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
                  {milestone.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. Programmatic Content Accordion (Disciplines, Weights, Topics)      */}
      {/* ===================================================================== */}
      <div className="relative z-10 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/15 pb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                Conteúdo Programático Verticalizado
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Disciplinas e tópicos mais incidentes estruturados para planejamento de estudos
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-xs font-semibold text-primary border-primary/30"
          >
            {summary.programmaticContent.length} Disciplinas
          </Badge>
        </div>

        <Accordion
          type="multiple"
          defaultValue={["item-0", "item-1"]}
          className="w-full space-y-2"
        >
          {summary.programmaticContent.map((disc, idx) => (
            <AccordionItem
              key={idx}
              value={`item-${idx}`}
              className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest/80 px-4 py-1 data-[state=open]:border-primary/40 transition-colors"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex flex-wrap items-center justify-between gap-2 w-full pr-3 text-left">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-surface-container-high text-xs font-bold text-on-surface flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-on-surface">
                      {disc.discipline}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold"
                    >
                      Peso {disc.weight}
                    </Badge>
                    {renderImportanceBadge(disc.importance)}
                    <span className="text-[11px] text-on-surface-variant hidden sm:inline">
                      {disc.topics.length} tópicos
                    </span>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pt-1 pb-3 text-xs text-on-surface-variant border-t border-outline-variant/10">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {disc.topics.map((topic, topicIdx) => (
                    <li
                      key={topicIdx}
                      className="flex items-start gap-2 p-2 rounded-lg bg-surface-container-low/70 border border-outline-variant/15 text-xs text-on-surface"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="leading-snug">{topic}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* ===================================================================== */}
      {/* 6. AI Study Strategy & Exam Board Tactical Advice                     */}
      {/* ===================================================================== */}
      <div className="relative z-10 rounded-2xl bg-surface-container-lowest/80 border border-outline-variant/20 p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/15 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-secondary/10 text-secondary">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-on-surface">
              Estratégia de Aprovação &amp; Heurísticas da Banca ({summary.banca})
            </h3>
          </div>
          <Badge
            variant="secondary"
            className="bg-secondary/15 text-secondary text-xs font-semibold px-2.5 py-0.5"
          >
            {summary.studyStrategy.estimatedHoursRecommended} horas estimadas
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Focus Areas */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              <span>Prioridades Máximas de Conteúdo</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-on-surface-variant">
              {summary.studyStrategy.focusAreas.map((area, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tactical Tips */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Dicas Táticas para a Banca {summary.banca}</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-on-surface-variant">
              {summary.studyStrategy.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-secondary font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 7. Action Bar: CTA to Edital Verticalizado & Synchronization          */}
      {/* ===================================================================== */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-outline-variant/15">
        <div className="text-xs text-on-surface-variant text-center sm:text-left">
          <span>
            Deseja acompanhar seu progresso diário de teoria, questões e revisões?
          </span>
        </div>

        <Button
          asChild
          variant="outline"
          className="w-full sm:w-auto border-primary/30 text-primary hover:bg-primary/10 text-xs font-bold gap-2 h-10 px-4"
        >
          <Link to="/edital">
            <span>Sincronizar com Edital Verticalizado</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
