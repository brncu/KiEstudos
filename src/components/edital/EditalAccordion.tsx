import React, { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Binary,
  BookOpen,
  Building2,
  Calculator,
  CheckCircle,
  Landmark,
  Percent,
  RotateCcw,
  Scale,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import type { EditalDiscipline, StudyCheckpoint } from "./types";
import { EditalTopicRow } from "./EditalTopicRow";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  Scale,
  Building2,
  Calculator,
  Binary,
  ShieldCheck,
  Landmark,
  Percent,
  TrendingUp,
};

export interface EditalAccordionProps {
  disciplines: EditalDiscipline[];
  onToggleCheckpoint: (topicId: string, field: StudyCheckpoint, value: boolean) => void;
  onMarkAllInDiscipline?: (disciplineName: string, completed: boolean) => void;
}

export function EditalAccordion({
  disciplines,
  onToggleCheckpoint,
  onMarkAllInDiscipline,
}: EditalAccordionProps) {
  // By default, open all disciplines so user has full overview
  const defaultOpenValues = useMemo(() => disciplines.map((d) => d.id), [disciplines]);

  if (disciplines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border bg-card/40">
        <p className="text-base font-semibold text-foreground">Nenhum tópico encontrado</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Ajuste os filtros de status ou o termo de pesquisa para visualizar os conteúdos do edital.
        </p>
      </div>
    );
  }

  return (
    <Accordion type="multiple" defaultValue={defaultOpenValues} className="space-y-4 w-full">
      {disciplines.map((discipline) => {
        const IconComponent = ICON_MAP[discipline.iconName] || BookOpen;
        const isAllDone = discipline.percentComplete === 100;

        return (
          <AccordionItem
            key={discipline.id}
            value={discipline.id}
            className="rounded-2xl border border-border bg-card/80 shadow-xs overflow-hidden transition-all duration-200 hover:border-border/80"
          >
            <AccordionTrigger className="px-4 py-4 sm:px-6 hover:no-underline hover:bg-muted/20 transition-colors">
              <div className="flex flex-col w-full pr-3 gap-2.5">
                {/* Upper line: Icon, Code, Title, Metrics */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold text-white shadow-xs transition-colors",
                        isAllDone
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary text-primary-foreground",
                      )}
                    >
                      <IconComponent className="h-4 w-4" aria-hidden="true" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm sm:text-base text-foreground">
                          {discipline.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5">
                          {discipline.code}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Peso médio: {discipline.weightAvg.toFixed(1)} • {discipline.totalTopics}{" "}
                        tópicos listados
                      </p>
                    </div>
                  </div>

                  {/* Right side stats badge */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-xs font-medium text-muted-foreground tabular-nums">
                      {discipline.completedTopics}/{discipline.totalTopics} dominados
                    </span>
                    <Badge
                      variant={isAllDone ? "secondary" : "default"}
                      className={cn(
                        "text-xs font-bold tabular-nums",
                        isAllDone
                          ? "bg-secondary/20 text-secondary border border-secondary/30"
                          : "bg-primary/20 text-primary border border-primary/30",
                      )}
                    >
                      {discipline.percentComplete}%
                    </Badge>
                  </div>
                </div>

                {/* Progress bar line */}
                <div className="w-full">
                  <Progress value={discipline.percentComplete} className="h-1.5 bg-muted" />
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-4 pb-4 sm:px-6 pt-2 border-t border-border/40 bg-muted/10 space-y-3">
              {/* Discipline action bar */}
              <div className="flex items-center justify-between py-1 px-1 text-xs text-muted-foreground">
                <span className="font-medium">
                  {discipline.topics.length} tópico
                  {discipline.topics.length !== 1 && "s"} exibido
                  {discipline.topics.length !== 1 && "s"}
                </span>

                {onMarkAllInDiscipline && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkAllInDiscipline(discipline.name, true)}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1 text-secondary" aria-hidden="true" />
                      Marcar todos
                    </Button>
                    <span className="text-border">|</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkAllInDiscipline(discipline.name, false)}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <RotateCcw
                        className="h-3 w-3 mr-1 text-muted-foreground"
                        aria-hidden="true"
                      />
                      Desmarcar
                    </Button>
                  </div>
                )}
              </div>

              {/* Topic Rows */}
              <div className="space-y-2.5">
                {discipline.topics.map((topic) => (
                  <EditalTopicRow key={topic.id} topic={topic} onToggle={onToggleCheckpoint} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
