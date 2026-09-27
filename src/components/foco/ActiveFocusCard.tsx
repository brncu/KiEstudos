import { useMemo } from "react";
import {
  Target,
  Clock,
  Calendar,
  DollarSign,
  Users,
  ExternalLink,
  Building2,
  GraduationCap,
  Globe,
  Sparkles,
  ArrowDown,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ConcursoExam } from "@/types/concurso";

interface ActiveFocusCardProps {
  activeExam: ConcursoExam | null;
  isLoading?: boolean;
  onSwitchExam?: () => void;
}

/**
 * Calculates remaining days until the exam date.
 */
function getCountdown(examDateStr?: string | null, status?: string) {
  if (!examDateStr) {
    return {
      text: status === "previsto" ? "Sem edital publicado" : "Data a definir",
      badgeVariant: "secondary" as const,
      isNear: false,
    };
  }

  const examDate = new Date(`${examDateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = examDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      text: "Prova realizada",
      badgeVariant: "outline" as const,
      isNear: false,
    };
  }
  if (diffDays === 0) {
    return {
      text: "Prova é HOJE!",
      badgeVariant: "destructive" as const,
      isNear: true,
    };
  }
  if (diffDays === 1) {
    return {
      text: "Falta 1 dia para a prova",
      badgeVariant: "destructive" as const,
      isNear: true,
    };
  }
  if (diffDays <= 30) {
    return {
      text: `Faltam ${diffDays} dias para a prova`,
      badgeVariant: "destructive" as const,
      isNear: true,
    };
  }

  return {
    text: `Faltam ${diffDays} dias para a prova`,
    badgeVariant: "secondary" as const,
    isNear: false,
  };
}

/**
 * Formats numeric values to Brazilian Real currency string.
 */
function formatCurrency(value?: number | null): string {
  if (value == null) return "A definir";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats ISO date string (YYYY-MM-DD) to Brazilian date (DD/MM/YYYY).
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
      return "Nível Superior";
    case "medio":
      return "Nível Médio";
    case "tecnico":
      return "Nível Técnico";
    case "fundamental":
      return "Nível Fundamental";
    default:
      return education;
  }
}

/**
 * Maps status code to label and styling classes.
 */
function getStatusDisplay(status: string) {
  switch (status) {
    case "inscricoes_abertas":
      return {
        label: "Inscrições Abertas",
        className: "bg-secondary/15 text-secondary border-secondary/30",
      };
    case "edital_publicado":
      return {
        label: "Edital Publicado",
        className: "bg-primary/15 text-primary border-primary/30",
      };
    case "autorizado":
      return {
        label: "Autorizado",
        className: "bg-tertiary/20 text-tertiary border-tertiary/30",
      };
    case "previsto":
      return {
        label: "Previsto",
        className: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      };
    case "encerrado":
      return {
        label: "Encerrado",
        className: "bg-muted text-muted-foreground border-border",
      };
    default:
      return {
        label: status,
        className: "bg-muted text-muted-foreground border-border",
      };
  }
}

export function ActiveFocusCard({
  activeExam,
  isLoading,
  onSwitchExam,
}: ActiveFocusCardProps) {
  const countdown = useMemo(
    () => getCountdown(activeExam?.exam_date, activeExam?.status),
    [activeExam?.exam_date, activeExam?.status]
  );

  const statusInfo = useMemo(
    () => (activeExam ? getStatusDisplay(activeExam.status) : null),
    [activeExam?.status]
  );

  const handleScrollToCatalog = () => {
    if (onSwitchExam) {
      onSwitchExam();
      return;
    }
    const el = document.getElementById("catalogo-concursos");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6 sm:p-8 animate-pulse space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-36 bg-surface-container-high rounded-full" />
          <div className="h-6 w-28 bg-surface-container-high rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="h-8 w-2/3 bg-surface-container-high rounded-lg" />
          <div className="h-5 w-1/2 bg-surface-container-high rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 bg-surface-container-high/60 rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  // Fallback: No Active Exam Selected
  if (!activeExam) {
    return (
      <div className="w-full rounded-2xl border border-outline-variant/30 bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-low p-6 sm:p-8 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-secondary/15 flex items-center justify-center text-secondary">
          <Target className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-xl font-bold text-on-surface">
            Nenhum Concurso Foco Selecionado
          </h3>
          <p className="text-sm text-on-surface-variant">
            Selecione seu concurso alvo para desbloquear a contagem regressiva,
            análise de edital por IA e simulados personalizados.
          </p>
        </div>
        <Button
          onClick={handleScrollToCatalog}
          className="bg-primary hover:bg-primary/90 text-on-primary font-bold shadow-md"
        >
          <ArrowDown className="w-4 h-4 mr-2" />
          Escolher Concurso no Catálogo
        </Button>
      </div>
    );
  }

  return (
    <section
      aria-label="Concurso Foco Ativo"
      className="relative overflow-hidden w-full rounded-2xl border border-outline-variant/40 bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-high p-6 sm:p-8 shadow-xl"
    >
      {/* Ambient background glows */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -left-24 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 space-y-6">
        {/* Top Badges & Countdown Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/15 text-secondary text-xs font-bold uppercase tracking-wider border border-secondary/30">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              Seu Concurso Alvo
            </span>

            {statusInfo && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.className}`}
              >
                {statusInfo.label}
              </span>
            )}
          </div>

          {/* Exam Countdown Pill */}
          <div className="flex items-center gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                countdown.isNear
                  ? "bg-destructive/15 text-destructive border border-destructive/30 animate-pulse"
                  : "bg-surface-container-high text-on-surface border border-outline-variant/30"
              }`}
            >
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{countdown.text}</span>
            </div>
          </div>
        </div>

        {/* Title, Institution & Metadata Pills */}
        <div className="space-y-3">
          {activeExam.banner_url && (
            <div className="relative w-full h-32 sm:h-44 rounded-xl overflow-hidden border border-outline-variant/30 shadow-inner group mb-3">
              <img
                src={activeExam.banner_url}
                alt={activeExam.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/40 to-transparent" />
              <div className="absolute bottom-2 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-bold text-secondary uppercase tracking-widest">
                Painel Visual Homologado
              </div>
            </div>
          )}

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight">
              {activeExam.title}
            </h2>
            <p className="text-base sm:text-lg text-primary font-medium">
              {activeExam.institution} • {activeExam.role}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {activeExam.exam_board && (
              <Badge
                variant="outline"
                className="bg-surface-container-highest/60 text-on-surface-variant border-outline-variant/40 flex items-center gap-1"
              >
                <Building2 className="w-3 h-3 text-primary" />
                <span>Banca: {activeExam.exam_board}</span>
              </Badge>
            )}

            <Badge
              variant="outline"
              className="bg-surface-container-highest/60 text-on-surface-variant border-outline-variant/40 flex items-center gap-1"
            >
              <Globe className="w-3 h-3 text-secondary" />
              <span>
                {formatSphere(activeExam.sphere)} •{" "}
                {activeExam.state === "BR"
                  ? "Nacional (BR)"
                  : activeExam.state}
              </span>
            </Badge>

            <Badge
              variant="outline"
              className="bg-surface-container-highest/60 text-on-surface-variant border-outline-variant/40 flex items-center gap-1"
            >
              <GraduationCap className="w-3 h-3 text-tertiary" />
              <span>{formatEducation(activeExam.education_level)}</span>
            </Badge>
          </div>
        </div>

        {/* 4-Column Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Metric 1: Remuneração */}
          <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 backdrop-blur-sm space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
              <DollarSign className="w-3.5 h-3.5 text-secondary" />
              <span>Remuneração Inicial</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-on-surface">
              {formatCurrency(activeExam.salary)}
            </div>
            <div className="text-[11px] text-on-surface-variant">
              Salário base inicial
            </div>
          </div>

          {/* Metric 2: Vagas Imediatas */}
          <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 backdrop-blur-sm space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>Vagas Imediatas</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-on-surface">
              {activeExam.vacancies > 0
                ? `${activeExam.vacancies.toLocaleString("pt-BR")} vagas`
                : "A definir"}
            </div>
            <div className="text-[11px] text-on-surface-variant">
              Convocação imediata
            </div>
          </div>

          {/* Metric 3: Cadastro Reserva */}
          <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 backdrop-blur-sm space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
              <UserCheck className="w-3.5 h-3.5 text-tertiary" />
              <span>Cadastro Reserva</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-on-surface">
              {activeExam.vacancies_reserve != null &&
              activeExam.vacancies_reserve > 0
                ? `${activeExam.vacancies_reserve.toLocaleString("pt-BR")} CR`
                : "Não informado"}
            </div>
            <div className="text-[11px] text-on-surface-variant">
              Validade do certame
            </div>
          </div>

          {/* Metric 4: Data da Prova */}
          <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 backdrop-blur-sm space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>Data da Prova</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-on-surface">
              {activeExam.exam_date ? formatDate(activeExam.exam_date) : "Sem edital publicado"}
            </div>
            <div className="text-[11px] text-on-surface-variant">
              {activeExam.registration_end_date
                ? `Inscrições até ${formatDate(activeExam.registration_end_date)}`
                : "A definir"}
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-outline-variant/20">
          <div className="flex flex-wrap items-center gap-3">
            {/* Prominent Official Registration Link Button */}
            {activeExam.registration_link && (
              <a
                href={activeExam.registration_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button className="bg-primary hover:bg-primary/90 text-on-primary font-bold shadow-md shadow-primary/20">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {activeExam.status === "previsto"
                    ? "Portal Oficial do Órgão"
                    : "Acessar Inscrição Oficial"}
                </Button>
              </a>
            )}

            {/* Edital URL Button */}
            {activeExam.edital_url && (
              <a
                href={activeExam.edital_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button
                  variant="outline"
                  className="border-outline-variant/40 hover:bg-surface-container-high text-on-surface"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver Edital Publicado
                </Button>
              </a>
            )}
          </div>

          {/* Switch Target Exam Button */}
          <Button
            variant="ghost"
            onClick={handleScrollToCatalog}
            className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high gap-2"
          >
            <ArrowDown className="w-4 h-4" />
            <span>Trocar Concurso Foco</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
