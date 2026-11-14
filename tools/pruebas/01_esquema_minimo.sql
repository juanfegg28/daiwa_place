create extension if not exists pgcrypto;
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
end $$;
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create table if not exists public.profiles (id uuid primary key default gen_random_uuid(), username text unique, id_student text, is_frozen boolean default false);
create table if not exists public.posts (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, content text, created_at timestamptz default now(), club_id uuid, is_announcement boolean default false);
create table if not exists public.likes (post_id uuid references public.posts(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, created_at timestamptz default now(), primary key (post_id, user_id));
create table if not exists public.comments (id uuid primary key default gen_random_uuid(), post_id uuid references public.posts(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, content text, parent_comment_id uuid references public.comments(id) on delete cascade, created_at timestamptz default now());
create table if not exists public.comment_likes (comment_id uuid references public.comments(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, primary key (comment_id, user_id));
create table if not exists public.reposts (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, post_id uuid references public.posts(id) on delete cascade, created_at timestamptz default now(), constraint reposts_one_per_user unique (user_id, post_id));
alter table public.posts enable row level security;
create policy posts_read on public.posts for select to authenticated using (true);
grant usage on schema public, auth to anon, authenticated, service_role;
grant select on public.posts, public.profiles to authenticated;
alter table public.profiles add column if not exists avatar_url text;
