-- =============================================
-- Migration: Adiciona indices faltantes e funcoes SQL
-- para otimizar queries do frontend
-- =============================================

-- Bug 4: Indices em chaves estrangeiras sem indice
CREATE INDEX IF NOT EXISTS study_sessions_user_date_idx 
  ON public.study_sessions (user_id, session_date DESC);

CREATE INDEX IF NOT EXISTS quiz_attempts_user_created_idx 
  ON public.quiz_attempts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS question_answers_question_id_idx 
  ON public.question_answers (question_id);

CREATE INDEX IF NOT EXISTS question_bank_discipline_topic_idx 
  ON public.question_bank (discipline, topic);

-- Bug 5: Funcoes SQL para substituir contagens feitas no frontend

-- Retorna a contagem de questoes por disciplina (substitui fetchDisciplineCounts)
CREATE OR REPLACE FUNCTION public.get_discipline_counts()
RETURNS TABLE(discipline text, count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT discipline, count(*) 
  FROM public.question_bank 
  GROUP BY discipline 
  ORDER BY discipline;
$$;

-- Retorna os topicos distintos de uma disciplina (substitui fetchTopics)
CREATE OR REPLACE FUNCTION public.get_topics(p_discipline text DEFAULT NULL)
RETURNS TABLE(topic text)
LANGUAGE sql STABLE
AS $$
  SELECT DISTINCT qb.topic 
  FROM public.question_bank qb
  WHERE (p_discipline IS NULL OR qb.discipline = p_discipline)
  ORDER BY qb.topic;
$$;

-- Concede permissao de execucao para usuarios autenticados
GRANT EXECUTE ON FUNCTION public.get_discipline_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_topics(text) TO authenticated;
