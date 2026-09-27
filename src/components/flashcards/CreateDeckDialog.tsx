import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Layers, Loader2 } from "lucide-react";

export interface CreateDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateDeck: (deckData: {
    title: string;
    discipline: string;
    topic?: string | undefined;
    description?: string | undefined;
  }) => void;
  isPending?: boolean;
}

export function CreateDeckDialog({
  open,
  onOpenChange,
  onCreateDeck,
  isPending = false,
}: CreateDeckDialogProps) {
  const [title, setTitle] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Por favor, insira um título para o baralho.");
      return;
    }
    setError("");
    onCreateDeck({
      title: title.trim(),
      discipline: discipline.trim() || "Geral",
      topic: topic.trim() || undefined,
      description: description.trim() || undefined,
    });
    // Reset form
    setTitle("");
    setDiscipline("");
    setTopic("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Layers className="h-5 w-5 text-primary" aria-hidden="true" />
            Criar Novo Baralho
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Organize seus flashcards por disciplina e tema para memorização espaçada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs font-semibold"
            >
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="deck-title" className="text-xs font-bold text-foreground">
              Título do Baralho *
            </Label>
            <Input
              id="deck-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Direito Administrativo — Atos & Poderes"
              className="bg-surface-container-high/40 border-outline-variant focus-visible:ring-primary text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="deck-discipline"
                className="text-xs font-medium text-muted-foreground"
              >
                Disciplina
              </Label>
              <Input
                id="deck-discipline"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                placeholder="Ex: Direito Administrativo"
                className="bg-surface-container-high/40 border-outline-variant focus-visible:ring-primary text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deck-topic" className="text-xs font-medium text-muted-foreground">
                Assunto / Tópico
              </Label>
              <Input
                id="deck-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Atos Administrativos"
                className="bg-surface-container-high/40 border-outline-variant focus-visible:ring-primary text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deck-desc" className="text-xs font-medium text-muted-foreground">
              Descrição breve (Opcional)
            </Label>
            <Textarea
              id="deck-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Elementos, atributos e hipóteses de extinção dos atos administrativos."
              className="min-h-[60px] resize-none bg-surface-container-high/40 border-outline-variant focus-visible:ring-primary text-xs"
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border text-foreground hover:bg-surface-container-high cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || !title.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5 shrink-0" />
                  Criando...
                </>
              ) : (
                "Criar Baralho"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
