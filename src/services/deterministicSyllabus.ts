/**
 * Deterministic Syllabus Generator ("Edital Mágico Fallback Engine")
 * Location: src/services/deterministicSyllabus.ts
 *
 * Provides high-fidelity, authentic structured syllabus data for major Brazilian public contests
 * (Banco do Brasil, Caixa, Receita Federal, INSS, Polícia Federal, PRF, TJ-SP, TSE Unificado),
 * along with a dynamic fallback generator for any ConcursoExam.
 *
 * Guarantees 100% availability, instant client rendering, zero crashing, and strict adherence
 * to the AISyllabusSummary interface from src/types/concurso.ts.
 */

import type { ConcursoExam, AISyllabusSummary } from "@/types/concurso";

/**
 * Calculates days remaining between today and a target date string.
 * Supports "YYYY-MM-DD" and "DD/MM/YYYY" formats.
 */
export function calculateDaysRemaining(dateStr?: string | null): number | undefined {
  if (!dateStr) return undefined;
  try {
    let target: Date;
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/").map(Number);
      const d = parts[0];
      const m = parts[1];
      const y = parts[2];
      if (d === undefined || m === undefined || y === undefined || isNaN(d) || isNaN(m) || isNaN(y)) {
        return undefined;
      }
      target = new Date(y, m - 1, d);
    } else {
      const parts = dateStr.split("-").map(Number);
      const y = parts[0];
      const m = parts[1];
      const d = parts[2];
      if (d === undefined || m === undefined || y === undefined || isNaN(d) || isNaN(m) || isNaN(y)) {
        return undefined;
      }
      target = new Date(y, m - 1, d);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  } catch {
    return undefined;
  }
}

/**
 * Normalizes date to pt-BR standard "DD/MM/YYYY".
 */
export function formatDateToBR(dateStr?: string | null): string {
  if (!dateStr) return "A definir";
  if (dateStr.includes("/")) return dateStr;
  try {
    const [y, m, d] = dateStr.split("-");
    if (!y || !m || !d) return dateStr;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  } catch {
    return dateStr;
  }
}

/**
 * Format currency to BRL
 */
export function formatBRL(amount?: number | null): string {
  if (amount == null) return "A definir";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}


export function buildExamRegistration(
  concurso: ConcursoExam,
  defaultFee: number,
  fallbackLink: string
): AISyllabusSummary["registration"] {
  let status: "abertas" | "previstas" | "encerradas" | "em_breve" = "previstas";
  if (concurso.status === "inscricoes_abertas") {
    status = "abertas";
  } else if (concurso.status === "encerrado") {
    status = "encerradas";
  } else if (concurso.status === "edital_publicado") {
    const daysToStart = calculateDaysRemaining(concurso.registration_start_date);
    const daysToEnd = calculateDaysRemaining(concurso.registration_end_date);
    if (daysToStart != null && daysToStart > 0) {
      status = "em_breve";
    } else if (daysToEnd != null && daysToEnd >= 0) {
      status = "abertas";
    } else {
      status = "encerradas";
    }
  } else {
    status = "previstas";
  }

  return {
    officialLink: concurso.registration_link || fallbackLink,
    fee: formatBRL(concurso.registration_fee ?? defaultFee),
    startDate: concurso.registration_start_date
      ? formatDateToBR(concurso.registration_start_date)
      : "Sem edital publicado (A definir)",
    endDate: concurso.registration_end_date
      ? formatDateToBR(concurso.registration_end_date)
      : "Sem edital publicado (A definir)",
    status,
  };
}

export function buildExamKeyDates(
  concurso: ConcursoExam,
  provaDescription: string
): AISyllabusSummary["keyDates"] {
  if (!concurso.exam_date) {
    return [
      {
        label: "Aplicação das Provas Objetivas",
        date: "Sem edital publicado (A definir)",
        type: "prova",
        description:
          "Certame em fase preliminar/previsto. Cronograma oficial e data de prova a definir após publicação do edital.",
        daysRemaining: undefined,
      },
      {
        label: "Período de Inscrições",
        date: "Sem edital publicado (A definir)",
        type: "inscricao",
        description:
          "Inscrições serão abertas somente após a publicação oficial do edital.",
        daysRemaining: undefined,
      },
    ];
  }

  const regStart = concurso.registration_start_date;
  const regEnd = concurso.registration_end_date;
  const list: AISyllabusSummary["keyDates"] = [];

  if (regStart || regEnd) {
    list.push({
      label: "Período de Inscrições",
      date:
        regStart && regEnd
          ? `${formatDateToBR(regStart)} a ${formatDateToBR(regEnd)}`
          : formatDateToBR(regEnd || regStart),
      type: "inscricao",
      description: `Inscrições online no portal oficial da banca organizadora (${concurso.exam_board || "Banca Oficial"})`,
      daysRemaining: calculateDaysRemaining(regEnd),
    });
  }

  list.push({
    label: "Aplicação das Provas Objetivas",
    date: formatDateToBR(concurso.exam_date),
    type: "prova",
    description: provaDescription,
    daysRemaining: calculateDaysRemaining(concurso.exam_date),
  });

  return list;
}

// =============================================================================
// Curated Major Exam Definitions
// =============================================================================

function getBancoDoBrasilSummary(concurso: ConcursoExam): AISyllabusSummary {
  return {
    examTitle: "Banco do Brasil - Escriturário (Agente Comercial e de TI)",
    institution: "Banco do Brasil S.A.",
    banca: concurso.exam_board || "Fundação Cesgranrio",
    vacancies: {
      total: concurso.vacancies + (concurso.vacancies_reserve || 2000),
      immediate: concurso.vacancies || 4000,
      reserve: concurso.vacancies_reserve || 2000,
      breakdown:
        "4.000 vagas imediatas (2.000 para Agente Comercial + 2.000 para Agente de TI) + 2.000 cadastro de reserva nacional.",
      cotasPCD: "5% das vagas reservadas para pessoas com deficiência (PCD)",
      cotasNegros: "20% das vagas reservadas para candidatos pretos ou pardos (PPP)",
    },
    remuneration: {
      initialSalary: formatBRL(concurso.salary || 3622.23),
      benefits:
        "Auxílio-refeição e alimentação de R$ 1.914,42/mês + Cesta de Alimentação + PLR semestral + Plano de Saúde e Previdência PREVI",
      totalEstimated: "R$ 5.536,65 + PLR semestral",
    },
    registration: buildExamRegistration(concurso, 50.0, "https://www.bb.com.br/concurso"),
    keyDates: buildExamKeyDates(concurso, "70 questões de múltipla escolha + Prova de Redação eliminatória"),
    programmaticContent: [
      {
        discipline: "Conhecimentos Bancários",
        weight: 3.0,
        topics: [
          "Estrutura do Sistema Financeiro Nacional (SFN)",
          "Conselho Monetário Nacional (CMN) e Banco Central do Brasil (BACEN)",
          "Produtos bancários: depósitos, empréstimos, títulos de capitalização e previdência",
          "Garantias do SFN: aval, fiança, penhor e hipoteca",
          "Mercado de câmbio e remessas internacionais",
          "Crime de lavagem de dinheiro (Lei 9.613/98) e COAF",
        ],
        importance: "alta",
      },
      {
        discipline: "Conhecimentos de Informática & TI",
        weight: 3.0,
        topics: [
          "Segurança da informação e LGPD (Lei 13.709/2018)",
          "Redes de computadores, internet, intranet e protocolos fundamentais",
          "Sistemas operacionais Windows 11 e Linux",
          "Ferramentas de escritório e produtividade em nuvem (M365)",
          "Conceitos de algoritmos, lógica de programação e inteligência artificial",
        ],
        importance: "alta",
      },
      {
        discipline: "Vendas e Negociação",
        weight: 3.0,
        topics: [
          "Marketing de relacionamento e CRM",
          "Técnicas de abordagem, sondagem, proposta e fechamento de vendas",
          "Código de Defesa do Consumidor aplicado ao setor financeiro",
          "Resoluções CMN sobre atendimento ao cliente e ouvidoria",
          "Conduta ética e governança corporativa no BB",
        ],
        importance: "alta",
      },
      {
        discipline: "Língua Portuguesa",
        weight: 2.0,
        topics: [
          "Compreensão e interpretação de textos opinativos e jornalísticos",
          "Ortografia oficial e acentuação gráfica",
          "Emprego do sinal indicativo de crase",
          "Concordância verbal e nominal",
          "Regência verbal e nominal com preposições",
          "Mecanismos de coesão textual e pontuação",
        ],
        importance: "alta",
      },
      {
        discipline: "Matemática e Matemática Financeira",
        weight: 1.5,
        topics: [
          "Conjuntos numéricos, razões, proporções e divisão proporcional",
          "Porcentagem e cálculos comerciais",
          "Juros simples e juros compostos com taxas nominais e efetivas",
          "Sistemas de amortização (Tabela Price e SAC)",
        ],
        importance: "media",
      },
      {
        discipline: "Atualidades do Mercado Financeiro",
        weight: 1.0,
        topics: [
          "Open Finance e integração de dados bancários",
          "Ecossistema Pix e arranjos de pagamentos digitais",
          "Moedas digitais de bancos centrais (Drex) e criptoativos",
          "Finanças sustentáveis, critérios ESG e economia circular",
        ],
        importance: "media",
      },
      {
        discipline: "Língua Inglesa",
        weight: 1.0,
        topics: [
          "Compreensão de textos em língua inglesa aplicados ao ambiente financeiro",
          "Vocabulário bancário e termos tecnológicos comuns",
        ],
        importance: "baixa",
      },
    ],
    studyStrategy: {
      focusAreas: [
        "Conhecimentos Bancários e Vendas somam 60% dos pontos da prova técnica",
        "Resolução intensiva do histórico de provas da Cesgranrio dos últimos 5 anos",
        "Redação eliminatória: treinar temas sobre tecnologia bancária, ESG e atendimento",
      ],
      tips: [
        "A Cesgranrio é direta e não costuma ter pegadinhas dúbias: priorize memorizar a estrutura regulatória do SFN e as normas do CMN.",
        "Para Informática, resolva questões simulando o ambiente Windows 11 e navegadores de internet modernos.",
        "Em Vendas e Negociação, entenda os princípios de foco no cliente e escuta ativa preconizados pelo Banco do Brasil.",
      ],
      estimatedHoursRecommended: 240,
    },
    generatedAt: new Date().toISOString(),
    source: "deterministic_fallback",
  };
}

function getCaixaSummary(concurso: ConcursoExam): AISyllabusSummary {
  return {
    examTitle: "Caixa Econômica Federal - Técnico Bancário Novo (Geral e TI)",
    institution: "Caixa Econômica Federal",
    banca: concurso.exam_board || "Fundação Cesgranrio",
    vacancies: {
      total: concurso.vacancies + (concurso.vacancies_reserve || 1000),
      immediate: concurso.vacancies || 4000,
      reserve: concurso.vacancies_reserve || 1000,
      breakdown:
        "4.000 vagas imediatas distribuídas em polos de todo o país (3.200 Geral + 800 TI) + 1.000 em cadastro de reserva.",
      cotasPCD: "10% das vagas reservadas para pessoas com deficiência",
      cotasNegros: "20% reservadas para candidatos autodeclarados negros",
    },
    remuneration: {
      initialSalary: formatBRL(concurso.salary || 3762.0),
      benefits:
        "Auxílio-alimentação de R$ 1.850,00 + Vale-transporte + Auxílio-creche de R$ 602,00 + Saúde Caixa + Previdência FUNCEF",
      totalEstimated: "R$ 5.612,00 + PLR proporcional semestral",
    },
    registration: buildExamRegistration(concurso, 50.0, "https://www.caixa.gov.br/concursos"),
    keyDates: buildExamKeyDates(concurso, "60 questões de múltipla escolha + Prova de Redação eliminatória Cesgranrio"),
    programmaticContent: [
      {
        discipline: "Conhecimentos Bancários",
        weight: 3.0,
        topics: [
          "Mercado financeiro e de capitais no Brasil",
          "Políticas públicas da Caixa: habitação, saneamento e infraestrutura",
          "Operações de crédito imobiliário e recursos do FGTS",
          "Programas sociais: Bolsa Família, Seguro-Desemprego e PIS",
          "Regulação do Sistema Financeiro e compliance bancário",
        ],
        importance: "alta",
      },
      {
        discipline: "Atendimento Bancário e Ética",
        weight: 2.5,
        topics: [
          "Legislação sobre acessibilidade e inclusão de PCDs",
          "Código de Ética da Caixa Econômica Federal",
          "Ouvidoria e resolução de conflitos com consumidores",
          "Segurança da informação e sigilo bancário (LC 105/2001)",
        ],
        importance: "alta",
      },
      {
        discipline: "Matemática Financeira",
        weight: 2.0,
        topics: [
          "Juros simples e juros compostos",
          "Taxas proporcionais, equivalentes e reais",
          "Descontos comerciais e racionais",
          "Sistemas de amortização constante (SAC) e sistema francês (Price)",
        ],
        importance: "alta",
      },
      {
        discipline: "Língua Portuguesa",
        weight: 2.0,
        topics: [
          "Interpretação e inferência textual Cesgranrio",
          "Coesão e coerência na estruturação dos parágrafos",
          "Emprego das classes de palavras e concordância",
          "Pontuação, vírgulas e crase",
        ],
        importance: "alta",
      },
      {
        discipline: "Noções de Probabilidade e Estatística",
        weight: 1.5,
        topics: [
          "Média aritmética, mediana e moda",
          "Variância e desvio padrão",
          "Probabilidade condicional e espaço amostral",
        ],
        importance: "media",
      },
      {
        discipline: "Língua Inglesa",
        weight: 1.0,
        topics: [
          "Compreensão de leitura e vocabulário técnico bancário",
        ],
        importance: "baixa",
      },
    ],
    studyStrategy: {
      focusAreas: [
        "Conhecimentos específicos da Caixa (habitação, FGTS e programas sociais)",
        "Matemática Financeira (amortização SAC e Price sempre cobrados pela Cesgranrio)",
        "Atendimento e relacionamento com o cliente bancário",
      ],
      tips: [
        "A Caixa dá enorme ênfase à sua função social: domine detalhadamente o funcionamento do FGTS e do crédito habitacional.",
        "Pratique redações com estrutura dissertativo-argumentativa voltadas a inclusão financeira e sustentabilidade bancária.",
      ],
      estimatedHoursRecommended: 220,
    },
    generatedAt: new Date().toISOString(),
    source: "deterministic_fallback",
  };
}

function getReceitaFederalSummary(concurso: ConcursoExam): AISyllabusSummary {
  return {
    examTitle: "Receita Federal do Brasil - Auditor-Fiscal e Analista-Tributário",
    institution: "Receita Federal do Brasil",
    banca: concurso.exam_board || "FGV",
    vacancies: {
      total: concurso.vacancies + (concurso.vacancies_reserve || 300),
      immediate: concurso.vacancies || 699,
      reserve: concurso.vacancies_reserve || 300,
      breakdown:
        "699 vagas autorizadas (469 para Auditor-Fiscal e 230 para Analista-Tributário) + 300 excedentes.",
      cotasPCD: "5% das vagas reservadas",
      cotasNegros: "20% das vagas reservadas",
    },
    remuneration: {
      initialSalary: formatBRL(concurso.salary || 21029.09),
      benefits:
        "Auxílio-alimentação de R$ 1.000,00 + Bônus de Eficiência Institucional variável de até R$ 3.000,00/mês",
      totalEstimated: "R$ 24.029,09 iniciais",
    },
    registration: buildExamRegistration(concurso, 210.0, "https://www.gov.br/receitafederal/pt-br/concursos"),
    keyDates: buildExamKeyDates(concurso, "140 questões de múltipla escolha + 2 Provas Discursivas FGV"),
    programmaticContent: [
      {
        discipline: "Direito Tributário",
        weight: 3.0,
        topics: [
          "Sistema Tributário Nacional na CF/88",
          "Código Tributário Nacional (Lei 5.172/66)",
          "Competência tributária e limitações constitucionais",
          "Obrigação tributária, fato gerador e responsabilidade",
          "Crédito tributário: constituição, suspensão, extinção e exclusão",
          "Jurisprudência pacificada do STF e STJ em matéria tributária",
        ],
        importance: "alta",
      },
      {
        discipline: "Legislação Tributária e Aduaneira",
        weight: 3.0,
        topics: [
          "Regulamento Aduaneiro (Decreto 6.759/2009)",
          "Impostos de Importação e Exportação",
          "IPI, PIS/Pasep e COFINS",
          "Regimes aduaneiros especiais (Drawback, Admissão Temporária)",
          "Infrações e penalidades no comércio exterior",
        ],
        importance: "alta",
      },
      {
        discipline: "Contabilidade Geral e Avançada",
        weight: 3.0,
        topics: [
          "Pronunciamentos Técnicos CPC emitidos pelo CFC",
          "Demonstrações contábeis obrigatórias (BP, DRE, DFC, DMPL)",
          "Operações com mercadorias e provisões contábeis",
          "Consolidação de demonstrações financeiras e equivalência patrimonial",
        ],
        importance: "alta",
      },
      {
        discipline: "Direito Administrativo e Constitucional",
        weight: 2.5,
        topics: [
          "Nova Lei de Licitações (Lei 14.133/2021)",
          "Processo Administrativo Fiscal (Decreto 70.235/72)",
          "Controle de constitucionalidade das leis",
          "Direitos e deveres individuais e coletivos",
        ],
        importance: "alta",
      },
      {
        discipline: "Auditoria",
        weight: 2.5,
        topics: [
          "Normas brasileiras de auditoria (NBC TA)",
          "Papéis de trabalho e evidências de auditoria",
          "Amostragem estatística e relatórios de auditoria",
        ],
        importance: "media",
      },
      {
        discipline: "Fluência em Dados e Tecnologia",
        weight: 2.0,
        topics: [
          "Modelagem relacional e consultas SQL complexas",
          "Linguagem Python para manipulação de dataframes (pandas)",
          "Fundamentos de Big Data, ETL e visualização de dados",
        ],
        importance: "alta",
      },
      {
        discipline: "Língua Portuguesa FGV",
        weight: 2.0,
        topics: [
          "Estilo peculiar e denso da banca FGV: semântica profunda e inferência",
          "Coesão textual, ambiguidade e reescritura de períodos",
        ],
        importance: "alta",
      },
    ],
    studyStrategy: {
      focusAreas: [
        "Tributário + Legislação Aduaneira + Contabilidade compõem o núcleo duro do certame",
        "Fluência em Dados: diferencial eliminatório nos concursos fiscais modernos",
        "Discursivas FGV: treino regular de redação de pareceres e soluções de consulta",
      ],
      tips: [
        "A FGV possui uma interpretação de texto extremamente filosófica e exigente: resolva provas recentes da banca de outros fiscos estaduais.",
        "Em Contabilidade, foque nos pronunciamentos CPC 00, 16, 27 e 01.",
      ],
      estimatedHoursRecommended: 600,
    },
    generatedAt: new Date().toISOString(),
    source: "deterministic_fallback",
  };
}

function getINSSSummary(concurso: ConcursoExam): AISyllabusSummary {
  return {
    examTitle: "INSS - Técnico do Seguro Social",
    institution: "Instituto Nacional do Seguro Social",
    banca: concurso.exam_board || "Cebraspe",
    vacancies: {
      total: concurso.vacancies + (concurso.vacancies_reserve || 2000),
      immediate: concurso.vacancies || 1000,
      reserve: concurso.vacancies_reserve || 2000,
      breakdown:
        "1.000 vagas imediatas com lotação nacional em agências da previdência (APS) + 2.000 em cadastro de reserva.",
      cotasPCD: "5% das vagas reservadas",
      cotasNegros: "20% das vagas reservadas",
    },
    remuneration: {
      initialSalary: formatBRL(concurso.salary || 5905.79),
      benefits:
        "Auxílio-alimentação de R$ 1.000,00 + Gratificação de Desempenho (GDASS) de até R$ 3.500,00",
      totalEstimated: "R$ 6.905,79 iniciais",
    },
    registration: buildExamRegistration(concurso, 85.0, "https://www.gov.br/inss/pt-br/concursos"),
    keyDates: buildExamKeyDates(concurso, "120 itens no modelo Cebraspe (Certo ou Errado)"),
    programmaticContent: [
      {
        discipline: "Seguridade Social e Direito Previdenciário",
        weight: 4.0,
        topics: [
          "Conceito e princípios constitucionais da Seguridade Social",
          "Regime Geral de Previdência Social (RGPS) - Leis 8.212/91 e 8.213/91",
          "Decreto 3.048/99 atualizado pelo Decreto 10.410/2020",
          "Segurados obrigatórios e facultativos do RGPS",
          "Dependentes, classes e inscrição",
          "Benefícios em espécie: aposentadorias, auxílios, pensão por morte e salário-maternidade",
          "Carência, cálculo da Renda Mensal Inicial (RMI) e reajustes",
          "Financiamento da Seguridade Social e contribuições dos segurados",
        ],
        importance: "alta",
      },
      {
        discipline: "Língua Portuguesa",
        weight: 2.0,
        topics: [
          "Interpretação textual no padrão Cebraspe",
          "Coesão e substituição de vocábulos",
          "Morfologia e sintaxe do período",
          "Redação oficial (Manual da Presidência da República)",
        ],
        importance: "alta",
      },
      {
        discipline: "Noções de Direito Constitucional e Administrativo",
        weight: 2.0,
        topics: [
          "Direitos e garantias fundamentais",
          "Administração pública direta e indireta",
          "Regime Jurídico dos Servidores Federais (Lei 8.112/90)",
          "Processo Administrativo Federal (Lei 9.784/99)",
          "Improbidade administrativa (Lei 8.429/92)",
        ],
        importance: "media",
      },
      {
        discipline: "Raciocínio Lógico-Matemático",
        weight: 1.5,
        topics: [
          "Lógica proposicional, conectivos e tabelas-verdade",
          "Equivalências lógicas e leis de De Morgan",
          "Diagramas lógicos e conjuntos",
        ],
        importance: "media",
      },
      {
        discipline: "Noções de Informática",
        weight: 1.5,
        topics: [
          "Conceitos de internet e intranet",
          "Ferramentas de navegação e suíte de escritório",
          "Segurança da informação e procedimentos de backup",
        ],
        importance: "media",
      },
    ],
    studyStrategy: {
      focusAreas: [
        "Direito Previdenciário representa 70 das 120 questões (58% de todo o certame)",
        "Domínio estrito das Leis 8.212/91 e 8.213/91 e do Decreto 3.048/99",
        "Estratégia Cebraspe de não chutar questões incertas (uma errada anula uma certa)",
      ],
      tips: [
        "Resolva exaustivamente as provas dos concursos do INSS de 2016 e 2022 do Cebraspe.",
        "Foque em memorizar os prazos de carência e as regras de transição da Emenda Constitucional 103/2019.",
      ],
      estimatedHoursRecommended: 280,
    },
    generatedAt: new Date().toISOString(),
    source: "deterministic_fallback",
  };
}

function getPoliciaFederalSummary(concurso: ConcursoExam): AISyllabusSummary {
  return {
    examTitle: "Polícia Federal - Agente de Polícia Federal",
    institution: "Polícia Federal",
    banca: concurso.exam_board || "Cebraspe",
    vacancies: {
      total: concurso.vacancies + (concurso.vacancies_reserve || 600),
      immediate: concurso.vacancies || 1200,
      reserve: concurso.vacancies_reserve || 600,
      breakdown:
        "1.200 vagas imediatas para Agente, Escrivão e Papiloscopista + 600 em cadastro de reserva para chamamento na ANP.",
      cotasPCD: "5% das vagas reservadas",
      cotasNegros: "20% reservadas para candidatos autodeclarados negros",
    },
    remuneration: {
      initialSalary: formatBRL(concurso.salary || 14710.1),
      benefits:
        "Auxílio-alimentação de R$ 1.000,00 + Adicional de Fronteira de até R$ 2.000,00/mês para delegacias de fronteira",
      totalEstimated: "R$ 15.710,10 a R$ 17.710,10",
    },
    registration: buildExamRegistration(concurso, 180.0, "https://www.gov.br/pf/pt-br/concursos"),
    keyDates: buildExamKeyDates(concurso, "120 itens Cebraspe Certo/Errado + Prova Discursiva + Teste de Aptidão Física (TAF)"),
    programmaticContent: [
      {
        discipline: "Informática & Tecnologia da Informação",
        weight: 3.5,
        topics: [
          "Bancos de dados: modelo relacional, SQL, chaves e normalização",
          "Teoria da informação e representação binária",
          "Redes de computadores, arquitetura TCP/IP e computação em nuvem",
          "Programação Python e R (estruturas de controle e bibliotecas de dados)",
          "Segurança da informação, criptografia, malware e engenharia social",
        ],
        importance: "alta",
      },
      {
        discipline: "Contabilidade Geral",
        weight: 3.0,
        topics: [
          "Conceito, objeto e finalidade da Contabilidade",
          "Patrimônio líquido, ativos, passivos e equação fundamental",
          "Escrituração contábil e partidas dobradas",
          "Balancete de verificação e Demonstração do Resultado do Exercício (DRE)",
          "Balanço Patrimonial e critérios de avaliação de ativos",
        ],
        importance: "alta",
      },
      {
        discipline: "Língua Portuguesa",
        weight: 2.0,
        topics: [
          "Compreensão e interpretação de textos do Cebraspe",
          "Tipologia textual e mecanismos de coesão",
          "Reescritura de frases com correção gramatical",
        ],
        importance: "alta",
      },
      {
        discipline: "Noções de Direito Penal e Processual Penal",
        weight: 2.0,
        topics: [
          "Aplicação da lei penal no tempo e no espaço",
          "Teoria do crime: fato típico, ilicitude e culpabilidade",
          "Inquérito policial e ação penal",
          "Prisão em flagrante e prisão preventiva",
        ],
        importance: "media",
      },
      {
        discipline: "Legislação Especial",
        weight: 1.5,
        topics: [
          "Lei de Drogas (Lei 11.343/2006)",
          "Estatuto do Desarmamento (Lei 10.826/2003)",
          "Organizações criminosas (Lei 12.850/2013)",
          "Crimes hediondos (Lei 8.072/90)",
        ],
        importance: "media",
      },
      {
        discipline: "Raciocínio Lógico",
        weight: 1.5,
        topics: [
          "Lógica de proposições e equivalências",
          "Análise combinatória e probabilidade",
        ],
        importance: "media",
      },
    ],
    studyStrategy: {
      focusAreas: [
        "Informática (36 itens) e Contabilidade Geral (24 itens) respondem por 50% da prova",
        "Começar o treinamento do TAF (principalmente barra fixa e natação) desde o primeiro dia",
        "Treinar redação sobre segurança pública, combate ao tráfico e crime cibernético",
      ],
      tips: [
        "Não deixe Contabilidade para depois: 24 itens de Cebraspe Certo/Errado eliminam mais candidatos que a parte de direito.",
        "Em Informática, a prova da PF é pesada em Banco de Dados e Python, não em office básico.",
      ],
      estimatedHoursRecommended: 450,
    },
    generatedAt: new Date().toISOString(),
    source: "deterministic_fallback",
  };
}

function getPRFSummary(concurso: ConcursoExam): AISyllabusSummary {
  return {
    examTitle: "PRF - Policial Rodoviário Federal",
    institution: "Polícia Rodoviária Federal",
    banca: concurso.exam_board || "Cebraspe",
    vacancies: {
      total: concurso.vacancies + (concurso.vacancies_reserve || 1000),
      immediate: concurso.vacancies || 1500,
      reserve: concurso.vacancies_reserve || 1000,
      breakdown:
        "1.500 vagas imediatas com lotação preferencial em regiões de fronteira + 1.000 cadastro reserva.",
      cotasPCD: "5% das vagas",
      cotasNegros: "20% das vagas reservadas",
    },
    remuneration: {
      initialSalary: formatBRL(concurso.salary || 11200.0),
      benefits:
        "Auxílio-alimentação de R$ 1.000,00 + Adicional de fronteira de até R$ 2.000,00",
      totalEstimated: "R$ 12.200,00 a R$ 14.200,00",
    },
    registration: buildExamRegistration(concurso, 170.0, "https://www.gov.br/prf/pt-br/concursos"),
    keyDates: buildExamKeyDates(concurso, "120 itens Cebraspe Certo/Errado + Prova Discursiva + Teste de Aptidão Física (TAF)"),
    programmaticContent: [
      {
        discipline: "Legislação de Trânsito",
        weight: 3.5,
        topics: [
          "Código de Trânsito Brasileiro (Lei 9.503/1997) integral",
          "Resoluções vigentes do Conselho Nacional de Trânsito (CONTRAN)",
          "Crimes de trânsito e procedimentos de fiscalização",
          "Infrações, medidas administrativas e penalidades",
          "Engenharia de tráfego e sinalização viária",
        ],
        importance: "alta",
      },
      {
        discipline: "Língua Portuguesa",
        weight: 2.0,
        topics: [
          "Compreensão de textos jornalísticos e técnicos",
          "Concordância, regência e crase",
          "Pontuação e sintaxe do período composto",
        ],
        importance: "alta",
      },
      {
        discipline: "Física Aplicada",
        weight: 2.0,
        topics: [
          "Cinemática escalar: velocidade, aceleração e frenagem",
          "Leis de Newton aplicadas a acidentes de trânsito",
          "Atrito, quantidade de movimento e colisões inelásticas",
          "Energia mecânica e conservação",
        ],
        importance: "alta",
      },
      {
        discipline: "Direito Constitucional e Administrativo",
        weight: 2.0,
        topics: [
          "Segurança Pública na CF (artigo 144)",
          "Direitos e deveres individuais",
          "Poder de polícia administrativa e uso proporcional da força",
          "Responsabilidade civil do Estado",
        ],
        importance: "media",
      },
      {
        discipline: "Direito Penal, Processual Penal e Legislação Especial",
        weight: 2.0,
        topics: [
          "Crimes contra a pessoa e o patrimônio",
          "Prisão em flagrante e busca e apreensão",
          "Lei de Abuso de Autoridade (Lei 13.869/2019)",
          "Lei de Armas e Lei de Drogas",
        ],
        importance: "media",
      },
      {
        discipline: "Raciocínio Lógico-Matemático",
        weight: 1.5,
        topics: [
          "Lógica dedutiva e conjuntos",
          "Geometria básica e trigonometria",
          "Funções de 1º e 2º graus",
        ],
        importance: "media",
      },
    ],
    studyStrategy: {
      focusAreas: [
        "Legislação de Trânsito: Bloco II exclusivo com 30 a 40 questões determinantes",
        "Física: cálculo de distâncias de frenagem e colisões para perícia de acidentes",
        "Condicionamento físico para o TAF intenso da PRF",
      ],
      tips: [
        "Memorize as resoluções do CONTRAN que tratam de tacógrafo, transporte de crianças, embriaguez ao volante e peso de veículos.",
        "Treine o teste de agilidade (shuttle run) com calçado adequado para evitar lesões.",
      ],
      estimatedHoursRecommended: 420,
    },
    generatedAt: new Date().toISOString(),
    source: "deterministic_fallback",
  };
}

function getTJSPEScreventeSummary(concurso: ConcursoExam): AISyllabusSummary {
  return {
    examTitle: "TJ-SP - Escrevente Técnico Judiciário",
    institution: "Tribunal de Justiça do Estado de São Paulo",
    banca: concurso.exam_board || "Fundação Vunesp",
    vacancies: {
      total: concurso.vacancies + (concurso.vacancies_reserve || 1200),
      immediate: concurso.vacancies || 572,
      reserve: concurso.vacancies_reserve || 1200,
      breakdown:
        "572 vagas imediatas (Comarca da Capital e Regiões Administrativas Judiciárias) + 1.200 em cadastro reserva.",
      cotasPCD: "5% das vagas reservadas para pessoas com deficiência",
      cotasNegros: "20% reservadas para candidatos negros",
    },
    remuneration: {
      initialSalary: formatBRL(concurso.salary || 7200.0),
      benefits:
        "Auxílio-alimentação de R$ 65,00/dia trabalhado + Auxílio-saúde de R$ 520,00 + Auxílio-transporte + Adicional de qualificação",
      totalEstimated: "R$ 7.200,00 a R$ 8.100,00 brutos",
    },
    registration: buildExamRegistration(concurso, 81.0, "https://www.tjsp.jus.br/concursos"),
    keyDates: buildExamKeyDates(concurso, "100 questões de múltipla escolha Vunesp + Prova Prática de Digitação"),
    programmaticContent: [
      {
        discipline: "Língua Portuguesa (Bloco I)",
        weight: 3.0,
        topics: [
          "35 questões objetivas de Língua Portuguesa",
          "Interpretação e sentido de palavras no contexto",
          "Crase, pontuação e sintaxe de regência/concordância",
          "Colocação pronominal e pronomes de tratamento forense",
        ],
        importance: "alta",
      },
      {
        discipline: "Direito Processual Civil",
        weight: 2.5,
        topics: [
          "Atos processuais, prazos e penalidades",
          "Citação, intimação e cartas precatórias/rogatórias",
          "Tutela provisória e procedimento comum",
          "Audiências de conciliação e julgamento",
        ],
        importance: "alta",
      },
      {
        discipline: "Direito Processual Penal",
        weight: 2.5,
        topics: [
          "Inquérito policial e termos circunstanciados",
          "Ação penal pública e privada",
          "Prisão preventiva, temporária e medidas cautelares",
          "Habeas corpus e recursos criminais no TJ-SP",
        ],
        importance: "alta",
      },
      {
        discipline: "Normas da Corregedoria Geral da Justiça (NSCGJ)",
        weight: 2.0,
        topics: [
          "Ofícios de justiça e protocolo de petições",
          "Processo Judicial Eletrônico (SAJ/e-SAJ)",
          "Autuação, juntada, termos de audiência e numeração de folhas",
          "Deveres dos servidores dos cartórios judiciais",
        ],
        importance: "alta",
      },
      {
        discipline: "Direito Constitucional e Administrativo",
        weight: 2.0,
        topics: [
          "Direitos e deveres individuais (Artigo 5º da CF/88)",
          "Estatuto dos Servidores Públicos Civis de SP (Lei 10.261/68)",
          "Lei de Improbidade Administrativa atualizada",
        ],
        importance: "media",
      },
      {
        discipline: "Informática",
        weight: 1.5,
        topics: [
          "Windows 11 e gerenciador de arquivos",
          "Microsoft Word e Excel 365",
          "Correio eletrônico (Outlook) e reuniões pelo Teams",
        ],
        importance: "media",
      },
      {
        discipline: "Matemática e Raciocínio Lógico",
        weight: 1.5,
        topics: [
          "Regra de três, porcentagem e equações",
          "Sequências numéricas e lógicas",
          "Estrutura lógica de proposições",
        ],
        importance: "media",
      },
    ],
    studyStrategy: {
      focusAreas: [
        "A Vunesp cobra a 'letra da lei' de forma literal: ler e reler o CPC, CPP e NSCGJ",
        "Língua Portuguesa vale 35% de toda a pontuação da prova: erro zero",
        "Treinar digitação e formatação do texto no Word logo após a prova objetiva",
      ],
      tips: [
        "Não gaste tempo com doutrinas complexas: foque em leitura atenta dos artigos de lei expressos no edital da Vunesp.",
        "As Normas da Corregedoria são um diferencial: a maioria dos candidatos não estuda com rigor os artigos das NSCGJ.",
      ],
      estimatedHoursRecommended: 320,
    },
    generatedAt: new Date().toISOString(),
    source: "deterministic_fallback",
  };
}

function getTSEUnificadoSummary(concurso: ConcursoExam): AISyllabusSummary {
  return {
    examTitle: "TSE Unificado - Analista Judiciário (Área Judiciária)",
    institution: "Tribunal Superior Eleitoral & Tribunais Regionais Eleitorais",
    banca: concurso.exam_board || "Cebraspe",
    vacancies: {
      total: concurso.vacancies + (concurso.vacancies_reserve || 1500),
      immediate: concurso.vacancies || 520,
      reserve: concurso.vacancies_reserve || 1500,
      breakdown:
        "520 vagas imediatas distribuídas entre o TSE e 26 Tribunais Regionais Eleitorais (TREs) + 1.500 cadastro de reserva.",
      cotasPCD: "10% das vagas reservadas",
      cotasNegros: "20% das vagas reservadas para pessoas negras",
    },
    remuneration: {
      initialSalary: formatBRL(concurso.salary || 13994.78),
      benefits:
        "Auxílio-alimentação de R$ 1.393,10 + Assistência pré-escolar de R$ 1.178,82 + Assistência médica",
      totalEstimated: "R$ 15.387,88 iniciais",
    },
    registration: buildExamRegistration(concurso, 130.0, "https://www.tse.jus.br/concursos"),
    keyDates: buildExamKeyDates(concurso, "120 itens Cebraspe Certo/Errado + Prova Discursiva (Prova realizada em 08/12/2024)"),
    programmaticContent: [
      {
        discipline: "Direito Eleitoral",
        weight: 4.0,
        topics: [
          "Código Eleitoral (Lei 4.737/65) e Lei das Eleições (Lei 9.504/97)",
          "Inelegibilidades e Lei da Ficha Limpa (LC 64/90)",
          "Partidos políticos e federações partidárias (Lei 9.096/95)",
          "Registro de candidatura, impugnações e recursos",
          "Propaganda eleitoral, prestação de contas e crimes eleitorais",
          "Resoluções recentes e súmulas do TSE",
        ],
        importance: "alta",
      },
      {
        discipline: "Direito Constitucional",
        weight: 3.0,
        topics: [
          "Direitos políticos, nacionalidade e alistabilidade",
          "Organização do Poder Judiciário e competências do TSE/TREs",
          "Ações constitucionais e controle difuso/concentrado",
        ],
        importance: "alta",
      },
      {
        discipline: "Direito Administrativo",
        weight: 2.5,
        topics: [
          "Regime dos Servidores Civis da União (Lei 8.112/90)",
          "Licitações e Contratos Administrativos (Lei 14.133/21)",
          "Poderes administrativos e responsabilidade civil do Estado",
        ],
        importance: "alta",
      },
      {
        discipline: "Direito Civil e Processual Civil",
        weight: 2.0,
        topics: [
          "Parte geral do Código Civil e negócios jurídicos",
          "Teoria geral da prova e recursos processuais cíveis no CPC",
        ],
        importance: "media",
      },
      {
        discipline: "Direito Penal e Processual Penal",
        weight: 2.0,
        topics: [
          "Crimes contra a fé pública e contra a administração pública",
          "Provas e procedimentos recursais criminais",
        ],
        importance: "media",
      },
      {
        discipline: "Língua Portuguesa",
        weight: 2.0,
        topics: [
          "Compreensão e interpretação de texto Cebraspe",
          "Morfossintaxe e pontuação rigorosa",
        ],
        importance: "alta",
      },
    ],
    studyStrategy: {
      focusAreas: [
        "Direito Eleitoral é o coração do concurso: resoluções normativas do TSE são determinantes",
        "Discursivas: treinar casos práticos de impugnação de mandato eletivo (AIME) e registro",
        "Controle rigoroso do fator de correção Cebraspe (1 errada anula 1 certa)",
      ],
      tips: [
        "Estude as resoluções expedidas pelo TSE para as eleições mais recentes, pois o Cebraspe costuma cobrar jurisprudência nova.",
        "Não negligencie a Lei 14.133/2021 em Direito Administrativo.",
      ],
      estimatedHoursRecommended: 480,
    },
    generatedAt: new Date().toISOString(),
    source: "deterministic_fallback",
  };
}

// =============================================================================
// Generic Dynamic Generator for Any ConcursoExam
// =============================================================================

function generateDynamicSyllabus(concurso: ConcursoExam): AISyllabusSummary {
  const today = new Date();
  const registration = buildExamRegistration(concurso, 70.0, concurso.registration_link || "https://concursos.gov.br");
  const keyDates = buildExamKeyDates(concurso, "Provas objetivas para todos os cargos");

  // Calculate vacancies breakdown
  const immediate = concurso.vacancies || 50;
  const reserve = concurso.vacancies_reserve || Math.round(immediate * 0.5);
  const total = immediate + reserve;

  // Remuneration
  const salaryVal = concurso.salary || 4500.0;
  const benefitsEst =
    concurso.sphere === "federal"
      ? "Auxílio-alimentação de R$ 1.000,00 + auxílio transporte e saúde"
      : "Benefícios previstos no estatuto funcional dos servidores locais";
  const totalEstVal = salaryVal + (concurso.sphere === "federal" ? 1000 : 600);

  // Programmatic Content
  let programmaticContent: AISyllabusSummary["programmaticContent"] = [];

  if (Array.isArray(concurso.programmatic_content) && concurso.programmatic_content.length > 0) {
    programmaticContent = concurso.programmatic_content.map((item: any) => ({
      discipline: item.discipline || "Conhecimentos",
      weight: typeof item.weight === "number" ? item.weight : 2.0,
      topics: Array.isArray(item.topics) ? item.topics : ["Tópicos fundamentais do edital"],
      importance: (item.importance as any) || "alta",
    }));
  } else {
    // Generate intelligent default disciplines based on sphere and education level
    programmaticContent = [
      {
        discipline: "Língua Portuguesa",
        weight: 2.0,
        topics: [
          "Compreensão e interpretação de textos",
          "Ortografia e acentuação gráfica",
          "Concordância verbal e nominal",
          "Regência e sinal indicativo de crase",
          "Coesão e coerência textual",
        ],
        importance: "alta",
      },
      {
        discipline: `Conhecimentos Específicos — ${concurso.role}`,
        weight: 3.0,
        topics: [
          `Legislação e rotinas técnicas inerentes ao cargo de ${concurso.role}`,
          "Normas operacionais e resoluções aplicáveis",
          "Ética profissional e conduta pública",
          "Estudos de caso e resolução de problemas práticos",
        ],
        importance: "alta",
      },
      {
        discipline: "Noções de Direito Constitucional e Administrativo",
        weight: 2.0,
        topics: [
          "Princípios fundamentais da Administração Pública (LIMPE)",
          "Direitos e garantias fundamentais na Constituição Federal",
          "Estatuto dos Servidores Públicos e deveres funcionais",
          "Poderes administrativos e atos administrativos",
        ],
        importance: "alta",
      },
      {
        discipline: "Raciocínio Lógico-Matemático",
        weight: 1.5,
        topics: [
          "Estruturas lógicas e tabelas-verdade",
          "Equivalências e negações proposicionais",
          "Porcentagem, razão e proporção",
        ],
        importance: "media",
      },
      {
        discipline: "Noções de Informática",
        weight: 1.5,
        topics: [
          "Sistemas operacionais e ferramentas de escritório",
          "Navegadores de internet, correio eletrônico e nuvem",
          "Segurança da informação e prevenção a ameaças virtuais",
        ],
        importance: "media",
      },
    ];
  }

  // Board-specific tips
  const bancaLower = (concurso.exam_board || "").toLowerCase();
  const tips: string[] = [];
  if (bancaLower.includes("cebraspe") || bancaLower.includes("cespe")) {
    tips.push("O Cebraspe adota o modelo Certo/Errado em que uma questão errada anula uma certa: controle os chutes.");
    tips.push("Treine interpretação de texto e enunciados longos com interdisciplinaridade.");
  } else if (bancaLower.includes("fgv")) {
    tips.push("A banca FGV possui padrão discursivo e semântico extremamente denso: resolva muitas provas recentes da banca.");
    tips.push("Em matérias jurídicas e contábeis, a FGV explora casos concretos complexos.");
  } else if (bancaLower.includes("vunesp")) {
    tips.push("A banca Vunesp preza pela literalidade da lei seca: faça a leitura exaustiva dos artigos citados.");
    tips.push("Mantenha alto índice de acertos em Língua Portuguesa, pois as notas de corte costumam ser elevadas.");
  } else if (bancaLower.includes("cesgranrio")) {
    tips.push("A Fundação Cesgranrio tem questões diretas com 5 alternativas: foque na resolução de bancas anteriores.");
    tips.push("Em matemática e matérias financeiras, a Cesgranrio cobra fórmulas clássicas sem rodeios.");
  } else {
    tips.push(`Analise provas anteriores aplicadas pela banca ${concurso.exam_board || "organizadora"} para conhecer o estilo de cobrança.`);
    tips.push("Crie um plano semanal verticalizado priorizando as disciplinas com maior peso na prova.");
  }

  return {
    examTitle: concurso.title,
    institution: concurso.institution,
    banca: concurso.exam_board || "Banca a definir",
    vacancies: {
      total,
      immediate,
      reserve,
      breakdown: `${immediate} vagas imediatas + ${reserve} previstas em cadastro reserva para o cargo de ${concurso.role}.`,
      cotasPCD: "5% das vagas reservadas para pessoas com deficiência (PCD)",
      cotasNegros: "20% das vagas reservadas para candidatos autodeclarados negros",
    },
    remuneration: {
      initialSalary: formatBRL(salaryVal),
      benefits: benefitsEst,
      totalEstimated: formatBRL(totalEstVal),
    },
    registration,
    keyDates,
    programmaticContent,
    studyStrategy: {
      focusAreas: [
        `Conhecimentos Específicos para ${concurso.role} com maior ponderação de pontos`,
        "Língua Portuguesa como matéria eliminatória e classificatória",
        "Resolução contínua de questões com cronometragem de tempo por item",
      ],
      tips,
      estimatedHoursRecommended: 260,
    },
    generatedAt: today.toISOString(),
    source: "deterministic_fallback",
  };
}

// =============================================================================
// Main Entrypoint Function
// =============================================================================

/**
 * Generates an AISyllabusSummary deterministically for any ConcursoExam.
 * Prioritizes high-precision templates for the 8 major national tenders,
 * or gracefully falls back to the dynamic generator.
 */
export function generateDeterministicSyllabus(concurso: ConcursoExam): AISyllabusSummary {
  const slug = (concurso.slug || "").toLowerCase();
  const title = (concurso.title || "").toLowerCase();
  const inst = (concurso.institution || "").toLowerCase();

  // 1. Banco do Brasil
  if (slug.includes("banco-do-brasil") || title.includes("banco do brasil") || inst.includes("banco do brasil")) {
    return getBancoDoBrasilSummary(concurso);
  }

  // 2. Caixa Econômica Federal
  if (slug.includes("caixa") || title.includes("caixa") || inst.includes("caixa")) {
    return getCaixaSummary(concurso);
  }

  // 3. Receita Federal
  if (slug.includes("receita-federal") || title.includes("receita federal") || inst.includes("receita federal")) {
    return getReceitaFederalSummary(concurso);
  }

  // 4. INSS
  if (slug.includes("inss") || title.includes("inss") || inst.includes("seguro social")) {
    return getINSSSummary(concurso);
  }

  // 5. Polícia Federal
  if (slug.includes("policia-federal") || title.includes("polícia federal") || title.includes("policia federal") || inst.includes("polícia federal")) {
    return getPoliciaFederalSummary(concurso);
  }

  // 6. PRF
  if (slug.includes("policia-rodoviaria") || slug.includes("prf") || title.includes("prf") || title.includes("rodoviária federal")) {
    return getPRFSummary(concurso);
  }

  // 7. TJ-SP
  if (slug.includes("tjsp") || slug.includes("tj-sp") || title.includes("tj-sp") || title.includes("tjsp") || title.includes("escrevente")) {
    return getTJSPEScreventeSummary(concurso);
  }

  // 8. TSE Unificado
  if (slug.includes("tse") || title.includes("tse") || title.includes("eleitoral") || inst.includes("tribunal superior eleitoral")) {
    return getTSEUnificadoSummary(concurso);
  }

  // Dynamic generator for any other exam
  return generateDynamicSyllabus(concurso);
}
