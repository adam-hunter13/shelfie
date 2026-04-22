-- ============================================================
-- Shelfie — v6 schema: reading goals
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

create table if not exists public.reading_goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  year         integer not null,
  books_target integer,
  pages_target integer,
  genres_target integer,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, year)
);

alter table public.reading_goals enable row level security;

create policy "Users manage own goals"
  on public.reading_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger reading_goals_updated_at
  before update on public.reading_goals
  for each row execute procedure public.handle_updated_at();
