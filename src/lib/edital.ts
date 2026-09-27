import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { EDITAL_BB } from "@/data/edital-bb";

export interface EditalTopicData {
  id: string;
  exam_name: string;
  discipline: string;
  topic: string;
  weight: number;
  order_index: number;
}

export interface UserEditalProgress {
  id: string;
  user_id: string;
  topic_id: string;
  confidence_level: number;
  theory_read: boolean;
  summary_made: boolean;
  exercises_done: number;
  reviews_count: number;
  updated_at: string;
}

// Initialize data if not exists (in a real app this would be part of admin/seed logic)
export async function seedEditalTopics(): Promise<void> {
  const { data: existing } = await supabase.from("edital_topics").select("id").limit(1);
  if (!existing || existing.length === 0) {
    await supabase.from("edital_topics").insert(EDITAL_BB);
  }
}

export async function fetchEditalTopics(
  examName: string = "Banco do Brasil - Escriturário",
): Promise<EditalTopicData[]> {
  const { data, error } = await supabase
    .from("edital_topics")
    .select("*")
    .eq("exam_name", examName)
    .order("order_index", { ascending: true });

  if (error) throw error;
  return (data ?? []) as EditalTopicData[];
}

export async function fetchUserProgress(userId: string | undefined): Promise<UserEditalProgress[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("user_edital_progress")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []) as UserEditalProgress[];
}

export async function updateTopicProgress({
  userId,
  topicId,
  field,
  value,
}: {
  userId: string | undefined;
  topicId: string;
  field: string;
  value: any;
}): Promise<void> {
  if (!userId) return;

  // Try to find if progress exists
  const { data: existing } = await supabase
    .from("user_edital_progress")
    .select("id")
    .eq("user_id", userId)
    .eq("topic_id", topicId)
    .maybeSingle();

  if (existing) {
    const updatePayload = {
      [field]: value,
      updated_at: new Date().toISOString(),
    } as unknown as Database["public"]["Tables"]["user_edital_progress"]["Update"];

    const { error } = await supabase
      .from("user_edital_progress")
      .update(updatePayload)
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const insertPayload = {
      user_id: userId,
      topic_id: topicId,
      [field]: value,
      updated_at: new Date().toISOString(),
    } as unknown as Database["public"]["Tables"]["user_edital_progress"]["Insert"];

    const { error } = await supabase.from("user_edital_progress").insert(insertPayload);
    if (error) throw error;
  }
}

export async function getProgressStats(userId: string | undefined) {
  const progress = await fetchUserProgress(userId);
  const topics = await fetchEditalTopics();

  const totalTopics = topics.length;

  let completedTopics = 0;
  let inProgressTopics = 0;

  const progressByTopicId = progress.reduce((acc: Record<string, UserEditalProgress>, p) => {
    acc[p.topic_id] = p;
    return acc;
  }, {});

  topics.forEach((topic) => {
    const p = progressByTopicId[topic.id];
    if (p) {
      // Consider completed if theory and summary and at least some exercises are done
      if (p.theory_read && p.summary_made && p.exercises_done > 0) {
        completedTopics++;
      } else if (p.theory_read || p.summary_made || p.exercises_done > 0 || p.reviews_count > 0) {
        inProgressTopics++;
      }
    }
  });

  return {
    totalTopics,
    completedTopics,
    inProgressTopics,
    percentComplete: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
  };
}
