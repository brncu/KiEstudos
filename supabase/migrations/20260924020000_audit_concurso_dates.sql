-- Migration: 20260924020000_audit_concurso_dates.sql
-- Description: Audit and eliminate fake/invented contest dates and statuses.
-- Sets unreleased certames to 'previsto' with NULL exam and registration dates.
-- Sets concluded TSE Unificado certame to 'encerrado' with real historical date.

UPDATE public.concursos
SET 
    status = 'previsto',
    exam_date = NULL,
    registration_start_date = NULL,
    registration_end_date = NULL,
    updated_at = NOW()
WHERE slug IN (
    'banco-do-brasil-escriturario',
    'caixa-economica-tecnico-bancario',
    'receita-federal-auditor-fiscal',
    'inss-tecnico-seguro-social',
    'policia-federal-agente',
    'policia-rodoviaria-federal-policial',
    'tjsp-escrevente-tecnico'
);

UPDATE public.concursos
SET 
    status = 'encerrado',
    exam_date = '2024-12-08',
    registration_start_date = NULL,
    registration_end_date = NULL,
    updated_at = NOW()
WHERE slug = 'tse-unificado-analista-judiciario';
