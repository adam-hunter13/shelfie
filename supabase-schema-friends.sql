-- ============================================================
-- Shelfie — Friends & Reactions schema (run AFTER supabase-schema.sql)
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Profiles table (mirrors auth.users for public access) ────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Anyone can read profiles (needed for friend search)
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Friendships table ─────────────────────────────────────────
create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending'
               check (status in ('pending', 'accepted', 'declined')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

alter table public.friendships enable row level security;

-- Users can see friendships they are part of
create policy "Users can view own friendships"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Users can send friend requests
create policy "Users can send friend requests"
  on public.friendships for insert
  with check (auth.uid() = requester_id);

-- Only the addressee can accept/decline; requester can cancel (delete)
create policy "Users can update friendships they received"
  on public.friendships for update
  using (auth.uid() = addressee_id);

create policy "Users can delete own friendships"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create trigger friendships_updated_at
  before update on public.friendships
  for each row execute procedure public.handle_updated_at();

create index if not exists friendships_requester_idx on public.friendships(requester_id);
create index if not exists friendships_addressee_idx on public.friendships(addressee_id);

-- ── Update books RLS to allow friends to read ─────────────────
-- Drop old select policy
drop policy if exists "Users can view own books" on public.books;

-- New policy: own books OR books of accepted friends
create policy "Users can view own and friends books"
  on public.books for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
      and (
        (f.requester_id = auth.uid() and f.addressee_id = books.user_id)
        or
        (f.addressee_id = auth.uid() and f.requester_id = books.user_id)
      )
    )
  );

-- ── Reactions table ───────────────────────────────────────────
create table if not exists public.reactions (
  id         uuid primary key default gen_random_uuid(),
  book_id    uuid not null references public.books(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  emoji      text not null check (emoji in ('👍', '❤️', '🤩')),
  created_at timestamptz not null default now(),
  unique (book_id, user_id, emoji)
);

alter table public.reactions enable row level security;

-- Anyone who can see the book can see its reactions
create policy "Users can view reactions on visible books"
  on public.reactions for select
  using (
    exists (
      select 1 from public.books b
      where b.id = reactions.book_id
      and (
        b.user_id = auth.uid()
        or exists (
          select 1 from public.friendships f
          where f.status = 'accepted'
          and (
            (f.requester_id = auth.uid() and f.addressee_id = b.user_id)
            or
            (f.addressee_id = auth.uid() and f.requester_id = b.user_id)
          )
        )
      )
    )
  );

-- Authenticated users can add reactions
create policy "Users can add reactions"
  on public.reactions for insert
  with check (auth.uid() = user_id);

-- Users can remove their own reactions
create policy "Users can delete own reactions"
  on public.reactions for delete
  using (auth.uid() = user_id);

create index if not exists reactions_book_id_idx on public.reactions(book_id);
create index if not exists reactions_user_id_idx on public.reactions(user_id);

-- ── Backfill profiles for existing users ─────────────────────
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;
