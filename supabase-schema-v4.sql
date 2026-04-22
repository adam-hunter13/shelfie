-- ============================================================
-- Shelfie — v4 schema: progress, tags, date_finished, profile upgrades
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Books: new columns ────────────────────────────────────────
alter table public.books
  add column if not exists progress_type    text check (progress_type in ('pages', 'percent')),
  add column if not exists current_page     integer,
  add column if not exists total_pages      integer,
  add column if not exists progress_percent integer check (progress_percent between 0 and 100),
  add column if not exists date_finished    date,
  add column if not exists tags             text[] not null default '{}';

-- Index for tag filtering
create index if not exists books_tags_idx on public.books using gin(tags);

-- ── Profiles: new columns ─────────────────────────────────────
alter table public.profiles
  add column if not exists display_name  text,
  add column if not exists avatar_color  text not null default '#7c3626';
