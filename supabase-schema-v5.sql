-- ============================================================
-- Shelfie — v5 schema: push notification subscriptions
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "Users manage own subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Notifications log (optional — tracks what was sent)
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text not null,
  url        text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);

-- ── Books: add cover_url column ───────────────────────────────
alter table public.books
  add column if not exists cover_url text;
