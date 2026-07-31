-- Execute este script no SQL Editor do seu projeto Supabase.

create table if not exists public.fichas (
  id uuid primary key,
  user_id uuid references auth.users (id) on delete cascade,
  nome text not null default 'Personagem',
  nivel int not null default 1,
  classe text,
  dados jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists fichas_user_id_idx on public.fichas (user_id);
create index if not exists fichas_updated_at_idx on public.fichas (updated_at desc);

alter table public.fichas enable row level security;

-- Modo autenticado: cada usuário só enxerga as próprias fichas.
drop policy if exists "fichas do proprio usuario" on public.fichas;
create policy "fichas do proprio usuario" on public.fichas
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Modo anônimo (mesa compartilhada, sem login): descomente as políticas abaixo
-- e comente a política acima. Atenção: qualquer pessoa com a chave anon poderá ler/escrever.
-- drop policy if exists "acesso anonimo" on public.fichas;
-- create policy "acesso anonimo" on public.fichas for all using (true) with check (true);
