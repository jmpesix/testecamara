-- ============================================================
-- Câmara Municipal de São João da Barra
-- Tabela: atendimentos_camara
-- ============================================================

-- 1. Criação da tabela principal
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
  suggested_response  text, -- Campo extra para sugestões da IA

  -- Classificação feita pela IA
  sentiment           text,   -- ex: positivo / negativo / neutro
  urgency             text,   -- ex: baixa / média / alta
  priority            text,   -- ex: baixa / média / alta / urgente
  theme               text,   -- assunto identificado (ex: saúde, infraestrutura...)

  -- Encaminhamento
  vereador_assigned   text,   -- gabinete/vereador ou setor responsável
  status              text default 'aberto', -- ex: aberto / resolvido / pendente

  -- Controle
  data_processamento  timestamptz default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- 2. Habilitar Realtime (CRUCIAL para o painel atualizar sozinho)
-- Primeiro, garante que a publicação existe
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- Adiciona a tabela à publicação de Realtime
alter publication supabase_realtime add table public.atendimentos_camara;

-- 3. Índices para performance
create index if not exists idx_atd_account_conv   on public.atendimentos_camara (account_id, conversation_id);
create index if not exists idx_atd_theme            on public.atendimentos_camara (theme);
create index if not exists idx_atd_sentiment         on public.atendimentos_camara (sentiment);
create index if not exists idx_atd_status            on public.atendimentos_camara (status);
create index if not exists idx_atd_data_processamento on public.atendimentos_camara (data_processamento);

-- 4. Trigger para auto-update do timestamp 'updated_at'
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

-- 5. Segurança (RLS)
alter table public.atendimentos_camara enable row level security;

-- Política: Permite leitura para qualquer um com a chave ANON (ideal para o Portal inicial)
create policy "Permitir leitura publica"
  on public.atendimentos_camara for select
  to anon
  using (true);

-- Política: Permite inserção via Webhook (n8n ou API)
create policy "Permitir inserção anonima"
  on public.atendimentos_camara for insert
  with check (true);

-- Política: Permite atualização para marcar como resolvido
create policy "Permitir update anonimo"
  on public.atendimentos_camara for update
  using (true);
