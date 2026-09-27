-- =============================================
-- Migration: Novas tabelas para Flashcards e Edital
-- =============================================

-- ========== FLASHCARDS ==========

-- Baralhos de flashcards
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  discipline text NOT NULL,
  topic text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX flashcard_decks_user_idx ON public.flashcard_decks (user_id);

ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcard_decks TO authenticated;
GRANT ALL ON public.flashcard_decks TO service_role;

CREATE POLICY flashcard_decks_all_own ON public.flashcard_decks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Cartoes individuais
CREATE TABLE IF NOT EXISTS public.flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  front text NOT NULL,
  back text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX flashcards_deck_idx ON public.flashcards (deck_id);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcards TO authenticated;
GRANT ALL ON public.flashcards TO service_role;

-- Politica: usuario pode acessar cards dos seus proprios decks
CREATE POLICY flashcards_all_own ON public.flashcards
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.flashcard_decks d WHERE d.id = deck_id AND d.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.flashcard_decks d WHERE d.id = deck_id AND d.user_id = auth.uid())
  );

-- Revisoes dos flashcards (repetição espaçada SM-2)
CREATE TABLE IF NOT EXISTS public.user_flashcard_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  interval_days integer NOT NULL DEFAULT 1,
  ease_factor numeric(4,2) NOT NULL DEFAULT 2.50,
  repetitions integer NOT NULL DEFAULT 0,
  next_review_date date NOT NULL DEFAULT current_date,
  last_rating smallint NOT NULL CHECK (last_rating BETWEEN 1 AND 4),
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, card_id)
);

CREATE INDEX user_flashcard_reviews_user_next_idx 
  ON public.user_flashcard_reviews (user_id, next_review_date);
CREATE INDEX user_flashcard_reviews_card_idx 
  ON public.user_flashcard_reviews (card_id);

ALTER TABLE public.user_flashcard_reviews ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_flashcard_reviews TO authenticated;
GRANT ALL ON public.user_flashcard_reviews TO service_role;

CREATE POLICY user_flashcard_reviews_all_own ON public.user_flashcard_reviews
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ========== EDITAL VERTICALIZADO ==========

-- Topicos do edital
CREATE TABLE IF NOT EXISTS public.edital_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_name text NOT NULL,
  discipline text NOT NULL,
  topic text NOT NULL,
  weight numeric(3,1) DEFAULT 1.0,
  order_index integer NOT NULL DEFAULT 0
);

CREATE INDEX edital_topics_exam_idx ON public.edital_topics (exam_name);
CREATE INDEX edital_topics_exam_discipline_idx ON public.edital_topics (exam_name, discipline);

ALTER TABLE public.edital_topics ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.edital_topics TO authenticated;
GRANT ALL ON public.edital_topics TO service_role;

CREATE POLICY edital_topics_select_authenticated ON public.edital_topics
  FOR SELECT USING (true);

-- Progresso do usuario por topico do edital
CREATE TABLE IF NOT EXISTS public.user_edital_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.edital_topics(id) ON DELETE CASCADE,
  theory_read boolean NOT NULL DEFAULT false,
  summary_made boolean NOT NULL DEFAULT false,
  exercises_done integer NOT NULL DEFAULT 0,
  reviews_count integer NOT NULL DEFAULT 0,
  confidence_level smallint NOT NULL DEFAULT 0 CHECK (confidence_level BETWEEN 0 AND 5),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

CREATE INDEX user_edital_progress_user_idx ON public.user_edital_progress (user_id);

ALTER TABLE public.user_edital_progress ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_edital_progress TO authenticated;
GRANT ALL ON public.user_edital_progress TO service_role;

CREATE POLICY user_edital_progress_all_own ON public.user_edital_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ========== FAVORITOS / CADERNO DE ERROS ==========

CREATE TABLE IF NOT EXISTS public.question_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
  tag text NOT NULL DEFAULT 'revisar',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id, tag)
);

CREATE INDEX question_bookmarks_user_idx ON public.question_bookmarks (user_id);

ALTER TABLE public.question_bookmarks ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_bookmarks TO authenticated;
GRANT ALL ON public.question_bookmarks TO service_role;

CREATE POLICY question_bookmarks_all_own ON public.question_bookmarks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ========== SEED: Topicos do Edital Banco do Brasil ==========

INSERT INTO public.edital_topics (exam_name, discipline, topic, weight, order_index) VALUES
  -- Lingua Portuguesa
  ('Banco do Brasil - Escriturario', 'Lingua Portuguesa', 'Compreensao e Interpretacao de Textos', 3.0, 1),
  ('Banco do Brasil - Escriturario', 'Lingua Portuguesa', 'Concordancia Verbal e Nominal', 2.0, 2),
  ('Banco do Brasil - Escriturario', 'Lingua Portuguesa', 'Regencia Verbal e Nominal', 2.0, 3),
  ('Banco do Brasil - Escriturario', 'Lingua Portuguesa', 'Crase', 1.5, 4),
  ('Banco do Brasil - Escriturario', 'Lingua Portuguesa', 'Pontuacao', 1.5, 5),
  ('Banco do Brasil - Escriturario', 'Lingua Portuguesa', 'Classes Gramaticais', 2.0, 6),
  ('Banco do Brasil - Escriturario', 'Lingua Portuguesa', 'Ortografia e Acentuacao', 1.5, 7),
  ('Banco do Brasil - Escriturario', 'Lingua Portuguesa', 'Colocacao Pronominal', 1.0, 8),
  ('Banco do Brasil - Escriturario', 'Lingua Portuguesa', 'Redacao Oficial', 1.5, 9),
  -- Matematica e Raciocinio Logico
  ('Banco do Brasil - Escriturario', 'Matematica e Raciocinio Logico', 'Juros Simples e Compostos', 3.0, 10),
  ('Banco do Brasil - Escriturario', 'Matematica e Raciocinio Logico', 'Amortizacao (SAC e Price)', 2.5, 11),
  ('Banco do Brasil - Escriturario', 'Matematica e Raciocinio Logico', 'Probabilidade', 2.0, 12),
  ('Banco do Brasil - Escriturario', 'Matematica e Raciocinio Logico', 'Estatistica Basica', 2.0, 13),
  ('Banco do Brasil - Escriturario', 'Matematica e Raciocinio Logico', 'Sequencias Numericas', 1.5, 14),
  ('Banco do Brasil - Escriturario', 'Matematica e Raciocinio Logico', 'Logica Proposicional', 2.0, 15),
  -- Informatica
  ('Banco do Brasil - Escriturario', 'Informatica', 'Navegadores (Chrome, Edge, Firefox)', 1.5, 16),
  ('Banco do Brasil - Escriturario', 'Informatica', 'Microsoft Office (Word, Excel, PowerPoint)', 2.0, 17),
  ('Banco do Brasil - Escriturario', 'Informatica', 'Seguranca da Informacao e Cibernetica', 2.5, 18),
  ('Banco do Brasil - Escriturario', 'Informatica', 'Ciencia de Dados', 1.5, 19),
  ('Banco do Brasil - Escriturario', 'Informatica', 'Metodologias Ageis (Scrum, XP)', 1.5, 20),
  -- Conhecimentos Bancarios
  ('Banco do Brasil - Escriturario', 'Conhecimentos Bancarios', 'Sistema Financeiro Nacional', 3.0, 21),
  ('Banco do Brasil - Escriturario', 'Conhecimentos Bancarios', 'Produtos e Servicos Bancarios', 3.0, 22),
  ('Banco do Brasil - Escriturario', 'Conhecimentos Bancarios', 'Mercado de Capitais e Cambio', 2.5, 23),
  ('Banco do Brasil - Escriturario', 'Conhecimentos Bancarios', 'PIX e Sistema de Pagamentos', 2.0, 24),
  ('Banco do Brasil - Escriturario', 'Conhecimentos Bancarios', 'Prevencao a Lavagem de Dinheiro', 2.5, 25),
  ('Banco do Brasil - Escriturario', 'Conhecimentos Bancarios', 'Sigilo Bancario', 1.5, 26),
  ('Banco do Brasil - Escriturario', 'Conhecimentos Bancarios', 'Codigo de Defesa do Consumidor', 2.0, 27),
  ('Banco do Brasil - Escriturario', 'Conhecimentos Bancarios', 'LGPD - Lei Geral de Protecao de Dados', 2.5, 28),
  -- Atualidades e Conhecimentos Gerais
  ('Banco do Brasil - Escriturario', 'Atualidades', 'Etica e Responsabilidade Socioambiental', 2.0, 29),
  ('Banco do Brasil - Escriturario', 'Atualidades', 'Governanca Corporativa', 1.5, 30),
  ('Banco do Brasil - Escriturario', 'Atualidades', 'Marketing e Vendas', 1.5, 31),
  ('Banco do Brasil - Escriturario', 'Atualidades', 'Lideranca e Trabalho em Equipe', 1.5, 32),
  ('Banco do Brasil - Escriturario', 'Atualidades', 'Gestao da Qualidade', 1.0, 33),
  ('Banco do Brasil - Escriturario', 'Atualidades', 'Atendimento Prioritario e Acessibilidade', 2.0, 34)
ON CONFLICT DO NOTHING;
