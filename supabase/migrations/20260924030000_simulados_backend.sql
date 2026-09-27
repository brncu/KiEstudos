-- ============================================================================
-- Migration: 20260924030000_simulados_backend.sql
-- Description: Tabelas de Acervo de Simulados e Tentativas/Desempenho do Aluno
-- ============================================================================

-- 1. Tabela de Acervo de Simulados Oficiais
CREATE TABLE IF NOT EXISTS public.simulados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    banca TEXT NOT NULL,
    carreira TEXT NOT NULL,
    questions_count INTEGER NOT NULL DEFAULT 60,
    duration_minutes INTEGER NOT NULL DEFAULT 120,
    passing_score NUMERIC(5,2) DEFAULT 70.0,
    feature TEXT DEFAULT 'Gabarito Comentado',
    is_active BOOLEAN NOT NULL DEFAULT true,
    order_index INTEGER DEFAULT 0,
    disciplines_filter TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para Simulados
CREATE INDEX IF NOT EXISTS idx_simulados_slug ON public.simulados(slug);
CREATE INDEX IF NOT EXISTS idx_simulados_carreira ON public.simulados(carreira);
CREATE INDEX IF NOT EXISTS idx_simulados_banca ON public.simulados(banca);
CREATE INDEX IF NOT EXISTS idx_simulados_order ON public.simulados(order_index ASC);

-- RLS para Simulados
ALTER TABLE public.simulados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "simulados_select_all" ON public.simulados
    FOR SELECT USING (true);

CREATE POLICY "simulados_admin_all" ON public.simulados
    FOR ALL TO service_role USING (true);

-- 2. Tabela de Tentativas / Histórico de Simulados
CREATE TABLE IF NOT EXISTS public.simulado_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    simulado_id UUID REFERENCES public.simulados(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    banca TEXT NOT NULL,
    carreira TEXT NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    wrong_answers INTEGER NOT NULL DEFAULT 0,
    unanswered INTEGER NOT NULL DEFAULT 0,
    score_raw NUMERIC(6,2) NOT NULL DEFAULT 0,
    score_net NUMERIC(6,2) NOT NULL DEFAULT 0,
    accuracy NUMERIC(5,2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    scoring_rule TEXT NOT NULL DEFAULT 'padrao' CHECK (scoring_rule IN ('padrao', 'cespe_liquida')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    answers_summary JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para Performance de Consultas do Usuário
CREATE INDEX IF NOT EXISTS idx_simulado_attempts_user ON public.simulado_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulado_attempts_simulado ON public.simulado_attempts(simulado_id);
CREATE INDEX IF NOT EXISTS idx_simulado_attempts_title ON public.simulado_attempts(title);

-- RLS para Tentativas
ALTER TABLE public.simulado_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "simulado_attempts_user_select" ON public.simulado_attempts
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "simulado_attempts_user_insert" ON public.simulado_attempts
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "simulado_attempts_user_update" ON public.simulado_attempts
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "simulado_attempts_admin_all" ON public.simulado_attempts
    FOR ALL TO service_role
    USING (true);

-- Permissões
GRANT SELECT ON public.simulados TO anon, authenticated;
GRANT ALL ON public.simulado_attempts TO authenticated;
GRANT ALL ON public.simulado_attempts TO service_role;

-- 3. Seed dos Simulados Oficiais Iniciais
INSERT INTO public.simulados (id, slug, title, description, banca, carreira, questions_count, duration_minutes, passing_score, feature, order_index, disciplines_filter)
VALUES
('10000000-0000-0000-0000-000000000001', 'pf-2024', 'PF 2024 - Agente de Polícia Federal (Prova Completa)', 'Língua Portuguesa, RLM, Informática Avançada, Dir. Penal, Processual Penal e Admin. Fator Cespe (-1 por erro).', 'Cebraspe', 'Policial', 120, 270, 75.0, 'Gabarito em Vídeo + Texto', 1, ARRAY['Concursos_Federais', 'Direito']),
('10000000-0000-0000-0000-000000000002', 'prf-2024', 'PRF - Policial Rodoviário Federal (Edital Atualizado)', 'Foco em Legislação de Trânsito atualizada, Física Aplicada, Geopolítica Brasileira e Dir. Constitucional.', 'Cebraspe', 'Policial', 120, 270, 72.0, 'Ranking Nacional Ativo', 2, ARRAY['Concursos_Federais', 'Direito']),
('10000000-0000-0000-0000-000000000003', 'tjsp-2024', 'TJ-SP 2024 - Escrevente Técnico Judiciário', 'Normas da Corregedoria Geral, Direito Processual Civil e Penal, Constitucional, Matemática e RLM.', 'Vunesp', 'Tribunais (TRT/TJ)', 100, 300, 80.0, 'Gabarito Comentado', 3, ARRAY['Concursos_Federais', 'Direito']),
('10000000-0000-0000-0000-000000000004', 'rfb-2024', 'Receita Federal - Auditor Fiscal (Prova Completa)', 'Direito Tributário e Aduaneiro, Auditoria Geral, Contabilidade Avançada, TI e Fluência em Dados.', 'FGV', 'Fiscal / SEFAZ', 140, 330, 68.0, 'Resolução em Vídeo', 4, ARRAY['Concursos_Federais', 'Ciencias Contabeis', 'Computação']),
('10000000-0000-0000-0000-000000000005', 'inss-2024', 'INSS - Técnico do Seguro Social (120 Itens)', 'Seguridade Social completa (70 questões peso 2), Direito Constitucional, Administrativo, Ética e RLM.', 'Cebraspe', 'Admin / INSS', 120, 210, 85.0, 'Ranking Nacional', 5, ARRAY['Concursos_Federais']),
('10000000-0000-0000-0000-000000000006', 'trf3-2024', 'TRF-3 - Analista Judiciário (Área Judiciária)', 'Doutrina e jurisprudência dos tribunais superiores, Processo Civil, Penal, Previdenciário e Constitucional.', 'FCC', 'Tribunais (TRT/TJ)', 60, 270, 75.0, 'Gabarito Comentado', 6, ARRAY['Concursos_Federais', 'Direito'])
ON CONFLICT (slug) DO NOTHING;
