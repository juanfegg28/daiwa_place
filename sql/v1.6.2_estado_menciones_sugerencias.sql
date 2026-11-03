-- =====================================================================
-- DaiwaPlace v1.6.2 — Estado · Menciones en historias · Sugerencias de seguimiento
-- Pégalo COMPLETO en Supabase → SQL Editor → New query → Run.
-- Es seguro correrlo más de una vez (no duplica nada).
-- =====================================================================

-- =====================================================================
-- 1) ESTADO (tipo «mood» de SpaceHey: «Estado: Vegetal»)
--    Cada persona tiene UN estado a la vez. Aparece en su perfil y, si es
--    nuevo (últimos 3 días), como una tarjetita en el Inicio de quienes la ven.
-- =====================================================================
create table if not exists public.user_status (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  emoji      text,
  text       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_status_text_len  check (char_length(btrim(text)) between 1 and 60),
  constraint user_status_emoji_len check (emoji is null or char_length(emoji) <= 16)
);
create index if not exists user_status_updated_idx on public.user_status (updated_at desc);

create table if not exists public.status_likes (
  status_user_id uuid not null references public.user_status(user_id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (status_user_id, user_id)
);

-- Todo pasa por funciones (RPC): nadie escribe estas tablas directo desde el navegador
alter table public.user_status  enable row level security;
alter table public.status_likes enable row level security;
revoke all on public.user_status, public.status_likes from anon, authenticated;

-- Poner o cambiar mi estado. Al cambiarlo, los «me gusta» del estado anterior se borran.
create or replace function public.status_set(p_emoji text, p_text text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me     uuid := auth.uid();
  v_text text := btrim(regexp_replace(coalesce(p_text, ''), '\s+', ' ', 'g'));
  v_emo  text := nullif(btrim(coalesce(p_emoji, '')), '');
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;
  if exists (select 1 from public.profiles where id = me and coalesce(is_frozen, false)) then
    raise exception 'Tu cuenta está congelada';
  end if;
  if char_length(v_text) < 1 then raise exception 'Escribe tu estado'; end if;
  if char_length(v_text) > 60 then raise exception 'El estado puede tener máximo 60 caracteres'; end if;
  if v_emo is not null and char_length(v_emo) > 16 then raise exception 'Ese emoji no es válido'; end if;

  -- freno anti-spam: no se puede cambiar el estado más de una vez cada 5 segundos
  if exists (
    select 1 from public.user_status s
     where s.user_id = me and s.updated_at > now() - interval '5 seconds'
  ) then
    raise exception 'Vas muy rápido. Espera un momento';
  end if;

  delete from public.status_likes where status_user_id = me;
  insert into public.user_status (user_id, emoji, text, created_at, updated_at)
  values (me, v_emo, v_text, now(), now())
  on conflict (user_id) do update
     set emoji = excluded.emoji, text = excluded.text, created_at = now(), updated_at = now();

  return jsonb_build_object('user_id', me, 'emoji', v_emo, 'text', v_text, 'updated_at', now(), 'like_count', 0, 'liked_by_me', false);
end;
$$;

create or replace function public.status_clear()
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  delete from public.user_status where user_id = auth.uid();
end;
$$;

-- El estado de una persona (null si no tiene, o si yo no puedo verlo)
create or replace function public.status_get(p_user uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
           'user_id', s.user_id, 'emoji', s.emoji, 'text', s.text, 'updated_at', s.updated_at,
           'like_count', (select count(*) from public.status_likes l where l.status_user_id = s.user_id),
           'liked_by_me', exists (select 1 from public.status_likes l where l.status_user_id = s.user_id and l.user_id = auth.uid())
         )
    from public.user_status s
   where s.user_id = p_user
     and auth.uid() is not null
     and public.author_visible_to(s.user_id, auth.uid())
     and not exists (select 1 from public.profiles pr where pr.id = s.user_id and coalesce(pr.is_frozen, false));
$$;

-- Estados nuevos para el Inicio: los míos y los de la gente que sigo (últimos p_days días)
create or replace function public.status_feed(p_limit int default 20, p_days int default 3)
returns table (
  user_id uuid, username text, id_student text, avatar_url text,
  emoji text, text text, updated_at timestamptz, like_count int, liked_by_me boolean
)
language sql stable security definer set search_path = public as $$
  select s.user_id, p.username, p.id_student, p.avatar_url, s.emoji, s.text, s.updated_at,
         (select count(*)::int from public.status_likes l where l.status_user_id = s.user_id),
         exists (select 1 from public.status_likes l where l.status_user_id = s.user_id and l.user_id = auth.uid())
    from public.user_status s
    join public.profiles p on p.id = s.user_id
   where auth.uid() is not null
     and s.updated_at > now() - make_interval(days => greatest(1, least(coalesce(p_days, 3), 14)))
     and not coalesce(p.is_frozen, false)
     and (
       s.user_id = auth.uid()
       or (
         exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = s.user_id)
         and public.author_visible_to(s.user_id, auth.uid())
         and not exists (select 1 from public.muted_users m where m.user_id = auth.uid() and m.muted_user_id = s.user_id)
       )
     )
   order by s.updated_at desc
   limit greatest(1, least(coalesce(p_limit, 20), 60));
$$;

-- «Me gusta» al estado de alguien (un toque da, otro quita). Devuelve true si QUEDÓ con like.
create or replace function public.status_like_toggle(p_owner uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;
  if not exists (select 1 from public.user_status where user_id = p_owner) then
    raise exception 'Ese estado ya no existe';
  end if;
  if exists (select 1 from public.status_likes where status_user_id = p_owner and user_id = me) then
    delete from public.status_likes where status_user_id = p_owner and user_id = me;
    return false;
  end if;
  if p_owner <> me and (public.is_blocked_between(me, p_owner) or not public.author_visible_to(p_owner, me)) then
    raise exception 'No puedes reaccionar a este estado';
  end if;
  insert into public.status_likes (status_user_id, user_id) values (p_owner, me) on conflict do nothing;
  return true;
end;
$$;

revoke execute on function public.status_set(text, text), public.status_clear(), public.status_get(uuid),
  public.status_feed(int, int), public.status_like_toggle(uuid) from public, anon;
grant execute on function public.status_set(text, text), public.status_clear(), public.status_get(uuid),
  public.status_feed(int, int), public.status_like_toggle(uuid) to authenticated;


-- =====================================================================
-- 2) MENCIONES (@usuario) EN HISTORIAS
--    Nueva capa «mention» en las historias. Máximo 5 por historia.
--    La persona mencionada recibe un aviso y puede ver esa historia aunque no
--    siga a quien la publicó (solo si la audiencia es «seguidores»; en una
--    historia «solo amigos» únicamente la ven los amigos, como siempre).
-- =====================================================================

-- 2.1 Validación de las capas: ahora acepta «mention» (y limita a 5)
create or replace function public.story_elements_valid(p jsonb)
returns boolean
language sql immutable as $$
  select case when p is not null and jsonb_typeof(p) = 'array' then (
    jsonb_array_length(p) <= 20
    and char_length(p::text) <= 12000
    and (select count(*) from jsonb_array_elements(p) m where m ->> 'type' = 'mention') <= 5
    and not exists (
      select 1 from jsonb_array_elements(p) e
      where not (
        jsonb_typeof(e) = 'object'
        and (e ->> 'type') in ('text', 'emoji', 'music', 'location', 'time', 'mention')
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
        and case when (e ->> 'type') = 'mention'
              then (jsonb_typeof(e -> 'username') = 'string' and char_length(e ->> 'username') between 1 and 32
                    and jsonb_typeof(e -> 'user_id') = 'string' and (e ->> 'user_id') ~* '^[0-9a-f-]{36}$')
              else true end
      )
    )
  ) else false end;
$$;

-- 2.2 ¿Quién puede ver una historia? (igual que antes + la persona mencionada)
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
          and (
            exists (select 1 from public.follows f where f.follower_id = p_viewer and f.following_id = s.user_id)
            -- v1.6.2: la persona mencionada la ve aunque no siga al dueño (solo audiencia «seguidores»)
            or (
              s.audience = 'followers'
              and exists (
                select 1 from jsonb_array_elements(s.elements) e
                where e ->> 'type' = 'mention' and e ->> 'user_id' = p_viewer::text
              )
            )
          )
          and (s.audience = 'followers' or public.are_friends(p_viewer, s.user_id))
          and (s.expires_at > now()
               or exists (select 1 from public.highlight_items hi where hi.story_id = s.id))
        )
      )
  );
$$;

-- 2.3 Aviso nuevo: «@usuario te mencionó en su historia»
-- OJO: esta restricción se borra y se vuelve a crear en cada versión. Aquí van TODOS los tipos vigentes
-- (los de la v1.2.0) más el nuevo «mention_story».
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'like_post','like_comment','comment','reply','follow','like_note','whisper_comment','whisper_reply',
    'mention_post','mention_comment','whisper_mention','whisper_comment_mention',
    'club_approved','club_declined','club_join_request','club_join_accepted',
    'repost',
    'like_story',
    'mention_story'
  ));
create unique index if not exists notifications_uniq_mention_story
  on public.notifications (recipient_id, story_id) where type = 'mention_story';

-- 2.4 Al publicar la historia se avisa a cada persona mencionada (respeta el interruptor «Etiquetas»).
--     Si algo falla aquí dentro, la historia se publica igual.
create or replace function public.trg_notify_story_mentions()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_ids uuid[];
  v_id  uuid;
begin
  begin
    select coalesce(array_agg(distinct (e ->> 'user_id')::uuid), '{}'::uuid[])
      into v_ids
      from jsonb_array_elements(new.elements) e
     where e ->> 'type' = 'mention' and (e ->> 'user_id') ~* '^[0-9a-f-]{36}$';

    foreach v_id in array v_ids loop
      if v_id <> new.user_id
         and exists (select 1 from public.profiles where id = v_id)
         and public.story_visible(new.id, v_id)
         and public.notif_should_send(v_id, new.user_id, 'tags') then
        insert into public.notifications (recipient_id, actor_id, type, story_id)
        values (v_id, new.user_id, 'mention_story', new.id)
        on conflict do nothing;
      end if;
    end loop;
  exception when others then
    null;
  end;
  return new;
end;
$$;
drop trigger if exists notify_story_mentions on public.stories;
create trigger notify_story_mentions after insert on public.stories
  for each row execute function public.trg_notify_story_mentions();


-- =====================================================================
-- 3) SUGERENCIAS DE SEGUIMIENTO (para el Inicio)
--    Gente que siguen tus amigos y tú no, gente que ya te sigue y tú no,
--    gente de tus mismos clubes y miembros nuevos. Nunca salen: tú mismo,
--    a quien ya sigues, bloqueados (en ningún sentido), ocultados, cuentas
--    congeladas ni perfiles en Modo Fantasma. El orden tiene un poco de azar
--    para que no sean siempre los mismos.
-- =====================================================================
create or replace function public.follow_suggestions(p_limit int default 12)
returns table (
  user_id    uuid,
  username   text,
  id_student text,
  avatar_url text,
  reason     text,      -- 'friends' | 'follows_you' | 'club' | 'new'
  via_names  text[],    -- hasta 2 amigos que la siguen (solo si reason = 'friends')
  via_count  int
)
language plpgsql stable security definer set search_path = public as $$
declare
  me      uuid := auth.uid();
  v_limit int  := greatest(1, least(coalesce(p_limit, 12), 30));
begin
  if me is null then return; end if;

  return query
  with my_follows as (
    select f.following_id as id from public.follows f where f.follower_id = me
  ),
  excl as (
    select me as id
    union select mf.id from my_follows mf
    union select b.blocker_id from public.blocks b where b.blocked_id = me
    union select b.blocked_id from public.blocks b where b.blocker_id = me
    union select m.muted_user_id from public.muted_users m where m.user_id = me
  ),
  cand as (
    -- los que siguen mis seguidos (amigos primero)
    select f.following_id as uid, 'friends'::text as src, f.follower_id as via
      from public.follows f
      join my_follows mf on mf.id = f.follower_id
     where f.following_id not in (select id from excl)
    union all
    -- los que me siguen y yo no
    select f.follower_id, 'follows_you', null::uuid
      from public.follows f
     where f.following_id = me and f.follower_id not in (select id from excl)
    union all
    -- mis mismos clubes
    select m2.user_id, 'club', null::uuid
      from public.club_members m1
      join public.club_members m2 on m2.club_id = m1.club_id
     where m1.user_id = me and m2.user_id not in (select id from excl)
    union all
    -- miembros nuevos (de relleno)
    select nw.id, 'new', null::uuid
      from (
        select p.id
          from public.profiles p
         where p.id not in (select id from excl)
         order by p.created_at desc
         limit 30
      ) nw
  ),
  agg as (
    select c.uid,
           count(*) filter (where c.src = 'friends')::int  as n_friends,
           bool_or(c.src = 'follows_you')                  as follows_you,
           bool_or(c.src = 'club')                         as same_club,
           (array_agg(c.via) filter (where c.src = 'friends'))[1:2] as via_ids
      from cand c
     group by c.uid
  )
  select a.uid, p.username, p.id_student, p.avatar_url,
         case when a.n_friends > 0 then 'friends'
              when a.follows_you then 'follows_you'
              when a.same_club then 'club'
              else 'new' end,
         coalesce((select array_agg(coalesce(nullif(btrim(v.id_student), ''), v.username))
                     from public.profiles v where v.id = any (a.via_ids)), '{}'::text[]),
         a.n_friends
    from agg a
    join public.profiles p on p.id = a.uid
   where not coalesce(p.is_frozen, false)
     and not coalesce(p.ghost_mode, false)
   order by (least(a.n_friends, 5) * 3 + (case when a.follows_you then 5 else 0 end)
             + (case when a.same_club then 2 else 0 end) + random() * 4) desc
   limit v_limit;
end;
$$;

revoke execute on function public.follow_suggestions(int) from public, anon;
grant execute on function public.follow_suggestions(int) to authenticated;

-- Prueba rápida (opcional):
--   select * from public.follow_suggestions(6);
--   select public.story_elements_valid('[{"type":"mention","x":50,"y":50,"user_id":"00000000-0000-0000-0000-000000000000","username":"ana"}]'::jsonb);
