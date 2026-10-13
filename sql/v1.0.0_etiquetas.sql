-- =====================================================================
-- DaiwaPlace v1.0.0 — Etiquetas (@menciones)
-- Pégalo completo en Supabase → SQL Editor → New query → Run.
-- Es seguro correrlo más de una vez (no duplica nada).
-- Requiere haber corrido antes los SQL de la v0.11.0 a la v0.13.0 (ya los tienes).
--
-- Qué hace:
--   · Notificaciones nuevas: te etiquetaron en una publicación, en un comentario,
--     en una confesión del Muro (anónimo: "Chismoso Anónimo") o en un comentario del Muro.
--   · Detecta los @usuario escritos en publicaciones y comentarios (también al editar:
--     solo avisa por las etiquetas NUEVAS).
--   · Respeta: bloqueos, el aviso "Etiquetas" que cada quien puede apagar en Configuración
--     y la privacidad "solo seguidores" (si tu publicación es solo para seguidores,
--     no se avisa a quien no pueda verla).
--   · Límite anti-spam: máximo 5 etiquetas por publicación/comentario y 3 en el Muro.
-- =====================================================================

-- 1) TIPOS NUEVOS DE NOTIFICACIÓN --------------------------------------
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'like_post','like_comment','comment','reply','follow','like_note','whisper_comment','whisper_reply',
    'mention_post','mention_comment','whisper_mention','whisper_comment_mention'
  ));

-- Anti-duplicados: a una persona se le avisa una sola vez por cada publicación/comentario
create unique index if not exists notifications_uniq_mention_post
  on public.notifications (recipient_id, post_id) where type = 'mention_post';
create unique index if not exists notifications_uniq_mention_comment
  on public.notifications (recipient_id, comment_id) where type = 'mention_comment';
create unique index if not exists notifications_uniq_whisper_mention
  on public.notifications (recipient_id, whisper_id) where type = 'whisper_mention';
create unique index if not exists notifications_uniq_whisper_comment_mention
  on public.notifications (recipient_id, whisper_comment_id) where type = 'whisper_comment_mention';


-- 2) FUNCIONES DE APOYO --------------------------------------------------

-- 2.1 Saca del texto los @usuario que existen de verdad y devuelve sus ids.
--     (sin repetidos, sin contarte a ti mismo, con un máximo)
create or replace function public.extract_mentioned_ids(p_text text, p_author uuid, p_max int default 5)
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(x.id), '{}'::uuid[])
  from (
    select p.id
    from (
      select distinct lower(regexp_replace(g[2], '\.+$', '')) as uname
      from regexp_matches(coalesce(p_text, ''), '(^|[^A-Za-z0-9_.@])@([A-Za-z0-9_.]{3,24})', 'g') as m(g)
    ) t
    join public.profiles p on lower(p.username) = t.uname
    where p.id is distinct from p_author
    limit greatest(p_max, 0)
  ) x;
$$;

-- 2.2 ¿Puede esta persona ver las publicaciones de su dueño?
--     (si el dueño las dejó "solo para seguidores", solo sus seguidores las ven)
create or replace function public.can_view_posts_of(p_viewer uuid, p_owner uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_vis text;
begin
  if p_viewer is null or p_owner is null then return false; end if;
  if p_viewer = p_owner then return true; end if;
  select coalesce(posts_visibility, 'public') into v_vis from public.profiles where id = p_owner;
  if not found then return false; end if;
  if v_vis <> 'followers' then return true; end if;
  return exists (select 1 from public.follows where follower_id = p_viewer and following_id = p_owner);
end;
$$;


-- 3) ETIQUETAS EN PUBLICACIONES -------------------------------------------
create or replace function public.trg_notify_post_mentions()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_new uuid[];
  v_old uuid[] := '{}';
  v_id  uuid;
begin
  begin
    v_new := public.extract_mentioned_ids(new.content, new.user_id, 5);

    if tg_op = 'UPDATE' then
      v_old := public.extract_mentioned_ids(old.content, old.user_id, 5);
      -- si quitó una etiqueta al editar, el aviso desaparece
      delete from public.notifications
       where type = 'mention_post' and post_id = new.id and not (recipient_id = any (v_new));
    end if;

    foreach v_id in array v_new loop
      if not (v_id = any (v_old))
         and public.can_view_posts_of(v_id, new.user_id)
         and public.notif_should_send(v_id, new.user_id, 'tags') then
        insert into public.notifications (recipient_id, actor_id, type, post_id)
        values (v_id, new.user_id, 'mention_post', new.id)
        on conflict do nothing;
      end if;
    end loop;
  exception when others then
    null;   -- un fallo aquí nunca impide publicar
  end;
  return new;
end;
$$;

drop trigger if exists notify_post_mentions_ins on public.posts;
create trigger notify_post_mentions_ins after insert on public.posts
  for each row execute function public.trg_notify_post_mentions();
drop trigger if exists notify_post_mentions_upd on public.posts;
create trigger notify_post_mentions_upd after update of content on public.posts
  for each row when (old.content is distinct from new.content)
  execute function public.trg_notify_post_mentions();


-- 4) ETIQUETAS EN COMENTARIOS ---------------------------------------------
-- Si la persona etiquetada ya recibe el aviso normal de ese comentario ("comentó tu
-- publicación" o "respondió tu comentario"), no se le manda uno doble.
-- (El nombre del trigger va después de "notify_comment" para que corra después de él.)
create or replace function public.trg_notify_comment_mentions()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_new        uuid[];
  v_old        uuid[] := '{}';
  v_id         uuid;
  v_post_owner uuid;
begin
  begin
    select user_id into v_post_owner from public.posts where id = new.post_id;
    v_new := public.extract_mentioned_ids(new.content, new.user_id, 5);

    if tg_op = 'UPDATE' then
      v_old := public.extract_mentioned_ids(old.content, old.user_id, 5);
      delete from public.notifications
       where type = 'mention_comment' and comment_id = new.id and not (recipient_id = any (v_new));
    end if;

    foreach v_id in array v_new loop
      if not (v_id = any (v_old))
         and public.can_view_posts_of(v_id, v_post_owner)
         and public.notif_should_send(v_id, new.user_id, 'tags')
         and not exists (
           select 1 from public.notifications
            where comment_id = new.id and recipient_id = v_id and type in ('comment','reply')
         ) then
        insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id)
        values (v_id, new.user_id, 'mention_comment', new.post_id, new.id)
        on conflict do nothing;
      end if;
    end loop;
  exception when others then
    null;
  end;
  return new;
end;
$$;

drop trigger if exists notify_comment_mentions_ins on public.comments;
create trigger notify_comment_mentions_ins after insert on public.comments
  for each row execute function public.trg_notify_comment_mentions();
drop trigger if exists notify_comment_mentions_upd on public.comments;
create trigger notify_comment_mentions_upd after update of content on public.comments
  for each row when (old.content is distinct from new.content)
  execute function public.trg_notify_comment_mentions();


-- 5) ETIQUETAS EN EL MURO DE LOS SUSURROS --------------------------------
-- Se vuelven a crear las dos funciones del Muro (son iguales a las de la v0.13.0, solo que
-- ahora además avisan a las personas etiquetadas). Los permisos que ya tenían se mantienen.

create or replace function public.whisper_create(p_content text, p_category text default 'confesion')
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me     uuid := auth.uid();
  v_text text := btrim(coalesce(p_content, ''));
  v_id   uuid;
  v_ids  uuid[];
  v_t    uuid;
begin
  perform public.whisper_guard(me);
  if char_length(v_text) < 5 or char_length(v_text) > 1000 then
    raise exception 'La confesión debe tener entre 5 y 1000 caracteres';
  end if;
  perform public.whisper_check_text(v_text);
  if p_category is null or p_category not in ('confesion','crush','chisme','pregunta','otro') then
    p_category := 'confesion';
  end if;

  if (select count(*) from public.whisper_authors where user_id = me and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'Llegaste al límite de 5 confesiones por día. Vuelve mañana';
  end if;
  if exists (select 1 from public.whisper_authors where user_id = me and created_at > now() - interval '1 minute') then
    raise exception 'Espera un minuto antes de publicar otra confesión';
  end if;

  insert into public.whispers (content, category) values (v_text, p_category) returning id into v_id;
  insert into public.whisper_authors (whisper_id, user_id) values (v_id, me);

  -- Etiquetas (@usuario): aviso ANÓNIMO a cada persona etiquetada (máximo 3 por confesión).
  -- Si te bloqueó, o apagó las etiquetas, simplemente no le llega nada (y tú no te enteras).
  begin
    v_ids := public.extract_mentioned_ids(v_text, me, 3);
    foreach v_t in array v_ids loop
      if public.notif_should_send(v_t, me, 'tags') then
        insert into public.notifications (recipient_id, actor_id, type, whisper_id, anonymous)
        values (v_t, v_t, 'whisper_mention', v_id, true)   -- el actor es solo un relleno: nunca se muestra
        on conflict do nothing;
      end if;
    end loop;
  exception when others then
    null;   -- un fallo en los avisos nunca impide publicar
  end;

  return v_id;
end;
$$;

create or replace function public.whisper_comment_create(
  p_whisper uuid, p_content text, p_parent uuid default null, p_anonymous boolean default true)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me            uuid := auth.uid();
  v_text        text := btrim(coalesce(p_content, ''));
  v_id          uuid;
  v_is_op       boolean := false;
  v_n           int := null;
  v_post_owner  uuid;
  v_parent_owner uuid;
  v_pref_ok     boolean;
  v_ids         uuid[];
  v_t           uuid;
begin
  perform public.whisper_guard(me);
  if char_length(v_text) < 1 or char_length(v_text) > 500 then
    raise exception 'El comentario debe tener entre 1 y 500 caracteres';
  end if;
  perform public.whisper_check_text(v_text);

  if not exists (select 1 from public.whispers where id = p_whisper and status = 'visible') then
    raise exception 'Esta confesión no está disponible';
  end if;
  if p_parent is not null and not exists (
    select 1 from public.whisper_comments
     where id = p_parent and whisper_id = p_whisper and deleted_at is null and status = 'visible'
  ) then
    raise exception 'El comentario al que respondes ya no está disponible';
  end if;

  if (select count(*) from public.whisper_comment_authors where user_id = me and created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'Estás comentando muy rápido. Espera unos minutos';
  end if;

  select user_id into v_post_owner from public.whisper_authors where whisper_id = p_whisper;

  if p_anonymous then
    if v_post_owner = me then
      v_is_op := true;            -- el autor de la confesión: se marca "Autor" sin revelar quién es
    else
      perform pg_advisory_xact_lock(hashtext(p_whisper::text));
      select n into v_n from public.whisper_aliases where whisper_id = p_whisper and user_id = me;
      if v_n is null then
        select coalesce(max(n), 0) + 1 into v_n from public.whisper_aliases where whisper_id = p_whisper;
        insert into public.whisper_aliases (whisper_id, user_id, n) values (p_whisper, me, v_n);
      end if;
    end if;
  end if;

  insert into public.whisper_comments (whisper_id, parent_comment_id, content, is_anonymous, author_id, anon_n, is_op)
  values (p_whisper, p_parent, v_text, p_anonymous, case when p_anonymous then null else me end, v_n, v_is_op)
  returning id into v_id;
  insert into public.whisper_comment_authors (comment_id, user_id) values (v_id, me);

  -- Avisos: a quien escribió el comentario respondido y/o a quien escribió la confesión
  if p_parent is not null then
    select user_id into v_parent_owner from public.whisper_comment_authors where comment_id = p_parent;
  end if;

  begin
    if v_parent_owner is not null and v_parent_owner <> me then
      select coalesce((notif_prefs ->> 'whispers')::boolean, true) into v_pref_ok from public.profiles where id = v_parent_owner;
      if coalesce(v_pref_ok, true)
         and (p_anonymous or not public.is_blocked_between(me, v_parent_owner)) then
        insert into public.notifications (recipient_id, actor_id, type, whisper_id, whisper_comment_id, anonymous)
        values (v_parent_owner, case when p_anonymous then v_parent_owner else me end, 'whisper_reply', p_whisper, v_id, p_anonymous)
        on conflict do nothing;
      end if;
    end if;

    if v_post_owner is not null and v_post_owner <> me and v_post_owner is distinct from v_parent_owner then
      select coalesce((notif_prefs ->> 'whispers')::boolean, true) into v_pref_ok from public.profiles where id = v_post_owner;
      if coalesce(v_pref_ok, true)
         and (p_anonymous or not public.is_blocked_between(me, v_post_owner)) then
        insert into public.notifications (recipient_id, actor_id, type, whisper_id, whisper_comment_id, anonymous)
        values (v_post_owner, case when p_anonymous then v_post_owner else me end, 'whisper_comment', p_whisper, v_id, p_anonymous)
        on conflict do nothing;
      end if;
    end if;
  exception when others then
    null;   -- un fallo en los avisos nunca impide comentar
  end;

  -- Etiquetas (@usuario) dentro del comentario (máximo 3). Si la persona ya recibe el aviso de
  -- "comentaron tu confesión / respondieron tu comentario" por este mismo comentario, no se duplica.
  begin
    v_ids := public.extract_mentioned_ids(v_text, me, 3);
    foreach v_t in array v_ids loop
      if public.notif_should_send(v_t, me, 'tags')
         and not exists (
           select 1 from public.notifications
            where whisper_comment_id = v_id and recipient_id = v_t and type in ('whisper_comment','whisper_reply')
         ) then
        insert into public.notifications (recipient_id, actor_id, type, whisper_id, whisper_comment_id, anonymous)
        values (v_t, case when p_anonymous then v_t else me end, 'whisper_comment_mention', p_whisper, v_id, p_anonymous)
        on conflict do nothing;
      end if;
    end loop;
  exception when others then
    null;
  end;

  return v_id;
end;
$$;


-- 6) PERMISOS -----------------------------------------------------------------
-- Las funciones de apoyo solo las usan los triggers y las funciones del Muro, no el navegador.
revoke execute on function public.extract_mentioned_ids(text, uuid, int) from public, anon, authenticated;
revoke execute on function public.can_view_posts_of(uuid, uuid)        from public, anon, authenticated;

-- Listo. Para probarlo: etiqueta a alguien con @usuario en una publicación y mira
--   select type, recipient_id, post_id from public.notifications where type like '%mention%';
