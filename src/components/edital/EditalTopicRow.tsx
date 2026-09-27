import React, { memo } from "react";
import { BookOpen, CheckCircle2, FileQuestion } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { EditalTopic, StudyCheckpoint } from "./types";
import { cn } from "@/lib/utils";

export interface EditalTopicRowProps {
  topic: EditalTopic;
  onToggle: (topicId: string, field: StudyCheckpoint, value: boolean) => void;
}

export const EditalTopicRow = memo(function EditalTopicRow({
  topic,
  onToggle,
}: EditalTopicRowProps) {
  const completedCheckpoints =
    (topic.theory_read ? 1 : 0) + (topic.questions_solved ? 1 : 0) + (topic.reviewed ? 1 : 0);

  const isCompleted = completedCheckpoints === 3;
  const isInProgress = completedCheckpoints > 0 && completedCheckpoints < 3;

  const theoryCheckboxId = `checkpoint-${topic.id}-theory`;
  const questionsCheckboxId = `checkpoint-${topic.id}-questions`;
  const reviewCheckboxId = `checkpoint-${topic.id}-reviewed`;

  return (
    <div
      className={cn(
        "group flex flex-col gap-3 p-3 sm:p-4 rounded-xl border border-border/40 bg-card/60 transition-all hover:bg-card hover:border-border hover:shadow-xs",
        isCompleted && "bg-secondary/5 border-secondary/20",
      )}
    >
      {/* Top row: Topic title, subtopic, weight and completion status */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={cn(
                "text-sm font-semibold tracking-tight text-foreground transition-colors",
                isCompleted && "line-through text-muted-foreground",
              )}
            >
              {topic.topic}
            </h4>

            {/* Weight badge */}
            <Badge
              variant="outline"
              className="text-[10px] font-mono px-1.5 py-0 border-border text-muted-foreground"
            >
              Peso {topic.weight.toFixed(1)}
            </Badge>

            {/* Status pill */}
            {isCompleted ? (
              <Badge
                variant="secondary"
                className="text-[10px] font-medium bg-secondary/20 text-secondary border-transparent"
              >
                Concluído
              </Badge>
            ) : isInProgress ? (
              <Badge
                variant="outline"
                className="text-[10px] font-medium border-tertiary/40 text-tertiary bg-tertiary/10"
              >
                Em Andamento ({completedCheckpoints}/3)
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] font-normal border-border/60 text-muted-foreground"
              >
                Não Iniciado
              </Badge>
            )}
          </div>

          {topic.subtopic && (
            <p className="text-xs text-muted-foreground leading-relaxed">{topic.subtopic}</p>
          )}
        </div>
      </div>

      {/* Bottom row: The 3 Discrete Checkboxes with Accessible Association */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-border/30">
        {/* Checkpoint 1: Teoria lida */}
        <div className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted/30 transition-colors">
          <Checkbox
            id={theoryCheckboxId}
            checked={topic.theory_read}
            onCheckedChange={(checked) => onToggle(topic.id, "theory_read", Boolean(checked))}
            aria-label={`Marcar teoria lida para: ${topic.topic}`}
            className="border-outline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <label
            htmlFor={theoryCheckboxId}
            className="text-xs font-medium cursor-pointer select-none flex items-center gap-1.5 text-foreground hover:text-primary transition-colors"
          >
            <BookOpen
              className={cn(
                "h-3.5 w-3.5 transition-colors",
                topic.theory_read ? "text-primary font-bold" : "text-muted-foreground",
              )}
              aria-hidden="true"
            />
            <span>Teoria lida</span>
          </label>
        </div>

        {/* Checkpoint 2: Questões resolvidas */}
        <div className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted/30 transition-colors">
          <Checkbox
            id={questionsCheckboxId}
            checked={topic.questions_solved}
            onCheckedChange={(checked) => onToggle(topic.id, "questions_solved", Boolean(checked))}
            aria-label={`Marcar questões resolvidas para: ${topic.topic}`}
            className="border-outline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <label
            htmlFor={questionsCheckboxId}
            className="text-xs font-medium cursor-pointer select-none flex items-center gap-1.5 text-foreground hover:text-secondary transition-colors"
          >
            <FileQuestion
              className={cn(
                "h-3.5 w-3.5 transition-colors",
                topic.questions_solved ? "text-secondary font-bold" : "text-muted-foreground",
              )}
              aria-hidden="true"
            />
            <span>Questões resolvidas</span>
          </label>
        </div>

        {/* Checkpoint 3: Revisado */}
        <div className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted/30 transition-colors">
          <Checkbox
            id={reviewCheckboxId}
            checked={topic.reviewed}
            onCheckedChange={(checked) => onToggle(topic.id, "reviewed", Boolean(checked))}
            aria-label={`Marcar revisado para: ${topic.topic}`}
            className="border-outline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <label
            htmlFor={reviewCheckboxId}
            className="text-xs font-medium cursor-pointer select-none flex items-center gap-1.5 text-foreground hover:text-tertiary transition-colors"
          >
            <CheckCircle2
              className={cn(
                "h-3.5 w-3.5 transition-colors",
                topic.reviewed ? "text-tertiary font-bold" : "text-muted-foreground",
              )}
              aria-hidden="true"
            />
            <span>Revisado</span>
          </label>
        </div>
      </div>
    </div>
  );
});
