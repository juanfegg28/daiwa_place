-- =====================================================================
-- DaiwaPlace v1.1.10 — Parche de calidad de vida
--   (ocultar usuarios, filtro del feed, identidades, compartidos y tarjetas para Discord)
-- Pégalo completo en Supabase → SQL Editor → New query → Run.
-- Es seguro correrlo más de una vez (no duplica nada).
-- Requiere haber corrido antes los SQL anteriores (ya los tienes), en especial el de la
-- v0.12.0 (de ahí sale is_blocked_between) y el de la v1.1.0 (clubes).
--
-- Qué hace:
--   1) Ocultar publicaciones de un usuario (tabla muted_users).
--   2) Preferencia del feed principal: Todos / Siguiendo / Amigos (mutuals) en el perfil.
--   3) Identidad (+ un campo especial según la identidad) en el perfil.
--   4) Compartidos (reposts): tabla, reglas, notificación y la función que mezcla
--      publicaciones y compartidos en el feed (feed_items).
--   5) Funciones og_post / og_profile / og_club: lo único que lee el servidor para armar
--      la tarjeta de enlace de Discord, y SOLO devuelven datos de cuentas públicas.
-- =====================================================================


-- =====================================================================
-- 1) OCULTAR PUBLICACIONES DE UN USUARIO
-- =====================================================================
create table if not exists public.muted_users (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  muted_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (user_id, muted_user_id),
  constraint muted_users_not_self check (user_id <> muted_user_id)
);
create index if not exists muted_users_muted_idx on public.muted_users (muted_user_id);

alter table public.muted_users enable row level security;
revoke all on public.muted_users from anon, authenticated;
grant select, insert, delete on public.muted_users to authenticated;

-- Cada quien ve y maneja SOLO su propia lista
drop policy if exists "muted_users_select" on public.muted_users;
create policy "muted_users_select" on public.muted_users
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "muted_users_insert" on public.muted_users;
create policy "muted_users_insert" on public.muted_users
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "muted_users_delete" on public.muted_users;
create policy "muted_users_delete" on public.muted_users
  for delete to authenticated using (user_id = auth.uid());


-- =====================================================================
-- 2) PREFERENCIA DEL FEED  +  3) IDENTIDAD
-- =====================================================================
alter table public.profiles add column if not exists feed_pref text not null default 'all';
alter table public.profiles drop constraint if exists profiles_feed_pref_check;
alter table public.profiles add constraint profiles_feed_pref_check check (feed_pref in ('all', 'following', 'mutuals'));

alter table public.profiles add column if not exists identity text;
alter table public.profiles add column if not exists identity_detail text;

alter table public.profiles drop constraint if exists profiles_identity_check;
alter table public.profiles add constraint profiles_identity_check check (identity is null or identity in (
  'Hombre', 'Mujer', 'No binario', 'Género fluido', 'Agénero', 'Andrógino', 'Ángel', 'Demonio', 'Bruja',
  'Hombre lobo', 'Hada', 'Ángel caído', 'Entidad', 'Alien', 'Doll', 'Estrella', 'Diva', 'NPC', 'Supernova',
  'Batman', 'Fantasma', 'Vampiro/a'
));
alter table public.profiles drop constraint if exists profiles_identity_detail_check;
alter table public.profiles add constraint profiles_identity_detail_check
  check (identity_detail is null or char_length(identity_detail) <= 80);

-- ¿Qué identidades tienen un campo especial?
create or replace function public.identity_has_detail(p_identity text)
returns boolean
language sql immutable set search_path = public as $$
  select p_identity in (
    'Vampiro/a', 'Batman', 'Ángel caído', 'Alien', 'Doll', 'Estrella', 'Entidad',
    'Hombre lobo', 'Fantasma', 'Diva', 'NPC', 'Supernova'
  );
$$;

-- Si la identidad no tiene campo especial (o se quitó), el campo se limpia solo
create or replace function public.trg_profile_identity()
returns trigger language plpgsql set search_path = public as $$
begin
  new.identity_detail := nullif(btrim(coalesce(new.identity_detail, '')), '');
  if new.identity is null or not public.identity_has_detail(new.identity) then
    new.identity_detail := null;
  end if;
  return new;
end;
$$;
drop trigger if exists profile_identity on public.profiles;
create trigger profile_identity before insert or update of identity, identity_detail on public.profiles
  for each row execute function public.trg_profile_identity();

grant select (feed_pref, identity, identity_detail) on public.profiles to authenticated;
grant update (feed_pref, identity, identity_detail) on public.profiles to authenticated;
grant insert (identity, identity_detail) on public.profiles to authenticated;


-- =====================================================================
-- 4) COMPARTIDOS (REPOSTS)
-- =====================================================================
create table if not exists public.reposts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  -- Si se borra la publicación original, se borran sus compartidos (cascada)
  post_id    uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint reposts_one_per_user unique (user_id, post_id)
);
create index if not exists reposts_post_idx on public.reposts (post_id);
create index if not exists reposts_user_idx on public.reposts (user_id, created_at desc);

alter table public.reposts enable row level security;
revoke all on public.reposts from anon, authenticated;
-- Se pueden LEER (contador y "¿ya lo compartí?"); crear y quitar solo se hace con repost_toggle()
grant select on public.reposts to anon, authenticated;
drop policy if exists "reposts_select" on public.reposts;
create policy "reposts_select" on public.reposts for select to anon, authenticated using (true);

-- Aviso nuevo: «@usuario compartió tu publicación»
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'like_post','like_comment','comment','reply','follow','like_note','whisper_comment','whisper_reply',
    'mention_post','mention_comment','whisper_mention','whisper_comment_mention',
    'club_approved','club_declined','club_join_request','club_join_accepted',
    'repost'
  ));
create unique index if not exists notifications_uniq_repost
  on public.notifications (actor_id, post_id) where type = 'repost';

create or replace function public.trg_notify_repost()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
begin
  begin
    select user_id into v_owner from public.posts where id = new.post_id;
    -- 'reposts' es el interruptor de Configuración → Notificaciones
    if public.notif_should_send(v_owner, new.user_id, 'reposts') then
      insert into public.notifications (recipient_id, actor_id, type, post_id)
      values (v_owner, new.user_id, 'repost', new.post_id)
      on conflict do nothing;
    end if;
  exception when others then
    null;
  end;
  return new;
end;
$$;
create or replace function public.trg_cleanup_repost()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications where type = 'repost' and actor_id = old.user_id and post_id = old.post_id;
  return old;
end;
$$;
drop trigger if exists notify_repost on public.reposts;
create trigger notify_repost after insert on public.reposts
  for each row execute function public.trg_notify_repost();
drop trigger if exists cleanup_repost on public.reposts;
create trigger cleanup_repost after delete on public.reposts
  for each row execute function public.trg_cleanup_repost();

-- ¿Puede esta persona ver las publicaciones de esa cuenta? (pública, o la sigue, o es ella misma; sin bloqueos)
create or replace function public.author_visible_to(p_author uuid, p_viewer uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles a where a.id = p_author)
     and (p_viewer is null or p_viewer = p_author or not public.is_blocked_between(p_viewer, p_author))
     and (
       p_viewer = p_author
       or exists (select 1 from public.profiles a where a.id = p_author and coalesce(a.posts_visibility, 'public') = 'public')
       or (p_viewer is not null and exists (
            select 1 from public.follows f where f.follower_id = p_viewer and f.following_id = p_author))
     );
$$;

-- Compartir / dejar de compartir (un toque comparte, otro toque quita). Devuelve true si QUEDÓ compartida.
create or replace function public.repost_toggle(p_post uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  me       uuid := auth.uid();
  v_author uuid;
  v_vis    text;
  v_frozen boolean;
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;

  select p.user_id into v_author from public.posts p where p.id = p_post;
  if not found then raise exception 'Esa publicación ya no existe'; end if;

  -- Si ya la compartí, el segundo toque la quita (siempre se puede deshacer)
  if exists (select 1 from public.reposts where user_id = me and post_id = p_post) then
    delete from public.reposts where user_id = me and post_id = p_post;
    return false;
  end if;

  if v_author = me then raise exception 'No puedes compartir tu propia publicación'; end if;
  if public.is_blocked_between(me, v_author) then raise exception 'No puedes compartir publicaciones de esta cuenta'; end if;
  if exists (select 1 from public.profiles where id = me and is_frozen) then raise exception 'Tu cuenta está congelada'; end if;

  select coalesce(a.posts_visibility, 'public'), coalesce(a.is_frozen, false)
    into v_vis, v_frozen from public.profiles a where a.id = v_author;
  if v_vis <> 'public' then raise exception 'Esta cuenta es privada: sus publicaciones no se pueden compartir'; end if;
  if v_frozen then raise exception 'Esta cuenta está congelada'; end if;

  insert into public.reposts (user_id, post_id) values (me, p_post);
  return true;
end;
$$;

-- Feed que MEZCLA publicaciones y compartidos, del más nuevo al más viejo.
--   p_scope = 'home'    → el Inicio: respeta a quién tienes oculto, tus bloqueos y tu preferencia
--                          del feed (Todos / Siguiendo / Amigos).
--   p_scope = 'profile' → el perfil de p_user: sus publicaciones y lo que compartió
--                          (aquí NO se aplica "ocultar": si entras a su perfil, lo ves todo).
-- Devuelve ids; la página trae el contenido completo de cada publicación aparte.
create or replace function public.feed_items(p_scope text default 'home', p_user uuid default null, p_limit int default 16)
returns table (kind text, post_id uuid, reposter_id uuid, sort_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare
  me      uuid := auth.uid();
  v_pref  text := 'all';
  v_limit int := greatest(1, least(coalesce(p_limit, 16), 100));
begin
  if me is not null then
    select coalesce(pr.feed_pref, 'all') into v_pref from public.profiles pr where pr.id = me;
  end if;

  if p_scope = 'profile' then
    return query
      select x.kind, x.post_id, x.reposter_id, x.sort_at
      from (
        select 'post'::text as kind, p.id as post_id, null::uuid as reposter_id, p.created_at as sort_at
        from public.posts p
        where p.user_id = p_user
        union all
        select 'repost'::text, r.post_id, r.user_id, r.created_at
        from public.reposts r
        join public.posts p on p.id = r.post_id
        where r.user_id = p_user
          and public.author_visible_to(p.user_id, me)
      ) x
      order by x.sort_at desc
      limit v_limit;
    return;
  end if;

  return query
    select x.kind, x.post_id, x.reposter_id, x.sort_at
    from (
      -- publicaciones originales
      select 'post'::text as kind, p.id as post_id, null::uuid as reposter_id, p.created_at as sort_at,
             p.user_id as author_id, p.user_id as actor_id
      from public.posts p
      union all
      -- compartidos: "actor" es quien compartió
      select 'repost'::text, r.post_id, r.user_id, r.created_at, p.user_id, r.user_id
      from public.reposts r
      join public.posts p on p.id = r.post_id
    ) x
    where
      -- bloqueos y privacidad de la cuenta autora
      public.author_visible_to(x.author_id, me)
      and (x.kind = 'post' or public.author_visible_to(x.actor_id, me))
      -- ocultados: ni lo que publicaron ni lo que compartieron, ni lo de ellos que otros compartan
      and (
        me is null
        or not exists (
          select 1 from public.muted_users m
          where m.user_id = me and m.muted_user_id in (x.author_id, x.actor_id)
        )
      )
      -- preferencia del feed (se mira al autor de la publicación o, en un compartido, a quien compartió)
      and (
        me is null
        or v_pref = 'all'
        or x.actor_id = me
        or (v_pref = 'following' and exists (
              select 1 from public.follows f where f.follower_id = me and f.following_id = x.actor_id))
        or (v_pref = 'mutuals' and exists (
              select 1 from public.follows f1
              join public.follows f2 on f2.follower_id = f1.following_id and f2.following_id = f1.follower_id
              where f1.follower_id = me and f1.following_id = x.actor_id))
      )
    order by x.sort_at desc
    limit v_limit;
end;
$$;

-- El feed de clubes (v1.1.0) también respeta a quién tienes oculto y tus bloqueos
create or replace function public.club_feed_ids(p_club uuid default null, p_limit int default 16)
returns setof uuid
language sql stable security definer set search_path = public as $$
  select p.id
  from public.posts p
  where exists (
    select 1 from public.club_members m
    where m.user_id = p.user_id and (p_club is null or m.club_id = p_club)
  )
    and (auth.uid() is null or (
      not exists (select 1 from public.muted_users mu where mu.user_id = auth.uid() and mu.muted_user_id = p.user_id)
      and not public.is_blocked_between(auth.uid(), p.user_id)
    ))
  order by p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 16), 100));
$$;

revoke execute on function
  public.author_visible_to(uuid, uuid), public.repost_toggle(uuid), public.feed_items(text, uuid, int),
  public.identity_has_detail(text)
from public, anon;
grant execute on function public.repost_toggle(uuid) to authenticated;
grant execute on function public.feed_items(text, uuid, int) to authenticated, anon;
grant execute on function public.author_visible_to(uuid, uuid) to authenticated, anon;
grant execute on function public.identity_has_detail(text) to authenticated, anon;


-- =====================================================================
-- 5) TARJETAS DE ENLACE (Open Graph) PARA DISCORD Y REDES
--    Las llama el servidor de la página con la llave pública. Solo devuelven datos de cuentas
--    PÚBLICAS y activas: si la cuenta es "solo seguidores", está congelada o no existe, no
--    devuelven nada y la página muestra la tarjeta genérica de DaiwaPlace.
-- =====================================================================
create or replace function public.og_post(p_id uuid)
returns table (author_name text, author_username text, content text, image_url text)
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(btrim(a.id_student), ''), a.username), a.username, left(p.content, 300),
         nullif(p.images -> 0 ->> 'url', '')
  from public.posts p
  join public.profiles a on a.id = p.user_id
  where p.id = p_id
    and coalesce(a.posts_visibility, 'public') = 'public'
    and not coalesce(a.is_frozen, false);
$$;

create or replace function public.og_profile(p_username text)
returns table (display_name text, username text, bio text, avatar_url text)
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(btrim(a.id_student), ''), a.username), a.username, left(a.bio, 300), a.avatar_url
  from public.profiles a
  where lower(a.username) = lower(p_username)
    and coalesce(a.posts_visibility, 'public') = 'public'
    and not coalesce(a.is_frozen, false);
$$;

create or replace function public.og_club(p_slug text)
returns table (name text, kind text, description text, banner_url text, avatar_url text)
language sql stable security definer set search_path = public as $$
  select c.name, c.kind, left(c.description, 300), c.banner_url, c.avatar_url
  from public.clubs c
  where c.slug = lower(p_slug);
$$;

revoke execute on function public.og_post(uuid), public.og_profile(text), public.og_club(text) from public;
grant execute on function public.og_post(uuid), public.og_profile(text), public.og_club(text) to anon, authenticated;


notify pgrst, 'reload schema';

-- Listo. Para comprobarlo:  select * from public.reposts;   select * from public.muted_users;
