-- Esquema do banco (aplicado no Supabase). Leitura pública, escrita só com service role.
create table public.boletins (
  id bigint generated always as identity primary key,
  data date not null unique,
  titulo_destaque text not null,
  conteudo_md text not null,
  fontes jsonb not null default '[]'::jsonb,
  criado_em timestamptz not null default now()
);

create table public.glossario (
  id bigint generated always as identity primary key,
  termo text not null unique,
  definicao text not null,
  exemplo text,
  boletim_id bigint references public.boletins(id) on delete set null
);
create index glossario_boletim_id_idx on public.glossario(boletim_id);
create index boletins_busca_idx on public.boletins
  using gin (to_tsvector('portuguese', titulo_destaque || ' ' || conteudo_md));

alter table public.boletins enable row level security;
alter table public.glossario enable row level security;
create policy "leitura publica boletins" on public.boletins for select to anon, authenticated using (true);
create policy "leitura publica glossario" on public.glossario for select to anon, authenticated using (true);
revoke insert, update, delete on public.boletins, public.glossario from anon, authenticated;
