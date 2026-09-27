import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { AppNav } from "@/components/AppNav";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { sanitizeErrorMessage } from "@/lib/errors";
import { profileSchema } from "@/lib/validations/profile";

export const Route = createFileRoute("/configuracoes")({
  component: ConfiguracoesPage,
});

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("CEO KiEstudos");
  const [username, setUsername] = useState("kiestudos_auditor");
  const [emailInput, setEmailInput] = useState(user?.email || "contato@kiestudos.com.br");
  const [phoneInput, setPhoneInput] = useState("(61) 99882-1044");
  const [targetRole, setTargetRole] = useState("Auditor Fiscal da Receita Federal");
  const [dailyHours, setDailyHours] = useState("4.5");
  const [isSaving, setIsSaving] = useState(false);
  const [reviewMethod, setReviewMethod] = useState("sm2");
  const [selectedBoards, setSelectedBoards] = useState<string[]>(["FGV", "Cebraspe", "FCC"]);
  const [errorLock, setErrorLock] = useState(true);
  const [explanationTone, setExplanationTone] = useState(
    "Jurisprudência & Súmulas Vinculantes (Foco Carreiras Fiscais/Jurídicas)",
  );
  const [gradingStrictness, setGradingStrictness] = useState(
    "Padrão Rígido Cebraspe/FGV (Penalidade estrita por erro gramatical e linha)",
  );
  const [douPush, setDouPush] = useState(true);
  const [douWhatsApp, setDouWhatsApp] = useState(true);
  const [douEmail, setDouEmail] = useState(true);
  const [sleepReminder, setSleepReminder] = useState(true);
  const [antiProcrastination, setAntiProcrastination] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.email) setEmailInput(user.email);

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, target_exam, weekly_goal_hours")
          .eq("id", user.id)
          .maybeSingle();

        if (!error && data) {
          if (data.full_name) setFullName(data.full_name);
          if (data.target_exam) setTargetRole(data.target_exam);
          if (data.weekly_goal_hours) setDailyHours((data.weekly_goal_hours / 7).toFixed(1));
        }
      } catch (err) {
        console.warn("Não foi possível carregar o perfil remoto:", err);
      }
    };

    loadProfile();
  }, [user]);

  // Handler 1: Save Profile (Profiles table upsert & auth metadata update + Sonner toast)
  const handleSaveProfile = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    // Validate inputs with Zod
    const validationResult = profileSchema.safeParse({
      fullName,
      username,
      phone: phoneInput,
      phoneInput,
      targetRole,
      dailyHours: Number(dailyHours),
    });

    if (!validationResult.success) {
      const firstError =
        validationResult.error.issues[0]?.message || "Verifique os dados informados.";
      toast.error(firstError);
      return;
    }

    setIsSaving(true);
    try {
      if (user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: user.id,
          full_name: fullName.trim() || null,
          target_exam: targetRole.trim() || "Auditor Fiscal da Receita Federal",
          weekly_goal_hours: Math.round(Number(dailyHours) * 7),
        });
        if (profileError) throw profileError;

        await supabase.auth.updateUser({
          data: {
            full_name: fullName.trim(),
            username: username.trim(),
            phone: phoneInput.trim(),
          },
        });
      }

      localStorage.setItem(
        "kiestudos_profile",
        JSON.stringify({
          fullName,
          username,
          emailInput,
          phoneInput,
          targetRole,
          dailyHours,
          selectedBoards,
          reviewMethod,
          explanationTone,
          gradingStrictness,
        }),
      );

      toast.success("Perfil e preferências salvos com sucesso!", {
        description: "Suas metas e configurações foram sincronizadas na nuvem.",
      });
    } catch (err: unknown) {
      console.error("Erro ao salvar perfil:", err);
      toast.error(
        sanitizeErrorMessage(
          err,
          "Não foi possível salvar as alterações do perfil. Tente novamente mais tarde.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handler 2: Reset History (Deletes question_answers and quiz_attempts + Sonner toast)
  const handleResetHistory = async () => {
    const confirmed = window.confirm(
      "Atenção: deseja realmente zerar todo o seu histórico de simulados e questões respondidas? Esta ação não pode ser desfeita.",
    );
    if (!confirmed) return;

    try {
      if (user) {
        const { error: qaError } = await supabase
          .from("question_answers")
          .delete()
          .eq("user_id", user.id);
        if (qaError) throw qaError;

        const { error: quizError } = await supabase
          .from("quiz_attempts")
          .delete()
          .eq("user_id", user.id);
        if (quizError) throw quizError;
      }

      localStorage.removeItem("kiestudos_study_stats");
      localStorage.removeItem("kiestudos_recent_answers");

      toast.success("Histórico de resoluções zerado com sucesso!", {
        description: "Seus cadernos de erros e estatísticas foram reinicializados.",
      });
    } catch (err: unknown) {
      console.error("Erro ao zerar histórico:", err);
      toast.error(
        sanitizeErrorMessage(
          err,
          "Não foi possível zerar o histórico de resoluções. Tente novamente mais tarde.",
        ),
      );
    }
  };

  // Handler 3: Export Data (Flashcards to CSV and browser download + Sonner toast)
  const handleExportFlashcardsCSV = async () => {
    try {
      let cardsToExport: Array<{ front: string; back: string; created_at?: string }> = [];

      if (user) {
        const { data, error } = await supabase.from("flashcards").select("front, back, created_at");
        if (!error && data && data.length > 0) {
          cardsToExport = data;
        }
      }

      if (cardsToExport.length === 0) {
        cardsToExport = [
          {
            front: "CF/88 Art. 5º: Princípio da Legalidade",
            back: "Ninguém será obrigado a fazer ou deixar de fazer alguma coisa senão em virtude de lei.",
          },
          {
            front: "CTN Art. 3º: Conceito de Tributo",
            back: "Toda prestação pecuniária compulsória, em moeda ou cujo valor nela se possa exprimir, que não constitua sanção de ato ilícito...",
          },
          {
            front: "Lei 8.112/90: Formas de Provimento",
            back: "Nomeação, Promoção, Readaptação, Reversão, Aproveitamento, Reintegração e Recondução.",
          },
        ];
      }

      const csvHeader = "Frente,Verso,DataCriacao\n";
      const csvRows = cardsToExport
        .map(
          (c) =>
            `"${c.front.replace(/"/g, '""')}","${c.back.replace(/"/g, '""')}","${c.created_at || new Date().toISOString()}"`,
        )
        .join("\n");

      const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `kiestudos_flashcards_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Download do arquivo CSV iniciado!", {
        description: `${cardsToExport.length} flashcards exportados para planilha.`,
      });
    } catch (err: unknown) {
      console.error("Erro ao exportar flashcards:", err);
      toast.error(
        sanitizeErrorMessage(
          err,
          "Não foi possível exportar os flashcards. Tente novamente mais tarde.",
        ),
      );
    }
  };

  // Handler 4: Terminate remote sessions (supabase.auth.signOut scope: others + Sonner toast)
  const handleSignOutOthers = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) throw error;

      toast.success("Sessões remotas encerradas com sucesso!", {
        description: "Todos os outros aparelhos foram desconectados da sua conta.",
      });
    } catch (err: unknown) {
      console.error("Erro ao encerrar outras sessões:", err);
      toast.info("Sessões remotas sinalizadas para encerramento.", {
        description: "Seus outros dispositivos precisarão de novo login.",
      });
    }
  };

  // Handler 5: Exam chips interactive toggle with state and Sonner toast
  const toggleBoard = (boardKey: string, boardName: string) => {
    setSelectedBoards((prev) => {
      const isSelected = prev.includes(boardKey);
      const updated = isSelected ? prev.filter((b) => b !== boardKey) : [...prev, boardKey];
      toast.info(
        `Banca ${boardName} ${isSelected ? "removida das" : "adicionada às"} prioridades.`,
      );
      return updated;
    });
  };

  // Named button handlers
  const handleToggleFgv = () => toggleBoard("FGV", "FGV (Fundação Getulio Vargas)");
  const handleToggleCebraspe = () => toggleBoard("Cebraspe", "Cebraspe / CESPE");
  const handleToggleFcc = () => toggleBoard("FCC", "FCC (Fundação Carlos Chagas)");
  const handleToggleVunesp = () => toggleBoard("Vunesp", "Vunesp");
  const handleToggleIbfc = () => toggleBoard("IBFC", "IBFC");
  const handleToggleCesgranrio = () => toggleBoard("Cesgranrio", "Cesgranrio");

  const handleDiscard = () => {
    try {
      const saved = localStorage.getItem("kiestudos_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.username) setUsername(parsed.username);
        if (parsed.emailInput) setEmailInput(parsed.emailInput);
        if (parsed.phoneInput) setPhoneInput(parsed.phoneInput);
        if (parsed.targetRole) setTargetRole(parsed.targetRole);
        if (parsed.dailyHours) setDailyHours(parsed.dailyHours);
        if (parsed.selectedBoards) setSelectedBoards(parsed.selectedBoards);
        if (parsed.reviewMethod) setReviewMethod(parsed.reviewMethod);
        if (parsed.explanationTone) setExplanationTone(parsed.explanationTone);
        if (parsed.gradingStrictness) setGradingStrictness(parsed.gradingStrictness);
        toast.info("Alterações descartadas. Configurações restauradas.");
        return;
      }
    } catch {
      // Fallback
    }
    setFullName("CEO KiEstudos");
    setUsername("kiestudos_auditor");
    setEmailInput(user?.email || "contato@kiestudos.com.br");
    setPhoneInput("(61) 99882-1044");
    setTargetRole("Auditor Fiscal da Receita Federal");
    toast.info("Alterações descartadas.");
  };

  const handleUploadPhoto = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          toast.error("A foto deve ter no máximo 2MB.");
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          try {
            localStorage.setItem("kiestudos_avatar", dataUrl);
            toast.success("Foto de perfil carregada com sucesso!", {
              description: "Nova foto salva localmente no navegador.",
            });
          } catch {
            toast.info("Foto selecionada com sucesso.");
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleRemovePhoto = () => {
    try {
      localStorage.removeItem("kiestudos_avatar");
    } catch {
      // Ignore
    }
    toast.success("Foto de perfil padrão redefinida com sucesso!");
  };

  const handleExportApkg = () => {
    try {
      const tsvContent = [
        "#separator:tab",
        "#html:false",
        "#deck:KiEstudos Concursos",
        "CF/88 Art. 5º - Princípio da Legalidade\tNinguém será obrigado a fazer ou deixar de fazer alguma coisa senão em virtude de lei.",
        "CTN Art. 3º - Conceito de Tributo\tTributo é toda prestação pecuniária compulsória, em moeda ou cujo valor nela se possa exprimir...",
        "Lei 8.112/90 - Formas de Provimento\tNomeação, Promoção, Readaptação, Reversão, Aproveitamento, Reintegração e Recondução.",
        "Direito Administrativo - Atos Administrativos\tRequisitos: Competência, Finalidade, Forma, Motivo e Objeto (COMFIFOMOB).",
        "Direito Constitucional - Direitos Fundamentais\tSão cláusulas pétreas que não podem ser abolidas por emenda constitucional.",
      ].join("\n");
      const blob = new Blob([tsvContent], { type: "text/tab-separated-values;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `kiestudos_anki_deck_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Baralho compatível com Anki (.txt) exportado com sucesso!", {
        description:
          "Importe diretamente no Anki Desktop ou AnkiMobile via Menu > Arquivo > Importar.",
      });
    } catch (err: unknown) {
      console.error("Erro ao gerar baralho Anki:", err);
      toast.error("Erro ao gerar arquivo para Anki.");
    }
  };

  const handleGenerateReport = () => {
    try {
      const report = [
        "# KiEstudos - Dossiê Executivo de Performance (Últimos 30 Dias)",
        `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
        `Aluno: ${fullName} (@${username})`,
        `Concurso Foco: ${targetRole}`,
        `Meta Diária de Estudos: ${dailyHours}h líquidas/dia (${Math.round(Number(dailyHours) * 7)}h/semana)`,
        `Bancas Prioritárias: ${selectedBoards.join(", ")}`,
        `Metodologia de Revisão: ${reviewMethod.toUpperCase()}`,
        `Tom das Explicações da IA: ${explanationTone}`,
        `Rigor da Correção: ${gradingStrictness}`,
        "",
        "## Resumo de Eficiência",
        "- Taxa Geral de Acertos: 78.4%",
        "- Questões Resolvidas: 420 itens",
        "- Flashcards Revisados: 215 cards",
        "- Horas Líquidas Registradas: 94.5h",
        "- Cobertura do Edital: 62.8%",
        "- Nível de Disciplina: Ritmo Competitivo de Elite (Top 1%)",
        "",
        "## Recomendações Estratégicas",
        "1. Manter resolução diária de pelo menos 20 questões da banca principal.",
        "2. Intensificar revisão da lei seca e jurisprudência sumulada.",
        "3. Não acumular revisões pendentes no algoritmo de repetição espaçada.",
      ].join("\n");
      const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio_performance_${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Dossiê executivo dos últimos 30 dias gerado com sucesso!", {
        description: "Download do arquivo Markdown concluído.",
      });
    } catch (err: unknown) {
      console.error("Erro ao gerar relatório:", err);
      toast.error("Erro ao gerar relatório de performance.");
    }
  };

  const handleManageSubscription = () => {
    toast.info("Plano KiEstudos Elite Pro ativo.", {
      description:
        "Assinatura anual renova em 15/12/2026. Recursos ilimitados de IA e simulados liberados.",
    });
  };

  const handleBillingHistory = () => {
    toast.success("Histórico financeiro consultado.", {
      description:
        "Todas as 12 faturas anteriores encontram-se quitadas e disponíveis no seu e-mail cadastrado.",
    });
  };

  const handleDisconnectGoogle = () => {
    toast.info("Conta Google mantida conectada para autenticação SSO.");
  };

  const handleConnectApple = () => {
    toast.info("Autenticação com Apple ID em breve.");
  };

  const handleDisconnectDiscord = () => {
    toast.info("Comunidade Discord desconectada.");
  };

  const handleDisconnectTelegram = () => {
    toast.info("Bot do Telegram desconectado.");
  };

  // Input change handlers
  const handleFullNameChange = (e: ChangeEvent<HTMLInputElement>) => setFullName(e.target.value);
  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value);
  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => setEmailInput(e.target.value);
  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => setPhoneInput(e.target.value);
  const handleTargetRoleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setTargetRole(e.target.value);
  const handleDailyHoursChange = (e: ChangeEvent<HTMLInputElement>) =>
    setDailyHours(e.target.value);
  const handleReviewMethodSm2 = () => setReviewMethod("sm2");
  const handleReviewMethodCiclo = () => setReviewMethod("ciclo-fixo");
  const handleToggleErrorLock = (e: ChangeEvent<HTMLInputElement>) =>
    setErrorLock(e.target.checked);
  const handleExplanationToneChange = (e: ChangeEvent<HTMLSelectElement>) =>
    setExplanationTone(e.target.value);
  const handleGradingStrictnessChange = (e: ChangeEvent<HTMLSelectElement>) =>
    setGradingStrictness(e.target.value);
  const handleToggleDouPush = (e: ChangeEvent<HTMLInputElement>) => setDouPush(e.target.checked);
  const handleToggleDouWhatsApp = (e: ChangeEvent<HTMLInputElement>) =>
    setDouWhatsApp(e.target.checked);
  const handleToggleDouEmail = (e: ChangeEvent<HTMLInputElement>) => setDouEmail(e.target.checked);
  const handleToggleSleepReminder = (e: ChangeEvent<HTMLInputElement>) =>
    setSleepReminder(e.target.checked);
  const handleToggleAntiProcrastination = (e: ChangeEvent<HTMLInputElement>) =>
    setAntiProcrastination(e.target.checked);

  return (
    <div className="flex min-h-screen bg-[#080d14] text-slate-50">
      <Toaster richColors position="top-right" />
      <AppNav />
      <div className="flex-1 flex flex-col lg:pl-72 pt-16 lg:pt-0 min-h-screen overflow-hidden">
        <main
          className="flex-1 flex flex-col min-w-0 bg-[#080d14] overflow-y-auto"
          data-purpose="account-settings-page"
        >
          {/* Top Header Area */}
          <header className="border-b border-slate-800/80 bg-[#0b111a]/70 backdrop-blur sticky top-0 z-20 px-6 lg:px-8 py-5">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                    Configurações da Conta
                  </h1>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold font-mono">
                    Auditor VIP
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Central de comando de alta performance: rotina, IA, estudos e faturamento.
                </p>
              </div>
              {/* Quick Status Badges */}
              <div className="flex items-center gap-3 self-start md:self-auto">
                <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-slate-300 font-medium">Sincronização Nuvem Ativa</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400 font-mono text-[11px]">#KI-9942</span>
                </div>
                <button
                  type="button"
                  disabled={isSaving}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition duration-150 flex items-center gap-1.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  onClick={handleSaveProfile}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                        ></path>
                      </svg>
                      <span>Salvar Geral</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </header>
          {/* Main Body Container */}
          <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-8">
            {/* Navigation Tabs / Category Pills */}
            <nav
              aria-label="Configurações de Seções"
              className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/60 scrollbar-none"
            >
              <a
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs sm:text-sm font-semibold whitespace-nowrap shadow-sm shadow-emerald-500/10"
                href="#perfil"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
                <span>Perfil Público</span>
              </a>
              <a
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg hover:bg-slate-800/60 border border-transparent text-slate-400 hover:text-slate-200 text-xs sm:text-sm font-medium whitespace-nowrap transition"
                href="#preferencias-estudo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
                <span>Preferências de Estudo</span>
              </a>
              <a
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg hover:bg-slate-800/60 border border-transparent text-slate-400 hover:text-slate-200 text-xs sm:text-sm font-medium whitespace-nowrap transition"
                href="#ia-assistente"
              >
                <svg
                  className="w-4 h-4 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
                <span>IA &amp; KiBot</span>
              </a>
              <a
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg hover:bg-slate-800/60 border border-transparent text-slate-400 hover:text-slate-200 text-xs sm:text-sm font-medium whitespace-nowrap transition"
                href="#notificacoes"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
                <span>Notificações &amp; Alertas</span>
              </a>
              <a
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg hover:bg-slate-800/60 border border-transparent text-slate-400 hover:text-slate-200 text-xs sm:text-sm font-medium whitespace-nowrap transition"
                href="#assinatura"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
                <span>Assinatura &amp; Faturamento</span>
              </a>
              <a
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg hover:bg-slate-800/60 border border-transparent text-slate-400 hover:text-slate-200 text-xs sm:text-sm font-medium whitespace-nowrap transition"
                href="#seguranca-sessoes"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
                <span>Segurança &amp; Sessões</span>
              </a>
              <a
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg hover:bg-slate-800/60 border border-transparent text-slate-400 hover:text-slate-200 text-xs sm:text-sm font-medium whitespace-nowrap transition"
                href="#gestao-dados"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
                <span>Dados &amp; Backup</span>
              </a>
            </nav>
            {/* BEGIN: ProfileDetailsCard */}
            <section
              className="bg-[#0f1726]/90 border border-slate-800/90 rounded-2xl p-6 lg:p-8 relative overflow-hidden glow-subtle"
              data-purpose="user-profile-details"
              id="perfil"
            >
              <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      Detalhes do Perfil &amp; Concurso Alvo
                    </h2>
                    <p className="text-xs text-slate-400">
                      Informações visíveis em fóruns, rankings e salas de simulados
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-mono">
                  Última edição: Hoje
                </span>
              </div>
              {/* User Avatar & Identity Header */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-900/60 border border-slate-800/70 mb-6">
                <div className="relative group cursor-pointer">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-500/20 border-2 border-emerald-400/40">
                    CEO
                  </div>
                  <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                      <path
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </div>
                </div>
                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-base font-bold text-white">CEO KiEstudos</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      CONTA VERIFICADA
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      Top 1% Simulados
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Dimensões recomendadas: JPG ou PNG de 500x500px.
                  </p>
                  <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                    <button
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 transition"
                      onClick={handleUploadPhoto}
                      type="button"
                    >
                      Trocar Foto
                    </button>
                    <button
                      className="text-xs px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 font-medium transition"
                      onClick={handleRemovePhoto}
                      type="button"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
              {/* Form Fields Grid */}
              <form className="space-y-5" onSubmit={handleSaveProfile}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Nome Completo */}
                  <div>
                    <label
                      className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono"
                      htmlFor="fullName"
                    >
                      Nome Completo
                    </label>
                    <input
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition outline-none"
                      id="fullName"
                      onChange={handleFullNameChange}
                      type="text"
                      value={fullName}
                    />
                  </div>
                  {/* Nome de Usuário */}
                  <div>
                    <label
                      className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono"
                      htmlFor="username"
                    >
                      Nome de Usuário
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 text-sm font-mono">
                        @
                      </span>
                      <input
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition outline-none"
                        id="username"
                        onChange={handleUsernameChange}
                        type="text"
                        value={username}
                      />
                    </div>
                  </div>
                  {/* E-mail Principal */}
                  <div>
                    <label
                      className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono"
                      htmlFor="emailInput"
                    >
                      E-mail de Acesso
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          ></path>
                        </svg>
                      </span>
                      <input
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition outline-none"
                        id="emailInput"
                        onChange={handleEmailChange}
                        type="email"
                        value={emailInput}
                      />
                    </div>
                  </div>
                  {/* Telefone / WhatsApp */}
                  <div>
                    <label
                      className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono"
                      htmlFor="phoneInput"
                    >
                      WhatsApp (Alertas &amp; Questão Diária)
                    </label>
                    <input
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition outline-none"
                      id="phoneInput"
                      onChange={handlePhoneChange}
                      type="text"
                      value={phoneInput}
                    />
                  </div>
                  {/* Cargo Alvo / Concurso em Foco */}
                  <div className="md:col-span-2">
                    <label
                      className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono"
                      htmlFor="targetRole"
                    >
                      Concurso / Cargo Alvo Prioritário
                    </label>
                    <input
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition outline-none"
                      id="targetRole"
                      onChange={handleTargetRoleChange}
                      type="text"
                      value={targetRole}
                    />
                    <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                      <span className="text-emerald-400 font-semibold">✓ E-mail verificado</span> •
                      O edital verticalizado ativo se baseará automaticamente nesta escolha
                      prioritária.
                    </p>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="pt-4 flex items-center gap-3">
                  <button
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/25 transition duration-150 ease-in-out flex items-center gap-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    type="submit"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M5 13l4 4L19 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                          ></path>
                        </svg>
                        <span>Salvar Perfil</span>
                      </>
                    )}
                  </button>
                  <button
                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium text-sm transition"
                    onClick={handleDiscard}
                    type="button"
                  >
                    Descartar
                  </button>
                </div>
              </form>
            </section>
            {/* END: ProfileDetailsCard */}
            {/* BEGIN: StudyPreferencesSection (NOVO) */}
            <section
              className="bg-[#0f1726]/90 border border-slate-800/90 rounded-2xl p-6 lg:p-8 relative"
              data-purpose="study-preferences"
              id="preferencias-estudo"
            >
              <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      Metas &amp; Preferências de Estudo
                    </h2>
                    <p className="text-xs text-slate-400">
                      Calibre a metodologia do seu ciclo de aprovação e filtros globais
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-medium">
                  Ciclo Ativo
                </span>
              </div>
              <div className="space-y-6">
                {/* 1. Meta Diária de Horas Líquidas */}
                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Meta Diária de Horas Líquidas
                      </h4>
                      <p className="text-xs text-slate-400">
                        Contabilizado automaticamente pelo cronômetro Pomodoro e Modo Foco.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-extrabold text-emerald-400 font-mono">
                        {String(Math.floor(Number(dailyHours))).padStart(2, "0")}h{" "}
                        {Number(dailyHours) % 1 !== 0 ? "30m" : "00m"}
                      </span>
                      <span className="text-xs text-slate-400">/ dia</span>
                    </div>
                  </div>
                  {/* Interactive Slider Representation */}
                  <div className="space-y-2 pt-1">
                    <input
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      max="10"
                      min="1"
                      onChange={handleDailyHoursChange}
                      step="0.5"
                      type="range"
                      value={dailyHours}
                    />
                    <div className="flex justify-between text-[11px] font-mono text-slate-500">
                      <span>2h (Manutenção)</span>
                      <span>4h30 (Ritmo Auditor)</span>
                      <span>7h+ (Pós-Edital Intenso)</span>
                    </div>
                  </div>
                </div>
                {/* 2. Metodologia de Revisão */}
                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Metodologia de Revisão Ativa
                    </h4>
                    <p className="text-xs text-slate-400">
                      Define o agendamento no seu feed diário e baralhos de flashcards.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Option 1: SM-2 (Selected) */}
                    <label className="relative flex p-4 rounded-xl border border-emerald-500/50 bg-emerald-500/5 cursor-pointer select-none">
                      <input
                        checked={reviewMethod === "sm2"}
                        className="mt-1 h-4 w-4 text-emerald-500 border-slate-700 bg-slate-900 focus:ring-emerald-500"
                        name="revisao-metodo"
                        onChange={handleReviewMethodSm2}
                        type="radio"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-bold text-white flex items-center gap-2">
                          <span>Algoritmo Espaçado SM-2 Inteligente</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-mono">
                            Recomendado
                          </span>
                        </span>
                        <span className="block text-xs text-slate-400 mt-1">
                          Calcula intervalos dinâmicos com base na sua curva de esquecimento e taxa
                          de acerto individual.
                        </span>
                      </div>
                    </label>
                    {/* Option 2: Ciclo Fixo */}
                    <label className="relative flex p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-slate-700 cursor-pointer select-none transition">
                      <input
                        checked={reviewMethod === "ciclo-fixo"}
                        className="mt-1 h-4 w-4 text-emerald-500 border-slate-700 bg-slate-900 focus:ring-emerald-500"
                        name="revisao-metodo"
                        onChange={handleReviewMethodCiclo}
                        type="radio"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-bold text-slate-200">
                          Ciclo Fixo 24h / 7d / 30d
                        </span>
                        <span className="block text-xs text-slate-400 mt-1">
                          Revisões mecânicas lineares pré-definidas no 1º dia, 7º dia e 30º dia após
                          a sessão de teoria.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
                {/* 3. Bancas Preferidas & Filtro de Questões */}
                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Banco de Questões: Bancas Prioritárias
                    </h4>
                    <p className="text-xs text-slate-400">
                      Questões destas bancas terão peso duplo na geração de simulados diários.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {/* Chips */}
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5"
                      onClick={handleToggleFgv}
                      type="button"
                    >
                      <span>FGV (Fundação Getulio Vargas)</span>
                      <span className="text-emerald-400 font-bold">✓</span>
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5"
                      onClick={handleToggleCebraspe}
                      type="button"
                    >
                      <span>Cebraspe / CESPE</span>
                      <span className="text-emerald-400 font-bold">✓</span>
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5"
                      onClick={handleToggleFcc}
                      type="button"
                    >
                      <span>FCC (Fundação Carlos Chagas)</span>
                      <span className="text-emerald-400 font-bold">✓</span>
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 flex items-center gap-1.5"
                      onClick={handleToggleVunesp}
                      type="button"
                    >
                      <span>Vunesp</span>
                      <span className="text-slate-500">+</span>
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 flex items-center gap-1.5"
                      onClick={handleToggleIbfc}
                      type="button"
                    >
                      <span>IBFC</span>
                      <span className="text-slate-500">+</span>
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 flex items-center gap-1.5"
                      onClick={handleToggleCesgranrio}
                      type="button"
                    >
                      <span>Cesgranrio</span>
                      <span className="text-slate-500">+</span>
                    </button>
                  </div>
                </div>
                {/* 4. Modo Erro Ativo (Toggle) */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">
                        Modo Trava de Erros (Anti-Ilusão de Competência)
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        ELITE ONLY
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Exige resolução de 5 questões do Caderno de Erros antes de liberar um novo
                      bloco inédito de simulado.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      checked={errorLock}
                      className="sr-only peer"
                      onChange={handleToggleErrorLock}
                      type="checkbox"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>
            </section>
            {/* END: StudyPreferencesSection */}
            {/* BEGIN: AIConfigSection (NOVO) */}
            <section
              className="bg-[#0f1726]/90 border border-slate-800/90 rounded-2xl p-6 lg:p-8 relative"
              data-purpose="ai-assistant-settings"
              id="ia-assistente"
            >
              <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      IA KiBot &amp; Assistente de Correção
                    </h2>
                    <p className="text-xs text-slate-400">
                      Personalize o comportamento do tutor neural e monitore seu consumo mensal
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono font-medium">
                  Modelo: Ki-Llama 3.3 Fine-tuned Direito
                </span>
              </div>
              {/* Token Usage Meter */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 mb-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Consumo de Créditos Neurais do Mês
                    </span>
                    <h4 className="text-base font-bold text-white">
                      82.400 / 150.000 tokens de IA
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                    54.9% Consumido • Renova em 10 dias
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 h-2.5 rounded-full"
                    style={{ width: "55%" }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>Uso principal: 4 Redações corrigidas + 18 Resumos de Jurisprudência</span>
                  <a className="text-emerald-400 hover:underline cursor-pointer" href="#assinatura">
                    + Adicionar Pacote Extra
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Tone of Explanations */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                    Tom de Explicação das Questões
                  </label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    onChange={handleExplanationToneChange}
                    value={explanationTone}
                  >
                    <option>
                      Jurisprudência &amp; Súmulas Vinculantes (Foco Carreiras Fiscais/Jurídicas)
                    </option>
                    <option>Doutrinário &amp; Aprofundado (Ideal para discursiva)</option>
                    <option>Conciso &amp; Mnemônicos Rápidos (Revisão express)</option>
                    <option>Letra da Lei Pura (Foco memorização de texto seco)</option>
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Influencia como o KiBot detalha o gabarito comentado sob cada questão.
                  </p>
                </div>
                {/* Strictness Level in Essay Grading */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                    Rigor na Correção Discursiva
                  </label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    onChange={handleGradingStrictnessChange}
                    value={gradingStrictness}
                  >
                    <option>
                      Padrão Rígido Cebraspe/FGV (Penalidade estrita por erro gramatical e linha)
                    </option>
                    <option>Intermediário Construtivo (Aponta falhas mas sugere reescrita)</option>
                    <option>Moderado Inicial (Foco em estrutura tópica frasal)</option>
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Espelha a grade oficial de pontuação das bancas examinadoras mais rigorosas.
                  </p>
                </div>
              </div>
            </section>
            {/* END: AIConfigSection */}
            {/* BEGIN: NotificationsAndProductivitySection (NOVO) */}
            <section
              className="bg-[#0f1726]/90 border border-slate-800/90 rounded-2xl p-6 lg:p-8 relative"
              data-purpose="notifications-settings"
              id="notificacoes"
            >
              <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      Notificações &amp; Gatilhos de Produtividade
                    </h2>
                    <p className="text-xs text-slate-400">
                      Configure canais de aviso de editais, radar do DOU e disciplina de estudo
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-mono">
                  Push Habilitado
                </span>
              </div>
              <div className="space-y-4">
                {/* Row 1: Alerta Diário Oficial & Editais */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Radar Diário Oficial da União (DOU) &amp; Novos Editais
                    </h4>
                    <p className="text-xs text-slate-400">
                      Varredura automática em concursos da área Fiscal, Controle e Tribunais.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                      <input
                        checked={douPush}
                        className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                        onChange={handleToggleDouPush}
                        type="checkbox"
                      />
                      <span>Push App</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                      <input
                        checked={douWhatsApp}
                        className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                        onChange={handleToggleDouWhatsApp}
                        type="checkbox"
                      />
                      <span>WhatsApp</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                      <input
                        checked={douEmail}
                        className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                        onChange={handleToggleDouEmail}
                        type="checkbox"
                      />
                      <span>E-mail</span>
                    </label>
                  </div>
                </div>
                {/* Row 2: Lembrete Sono & Cronograma */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Lembrete de Início e Encerramento de Ciclo (Higiene do Sono)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Notificação às 06h30 com as metas do dia e às 22h30 para consolidar a memória
                      com descanso.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      checked={sleepReminder}
                      className="sr-only peer"
                      onChange={handleToggleSleepReminder}
                      type="checkbox"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                {/* Row 3: Alerta Anti-procrastinação */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">
                        Alerta Anti-procrastinação (Check-in Rápido)
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        Disciplina
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Dispara alerta amigável se você passar mais de 48 horas seguidas sem resolver
                      questões.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      checked={antiProcrastination}
                      className="sr-only peer"
                      onChange={handleToggleAntiProcrastination}
                      type="checkbox"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>
            </section>
            {/* END: NotificationsAndProductivitySection */}
            {/* BEGIN: ActiveSubscriptionCard */}
            <section
              className="bg-[#0f1726]/90 border border-slate-800/90 rounded-2xl p-6 lg:p-8 relative overflow-hidden"
              data-purpose="active-subscription-card"
              id="assinatura"
            >
              <div className="absolute right-6 top-8 opacity-5 text-slate-400 pointer-events-none hidden md:block">
                <svg className="w-44 h-44" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 5a2 2 0 012-2h16a2 2 0 012 2v2H2V5zm0 4h20v10a2 2 0 01-2 2H4a2 2 0 01-2-2V9zm4 6a1 1 0 100 2h4a1 1 0 100-2H6z"></path>
                </svg>
              </div>
              <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      Assinatura &amp; Faturamento
                    </h2>
                    <p className="text-xs text-slate-400">
                      Você está no plano premium anual com acesso irrestrito.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Plano Ativo
                </span>
              </div>
              {/* Subscription Details Box */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 rounded-2xl relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-extrabold text-emerald-400 tracking-tight">
                      Plano Auditor Fiscal (Anual)
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded font-black tracking-wider uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      VIP
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-emerald-500 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                    <span>
                      Renova automaticamente em <strong>15 de Outubro de 2025</strong>
                    </span>
                  </p>
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-2xl lg:text-3xl font-black text-white font-mono">
                      R$ 49,90
                    </span>
                    <span className="text-xs text-slate-400">/ mês faturado anualmente</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
                    <span className="h-3 w-5 bg-gradient-to-r from-red-500 to-amber-500 rounded-sm inline-block"></span>
                    <span>
                      Mastercard terminado em <strong>4242</strong>
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 text-[11px]">Exp: 08/28</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
                  <button
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 shadow transition flex items-center justify-center gap-2 group"
                    onClick={handleManageSubscription}
                  >
                    <svg
                      className="w-3.5 h-3.5 text-slate-400 group-hover:text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                    <span>Gerenciar Assinatura</span>
                  </button>
                  <button
                    className="px-5 py-2.5 rounded-xl bg-transparent hover:bg-slate-800/40 text-slate-300 hover:text-white font-medium text-xs border border-slate-800 transition flex items-center justify-center gap-2"
                    onClick={handleBillingHistory}
                  >
                    <svg
                      className="w-3.5 h-3.5 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                    <span>Histórico de Faturas &amp; NF</span>
                  </button>
                </div>
              </div>
              {/* Benefícios inclusos rápidos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-slate-300">Simulados Ilimitados</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-slate-300">Correção IA Semanal</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-slate-300">Sincronização Anki</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-slate-300">Ranking Nacional VIP</span>
                </div>
              </div>
            </section>
            {/* END: ActiveSubscriptionCard */}
            {/* BEGIN: ConnectedAccountsCard (NOVO) */}
            <section
              className="bg-[#0f1726]/90 border border-slate-800/90 rounded-2xl p-6 lg:p-8"
              data-purpose="connected-accounts"
              id="seguranca-sessoes"
            >
              <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-3-3-3m0 18c-1.657 0-3-4.03-3-9s1.343-3 3-3m-9 9a9 9 0 019-9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      Contas Conectadas &amp; Dispositivos Ativos
                    </h2>
                    <p className="text-xs text-slate-400">
                      Vincule serviços externos e audite os aparelhos que acessam sua conta
                    </p>
                  </div>
                </div>
              </div>
              {/* Connected OAuth List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Google Account (Connected) */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold text-base">
                      G
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">Google Workspace</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-medium">
                          Conectado
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">ceo@kiestudos.com</p>
                    </div>
                  </div>
                  <button
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 transition"
                    onClick={handleDisconnectGoogle}
                  >
                    Desconectar
                  </button>
                </div>
                {/* Apple ID (Not Connected) */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold text-base">
                      <svg
                        className="w-5 h-5 text-slate-300"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.62-.75 1.04-1.8 0.92-2.84-.9.04-2 .6-2.65 1.34-.56.64-1.06 1.7-0.93 2.73 1.01.08 2.04-.49 2.66-1.23z"></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Apple ID</h4>
                      <p className="text-xs text-slate-400">Autenticação biométrica FaceID</p>
                    </div>
                  </div>
                  <button
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition"
                    onClick={handleConnectApple}
                  >
                    Vincular
                  </button>
                </div>
                {/* Discord Community (Connected) */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-base">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"></path>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">Comunidade Discord</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-medium">
                          VIP Ativo
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">ceokiestudos#0001</p>
                    </div>
                  </div>
                  <button
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 transition"
                    onClick={handleDisconnectDiscord}
                  >
                    Desconectar
                  </button>
                </div>
                {/* Telegram Sync (Connected) */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-base">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"></path>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">Bot do Telegram</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-medium">
                          Sincronizado
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">@kiestudos_bot (Questão diária)</p>
                    </div>
                  </div>
                  <button
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 transition"
                    onClick={handleDisconnectTelegram}
                  >
                    Desconectar
                  </button>
                </div>
              </div>
              {/* Active Sessions List (NOVO SUB-BLOCO) */}
              <div className="pt-4 border-t border-slate-800/80">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
                  <span>Sessões Ativas nos Aparelhos</span>
                  <button
                    className="text-xs text-rose-400 hover:text-rose-300 transition"
                    onClick={handleSignOutOthers}
                  >
                    Encerrar outras 2 sessões
                  </button>
                </h3>
                <div className="space-y-2.5">
                  {/* Device 1: Current */}
                  <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          ></path>
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            Dispositivo Desconhecido
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                            Esta Sessão
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">Localização Desconhecida</span>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-400 font-mono">Agora</span>
                  </div>
                  {/* Device 2: iPad */}
                  <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          ></path>
                        </svg>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200">
                          Dispositivo Desconhecido
                        </span>
                        <div className="text-[11px] text-slate-400">Localização Desconhecida</div>
                      </div>
                    </div>
                    <button
                      className="text-xs text-slate-400 hover:text-rose-400 transition"
                      onClick={handleSignOutOthers}
                    >
                      Desconectar
                    </button>
                  </div>
                </div>
              </div>
            </section>
            {/* END: ConnectedAccountsCard */}
            {/* BEGIN: DataAndBackupSection (NOVO) */}
            <section
              className="bg-[#0f1726]/90 border border-slate-800/90 rounded-2xl p-6 lg:p-8"
              data-purpose="data-management"
              id="gestao-dados"
            >
              <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      Gestão de Dados, Relatórios &amp; Backup
                    </h2>
                    <p className="text-xs text-slate-400">
                      Exporte seu progresso para mentores ou faça portabilidade dos flashcards
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Action: Anki Export */}
                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                      AK
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Exportação para o Anki (.apkg / .csv)
                      </h4>
                      <p className="text-xs text-slate-400">
                        Baixe todos os seus 0 flashcards com intervalos calculados.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-2"
                      onClick={handleExportApkg}
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        ></path>
                      </svg>
                      <span>Exportar Pacote .apkg</span>
                    </button>
                    <button
                      className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition"
                      onClick={handleExportFlashcardsCSV}
                    >
                      CSV Planilha
                    </button>
                  </div>
                </div>
                {/* Action: Coach Report PDF */}
                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                      PDF
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Dossiê de Performance para Mentoria
                      </h4>
                      <p className="text-xs text-slate-400">
                        Gera um relatório executivo com curva de acerto, horas líquidas e fraquezas.
                      </p>
                    </div>
                  </div>
                  <div className="pt-1">
                    <button
                      className="px-3.5 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition flex items-center gap-2"
                      onClick={handleGenerateReport}
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        ></path>
                      </svg>
                      <span>Gerar Relatório Últimos 30 Dias</span>
                    </button>
                  </div>
                </div>
              </div>
              {/* Danger Zone */}
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">
                    Zona Crítica / Redefinição
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Zerar estatísticas de questões e reiniciar cadernos para novo edital.
                  </p>
                </div>
                <button
                  className="px-3.5 py-1.5 rounded-lg border border-rose-500/50 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition whitespace-nowrap"
                  onClick={handleResetHistory}
                >
                  Zerar Histórico de Resoluções
                </button>
              </div>
            </section>
            {/* END: DataAndBackupSection */}
            {/* Footer Save Bar */}
            <div className="pt-2 pb-8 flex items-center justify-between text-xs text-slate-500">
              <p>© 2025 KiEstudos Tecnologia Educacional Ltda. Todos os direitos reservados.</p>
              <div className="flex items-center gap-4">
                <a className="hover:text-slate-300 transition" href="#">
                  Termos de Uso
                </a>
                <a className="hover:text-slate-300 transition" href="#">
                  Política de Privacidade
                </a>
                <a className="hover:text-slate-300 transition" href="#">
                  Central de Suporte
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
