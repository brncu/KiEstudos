-- ============================================================================
-- Migration: 20260924000000_concurso_foco_tables.sql
-- Module: Concurso Foco, Focus Management Tab & Edital Mágico
-- Description: Creates public.concursos table, indexes, RLS policies, enhances
--              public.profiles with target_exam_id and onboarding_completed,
--              and seeds 8 top Brazilian public tenders with rich AI summaries.
-- ============================================================================

-- 1. Create Concursos (Exams) Table
CREATE TABLE IF NOT EXISTS public.concursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    institution TEXT NOT NULL,
    role TEXT NOT NULL,
    exam_board TEXT,
    sphere TEXT NOT NULL CHECK (sphere IN ('federal', 'estadual', 'municipal')),
    state TEXT NOT NULL DEFAULT 'BR',
    city TEXT,
    education_level TEXT NOT NULL CHECK (education_level IN ('fundamental', 'medio', 'tecnico', 'superior')),
    status TEXT NOT NULL CHECK (status IN ('previsto', 'autorizado', 'edital_publicado', 'inscricoes_abertas', 'encerrado')),
    vacancies INTEGER NOT NULL DEFAULT 0,
    vacancies_reserve INTEGER DEFAULT 0,
    salary NUMERIC(10, 2),
    registration_fee NUMERIC(10, 2),
    registration_start_date DATE,
    registration_end_date DATE,
    exam_date DATE,
    registration_link TEXT NOT NULL,
    edital_url TEXT,
    summary_ai JSONB,
    programmatic_content JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for High Performance Filtering and Sorting
CREATE INDEX IF NOT EXISTS idx_concursos_sphere ON public.concursos (sphere);
CREATE INDEX IF NOT EXISTS idx_concursos_state ON public.concursos (state);
CREATE INDEX IF NOT EXISTS idx_concursos_education ON public.concursos (education_level);
CREATE INDEX IF NOT EXISTS idx_concursos_status ON public.concursos (status);
CREATE INDEX IF NOT EXISTS idx_concursos_exam_date ON public.concursos (exam_date ASC);
CREATE INDEX IF NOT EXISTS idx_concursos_institution ON public.concursos (institution);
CREATE INDEX IF NOT EXISTS idx_concursos_slug ON public.concursos (slug);

-- Enable Row Level Security
ALTER TABLE public.concursos ENABLE ROW LEVEL SECURITY;

-- Read Policy: Public access (anonymous and authenticated) to browse exam catalog
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'concursos' AND policyname = 'concursos_select_public'
    ) THEN
        CREATE POLICY "concursos_select_public" ON public.concursos
            FOR SELECT USING (true);
    END IF;
END $$;

-- Write Policy: Service role / administrator write access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'concursos' AND policyname = 'concursos_admin_write'
    ) THEN
        CREATE POLICY "concursos_admin_write" ON public.concursos
            FOR ALL TO service_role
            USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 2. Enhance Profiles Table for Target Exam Relationship and Onboarding
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS target_exam_id UUID REFERENCES public.concursos(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_target_exam_id ON public.profiles (target_exam_id);

-- 3. Seed Top Brazilian Public Tender Catalog (8 Top Certames)
INSERT INTO public.concursos (
    id, slug, title, institution, role, exam_board, sphere, state, city,
    education_level, status, vacancies, vacancies_reserve, salary, registration_fee,
    registration_start_date, registration_end_date, exam_date,
    registration_link, edital_url, summary_ai, programmatic_content
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'banco-do-brasil-escriturario',
    'Banco do Brasil - Escriturário',
    'Banco do Brasil S.A.',
    'Escriturário (Agente Comercial e TI)',
    'Fundação Cesgranrio',
    'federal',
    'BR',
    NULL,
    'medio',
    'inscricoes_abertas',
    6000,
    2000,
    3622.23,
    50.00,
    '2026-09-01',
    '2026-10-15',
    '2026-11-22',
    'https://www.cesgranrio.org.br/concursos/bb',
    'https://www.bb.com.br/concurso',
    '{
        "resumo": "Concurso nacional de grande porte para atuação em agências bancárias e polos de tecnologia. Excelente plano de carreira com possibilidade de rápida ascensão para cargos de gestão e assessoria.",
        "destaques": [
            "Auxílio refeição e alimentação superiores a R$ 1.900,00/mês",
            "Participação nos Lucros e Resultados (PLR) semestral",
            "Plano de previdência complementar fechada (PREVI)",
            "Jornada de 30 horas semanais (6h diárias)"
        ],
        "vagas_detalhadas": "4.000 vagas imediatas (2.000 Agente Comercial + 2.000 Agente de TI) + 2.000 cadastro de reserva",
        "estrategia": "Priorizar resolução exaustiva de provas recentes da Fundação Cesgranrio com foco em Conhecimentos Bancários e Informática."
    }'::jsonb,
    '[
        {"discipline": "Língua Portuguesa", "weight": 2.0, "topics": ["Compreensão e interpretação de textos", "Ortografia oficial", "Crase", "Concordância nominal e verbal", "Regência nominal e verbal"]},
        {"discipline": "Língua Inglesa", "weight": 1.0, "topics": ["Vocabulário básico", "Compreensão de textos em língua inglesa"]},
        {"discipline": "Matemática", "weight": 1.5, "topics": ["Números inteiros, racionais e reais", "Razões e proporções", "Porcentagem", "Juros simples e compostos"]},
        {"discipline": "Atualidades do Mercado Financeiro", "weight": 1.0, "topics": ["Sistema Financeiro Nacional", "Open Finance", "Pix", "Moedas digitais e ESG"]},
        {"discipline": "Conhecimentos Bancários", "weight": 3.0, "topics": ["Estrutura do SFN", "Conselho Monetário Nacional", "Banco Central do Brasil", "Produtos bancários", "Garantias do SFN"]},
        {"discipline": "Conhecimentos de Informática", "weight": 3.0, "topics": ["Segurança da informação", "Redes de computadores", "Sistemas operacionais", "Ferramentas de escritório"]},
        {"discipline": "Vendas e Negociação", "weight": 3.0, "topics": ["Noções de marketing de relacionamento", "Técnicas de vendas de produtos e serviços bancários", "Código de Defesa do Consumidor"]}
    ]'::jsonb
),
(
    '00000000-0000-0000-0000-000000000002',
    'caixa-economica-tecnico-bancario',
    'Caixa Econômica Federal - Técnico Bancário Novo',
    'Caixa Econômica Federal',
    'Técnico Bancário Novo (Geral e TI)',
    'Fundação Cesgranrio',
    'federal',
    'BR',
    NULL,
    'medio',
    'inscricoes_abertas',
    4000,
    1000,
    3762.00,
    50.00,
    '2026-08-20',
    '2026-10-05',
    '2026-11-15',
    'https://www.cesgranrio.org.br/concursos/caixa',
    'https://www.caixa.gov.br/concursos',
    '{
        "resumo": "Certame nacional com vagas distribuídas por todas as unidades da federação. A Caixa é a principal operadora de políticas públicas e habitação do Brasil.",
        "destaques": [
            "Remuneração inicial atrativa para nível médio",
            "Auxílio alimentação de R$ 1.850,00 e plano de saúde integral",
            "Oportunidades específicas para área de Tecnologia da Informação"
        ],
        "vagas_detalhadas": "3.200 vagas imediatas + 800 vagas em cadastro reserva, distribuídas em polos regionais",
        "estrategia": "Focar em Atendimento Bancário e Legislação da Caixa, com atenção especial à Cesgranrio."
    }'::jsonb,
    '[
        {"discipline": "Língua Portuguesa", "weight": 2.0, "topics": ["Interpretação textual", "Coesão e coerência", "Morfossintaxe", "Pontuação"]},
        {"discipline": "Língua Inglesa", "weight": 1.0, "topics": ["Vocabulário técnico bancário", "Leitura e compreensão de textos"]},
        {"discipline": "Matemática Financeira", "weight": 2.0, "topics": ["Juros simples e compostos", "Taxas de juros", "Amortização (SAC e Price)"]},
        {"discipline": "Noções de Probabilidade e Estatística", "weight": 1.5, "topics": ["Médias, moda e mediana", "Desvio padrão", "Probabilidade básica"]},
        {"discipline": "Conhecimentos Bancários", "weight": 3.0, "topics": ["Mercado financeiro e de capitais", "Crédito imobiliário e FGTS", "Programas sociais do governo"]},
        {"discipline": "Atendimento e Ética", "weight": 2.5, "topics": ["Ética no serviço público", "Resolução CMN sobre ouvidoria", "Diversidade e inclusão"]}
    ]'::jsonb
),
(
    '00000000-0000-0000-0000-000000000003',
    'receita-federal-auditor-fiscal',
    'Receita Federal - Auditor Fiscal',
    'Receita Federal do Brasil',
    'Auditor-Fiscal da Receita Federal',
    'FGV',
    'federal',
    'BR',
    NULL,
    'superior',
    'autorizado',
    699,
    300,
    21029.09,
    210.00,
    '2026-10-01',
    '2026-10-25',
    '2026-12-13',
    'https://conhecimento.fgv.br/concursos/rfb',
    'https://www.gov.br/receitafederal/pt-br/concursos',
    '{
        "resumo": "Um dos concursos mais prestigiados e concorridos da administração pública brasileira. Exige formação de nível superior em qualquer área.",
        "destaques": [
            "Remuneração inicial de R$ 21.029,09 podendo ultrapassar R$ 30 mil no topo",
            "Bônus de eficiência mensal e estabilidade estatutária",
            "Atuação em alfândegas, fiscalização de tributos e combate a fraudes"
        ],
        "vagas_detalhadas": "699 vagas autorizadas, sendo 469 para Auditor-Fiscal e 230 para Analista-Tributário",
        "estrategia": "A banca FGV possui padrão discursivo exigente. Estudo aprofundado em Direito Tributário e Contabilidade Avançada é indispensável."
    }'::jsonb,
    '[
        {"discipline": "Língua Portuguesa", "weight": 2.0, "topics": ["Interpretação e inferência textual FGV", "Semântica", "Reescrita de frases"]},
        {"discipline": "Direito Constitucional", "weight": 2.5, "topics": ["Direitos e garantias fundamentais", "Organização dos Poderes", "Controle de constitucionalidade"]},
        {"discipline": "Direito Administrativo", "weight": 2.5, "topics": ["Atos administrativos", "Licitações (Lei 14.133)", "Processo Administrativo Federal"]},
        {"discipline": "Direito Tributário", "weight": 3.0, "topics": ["Sistema Tributário Nacional", "Competência tributária", "Impostos federais", "Crédito tributário"]},
        {"discipline": "Legislação Tributária e Aduaneira", "weight": 3.0, "topics": ["Regulamento Aduaneiro", "Tributos sobre comércio exterior", "Zona Franca de Manaus"]},
        {"discipline": "Contabilidade Geral e Avançada", "weight": 3.0, "topics": ["Pronunciamentos Técnicos CPC", "Demonstrações contábeis", "Consolidação e equivalência"]},
        {"discipline": "Auditoria", "weight": 2.5, "topics": ["Normas de auditoria (NBC TA)", "Papéis de trabalho", "Testes substantivos e amostragem"]},
        {"discipline": "Fluência em Dados", "weight": 2.0, "topics": ["Bancos de dados relacionais", "SQL", "Python para análise de dados", "Machine Learning"]}
    ]'::jsonb
),
(
    '00000000-0000-0000-0000-000000000004',
    'inss-tecnico-seguro-social',
    'INSS - Técnico do Seguro Social',
    'Instituto Nacional do Seguro Social',
    'Técnico do Seguro Social',
    'Cebraspe',
    'federal',
    'BR',
    NULL,
    'medio',
    'previsto',
    1000,
    2000,
    5905.79,
    85.00,
    '2026-11-01',
    '2026-11-30',
    '2027-01-24',
    'https://www.cebraspe.org.br/concursos/inss',
    'https://www.gov.br/inss/pt-br/concursos',
    '{
        "resumo": "Excelente oportunidade federal de nível médio com grande capilaridade geográfica. O foco quase absoluto do certame reside em Direito Previdenciário.",
        "destaques": [
            "Regime estatutário com estabilidade após 3 anos",
            "70 das 120 questões são de Seguridade Social",
            "Atuação no atendimento e concessão de benefícios previdenciários"
        ],
        "vagas_detalhadas": "1.000 vagas imediatas solicitadas ao MGI + previsão de 2.000 excedentes",
        "estrategia": "Dominar as Leis 8.212/91 e 8.213/91 e o Decreto 3.048/99. No formato Cebraspe Certo/Errado, treinar rigorosamente o controle de chutes."
    }'::jsonb,
    '[
        {"discipline": "Seguridade Social e Direito Previdenciário", "weight": 4.0, "topics": ["Origem e evolução legislativa", "Regime Geral de Previdência Social", "Segurados e dependentes", "Benefícios previdenciários e carência", "Custeio e financiamento"]},
        {"discipline": "Língua Portuguesa", "weight": 2.0, "topics": ["Compreensão e tipologia textual", "Morfossintaxe", "Reescrita com correção gramatical"]},
        {"discipline": "Raciocínio Lógico", "weight": 1.5, "topics": ["Proposições lógicas", "Tabelas-verdade", "Equivalências e negações", "Diagramas lógicos"]},
        {"discipline": "Noções de Informática", "weight": 1.5, "topics": ["Sistemas operacionais", "Navegadores e nuvem", "Segurança da informação e antivírus"]},
        {"discipline": "Noções de Direito Constitucional e Administrativo", "weight": 2.0, "topics": ["Direitos individuais e coletivos", "Servidores públicos", "Regime jurídico dos servidores (Lei 8.112/90)"]}
    ]'::jsonb
),
(
    '00000000-0000-0000-0000-000000000005',
    'policia-federal-agente',
    'Polícia Federal - Agente',
    'Polícia Federal',
    'Agente de Polícia Federal',
    'Cebraspe',
    'federal',
    'BR',
    NULL,
    'superior',
    'autorizado',
    1200,
    600,
    14710.10,
    180.00,
    '2026-10-10',
    '2026-11-10',
    '2026-12-20',
    'https://www.cebraspe.org.br/concursos/pf',
    'https://www.gov.br/pf/pt-br/concursos',
    '{
        "resumo": "Carreira policial federal de ponta. Exige diploma de nível superior em qualquer curso e CNH categoria B ou superior.",
        "destaques": [
            "Porte de arma de fogo de alcance nacional",
            "Treinamento de elite na Academia Nacional de Polícia (ANP) em Brasília",
            "Teste de Aptidão Física (TAF) eliminatório de alta exigência"
        ],
        "vagas_detalhadas": "1.200 vagas imediatas distribuídas para Agente, Escrivão e Papiloscopista",
        "estrategia": "Informática (36 questões) e Contabilidade Geral (24 questões) decidem 50% da pontuação total. Iniciar treino do TAF no primeiro dia."
    }'::jsonb,
    '[
        {"discipline": "Informática e Tecnologia da Informação", "weight": 3.5, "topics": ["Teoria da informação", "Banco de dados e SQL", "Redes de computadores", "Python e R básico", "Segurança e criptografia"]},
        {"discipline": "Contabilidade Geral", "weight": 3.0, "topics": ["Patrimônio líquido e contas", "Balancete de verificação", "Demonstração do Resultado (DRE)", "Escrituração contábil"]},
        {"discipline": "Língua Portuguesa", "weight": 2.0, "topics": ["Compreensão e interpretação", "Pontuação e crase", "Redação oficial"]},
        {"discipline": "Raciocínio Lógico", "weight": 1.5, "topics": ["Estruturas lógicas", "Lógica de primeira ordem", "Análise combinatória e probabilidade"]},
        {"discipline": "Noções de Direito", "weight": 2.0, "topics": ["Direito Penal e Processual Penal", "Legislação especial de drogas e armas", "Direito Constitucional e Administrativo"]}
    ]'::jsonb
),
(
    '00000000-0000-0000-0000-000000000006',
    'policia-rodoviaria-federal-policial',
    'PRF - Policial Rodoviário Federal',
    'Polícia Rodoviária Federal',
    'Policial Rodoviário Federal',
    'Cebraspe',
    'federal',
    'BR',
    NULL,
    'superior',
    'previsto',
    1500,
    1000,
    11200.00,
    170.00,
    '2026-11-15',
    '2026-12-15',
    '2027-02-28',
    'https://www.cebraspe.org.br/concursos/prf',
    'https://www.gov.br/prf/pt-br/concursos',
    '{
        "resumo": "Polícia da União responsável pelo patrulhamento ostensivo das rodovias federais e combate ao crime organizado e tráfico de drogas e armas.",
        "destaques": [
            "Regime de plantão escala 24x72 ou expediente de fiscalização",
            "Plano de valorização salarial aprovado pelo Congresso",
            "Atuação em operações conjuntas e segurança viária moderna"
        ],
        "vagas_detalhadas": "1.500 vagas previstas com formação de cadastro reserva para até 2 turmas no UniPRF",
        "estrategia": "Legislação de Trânsito (CTB e resoluções Contran) é o bloco mais pontuado do edital. Estudo diário com simulados de questões comentadas."
    }'::jsonb,
    '[
        {"discipline": "Legislação de Trânsito", "weight": 3.5, "topics": ["Código de Trânsito Brasileiro (Lei 9.503/97)", "Resoluções do CONTRAN", "Crimes de trânsito", "Infrações e penalidades"]},
        {"discipline": "Língua Portuguesa", "weight": 2.0, "topics": ["Compreensão de textos", "Coesão textual", "Sintaxe da oração e do período"]},
        {"discipline": "Raciocínio Lógico-Matemático", "weight": 1.5, "topics": ["Proposições", "Matemática básica e funções", "Geometria e trigonometria"]},
        {"discipline": "Física Aplicada", "weight": 2.0, "topics": ["Cinemática escalar", "Dinâmica e Leis de Newton", "Energia e trabalho", "Colisões e atrito"]},
        {"discipline": "Direito e Legislação Especial", "weight": 2.0, "topics": ["Direitos Humanos", "Direito Constitucional", "Direito Administrativo", "Direito Penal e Processual Penal"]}
    ]'::jsonb
),
(
    '00000000-0000-0000-0000-000000000007',
    'tjsp-escrevente-tecnico',
    'TJ-SP - Escrevente Técnico Judiciário',
    'Tribunal de Justiça de São Paulo',
    'Escrevente Técnico Judiciário',
    'Vunesp',
    'estadual',
    'SP',
    'São Paulo e Interior',
    'medio',
    'edital_publicado',
    572,
    1200,
    7200.00,
    81.00,
    '2026-09-05',
    '2026-10-10',
    '2026-11-29',
    'https://www.vunesp.com.br/TJSP',
    'https://www.tjsp.jus.br/concursos',
    '{
        "resumo": "Maior concurso do judiciário estadual brasileiro. Aberto para nível médio com 100 questões objetivas e prova prática eliminatória de digitação.",
        "destaques": [
            "Remuneração total com auxílios ultrapassa R$ 7.200,00 líquidos",
            "Jornada de 40h semanais com possibilidade de teletrabalho após estágio probatório",
            "Chamamento massivo de candidatos da lista geral e comarcas do interior"
        ],
        "vagas_detalhadas": "572 vagas imediatas (Capital e Regiões Administrativas Judiciárias do Estado de São Paulo)",
        "estrategia": "A banca Vunesp cobra a literalidade da lei seca. Leitura atenta dos artigos exigidos em Direito Processual Civil e Penal é o diferencial para notas > 85%."
    }'::jsonb,
    '[
        {"discipline": "Língua Portuguesa", "weight": 3.0, "topics": ["35 questões na prova", "Interpretação e sentido dos vocábulos", "Concordância e regência", "Colocação pronominal"]},
        {"discipline": "Direito Constitucional", "weight": 2.0, "topics": ["Artigos 5º a 17 e 29 a 31 da CF", "Poder Judiciário paulista"]},
        {"discipline": "Direito Administrativo", "weight": 2.0, "topics": ["Estatuto dos Funcionários Públicos Civis de SP (Lei 10.261/68)", "Improbidade Administrativa"]},
        {"discipline": "Direito Processual Civil", "weight": 2.5, "topics": ["Atos processuais", "Prazos e comunicações", "Citação e intimação", "Tutelas provisórias"]},
        {"discipline": "Direito Processual Penal", "weight": 2.5, "topics": ["Inquérito policial", "Ação penal", "Prisão em flagrante e preventiva"]},
        {"discipline": "Normas da Corregedoria Geral de Justiça", "weight": 2.0, "topics": ["Escrituração forense", "Ofícios de justiça e autos em andamento", "Processo eletrônico"]},
        {"discipline": "Informática", "weight": 1.5, "topics": ["Windows 11", "Pacote Microsoft 365 (Word, Excel)", "Correio eletrônico e navegadores"]},
        {"discipline": "Matemática e Raciocínio Lógico", "weight": 1.5, "topics": ["Equações de 1º e 2º graus", "Regra de três", "Lógica dedutiva e sequências"]}
    ]'::jsonb
),
(
    '00000000-0000-0000-0000-000000000008',
    'tse-unificado-analista-judiciario',
    'TSE Unificado - Analista Judiciário',
    'Tribunal Superior Eleitoral',
    'Analista Judiciário - Área Judiciária',
    'Cebraspe',
    'federal',
    'DF',
    'Brasília e TREs de todo o Brasil',
    'superior',
    'edital_publicado',
    520,
    1500,
    13994.78,
    130.00,
    '2026-08-15',
    '2026-09-30',
    '2026-12-08',
    'https://www.cebraspe.org.br/concursos/tse_unificado',
    'https://www.tse.jus.br/concursos',
    '{
        "resumo": "Concurso Histórico Unificado da Justiça Eleitoral brasileira contemplando o Tribunal Superior Eleitoral e 26 Tribunais Regionais Eleitorais.",
        "destaques": [
            "Vencimento inicial superior a R$ 13.900,00 + auxílio alimentação de R$ 1.393,00",
            "Lotação em capitais e zonas eleitorais de todos os estados",
            "Atuação em direito eleitoral, registro de candidaturas e pleitos eleitorais"
        ],
        "vagas_detalhadas": "520 vagas imediatas + formação extensiva de cadastro reserva para validade de 2 anos renovável",
        "estrategia": "Aprofundar nas Resoluções do TSE, Lei das Eleições (Lei 9.504/97) e Código Eleitoral, mantendo alto rendimento em Direito Constitucional e Administrativo."
    }'::jsonb,
    '[
        {"discipline": "Direito Eleitoral", "weight": 4.0, "topics": ["Conceito e fontes do Direito Eleitoral", "Direitos políticos e alistamento", "Partidos políticos e federações", "Registro de candidatura e inelegibilidades (LC 64/90)", "Propaganda eleitoral e prestação de contas", "Crimes eleitorais"]},
        {"discipline": "Direito Constitucional", "weight": 3.0, "topics": ["Princípios fundamentais", "Direitos e garantias fundamentais", "Organização do Estado", "Organização dos Poderes e Poder Judiciário"]},
        {"discipline": "Direito Administrativo", "weight": 2.5, "topics": ["Princípios da administração pública", "Poderes da administração", "Servidores públicos da União (Lei 8.112/90)", "Licitações e contratos (Lei 14.133/21)"]},
        {"discipline": "Direito Civil e Processual Civil", "weight": 2.0, "topics": ["Parte geral do Código Civil", "Teoria geral do processo", "Procedimentos comuns e recursos"]},
        {"discipline": "Direito Penal e Processual Penal", "weight": 2.0, "topics": ["Teoria do crime e da pena", "Crimes contra a administração pública", "Inquérito e provas penais"]},
        {"discipline": "Língua Portuguesa", "weight": 2.0, "topics": ["Interpretação e tipologia textual", "Morfossintaxe Cebraspe", "Coesão e argumentação"]}
    ]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    institution = EXCLUDED.institution,
    role = EXCLUDED.role,
    exam_board = EXCLUDED.exam_board,
    sphere = EXCLUDED.sphere,
    state = EXCLUDED.state,
    city = EXCLUDED.city,
    education_level = EXCLUDED.education_level,
    status = EXCLUDED.status,
    vacancies = EXCLUDED.vacancies,
    vacancies_reserve = EXCLUDED.vacancies_reserve,
    salary = EXCLUDED.salary,
    registration_fee = EXCLUDED.registration_fee,
    registration_start_date = EXCLUDED.registration_start_date,
    registration_end_date = EXCLUDED.registration_end_date,
    exam_date = EXCLUDED.exam_date,
    registration_link = EXCLUDED.registration_link,
    edital_url = EXCLUDED.edital_url,
    summary_ai = EXCLUDED.summary_ai,
    programmatic_content = EXCLUDED.programmatic_content,
    updated_at = now();
