-- ============================================================
-- Shelfie — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "pgcrypto";

-- ── Books table ──────────────────────────────────────────────
create table if not exists public.books (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  author       text not null,
  review       text not null default '',
  rating       smallint not null default 0 check (rating between 0 and 5),
  recommended  boolean not null default false,
  status       text not null default 'read'
               check (status in ('read', 'reading', 'want-to-read')),
  cover_color  text not null default '#7c3626',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Row Level Security ────────────────────────────────────────
alter table public.books enable row level security;

-- Users can only see their own books
create policy "Users can view own books"
  on public.books for select
  using (auth.uid() = user_id);

-- Users can only insert their own books
create policy "Users can insert own books"
  on public.books for insert
  with check (auth.uid() = user_id);

-- Users can only update their own books
create policy "Users can update own books"
  on public.books for update
  using (auth.uid() = user_id);

-- Users can only delete their own books
create policy "Users can delete own books"
  on public.books for delete
  using (auth.uid() = user_id);

-- ── Auto-update updated_at ────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger books_updated_at
  before update on public.books
  for each row execute procedure public.handle_updated_at();

-- ── Index for fast per-user queries ──────────────────────────
create index if not exists books_user_id_idx on public.books(user_id);
