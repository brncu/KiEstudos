import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTargetExam } from "@/hooks/useTargetExam";
import { openKiAAssistant } from "@/services/kiaAssistantService";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const generateDefaultWeeklyData = () => Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  const day = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  return {
    day: day.charAt(0).toUpperCase() + day.slice(1),
    hours: 0,
    questions: 0,
    isToday: i === 6,
  };
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { activeExam, needsOnboarding, isLoading: targetExamLoading } = useTargetExam();

  // Redirect to /onboarding if user has no concurso foco set
  useEffect(() => {
    if (!targetExamLoading && needsOnboarding) {
      navigate({ to: "/onboarding" });
    }
  }, [needsOnboarding, targetExamLoading, navigate]);

  // Queries for real user metrics
  const { data: stats } = useQuery({
    queryKey: ["dashboard_stats", user?.id],
    queryFn: async () => {
      if (!user) {
        return {
          hours: 0,
          minutes: 0,
          accuracy: 0,
          correctAnswers: 0,
          totalAnswers: 0,
          simulados: 0,
          level: 1,
          totalXP: 0,
          currentLevelXP: 0,
          nextLevelXP: 1000,
          streak: 0,
          flashcardsReviewed: 0,
          flashcardsTotal: 0,
          editalProgress: 0,
          editalCompletedTopics: 0,
          editalTotalTopics: 0,
          weeklyEvolution: generateDefaultWeeklyData(),
          weeklyAverage: "0h 00m",
          weeklyAccuracy: "0.0%",
          subjectPerformance: [] as {name: string, accuracy: number, questions: number}[],
        };
      }

      try {
        const [sessionsRes, answersRes, quizzesRes, reviewsRes, editalProgRes, topicsRes] =
          await Promise.all([
            supabase.from("study_sessions").select("minutes, session_date").eq("user_id", user.id),
            supabase.from("question_answers").select("is_correct, discipline, created_at").eq("user_id", user.id),
            supabase.from("quiz_attempts").select("score, total").eq("user_id", user.id),
            supabase
              .from("user_flashcard_reviews")
              .select("id, last_rating")
              .eq("user_id", user.id),
            supabase
              .from("user_edital_progress")
              .select("id, theory_read, exercises_done, reviews_count")
              .eq("user_id", user.id),
            supabase.from("edital_topics").select("id", { count: "exact", head: true }),
          ]);

        const totalMinutes =
          sessionsRes.data?.reduce((acc, curr) => acc + (curr.minutes || 0), 0) || 0;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        const totalAnswers = answersRes.data?.length || 0;
        const correctAnswers = answersRes.data?.filter((a) => a.is_correct).length || 0;
        const accuracy =
          totalAnswers > 0 ? parseFloat(((correctAnswers / totalAnswers) * 100).toFixed(1)) : 0;

        const simulados = quizzesRes.data?.length || 0;
        const totalXP = correctAnswers * 10 + totalMinutes * 5;
        const level = Math.floor(totalXP / 1000) + 1;
        const currentLevelXP = totalXP % 1000;
        const nextLevelXP = 1000;

        const flashcardsReviewed = reviewsRes.data?.length || 0;
        const flashcardsTotal = flashcardsReviewed > 0 ? flashcardsReviewed : 0;

        const totalEditalTopics = topicsRes.count || 0;
        const completedTopics =
          editalProgRes.data?.filter((p) => p.theory_read && (p.exercises_done || 0) > 0).length ||
          0;
        const editalProgress =
          totalEditalTopics > 0 ? Math.round((completedTopics / totalEditalTopics) * 100) : 0;

        // Weekly Evolution calculation
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const weeklyData = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(now);
          d.setDate(d.getDate() - (6 - i));
          const day = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
          return {
            date: d,
            day: day.charAt(0).toUpperCase() + day.slice(1),
            hours: 0,
            questions: 0,
            isToday: i === 6,
          };
        });

        sessionsRes.data?.forEach((session) => {
          if (!session.session_date) return;
          const sDate = new Date(session.session_date);
          const idx = weeklyData.findIndex((w) => w.date.toDateString() === sDate.toDateString());
          if (idx !== -1 && weeklyData[idx]) {
            weeklyData[idx]!.hours += (session.minutes || 0) / 60;
          }
        });

        answersRes.data?.forEach((ans) => {
          if (!ans.created_at) return;
          const aDate = new Date(ans.created_at);
          const idx = weeklyData.findIndex((w) => w.date.toDateString() === aDate.toDateString());
          if (idx !== -1 && weeklyData[idx]) {
            weeklyData[idx]!.questions += 1;
          }
        });

        const weeklyEvolution = weeklyData.map((w) => ({
          day: w.day,
          hours: parseFloat(w.hours.toFixed(1)),
          questions: w.questions,
          isToday: w.isToday,
        }));

        const recent7DaysQuestions = weeklyEvolution.reduce((acc, curr) => acc + curr.questions, 0);
        const recent7DaysHours = weeklyEvolution.reduce((acc, curr) => acc + curr.hours, 0);

        const totalRecentMins = recent7DaysHours * 60;
        const avgWeeklyMins = totalRecentMins / 7;
        const avgHours = Math.floor(avgWeeklyMins / 60);
        const avgMins = Math.round(avgWeeklyMins % 60);
        const weeklyAverage = `${avgHours}h ${String(avgMins).padStart(2, "0")}m`;

        const recentCorrects = answersRes.data?.filter((a) => {
          if (!a.created_at) return false;
          const aDate = new Date(a.created_at);
          return weeklyData[0] && aDate >= weeklyData[0].date && a.is_correct;
        }).length || 0;

        const weeklyAccuracy = recent7DaysQuestions > 0
          ? ((recentCorrects / recent7DaysQuestions) * 100).toFixed(1) + "%"
          : "0.0%";

        const subjectMap = new Map<string, { correct: number; total: number }>();
        answersRes.data?.forEach((ans) => {
          if (!ans.discipline) return;
          const subj = subjectMap.get(ans.discipline) || { correct: 0, total: 0 };
          subj.total += 1;
          if (ans.is_correct) subj.correct += 1;
          subjectMap.set(ans.discipline, subj);
        });

        const subjectPerformance = Array.from(subjectMap.entries())
          .map(([name, data]) => ({
            name,
            accuracy: Math.round((data.correct / data.total) * 100),
            questions: data.total,
          }))
          .sort((a, b) => b.questions - a.questions)
          .slice(0, 5);

        return {
          hours,
          minutes,
          accuracy,
          correctAnswers,
          totalAnswers,
          simulados,
          level,
          totalXP,
          currentLevelXP,
          nextLevelXP,
          streak: 0,
          flashcardsReviewed,
          flashcardsTotal,
          editalProgress,
          editalCompletedTopics: completedTopics,
          editalTotalTopics: totalEditalTopics,
          weeklyEvolution,
          weeklyAverage,
          weeklyAccuracy,
          subjectPerformance,
        };
      } catch {
        return {
          hours: 0,
          minutes: 0,
          accuracy: 0,
          correctAnswers: 0,
          totalAnswers: 0,
          simulados: 0,
          level: 1,
          totalXP: 0,
          currentLevelXP: 0,
          nextLevelXP: 1000,
          streak: 0,
          flashcardsReviewed: 0,
          flashcardsTotal: 0,
          editalProgress: 0,
          editalCompletedTopics: 0,
          editalTotalTopics: 0,
          weeklyEvolution: generateDefaultWeeklyData(),
          weeklyAverage: "0h 00m",
          weeklyAccuracy: "0.0%",
          subjectPerformance: [] as {name: string, accuracy: number, questions: number}[],
        };
      }
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400 bg-[#07090e]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#00b4d8] border-t-transparent animate-spin" />
          <span>Carregando painel de estudos...</span>
        </div>
      </div>
    );
  }

  const displayName =
    user?.user_metadata?.["full_name"] || user?.email?.split("@")[0] || "Concurseiro";

  const percentGoal = Math.min(100, Math.round(((stats?.hours || 0) / 40) * 100));
  const currentFormatDate = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex min-h-screen flex-col bg-[#07090e] text-slate-200 font-sans">
      <AppNav />

      <div className="lg:pl-72 flex-1 w-full flex flex-col min-w-0 overflow-hidden relative">
        {/* TopBar */}
        <header className="h-16 border-b border-white/[0.06] px-8 flex items-center justify-between bg-[#080b11]/90 backdrop-blur-md z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
              <span className="text-emerald-400 tracking-wide font-mono font-bold">SESSÃO ATIVA</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 font-normal">{currentFormatDate}</span>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
              Olá, {displayName}!
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative w-64 md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
              <input className="w-full bg-[#0e131d] border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 rounded-lg pl-9 pr-12 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all" placeholder="Buscar matérias, questões..." type="text" />
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/[0.05] border border-white/10 rounded">⌘K</kbd>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-3.5 py-1.5 bg-[#0f1420] border border-white/[0.07] rounded-lg">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Meta Semanal</span>
                <span className="text-xs font-semibold text-slate-200">{stats?.hours || 0}h / 40h <span className="text-slate-500 font-normal">({percentGoal}%)</span></span>
              </div>
              <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
            </div>
            
            <button className="relative w-9 h-9 rounded-lg bg-[#0e131d] border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white hover:border-white/20 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#00b4d8] ring-2 ring-[#0e131d]"></span>
            </button>
            
            <button className="w-9 h-9 rounded-lg bg-[#0e131d] border border-white/[0.08] flex items-center justify-center text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/10 transition-all">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-r from-[#101725] via-[#0e131d] to-[#090d15] border border-white/[0.08] p-6 shadow-xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-72 h-72 bg-[#00b4d8]/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#00b4d8]/10 border border-[#00b4d8]/20 text-[11px] font-semibold text-[#22d3ee] mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] animate-pulse"></span>
                    PAINEL DE DESEMPENHO E ESTATÍSTICAS
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight flex items-center gap-2">
                    Estatísticas Gerais de Estudo <span className="text-xl">🚀</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                    "A constância constrói aprovações inquestionáveis." Acompanhe seu ritmo de absorção, retenção mnemônica e tempo líquido diário.
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Meta Semanal</div>
                    <div className="text-sm font-bold text-white">{stats?.hours || 0}h 00m <span className="text-slate-500 text-xs font-normal">/ 40h ({percentGoal}%)</span></div>
                  </div>
                  <Link to="/simulado" className="px-4 py-2.5 rounded-xl bg-[#00b4d8] hover:bg-[#22d3ee] text-[#003642] font-bold text-xs shadow-lg shadow-[#00b4d8]/20 transition-all active:scale-95 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 6v6l4 2"></path>
                    </svg>
                    Iniciar Cronômetro
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1 */}
              <div className="p-5 rounded-xl bg-[#0e131d] border border-white/[0.07] flex flex-col justify-between hover:border-white/20 transition-colors shadow-lg">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span className="font-semibold uppercase tracking-wider text-[11px]">Horas Líquidas</span>
                    <span className="p-1.5 rounded-lg bg-[#00b4d8]/10 text-[#22d3ee]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 6v6l4 2"></path>
                      </svg>
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-white tracking-tight">{String(stats?.hours || 0).padStart(2, '0')}h {String(stats?.minutes || 0).padStart(2, '0')}m</div>
                  <div className="text-xs text-slate-400 mt-1">Hoje • Meta: <strong className="text-slate-200 font-semibold">4h</strong></div>
                  <div className="mt-2 text-[11px] text-slate-500 font-mono">Semana: {stats?.hours || 0}h {stats?.minutes || 0}m acumuladas</div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Sessão inativa</span>
                  <Link to="/simulado" className="font-semibold text-[#22d3ee] hover:text-[#00b4d8] flex items-center gap-1 transition-colors">
                    Estudar agora →
                  </Link>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="p-5 rounded-xl bg-[#0e131d] border border-white/[0.07] flex flex-col justify-between hover:border-white/20 transition-colors shadow-lg">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span className="font-semibold uppercase tracking-wider text-[11px]">Questões &amp; Taxa</span>
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-white tracking-tight">{stats?.totalAnswers || 0} <span className="text-sm font-normal text-slate-400">hoje</span></div>
                  <div className="text-xs text-emerald-400 mt-1 font-semibold">{stats?.accuracy || 0}% de acerto geral</div>
                  <div className="mt-2 text-[11px] text-slate-500 font-mono">{stats?.totalAnswers || 0} questões resolvidas</div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Banco de questões</span>
                  <Link to="/questoes" className="font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
                    Resolver bateria →
                  </Link>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="p-5 rounded-xl bg-[#0e131d] border border-white/[0.07] flex flex-col justify-between hover:border-white/20 transition-colors shadow-lg">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span className="font-semibold uppercase tracking-wider text-[11px]">Ciclo SM-2</span>
                    <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-white tracking-tight">0 <span className="text-sm font-normal text-slate-400">pendentes</span></div>
                  <div className="text-xs text-slate-400 mt-1">{stats?.flashcardsReviewed || 0} cards memorizados</div>
                  <div className="mt-2 text-[11px] text-purple-400 font-mono">Próximo ciclo em ~2h</div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Decks ativos</span>
                  <Link to="/flashcards" className="font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
                    Revisar deck →
                  </Link>
                </div>
              </div>

              {/* KPI 4 */}
              <div className="p-5 rounded-xl bg-[#0e131d] border border-white/[0.07] flex flex-col justify-between hover:border-white/20 transition-colors shadow-lg">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span className="font-semibold uppercase tracking-wider text-[11px]">Constância &amp; Fogo</span>
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                      </svg>
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-amber-400 tracking-tight">{stats?.streak || 0} dias</div>
                  <div className="text-xs text-slate-400 mt-1">Sequência ativa de estudos</div>
                  <div className="mt-2 text-[11px] text-slate-500 font-mono">Recorde pessoal: 0 dias</div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Ritmo diário</span>
                  <span className="font-semibold text-amber-300">{(stats?.streak || 0) > 0 ? 'Fogo aceso 🔥' : 'Inicie a sequência'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gráfico Semanal */}
              <div className="lg:col-span-2 rounded-2xl bg-[#0e131d] border border-white/[0.07] p-6 shadow-xl flex flex-col justify-between space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Evolução Semanal de Estudos</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Horas líquidas x Questões resolvidas nos últimos 7 dias</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00b4d8]"></span>
                      <span>Horas</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                      <span>Questões</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 pb-2 grid grid-cols-7 gap-3 items-end h-48 border-b border-white/[0.06]">
                  {(stats?.weeklyEvolution || generateDefaultWeeklyData()).map((item, index) => {
                    if (item.isToday) {
                      return (
                        <div key={index} className="flex flex-col items-center gap-2 h-full justify-end rounded-lg bg-white/[0.02] p-1 border border-white/[0.04]">
                          <div className="text-[10px] text-[#22d3ee] font-mono font-bold">Hoje</div>
                          <div className="w-full flex items-end justify-center gap-1 h-32">
                            <div className="w-3 bg-[#00b4d8]/30 rounded-t-sm" style={{height: `${item.hours || 10}%`}}></div>
                            <div className="w-3 bg-emerald-400/30 rounded-t-sm" style={{height: `${item.questions || 8}%`}}></div>
                          </div>
                          <span className="text-[11px] text-white font-bold">{item.day}</span>
                        </div>
                      )
                    } else if (item.hours === 0 && item.questions === 0) {
                      return (
                        <div key={index} className="flex flex-col items-center gap-2 h-full justify-end opacity-40">
                          <div className="text-[10px] text-slate-500 font-mono">-</div>
                          <div className="w-full flex items-end justify-center gap-1 h-32">
                            <div className="w-3 bg-white/10 rounded-t-sm" style={{height: '4%'}}></div>
                            <div className="w-3 bg-white/10 rounded-t-sm" style={{height: '4%'}}></div>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">{item.day}</span>
                        </div>
                      )
                    } else {
                      return (
                        <div key={index} className="flex flex-col items-center gap-2 h-full justify-end">
                          <div className="text-[10px] text-slate-400 font-mono">{item.hours}h</div>
                          <div className="w-full flex items-end justify-center gap-1 h-32">
                            <div className="w-3 bg-[#00b4d8]/80 rounded-t-sm" style={{height: `${Math.min(100, item.hours * 10)}%`}}></div>
                            <div className="w-3 bg-emerald-400/80 rounded-t-sm" style={{height: `${Math.min(100, item.questions * 2)}%`}}></div>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">{item.day}</span>
                        </div>
                      )
                    }
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Média diária: <strong className="text-slate-200">{stats?.weeklyAverage || "0h 00m"}</strong></span>
                  <span>Taxa de assertividade semanal: <strong className="text-emerald-400">{stats?.weeklyAccuracy || "0.0%"}</strong></span>
                  <Link to="/dashboard" className="text-[#22d3ee] hover:underline font-semibold">Ver Relatório Analítico Detalhado →</Link>
                </div>
              </div>

              {/* Taxa por Matéria */}
              <div className="rounded-2xl bg-[#0e131d] border border-white/[0.07] p-6 shadow-xl flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <h3 className="text-base font-bold text-white tracking-tight">Taxa por Matéria</h3>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">Precisão</span>
                </div>
                
                <div className="space-y-3.5 flex-1 flex flex-col justify-center">
                  {(stats?.subjectPerformance || []).length > 0 ? (
                    (stats?.subjectPerformance || []).map((subj, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-200 font-medium truncate max-w-[150px]">{subj.name}</span>
                          <span className="text-emerald-400 font-semibold font-mono">{subj.accuracy}% ({subj.questions} q)</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{width: `${subj.accuracy}%`}}></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 h-32">
                      <p className="text-xs text-center">Sem dados suficientes para gerar taxa de assertividade por disciplina.</p>
                      <Link to="/questoes" className="mt-2 text-[#22d3ee] text-xs hover:underline">Resolver questões</Link>
                    </div>
                  )}
                </div>
                
                <div className="pt-2 border-t border-white/[0.06]">
                  <Link to="/dashboard" className="block text-center w-full py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-xs font-semibold text-slate-300 border border-white/[0.08] transition-colors">
                    Ver Todas as Disciplinas
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0e131d] border border-white/[0.07] flex flex-wrap items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#22d3ee] animate-ping"></span>
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider">Plano Diário Sugerido</div>
                  <div className="text-xs text-slate-400">Complete seu ciclo de hoje: 1h de Teoria + {activeExam ? "Revisão" : "Configurar Concurso"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/foco" className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-semibold transition-colors">
                  Personalizar Metas
                </Link>
                <Link to="/simulado" className="px-4 py-2 rounded-lg bg-[#00b4d8] hover:bg-[#22d3ee] text-[#003642] text-xs font-bold transition-colors shadow-sm">
                  Começar Sessão de Estudos
                </Link>
              </div>
            </div>
          </div>
        </main>
        

      </div>
    </div>
  );
}
