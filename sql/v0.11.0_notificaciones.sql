-- =====================================================================
-- DaiwaPlace v0.11.0 — Sistema de notificaciones
-- Pégalo completo en Supabase → SQL Editor → New query → Run.
-- Es seguro correrlo más de una vez (no duplica nada).
-- =====================================================================

-- 1) TABLA ------------------------------------------------------------
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null,   -- quién recibe el aviso
  actor_id     uuid not null,   -- quién hizo la acción
  type         text not null check (type in ('like_post','like_comment','comment','reply','follow')),
  post_id      uuid,            -- publicación involucrada (null en 'follow')
  comment_id   uuid,            -- comentario involucrado (like_comment, comment, reply)
  read         boolean not null default false,
  created_at   timestamptz not null default now(),
  constraint notifications_recipient_id_fkey foreign key (recipient_id) references public.profiles(id) on delete cascade,
  constraint notifications_actor_id_fkey     foreign key (actor_id)     references public.profiles(id) on delete cascade,
  constraint notifications_post_id_fkey      foreign key (post_id)      references public.posts(id)    on delete cascade,
  constraint notifications_comment_id_fkey   foreign key (comment_id)   references public.comments(id) on delete cascade
);

create index if not exists notifications_recipient_created_idx on public.notifications (recipient_id, created_at desc);
create index if not exists notifications_recipient_unread_idx  on public.notifications (recipient_id) where read = false;
create index if not exists notifications_post_idx              on public.notifications (post_id);
create index if not exists notifications_comment_idx           on public.notifications (comment_id);

-- Anti-duplicados: dar like, quitarlo y volver a darlo nunca llena la bandeja
create unique index if not exists notifications_uniq_like_post    on public.notifications (actor_id, post_id)    where type = 'like_post';
create unique index if not exists notifications_uniq_like_comment on public.notifications (actor_id, comment_id) where type = 'like_comment';
create unique index if not exists notifications_uniq_follow       on public.notifications (actor_id, recipient_id) where type = 'follow';
create unique index if not exists notifications_uniq_comment      on public.notifications (type, comment_id)     where type in ('comment','reply');


-- 2) SEGURIDAD (RLS) --------------------------------------------------
-- Cada persona solo ve, marca y borra SUS notificaciones.
-- Nadie puede crearlas desde el navegador: las crean los triggers de abajo.
alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select to authenticated using (recipient_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
  for delete to authenticated using (recipient_id = auth.uid());

revoke all on public.notifications from anon, authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read)  on public.notifications to authenticated;   -- solo se puede cambiar "leída"


-- 3) REGLAS: ¿se le debe avisar a esta persona? -----------------------
-- No avisa si: es uno mismo, la persona apagó ese tipo de aviso en
-- Configuración → Notificaciones, o hay un bloqueo entre las dos.
create or replace function public.notif_should_send(p_recipient uuid, p_actor uuid, p_pref text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_prefs jsonb;
begin
  if p_recipient is null or p_actor is null or p_recipient = p_actor then
    return false;
  end if;

  select notif_prefs into v_prefs from public.profiles where id = p_recipient;
  if not found then
    return false;
  end if;

  -- si la preferencia no existe todavía (ej. "follows"), cuenta como activada
  if coalesce((v_prefs ->> p_pref)::boolean, true) = false then
    return false;
  end if;

  if exists (
    select 1 from public.blocks
    where (blocker_id = p_recipient and blocked_id = p_actor)
       or (blocker_id = p_actor and blocked_id = p_recipient)
  ) then
    return false;
  end if;

  return true;
end;
$$;


-- 4) TRIGGERS: crean y limpian las notificaciones solas ---------------
-- Si algo fallara dentro de un trigger, NUNCA se rompe la acción original
-- (el like / comentario / seguir se guarda igual).

-- 4.1 Like en publicación
create or replace function public.trg_notify_post_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
begin
  begin
    select user_id into v_owner from public.posts where id = new.post_id;
    if public.notif_should_send(v_owner, new.user_id, 'likes') then
      insert into public.notifications (recipient_id, actor_id, type, post_id)
      values (v_owner, new.user_id, 'like_post', new.post_id)
      on conflict do nothing;
    end if;
  exception when others then
    null;
  end;
  return new;
end;
$$;

create or replace function public.trg_cleanup_post_like()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications
  where type = 'like_post' and actor_id = old.user_id and post_id = old.post_id;
  return old;
end;
$$;

drop trigger if exists notify_post_like  on public.likes;
create trigger notify_post_like  after insert on public.likes
  for each row execute function public.trg_notify_post_like();
drop trigger if exists cleanup_post_like on public.likes;
create trigger cleanup_post_like after delete on public.likes
  for each row execute function public.trg_cleanup_post_like();

-- 4.2 Like en comentario
create or replace function public.trg_notify_comment_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_post  uuid;
begin
  begin
    select user_id, post_id into v_owner, v_post from public.comments where id = new.comment_id;
    if public.notif_should_send(v_owner, new.user_id, 'likes') then
      insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id)
      values (v_owner, new.user_id, 'like_comment', v_post, new.comment_id)
      on conflict do nothing;
    end if;
  exception when others then
    null;
  end;
  return new;
end;
$$;

create or replace function public.trg_cleanup_comment_like()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications
  where type = 'like_comment' and actor_id = old.user_id and comment_id = old.comment_id;
  return old;
end;
$$;

drop trigger if exists notify_comment_like  on public.comment_likes;
create trigger notify_comment_like  after insert on public.comment_likes
  for each row execute function public.trg_notify_comment_like();
drop trigger if exists cleanup_comment_like on public.comment_likes;
create trigger cleanup_comment_like after delete on public.comment_likes
  for each row execute function public.trg_cleanup_comment_like();

-- 4.3 Comentario nuevo y respuesta
--   · Responder un comentario  → aviso "reply" para el dueño de ESE comentario
--   · Comentar en una publicación → aviso "comment" para el dueño de la publicación
--     (si además es el mismo que recibe el "reply", solo le llega el "reply")
create or replace function public.trg_notify_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_post_owner   uuid;
  v_parent_owner uuid;
begin
  begin
    select user_id into v_post_owner from public.posts where id = new.post_id;

    if new.parent_comment_id is not null then
      select user_id into v_parent_owner from public.comments where id = new.parent_comment_id;
      if public.notif_should_send(v_parent_owner, new.user_id, 'mentions') then
        insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id)
        values (v_parent_owner, new.user_id, 'reply', new.post_id, new.id)
        on conflict do nothing;
      end if;
    end if;

    if v_post_owner is distinct from v_parent_owner
       and public.notif_should_send(v_post_owner, new.user_id, 'comments') then
      insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id)
      values (v_post_owner, new.user_id, 'comment', new.post_id, new.id)
      on conflict do nothing;
    end if;
  exception when others then
    null;
  end;
  return new;
end;
$$;

drop trigger if exists notify_comment on public.comments;
create trigger notify_comment after insert on public.comments
  for each row execute function public.trg_notify_comment();
-- (al borrar un comentario, sus notificaciones se borran solas por el "on delete cascade")

-- 4.4 Nuevo seguidor
create or replace function public.trg_notify_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    if public.notif_should_send(new.following_id, new.follower_id, 'follows') then
      insert into public.notifications (recipient_id, actor_id, type)
      values (new.following_id, new.follower_id, 'follow')
      on conflict do nothing;
    end if;
  exception when others then
    null;
  end;
  return new;
end;
$$;

create or replace function public.trg_cleanup_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications
  where type = 'follow' and actor_id = old.follower_id and recipient_id = old.following_id;
  return old;
end;
$$;

drop trigger if exists notify_follow  on public.follows;
create trigger notify_follow  after insert on public.follows
  for each row execute function public.trg_notify_follow();
drop trigger if exists cleanup_follow on public.follows;
create trigger cleanup_follow after delete on public.follows
  for each row execute function public.trg_cleanup_follow();


-- 5) EN VIVO (Realtime) ----------------------------------------------
-- Para que el numerito de la campana se actualice solo, sin recargar.
-- Si ya estaba activado, no pasa nada.
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

-- Listo. Puedes comprobarlo con:  select * from public.notifications;
