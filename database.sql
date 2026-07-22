-- ============================================================
-- Câmara Municipal de São João da Barra
-- Tabelas do Sistema: atendimentos_camara e audit_logs
-- ============================================================

-- 1. Criação da tabela principal (Atendimentos/Conversas)
create table if not exists public.atendimentos_camara (
  id                  bigint generated always as identity primary key,
  -- Identificação da conversa (Chatwoot)
  account_id          integer not null,
  conversation_id     bigint  not null,
  protocol            text,
  
  -- Dados do contato (munícipe)
  contact_id          bigint,
  contact_name        text,
  contact_phone       text,
  contact_email       text,
  
  -- Conteúdo da interação
  message             text not null,
  total_mensagens     integer default 1,
  resumo              text,
  suggested_response  text, 

  -- Metadados e Classificação
  assignee            text,
  labels              jsonb default '[]'::jsonb,
  inbox_id            integer,
  team_id             integer,
  custom_attributes   jsonb default '{}'::jsonb,
  
  -- Classificação
  sentiment           text,
  urgency             text,
  priority            text,
  theme               text,
  vereador_assigned   text,
  status              text default 'open',
  data_processamento  timestamptz,
  
  -- Timestamps
  updated_at          timestamptz default now(),
  created_at          timestamptz not null default now(),

  -- Restrição de unicidade para evitar duplicatas de conversas
  unique(account_id, conversation_id)
);

-- 2. Tabela de etiquetas (Labels)
create table if not exists public.labels (
  id                  bigint generated always as identity primary key,
  account_id          integer not null,
  name                text not null,
  title               text,
  description         text,
  color               text,
  show_on_sidebar     boolean default true,
  created_at          timestamptz not null default now(),
  unique(account_id, name)
);

-- 3. Tabela de mensagens (Histórico completo)
create table if not exists public.mensagens_camara (
  id                  bigint primary key, -- ID real do Chatwoot
  account_id          integer not null,
  conversation_id     bigint not null,
  content             text,
  message_type        integer, -- 0: incoming, 1: outgoing
  private             boolean default false,
  sender_id           bigint,
  sender_type         text,
  sender_name         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz default now()
);

-- 4. Tabela de logs de auditoria
create table if not exists public.audit_logs (
  id                  bigint generated always as identity primary key,
  tipo                text not null, 
  acao                text not null, 
  usuario             text not null, 
  alvo                text not null, 
  detalhes            jsonb,         
  created_at          timestamptz not null default now()
);

-- 5. Habilitar Realtime
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'atendimentos_camara') then
    alter publication supabase_realtime add table public.atendimentos_camara;
  end if;

  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mensagens_camara') then
    alter publication supabase_realtime add table public.mensagens_camara;
  end if;

  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'audit_logs') then
    alter publication supabase_realtime add table public.audit_logs;
  end if;

  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'labels') then
    alter publication supabase_realtime add table public.labels;
  end if;
end $$;

-- 6. Índices para performance
create index if not exists idx_atd_account_conv   on public.atendimentos_camara (account_id, conversation_id);
create index if not exists idx_atd_theme            on public.atendimentos_camara (theme);
create index if not exists idx_atd_sentiment         on public.atendimentos_camara (sentiment);
create index if not exists idx_atd_status            on public.atendimentos_camara (status);
create index if not exists idx_msg_conv_id          on public.mensagens_camara (conversation_id);
create index if not exists idx_msg_created_at       on public.mensagens_camara (created_at);
create index if not exists idx_audit_tipo           on public.audit_logs (tipo);
create index if not exists idx_audit_created_at     on public.audit_logs (created_at);

-- 7. Trigger para auto-update do timestamp 'updated_at' na tabela atendimentos_camara
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_atd_updated_at on public.atendimentos_camara;
create trigger trg_atd_updated_at
before update on public.atendimentos_camara
for each row execute function public.set_updated_at();

drop trigger if exists trg_msg_updated_at on public.mensagens_camara;
create trigger trg_msg_updated_at
before update on public.mensagens_camara
for each row execute function public.set_updated_at();

-- 8. Segurança (RLS - Row Level Security)
alter table public.atendimentos_camara enable row level security;
alter table public.mensagens_camara enable row level security;
alter table public.labels enable row level security;
alter table public.audit_logs enable row level security;

-- Políticas para atendimentos_camara
create policy "Permitir leitura publica"
  on public.atendimentos_camara for select
  to anon
  using (true);

create policy "Permitir inserção anonima"
  on public.atendimentos_camara for insert
  with check (true);

create policy "Permitir update anonimo"
  on public.atendimentos_camara for update
  using (true);

-- Políticas para mensagens_camara
create policy "Permitir leitura publica de mensagens"
  on public.mensagens_camara for select
  to anon
  using (true);

create policy "Permitir inserção anonima de mensagens"
  on public.mensagens_camara for insert
  with check (true);

create policy "Permitir update anonimo de mensagens"
  on public.mensagens_camara for update
  using (true);

-- Políticas para labels
create policy "Permitir leitura publica de labels"
  on public.labels for select
  to anon
  using (true);

create policy "Permitir inserção de labels"
  on public.labels for insert
  with check (true);

-- Políticas para audit_logs
create policy "Permitir leitura publica de logs"
  on public.audit_logs for select
  to anon
  using (true);

create policy "Permitir inserção de logs"
  on public.audit_logs for insert
  with check (true);
