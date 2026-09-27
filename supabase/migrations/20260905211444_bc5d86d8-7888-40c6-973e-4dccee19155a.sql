create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  target_exam text not null default 'Banco do Brasil - Escriturário',
  city text default 'Goiânia',
  weekly_goal_hours numeric not null default 8,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.question_bank (
  id uuid primary key default gen_random_uuid(),
  discipline text not null,
  topic text not null,
  statement text not null,
  options jsonb not null,
  correct_answer text not null,
  explanation text,
  created_at timestamptz not null default now()
);
grant select on public.question_bank to authenticated;
grant all on public.question_bank to service_role;
alter table public.question_bank enable row level security;
create policy "question_bank_select_authenticated" on public.question_bank for select to authenticated using (true);
create index question_bank_discipline_idx on public.question_bank (discipline);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  discipline text not null,
  minutes integer not null check (minutes > 0),
  session_date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.study_sessions to authenticated;
grant all on public.study_sessions to service_role;
alter table public.study_sessions enable row level security;
create policy "study_sessions_all_own" on public.study_sessions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  discipline text,
  attempt_type text not null default 'subject' check (attempt_type in ('subject','completo')),
  score numeric not null,
  total numeric not null,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.quiz_attempts to authenticated;
grant all on public.quiz_attempts to service_role;
alter table public.quiz_attempts enable row level security;
create policy "quiz_attempts_all_own" on public.quiz_attempts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.question_bank (discipline, topic, statement, options, correct_answer, explanation) values
('Português','Concordância verbal','Assinale a alternativa em que a concordância verbal está correta.','{"A":"Fazem dois anos que trabalho no banco.","B":"Faz dois anos que trabalho no banco.","C":"Fazem tempo que não o vejo.","D":"Houveram muitos clientes na agência.","E":"Existe muitos problemas no sistema."}'::jsonb,'B','O verbo fazer indicando tempo decorrido é impessoal: fica sempre na 3ª pessoa do singular.'),
('Português','Crase','Em qual frase o uso da crase está correto?','{"A":"Refiro-me à pessoas educadas.","B":"Vou à Brasília.","C":"Entreguei o documento à gerente.","D":"Ele começou à falar.","E":"Estou à procura à emprego."}'::jsonb,'C','A crase é a fusão da preposição a com o artigo a antes de substantivo feminino determinado: à gerente.'),
('Português','Ortografia','Assinale a opção em que todas as palavras estão grafadas corretamente.','{"A":"Excessão, previlégio, beneficiente","B":"Exceção, privilégio, beneficente","C":"Exceção, previlégio, beneficente","D":"Excessão, privilégio, beneficiente","E":"Eceção, privilégio, beneficente"}'::jsonb,'B','As formas corretas são exceção, privilégio e beneficente.'),
('Português','Funções da linguagem','A função da linguagem centrada no receptor, buscando convencê-lo, é a:','{"A":"Emotiva","B":"Fática","C":"Conativa","D":"Metalinguística","E":"Poética"}'::jsonb,'C','A função conativa (ou apelativa) é voltada ao interlocutor, típica da publicidade.'),
('Português','Regência','Assinale a frase com regência verbal correta.','{"A":"Assisti o filme ontem.","B":"Prefiro cinema do que teatro.","C":"Obedeço aos regulamentos do banco.","D":"Cheguei na agência cedo.","E":"Namoro com ela há dois anos."}'::jsonb,'C','O verbo obedecer é transitivo indireto e exige a preposição a.'),
('Matemática Financeira','Juros simples','Um capital de R$ 2.000 aplicado a juros simples de 2% ao mês por 5 meses rende juros de:','{"A":"R$ 100","B":"R$ 200","C":"R$ 250","D":"R$ 300","E":"R$ 400"}'::jsonb,'B','J = C x i x n = 2000 x 0,02 x 5 = R$ 200.'),
('Matemática Financeira','Juros compostos','R$ 1.000 aplicados a juros compostos de 10% ao mês por 2 meses resultam em montante de:','{"A":"R$ 1.200,00","B":"R$ 1.180,00","C":"R$ 1.210,00","D":"R$ 1.100,00","E":"R$ 1.220,00"}'::jsonb,'C','M = 1000 x (1,1)^2 = 1000 x 1,21 = R$ 1.210,00.'),
('Matemática Financeira','Desconto','No desconto racional simples, a base de cálculo é:','{"A":"O valor nominal do título","B":"O valor atual do título","C":"A média entre nominal e atual","D":"O valor do IOF","E":"O valor futuro capitalizado"}'::jsonb,'B','No desconto racional (por dentro), os juros incidem sobre o valor atual (líquido).'),
('Matemática Financeira','Porcentagem','Um produto de R$ 500 recebe desconto de 20% e depois acréscimo de 20%. O preço final é:','{"A":"R$ 500","B":"R$ 480","C":"R$ 520","D":"R$ 460","E":"R$ 490"}'::jsonb,'B','500 x 0,8 = 400; 400 x 1,2 = 480. Descontos e acréscimos sucessivos não se anulam.'),
('Matemática Financeira','Taxas equivalentes','A taxa anual equivalente a 1% ao mês, em juros compostos, é aproximadamente:','{"A":"12,00%","B":"12,68%","C":"13,50%","D":"10,00%","E":"11,20%"}'::jsonb,'B','(1,01)^12 - 1 = 0,1268, ou seja, 12,68% ao ano.'),
('Raciocínio Lógico','Quantificadores','A negação de Todos os clientes são pontuais é:','{"A":"Nenhum cliente é pontual","B":"Todos os clientes são impontuais","C":"Pelo menos um cliente não é pontual","D":"Alguns clientes são pontuais","E":"Nenhum cliente é impontual"}'::jsonb,'C','A negação do quantificador universal é o existencial negado: existe ao menos um que não é.'),
('Raciocínio Lógico','Condicional','A proposição equivalente a Se chove, então a rua molha é:','{"A":"Se a rua molha, então chove","B":"Se não chove, a rua não molha","C":"Se a rua não molha, então não chove","D":"Chove e a rua não molha","E":"Não chove ou a rua não molha"}'::jsonb,'C','A contrapositiva (~q entao ~p) é logicamente equivalente à condicional.'),
('Raciocínio Lógico','Conjuntos','Em um grupo de 100 pessoas, 60 têm conta corrente, 50 têm poupança e 20 têm ambas. Quantas não têm nenhuma?','{"A":"10","B":"20","C":"30","D":"40","E":"0"}'::jsonb,'A','União = 60 + 50 - 20 = 90. Logo 100 - 90 = 10 pessoas.'),
('Raciocínio Lógico','Análise combinatória','Quantos anagramas tem a palavra BANCO?','{"A":"24","B":"60","C":"120","D":"720","E":"25"}'::jsonb,'C','São 5 letras distintas: 5! = 120.'),
('Conhecimentos Bancários','Sistema Financeiro Nacional','O órgão máximo normativo do Sistema Financeiro Nacional é:','{"A":"Banco Central do Brasil","B":"Conselho Monetário Nacional","C":"CVM","D":"Banco do Brasil","E":"Susep"}'::jsonb,'B','O CMN é o órgão normativo máximo; o Banco Central é o principal executor das políticas.'),
('Conhecimentos Bancários','Política monetária','São instrumentos clássicos de política monetária, EXCETO:','{"A":"Depósito compulsório","B":"Operações de mercado aberto","C":"Redesconto","D":"Política cambial de bandas","E":"Selic meta"}'::jsonb,'D','A política cambial não é instrumento clássico de política monetária.'),
('Conhecimentos Bancários','Produtos bancários','O CDB é um título:','{"A":"De emissão do Tesouro Nacional","B":"De renda variável","C":"De renda fixa emitido por bancos, com cobertura do FGC","D":"Sempre isento de IR","E":"Emitido por empresas não financeiras"}'::jsonb,'C','O CDB é título de renda fixa emitido por instituições financeiras e coberto pelo FGC até o limite vigente.'),
('Conhecimentos Bancários','FGC','O Fundo Garantidor de Créditos garante, por CPF e por conglomerado, o valor de até:','{"A":"R$ 50 mil","B":"R$ 100 mil","C":"R$ 250 mil","D":"R$ 500 mil","E":"R$ 1 milhão"}'::jsonb,'C','O FGC garante até R$ 250 mil por CPF e conglomerado, com teto global de R$ 1 milhão a cada 4 anos.'),
('Conhecimentos Bancários','Meios de pagamento','Sobre o Pix, é correto afirmar:','{"A":"Funciona apenas em dias úteis","B":"É operado pela CVM","C":"Permite transferências instantâneas 24 horas por dia, todos os dias","D":"Substituiu o cheque por lei","E":"Só pode ser usado entre pessoas físicas"}'::jsonb,'C','O Pix é o arranjo de pagamentos instantâneos do Banco Central, disponível 24x7.'),
('Conhecimentos Bancários','Crédito','No crédito rotativo do cartão de crédito:','{"A":"Não há incidência de juros","B":"O cliente paga o valor total obrigatoriamente","C":"O saldo não pago é financiado com juros e deve ser migrado para parcelado após um período de fatura","D":"O limite é sempre igual à renda","E":"É vedado a pessoas jurídicas"}'::jsonb,'C','Desde 2017 o rotativo é limitado a um período de fatura, devendo ser migrado para parcelamento.'),
('Conhecimentos Bancários','Compliance','A prevenção à lavagem de dinheiro no Brasil é regida principalmente pela:','{"A":"Lei 8.078/90","B":"Lei 9.613/98","C":"Lei 6.404/76","D":"Lei 13.709/18","E":"Lei 4.595/64"}'::jsonb,'B','A Lei 9.613/1998, alterada pela Lei 12.683/2012, trata dos crimes de lavagem de dinheiro.'),
('Atualidades do Mercado Financeiro','Open Finance','O Open Finance tem como principal objetivo:','{"A":"Eliminar os bancos tradicionais","B":"Permitir o compartilhamento de dados e serviços financeiros com consentimento do cliente","C":"Substituir o Pix","D":"Fixar as taxas de juros","E":"Regular apenas fintechs"}'::jsonb,'B','O Open Finance dá ao cliente o controle sobre seus dados, permitindo compartilhá-los mediante autorização.'),
('Atualidades do Mercado Financeiro','Moeda digital','O Drex é:','{"A":"Uma criptomoeda privada","B":"O real digital, moeda digital de banco central em desenvolvimento pelo Banco Central","C":"Um índice da B3","D":"Um tipo de CDB","E":"Um sistema de compensação de cheques"}'::jsonb,'B','Drex é a marca da moeda digital de banco central brasileira.'),
('Atualidades do Mercado Financeiro','ESG','No contexto ESG, a letra G representa:','{"A":"Gestão de riscos de crédito","B":"Governança corporativa","C":"Garantia real","D":"Globalização","E":"Ganho de capital"}'::jsonb,'B','ESG significa Environmental, Social e Governance (governança).'),
('Atualidades do Mercado Financeiro','Política econômica','Um aumento da taxa Selic tende a:','{"A":"Estimular o consumo e reduzir a poupança","B":"Reduzir a demanda agregada e conter a inflação","C":"Desvalorizar imediatamente a moeda","D":"Baratear o crédito imobiliário","E":"Elevar a inflação no curto prazo"}'::jsonb,'B','Juros mais altos encarecem o crédito, esfriam a demanda e ajudam a conter a inflação.'),
('Tecnologia da Informação','Segurança da informação','Phishing é caracterizado por:','{"A":"Infectar o computador com vírus de boot","B":"Tentativa de obter dados sensíveis enganando o usuário, geralmente por mensagens falsas","C":"Sobrecarregar um servidor com requisições","D":"Criptografar arquivos e exigir resgate","E":"Interceptar tráfego de rede sem fio"}'::jsonb,'B','Phishing é engenharia social para obter credenciais e dados pessoais.'),
('Tecnologia da Informação','LGPD','Segundo a LGPD, é considerado dado pessoal sensível:','{"A":"Nome completo","B":"Endereço residencial","C":"Convicção religiosa e dado biométrico","D":"Número de telefone","E":"E-mail corporativo"}'::jsonb,'C','A LGPD lista como sensíveis dados sobre origem racial, convicção religiosa, saúde e biometria, entre outros.'),
('Tecnologia da Informação','Planilhas','No Excel, a função PROCV serve para:','{"A":"Somar valores de uma coluna","B":"Buscar um valor na primeira coluna de um intervalo e retornar valor de outra coluna","C":"Contar células não vazias","D":"Ordenar dados","E":"Criar gráficos dinâmicos"}'::jsonb,'B','O PROCV faz busca vertical na primeira coluna do intervalo informado.'),
('Inglês','Vocabulário bancário','In banking, the word loan means:','{"A":"Depósito","B":"Empréstimo","C":"Investimento","D":"Taxa","E":"Saldo"}'::jsonb,'B','Loan significa empréstimo.'),
('Inglês','Gramática','Choose the correct sentence:','{"A":"The bank have opened a new branch.","B":"The bank has opened a new branch.","C":"The bank opening a new branch.","D":"The bank have open a new branch.","E":"The bank has open a new branch."}'::jsonb,'B','Bank é tratado como singular: has opened, no present perfect.'),
('Vendas e Negociação','Técnicas de venda','Na etapa de sondagem da venda, o profissional deve:','{"A":"Apresentar imediatamente o produto mais caro","B":"Identificar necessidades do cliente por meio de perguntas","C":"Fechar o negócio","D":"Oferecer desconto","E":"Encerrar o atendimento"}'::jsonb,'B','A sondagem investiga necessidades antes da apresentação da solução.'),
('Vendas e Negociação','Marketing de relacionamento','O marketing de relacionamento no banco visa principalmente:','{"A":"Vender uma única vez com margem alta","B":"Fidelizar o cliente e aumentar seu valor ao longo do tempo","C":"Reduzir o número de clientes","D":"Substituir o atendimento humano","E":"Padronizar preços"}'::jsonb,'B','O foco é retenção, fidelização e aumento do valor do cliente ao longo do relacionamento.'),
('Vendas e Negociação','Código de Defesa do Consumidor','Segundo o Código de Defesa do Consumidor, a venda casada é:','{"A":"Permitida se houver desconto","B":"Prática abusiva e vedada","C":"Permitida para pessoa jurídica","D":"Obrigatória em seguros","E":"Regulada pela CVM"}'::jsonb,'B','O CDC veda condicionar o fornecimento de um produto ou serviço à aquisição de outro.');