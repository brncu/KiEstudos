import { FileQuestion, Target, Layers, ListChecks, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface DashboardKPIsProps {
  totalQuestions?: number;
  correctQuestions?: number;
  accuracy?: number | string;
  flashcardsReviewed?: number;
  flashcardsTotal?: number;
  editalProgress?: number;
  editalCompletedTopics?: number;
  editalTotalTopics?: number;
}

export function DashboardKPIs({
  totalQuestions = 0,
  correctQuestions = 0,
  accuracy = 0,
  flashcardsReviewed = 0,
  flashcardsTotal = 0,
  editalProgress = 0,
  editalCompletedTopics = 0,
  editalTotalTopics = 0,
}: DashboardKPIsProps) {
  const numericAccuracy = typeof accuracy === "string" ? parseFloat(accuracy) || 0 : accuracy;

  const kpis = [
    {
      id: "questions",
      title: "Total Questões Resolvidas",
      value: totalQuestions.toLocaleString("pt-BR"),
      subtext: `${correctQuestions} acertos comprovados`,
      badge: "",
      icon: FileQuestion,
      iconColor: "text-primary",
      iconBg: "bg-primary/10 border-primary/20",
      trendColor: "text-primary",
      extra: (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-on-surface-variant font-label-code">
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Banco ativo de questões</span>
        </div>
      ),
    },
    {
      id: "accuracy",
      title: "Taxa de Acerto Geral",
      value: `${numericAccuracy.toFixed(1)}%`,
      subtext: "Média em baterias e simulados",
      badge: numericAccuracy >= 75 ? "Zona de Aprovação" : "Em Evolução",
      icon: Target,
      iconColor: "text-secondary",
      iconBg: "bg-secondary/10 border-secondary/20",
      trendColor: numericAccuracy >= 75 ? "text-secondary" : "text-tertiary",
      extra: (
        <div className="flex items-center gap-1 mt-2 text-xs font-label-caps text-secondary">
          <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Meta (Ponto de Corte)</span>
        </div>
      ),
    },
    {
      id: "flashcards",
      title: "Flashcards Revisados",
      value: flashcardsReviewed.toLocaleString("pt-BR"),
      subtext: `de ${flashcardsTotal} cartões cadastrados`,
      badge: "Algoritmo SM-2",
      icon: Layers,
      iconColor: "text-tertiary",
      iconBg: "bg-tertiary/10 border-tertiary/20",
      trendColor: "text-tertiary",
      extra: (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-on-surface-variant font-label-code">
          <CheckCircle2 className="w-3.5 h-3.5 text-tertiary" aria-hidden="true" />
          <span>Taxa de retenção a longo prazo</span>
        </div>
      ),
    },
    {
      id: "edital",
      title: "Edital Concluído",
      value: `${editalProgress}%`,
      subtext: `${editalCompletedTopics} de ${editalTotalTopics} tópicos cobertos`,
      badge: "Syllabus Tracker",
      icon: ListChecks,
      iconColor: "text-secondary",
      iconBg: "bg-secondary/10 border-secondary/20",
      trendColor: "text-secondary",
      extra: (
        <div className="mt-2.5 flex flex-col gap-1 w-full">
          <Progress
            value={editalProgress}
            className="h-1.5 bg-surface-container-highest"
            aria-label={`Progresso do Edital: ${editalProgress}%`}
          />
        </div>
      ),
    },
  ];

  return (
    <section aria-label="Indicadores Chave de Desempenho (KPIs)" className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={kpi.id}
              className="bg-surface-container-low border border-outline-variant/40 hover:border-outline-variant/80 transition-all duration-300 hover:shadow-xl rounded-2xl p-5 flex flex-col justify-between group hover:-translate-y-0.5"
            >
              <CardContent className="p-0 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label-caps text-xs text-outline uppercase tracking-wider font-semibold">
                    {kpi.title}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${kpi.iconBg}`}
                  >
                    <Icon className={`w-5 h-5 ${kpi.iconColor}`} aria-hidden="true" />
                  </div>
                </div>

                <div className="my-3">
                  <div className="font-display-hero text-3xl font-extrabold text-on-surface tracking-tight leading-none">
                    {kpi.value}
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-2">
                    <span className="text-xs text-on-surface-variant font-body-sm truncate">
                      {kpi.subtext}
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-label-caps font-bold tracking-wide shrink-0 bg-surface-container-high ${kpi.trendColor}`}
                    >
                      {kpi.badge}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40">{kpi.extra}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
