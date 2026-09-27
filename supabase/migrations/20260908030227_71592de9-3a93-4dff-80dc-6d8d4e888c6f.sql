CREATE TABLE public.question_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
  discipline text NOT NULL,
  topic text NOT NULL,
  selected_answer text NOT NULL,
  is_correct boolean NOT NULL,
  source text NOT NULL DEFAULT 'estudo',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_answers TO authenticated;
GRANT ALL ON public.question_answers TO service_role;

ALTER TABLE public.question_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "question_answers_all_own" ON public.question_answers
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX question_answers_user_created_idx ON public.question_answers (user_id, created_at DESC);
CREATE INDEX question_answers_user_discipline_idx ON public.question_answers (user_id, discipline);