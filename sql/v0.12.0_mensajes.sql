-- =====================================================================
-- DaiwaPlace v0.12.0 — Mensajes directos, amigos, notas y música (base)
-- Pégalo completo en Supabase → SQL Editor → New query → Run.
-- REQUISITO: ya haber corrido el SQL de la v0.11.0 (notificaciones).
-- Es seguro correrlo más de una vez (no duplica nada).
-- =====================================================================


-- 0) COLUMNAS NUEVAS EN TABLAS QUE YA EXISTEN -------------------------
-- · show_online_status: si muestras (y ves) el puntico verde de "conectado"
-- · music: canción de Deezer (preparado para próximas versiones; aún no se usa en pantalla)
alter table public.profiles add column if not exists show_online_status boolean not null default true;
alter table public.profiles add column if not exists music jsonb;
alter table public.posts    add column if not exists music jsonb;

-- Por si tu tabla de perfiles tiene permisos por columna (la palabra secreta está protegida):
grant select (show_online_status, music) on public.profiles to authenticated;
grant update (show_online_status, music) on public.profiles to authenticated;
grant select (music)                     on public.posts    to authenticated;
grant insert (music)                     on public.posts    to authenticated;
grant update (music)                     on public.posts    to authenticated;


-- 1) FUNCIONES AUXILIARES --------------------------------------------
-- Amigos = se siguen mutuamente. No hay tabla aparte: sale de "follows".
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select a is not null and b is not null and a <> b
     and exists (select 1 from public.follows where follower_id = a and following_id = b)
     and exists (select 1 from public.follows where follower_id = b and following_id = a);
$$;

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;


-- 2) TABLAS -----------------------------------------------------------

-- 2.1 Conversaciones (siempre entre 2 personas; user_a < user_b para que no haya duplicados)
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  user_a          uuid not null references public.profiles(id) on delete cascade,
  user_b          uuid not null references public.profiles(id) on delete cascade,
  initiator_id    uuid not null references public.profiles(id) on delete cascade,
  status          text not null default 'accepted' check (status in ('pending','accepted','declined')),
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  constraint conversations_pair_order check (user_a < user_b),
  constraint conversations_pair_unique unique (user_a, user_b),
  constraint conversations_initiator_in_pair check (initiator_id in (user_a, user_b))
);
create index if not exists conversations_user_a_idx on public.conversations (user_a, last_message_at desc);
create index if not exists conversations_user_b_idx on public.conversations (user_b, last_message_at desc);

-- 2.2 Datos privados de cada persona dentro de la conversación
--     (el apodo que TÚ le pones al otro, hasta cuándo leíste, "borrar chat para mí")
create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  other_nickname  text check (other_nickname is null or char_length(other_nickname) between 1 and 30),
  last_read_at    timestamptz not null default now(),
  hidden_at       timestamptz,
  primary key (conversation_id, user_id)
);
create index if not exists conversation_members_user_idx on public.conversation_members (user_id);

-- 2.3 Mensajes (el borrado es "suave": queda el hueco "Mensaje eliminado")
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  content         text not null default '',
  reply_to_id     uuid,
  created_at      timestamptz not null default now(),
  edited_at       timestamptz,
  deleted_at      timestamptz,
  constraint messages_reply_to_id_fkey foreign key (reply_to_id) references public.messages(id) on delete set null,
  constraint messages_content_check check (deleted_at is not null or char_length(btrim(content)) between 1 and 2000)
);
create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at desc);

-- 2.4 Reacciones (una por persona y por mensaje, como en Instagram)
create table if not exists public.message_reactions (
  message_id      uuid not null references public.messages(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  emoji           text not null check (char_length(emoji) between 1 and 8),
  created_at      timestamptz not null default now(),
  primary key (message_id, user_id)
);
create index if not exists message_reactions_conversation_idx on public.message_reactions (conversation_id);

-- 2.5 Notas (una activa por persona, dura 24 horas)
create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references public.profiles(id) on delete cascade,
  content    text not null check (char_length(btrim(content)) between 1 and 60),
  music      jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create table if not exists public.note_likes (
  note_id    uuid not null references public.notes(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (note_id, user_id)
);
create index if not exists note_likes_user_idx on public.note_likes (user_id);

-- 2.6 Notificaciones: ahora también "like a tu nota"
alter table public.notifications add column if not exists note_id uuid;
do $$
begin
  alter table public.notifications
    add constraint notifications_note_id_fkey foreign key (note_id) references public.notes(id) on delete cascade;
exception when duplicate_object then null;
end;
$$;
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('like_post','like_comment','comment','reply','follow','like_note'));
create unique index if not exists notifications_uniq_like_note on public.notifications (actor_id, note_id) where type = 'like_note';


-- 3) FUNCIONES DE REGLAS (¿quién puede qué?) ---------------------------

-- ¿Puede esta persona escribir en esta conversación ahora mismo?
--  · aceptada → sí
--  · solicitud pendiente → quien la inició puede mandar hasta 3 mensajes; quien la recibe puede
--    contestar (y al contestar, la solicitud queda aceptada)
--  · rechazada o con bloqueo → no
create or replace function public.dm_can_send(p_conv uuid, p_sender uuid)
returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  c        record;
  v_other  uuid;
  v_count  int;
begin
  select * into c from public.conversations where id = p_conv;
  if not found then return false; end if;
  if p_sender is null or p_sender not in (c.user_a, c.user_b) then return false; end if;

  v_other := case when p_sender = c.user_a then c.user_b else c.user_a end;
  if public.is_blocked_between(p_sender, v_other) then return false; end if;

  if c.status = 'accepted' then return true; end if;

  if c.status = 'pending' then
    if p_sender = c.initiator_id then
      select count(*) into v_count from public.messages where conversation_id = p_conv and sender_id = p_sender;
      return v_count < 3;
    end if;
    return true;
  end if;

  return false;
end;
$$;

create or replace function public.dm_is_member(p_conv uuid, p_user uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversations c
    where c.id = p_conv and p_user in (c.user_a, c.user_b)
  );
$$;

-- ¿Puede esta persona reaccionar a este mensaje? (miembro, sin bloqueo)
create or replace function public.dm_can_react(p_msg uuid, p_user uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.id = p_msg
      and p_user in (c.user_a, c.user_b)
      and m.deleted_at is null
      and c.status <> 'declined'
      and not public.is_blocked_between(c.user_a, c.user_b)
  );
$$;

-- ¿Puede esta persona ver esta nota? (suya, o de un amigo, y sin vencer)
create or replace function public.note_visible(p_note uuid, p_user uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.notes n
    where n.id = p_note
      and n.expires_at > now()
      and (n.user_id = p_user or public.are_friends(p_user, n.user_id))
  );
$$;


-- 4) SEGURIDAD (RLS) ---------------------------------------------------
alter table public.conversations         enable row level security;
alter table public.conversation_members  enable row level security;
alter table public.messages              enable row level security;
alter table public.message_reactions     enable row level security;
alter table public.notes                 enable row level security;
alter table public.note_likes            enable row level security;

revoke all on public.conversations, public.conversation_members, public.messages,
              public.message_reactions, public.notes, public.note_likes from anon, authenticated;

-- Conversaciones: solo las ves si eres una de las dos personas. Se crean/cambian con funciones (abajo).
drop policy if exists "conv_select" on public.conversations;
create policy "conv_select" on public.conversations
  for select to authenticated using (auth.uid() in (user_a, user_b));
grant select on public.conversations to authenticated;

-- Tus datos privados de la conversación
drop policy if exists "members_select_own" on public.conversation_members;
create policy "members_select_own" on public.conversation_members
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "members_update_own" on public.conversation_members;
create policy "members_update_own" on public.conversation_members
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select on public.conversation_members to authenticated;
grant update (other_nickname, last_read_at, hidden_at) on public.conversation_members to authenticated;

-- Mensajes
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages
  for select to authenticated using (public.dm_is_member(conversation_id, auth.uid()));
drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.dm_can_send(conversation_id, auth.uid()));
drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own" on public.messages
  for update to authenticated
  using (sender_id = auth.uid() and deleted_at is null)
  with check (sender_id = auth.uid());
grant select on public.messages to authenticated;
grant insert (conversation_id, sender_id, content, reply_to_id) on public.messages to authenticated;
grant update (content, edited_at, deleted_at) on public.messages to authenticated;

-- Reacciones
drop policy if exists "reactions_select" on public.message_reactions;
create policy "reactions_select" on public.message_reactions
  for select to authenticated using (public.dm_is_member(conversation_id, auth.uid()));
drop policy if exists "reactions_insert" on public.message_reactions;
create policy "reactions_insert" on public.message_reactions
  for insert to authenticated
  with check (user_id = auth.uid() and public.dm_can_react(message_id, auth.uid()));
drop policy if exists "reactions_update_own" on public.message_reactions;
create policy "reactions_update_own" on public.message_reactions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "reactions_delete_own" on public.message_reactions;
create policy "reactions_delete_own" on public.message_reactions
  for delete to authenticated using (user_id = auth.uid());
grant select on public.message_reactions to authenticated;
grant insert (message_id, user_id, emoji) on public.message_reactions to authenticated;
grant update (emoji) on public.message_reactions to authenticated;
grant delete on public.message_reactions to authenticated;

-- Notas: las ves si son tuyas o de un amigo (y no han vencido). Se crean con set_note().
drop policy if exists "notes_select" on public.notes;
create policy "notes_select" on public.notes
  for select to authenticated
  using (user_id = auth.uid() or (expires_at > now() and public.are_friends(auth.uid(), user_id)));
drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own" on public.notes
  for delete to authenticated using (user_id = auth.uid());
grant select, delete on public.notes to authenticated;

-- Likes de notas: los ve cualquiera que pueda ver la nota; solo un amigo puede dar like (no tú a la tuya)
drop policy if exists "note_likes_select" on public.note_likes;
create policy "note_likes_select" on public.note_likes
  for select to authenticated using (public.note_visible(note_id, auth.uid()));
drop policy if exists "note_likes_insert" on public.note_likes;
create policy "note_likes_insert" on public.note_likes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.notes n
      where n.id = note_id and n.user_id <> auth.uid() and n.expires_at > now()
        and public.are_friends(auth.uid(), n.user_id)
    )
  );
drop policy if exists "note_likes_delete_own" on public.note_likes;
create policy "note_likes_delete_own" on public.note_likes
  for delete to authenticated using (user_id = auth.uid());
grant select on public.note_likes to authenticated;
grant insert (note_id, user_id) on public.note_likes to authenticated;
grant delete on public.note_likes to authenticated;


-- 5) TRIGGERS ------------------------------------------------------------

-- 5.1 Al crear una conversación, se crean los datos privados de las dos personas
create or replace function public.trg_conversation_members()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.conversation_members (conversation_id, user_id)
  values (new.id, new.user_a), (new.id, new.user_b)
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists conversation_members_init on public.conversations;
create trigger conversation_members_init after insert on public.conversations
  for each row execute function public.trg_conversation_members();

-- 5.2 Antes de guardar un mensaje: si responde a otro, tiene que ser de la misma conversación
create or replace function public.trg_message_before()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.reply_to_id is not null then
    if not exists (
      select 1 from public.messages where id = new.reply_to_id and conversation_id = new.conversation_id
    ) then
      new.reply_to_id := null;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists message_before on public.messages;
create trigger message_before before insert on public.messages
  for each row execute function public.trg_message_before();

-- 5.3 Después de un mensaje: actualiza "último mensaje" y, si quien contesta es quien recibió
--     la solicitud, la solicitud queda aceptada
create or replace function public.trg_message_after()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations
     set last_message_at = new.created_at,
         status = case when status = 'pending' and initiator_id <> new.sender_id then 'accepted' else status end
   where id = new.conversation_id;
  return new;
end;
$$;
drop trigger if exists message_after on public.messages;
create trigger message_after after insert on public.messages
  for each row execute function public.trg_message_after();

-- 5.4 Reacciones: el conversation_id siempre se toma del mensaje (nadie lo puede inventar)
create or replace function public.trg_reaction_before()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select conversation_id into new.conversation_id from public.messages where id = new.message_id;
  return new;
end;
$$;
drop trigger if exists reaction_before on public.message_reactions;
create trigger reaction_before before insert on public.message_reactions
  for each row execute function public.trg_reaction_before();

-- 5.5 Si la persona que recibió una solicitud empieza a seguir a quien la mandó, queda aceptada
create or replace function public.trg_follow_accepts_requests()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations
     set status = 'accepted'
   where status = 'pending'
     and initiator_id = new.following_id
     and ((user_a = new.follower_id and user_b = new.following_id)
       or (user_a = new.following_id and user_b = new.follower_id));
  return new;
end;
$$;
drop trigger if exists follow_accepts_requests on public.follows;
create trigger follow_accepts_requests after insert on public.follows
  for each row execute function public.trg_follow_accepts_requests();

-- 5.6 Like en una nota → notificación para su dueño (respeta el interruptor "note_likes")
create or replace function public.trg_notify_note_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
begin
  begin
    select user_id into v_owner from public.notes where id = new.note_id;
    if public.notif_should_send(v_owner, new.user_id, 'note_likes') then
      insert into public.notifications (recipient_id, actor_id, type, note_id)
      values (v_owner, new.user_id, 'like_note', new.note_id)
      on conflict do nothing;
    end if;
  exception when others then
    null;
  end;
  return new;
end;
$$;
create or replace function public.trg_cleanup_note_like()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications
  where type = 'like_note' and actor_id = old.user_id and note_id = old.note_id;
  return old;
end;
$$;
drop trigger if exists notify_note_like on public.note_likes;
create trigger notify_note_like after insert on public.note_likes
  for each row execute function public.trg_notify_note_like();
drop trigger if exists cleanup_note_like on public.note_likes;
create trigger cleanup_note_like after delete on public.note_likes
  for each row execute function public.trg_cleanup_note_like();


-- 6) FUNCIONES QUE USA LA APP (RPC) --------------------------------------

-- 6.1 Abrir (o crear) el chat con alguien. Devuelve el id de la conversación.
--     Si la otra persona NO te sigue, queda como "solicitud de mensaje".
create or replace function public.dm_start(p_other uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me       uuid := auth.uid();
  v_a      uuid;
  v_b      uuid;
  c        record;
  v_status text;
  v_id     uuid;
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;
  if p_other is null or p_other = me then raise exception 'No puedes escribirte a ti mismo'; end if;
  if not exists (select 1 from public.profiles where id = p_other) then
    raise exception 'Esa persona no existe';
  end if;
  if public.is_blocked_between(me, p_other) then
    raise exception 'No puedes enviarle mensajes a esta persona';
  end if;
  if exists (select 1 from public.profiles where id = p_other and is_frozen) then
    raise exception 'Esta cuenta está congelada y no puede recibir mensajes por ahora';
  end if;

  v_a := case when me < p_other then me else p_other end;
  v_b := case when me < p_other then p_other else me end;

  select * into c from public.conversations where user_a = v_a and user_b = v_b;
  if found then
    -- si quien había rechazado la solicitud ahora escribe él mismo, se abre la conversación
    if c.status = 'declined' and c.initiator_id <> me then
      update public.conversations set status = 'accepted' where id = c.id;
    end if;
    return c.id;
  end if;

  v_status := case
    when exists (select 1 from public.follows where follower_id = p_other and following_id = me)
      then 'accepted' else 'pending' end;

  begin
    insert into public.conversations (user_a, user_b, initiator_id, status)
    values (v_a, v_b, me, v_status)
    returning id into v_id;
  exception when unique_violation then
    select id into v_id from public.conversations where user_a = v_a and user_b = v_b;
  end;
  return v_id;
end;
$$;

-- 6.2 Responder una solicitud: 'accept' (aceptar) o 'decline' (denegar)
create or replace function public.dm_respond(p_conv uuid, p_action text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  c  record;
begin
  select * into c from public.conversations where id = p_conv;
  if not found or me is null or me not in (c.user_a, c.user_b) then
    raise exception 'Conversación no encontrada';
  end if;
  if c.initiator_id = me then
    raise exception 'Esta solicitud la enviaste tú';
  end if;
  if p_action = 'accept' then
    update public.conversations set status = 'accepted' where id = p_conv and status in ('pending','declined');
  elsif p_action = 'decline' then
    update public.conversations set status = 'declined' where id = p_conv and status = 'pending';
  else
    raise exception 'Acción no válida';
  end if;
end;
$$;

-- 6.3 Bandeja de entrada. p_requests = false → chats normales; true → solicitudes de mensaje
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
    lm.created_at, lm.content, lm.sender_id, (lm.deleted_at is not null),
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
    select x.created_at, x.content, x.sender_id, x.deleted_at
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

-- 6.4 Contadores para la barra lateral y la pestaña "Solicitudes"
create or replace function public.dm_unread_summary()
returns table (unread_conversations int, pending_requests int)
language sql stable security definer set search_path = public as $$
  select
    (select count(*)::int from public.dm_inbox(false) where unread_count > 0),
    (select count(*)::int from public.dm_inbox(true)  where unread_count > 0);
$$;

-- 6.5 Datos de una conversación para la cabecera del chat
create or replace function public.dm_chat_info(p_conv uuid)
returns table (
  conversation_id  uuid,
  status           text,
  initiator_id     uuid,
  other_id         uuid,
  other_username   text,
  other_id_student text,
  other_avatar_url text,
  nickname         text,
  hidden_at        timestamptz,
  other_read_at    timestamptz,
  i_blocked        boolean,
  blocked          boolean,
  other_frozen     boolean
)
language sql stable security definer set search_path = public as $$
  select
    c.id, c.status, c.initiator_id,
    p.id, p.username, p.id_student, p.avatar_url,
    me.other_nickname, me.hidden_at,
    ot.last_read_at,
    exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = p.id),
    public.is_blocked_between(c.user_a, c.user_b),
    coalesce(p.is_frozen, false)
  from public.conversations c
  join public.conversation_members me on me.conversation_id = c.id and me.user_id = auth.uid()
  join public.conversation_members ot on ot.conversation_id = c.id and ot.user_id <> auth.uid()
  join public.profiles p on p.id = ot.user_id
  where c.id = p_conv and auth.uid() in (c.user_a, c.user_b);
$$;

-- 6.6 Hasta cuándo leyó la otra persona (para el "Visto")
create or replace function public.dm_other_read_at(p_conv uuid)
returns timestamptz
language sql stable security definer set search_path = public as $$
  select ot.last_read_at
  from public.conversation_members ot
  where ot.conversation_id = p_conv
    and ot.user_id <> auth.uid()
    and public.dm_is_member(p_conv, auth.uid());
$$;

-- 6.7 Publicar una nota (reemplaza la anterior, que se borra con sus likes)
create or replace function public.set_note(p_content text, p_music jsonb default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me     uuid := auth.uid();
  v_text text := btrim(coalesce(p_content, ''));
  v_id   uuid;
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;
  if char_length(v_text) < 1 or char_length(v_text) > 60 then
    raise exception 'La nota debe tener entre 1 y 60 caracteres';
  end if;
  if p_music is not null and (jsonb_typeof(p_music) <> 'object' or char_length(p_music::text) > 2000) then
    raise exception 'La canción no es válida';
  end if;
  delete from public.notes where user_id = me;
  insert into public.notes (user_id, content, music) values (me, v_text, p_music) returning id into v_id;
  return v_id;
end;
$$;

-- 6.8 Marcar la conversación como leída (usa la hora del servidor, no la del celular)
create or replace function public.dm_mark_read(p_conv uuid)
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  v_now timestamptz := now();
begin
  update public.conversation_members
     set last_read_at = v_now
   where conversation_id = p_conv and user_id = auth.uid();
  return v_now;
end;
$$;

-- 6.9 "Eliminar chat" solo para ti: se esconde el historial hasta este momento
--     (la otra persona lo sigue viendo; si te escriben de nuevo, el chat reaparece vacío)
create or replace function public.dm_hide(p_conv uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.conversation_members
     set hidden_at = now(), last_read_at = now()
   where conversation_id = p_conv and user_id = auth.uid();
end;
$$;

-- Permisos de las funciones: solo personas con sesión iniciada
revoke execute on function
  public.are_friends(uuid, uuid), public.is_blocked_between(uuid, uuid),
  public.dm_can_send(uuid, uuid), public.dm_is_member(uuid, uuid), public.dm_can_react(uuid, uuid),
  public.note_visible(uuid, uuid), public.dm_start(uuid), public.dm_respond(uuid, text),
  public.dm_inbox(boolean), public.dm_unread_summary(), public.dm_chat_info(uuid),
  public.dm_other_read_at(uuid), public.set_note(text, jsonb),
  public.dm_mark_read(uuid), public.dm_hide(uuid)
from public, anon;
grant execute on function
  public.are_friends(uuid, uuid), public.is_blocked_between(uuid, uuid),
  public.dm_can_send(uuid, uuid), public.dm_is_member(uuid, uuid), public.dm_can_react(uuid, uuid),
  public.note_visible(uuid, uuid), public.dm_start(uuid), public.dm_respond(uuid, text),
  public.dm_inbox(boolean), public.dm_unread_summary(), public.dm_chat_info(uuid),
  public.dm_other_read_at(uuid), public.set_note(text, jsonb),
  public.dm_mark_read(uuid), public.dm_hide(uuid)
to authenticated;


-- 7) EN VIVO (Realtime) --------------------------------------------------
-- Mensajes, reacciones, notas y likes de notas llegan sin recargar.
-- (El puntico verde de "conectado" usa Realtime Presence: no necesita nada aquí.)
alter table public.message_reactions replica identity full;
alter table public.note_likes        replica identity full;

do $$
declare
  t text;
begin
  foreach t in array array['conversations','messages','message_reactions','notes','note_likes']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
  end loop;
end;
$$;

-- Listo. Puedes comprobarlo con:  select * from public.conversations;
