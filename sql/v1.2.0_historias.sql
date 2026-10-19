-- =====================================================================
-- DaiwaPlace v1.2.0 «Historias»
-- Pega este archivo COMPLETO en Supabase → SQL Editor y ejecútalo.
-- Es idempotente: se puede correr varias veces sin que falle ni duplique nada.
--
-- Qué hace:
--   0) Ajustes y funciones de ayuda (límite diario, días de archivo).
--   1) Tablas: historias, vistas, likes, destacadas, reportes y silenciadas.
--   2) Columnas nuevas en profiles, messages y notifications.
--   3) Reglas de quién ve qué (story_visible) y el cupo de 3 al día.
--   4) Funciones que usa la página (crear, bandeja, ver, responder, destacadas…).
--   5) Seguridad (RLS) y avisos de «like a tu historia».
--   6) Storage: bucket PRIVADO story-media y bucket público highlight-covers.
--   7) Ayudantes del borrado real (cron) y cómo programarlo.
--
-- La privacidad la decide SIEMPRE la base de datos (hora, límite, audiencia y
-- visibilidad). El navegador solo pide.
-- =====================================================================


-- =====================================================================
-- 0) AJUSTES Y FUNCIONES DE AYUDA
-- =====================================================================

-- Lee un número de app_settings (si no existe o no sirve, usa el valor por defecto).
-- Claves: stories_limit_per_day (3), stories_archive_days (30).
create or replace function public.story_cfg_int(p_key text, p_default int)
returns int
language plpgsql stable security definer set search_path = public as $$
declare
  v text;
begin
  select value #>> '{}' into v from public.app_settings where key = p_key;
  if v is null or btrim(v) = '' then return p_default; end if;
  return v::int;
exception when others then
  return p_default;
end;
$$;

-- Cuántas historias se pueden publicar cada 24 h (ventana móvil)
create or replace function public.story_limit_per_day()
returns int language sql stable security definer set search_path = public as $$
  select greatest(1, least(20, public.story_cfg_int('stories_limit_per_day', 3)));
$$;

-- Cuántos días guarda el dueño sus historias vencidas en su archivo privado (0 = sin archivo)
create or replace function public.story_archive_days()
returns int language sql stable security definer set search_path = public as $$
  select greatest(0, least(365, public.story_cfg_int('stories_archive_days', 30)));
$$;

-- Valida la lista de capas (texto, emoji, música, ubicación, hora) que se dibuja encima del fondo.
-- Máximo 20 elementos, 12 000 caracteres en total y rangos seguros para posición, tamaño y giro.
create or replace function public.story_elements_valid(p jsonb)
returns boolean
language sql immutable as $$
  select case when p is not null and jsonb_typeof(p) = 'array' then (
    jsonb_array_length(p) <= 20
    and char_length(p::text) <= 12000
    and not exists (
      select 1 from jsonb_array_elements(p) e
      where not (
        jsonb_typeof(e) = 'object'
        and (e ->> 'type') in ('text', 'emoji', 'music', 'location', 'time')
        and case when jsonb_typeof(e -> 'x') = 'number' then (e ->> 'x')::numeric between -10 and 110 else false end
        and case when jsonb_typeof(e -> 'y') = 'number' then (e ->> 'y')::numeric between -10 and 110 else false end
        and case when e ? 'scale'
              then (case when jsonb_typeof(e -> 'scale') = 'number' then (e ->> 'scale')::numeric between 0.2 and 6 else false end)
              else true end
        and case when e ? 'rotation'
              then (case when jsonb_typeof(e -> 'rotation') = 'number' then (e ->> 'rotation')::numeric between -360 and 360 else false end)
              else true end
        and case when (e ->> 'type') = 'text'
              then (jsonb_typeof(e -> 'text') = 'string' and char_length(e ->> 'text') <= 220)
              else true end
        and case when (e ->> 'type') = 'location'
              then (jsonb_typeof(e -> 'label') = 'string' and char_length(e ->> 'label') <= 40)
              else true end
        and case when (e ->> 'type') = 'emoji'
              then (jsonb_typeof(e -> 'emoji') = 'string' and char_length(e ->> 'emoji') <= 16)
              else true end
      )
    )
  ) else false end;
$$;

-- Valida el fondo de una historia de texto: degradado o color sólido (y poco peso)
create or replace function public.story_bg_valid(p jsonb)
returns boolean
language sql immutable as $$
  select p is null or (
    jsonb_typeof(p) = 'object'
    and (p ->> 'type') in ('gradient', 'solid')
    and char_length(p::text) <= 700
  );
$$;


-- =====================================================================
-- 1) TABLAS
-- =====================================================================

-- 1.1 Historias. La foto vive en el bucket privado «story-media»; el resto (texto, emojis, música,
--     ubicación y hora) son capas en JSON que se dibujan encima en la pantalla.
create table if not exists public.stories (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  kind            text not null check (kind in ('photo', 'text')),
  media_path      text,
  media_w         smallint,
  media_h         smallint,
  bg              jsonb,
  elements        jsonb not null default '[]'::jsonb,
  music           jsonb,
  music_start     smallint not null default 0 check (music_start between 0 and 25),
  music_clip      smallint not null default 15 check (music_clip between 5 and 15),
  duration_ms     integer not null default 6000 check (duration_ms between 4000 and 15000),
  audience        text not null default 'followers' check (audience in ('followers', 'friends')),
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '24 hours'),
  deleted_at      timestamptz,
  deleted_by      uuid references public.profiles(id) on delete set null,
  media_purged_at timestamptz,
  constraint stories_content_check check (
    (kind = 'photo' and (media_path is not null or media_purged_at is not null))
    or (kind = 'text' and (bg is not null or media_purged_at is not null))
  ),
  constraint stories_music_valid    check (public.music_is_valid(music)),
  constraint stories_elements_valid check (public.story_elements_valid(elements)),
  constraint stories_bg_valid       check (public.story_bg_valid(bg))
);
create index if not exists stories_user_created_idx on public.stories (user_id, created_at desc);
create index if not exists stories_expires_idx      on public.stories (expires_at);
create index if not exists stories_media_path_idx   on public.stories (media_path) where media_path is not null;

-- 1.2 Vistas (una por persona y por historia) y likes
create table if not exists public.story_views (
  story_id  uuid not null references public.stories(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);
create index if not exists story_views_viewer_idx on public.story_views (viewer_id);

create table if not exists public.story_likes (
  story_id   uuid not null references public.stories(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (story_id, user_id)
);
create index if not exists story_likes_user_idx on public.story_likes (user_id);

-- 1.3 Destacadas (colecciones con portada y título) y las historias que contienen
create table if not exists public.highlights (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null check (char_length(btrim(title)) between 1 and 16),
  cover      jsonb not null,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists highlights_user_idx on public.highlights (user_id, position);

create table if not exists public.highlight_items (
  highlight_id uuid not null references public.highlights(id) on delete cascade,
  story_id     uuid not null references public.stories(id) on delete cascade,
  position     integer not null default 0,
  added_at     timestamptz not null default now(),
  primary key (highlight_id, story_id)
);
create index if not exists highlight_items_story_idx on public.highlight_items (story_id);

-- 1.4 Reportes de historias (mismo patrón que dm_reports). La copia («snapshot») guarda lo reportado
--     para que el equipo pueda revisarlo aunque la historia vença. Mientras el reporte esté pendiente
--     el cron NO borra el archivo.
create table if not exists public.story_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  story_id    uuid references public.stories(id) on delete set null,
  reason      text not null check (reason in ('ofensivo', 'acoso', 'datos_personales', 'odio', 'ubicacion', 'spam', 'otro')),
  details     text check (details is null or char_length(details) <= 300),
  snapshot    jsonb not null default '{}'::jsonb,
  status      text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at  timestamptz not null default now(),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  resolution  text
);
create index if not exists story_reports_status_idx on public.story_reports (status, created_at desc);
create index if not exists story_reports_story_idx  on public.story_reports (story_id);
create unique index if not exists story_reports_one_pending
  on public.story_reports (reporter_id, story_id) where status = 'pending';

-- 1.5 «Silenciar historias de @usuario»: sus historias pasan al final de tu bandeja, atenuadas.
--     (Aparte de muted_users, que oculta PUBLICACIONES: así silenciar historias no esconde sus posts.)
create table if not exists public.story_mutes (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  muted_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (user_id, muted_user_id),
  constraint story_mutes_not_self check (user_id <> muted_user_id)
);


-- =====================================================================
-- 2) COLUMNAS NUEVAS EN TABLAS QUE YA EXISTEN
-- =====================================================================

-- Ajustes de privacidad de las historias
alter table public.profiles add column if not exists story_default_audience text not null default 'followers';
alter table public.profiles drop constraint if exists profiles_story_default_audience_check;
alter table public.profiles add constraint profiles_story_default_audience_check
  check (story_default_audience in ('followers', 'friends'));

alter table public.profiles add column if not exists story_replies text not null default 'all';
alter table public.profiles drop constraint if exists profiles_story_replies_check;
alter table public.profiles add constraint profiles_story_replies_check
  check (story_replies in ('all', 'friends', 'off'));

-- Por si la tabla de perfiles tiene permisos por columna
grant select (story_default_audience, story_replies) on public.profiles to authenticated;
grant update (story_default_audience, story_replies) on public.profiles to authenticated;

-- Un mensaje puede ser la respuesta a una historia
alter table public.messages add column if not exists story_id uuid;
do $$
begin
  alter table public.messages
    add constraint messages_story_id_fkey foreign key (story_id) references public.stories(id) on delete set null;
exception when duplicate_object then null;
end;
$$;
create index if not exists messages_story_idx on public.messages (story_id) where story_id is not null;

-- Notificaciones: «le dio like a tu historia»
alter table public.notifications add column if not exists story_id uuid;
do $$
begin
  alter table public.notifications
    add constraint notifications_story_id_fkey foreign key (story_id) references public.stories(id) on delete cascade;
exception when duplicate_object then null;
end;
$$;

-- OJO: esta restricción se borra y se vuelve a crear en cada versión. Aquí van TODOS los tipos vigentes
-- (los de la v1.1.10) más el nuevo «like_story».
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'like_post','like_comment','comment','reply','follow','like_note','whisper_comment','whisper_reply',
    'mention_post','mention_comment','whisper_mention','whisper_comment_mention',
    'club_approved','club_declined','club_join_request','club_join_accepted',
    'repost',
    'like_story'
  ));
create unique index if not exists notifications_uniq_like_story
  on public.notifications (actor_id, story_id) where type = 'like_story';

-- (El interruptor «story_likes» de Configuración → Notificaciones: notif_should_send ya trata una clave
--  que no existe como ACTIVADA, así que todos reciben estos avisos sin tocar nada.)


-- =====================================================================
-- 3) REGLAS: ¿QUIÉN VE QUÉ?
-- =====================================================================

-- Regla de oro (3.2): A ve la historia de B solo si
--   · A = B (el dueño siempre ve las suyas: activas o en su archivo), o
--   · A sigue a B, y la audiencia es «followers», o «friends» y A y B son amigos (se siguen), y
--   · no hay bloqueo entre ellos, y la cuenta de B no está congelada, y la historia no está
--     eliminada ni vencida (salvo que esté dentro de una destacada: ahí sigue visible con las
--     mismas reglas de seguir / audiencia / bloqueo).
create or replace function public.story_visible(p_story uuid, p_viewer uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select p_viewer is not null and exists (
    select 1
    from public.stories s
    join public.profiles o on o.id = s.user_id
    where s.id = p_story
      and s.deleted_at is null
      and (
        -- el dueño: activa, en su archivo privado, o dentro de una destacada
        (
          s.user_id = p_viewer
          and (
            s.expires_at > now()
            or exists (select 1 from public.highlight_items hi where hi.story_id = s.id)
            or (public.story_archive_days() > 0
                and s.expires_at + make_interval(days => public.story_archive_days()) > now())
          )
        )
        -- cualquier otra persona
        or (
          s.user_id <> p_viewer
          and not coalesce(o.is_frozen, false)
          and not public.is_blocked_between(p_viewer, s.user_id)
          and exists (select 1 from public.follows f where f.follower_id = p_viewer and f.following_id = s.user_id)
          and (s.audience = 'followers' or public.are_friends(p_viewer, s.user_id))
          and (s.expires_at > now()
               or exists (select 1 from public.highlight_items hi where hi.story_id = s.id))
        )
      )
  );
$$;

-- Ruta del archivo: <id del dueño>/<archivo>.jpg
-- ¿Puede esta persona ver este archivo ahora mismo?
--   · quien lo puede ver según story_visible (la fecha de vencimiento se vuelve a comprobar en cada lectura)
--   · el dueño de la carpeta mientras la historia aún no existe (para limpiar una subida que falló)
--   · el equipo con «Ver evidencia», SOLO si el archivo aparece en un reporte de historias
create or replace function public.story_media_can_view(p_name text, p_user uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select p_user is not null and (
    exists (
      select 1 from public.stories s
      where s.media_path = p_name
        and s.media_purged_at is null
        and public.story_visible(s.id, p_user)
    )
    or (
      split_part(p_name, '/', 1) = p_user::text
      and not exists (select 1 from public.stories s where s.media_path = p_name)
    )
    or (
      public.whisper_has_perm(p_user, 'view_evidence')
      and exists (
        select 1 from public.story_reports r
        where r.snapshot ->> 'media_path' = p_name
      )
    )
  );
$$;


-- =====================================================================
-- 4) FUNCIONES QUE USA LA PÁGINA (RPC)
-- =====================================================================

-- 4.1 Cupo: cuántas historias llevo en las últimas 24 h (ventana móvil, no «día de calendario»).
--     Borrar NO devuelve el cupo, salvo que la borres tú en los primeros 2 minutos.
create or replace function public.story_quota()
returns table (used int, max_per_day int, resets_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare
  me     uuid := auth.uid();
  v_max  int := public.story_limit_per_day();
  v_used int;
  v_first timestamptz;
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;
  select count(*)::int, min(s.created_at)
    into v_used, v_first
    from public.stories s
   where s.user_id = me
     and s.created_at > now() - interval '24 hours'
     and not (s.deleted_by = me and s.deleted_at is not null and s.deleted_at - s.created_at < interval '2 minutes');
  used := v_used;
  max_per_day := v_max;
  resets_at := case when v_used >= v_max then v_first + interval '24 hours' else null end;
  return next;
end;
$$;

-- 4.2 Publicar. El servidor comprueba sesión, cuenta, cupo (con bloqueo para que dos pestañas a la vez
--     no se salten el límite), ruta del archivo, validaciones y fija la hora de vencimiento.
create or replace function public.story_create(
  p_kind        text,
  p_media_path  text,
  p_media_w     int,
  p_media_h     int,
  p_bg          jsonb,
  p_elements    jsonb,
  p_music       jsonb,
  p_music_start int,
  p_music_clip  int,
  p_duration_ms int,
  p_audience    text
)
returns public.stories
language plpgsql security definer set search_path = public as $$
declare
  me      uuid := auth.uid();
  v_max   int  := public.story_limit_per_day();
  v_used  int;
  v_first timestamptz;
  v_dur   int;
  v_clip  int := coalesce(p_music_clip, 15);
  v_start int := coalesce(p_music_start, 0);
  v_row   public.stories;
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;
  if exists (select 1 from public.profiles where id = me and is_frozen) then
    raise exception 'Tu cuenta está congelada y no puede publicar historias por ahora';
  end if;

  -- un solo «publicar» a la vez por persona
  perform pg_advisory_xact_lock(hashtext('story_create:' || me::text));

  select count(*)::int, min(s.created_at)
    into v_used, v_first
    from public.stories s
   where s.user_id = me
     and s.created_at > now() - interval '24 hours'
     and not (s.deleted_by = me and s.deleted_at is not null and s.deleted_at - s.created_at < interval '2 minutes');
  if v_used >= v_max then
    raise exception 'Ya publicaste % historias hoy. Podrás publicar otra en % min.',
      v_max, greatest(1, ceil(extract(epoch from (v_first + interval '24 hours' - now())) / 60)::int);
  end if;

  if p_kind not in ('photo', 'text') then raise exception 'Tipo de historia no válido'; end if;
  if p_audience not in ('followers', 'friends') then raise exception 'Elige quién puede ver tu historia'; end if;

  if p_kind = 'photo' then
    if p_media_path is null or split_part(p_media_path, '/', 1) <> me::text or position('..' in p_media_path) > 0 then
      raise exception 'La foto no es válida';
    end if;
    if not exists (select 1 from storage.objects where bucket_id = 'story-media' and name = p_media_path) then
      raise exception 'La foto no se subió bien. Inténtalo de nuevo';
    end if;
  else
    if p_bg is null then raise exception 'Falta el fondo de la historia'; end if;
  end if;

  if not public.story_bg_valid(p_bg) then raise exception 'El fondo de la historia no es válido'; end if;
  if not public.story_elements_valid(coalesce(p_elements, '[]'::jsonb)) then
    raise exception 'Hay demasiadas cosas (o alguna no es válida) en esta historia';
  end if;
  if not public.music_is_valid(p_music) then raise exception 'La canción no es válida'; end if;

  if p_music is not null then
    if v_clip < 5 or v_clip > 15 then raise exception 'El fragmento de música dura entre 5 y 15 segundos'; end if;
    if v_start < 0 or v_start + v_clip > 30 then raise exception 'El fragmento de música se sale de los 30 segundos'; end if;
  else
    v_clip := 15;
    v_start := 0;
  end if;

  -- duración: entre 4 y 15 s; con música, nunca menos de lo que dura el fragmento
  v_dur := greatest(4000, least(15000, coalesce(p_duration_ms, 6000)));
  if p_music is not null then v_dur := greatest(v_dur, v_clip * 1000); end if;

  insert into public.stories (
    user_id, kind, media_path, media_w, media_h, bg, elements, music, music_start, music_clip,
    duration_ms, audience, created_at, expires_at
  ) values (
    me, p_kind,
    case when p_kind = 'photo' then p_media_path end,
    case when p_kind = 'photo' then coalesce(p_media_w, 1080) end,
    case when p_kind = 'photo' then coalesce(p_media_h, 1920) end,
    case when p_kind = 'text' then p_bg end,
    coalesce(p_elements, '[]'::jsonb), p_music, v_start, v_clip,
    v_dur, p_audience, now(), now() + interval '24 hours'
  ) returning * into v_row;

  -- se recuerda la audiencia para la próxima vez
  update public.profiles set story_default_audience = p_audience where id = me;
  return v_row;
end;
$$;

-- 4.3 Una historia como JSON (lo que necesita el visor). Los contadores solo los ve el dueño.
create or replace function public.story_to_json(s public.stories, me uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', s.id, 'user_id', s.user_id, 'kind', s.kind,
    'media_path', s.media_path, 'media_w', s.media_w, 'media_h', s.media_h,
    'bg', s.bg, 'elements', s.elements, 'music', s.music,
    'music_start', s.music_start, 'music_clip', s.music_clip,
    'duration_ms', s.duration_ms, 'audience', s.audience,
    'created_at', s.created_at, 'expires_at', s.expires_at,
    'is_active', (s.expires_at > now()),
    'seen', exists (select 1 from public.story_views v where v.story_id = s.id and v.viewer_id = me),
    'liked_by_me', exists (select 1 from public.story_likes l where l.story_id = s.id and l.user_id = me)
  ) || case when s.user_id = me then jsonb_build_object(
      'view_count', (select count(*) from public.story_views v where v.story_id = s.id),
      'like_count', (select count(*) from public.story_likes l where l.story_id = s.id)
    ) else '{}'::jsonb end;
$$;

-- 4.4 Historias ACTIVAS de una persona que yo puedo ver, de la más vieja a la más nueva
create or replace function public.stories_of_user(p_user uuid)
returns setof jsonb
language sql stable security definer set search_path = public as $$
  select public.story_to_json(s, auth.uid())
  from public.stories s
  where s.user_id = p_user
    and s.deleted_at is null
    and s.expires_at > now()
    and public.story_visible(s.id, auth.uid())
  order by s.created_at asc;
$$;

-- 4.5 Bandeja del Inicio: una fila por autor visible (solo gente que sigo; NO incluye al propio usuario).
--     Orden: amigos (mutuals) antes que el resto; no vistas antes que vistas; la más reciente primero;
--     las personas silenciadas van al final. «segments» trae una entrada por historia (para dibujar el anillo).
create or replace function public.stories_tray()
returns table (
  user_id          uuid,
  username         text,
  id_student       text,
  avatar_url       text,
  story_count      int,
  unseen_count     int,
  latest_at        timestamptz,
  is_friend        boolean,
  has_friends_only boolean,
  all_friends_only boolean,
  is_muted         boolean,
  segments         jsonb
)
language sql stable security definer set search_path = public as $$
  with me as (select auth.uid() as id),
  vis as (
    select s.id, s.user_id, s.audience, s.created_at,
           exists (select 1 from public.story_views v where v.story_id = s.id and v.viewer_id = (select id from me)) as seen
    from public.stories s
    where (select id from me) is not null
      and s.deleted_at is null
      and s.expires_at > now()
      and s.user_id <> (select id from me)
      and s.user_id in (select f.following_id from public.follows f where f.follower_id = (select id from me))
      and public.story_visible(s.id, (select id from me))
  ),
  agg as (
    select v.user_id,
           count(*)::int as story_count,
           (count(*) filter (where not v.seen))::int as unseen_count,
           max(v.created_at) as latest_at,
           bool_or(v.audience = 'friends') as has_friends_only,
           bool_and(v.audience = 'friends') as all_friends_only,
           jsonb_agg(jsonb_build_object('seen', v.seen, 'friends', v.audience = 'friends') order by v.created_at) as segments
    from vis v
    group by v.user_id
  )
  select a.user_id, p.username, p.id_student, p.avatar_url,
         a.story_count, a.unseen_count, a.latest_at,
         public.are_friends((select id from me), a.user_id) as is_friend,
         a.has_friends_only, a.all_friends_only,
         (
           exists (select 1 from public.muted_users m where m.user_id = (select id from me) and m.muted_user_id = a.user_id)
           or exists (select 1 from public.story_mutes m where m.user_id = (select id from me) and m.muted_user_id = a.user_id)
         ) as is_muted,
         a.segments
  from agg a
  join public.profiles p on p.id = a.user_id
  order by
    (exists (select 1 from public.muted_users m where m.user_id = (select id from me) and m.muted_user_id = a.user_id)
      or exists (select 1 from public.story_mutes m where m.user_id = (select id from me) and m.muted_user_id = a.user_id)) asc,
    public.are_friends((select id from me), a.user_id) desc,
    (a.unseen_count = 0) asc,
    a.latest_at desc;
$$;

-- 4.6 Registrar una vista (una por persona y por historia). Ignora al dueño y lo que no puedo ver.
create or replace function public.story_mark_viewed(p_story uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
begin
  if me is null then return; end if;
  if not exists (
    select 1 from public.stories s
    where s.id = p_story and s.user_id <> me and s.deleted_at is null and s.expires_at > now()
  ) then return; end if;
  if not public.story_visible(p_story, me) then return; end if;
  insert into public.story_views (story_id, viewer_id) values (p_story, me) on conflict do nothing;
end;
$$;

-- 4.7 Quién la vio y a quién le gustó (SOLO el dueño). Primero los que dieron like (el más reciente arriba),
--     después el resto por hora de vista.
create or replace function public.story_viewers(p_story uuid, p_limit int default 50, p_offset int default 0)
returns table (
  user_id    uuid,
  username   text,
  id_student text,
  avatar_url text,
  viewed_at  timestamptz,
  liked      boolean,
  liked_at   timestamptz,
  is_friend  boolean
)
language sql stable security definer set search_path = public as $$
  select coalesce(v.uid, l.uid) as user_id,
         p.username, p.id_student, p.avatar_url,
         coalesce(v.viewed_at, l.liked_at) as viewed_at,
         (l.uid is not null) as liked,
         l.liked_at,
         public.are_friends(auth.uid(), coalesce(v.uid, l.uid)) as is_friend
  from (select viewer_id as uid, viewed_at from public.story_views where story_id = p_story) v
  full join (select user_id as uid, created_at as liked_at from public.story_likes where story_id = p_story) l
    on l.uid = v.uid
  join public.profiles p on p.id = coalesce(v.uid, l.uid)
  where exists (select 1 from public.stories s where s.id = p_story and s.user_id = auth.uid())
    and not public.is_blocked_between(auth.uid(), coalesce(v.uid, l.uid))
  order by (l.uid is not null) desc, l.liked_at desc nulls last, coalesce(v.viewed_at, l.liked_at) desc
  limit greatest(1, least(coalesce(p_limit, 50), 100))
  offset greatest(0, coalesce(p_offset, 0));
$$;

-- Totales de la hoja de actividad (solo el dueño): personas distintas y likes
create or replace function public.story_activity_counts(p_story uuid)
returns table (people int, likes int)
language sql stable security definer set search_path = public as $$
  select
    (select count(*)::int from (
        select viewer_id as uid from public.story_views where story_id = p_story
        union
        select user_id from public.story_likes where story_id = p_story
     ) x where not public.is_blocked_between(auth.uid(), x.uid)),
    (select count(*)::int from public.story_likes l
      where l.story_id = p_story and not public.is_blocked_between(auth.uid(), l.user_id))
  where exists (select 1 from public.stories s where s.id = p_story and s.user_id = auth.uid());
$$;

-- 4.8 Borrar mi historia (borrado suave): sale de todas las destacadas y se borran sus avisos de like
create or replace function public.story_delete(p_story uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;
  update public.stories
     set deleted_at = now(), deleted_by = me
   where id = p_story and user_id = me and deleted_at is null;
  if not found then raise exception 'No se encontró la historia'; end if;

  delete from public.highlight_items where story_id = p_story;
  -- las destacadas que se quedaron vacías se eliminan
  delete from public.highlights h
   where h.user_id = me and not exists (select 1 from public.highlight_items i where i.highlight_id = h.id);
  delete from public.notifications where type = 'like_story' and story_id = p_story;
end;
$$;

-- 4.9 Responder a una historia = un mensaje directo al dueño con la historia como contexto.
--     Usa la MISMA lógica de dm_start (solicitud de mensaje si no son amigos, bloqueos, cuenta congelada)
--     y dm_can_send (tope de mensajes mientras la solicitud está pendiente).
create or replace function public.story_reply(p_story uuid, p_content text)
returns table (conversation_id uuid, is_request boolean)
language plpgsql security definer set search_path = public as $$
declare
  me      uuid := auth.uid();
  v_owner uuid;
  v_mode  text;
  v_conv  uuid;
  v_text  text := btrim(coalesce(p_content, ''));
  v_status text;
  v_init  uuid;
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;
  if char_length(v_text) < 1 or char_length(v_text) > 500 then
    raise exception 'La respuesta debe tener entre 1 y 500 caracteres';
  end if;

  select s.user_id into v_owner from public.stories s
   where s.id = p_story and s.deleted_at is null and s.expires_at > now();
  if v_owner is null or v_owner = me or not public.story_visible(p_story, me) then
    raise exception 'Esta historia ya no está disponible';
  end if;

  select story_replies into v_mode from public.profiles where id = v_owner;
  if coalesce(v_mode, 'all') = 'off'
     or (v_mode = 'friends' and not public.are_friends(me, v_owner)) then
    raise exception 'Esta persona no permite respuestas a sus historias';
  end if;

  -- máximo 30 respuestas por minuto
  if (select count(*) from public.messages m
       where m.sender_id = me and m.story_id is not null and m.created_at > now() - interval '1 minute') >= 30 then
    raise exception 'Vas muy rápido. Espera un momento e inténtalo de nuevo';
  end if;

  v_conv := public.dm_start(v_owner);
  if not public.dm_can_send(v_conv, me) then
    raise exception 'No se pudo enviar. Si es una solicitud de mensaje, solo puedes mandar 3 mensajes hasta que la otra persona la acepte';
  end if;

  insert into public.messages (conversation_id, sender_id, content, story_id)
  values (v_conv, me, v_text, p_story);

  select c.status, c.initiator_id into v_status, v_init from public.conversations c where c.id = v_conv;
  conversation_id := v_conv;
  is_request := (v_status = 'pending' and v_init = me);
  return next;
end;
$$;

-- 4.10 Tarjeta de contexto en el chat («Respondió a tu historia»): solo si sigue activa y la puedo ver
create or replace function public.story_card(p_story uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', s.id, 'kind', s.kind, 'media_path', s.media_path, 'bg', s.bg, 'expires_at', s.expires_at
  )
  from public.stories s
  where s.id = p_story
    and s.deleted_at is null
    and s.expires_at > now()
    and public.story_visible(s.id, auth.uid());
$$;

-- 4.11 Silenciar / reactivar las historias de alguien
create or replace function public.story_mute_toggle(p_user uuid, p_mute boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
begin
  if me is null or p_user is null or p_user = me then return; end if;
  if p_mute then
    insert into public.story_mutes (user_id, muted_user_id) values (me, p_user) on conflict do nothing;
  else
    delete from public.story_mutes where user_id = me and muted_user_id = p_user;
  end if;
end;
$$;

-- 4.12 Anillos en avatares fuera de la bandeja (perfil, publicaciones, mensajes): una sola consulta, máx. 60 ids
create or replace function public.stories_ring_status(p_users uuid[])
returns table (user_id uuid, has_story boolean, has_unseen boolean, friends_only boolean)
language sql stable security definer set search_path = public as $$
  select u.uid,
         coalesce(c.cnt, 0) > 0,
         coalesce(c.unseen, 0) > 0,
         coalesce(c.friends_only, false)
  from (select distinct x as uid from unnest((coalesce(p_users, '{}'::uuid[]))[1:60]) x) u
  left join lateral (
    select count(*) as cnt,
           count(*) filter (where not exists (
             select 1 from public.story_views v where v.story_id = s.id and v.viewer_id = auth.uid())) as unseen,
           bool_and(s.audience = 'friends') as friends_only
    from public.stories s
    where s.user_id = u.uid
      and s.deleted_at is null
      and s.expires_at > now()
      and auth.uid() is not null
      and public.story_visible(s.id, auth.uid())
  ) c on true;
$$;

-- 4.13 Mi archivo privado: activas + vencidas dentro del plazo (o dentro de una destacada)
create or replace function public.story_archive(p_limit int default 60, p_before timestamptz default null)
returns setof jsonb
language sql stable security definer set search_path = public as $$
  select public.story_to_json(s, auth.uid())
         || jsonb_build_object('in_highlight', exists (select 1 from public.highlight_items hi where hi.story_id = s.id))
  from public.stories s
  where s.user_id = auth.uid()
    and s.deleted_at is null
    and s.media_purged_at is null
    and (p_before is null or s.created_at < p_before)
    and public.story_visible(s.id, auth.uid())
  order by s.created_at desc
  limit greatest(1, least(coalesce(p_limit, 60), 200));
$$;

-- 4.14 Destacadas
-- Crear o editar (p_id null = crear). Máx. 20 destacadas por persona y 50 historias por destacada.
-- El orden del arreglo = la posición. Solo historias mías, activas o en mi archivo.
create or replace function public.highlight_save(p_id uuid, p_title text, p_cover jsonb, p_story_ids uuid[])
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me     uuid := auth.uid();
  v_id   uuid := p_id;
  v_ids  uuid[];
  v_pos  int;
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;
  if char_length(btrim(coalesce(p_title, ''))) not between 1 and 16 then
    raise exception 'El título debe tener entre 1 y 16 caracteres';
  end if;

  -- portada: una imagen de MI carpeta del bucket highlight-covers, o un estilo sin foto
  if p_cover is null or jsonb_typeof(p_cover) <> 'object' or char_length(p_cover::text) > 600 then
    raise exception 'La portada no es válida';
  end if;
  if (p_cover ->> 'type') = 'image' then
    if coalesce(p_cover ->> 'url', '') not like ('https://%/storage/v1/object/public/highlight-covers/' || me::text || '/%') then
      raise exception 'La portada no es válida';
    end if;
  elsif (p_cover ->> 'type') = 'style' then
    if coalesce(p_cover ->> 'id', '') !~ '^[a-z0-9_-]{1,30}$' then
      raise exception 'La portada no es válida';
    end if;
  else
    raise exception 'La portada no es válida';
  end if;

  -- historias: sin repetidas, conservando el orden
  select coalesce(array_agg(x order by o), '{}'::uuid[]) into v_ids
    from (select distinct on (x) x, o from unnest(coalesce(p_story_ids, '{}'::uuid[])) with ordinality as t(x, o) order by x, o) d;
  if coalesce(array_length(v_ids, 1), 0) < 1 then raise exception 'Elige al menos una historia'; end if;
  if array_length(v_ids, 1) > 50 then raise exception 'Una destacada puede tener máximo 50 historias'; end if;
  if exists (
    select 1 from unnest(v_ids) i
    where not exists (
      select 1 from public.stories s
      where s.id = i and s.user_id = me and s.deleted_at is null and public.story_visible(s.id, me)
    )
  ) then
    raise exception 'Alguna de las historias ya no está disponible';
  end if;

  if v_id is null then
    if (select count(*) from public.highlights where user_id = me) >= 20 then
      raise exception 'Ya tienes 20 destacadas. Elimina alguna para crear otra';
    end if;
    select coalesce(max(position), -1) + 1 into v_pos from public.highlights where user_id = me;
    insert into public.highlights (user_id, title, cover, position)
    values (me, btrim(p_title), p_cover, v_pos) returning id into v_id;
  else
    update public.highlights
       set title = btrim(p_title), cover = p_cover, updated_at = now()
     where id = v_id and user_id = me;
    if not found then raise exception 'No se encontró la destacada'; end if;
    delete from public.highlight_items where highlight_id = v_id;
  end if;

  insert into public.highlight_items (highlight_id, story_id, position)
  select v_id, x, (o - 1)::int from unnest(v_ids) with ordinality as t(x, o);
  return v_id;
end;
$$;

-- Añadir o quitar UNA historia de una destacada (para «★ Destacar» desde el visor)
create or replace function public.highlight_toggle_story(p_highlight uuid, p_story uuid, p_add boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  v_pos int;
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;
  if not exists (select 1 from public.highlights where id = p_highlight and user_id = me) then
    raise exception 'No se encontró la destacada';
  end if;
  if p_add then
    if not exists (select 1 from public.stories s where s.id = p_story and s.user_id = me and s.deleted_at is null and public.story_visible(s.id, me)) then
      raise exception 'Esta historia ya no está disponible';
    end if;
    if (select count(*) from public.highlight_items where highlight_id = p_highlight) >= 50 then
      raise exception 'Una destacada puede tener máximo 50 historias';
    end if;
    select coalesce(max(position), -1) + 1 into v_pos from public.highlight_items where highlight_id = p_highlight;
    insert into public.highlight_items (highlight_id, story_id, position) values (p_highlight, p_story, v_pos) on conflict do nothing;
  else
    delete from public.highlight_items where highlight_id = p_highlight and story_id = p_story;
    delete from public.highlights h
     where h.id = p_highlight and not exists (select 1 from public.highlight_items i where i.highlight_id = h.id);
  end if;
  update public.highlights set updated_at = now() where id = p_highlight;
end;
$$;

create or replace function public.highlight_delete(p_id uuid)
returns void
language sql security definer set search_path = public as $$
  delete from public.highlights where id = p_id and user_id = auth.uid();
$$;

create or replace function public.highlight_reorder(p_ids uuid[])
returns void
language sql security definer set search_path = public as $$
  update public.highlights h
     set position = (t.o - 1)::int
    from unnest(coalesce(p_ids, '{}'::uuid[])) with ordinality as t(x, o)
   where h.id = t.x and h.user_id = auth.uid();
$$;

-- Las destacadas de una persona que tengan al menos una historia visible para mí
create or replace function public.profile_highlights(p_user uuid)
returns table (id uuid, title text, cover jsonb, "position" int, visible_count int)
language sql stable security definer set search_path = public as $$
  select h.id, h.title, h.cover, h.position, c.cnt::int
  from public.highlights h
  join lateral (
    select count(*) as cnt
    from public.highlight_items hi
    where hi.highlight_id = h.id and public.story_visible(hi.story_id, auth.uid())
  ) c on true
  where h.user_id = p_user and auth.uid() is not null and c.cnt > 0
  order by h.position asc, h.created_at asc;
$$;

-- Las historias visibles de una destacada, en orden
create or replace function public.highlight_stories(p_highlight uuid)
returns setof jsonb
language sql stable security definer set search_path = public as $$
  select public.story_to_json(s, auth.uid())
  from public.highlight_items hi
  join public.stories s on s.id = hi.story_id
  where hi.highlight_id = p_highlight
    and s.deleted_at is null
    and s.media_purged_at is null
    and public.story_visible(s.id, auth.uid())
  order by hi.position asc, hi.added_at asc;
$$;

-- 4.15 Reportar una historia
create or replace function public.story_report(p_story uuid, p_reason text, p_details text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  s  public.stories;
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;
  select * into s from public.stories where id = p_story and deleted_at is null;
  if not found or s.user_id = me or not public.story_visible(p_story, me) then
    raise exception 'Esta historia ya no está disponible';
  end if;
  begin
    insert into public.story_reports (reporter_id, reported_id, story_id, reason, details, snapshot)
    values (
      me, s.user_id, s.id, p_reason, nullif(btrim(coalesce(p_details, '')), ''),
      jsonb_build_object(
        'story_id', s.id, 'owner_id', s.user_id, 'kind', s.kind, 'media_path', s.media_path,
        'bg', s.bg, 'elements', s.elements, 'music', s.music, 'audience', s.audience, 'created_at', s.created_at
      )
    );
  exception when unique_violation then
    raise exception 'Ya reportaste esta historia y está en revisión';
  end;
end;
$$;

-- El equipo resuelve un reporte: 'dismiss' (descartar, con «ver reportes») o 'delete' (eliminar la
-- historia, con «eliminar contenido»). Queda constancia de quién y cuándo.
create or replace function public.story_report_resolve(p_report uuid, p_action text, p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  r  public.story_reports;
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;
  select * into r from public.story_reports where id = p_report;
  if not found then raise exception 'No se encontró el reporte'; end if;

  if p_action = 'dismiss' then
    if not public.whisper_has_perm(me, 'view_reports') then raise exception 'No tienes permiso'; end if;
    update public.story_reports
       set status = 'dismissed', resolved_by = me, resolved_at = now(), resolution = nullif(btrim(coalesce(p_note, '')), '')
     where id = p_report;
  elsif p_action = 'delete' then
    if not public.whisper_has_perm(me, 'delete_content') then raise exception 'No tienes permiso'; end if;
    if r.story_id is not null then
      update public.stories set deleted_at = coalesce(deleted_at, now()), deleted_by = me where id = r.story_id;
      delete from public.highlight_items where story_id = r.story_id;
      delete from public.notifications where type = 'like_story' and story_id = r.story_id;
    end if;
    update public.story_reports
       set status = 'resolved', resolved_by = me, resolved_at = now(), resolution = coalesce(nullif(btrim(coalesce(p_note, '')), ''), 'Historia eliminada')
     where id = p_report;
  else
    raise exception 'Acción no válida';
  end if;
end;
$$;

-- 4.16 Ajustes del sistema (Centro de Mando → Sistema). Leer: cualquiera; cambiar: solo el Admin Supremo.
create or replace function public.story_settings()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_places jsonb;
begin
  select value into v_places from public.app_settings where key = 'story_places';
  if v_places is null or jsonb_typeof(v_places) <> 'array' then
    v_places := '["Biblioteca","Cafetería","Patio","Gimnasio","Salón de clases","Laboratorio"]'::jsonb;
  end if;
  return jsonb_build_object(
    'limit_per_day', public.story_limit_per_day(),
    'archive_days', public.story_archive_days(),
    'places', v_places
  );
end;
$$;

create or replace function public.admin_set_story_settings(p_limit int, p_archive int, p_places jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.whisper_is_supreme(auth.uid()) then
    raise exception 'Solo el Admin Supremo puede cambiar esto';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 20 then raise exception 'El límite diario va de 1 a 20'; end if;
  if p_archive is null or p_archive < 0 or p_archive > 365 then raise exception 'Los días de archivo van de 0 a 365'; end if;
  if p_places is null or jsonb_typeof(p_places) <> 'array' or jsonb_array_length(p_places) > 20
     or exists (select 1 from jsonb_array_elements(p_places) e where jsonb_typeof(e) <> 'string' or char_length(e #>> '{}') > 40) then
    raise exception 'La lista de lugares no es válida (máximo 20, de hasta 40 caracteres)';
  end if;
  insert into public.app_settings (key, value, updated_at, updated_by) values
    ('stories_limit_per_day', to_jsonb(p_limit), now(), auth.uid()),
    ('stories_archive_days',  to_jsonb(p_archive), now(), auth.uid()),
    ('story_places',          p_places, now(), auth.uid())
  on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = auth.uid();
end;
$$;

-- 4.17 Bandeja de mensajes: si el último mensaje es una respuesta a una historia, se nota
--      (misma firma de siempre; solo cambia el texto de «last_content»)
create or replace function public.dm_inbox(p_requests boolean default false)
returns table (
  conversation_id uuid,
  status          text,
  initiator_id    uuid,
  other_id        uuid,
  other_username  text,
  other_id_student text,
  other_avatar_url text,
  nickname        text,
  last_message_at timestamptz,
  last_content    text,
  last_sender_id  uuid,
  last_deleted    boolean,
  unread_count    int
)
language sql stable security definer set search_path = public as $$
  select
    c.id, c.status, c.initiator_id,
    p.id, p.username, p.id_student, p.avatar_url,
    m.other_nickname,
    lm.created_at,
    case
      when lm.story_id is not null and lm.sender_id <> auth.uid() then '📖 Respondió a tu historia: ' || lm.content
      when lm.story_id is not null then '📖 Respondiste a su historia: ' || lm.content
      when lm.image_path is not null and btrim(lm.content) = '' then '📷 Foto'
      else lm.content
    end,
    lm.sender_id, (lm.deleted_at is not null),
    (select count(*)::int from public.messages x
      where x.conversation_id = c.id
        and x.sender_id <> auth.uid()
        and x.deleted_at is null
        and x.created_at > m.last_read_at
        and (m.hidden_at is null or x.created_at > m.hidden_at))
  from public.conversations c
  join public.conversation_members m on m.conversation_id = c.id and m.user_id = auth.uid()
  join public.profiles p on p.id = case when c.user_a = auth.uid() then c.user_b else c.user_a end
  left join lateral (
    select x.created_at, x.content, x.sender_id, x.deleted_at, x.image_path, x.story_id
    from public.messages x
    where x.conversation_id = c.id and (m.hidden_at is null or x.created_at > m.hidden_at)
    order by x.created_at desc
    limit 1
  ) lm on true
  where auth.uid() in (c.user_a, c.user_b)
    and lm.sender_id is not null
    and not public.is_blocked_between(c.user_a, c.user_b)
    and (
      (not p_requests and (c.status = 'accepted' or c.initiator_id = auth.uid()))
      or (p_requests and c.status = 'pending' and c.initiator_id <> auth.uid())
    )
  order by lm.created_at desc;
$$;


-- =====================================================================
-- 5) SEGURIDAD (RLS) Y AVISOS
-- =====================================================================
alter table public.stories          enable row level security;
alter table public.story_views      enable row level security;
alter table public.story_likes      enable row level security;
alter table public.highlights       enable row level security;
alter table public.highlight_items  enable row level security;
alter table public.story_reports    enable row level security;
alter table public.story_mutes      enable row level security;

revoke all on public.stories, public.story_views, public.story_likes, public.highlights,
              public.highlight_items, public.story_reports, public.story_mutes from anon, authenticated;

-- Historias: se leen solo si story_visible. NO hay insert / update / delete directos: todo por funciones.
drop policy if exists "stories_select" on public.stories;
create policy "stories_select" on public.stories
  for select to authenticated using (public.story_visible(id, auth.uid()));
grant select on public.stories to authenticated;

-- Vistas: sin lectura directa (se leen con story_viewers); se insertan solo con story_mark_viewed.

-- Likes: los ve quien puede ver la historia; solo se da like a una historia ajena, activa y visible
drop policy if exists "story_likes_select" on public.story_likes;
create policy "story_likes_select" on public.story_likes
  for select to authenticated using (public.story_visible(story_id, auth.uid()));
drop policy if exists "story_likes_insert" on public.story_likes;
create policy "story_likes_insert" on public.story_likes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.stories s
      where s.id = story_id and s.user_id <> auth.uid() and s.deleted_at is null and s.expires_at > now()
        and public.story_visible(s.id, auth.uid())
    )
  );
drop policy if exists "story_likes_delete_own" on public.story_likes;
create policy "story_likes_delete_own" on public.story_likes
  for delete to authenticated using (user_id = auth.uid());
grant select on public.story_likes to authenticated;
grant insert (story_id, user_id) on public.story_likes to authenticated;
grant delete on public.story_likes to authenticated;

-- Destacadas: sin acceso directo (se leen con profile_highlights / highlight_stories y se escriben con highlight_*)

-- Reportes: solo el equipo con «ver reportes»
drop policy if exists "story_reports_select" on public.story_reports;
create policy "story_reports_select" on public.story_reports
  for select to authenticated using (public.whisper_has_perm(auth.uid(), 'view_reports'));
grant select on public.story_reports to authenticated;

-- Silenciadas: cada quien ve y maneja SOLO las suyas
drop policy if exists "story_mutes_select" on public.story_mutes;
create policy "story_mutes_select" on public.story_mutes
  for select to authenticated using (user_id = auth.uid());
grant select on public.story_mutes to authenticated;

-- Límite de likes: máximo 60 por minuto por persona
create or replace function public.trg_story_like_before()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.story_likes l
       where l.user_id = new.user_id and l.created_at > now() - interval '1 minute') >= 60 then
    raise exception 'Vas muy rápido. Espera un momento';
  end if;
  return new;
end;
$$;
drop trigger if exists story_like_before on public.story_likes;
create trigger story_like_before before insert on public.story_likes
  for each row execute function public.trg_story_like_before();

-- Like en una historia → aviso para su dueño (respeta el interruptor «story_likes»).
-- Si algo falla dentro del trigger, el like se guarda igual.
create or replace function public.trg_notify_story_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
begin
  begin
    select user_id into v_owner from public.stories where id = new.story_id;
    if public.notif_should_send(v_owner, new.user_id, 'story_likes') then
      insert into public.notifications (recipient_id, actor_id, type, story_id)
      values (v_owner, new.user_id, 'like_story', new.story_id)
      on conflict do nothing;
    end if;
  exception when others then
    null;
  end;
  return new;
end;
$$;
create or replace function public.trg_cleanup_story_like()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications
   where type = 'like_story' and actor_id = old.user_id and story_id = old.story_id;
  return old;
end;
$$;
drop trigger if exists notify_story_like on public.story_likes;
create trigger notify_story_like after insert on public.story_likes
  for each row execute function public.trg_notify_story_like();
drop trigger if exists cleanup_story_like on public.story_likes;
create trigger cleanup_story_like after delete on public.story_likes
  for each row execute function public.trg_cleanup_story_like();

-- Permisos de ejecución: solo personas con sesión (nunca anónimos)
revoke execute on function
  public.story_quota(), public.story_visible(uuid, uuid), public.story_media_can_view(text, uuid),
  public.story_create(text, text, int, int, jsonb, jsonb, jsonb, int, int, int, text),
  public.story_to_json(public.stories, uuid), public.stories_of_user(uuid), public.stories_tray(),
  public.story_mark_viewed(uuid), public.story_viewers(uuid, int, int), public.story_activity_counts(uuid),
  public.story_delete(uuid), public.story_reply(uuid, text), public.story_card(uuid),
  public.story_mute_toggle(uuid, boolean), public.stories_ring_status(uuid[]), public.story_archive(int, timestamptz),
  public.highlight_save(uuid, text, jsonb, uuid[]), public.highlight_toggle_story(uuid, uuid, boolean),
  public.highlight_delete(uuid), public.highlight_reorder(uuid[]), public.profile_highlights(uuid),
  public.highlight_stories(uuid), public.story_report(uuid, text, text),
  public.story_report_resolve(uuid, text, text), public.story_settings(),
  public.admin_set_story_settings(int, int, jsonb), public.dm_inbox(boolean)
  from public, anon;
grant execute on function
  public.story_quota(), public.story_visible(uuid, uuid), public.story_media_can_view(text, uuid),
  public.story_create(text, text, int, int, jsonb, jsonb, jsonb, int, int, int, text),
  public.story_to_json(public.stories, uuid), public.stories_of_user(uuid), public.stories_tray(),
  public.story_mark_viewed(uuid), public.story_viewers(uuid, int, int), public.story_activity_counts(uuid),
  public.story_delete(uuid), public.story_reply(uuid, text), public.story_card(uuid),
  public.story_mute_toggle(uuid, boolean), public.stories_ring_status(uuid[]), public.story_archive(int, timestamptz),
  public.highlight_save(uuid, text, jsonb, uuid[]), public.highlight_toggle_story(uuid, uuid, boolean),
  public.highlight_delete(uuid), public.highlight_reorder(uuid[]), public.profile_highlights(uuid),
  public.highlight_stories(uuid), public.story_report(uuid, text, text),
  public.story_report_resolve(uuid, text, text), public.story_settings(),
  public.admin_set_story_settings(int, int, jsonb), public.dm_inbox(boolean)
  to authenticated;


-- =====================================================================
-- 6) STORAGE
-- =====================================================================

-- 6.1 story-media: bucket PRIVADO (nadie ve una foto con un enlace público). 3 MB y solo JPEG / WebP.
insert into storage.buckets (id, name, public)
values ('story-media', 'story-media', false)
on conflict (id) do nothing;

do $$
begin
  update storage.buckets
     set file_size_limit = 3145728,
         allowed_mime_types = array['image/jpeg', 'image/webp']
   where id = 'story-media';
exception when others then null;
end;
$$;

-- Subir: solo en TU carpeta (la primera carpeta de la ruta es tu id)
drop policy if exists "story_media_insert" on storage.objects;
create policy "story_media_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'story-media' and split_part(name, '/', 1) = auth.uid()::text);

-- Ver: solo si story_media_can_view (vuelve a comprobar el vencimiento en cada lectura)
drop policy if exists "story_media_select" on storage.objects;
create policy "story_media_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'story-media' and public.story_media_can_view(name, auth.uid()));

-- Borrar: solo el dueño de la carpeta
drop policy if exists "story_media_delete" on storage.objects;
create policy "story_media_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'story-media' and split_part(name, '/', 1) = auth.uid()::text);

-- 6.2 highlight-covers: igual que «avatars» (lectura pública, escritura solo en tu carpeta).
--     Aquí van las portadas YA recortadas (400×400). La portada la puede ver cualquiera que vea tu perfil.
insert into storage.buckets (id, name, public)
values ('highlight-covers', 'highlight-covers', true)
on conflict (id) do nothing;

do $$
begin
  update storage.buckets
     set file_size_limit = 1048576,
         allowed_mime_types = array['image/jpeg', 'image/webp']
   where id = 'highlight-covers';
exception when others then null;
end;
$$;

drop policy if exists "highlight_covers_select" on storage.objects;
create policy "highlight_covers_select" on storage.objects
  for select using (bucket_id = 'highlight-covers');
drop policy if exists "highlight_covers_insert" on storage.objects;
create policy "highlight_covers_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'highlight-covers' and split_part(name, '/', 1) = auth.uid()::text);
drop policy if exists "highlight_covers_update" on storage.objects;
create policy "highlight_covers_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'highlight-covers' and split_part(name, '/', 1) = auth.uid()::text);
drop policy if exists "highlight_covers_delete" on storage.objects;
create policy "highlight_covers_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'highlight-covers' and split_part(name, '/', 1) = auth.uid()::text);


-- =====================================================================
-- 7) BORRADO REAL (cron)
-- =====================================================================
-- Candidatos a borrarse de verdad. Una historia es candidata si:
--   (a) fue eliminada, o (b) ya pasó su vencimiento + los días de archivo,
--   Y además: no está en ninguna destacada, NO tiene un reporte pendiente, y su archivo sigue sin borrar.
create or replace function public.story_purge_candidates(p_limit int default 200)
returns table (id uuid, media_path text)
language sql stable security definer set search_path = public as $$
  select s.id, s.media_path
  from public.stories s
  where s.media_purged_at is null
    and (
      s.deleted_at is not null
      or s.expires_at + make_interval(days => public.story_archive_days()) <= now()
    )
    and not exists (select 1 from public.highlight_items hi where hi.story_id = s.id)
    and not exists (select 1 from public.story_reports r where r.story_id = s.id and r.status = 'pending')
  order by s.expires_at
  limit greatest(1, least(coalesce(p_limit, 200), 500));
$$;

-- Marca como borradas y VACÍA el contenido (la fila queda como esqueleto para que mensajes y avisos viejos no se rompan)
create or replace function public.story_mark_purged(p_ids uuid[])
returns void
language sql security definer set search_path = public as $$
  update public.stories
     set media_purged_at = now(), media_path = null, elements = '[]'::jsonb, music = null, bg = null
   where id = any (p_ids) and media_purged_at is null;
$$;

revoke execute on function public.story_purge_candidates(int), public.story_mark_purged(uuid[]) from public, anon, authenticated;
grant execute on function public.story_purge_candidates(int), public.story_mark_purged(uuid[]) to service_role;

-- BORRADO REAL DEL STORAGE (cron job)
--   La privacidad NO depende del cron: story_visible y las políticas de Storage comprueban expires_at en
--   cada lectura. El cron solo libera espacio. Está en  app/api/cron/story-purge/route.ts  y usa el mismo
--   CRON_SECRET que ya configuraste para el de las fotos de mensajes. Para programarlo (cada hora):
--
--     1) Supabase → Database → Extensions: pg_cron y pg_net ya deberían estar activas (las usó la v1.1.0).
--     2) Corre esto UNA vez (cambia TU-DOMINIO y TU-CLAVE):
--
--        select cron.schedule(
--          'story-purge-hourly', '0 * * * *',
--          $$ select net.http_post(
--               url     := 'https://TU-DOMINIO/api/cron/story-purge',
--               headers := '{"Authorization": "Bearer TU-CLAVE"}'::jsonb
--             ) $$
--        );
--
--     Para ver o quitar el cron job:  select * from cron.job;   select cron.unschedule('story-purge-hourly');


-- =====================================================================
-- 8) VALORES POR DEFECTO Y RECARGA DEL ESQUEMA
-- =====================================================================
-- (Solo se crean si no existen; el Admin Supremo los cambia en Centro de Mando → Sistema.)
insert into public.app_settings (key, value) values ('stories_limit_per_day', to_jsonb(3))
  on conflict (key) do nothing;
insert into public.app_settings (key, value) values ('stories_archive_days', to_jsonb(30))
  on conflict (key) do nothing;
insert into public.app_settings (key, value)
  values ('story_places', '["Biblioteca","Cafetería","Patio","Gimnasio","Salón de clases","Laboratorio"]'::jsonb)
  on conflict (key) do nothing;

notify pgrst, 'reload schema';

-- Listo. Puedes comprobarlo con:  select * from public.story_settings();
