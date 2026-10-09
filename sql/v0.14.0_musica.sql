-- =====================================================================
-- DaiwaPlace v0.14.0 — Música (Deezer), límites de publicaciones y lista de "me gusta"
-- Pégalo completo en Supabase → SQL Editor → New query → Run.
-- REQUISITO: ya haber corrido los SQL de la v0.11.0 a la v0.13.5.
-- Es seguro correrlo más de una vez (no duplica nada).
--
-- Qué agrega:
--  1) Validación de la canción guardada (notas, publicaciones y perfiles)
--  2) Límites en publicaciones: máximo 1000 caracteres y 4 imágenes
--  3) Lista de quién le dio "me gusta" a una publicación
--  4) Interruptor del Admin Supremo para permitir canciones explícitas
-- =====================================================================


-- 1) VALIDACIÓN DE LA CANCIÓN ------------------------------------------
-- Lo único que se guarda es el número de la canción en Deezer, el título, el artista, la carátula
-- y el enlace a Deezer. NO se guarda el enlace del audio (caduca): se pide fresco al darle play.
-- La carátula debe ser https y el enlace debe ser de deezer.com, así nadie puede meter enlaces raros.
create or replace function public.music_is_valid(p jsonb)
returns boolean
language sql immutable as $$
  select p is null or (
        jsonb_typeof(p) = 'object'
    and (p ->> 'provider') = 'deezer'
    and (p ->> 'id') ~ '^[0-9]{1,12}$'
    and jsonb_typeof(p -> 'title') = 'string'
    and char_length(p ->> 'title') between 1 and 200
    and coalesce(char_length(p ->> 'artist'), 0) <= 200
    and (coalesce(jsonb_typeof(p -> 'cover'), 'null') = 'null'
         or (jsonb_typeof(p -> 'cover') = 'string' and (p ->> 'cover') ~ '^https://' and char_length(p ->> 'cover') <= 400))
    and (coalesce(jsonb_typeof(p -> 'link'), 'null') = 'null'
         or (jsonb_typeof(p -> 'link') = 'string' and (p ->> 'link') ~ '^https://(www\.)?deezer\.com/' and char_length(p ->> 'link') <= 300))
    and char_length(p::text) <= 1500
  );
$$;

do $$
begin
  alter table public.posts add constraint posts_music_valid check (public.music_is_valid(music));
exception when duplicate_object then null;
end;
$$;
do $$
begin
  alter table public.profiles add constraint profiles_music_valid check (public.music_is_valid(music));
exception when duplicate_object then null;
end;
$$;
do $$
begin
  alter table public.notes add constraint notes_music_valid check (public.music_is_valid(music));
exception when duplicate_object then null;
end;
$$;


-- 2) LÍMITES EN PUBLICACIONES ----------------------------------------------
-- "NOT VALID" = se exige en las publicaciones nuevas y en las que se editen, pero NO borra ni rompe
-- las que ya existen (por ejemplo, una muy larga que ya esté publicada).
do $$
begin
  alter table public.posts
    add constraint posts_content_max_1000 check (char_length(content) <= 1000) not valid;
exception when duplicate_object then null;
end;
$$;
do $$
begin
  alter table public.posts
    add constraint posts_images_max_4
    check (images is null or jsonb_typeof(images) <> 'array' or jsonb_array_length(images) <= 4) not valid;
exception when duplicate_object then null;
end;
$$;


-- 3) QUIÉN LE DIO "ME GUSTA" A UNA PUBLICACIÓN ---------------------------------
-- Primero las personas que TÚ sigues, después el resto (lo más reciente arriba), igual que en seguidores.
-- Es "security invoker": usa tus permisos, así solo ves los likes de publicaciones que puedes ver.
create or replace function public.post_like_list(p_post uuid, p_limit int default 40, p_offset int default 0)
returns table (
  profile_id uuid,
  username   text,
  id_student text,
  avatar_url text,
  is_frozen  boolean,
  i_follow   boolean,
  follows_me boolean,
  liked_at   timestamptz
)
language sql stable security invoker set search_path = public as $$
  select
    p.id, p.username, p.id_student, p.avatar_url, coalesce(p.is_frozen, false),
    exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = p.id),
    exists (select 1 from public.follows f where f.follower_id = p.id and f.following_id = auth.uid()),
    l.created_at
  from public.likes l
  join public.profiles p on p.id = l.user_id
  where auth.uid() is not null
    and l.post_id = p_post
    and exists (select 1 from public.posts x where x.id = p_post)
    and not public.is_blocked_between(auth.uid(), p.id)
  order by
    exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = p.id) desc,
    l.created_at desc
  limit greatest(1, least(coalesce(p_limit, 40), 100))
  offset greatest(0, coalesce(p_offset, 0));
$$;


-- 4) CANCIONES EXPLÍCITAS (solo el Admin Supremo lo cambia) ------------------------
-- Por defecto el buscador de música oculta las canciones marcadas como explícitas por Deezer.
create or replace function public.music_explicit_allowed()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select value = 'true'::jsonb from public.app_settings where key = 'music_allow_explicit' limit 1), false);
$$;

create or replace function public.admin_set_music_explicit(p_allow boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.whisper_is_supreme(auth.uid()) then
    raise exception 'Solo el Admin Supremo puede hacer esto';
  end if;
  update public.app_settings
     set value = to_jsonb(p_allow), updated_at = now(), updated_by = auth.uid()
   where key = 'music_allow_explicit';
  if not found then
    insert into public.app_settings (key, value, updated_at, updated_by)
    values ('music_allow_explicit', to_jsonb(p_allow), now(), auth.uid());
  end if;
end;
$$;


-- 5) PERMISOS DE LAS FUNCIONES ------------------------------------------------------
revoke execute on function
  public.music_is_valid(jsonb),
  public.post_like_list(uuid, int, int),
  public.music_explicit_allowed(),
  public.admin_set_music_explicit(boolean)
from public, anon;
grant execute on function
  public.music_is_valid(jsonb),
  public.post_like_list(uuid, int, int),
  public.music_explicit_allowed(),
  public.admin_set_music_explicit(boolean)
to authenticated;

-- Listo.
