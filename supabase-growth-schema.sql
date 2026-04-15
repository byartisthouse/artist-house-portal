-- ============================================================
-- AUSTERE Growth Engine — Supabase Schema Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ─── profiles ──────────────────────────────────────────────
-- Extends auth.users. Created automatically via trigger below.
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text unique not null,
  full_name   text,
  role        text not null default 'Artist'
                check (role in ('Artist', 'Coach', 'Admin')),
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile; admins can read all
create policy "profiles: own read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: admin read all"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'Admin'
    )
  );

create policy "profiles: own update"
  on public.profiles for update
  using (auth.uid() = id);

-- ─── artist_data ───────────────────────────────────────────
create table if not exists public.artist_data (
  id                  uuid default gen_random_uuid() primary key,
  user_id             uuid references public.profiles(id) on delete cascade not null unique,
  spotify_handle      text,
  instagram_handle    text,
  tiktok_handle       text,
  youtube_handle      text,
  artist_goals        text,
  current_stats       jsonb default '{}',
  updated_at          timestamptz default now()
);

alter table public.artist_data enable row level security;

create policy "artist_data: own read/write"
  on public.artist_data for all
  using (auth.uid() = user_id);

create policy "artist_data: coach/admin read"
  on public.artist_data for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('Coach', 'Admin')
    )
  );

-- ─── stats_history ─────────────────────────────────────────
-- Time-series growth data — one row per platform per sync
create table if not exists public.stats_history (
  id              uuid default gen_random_uuid() primary key,
  artist_id       uuid references public.artist_data(id) on delete cascade not null,
  platform        text not null,               -- 'instagram' | 'tiktok' | 'spotify'
  follower_count  integer,
  listener_count  integer,                      -- spotify monthly listeners
  post_count      integer,
  engagement_rate numeric(5,2),
  top_post_url    text,
  top_post_likes  integer,
  recorded_at     timestamptz default now()
);

alter table public.stats_history enable row level security;

create policy "stats_history: own read"
  on public.stats_history for select
  using (
    exists (
      select 1 from public.artist_data ad
      where ad.id = artist_id and ad.user_id = auth.uid()
    )
  );

create policy "stats_history: coach/admin read"
  on public.stats_history for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('Coach', 'Admin')
    )
  );

create policy "stats_history: service insert"
  on public.stats_history for insert
  with check (true);  -- Apify sync runs with service key

-- Index for fast time-series queries
create index if not exists stats_history_artist_time
  on public.stats_history (artist_id, recorded_at desc);

-- ─── tasks ─────────────────────────────────────────────────
create table if not exists public.tasks (
  id           uuid default gen_random_uuid() primary key,
  artist_id    uuid references public.profiles(id) on delete cascade not null,
  coach_id     uuid references public.profiles(id),
  title        text not null,
  description  text,
  status       text not null default 'Todo'
                 check (status in ('Todo', 'In-Progress', 'Done')),
  due_date     date,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table public.tasks enable row level security;

create policy "tasks: artist read own"
  on public.tasks for select
  using (auth.uid() = artist_id);

create policy "tasks: coach/admin full access"
  on public.tasks for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('Coach', 'Admin')
    )
  );

create policy "tasks: artist update status"
  on public.tasks for update
  using (auth.uid() = artist_id);

create index if not exists tasks_artist_idx on public.tasks (artist_id);

-- ─── notes ─────────────────────────────────────────────────
create table if not exists public.notes (
  id          uuid default gen_random_uuid() primary key,
  artist_id   uuid references public.profiles(id) on delete cascade not null,
  author_id   uuid references public.profiles(id) not null,
  content     text not null,
  created_at  timestamptz default now()
);

alter table public.notes enable row level security;

create policy "notes: artist and author read"
  on public.notes for select
  using (auth.uid() = artist_id or auth.uid() = author_id);

create policy "notes: coach/admin full access"
  on public.notes for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('Coach', 'Admin')
    )
  );

create policy "notes: author insert"
  on public.notes for insert
  with check (auth.uid() = author_id);

create index if not exists notes_artist_idx on public.notes (artist_id);

-- ─── Auto-create profile on signup ─────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
