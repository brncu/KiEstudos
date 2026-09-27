import { useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type {
  ConcursoExam,
  ProfileTargetExam,
  UseTargetExamReturn,
} from "@/types/concurso";
import { INITIAL_CONCURSOS } from "@/data/mockConcursos";

/**
 * Normalizes text for resilient matching (strips accents, lowercases).
 */
function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * React Query Hook for Active Target Exam Management, Onboarding State & Concurso Catalog.
 * Location: src/hooks/useTargetExam.ts
 */
export function useTargetExam(): UseTargetExamReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Fetch user's profile with target_exam_id and onboarding_completed
  const profileQuery = useQuery({
    queryKey: ["target_exam_profile", user?.id],
    queryFn: async (): Promise<ProfileTargetExam | null> => {
      if (!user) return null;

      try {
        const { data, error } = await (supabase as any)
          .from("profiles")
          .select(
            "id, full_name, target_exam, weekly_goal_hours"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.warn("[useTargetExam] Error querying profile:", error.message);
          return null;
        }

        return data as ProfileTargetExam;
      } catch (err) {
        console.warn("[useTargetExam] Exception querying profile:", err);
        return null;
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 2. Fetch all available concursos (from Supabase with automatic fallback to INITIAL_CONCURSOS)
  const concursosQuery = useQuery({
    queryKey: ["concursos"],
    queryFn: async (): Promise<ConcursoExam[]> => {
      try {
        const { data, error } = await (supabase as any)
          .from("concursos")
          .select("*")
          .order("exam_date", { ascending: true });

        if (error || !data || data.length === 0) {
          return INITIAL_CONCURSOS;
        }

        return data as ConcursoExam[];
      } catch (err) {
        console.warn(
          "[useTargetExam] Failed to query concursos from Supabase, falling back to local catalog:",
          err
        );
        return INITIAL_CONCURSOS;
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const allExams = useMemo(() => {
    return concursosQuery.data && concursosQuery.data.length > 0
      ? concursosQuery.data
      : INITIAL_CONCURSOS;
  }, [concursosQuery.data]);

  // 3. Resolve active target exam object
  const activeExam = useMemo<ConcursoExam | null>(() => {
    const profile = profileQuery.data;

    // Check localStorage fallback for quick hydration
    const localId =
      typeof window !== "undefined"
        ? localStorage.getItem("kiestudos_target_exam_id")
        : null;
    const localTitle =
      typeof window !== "undefined"
        ? localStorage.getItem("kiestudos_target_exam_title") ||
          localStorage.getItem("kiestudos_target_exam")
        : null;

    const targetId = profile?.target_exam_id || localId;
    const targetTitle = profile?.target_exam || localTitle;

    // A. Match by ID or Slug
    if (targetId) {
      const matchById = allExams.find(
        (e) => e.id === targetId || e.slug === targetId
      );
      if (matchById) return matchById;
    }

    // B. Match by Title / Institution (normalized fuzzy match)
    if (targetTitle) {
      const normTarget = normalizeText(targetTitle);
      const matchByTitle = allExams.find((e) => {
        const normTitle = normalizeText(e.title);
        const normInst = normalizeText(e.institution);
        const normRole = normalizeText(e.role);
        return (
          normTitle === normTarget ||
          normTitle.includes(normTarget) ||
          normTarget.includes(normTitle) ||
          (normInst && normTarget.includes(normInst)) ||
          (normRole && normTarget.includes(normRole))
        );
      });

      if (matchByTitle) return matchByTitle;
    }

    // C. Default to the primary national exam (Banco do Brasil or first available)
    return allExams[0] ?? null;
  }, [allExams, profileQuery.data]);

  // 4. Compute needsOnboarding status
  const needsOnboarding = useMemo<boolean>(() => {
    if (!user || profileQuery.isLoading) return false;

    const profile = profileQuery.data;
    if (!profile) return false;

    // If onboarding_completed is explicitly false
    if (profile.onboarding_completed === false) {
      return true;
    }

    // If user has neither target_exam_id nor onboarding_completed flag set
    if (!profile.target_exam_id && !profile.onboarding_completed) {
      return true;
    }

    return false;
  }, [user, profileQuery.isLoading, profileQuery.data]);

  // 5. Mutation to set active target exam
  const setTargetExamMutation = useMutation({
    mutationFn: async (concurso: ConcursoExam): Promise<ConcursoExam> => {
      // 1. Immediately update localStorage for instant sync across tabs & reloads
      if (typeof window !== "undefined") {
        localStorage.setItem("kiestudos_target_exam_id", concurso.id);
        localStorage.setItem("kiestudos_target_exam_title", concurso.title);
        localStorage.setItem("kiestudos_target_exam_slug", concurso.slug);
        localStorage.setItem("kiestudos_target_exam", concurso.title);
      }

      // 2. Persist to Supabase if user is logged in
      if (user) {
        try {
          const { error } = await (supabase as any)
            .from("profiles")
            .update({
              target_exam: concurso.title,
            })
            .eq("id", user.id);

          if (error) {
            console.warn(
              "[useTargetExam] Could not persist target_exam to Supabase profiles:",
              error.message
            );
          }
        } catch (err) {
          console.warn("[useTargetExam] Exception updating profiles:", err);
        }
      }

      return concurso;
    },
    onSuccess: (concurso) => {
      // Invalidate relevant query caches
      queryClient.invalidateQueries({ queryKey: ["target_exam_profile"] });
      queryClient.invalidateQueries({ queryKey: ["active_concurso"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
      queryClient.invalidateQueries({ queryKey: ["concursos"] });
    },
  });

  const setTargetExam = useCallback(
    async (concurso: ConcursoExam) => {
      return await setTargetExamMutation.mutateAsync(concurso);
    },
    [setTargetExamMutation]
  );

  return {
    profile: profileQuery.data ?? null,
    activeExam,
    allExams,
    isLoading: profileQuery.isLoading || concursosQuery.isLoading,
    needsOnboarding,
    setTargetExam,
    isUpdating: setTargetExamMutation.isPending,
  };
}
