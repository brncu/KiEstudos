/**
 * KiA AI Study Assistant Component
 * Location: src/components/KiAMascot.tsx
 *
 * Modern, non-obtrusive AI study assistant for KiEstudos:
 * - Floating action pill at fixed bottom-6 right-6 z-40
 * - Slide-over Sheet with 3 functional tabs:
 *   1. Chat com Tutor (multi-turn AI chat powered by Gemini 2.5 Flash / deterministic engine)
 *   2. Raio-X do Edital (authentic contest data, key dates, vacancies, salary, high-weight subjects)
 *   3. Estratégia de Bancas (Cebraspe, FGV, FCC, Vunesp, Cesgranrio)
 * - 100% elimination of cartoon pet graphics, Web Audio chimes, CSS animations, and mock poke dialogues
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Sparkles,
  Bot,
  Send,
  Target,
  Award,
  FileText,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  MessageSquare,
  Trash2,
  ShieldCheck,
  BookOpen,
  Timer,
  Info,
} from "lucide-react";
import { useTargetExam } from "@/hooks/useTargetExam";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  sendKiAMessage,
  getEditalQuickInsights,
  getBancaStrategy,
  BANCA_STRATEGIES,
  isGeminiAvailable,
  type ChatMessage,
} from "@/services/kiaAssistantService";
import { getAISyllabusSummary } from "@/services/aiSyllabusReader";
import { formatDateToBR, calculateDaysRemaining } from "@/services/deterministicSyllabus";
import type { AISyllabusSummary } from "@/types/concurso";
import { Link } from "@tanstack/react-router";

// Storage keys
const STORAGE_CHAT_KEY = "kiestudos_kia_chat_history";

/**
 * Renders structured markdown-style text safely without external markdown dependencies.
 */
function MarkdownText({ content }: { content: string }) {
  const blocks = useMemo(() => {
    return content.split("\n\n").map((block, idx) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // H3 Title
      if (trimmed.startsWith("### ")) {
        return (
          <h3
            key={idx}
            className="font-bold text-sm sm:text-base text-primary mt-3 mb-1.5 flex items-center gap-1.5"
          >
            {trimmed.replace(/^###\s+/, "")}
          </h3>
        );
      }

      // H4 Subtitle
      if (trimmed.startsWith("#### ")) {
        return (
          <h4
            key={idx}
            className="font-semibold text-xs sm:text-sm text-on-surface mt-2.5 mb-1"
          >
            {trimmed.replace(/^####\s+/, "")}
          </h4>
        );
      }

      // Blockquote / Tip
      if (trimmed.startsWith("> ")) {
        const text = trimmed.replace(/^>\s+/, "");
        return (
          <div
            key={idx}
            className="p-3 my-2 rounded-xl bg-secondary/10 border-l-4 border-secondary text-xs text-on-surface leading-relaxed"
          >
            {renderInlineMarkdown(text)}
          </div>
        );
      }

      // Unordered list
      if (trimmed.includes("\n- ") || trimmed.startsWith("- ")) {
        const items = trimmed.split("\n").filter((l) => l.trim().startsWith("- "));
        return (
          <ul key={idx} className="space-y-1.5 my-2 pl-2">
            {items.map((item, itemIdx) => {
              const cleaned = item.replace(/^-\s+/, "");
              return (
                <li
                  key={itemIdx}
                  className="text-xs sm:text-sm text-on-surface-variant flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0 mt-1.5" />
                  <span>{renderInlineMarkdown(cleaned)}</span>
                </li>
              );
            })}
          </ul>
        );
      }

      // Numbered list
      if (/^\d+\.\s+/.test(trimmed)) {
        const items = trimmed.split("\n").filter((l) => /^\d+\.\s+/.test(l.trim()));
        return (
          <ol key={idx} className="space-y-1.5 my-2 pl-2">
            {items.map((item, itemIdx) => {
              const match = item.match(/^(\d+)\.\s+(.*)/);
              const num = match ? match[1] : `${itemIdx + 1}`;
              const text = match ? match[2] : item;
              return (
                <li
                  key={itemIdx}
                  className="text-xs sm:text-sm text-on-surface-variant flex items-start gap-2"
                >
                  <span className="font-bold text-xs text-secondary shrink-0 mt-0.5">
                    {num}.
                  </span>
                  <span>{renderInlineMarkdown(text || "")}</span>
                </li>
              );
            })}
          </ol>
        );
      }

      // Standard paragraph
      return (
        <p
          key={idx}
          className="text-xs sm:text-sm text-on-surface-variant leading-relaxed my-1.5"
        >
          {renderInlineMarkdown(trimmed)}
        </p>
      );
    });
  }, [content]);

  return <div className="space-y-1">{blocks}</div>;
}

/**
 * Inlines bold formatting (**bold**) and basic links safely.
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-on-surface">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch && linkMatch[1] && linkMatch[2]) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary hover:underline inline-flex items-center gap-0.5 font-semibold"
        >
          {linkMatch[1]}
          <ExternalLink className="w-3 h-3 inline-block" />
        </a>
      );
    }
    return part;
  });
}

/**
 * Main KiAMascot (KiA AI Assistant) Component
 */
export function KiAMascot() {
  const { activeExam } = useTargetExam();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "raio-x" | "bancas">("chat");
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBanca, setSelectedBanca] = useState<
    "cebraspe" | "fgv" | "fcc" | "vunesp" | "cesgranrio"
  >("cebraspe");

  const [syllabusSummary, setSyllabusSummary] = useState<AISyllabusSummary | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-detect exam board from active exam
  useEffect(() => {
    if (!activeExam?.exam_board) return;
    const lower = activeExam.exam_board.toLowerCase();
    if (lower.includes("cebraspe") || lower.includes("cespe")) setSelectedBanca("cebraspe");
    else if (lower.includes("fgv")) setSelectedBanca("fgv");
    else if (lower.includes("fcc") || lower.includes("carlos chagas")) setSelectedBanca("fcc");
    else if (lower.includes("vunesp")) setSelectedBanca("vunesp");
    else if (lower.includes("cesgranrio")) setSelectedBanca("cesgranrio");
  }, [activeExam?.exam_board]);

  // Load syllabus summary when activeExam changes
  useEffect(() => {
    if (!activeExam) {
      setSyllabusSummary(null);
      return;
    }
    let isMounted = true;
    getAISyllabusSummary(activeExam)
      .then((summary) => {
        if (isMounted) setSyllabusSummary(summary);
      })
      .catch((err) => {
        console.warn("[KiAMascot] Could not load syllabus summary:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [activeExam]);

  // Quick Insights computed from activeExam
  const quickInsights = useMemo(() => {
    if (!activeExam) return null;
    return getEditalQuickInsights(activeExam);
  }, [activeExam]);

  // Initial greeting message reflecting authentic edital data
  const initialGreeting = useMemo<ChatMessage>(() => {
    const isAi = isGeminiAvailable();
    const contestTitle = activeExam?.title;
    const roleTitle = activeExam?.role;
    const boardTitle = activeExam?.exam_board || "Banca a definir";

    if (contestTitle) {
      const isPrevisto = activeExam.status === "previsto" || !activeExam.exam_date;
      const statusText = isPrevisto
        ? "⚠️ **Situação do Edital:** Edital previsto (ainda não publicado). Sem data de prova definida."
        : activeExam.status === "encerrado"
        ? `📅 **Data da Prova:** ${formatDateToBR(activeExam.exam_date)} (Certame Encerrado / Histórico Oficial)`
        : `📅 **Data da Prova:** ${formatDateToBR(activeExam.exam_date)} (${calculateDaysRemaining(activeExam.exam_date)} dias restantes)`;

      const salaryText = activeExam.salary && activeExam.salary > 0
        ? `R$ ${activeExam.salary.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : "A definir no edital";

      const vacanciesText = activeExam.vacancies
        ? `${activeExam.vacancies.toLocaleString("pt-BR")} vagas imediatas (${activeExam.vacancies_reserve ? `+ ${activeExam.vacancies_reserve.toLocaleString("pt-BR")} CR` : "CR previsto"})`
        : "A definir";

      const text = `Olá! Sou o **KiA**, seu tutor de inteligência artificial de elite.\n\nEstou conectado ao seu concurso foco: **${contestTitle}** (${roleTitle} • ${boardTitle}).\n\n- ${statusText}\n- 💰 **Remuneração:** ${salaryText}\n- 👥 **Vagas:** ${vacanciesText}\n- 🏛️ **Banca:** ${boardTitle}\n\nO **Raio-X do Edital** completo e as **Estratégias de Banca** já foram carregados dinamicamente nas abas ao lado. Como posso acelerar sua aprovação hoje? Você pode me perguntar sobre **cronograma de estudos**, **matérias prioritárias**, **estratégia de bancas** ou **redação discursiva**!`;

      return {
        id: "initial_greeting",
        sender: "kia",
        text,
        timestamp: new Date().toISOString(),
        source: isAi ? "gemini_ai" : "deterministic_engine",
      };
    }

    return {
      id: "initial_greeting",
      sender: "kia",
      text: `Olá! Sou o **KiA**, seu tutor de inteligência artificial de elite na plataforma KiEstudos.\n\nPosso te ajudar a organizar seu ciclo de estudos, decifrar os pesos das disciplinas e traçar estratégias táticas para as principais bancas examinadoras do país.\n\nComo posso te orientar hoje?`,
      timestamp: new Date().toISOString(),
      source: isAi ? "gemini_ai" : "deterministic_engine",
    };
  }, [
    activeExam?.title,
    activeExam?.role,
    activeExam?.exam_board,
    activeExam?.status,
    activeExam?.exam_date,
    activeExam?.salary,
    activeExam?.vacancies,
    activeExam?.vacancies_reserve,
  ]);

  // Messages state with session persistence
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(STORAGE_CHAT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // Fallback to initial
      }
    }
    return [initialGreeting];
  });

  // Track active exam ID to dynamically reload and notify chat on Concurso Foco switch
  const currentExamIdRef = useRef<string | null>(activeExam?.id || activeExam?.slug || null);

  useEffect(() => {
    const currentId = activeExam?.id || activeExam?.slug || null;
    if (currentExamIdRef.current && currentId && currentExamIdRef.current !== currentId && activeExam) {
      const isPrevisto = activeExam.status === "previsto" || !activeExam.exam_date;
      const formattedDate = activeExam.exam_date
        ? formatDateToBR(activeExam.exam_date)
        : "Sem edital publicado";
      const salaryFormatted = activeExam.salary && activeExam.salary > 0
        ? `R$ ${activeExam.salary.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : "A definir";
      const vacanciesFormatted = activeExam.vacancies
        ? `${activeExam.vacancies.toLocaleString("pt-BR")} imediatas (${activeExam.vacancies_reserve ? `+ ${activeExam.vacancies_reserve.toLocaleString("pt-BR")} CR` : "CR previsto"})`
        : "A definir";
      const boardFormatted = activeExam.exam_board || "A definir";

      setMessages((prev) => {
        // If user hasn't chatted yet (only initial greeting exists), reload greeting cleanly
        const onlyGreeting = prev.length <= 1 && (!prev[0] || prev[0].id.startsWith("initial_greeting"));
        if (onlyGreeting) {
          return [initialGreeting];
        }

        // If user already had a chat history, append an authoritative context reload announcement
        const switchNotice: ChatMessage = {
          id: `focus_switch_${Date.now()}`,
          sender: "kia",
          text: `🎯 **Concurso Foco atualizado para:** **${activeExam.title}** (${activeExam.role} • ${boardFormatted}).\n\n` +
            (isPrevisto
              ? `⚠️ **Situação do Edital:** Edital previsto (ainda não publicado). Sem data de prova oficial definida.\n\n`
              : activeExam.status === "encerrado"
              ? `📅 **Data da Prova:** ${formattedDate} (Certame Encerrado / Histórico Oficial).\n\n`
              : `📅 **Data da Prova:** ${formattedDate} (${calculateDaysRemaining(activeExam.exam_date)} dias restantes).\n\n`) +
            `📊 **Dados Recarregados do Edital:**\n` +
            `- **Banca Organizadora:** ${boardFormatted}\n` +
            `- **Vagas:** ${vacanciesFormatted}\n` +
            `- **Remuneração:** ${salaryFormatted}\n` +
            (activeExam.registration_link ? `- **Página Oficial:** [Acessar Link Oficial](${activeExam.registration_link})\n` : "") +
            `\nO **Raio-X do Edital** e as diretrizes táticas foram atualizados com sucesso. Como posso orientar sua preparação para este certame?`,
          timestamp: new Date().toISOString(),
          source: isGeminiAvailable() ? "gemini_ai" : "deterministic_engine",
        };
        return [...prev, switchNotice];
      });
    }
    currentExamIdRef.current = currentId;
  }, [
    activeExam?.id,
    activeExam?.slug,
    activeExam?.title,
    activeExam?.role,
    activeExam?.exam_board,
    activeExam?.status,
    activeExam?.exam_date,
    activeExam?.salary,
    activeExam?.vacancies,
    activeExam?.vacancies_reserve,
    activeExam?.registration_link,
    initialGreeting,
  ]);

  // Save chat to session storage
  useEffect(() => {
    if (typeof window !== "undefined" && messages.length > 0) {
      try {
        sessionStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
      } catch {
        // ignore
      }
    }
  }, [messages]);

  // Auto-scroll chat to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (activeTab === "chat" && isOpen) {
      scrollToBottom();
    }
  }, [messages, activeTab, isOpen, scrollToBottom]);

  // Listen to cross-component "open-kia-assistant" events
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOpenEvent = (e: Event) => {
      const custom = e as CustomEvent<{ tab?: "chat" | "raio-x" | "bancas" }>;
      if (custom.detail?.tab) {
        setActiveTab(custom.detail.tab);
      }
      setIsOpen(true);
    };

    window.addEventListener("open-kia-assistant", handleOpenEvent);
    return () => window.removeEventListener("open-kia-assistant", handleOpenEvent);
  }, []);

  // Quick prompt chips
  const quickPrompts = useMemo(() => {
    const board = activeExam?.exam_board ? activeExam.exam_board.split(" ")[0] : "Cebraspe";
    return [
      "Situação do edital e data",
      "Quais matérias priorizar?",
      "Vagas e remuneração",
      `Estratégia para ${board}`,
      "Penalização de chutes",
      "Como organizar meus estudos?",
      "Dicas de redação nota 10",
      "Como revisar com SM-2?",
    ];
  }, [activeExam?.exam_board]);

  // Send message handler
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await sendKiAMessage({
        message: query,
        history: messages,
        activeExam,
        syllabusSummary,
      });

      const kiaMessage: ChatMessage = {
        id: response.id,
        sender: "kia",
        text: response.text,
        timestamp: response.timestamp,
        source: response.source,
      };

      setMessages((prev) => [...prev, kiaMessage]);
    } catch (err) {
      console.error("[KiAMascot] Error handling message:", err);
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: "kia",
        text: "Desculpe, ocorreu uma instabilidade momentânea na conexão com o assistente. Por favor, tente novamente em instantes.",
        timestamp: new Date().toISOString(),
        source: "deterministic_engine",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear chat handler
  const handleClearChat = () => {
    setMessages([initialGreeting]);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_CHAT_KEY);
    }
  };

  // Current Banca Strategy advice
  const currentBancaStrategy = useMemo(() => {
    return getBancaStrategy(selectedBanca);
  }, [selectedBanca]);

  return (
    <>
      {/* =================================================================== */}
      {/* 1. FLOATING ACTION PILL TRIGGER (Non-obtrusive at bottom-6 right-6)   */}
      {/* =================================================================== */}
      <aside className="fixed bottom-7 right-8 z-30 group" data-purpose="floating-copilot-widget">
        <div
          onClick={() => setIsOpen(true)}
          className="relative flex items-center justify-end cursor-pointer group hover:scale-110 active:scale-95 transition-all duration-300 ease-out"
        >
          <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-[#10141e] border border-white/20 relative shadow-2xl hover:border-brand-400 transition-all glow-active hover:shadow-[0_0_25px_rgba(0,180,216,0.35)] p-0.5">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrcFSbrl3hb6eRaNpjnwiQblmkoSssJaNZ-EV-tVBc-BCAyd3zK3MiJ38sgLS9fzX-j3PLrc-4RmCDtOX4O6DDON6BT2EVed0n9vj96X_w0AGoiDyjJSXQTwyJJj-hP1yUl_MoBGSF-F1LWJBsXGZmrbba5dpJvpC-RhkFLUM1-XUEFa2WICgRkirVVBO_2GOfNpGO6z1x7SeaBBhqeTWj8lNYJPH5VOiI7irJQPfZWR-5QVti2GuCjAJjVA1WdVaKTNA" 
              alt="Cobra Fumando AI" 
              className="w-full h-full filter invert mix-blend-screen select-none pointer-events-none object-contain scale-[1.38] translate-y-[-1px]" 
            />
          </div>
          <span className="absolute top-0 right-0 z-20 flex h-3.5 w-3.5 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 ring-2 ring-[#0a0e16]"></span>
          </span>
        </div>
      </aside>

      {/* =================================================================== */}
      {/* 2. SLIDE-OVER ASSISTANT DRAWER (Sheet Component)                    */}
      {/* =================================================================== */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl p-0 flex flex-col h-full bg-surface-container-lowest border-l border-outline-variant/30 text-on-surface shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <SheetHeader className="p-4 sm:p-5 border-b border-outline-variant/20 bg-surface-container-low/70 backdrop-blur-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary text-primary-foreground shadow-sm">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-base sm:text-lg font-extrabold text-on-surface flex items-center gap-2">
                    KiA — Assistente de Estudos IA
                  </SheetTitle>
                  <SheetDescription className="text-xs text-on-surface-variant">
                    Tutor inteligente & Auditor de Editais
                  </SheetDescription>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {isGeminiAvailable() ? "Gemini 2.5 Flash" : "Engine Analítica"}
              </span>
            </div>

            {/* Active Exam Status Bar */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-high/80 border border-outline-variant/30 text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <Target className="w-4 h-4 text-secondary shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-on-surface text-xs mr-1.5">
                    {activeExam ? activeExam.title : "Nenhum Concurso Foco selecionado"}
                  </span>
                  {activeExam?.exam_board && (
                    <span className="text-[10px] text-on-surface-variant font-medium">
                      ({activeExam.exam_board})
                    </span>
                  )}
                </div>
              </div>

              <Link
                to="/foco"
                onClick={() => setIsOpen(false)}
                className="shrink-0 ml-2 text-[11px] font-bold text-secondary hover:text-secondary/80 flex items-center gap-1 transition-colors"
              >
                {activeExam ? "Trocar" : "Escolher"}
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Navigation Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as any)}
              className="w-full mt-1"
            >
              <TabsList className="grid grid-cols-3 w-full bg-surface-container p-1 rounded-xl">
                <TabsTrigger
                  value="chat"
                  className="flex items-center gap-1.5 text-xs font-semibold data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chat com Tutor
                </TabsTrigger>
                <TabsTrigger
                  value="raio-x"
                  className="flex items-center gap-1.5 text-xs font-semibold data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Raio-X do Edital
                </TabsTrigger>
                <TabsTrigger
                  value="bancas"
                  className="flex items-center gap-1.5 text-xs font-semibold data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  Estratégia Bancas
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </SheetHeader>

          {/* ================================================================= */}
          {/* TAB 1: CHAT COM TUTOR                                             */}
          {/* ================================================================= */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col min-h-0 bg-surface-container-lowest">
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {messages.map((msg) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-2.5`}
                    >
                      {!isUser && (
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-secondary text-white shrink-0 shadow-sm mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                          isUser
                            ? "bg-primary text-primary-foreground rounded-tr-xs"
                            : "bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-tl-xs"
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        ) : (
                          <MarkdownText content={msg.text} />
                        )}

                        <div
                          className={`flex items-center justify-between text-[9px] pt-1.5 mt-2 border-t ${
                            isUser
                              ? "border-primary-foreground/20 text-primary-foreground/75"
                              : "border-outline-variant/15 text-on-surface-variant/65"
                          }`}
                        >
                          <span>
                            {isUser
                              ? "Você"
                              : msg.source === "gemini_ai"
                              ? "Gemini 2.5 Flash • IA Ativa"
                              : "Engine Analítica • Verificado"}
                          </span>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-start gap-2.5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-secondary text-white shrink-0 shadow-sm mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl rounded-tl-xs bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface-variant">
                      <Sparkles className="w-4 h-4 text-secondary animate-spin" />
                      <span>KiA analisando edital e diretrizes...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="px-4 py-2 border-t border-outline-variant/20 bg-surface-container-low/40">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <span className="text-[10px] text-on-surface-variant font-semibold shrink-0 mr-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-secondary" />
                    Sugestões:
                  </span>
                  {quickPrompts.map((promptText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSendMessage(promptText)}
                      className="shrink-0 px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-on-surface text-[11px] font-medium transition-all hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-50"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 sm:p-4 border-t border-outline-variant/20 bg-surface-container-lowest flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearChat}
                  title="Limpar conversa"
                  className="p-2.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors focus-visible:outline-none"
                  aria-label="Limpar histórico de conversa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex-1 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Pergunte ao KiA sobre seu edital, banca ou rotina..."
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs sm:text-sm placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="p-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary cursor-pointer"
                    aria-label="Enviar mensagem para KiA"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: RAIO-X DO EDITAL                                           */}
          {/* ================================================================= */}
          {activeTab === "raio-x" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-surface-container-lowest">
              {!activeExam || !quickInsights ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary mx-auto flex items-center justify-center">
                    <Target className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-on-surface">
                    Nenhum Concurso Foco Selecionado
                  </h3>
                  <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
                    Selecione seu certame alvo na página de Concurso Foco para desbloquear o
                    resumo analítico de vagas, remuneração e matérias de maior peso.
                  </p>
                  <Link
                    to="/foco"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
                  >
                    Selecionar Concurso Foco
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <>
                  {/* Status Banner */}
                  {quickInsights.status === "previsto" || !quickInsights.examDate ? (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                      <div className="space-y-1">
                        <span className="font-extrabold text-sm block">
                          Status: Edital Previsto (Não Publicado)
                        </span>
                        <p className="text-on-surface-variant leading-relaxed">
                          A comissão do certame ainda não publicou o edital oficial. Portanto, não
                          há data de prova definida. Cuidado com boatos na internet! Dedique sua
                          energia a fechar o núcleo básico comum pré-edital.
                        </p>
                      </div>
                    </div>
                  ) : quickInsights.status === "encerrado" ? (
                    <div className="p-4 rounded-2xl bg-slate-500/10 border border-slate-500/30 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-5 h-5 text-slate-500 shrink-0" />
                        <div>
                          <span className="font-extrabold text-sm block">
                            Data da Prova: {quickInsights.formattedExamDate}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            Situação: {quickInsights.statusLabel}
                          </span>
                        </div>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-slate-700 text-white text-center font-bold text-xs shadow-sm">
                        Prova Realizada
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-extrabold text-sm block">
                            Data da Prova: {quickInsights.formattedExamDate}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            Situação: {quickInsights.statusLabel}
                          </span>
                        </div>
                      </div>
                      {quickInsights.daysRemaining !== null && (
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-center font-bold text-xs shadow-sm">
                          {quickInsights.daysRemaining} dias
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4 KPI Cards */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Vagas */}
                    <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-on-surface-variant text-xs">
                        <span className="font-semibold">Vagas Imediatas</span>
                        <Users className="w-4 h-4 text-secondary" />
                      </div>
                      <div className="mt-2">
                        <span className="text-lg font-black text-on-surface">
                          {quickInsights.vacanciesImmediate}
                        </span>
                        <span className="text-[10px] text-on-surface-variant block mt-0.5">
                          + {quickInsights.vacanciesReserve} cadastro reserva
                        </span>
                      </div>
                    </div>

                    {/* Remuneração */}
                    <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-on-surface-variant text-xs">
                        <span className="font-semibold">Remuneração</span>
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="mt-2">
                        <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 truncate block">
                          {quickInsights.salary}
                        </span>
                        <span className="text-[10px] text-on-surface-variant block mt-0.5">
                          Inicial + benefícios
                        </span>
                      </div>
                    </div>

                    {/* Banca */}
                    <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-on-surface-variant text-xs">
                        <span className="font-semibold">Banca Organizadora</span>
                        <Award className="w-4 h-4 text-primary" />
                      </div>
                      <div className="mt-2">
                        <span className="text-sm font-bold text-on-surface block truncate">
                          {quickInsights.banca}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("bancas");
                            const lower = quickInsights.banca.toLowerCase();
                            if (lower.includes("cebraspe") || lower.includes("cespe"))
                              setSelectedBanca("cebraspe");
                            else if (lower.includes("fgv")) setSelectedBanca("fgv");
                            else if (lower.includes("fcc")) setSelectedBanca("fcc");
                            else if (lower.includes("vunesp")) setSelectedBanca("vunesp");
                            else if (lower.includes("cesgranrio")) setSelectedBanca("cesgranrio");
                          }}
                          className="text-[10px] text-secondary font-bold hover:underline mt-0.5 inline-block cursor-pointer"
                        >
                          Ver táticas da banca →
                        </button>
                      </div>
                    </div>

                    {/* Inscrições & Link Oficial */}
                    <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-on-surface-variant text-xs">
                        <span className="font-semibold">Inscrições</span>
                        <CheckCircle2 className="w-4 h-4 text-secondary" />
                      </div>
                      <div className="mt-2">
                        <span className="text-[11px] font-bold text-on-surface block truncate">
                          {quickInsights.registrationPeriod}
                        </span>
                        {quickInsights.registrationLink ? (
                          <a
                            href={quickInsights.registrationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-secondary font-bold hover:underline mt-0.5 inline-flex items-center gap-1"
                          >
                            Página Oficial <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-on-surface-variant/60 block mt-0.5">
                            Link a publicar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Matérias de Maior Peso */}
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs sm:text-sm text-on-surface flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-secondary" />
                        Disciplinas de Maior Peso & Relevância
                      </h4>
                      <span className="text-[10px] text-on-surface-variant">Top 5</span>
                    </div>

                    <div className="space-y-2">
                      {quickInsights.topDisciplines.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-on-surface">
                              {idx + 1}. {item.discipline}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
                                Peso {item.weight.toFixed(1)}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  item.importance === "alta"
                                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                    : "bg-amber-500/10 text-amber-600"
                                }`}
                              >
                                {item.importance}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.topics.map((t, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant text-[10px]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dicas Táticas do Edital */}
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2.5">
                    <h4 className="font-bold text-xs sm:text-sm text-on-surface flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Diretrizes Táticas KiA
                    </h4>
                    <ul className="space-y-1.5 text-xs text-on-surface-variant">
                      {quickInsights.tacticalTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: ESTRATÉGIA DE BANCAS                                       */}
          {/* ================================================================= */}
          {activeTab === "bancas" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-surface-container-lowest">
              {/* Banca Selector Pills */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Selecione a Banca Examinadora:
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {(
                    [
                      { id: "cebraspe", label: "Cebraspe" },
                      { id: "fgv", label: "FGV" },
                      { id: "fcc", label: "FCC" },
                      { id: "vunesp", label: "Vunesp" },
                      { id: "cesgranrio", label: "Cesgranrio" },
                    ] as const
                  ).map((b) => {
                    const isSelected = selectedBanca === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBanca(b.id)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center truncate cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                          isSelected
                            ? "bg-secondary text-slate-950 shadow-md scale-102"
                            : "bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        {b.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Banca Strategy Detailed Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-4">
                {/* Header */}
                <div className="border-b border-outline-variant/20 pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-secondary" />
                    <h3 className="font-extrabold text-base text-on-surface">
                      {currentBancaStrategy.fullName}
                    </h3>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Diretrizes oficiais de resolução, pegadinhas e regras de pontuação
                  </p>
                </div>

                {/* 1. Regra de Penalização & Chutes */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs sm:text-sm text-primary flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-secondary" />
                    Regra de Penalização & Chutes
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/20">
                    {currentBancaStrategy.penaltyRule}
                  </p>
                </div>

                {/* 2. Perfil de Português */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs sm:text-sm text-primary flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-secondary" />
                    Perfil de Língua Portuguesa
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/20">
                    {currentBancaStrategy.portugueseStyle}
                  </p>
                </div>

                {/* 3. Cobrança de Direito & Lei Seca */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs sm:text-sm text-primary flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-secondary" />
                    Cobrança de Legislação & Direito
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/20">
                    {currentBancaStrategy.lawStyle}
                  </p>
                </div>

                {/* 4. Armadilhas e Distratores */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs sm:text-sm text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    Principais Armadilhas do Examinador
                  </h4>
                  <ul className="space-y-1.5 text-xs text-on-surface-variant bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/20">
                    {currentBancaStrategy.trapsToAvoid.map((trap, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold shrink-0">⚠️</span>
                        <span>{trap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 5. Gestão de Tempo */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs sm:text-sm text-primary flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-secondary" />
                    Gestão de Tempo Recomendada
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/20">
                    {currentBancaStrategy.timeManagement}
                  </p>
                </div>

                {/* 6. Regra de Ouro */}
                <div className="p-3.5 rounded-xl bg-secondary/10 border-l-4 border-secondary text-xs space-y-1">
                  <span className="font-bold text-secondary uppercase tracking-wider text-[10px] block">
                    🏆 Regra de Ouro da Banca
                  </span>
                  <p className="font-semibold text-on-surface leading-relaxed">
                    {currentBancaStrategy.goldenRule}
                  </p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// Backwards-compatibility alias
export { KiAMascot as KiAAssistant };
