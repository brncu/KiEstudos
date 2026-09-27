import { supabase } from "@/lib/supabase";

export type Question = {
  id: string;
  discipline: string;
  topic: string;
  statement: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string | null;
};

export type StudySession = {
  id: string;
  discipline: string;
  minutes: number;
  session_date: string;
};

export type QuizAttempt = {
  id: string;
  discipline: string | null;
  attempt_type: string;
  score: number;
  total: number;
  created_at: string;
};

export function formatMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

export async function fetchDisciplines(): Promise<string[]> {
  const { data, error } = await supabase.from("question_bank").select("discipline").limit(2000);
  if (error) throw error;
  return [...new Set((data ?? []).map((row) => row.discipline))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}

export async function fetchQuestions(discipline: string | null): Promise<Question[]> {
  let query = supabase.from("question_bank").select("*").limit(300);
  if (discipline) query = query.eq("discipline", discipline);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Question[];
}

export async function fetchProfile(userId: string) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data;
}

export async function fetchSessions(userId: string): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from("study_sessions")
    .select("id, discipline, minutes, session_date")
    .eq("user_id", userId)
    .order("session_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAttempts(userId: string): Promise<QuizAttempt[]> {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("id, discipline, attempt_type, score, total, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    score: Number(row.score),
    total: Number(row.total),
  }));
}

export async function fetchDisciplineCounts(): Promise<{ discipline: string; count: number }[]> {
  const { data, error } = await supabase.rpc("get_discipline_counts");
  if (error) throw error;
  return (data ?? []).map((row) => ({ discipline: row.discipline, count: Number(row.count) }));
}

export async function fetchTopics(discipline?: string | null): Promise<string[]> {
  const { data, error } = await supabase.rpc("get_topics", { p_discipline: discipline || null });
  if (error) throw error;
  return (data ?? []).map((row) => row.topic);
}
