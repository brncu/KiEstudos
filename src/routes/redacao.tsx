import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppNav } from "@/components/AppNav";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/redacao")({
  component: RedacaoPage,
});

function RedacaoPage() {
  const { user } = useAuth();
  const [redacao, setRedacao] = useState("");
  const [status, setStatus] = useState("idle");

  const handleSubmit = async () => {
    setStatus("grading");
    // Simulate AI grading taking a few seconds
    setTimeout(() => {
      setStatus("graded");

      // Automatic Notion/n8n export behind the scenes!
      // The user doesn't have to click a button for this anymore.
      fetch("https://hook.us1.make.com/dummy-n8n-webhook-for-notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          redacaoText: redacao,
          grade: 0.0, // dummy grade
          exportedAt: new Date().toISOString(),
        }),
      }).catch(console.error); // Silent failure so it's transparent to the user
    }, 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <AppNav />
      <main className="pl-72 pt-20 px-space-lg w-full">
        <h1 className="text-2xl font-bold mb-4">Redação & Correção</h1>
        <p className="text-on-surface-variant mb-6">
          Escreva sua redação abaixo. Após a correção da IA, o resultado será exportado
          automaticamente para o Notion.
        </p>

        <textarea
          className="w-full h-64 p-4 rounded-xl bg-surface-container border border-outline focus:border-primary focus:ring-1 focus:ring-primary mb-4"
          placeholder="Comece a digitar sua redação aqui..."
          value={redacao}
          onChange={(e) => setRedacao(e.target.value)}
          disabled={status !== "idle"}
        />

        {status === "idle" && (
          <button
            className="px-6 py-2 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary/90 transition-colors"
            onClick={handleSubmit}
          >
            Enviar para Correção IA
          </button>
        )}

        {status === "grading" && (
          <p className="text-secondary font-bold animate-pulse">
            A IA está corrigindo sua redação...
          </p>
        )}

        {status === "graded" && (
          <div className="p-4 bg-primary-container text-on-primary-container rounded-xl">
            <h3 className="font-bold">Redação Corrigida! Nota: 9.5</h3>
            <p className="text-sm mt-2">Exportando para o Notion em segundo plano...</p>
          </div>
        )}
      </main>
    </div>
  );
}
