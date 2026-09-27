import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  EditalDiscipline,
  EditalGlobalStats,
  EditalTopic,
  StatusFilter,
  StudyCheckpoint,
  TopicProgressMap,
} from "./types";
import { INITIAL_SYLLABUS } from "./mockSyllabus";
import { updateTopicProgress } from "@/lib/edital";

const STORAGE_KEY = "kiestudos_edital_progress_v2";

const DISCIPLINE_ICONS: Record<string, string> = {
  "Língua Portuguesa": "BookOpen",
  "Direito Constitucional": "Scale",
  "Direito Administrativo": "Building2",
  "Raciocínio Lógico-Matemático": "Calculator",
  "Noções de Informática": "Binary",
  "Ética no Serviço Público": "ShieldCheck",
  "Conhecimentos Bancários": "Landmark",
  "Matemática Financeira": "Percent",
  "Atualidades do Mercado Financeiro": "TrendingUp",
};

export function useEditalProgress(userId?: string | null) {
  const [topics, setTopics] = useState<EditalTopic[]>(() => {
    if (typeof window === "undefined") {
      return INITIAL_SYLLABUS;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const progressMap: TopicProgressMap = JSON.parse(stored);
        return INITIAL_SYLLABUS.map((t) => {
          const p = progressMap[t.id];
          if (p) {
            return {
              ...t,
              theory_read: Boolean(p.theory_read),
              questions_solved: Boolean(p.questions_solved),
              reviewed: Boolean(p.reviewed),
            };
          }
          return t;
        });
      }
    } catch (e) {
      console.error("Failed to load edital progress from localStorage:", e);
    }
    return INITIAL_SYLLABUS;
  });

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");

  // Save to localStorage whenever topics change
  useEffect(() => {
    try {
      const map: TopicProgressMap = {};
      topics.forEach((t) => {
        map[t.id] = {
          theory_read: t.theory_read,
          questions_solved: t.questions_solved,
          reviewed: t.reviewed,
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch (e) {
      console.error("Failed to persist edital progress to localStorage:", e);
    }
  }, [topics]);

  // Toggle single checkpoint
  const toggleCheckpoint = useCallback(
    (topicId: string, field: StudyCheckpoint, value: boolean) => {
      setTopics((prev) =>
        prev.map((t) => {
          if (t.id === topicId) {
            return { ...t, [field]: value };
          }
          return t;
        }),
      );

      // Background sync to Supabase if logged in
      if (userId) {
        updateTopicProgress({
          userId,
          topicId,
          field,
          value,
        }).catch((err) => {
          console.warn("Supabase background sync failed, local state preserved:", err);
        });
      }
    },
    [userId],
  );

  // Mark/unmark all checkpoints in a topic
  const toggleTopicAll = useCallback((topicId: string, completed: boolean) => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id === topicId) {
          return {
            ...t,
            theory_read: completed,
            questions_solved: completed,
            reviewed: completed,
          };
        }
        return t;
      }),
    );
  }, []);

  // Mark/unmark all topics in a discipline
  const markAllInDiscipline = useCallback((disciplineName: string, completed: boolean) => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.discipline === disciplineName) {
          return {
            ...t,
            theory_read: completed,
            questions_solved: completed,
            reviewed: completed,
          };
        }
        return t;
      }),
    );
  }, []);

  // Reset entire syllabus progress
  const resetAllProgress = useCallback(() => {
    setTopics((prev) =>
      prev.map((t) => ({
        ...t,
        theory_read: false,
        questions_solved: false,
        reviewed: false,
      })),
    );
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear localStorage:", e);
    }
  }, []);

  // Global Statistics Calculation
  const globalStats = useMemo<EditalGlobalStats>(() => {
    const totalTopics = topics.length;
    let completedTopics = 0;
    let inProgressTopics = 0;
    let notStartedTopics = 0;
    let completedCheckpoints = 0;
    let totalWeightedScore = 0;
    let maxWeightedScore = 0;

    topics.forEach((t) => {
      const checks = (t.theory_read ? 1 : 0) + (t.questions_solved ? 1 : 0) + (t.reviewed ? 1 : 0);
      completedCheckpoints += checks;

      const w = t.weight || 1.0;
      maxWeightedScore += w * 3;
      totalWeightedScore += w * checks;

      if (checks === 3) {
        completedTopics += 1;
      } else if (checks > 0) {
        inProgressTopics += 1;
      } else {
        notStartedTopics += 1;
      }
    });

    const totalCheckpoints = totalTopics * 3;
    const percentComplete =
      totalCheckpoints > 0 ? Math.round((completedCheckpoints / totalCheckpoints) * 100) : 0;
    const weightedPercentComplete =
      maxWeightedScore > 0 ? Math.round((totalWeightedScore / maxWeightedScore) * 100) : 0;

    const disciplinesSet = new Set(topics.map((t) => t.discipline));

    return {
      totalTopics,
      completedTopics,
      inProgressTopics,
      notStartedTopics,
      totalCheckpoints,
      completedCheckpoints,
      percentComplete,
      totalDisciplines: disciplinesSet.size,
      weightedPercentComplete,
    };
  }, [topics]);

  // Discipline Grouping & Metrics
  const disciplines = useMemo<EditalDiscipline[]>(() => {
    const map = new Map<string, EditalTopic[]>();
    topics.forEach((t) => {
      if (!map.has(t.discipline)) {
        map.set(t.discipline, []);
      }
      map.get(t.discipline)!.push(t);
    });

    const result: EditalDiscipline[] = [];
    map.forEach((discTopics, name) => {
      const code = discTopics[0]?.disciplineCode || name.slice(0, 2).toUpperCase();
      const totalTopics = discTopics.length;
      let completedTopics = 0;
      let inProgressTopics = 0;
      let notStartedTopics = 0;
      let completedCheckpoints = 0;
      let sumWeights = 0;

      discTopics.forEach((t) => {
        sumWeights += t.weight || 1.0;
        const checks =
          (t.theory_read ? 1 : 0) + (t.questions_solved ? 1 : 0) + (t.reviewed ? 1 : 0);
        completedCheckpoints += checks;
        if (checks === 3) {
          completedTopics += 1;
        } else if (checks > 0) {
          inProgressTopics += 1;
        } else {
          notStartedTopics += 1;
        }
      });

      const totalCheckpoints = totalTopics * 3;
      const percentComplete =
        totalCheckpoints > 0 ? Math.round((completedCheckpoints / totalCheckpoints) * 100) : 0;
      const weightAvg = totalTopics > 0 ? Number((sumWeights / totalTopics).toFixed(1)) : 1.0;

      result.push({
        id: `disc-${code.toLowerCase()}`,
        name,
        code,
        iconName: DISCIPLINE_ICONS[name] || "BookOpen",
        weightAvg,
        topics: discTopics,
        totalTopics,
        completedTopics,
        inProgressTopics,
        notStartedTopics,
        totalCheckpoints,
        completedCheckpoints,
        percentComplete,
      });
    });

    return result;
  }, [topics]);

  // Filtered Disciplines and Topics based on search and status
  const filteredDisciplines = useMemo<EditalDiscipline[]>(() => {
    const query = searchQuery.trim().toLowerCase();

    return disciplines
      .map((disc) => {
        const filteredTopics = disc.topics.filter((topic) => {
          // Status filter matching
          const checks =
            (topic.theory_read ? 1 : 0) +
            (topic.questions_solved ? 1 : 0) +
            (topic.reviewed ? 1 : 0);

          if (statusFilter === "concluidos" && checks < 3) return false;
          if (statusFilter === "em_andamento" && (checks === 0 || checks === 3)) return false;
          if (statusFilter === "nao_iniciados" && checks > 0) return false;

          // Search query matching
          if (query) {
            const matchesTopic = topic.topic.toLowerCase().includes(query);
            const matchesSubtopic = topic.subtopic
              ? topic.subtopic.toLowerCase().includes(query)
              : false;
            const matchesDiscipline = topic.discipline.toLowerCase().includes(query);
            return matchesTopic || matchesSubtopic || matchesDiscipline;
          }

          return true;
        });

        return {
          ...disc,
          topics: filteredTopics,
        };
      })
      .filter((disc) => disc.topics.length > 0);
  }, [disciplines, searchQuery, statusFilter]);

  return {
    topics,
    disciplines,
    filteredDisciplines,
    globalStats,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    toggleCheckpoint,
    toggleTopicAll,
    markAllInDiscipline,
    resetAllProgress,
  };
}
