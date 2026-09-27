-- ============================================================================
-- Migration: 20260927000000_enable_rls_and_harden_security.sql
-- Description: Complete Row Level Security (RLS) hardening across all 14 tables.
--              Enforces auth.uid() = user_id for all user-owned tables, prevents IDOR,
--              secures public catalog tables, grants necessary permissions, and fixes
--              concursos table grants (resolving 403 Forbidden) and simulado_attempts
--              update/delete policies.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enable Row Level Security on ALL 14 Client-Accessible Tables (Idempotent)
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_edital_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulado_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edital_topics ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. Drop Legacy / Conflicting Policies (Clean Slate & Full Idempotency)
-- ----------------------------------------------------------------------------

-- 2.1 profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_all_own" ON public.profiles;

-- 2.2 study_sessions
DROP POLICY IF EXISTS "study_sessions_all_own" ON public.study_sessions;
DROP POLICY IF EXISTS "study_sessions_select_own" ON public.study_sessions;
DROP POLICY IF EXISTS "study_sessions_insert_own" ON public.study_sessions;
DROP POLICY IF EXISTS "study_sessions_update_own" ON public.study_sessions;
DROP POLICY IF EXISTS "study_sessions_delete_own" ON public.study_sessions;

-- 2.3 quiz_attempts
DROP POLICY IF EXISTS "quiz_attempts_all_own" ON public.quiz_attempts;
DROP POLICY IF EXISTS "quiz_attempts_select_own" ON public.quiz_attempts;
DROP POLICY IF EXISTS "quiz_attempts_insert_own" ON public.quiz_attempts;
DROP POLICY IF EXISTS "quiz_attempts_update_own" ON public.quiz_attempts;
DROP POLICY IF EXISTS "quiz_attempts_delete_own" ON public.quiz_attempts;

-- 2.4 question_answers
DROP POLICY IF EXISTS "question_answers_all_own" ON public.question_answers;
DROP POLICY IF EXISTS "question_answers_select_own" ON public.question_answers;
DROP POLICY IF EXISTS "question_answers_insert_own" ON public.question_answers;
DROP POLICY IF EXISTS "question_answers_update_own" ON public.question_answers;
DROP POLICY IF EXISTS "question_answers_delete_own" ON public.question_answers;

-- 2.5 flashcard_decks
DROP POLICY IF EXISTS "flashcard_decks_all_own" ON public.flashcard_decks;
DROP POLICY IF EXISTS "flashcard_decks_select_own" ON public.flashcard_decks;
DROP POLICY IF EXISTS "flashcard_decks_insert_own" ON public.flashcard_decks;
DROP POLICY IF EXISTS "flashcard_decks_update_own" ON public.flashcard_decks;
DROP POLICY IF EXISTS "flashcard_decks_delete_own" ON public.flashcard_decks;

-- 2.6 flashcards
DROP POLICY IF EXISTS "flashcards_all_own" ON public.flashcards;
DROP POLICY IF EXISTS "flashcards_select_own" ON public.flashcards;
DROP POLICY IF EXISTS "flashcards_insert_own" ON public.flashcards;
DROP POLICY IF EXISTS "flashcards_update_own" ON public.flashcards;
DROP POLICY IF EXISTS "flashcards_delete_own" ON public.flashcards;

-- 2.7 user_flashcard_reviews
DROP POLICY IF EXISTS "user_flashcard_reviews_all_own" ON public.user_flashcard_reviews;
DROP POLICY IF EXISTS "user_flashcard_reviews_select_own" ON public.user_flashcard_reviews;
DROP POLICY IF EXISTS "user_flashcard_reviews_insert_own" ON public.user_flashcard_reviews;
DROP POLICY IF EXISTS "user_flashcard_reviews_update_own" ON public.user_flashcard_reviews;
DROP POLICY IF EXISTS "user_flashcard_reviews_delete_own" ON public.user_flashcard_reviews;

-- 2.8 user_edital_progress
DROP POLICY IF EXISTS "user_edital_progress_all_own" ON public.user_edital_progress;
DROP POLICY IF EXISTS "user_edital_progress_select_own" ON public.user_edital_progress;
DROP POLICY IF EXISTS "user_edital_progress_insert_own" ON public.user_edital_progress;
DROP POLICY IF EXISTS "user_edital_progress_update_own" ON public.user_edital_progress;
DROP POLICY IF EXISTS "user_edital_progress_delete_own" ON public.user_edital_progress;

-- 2.9 question_bookmarks
DROP POLICY IF EXISTS "question_bookmarks_all_own" ON public.question_bookmarks;
DROP POLICY IF EXISTS "question_bookmarks_select_own" ON public.question_bookmarks;
DROP POLICY IF EXISTS "question_bookmarks_insert_own" ON public.question_bookmarks;
DROP POLICY IF EXISTS "question_bookmarks_update_own" ON public.question_bookmarks;
DROP POLICY IF EXISTS "question_bookmarks_delete_own" ON public.question_bookmarks;

-- 2.10 simulado_attempts
DROP POLICY IF EXISTS "simulado_attempts_user_select" ON public.simulado_attempts;
DROP POLICY IF EXISTS "simulado_attempts_user_insert" ON public.simulado_attempts;
DROP POLICY IF EXISTS "simulado_attempts_user_update" ON public.simulado_attempts;
DROP POLICY IF EXISTS "simulado_attempts_admin_all" ON public.simulado_attempts;
DROP POLICY IF EXISTS "simulado_attempts_select_own" ON public.simulado_attempts;
DROP POLICY IF EXISTS "simulado_attempts_insert_own" ON public.simulado_attempts;
DROP POLICY IF EXISTS "simulado_attempts_update_own" ON public.simulado_attempts;
DROP POLICY IF EXISTS "simulado_attempts_delete_own" ON public.simulado_attempts;

-- 2.11 Public Catalogs
DROP POLICY IF EXISTS "question_bank_select_authenticated" ON public.question_bank;
DROP POLICY IF EXISTS "question_bank_select_public" ON public.question_bank;
DROP POLICY IF EXISTS "question_bank_service_role_all" ON public.question_bank;

DROP POLICY IF EXISTS "concursos_select_public" ON public.concursos;
DROP POLICY IF EXISTS "concursos_admin_write" ON public.concursos;
DROP POLICY IF EXISTS "concursos_service_role_all" ON public.concursos;

DROP POLICY IF EXISTS "simulados_select_all" ON public.simulados;
DROP POLICY IF EXISTS "simulados_admin_all" ON public.simulados;
DROP POLICY IF EXISTS "simulados_select_public" ON public.simulados;
DROP POLICY IF EXISTS "simulados_service_role_all" ON public.simulados;

DROP POLICY IF EXISTS "edital_topics_select_authenticated" ON public.edital_topics;
DROP POLICY IF EXISTS "edital_topics_select_public" ON public.edital_topics;
DROP POLICY IF EXISTS "edital_topics_service_role_all" ON public.edital_topics;

-- ----------------------------------------------------------------------------
-- 3. Standardize Table Grants
-- ----------------------------------------------------------------------------

-- Public Catalogs: SELECT to anon & authenticated, ALL to service_role
GRANT SELECT ON public.question_bank TO anon, authenticated;
GRANT ALL ON public.question_bank TO service_role;

GRANT SELECT ON public.concursos TO anon, authenticated;
GRANT ALL ON public.concursos TO service_role;

GRANT SELECT ON public.simulados TO anon, authenticated;
GRANT ALL ON public.simulados TO service_role;

GRANT SELECT ON public.edital_topics TO anon, authenticated;
GRANT ALL ON public.edital_topics TO service_role;

-- User-Owned Tables: SELECT, INSERT, UPDATE, DELETE to authenticated, ALL to service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_sessions TO authenticated;
GRANT ALL ON public.study_sessions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_answers TO authenticated;
GRANT ALL ON public.question_answers TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcard_decks TO authenticated;
GRANT ALL ON public.flashcard_decks TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcards TO authenticated;
GRANT ALL ON public.flashcards TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_flashcard_reviews TO authenticated;
GRANT ALL ON public.user_flashcard_reviews TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_edital_progress TO authenticated;
GRANT ALL ON public.user_edital_progress TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_bookmarks TO authenticated;
GRANT ALL ON public.question_bookmarks TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulado_attempts TO authenticated;
GRANT ALL ON public.simulado_attempts TO service_role;

-- ----------------------------------------------------------------------------
-- 4. Create Auditable RLS Policies for Public Catalogs
-- ----------------------------------------------------------------------------

-- 4.1 question_bank
CREATE POLICY "question_bank_select_public" ON public.question_bank
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "question_bank_service_role_all" ON public.question_bank
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- 4.2 concursos (Fixes 403 Forbidden on exam queries)
CREATE POLICY "concursos_select_public" ON public.concursos
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "concursos_service_role_all" ON public.concursos
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- 4.3 simulados
CREATE POLICY "simulados_select_public" ON public.simulados
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "simulados_service_role_all" ON public.simulados
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- 4.4 edital_topics
CREATE POLICY "edital_topics_select_public" ON public.edital_topics
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "edital_topics_service_role_all" ON public.edital_topics
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 5. Create Granular, Hardened RLS Policies for 10 User-Owned Tables
-- ----------------------------------------------------------------------------

-- 5.1 profiles (Owner identified by id = auth.uid())
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles
    FOR DELETE TO authenticated
    USING (auth.uid() = id);

-- 5.2 study_sessions (Owner identified by user_id = auth.uid())
CREATE POLICY "study_sessions_select_own" ON public.study_sessions
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "study_sessions_insert_own" ON public.study_sessions
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "study_sessions_update_own" ON public.study_sessions
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "study_sessions_delete_own" ON public.study_sessions
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- 5.3 quiz_attempts (Owner identified by user_id = auth.uid())
CREATE POLICY "quiz_attempts_select_own" ON public.quiz_attempts
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "quiz_attempts_insert_own" ON public.quiz_attempts
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quiz_attempts_update_own" ON public.quiz_attempts
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quiz_attempts_delete_own" ON public.quiz_attempts
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- 5.4 question_answers (Owner identified by user_id = auth.uid())
CREATE POLICY "question_answers_select_own" ON public.question_answers
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "question_answers_insert_own" ON public.question_answers
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "question_answers_update_own" ON public.question_answers
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "question_answers_delete_own" ON public.question_answers
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- 5.5 flashcard_decks (Owner identified by user_id = auth.uid())
CREATE POLICY "flashcard_decks_select_own" ON public.flashcard_decks
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "flashcard_decks_insert_own" ON public.flashcard_decks
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "flashcard_decks_update_own" ON public.flashcard_decks
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "flashcard_decks_delete_own" ON public.flashcard_decks
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- 5.6 flashcards (Relational ownership via deck_id -> flashcard_decks.user_id = auth.uid())
CREATE POLICY "flashcards_select_own" ON public.flashcards
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.flashcard_decks d
        WHERE d.id = flashcards.deck_id AND d.user_id = auth.uid()
    ));

CREATE POLICY "flashcards_insert_own" ON public.flashcards
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.flashcard_decks d
        WHERE d.id = flashcards.deck_id AND d.user_id = auth.uid()
    ));

CREATE POLICY "flashcards_update_own" ON public.flashcards
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.flashcard_decks d
        WHERE d.id = flashcards.deck_id AND d.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.flashcard_decks d
        WHERE d.id = flashcards.deck_id AND d.user_id = auth.uid()
    ));

CREATE POLICY "flashcards_delete_own" ON public.flashcards
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.flashcard_decks d
        WHERE d.id = flashcards.deck_id AND d.user_id = auth.uid()
    ));

-- 5.7 user_flashcard_reviews (Owner identified by user_id = auth.uid())
CREATE POLICY "user_flashcard_reviews_select_own" ON public.user_flashcard_reviews
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "user_flashcard_reviews_insert_own" ON public.user_flashcard_reviews
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_flashcard_reviews_update_own" ON public.user_flashcard_reviews
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_flashcard_reviews_delete_own" ON public.user_flashcard_reviews
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- 5.8 user_edital_progress (Owner identified by user_id = auth.uid())
CREATE POLICY "user_edital_progress_select_own" ON public.user_edital_progress
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "user_edital_progress_insert_own" ON public.user_edital_progress
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_edital_progress_update_own" ON public.user_edital_progress
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_edital_progress_delete_own" ON public.user_edital_progress
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- 5.9 question_bookmarks (Owner identified by user_id = auth.uid())
CREATE POLICY "question_bookmarks_select_own" ON public.question_bookmarks
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "question_bookmarks_insert_own" ON public.question_bookmarks
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "question_bookmarks_update_own" ON public.question_bookmarks
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "question_bookmarks_delete_own" ON public.question_bookmarks
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- 5.10 simulado_attempts (Owner identified by user_id = auth.uid())
CREATE POLICY "simulado_attempts_select_own" ON public.simulado_attempts
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "simulado_attempts_insert_own" ON public.simulado_attempts
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "simulado_attempts_update_own" ON public.simulado_attempts
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "simulado_attempts_delete_own" ON public.simulado_attempts
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6. Helper Function Execution Permissions
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_discipline_counts() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_topics(text) TO anon, authenticated;
