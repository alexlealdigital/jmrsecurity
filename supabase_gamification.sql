-- =====================================================================
-- JMR Security · Avaliações + Gamificação
-- Cole no Supabase SQL Editor. Seguro para reexecutar.
--
-- NOTA: este script NÃO depende da tabela `profiles`. As chaves
-- estrangeiras apontam para `auth.users`, que existe em todo projeto
-- Supabase. O nome de exibição do colaborador fica em
-- `user_gamification.nome` (gravado pelo próprio app no upsert),
-- então o ranking também não precisa de `profiles`.
-- =====================================================================

-- ---------- QUIZZES ----------
create table if not exists public.quizzes (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,          -- ex: 'lgpd'
  titulo     text not null,
  modulo     text,
  aprovacao  smallint not null default 70,  -- % mínimo para aprovar
  active     boolean not null default true,
  criado_em  timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references public.quizzes(id) on delete cascade,
  position    integer not null default 0,
  titulo      text not null,
  enunciado   jsonb not null default '[]'::jsonb,  -- array de parágrafos
  pergunta    text,
  opcoes      jsonb not null,                      -- array de strings
  correta     smallint not null,                   -- índice da opção correta
  explicacao  text,
  xp          integer not null default 20
);

-- ---------- TENTATIVAS ----------
create table if not exists public.quiz_attempts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  quiz_slug  text not null,
  acertos    integer not null,
  total      integer not null,
  pontuacao  smallint not null,          -- 0..100
  aprovado   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_attempts_user on public.quiz_attempts(user_id);

-- ---------- GAMIFICAÇÃO (1:1 com auth.users) ----------
create table if not exists public.user_gamification (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  nome              text,                       -- nome de exibição (gravado pelo app)
  xp                integer not null default 0,
  streak            integer not null default 0,
  longest_streak    integer not null default 0,
  last_active       date,
  quizzes_completed integer not null default 0,
  updated_at        timestamptz not null default now()
);

-- ---------- CONQUISTAS ----------
create table if not exists public.user_badges (
  user_id    uuid not null references auth.users(id) on delete cascade,
  badge_id   text not null,             -- ex: 'flawless'
  created_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ---------- VIEW DE RANKING ----------
-- Simples: lê direto de user_gamification (sem joins). Respeita o RLS
-- da tabela base (security_invoker).
create or replace view public.ranking_gamificacao
  with (security_invoker = true) as
  select
    user_id,
    coalesce(nome, 'Colaborador') as nome,
    xp,
    streak
  from public.user_gamification;

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.quizzes           enable row level security;
alter table public.quiz_questions    enable row level security;
alter table public.quiz_attempts     enable row level security;
alter table public.user_gamification enable row level security;
alter table public.user_badges       enable row level security;

do $$ begin
  -- Conteúdo das avaliações: leitura para autenticados
  create policy "quizzes_read"   on public.quizzes        for select to authenticated using (active);
  create policy "questions_read" on public.quiz_questions for select to authenticated using (true);

  -- Tentativas: cada um cria/lê as próprias
  create policy "attempts_own" on public.quiz_attempts for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());

  -- Gamificação: cada um gerencia (insert/update) a própria linha
  create policy "gam_write_own" on public.user_gamification for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());

  -- Gamificação: leitura liberada a autenticados (necessário para o ranking).
  -- Quando você tiver a tabela `profiles` com company_id, troque esta
  -- política pela versão comentada no fim do arquivo (ranking por empresa).
  create policy "gam_read_all" on public.user_gamification for select to authenticated
    using (true);

  -- Conquistas: cada um gerencia as próprias
  create policy "badges_own" on public.user_badges for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null;
end $$;

-- =====================================================================
-- SEED — quiz de LGPD (espelha o fallback embutido do frontend)
-- =====================================================================
insert into public.quizzes (slug, titulo, modulo, aprovacao)
values ('lgpd', 'Avaliação Final — LGPD e Segurança da Informação', 'Segurança da Informação e LGPD', 70)
on conflict (slug) do nothing;

with q as (select id from public.quizzes where slug = 'lgpd')
insert into public.quiz_questions (quiz_id, position, titulo, enunciado, pergunta, opcoes, correta, explicacao, xp)
select q.id, v.position, v.titulo, v.enunciado::jsonb, v.pergunta, v.opcoes::jsonb, v.correta, v.explicacao, v.xp
from q, (values
  (1,
   'Lei Geral de Proteção de Dados (LGPD)',
   '["A Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018) estabelece regras sobre coleta, armazenamento, tratamento e compartilhamento de dados pessoais no Brasil.","Uma empresa de segurança coleta dados biométricos de colaboradores para controle de acesso. Houve um vazamento que expôs dados de mais de 500 funcionários, e a empresa demorou 15 dias para notificar a ANPD."]',
   'Qual é a principal infração cometida pela empresa neste caso?',
   '["A coleta de dados biométricos é proibida pela LGPD em qualquer circunstância.","O atraso na notificação à ANPD, pois o prazo é em tempo razoável — referência de até 2 dias úteis após o conhecimento do incidente.","A ausência de consentimento expresso individual de cada colaborador.","A falta de anonimização dos dados antes do armazenamento.","O número insuficiente de afetados, pois a LGPD só exige notificação acima de 1.000 pessoas."]',
   1,
   'A LGPD (art. 48) exige comunicação do incidente à ANPD e aos titulares em prazo razoável (referência de até 2 dias úteis). Um atraso de 15 dias configura infração sujeita a sanções: advertência e multa de até 2% do faturamento, limitada a R$ 50 milhões por infração.',
   25),
  (2,
   'Dados pessoais sensíveis',
   '["A LGPD distingue dados pessoais comuns de dados sensíveis, conferindo proteção reforçada a estes últimos."]',
   'Qual alternativa contém APENAS dados considerados sensíveis pela LGPD?',
   '["Nome completo, e-mail corporativo e cargo.","CPF, endereço e número de telefone.","Dado biométrico, dado de saúde e convicção religiosa.","Matrícula do funcionário e data de admissão.","Login de acesso e histórico de navegação interno."]',
   2,
   'Dados sensíveis (art. 5º, II): origem racial/étnica, convicção religiosa, opinião política, saúde, vida sexual, dado genético e biométrico. Nome, CPF e e-mail são dados comuns.',
   20),
  (3,
   'Princípio do menor privilégio',
   '["Você recebe por e-mail uma planilha marcada como Confidencial com a folha de pagamento de um setor que não é o seu."]',
   'Qual é a conduta mais adequada?',
   '["Encaminhar para toda a equipe por transparência.","Salvar uma cópia no seu drive pessoal.","Avisar o remetente do envio indevido e não repassar o arquivo.","Imprimir e arquivar na sua mesa.","Ignorar — não é problema seu."]',
   2,
   'Pelo princípio do menor privilégio, acesse só o necessário à sua função. O correto é reportar o envio indevido e não propagar o dado.',
   20),
  (4,
   'Reconhecendo phishing',
   '["Um e-mail com o logo do banco avisa: sua conta será bloqueada em 2 horas, clique para validar. O link exibido como banco.com.br aponta para secure-bank-verify.top."]',
   'Qual é o sinal mais determinante de golpe?',
   '["O e-mail tem o logo do banco.","A mensagem está em português.","O destino real do link diverge do texto exibido.","O e-mail chegou fora do horário comercial.","O assunto é curto."]',
   2,
   'O que vale é o destino REAL do link, não o texto exibido. Divergência entre texto e URL, somada à urgência artificial, é a assinatura clássica do phishing.',
   25),
  (5,
   'Resposta a incidente',
   '["Você percebeu que digitou sua senha corporativa em uma página falsa após clicar em um link suspeito."]',
   'Qual deve ser a primeira atitude?',
   '["Não contar a ninguém.","Desligar o computador e esperar.","Trocar a senha imediatamente e comunicar a TI/segurança.","Formatar a máquina por conta própria.","Responder ao e-mail pedindo para desconsiderarem."]',
   2,
   'Velocidade reduz o dano. Trocar a senha comprometida e reportar à segurança permite conter o incidente (revogar sessões, monitorar acessos) antes que escale.',
   20)
) as v(position, titulo, enunciado, pergunta, opcoes, correta, explicacao, xp)
where not exists (select 1 from public.quiz_questions qq where qq.quiz_id = q.id);

-- =====================================================================
-- (OPCIONAL) Ranking por empresa — habilite quando existir `profiles`
-- com a coluna company_id. Substitui a política "gam_read_all".
-- ---------------------------------------------------------------------
-- drop policy if exists "gam_read_all" on public.user_gamification;
-- create policy "gam_read_same_company" on public.user_gamification
--   for select to authenticated using (
--     exists (
--       select 1 from public.profiles me, public.profiles alvo
--       where me.id = auth.uid()
--         and alvo.id = public.user_gamification.user_id
--         and me.company_id = alvo.company_id
--     )
--   );
