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
import { Plus, Loader2 } from "lucide-react";

export interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckTitle: string;
  onAddCard: (cardData: {
    front: string;
    back: string;
    hint?: string | undefined;
    explanation?: string | undefined;
  }) => void;
  isPending?: boolean;
}

export function AddCardDialog({
  open,
  onOpenChange,
  deckTitle,
  onAddCard,
  isPending = false,
}: AddCardDialogProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [hint, setHint] = useState("");
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) {
      setError("Por favor, preencha tanto a pergunta (frente) quanto a resposta (verso).");
      return;
    }
    setError("");
    onAddCard({
      front: front.trim(),
      back: back.trim(),
      hint: hint.trim() || undefined,
      explanation: explanation.trim() || undefined,
    });
    // Reset form
    setFront("");
    setBack("");
    setHint("");
    setExplanation("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Plus className="h-5 w-5 text-primary" aria-hidden="true" />
            Adicionar Novo Cartão
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Adicionando ao baralho <strong className="text-foreground">{deckTitle}</strong>
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
            <Label htmlFor="card-front" className="text-xs font-bold text-foreground">
              Frente do Cartão (Pergunta / Conceito) *
            </Label>
            <Textarea
              id="card-front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Ex: Qual a competência privativa do Banco Central em relação à emissão de moeda?"
              className="min-h-[70px] resize-none bg-surface-container-high/40 border-outline-variant focus-visible:ring-primary text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="card-back" className="text-xs font-bold text-foreground">
              Verso do Cartão (Resposta / Gabarito) *
            </Label>
            <Textarea
              id="card-back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Ex: Emitir moeda-papel e moeda metálica nas condições autorizadas pelo CMN."
              className="min-h-[70px] resize-none bg-surface-container-high/40 border-outline-variant focus-visible:ring-primary text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="card-hint" className="text-xs font-medium text-muted-foreground">
                Dica Mnemônica (Opcional)
              </Label>
              <Input
                id="card-hint"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="Ex: Art. 10 da Lei 4.595"
                className="bg-surface-container-high/40 border-outline-variant focus-visible:ring-primary text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="card-explanation"
                className="text-xs font-medium text-muted-foreground"
              >
                Fundamentação / Nota (Opcional)
              </Label>
              <Input
                id="card-explanation"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Ex: Lei nº 4.595/1964"
                className="bg-surface-container-high/40 border-outline-variant focus-visible:ring-primary text-xs"
              />
            </div>
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
              disabled={isPending || !front.trim() || !back.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5 shrink-0" />
                  Salvando...
                </>
              ) : (
                "Salvar Cartão"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
