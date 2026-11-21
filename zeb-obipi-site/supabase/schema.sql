-- Run this whole file once in Supabase: Dashboard > SQL Editor > New query > Run.
-- Then make the Vice-Chancellor an administrator (see the last section).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- profiles / roles
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
drop policy if exists "profile read own or admin" on public.profiles;
create policy "profile read own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
-- No update/insert policy for normal users, so nobody can promote themselves to admin from the browser.

-- ---------------------------------------------------------------- site content
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  collection text not null,   -- timeline | courses | publications | awards | conferences | session_types
  sort int not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists content_items_collection_idx on public.content_items (collection, sort);

alter table public.site_settings enable row level security;
alter table public.content_items enable row level security;
drop policy if exists "settings public read" on public.site_settings;
drop policy if exists "settings admin write" on public.site_settings;
create policy "settings public read" on public.site_settings for select using (true);
create policy "settings admin write" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "items public read" on public.content_items;
drop policy if exists "items admin write" on public.content_items;
create policy "items public read" on public.content_items for select using (true);
create policy "items admin write" on public.content_items for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- blog
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text default '',
  cover_url text default '',
  content text default '',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.posts enable row level security;
drop policy if exists "posts public read published" on public.posts;
drop policy if exists "posts admin all" on public.posts;
create policy "posts public read published" on public.posts for select using (published = true or public.is_admin());
create policy "posts admin all" on public.posts for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  email text not null,
  phone text default '',
  organisation text default '',
  session_type text not null,
  session_label text not null,
  mode text default 'in_person',
  duration int not null default 30,
  date date not null,
  time text not null,          -- 'HH:MM' in Africa/Lagos time
  topic text default '',
  message text not null,
  attendees int not null default 1,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'cancelled')),
  admin_note text default '',
  meeting_detail text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Two live requests can never start at exactly the same minute.
create unique index if not exists bookings_one_live_slot on public.bookings (date, time) where status in ('pending', 'approved');

alter table public.bookings enable row level security;
drop policy if exists "bookings insert own" on public.bookings;
drop policy if exists "bookings read own or admin" on public.bookings;
drop policy if exists "bookings admin update" on public.bookings;
drop policy if exists "bookings user cancel" on public.bookings;
create policy "bookings insert own" on public.bookings for insert with check (user_id = auth.uid() and status = 'pending');
create policy "bookings read own or admin" on public.bookings for select using (user_id = auth.uid() or public.is_admin());
create policy "bookings admin update" on public.bookings for update using (public.is_admin()) with check (public.is_admin());
create policy "bookings user cancel" on public.bookings for update using (user_id = auth.uid() and status = 'pending') with check (user_id = auth.uid() and status = 'cancelled');

-- Lets the booking page grey out taken times without exposing anyone's details.
create or replace function public.booked_slots(d date)
returns table (slot_time text, duration int)
language sql stable security definer set search_path = public as $$
  select time, duration from public.bookings where date = d and status in ('pending', 'approved');
$$;
grant execute on function public.booked_slots(date) to anon, authenticated;

-- ---------------------------------------------------------------- analytics
create table if not exists public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  type text not null,          -- pageview | section_view | click | post_view
  path text,
  label text,
  visitor_id text,
  session_id text,
  device text,
  referrer text,
  meta jsonb
);
create index if not exists events_created_idx on public.events (created_at desc);
alter table public.events enable row level security;
drop policy if exists "events anyone insert" on public.events;
drop policy if exists "events admin read" on public.events;
create policy "events anyone insert" on public.events for insert with check (true);
create policy "events admin read" on public.events for select using (public.is_admin());

-- ---------------------------------------------------------------- image storage
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
drop policy if exists "media public read" on storage.objects;
drop policy if exists "media admin write" on storage.objects;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
create policy "media admin write" on storage.objects for all using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());

-- ---------------------------------------------------------------- make the Vice-Chancellor an admin
-- 1) Sign up on the website with his email address (Create account).
-- 2) Then run this, replacing the address:
--
--   update public.profiles set role = 'admin' where email = 'his-email@example.com';
--
-- After he signs in, the shield icon appears in the navigation bar.
