import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Timer,
  Bot,
  FileQuestion,
  ClipboardList,
  AlertCircle,
  FileEdit,
  Network,
  ListChecks,
  LineChart,
  Trophy,
  Award,
  Settings,
  ChevronDown,
  Moon,
  LogOut,
  Layers,
  Menu,
  Target,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { openKiAAssistant } from "@/services/kiaAssistantService";

export function AppNav() {
  const { session } = useAuth();
  const name: string =
    (session?.user?.user_metadata?.["full_name"] as string) ||
    (session?.user?.email?.split("@")[0] as string) ||
    "Concurseiro";
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/auth" });
  }

  const isPathActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(path);
  };

  const navItemClass = (path: string) => {
    const active = isPathActive(path);
    if (active) {
      return "flex items-center gap-space-sm px-space-md py-2.5 rounded-xl transition-colors bg-primary-container text-on-primary-container font-headline-sm font-bold shadow-[0_0_16px_rgba(77,142,255,0.25)]";
    }
    return "flex items-center gap-space-sm px-space-md py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors";
  };

  const disabledNavItemClass =
    "flex items-center gap-space-sm px-space-md py-2.5 rounded-xl text-on-surface-variant/60 cursor-not-allowed transition-colors";

  const renderNavContent = (onItemClick?: () => void) => (
    <div className="flex flex-col justify-between h-full">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-24 px-5 py-5 flex items-center justify-between bg-surface-container-lowest border-b border-border/40 lg:border-none">
          <Link
            to="/"
            onClick={onItemClick}
            className="flex items-center gap-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg group transition-transform active:scale-95"
            aria-label="KiEstudos Início - Ir para o Painel Principal"
            title="KiEstudos Início"
          >
            <img
              alt="KiEstudos"
              className="w-auto object-contain drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)] filter brightness-110 h-20 max-h-24"
              style={{ height: '84px', maxHeight: '96px', width: 'auto', objectFit: 'contain' }}
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZhsn3MBqnj_DUC2eSfXcfIqxn8l433i_itpnyDUgNlVOwF7wZ16-1ombFsGAvXwscPFP1f5iaNmjETPhLXjaF8pfxe3HrRyGwjQ3H7Ey9GAVlBR_9tv06OWDe4czMQ2YCv-k7R0O3HFesq8RnVkzueUqIpew-RSTvYXCYTsS0Ne4B8wIHHBWs7txHPR-4a4eUZik_zHtbOZ4Bjqo9ULE_sCZ2LRSshs-lgGCnwevUXACTlW9l-4I6QfW83ZOu1EzfovY"
            />
          </Link>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
            v2.4
          </span>
        </div>

        {/* Section 1: Estudo Ativo */}
        <div className="px-space-md pt-space-sm pb-space-xs">
          <span className="font-label-caps text-label-caps text-outline uppercase px-space-sm text-xs font-semibold tracking-wider">
            Estudo Ativo
          </span>
        </div>

        <nav aria-label="Estudo Ativo" className="flex flex-col gap-1 px-space-sm">
          <Link
            to="/"
            onClick={onItemClick}
            className={navItemClass("/")}
            aria-current={isPathActive("/") ? "page" : undefined}
          >
            <LayoutDashboard className="text-xl shrink-0" size="1em" aria-hidden="true" />
            <span className="font-body-md text-body-md">Painel</span>
          </Link>

          <Link
            to="/flashcards"
            onClick={onItemClick}
            className={navItemClass("/flashcards")}
            aria-current={isPathActive("/flashcards") ? "page" : undefined}
          >
            <Layers className="text-xl shrink-0" size="1em" aria-hidden="true" />
            <span className="font-body-md text-body-md">Flashcards</span>
            <span className="ml-auto px-1.5 py-0.5 rounded bg-primary/15 text-primary font-label-caps text-label-caps text-xs font-bold">
              SM-2
            </span>
          </Link>

          <Link
            to="/questoes"
            onClick={onItemClick}
            className={navItemClass("/questoes")}
            aria-current={isPathActive("/questoes") ? "page" : undefined}
          >
            <FileQuestion className="text-xl shrink-0" size="1em" aria-hidden="true" />
            <span className="font-body-md text-body-md">Questões &amp; Filtros</span>
          </Link>

          <Link
            to="/simulado"
            onClick={onItemClick}
            className={navItemClass("/simulado")}
            aria-current={isPathActive("/simulado") ? "page" : undefined}
          >
            <ClipboardList className="text-xl shrink-0" size="1em" aria-hidden="true" />
            <span className="font-body-md text-body-md">Simulados</span>
          </Link>

          <Link
            to="/redacao"
            onClick={onItemClick}
            className={navItemClass("/redacao")}
            aria-current={isPathActive("/redacao") ? "page" : undefined}
          >
            <FileEdit className="text-xl shrink-0" size="1em" aria-hidden="true" />
            <span className="font-body-md text-body-md">Redação &amp; Correção</span>
          </Link>

          <Link
            to="/foco"
            onClick={onItemClick}
            className={navItemClass("/foco")}
            aria-current={isPathActive("/foco") ? "page" : undefined}
          >
            <Target className="text-xl shrink-0" size="1em" aria-hidden="true" />
            <span className="font-body-md text-body-md">Concurso Foco</span>
            <span className="ml-auto px-1.5 py-0.5 rounded bg-secondary/15 text-secondary font-label-caps text-xs font-bold">
              Alvo
            </span>
          </Link>

          <button
            type="button"
            onClick={() => {
              openKiAAssistant("chat");
              if (onItemClick) onItemClick();
            }}
            className="flex items-center gap-space-sm px-space-md py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer w-full text-left group"
            title="Abrir Assistente de Estudos KiA IA"
          >
            <Bot className="text-xl shrink-0 text-secondary group-hover:scale-110 transition-transform" size="1em" aria-hidden="true" />
            <span className="font-body-md text-body-md font-medium text-on-surface">Rotina com IA</span>
            <span className="ml-auto px-1.5 py-0.5 rounded bg-secondary/15 text-secondary font-label-caps text-xs font-bold">
              IA
            </span>
          </button>

          <button
            type="button"
            disabled
            aria-disabled="true"
            className={disabledNavItemClass}
            title="Caderno de Erros automático em desenvolvimento"
          >
            <AlertCircle className="text-xl shrink-0" size="1em" aria-hidden="true" />
            <span className="font-body-md text-body-md">Caderno de Erros</span>
            <span className="ml-auto px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-caps text-xs">
              Breve
            </span>
          </button>
        </nav>

        {/* Section 2: Planejamento & Desempenho */}
        <div className="px-space-md pt-space-sm pb-space-xs mt-space-xs">
          <span className="font-label-caps text-label-caps text-outline uppercase px-space-sm text-xs font-semibold tracking-wider">
            Planejamento &amp; Desempenho
          </span>
        </div>

        <nav aria-label="Planejamento e Desempenho" className="flex flex-col gap-1 px-space-sm">
          <Link
            to="/edital"
            onClick={onItemClick}
            className={navItemClass("/edital")}
            aria-current={isPathActive("/edital") ? "page" : undefined}
          >
            <ListChecks className="text-xl shrink-0" size="1em" aria-hidden="true" />
            <span className="font-body-md text-body-md">Editais Verticalizados</span>
            <span className="ml-auto px-1.5 py-0.5 rounded bg-secondary/15 text-secondary font-label-caps text-label-caps text-xs font-bold">
              Novo
            </span>
          </Link>

          <button
            type="button"
            disabled
            aria-disabled="true"
            className={disabledNavItemClass}
            title="Mapas mentais conceituais em desenvolvimento"
          >
            <Network className="text-xl shrink-0" size="1em" aria-hidden="true" />
            <span className="font-body-md text-body-md">Mapas Mentais</span>
            <span className="ml-auto px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-caps text-xs">
              Breve
            </span>
          </button>

          <Link
            to="/dashboard"
            onClick={onItemClick}
            className={navItemClass("/dashboard")}
            aria-current={isPathActive("/dashboard") ? "page" : undefined}
          >
            <LineChart className="text-xl shrink-0" size="1em" aria-hidden="true" />
            <span className="font-body-md text-body-md">Métricas &amp; Analytics</span>
            <span className="ml-auto px-1.5 py-0.5 rounded bg-secondary/15 text-secondary font-label-caps text-label-caps text-xs font-bold">
              Novo
            </span>
          </Link>

          <button
            type="button"
            disabled
            aria-disabled="true"
            className={disabledNavItemClass}
            title="Ranking comparativo entre concurseiros"
          >
            <Trophy className="text-xl shrink-0" size="1em" aria-hidden="true" />
            <span className="font-body-md text-body-md">Ranking Global</span>
            <span className="ml-auto px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-caps text-xs">
              Breve
            </span>
          </button>
        </nav>

        {/* Section 3: Sistema */}
        <div className="px-space-md pt-space-sm pb-space-xs mt-space-xs">
          <span className="font-label-caps text-label-caps text-outline uppercase px-space-sm text-xs font-semibold tracking-wider">
            Sistema
          </span>
        </div>

        <nav aria-label="Sistema" className="flex flex-col gap-1 px-space-sm mb-space-md">
          <Link
            to="/configuracoes"
            onClick={onItemClick}
            className={navItemClass("/configuracoes")}
          >
            <Award className="text-xl text-tertiary shrink-0" size="1em" aria-hidden="true" />
            <span className="font-body-md text-body-md">Assinatura Premium</span>
            <span className="ml-auto px-1.5 py-0.5 rounded bg-tertiary/20 text-tertiary font-label-caps text-xs font-bold">
              VIP
            </span>
          </Link>

          <Link
            to="/configuracoes"
            onClick={onItemClick}
            className={navItemClass("/configuracoes")}
          >
            <Settings className="text-xl shrink-0" size="1em" aria-hidden="true" />
            <span className="font-body-md text-body-md">Configurações</span>
          </Link>
        </nav>
      </div>

      {/* User Card & Controls */}
      <div className="p-space-md bg-surface-container-low border-t border-border/40 flex flex-col gap-space-sm mt-auto">
        <div className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center font-headline-sm text-headline-sm text-primary font-bold">
                {name.substring(0, 2).toUpperCase()}
              </div>
              <span
                className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-secondary rounded-full ring-2 ring-surface-container"
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-body-md font-semibold text-on-surface leading-tight truncate">
                {name}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex items-center gap-1" aria-hidden="true">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse delay-75" />
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse delay-150" />
                </div>
                <span className="font-label-caps text-label-caps text-secondary text-xs">
                  Online
                </span>
              </div>
            </div>
          </div>
          <button
            className="text-outline hover:text-on-surface transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="Opções do Perfil"
            aria-label="Opções do Perfil do Usuário"
            type="button"
          >
            <ChevronDown className="text-lg" size="1em" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center justify-between px-space-xs pt-1">
          <button
            className="flex items-center gap-space-xs text-on-surface-variant hover:text-on-surface text-body-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1 py-0.5"
            title="Alternar Tema"
            aria-label="Alternar Tema da Interface"
            type="button"
            onClick={() => {
              const isDark = document.documentElement.classList.toggle("dark");
              if (typeof window !== "undefined") {
                localStorage.setItem("kiestudos_theme", isDark ? "dark" : "light");
              }
            }}
          >
            <Moon className="text-base" size="1em" aria-hidden="true" />
            <span className="font-body-sm text-body-sm">Escuro</span>
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-space-xs text-outline hover:text-destructive text-body-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive rounded-md px-1 py-0.5"
            title="Encerrar Sessão"
            aria-label="Encerrar Sessão da Conta"
            type="button"
          >
            <LogOut className="text-base" size="1em" aria-hidden="true" />
            <span className="font-body-sm text-body-sm">Sair</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header Navigation Bar (Visible below 1024px) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-border z-40 px-4 flex items-center justify-between shadow-sm">
        <Link
          to="/"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg group transition-transform active:scale-95"
          aria-label="KiEstudos Início - Ir para o Painel Principal"
          title="KiEstudos Início"
        >
          <img
            alt="KiEstudos"
            className="w-auto object-contain drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)] filter brightness-110 h-12 max-h-14"
            style={{ height: '48px', maxHeight: '56px', width: 'auto', objectFit: 'contain' }}
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZhsn3MBqnj_DUC2eSfXcfIqxn8l433i_itpnyDUgNlVOwF7wZ16-1ombFsGAvXwscPFP1f5iaNmjETPhLXjaF8pfxe3HrRyGwjQ3H7Ey9GAVlBR_9tv06OWDe4czMQ2YCv-k7R0O3HFesq8RnVkzueUqIpew-RSTvYXCYTsS0Ne4B8wIHHBWs7txHPR-4a4eUZik_zHtbOZ4Bjqo9ULE_sCZ2LRSshs-lgGCnwevUXACTlW9l-4I6QfW83ZOu1EzfovY"
          />
        </Link>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Abrir menu de navegação"
              className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors cursor-pointer"
            >
              <Menu className="w-6 h-6" aria-hidden="true" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 p-0 bg-surface-container-lowest border-r border-border flex flex-col justify-between overflow-y-auto"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Menu de Navegação Principal</SheetTitle>
              <SheetDescription>
                Navegue pelos módulos interativos e recursos da plataforma KiEstudos
              </SheetDescription>
            </SheetHeader>
            {renderNavContent(() => setMobileOpen(false))}
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Fixed Sidebar Navigation (Visible at lg and above) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 bg-surface-container-lowest z-50 flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.4)] border-r border-border/30 overflow-y-auto">
        {renderNavContent()}
      </aside>
    </>
  );
}
