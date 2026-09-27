import {
  BarChart3,
  Lightbulb,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export interface SubjectPerformance {
  name: string;
  accuracy: number;
  questionsSolved: number;
  target?: number;
  category?: string;
}

export interface SubjectPerformanceBreakdownProps {
  subjects?: SubjectPerformance[];
  targetAccuracy?: number;
}

const defaultSubjects: SubjectPerformance[] = [];

export function SubjectPerformanceBreakdown({
  subjects = defaultSubjects,
  targetAccuracy = 75,
}: SubjectPerformanceBreakdownProps) {
  const getStatusConfig = (accuracy: number, target: number) => {
    if (accuracy >= target) {
      return {
        barColor: "bg-secondary",
        textColor: "text-secondary",
        badgeColor: "bg-secondary/10 border-secondary/20 text-secondary",
        label: "Aprovado",
        icon: CheckCircle2,
      };
    }
    if (accuracy >= target - 10) {
      return {
        barColor: "bg-primary",
        textColor: "text-primary",
        badgeColor: "bg-primary/10 border-primary/20 text-primary",
        label: "Em Evolução",
        icon: AlertTriangle,
      };
    }
    return {
      barColor: "bg-error",
      textColor: "text-error",
      badgeColor: "bg-error/10 border-error/20 text-error",
      label: "Atenção Prioritária",
      icon: AlertCircle,
    };
  };

  return (
    <Card className="bg-surface-container-low border border-outline-variant/40 hover:border-outline-variant/70 transition-all rounded-2xl shadow-md p-6 flex flex-col justify-between">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
              <BarChart3 className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="font-headline-md text-headline-sm font-bold text-on-surface tracking-tight">
                Acerto por Disciplina
              </CardTitle>
              <CardDescription className="text-xs text-on-surface-variant font-body-sm">
                Desempenho relativo ao ponto de corte estabelecido
              </CardDescription>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-surface-container-high border border-outline-variant/40 text-on-surface font-label-caps font-semibold">
            Meta: &gt;{targetAccuracy}%
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col gap-3.5 my-1">
        {subjects.map((subj) => {
          const config = getStatusConfig(subj.accuracy, subj.target ?? targetAccuracy);
          const StatusIcon = config.icon;

          return (
            <div key={subj.name} className="flex flex-col gap-1 group">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                    {subj.name}
                  </span>
                  <span className="text-[10px] text-outline font-label-code hidden sm:inline">
                    ({subj.questionsSolved} q)
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-label-caps px-1.5 py-0.5 rounded border ${config.badgeColor}`}
                  >
                    <StatusIcon className="w-2.5 h-2.5" aria-hidden="true" />
                    <span>{config.label}</span>
                  </span>
                  <span
                    className={`font-bold font-display-hero text-xs w-9 text-right ${config.textColor}`}
                  >
                    {subj.accuracy}%
                  </span>
                </div>
              </div>

              {/* Progress bar with target threshold marker */}
              <div className="relative w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${config.barColor}`}
                  style={{ width: `${subj.accuracy}%` }}
                />
                {/* 75% target tick */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-outline/60 z-10"
                  style={{ left: `${targetAccuracy}%` }}
                  title={`Meta: ${targetAccuracy}%`}
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}

        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs font-label-code text-outline">
          <Link
            to="/questoes"
            className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-semibold"
          >
            <span>Praticar disciplinas com maior peso</span>
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
          <span className="text-[11px]">{subjects.length} disciplinas monitoradas</span>
        </div>
      </CardContent>
    </Card>
  );
}
