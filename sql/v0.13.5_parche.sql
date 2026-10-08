-- =====================================================================
-- DaiwaPlace v0.13.5 — Parche de detalles
-- Pégalo completo en Supabase → SQL Editor → New query → Run.
-- REQUISITO: ya haber corrido los SQL de la v0.11.0, v0.12.0 y v0.13.0.
-- Es seguro correrlo más de una vez (no duplica nada).
--
-- Qué agrega:
--  1) Lista de seguidores / seguidos (primero a quienes tú sigues)
--  2) Reportar mensajes directos (con copia de los últimos mensajes como evidencia)
--  3) Intentos de recuperación de cuenta (límite contra adivinar la palabra secreta)
--  4) Interruptor para ocultar el "Visto" de los mensajes
-- =====================================================================


-- 1) LISTA DE SEGUIDORES / SEGUIDOS -------------------------------------
-- p_kind = 'followers' (quién sigue a p_user) o 'following' (a quién sigue p_user).
-- Orden: primero las personas que TÚ sigues, después el resto (lo más reciente arriba).
-- Se excluyen cuentas con las que hay un bloqueo.
create or replace function public.follow_list(
  p_user uuid, p_kind text, p_limit int default 40, p_offset int default 0)
returns table (
  profile_id  uuid,
  username    text,
  id_student  text,
  avatar_url  text,
  is_frozen   boolean,
  i_follow    boolean,
  follows_me  boolean,
  followed_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    p.id, p.username, p.id_student, p.avatar_url, coalesce(p.is_frozen, false),
    exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = p.id),
    exists (select 1 from public.follows f where f.follower_id = p.id and f.following_id = auth.uid()),
    x.created_at
  from public.follows x
  join public.profiles p
    on p.id = case when p_kind = 'followers' then x.follower_id else x.following_id end
  where auth.uid() is not null
    and p_kind in ('followers', 'following')
    and ((p_kind = 'followers' and x.following_id = p_user) or (p_kind = 'following' and x.follower_id = p_user))
    and not public.is_blocked_between(auth.uid(), p.id)
  order by
    exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = p.id) desc,
    x.created_at desc
  limit greatest(1, least(coalesce(p_limit, 40), 100))
  offset greatest(0, coalesce(p_offset, 0));
$$;


-- 2) REPORTAR MENSAJES DIRECTOS ---------------------------------------------
-- Moderación NO puede leer las conversaciones. Al reportar se guarda una copia de los últimos
-- mensajes (solo esos) y es lo único que se revisa.
create table if not exists public.dm_reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid not null references public.profiles(id) on delete cascade,
  reported_id     uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  message_id      uuid,
  reason          text not null check (reason in ('ofensivo','acoso','datos_personales','odio','spam','otro')),
  details         text check (details is null or char_length(details) <= 300),
  snapshot        jsonb not null default '[]'::jsonb,
  status          text not null default 'pending' check (status in ('pending','resolved','dismissed')),
  created_at      timestamptz not null default now(),
  resolved_by     uuid references public.profiles(id) on delete set null,
  resolved_at     timestamptz,
  resolution      text
);
create index if not exists dm_reports_status_idx on public.dm_reports (status, created_at desc);
create unique index if not exists dm_reports_one_pending
  on public.dm_reports (reporter_id, conversation_id) where status = 'pending';

alter table public.dm_reports enable row level security;
revoke all on public.dm_reports from anon, authenticated;

-- Solo quien tiene el permiso "Ver evidencia" (o el Admin Supremo) puede leerlos
drop policy if exists "dm_reports_select_staff" on public.dm_reports;
create policy "dm_reports_select_staff" on public.dm_reports
  for select to authenticated using (public.whisper_has_perm(auth.uid(), 'view_evidence'));
grant select on public.dm_reports to authenticated;

create or replace function public.dm_report(
  p_conv uuid, p_message uuid, p_reason text, p_details text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me         uuid := auth.uid();
  v_other    uuid;
  v_snapshot jsonb;
  v_details  text := nullif(left(btrim(coalesce(p_details, '')), 300), '');
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;
  if p_reason is null or p_reason not in ('ofensivo','acoso','datos_personales','odio','spam','otro') then
    raise exception 'Elige un motivo para el reporte';
  end if;
  if not public.dm_is_member(p_conv, me) then raise exception 'Conversación no encontrada'; end if;

  select case when c.user_a = me then c.user_b else c.user_a end
    into v_other from public.conversations c where c.id = p_conv;

  if p_message is not null and not exists (
    select 1 from public.messages where id = p_message and conversation_id = p_conv
  ) then
    p_message := null;
  end if;

  -- Copia de los últimos 15 mensajes (sin los eliminados)
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', t.id,
           'from', case when t.sender_id = me then 'reporter' else 'reported' end,
           'content', t.content,
           'at', t.created_at,
           'flagged', (t.id = p_message)
         ) order by t.created_at), '[]'::jsonb)
    into v_snapshot
    from (
      select m.id, m.sender_id, m.content, m.created_at
      from public.messages m
      where m.conversation_id = p_conv and m.deleted_at is null
      order by m.created_at desc
      limit 15
    ) t;

  begin
    insert into public.dm_reports (reporter_id, reported_id, conversation_id, message_id, reason, details, snapshot)
    values (me, v_other, p_conv, p_message, p_reason, v_details, v_snapshot);
  exception when unique_violation then
    raise exception 'Ya reportaste esta conversación y está en revisión';
  end;
end;
$$;

create or replace function public.admin_dm_report_resolve(p_report uuid, p_status text, p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.whisper_has_perm(auth.uid(), 'view_evidence') then
    raise exception 'No tienes permiso para revisar reportes de mensajes';
  end if;
  if p_status not in ('resolved','dismissed') then raise exception 'Estado no válido'; end if;
  update public.dm_reports
     set status = p_status, resolved_by = auth.uid(), resolved_at = now(),
         resolution = nullif(btrim(coalesce(p_note, '')), '')
   where id = p_report and status = 'pending';
end;
$$;

-- ¿Ya reporté esta conversación? (para no dejar reportar dos veces seguidas)
create or replace function public.dm_my_pending_reports()
returns table (conversation_id uuid)
language sql stable security definer set search_path = public as $$
  select r.conversation_id from public.dm_reports r
  where r.reporter_id = auth.uid() and r.status = 'pending' and r.conversation_id is not null;
$$;


-- 3) INTENTOS DE RECUPERACIÓN DE CUENTA --------------------------------------
-- Solo la usa el servidor (llave de servicio). Nadie del navegador puede leerla ni escribirla.
create table if not exists public.recovery_attempts (
  id         bigint generated always as identity primary key,
  username   text not null,
  ip         text,
  created_at timestamptz not null default now()
);
create index if not exists recovery_attempts_username_idx on public.recovery_attempts (username, created_at desc);
create index if not exists recovery_attempts_ip_idx on public.recovery_attempts (ip, created_at desc);
alter table public.recovery_attempts enable row level security;
revoke all on public.recovery_attempts from anon, authenticated;


-- 4) "VISTO" OPCIONAL -------------------------------------------------------------
-- Si tú lo apagas, nadie ve cuándo leíste y tú tampoco ves cuándo leen los demás (como el "conectado").
alter table public.profiles add column if not exists show_read_receipts boolean not null default true;
grant select (show_read_receipts) on public.profiles to authenticated;
grant update (show_read_receipts) on public.profiles to authenticated;

create or replace function public.dm_other_read_at(p_conv uuid)
returns timestamptz
language sql stable security definer set search_path = public as $$
  select case
           when coalesce((select show_read_receipts from public.profiles where id = auth.uid()), true)
            and coalesce((select show_read_receipts from public.profiles where id = ot.user_id), true)
           then ot.last_read_at
         end
  from public.conversation_members ot
  where ot.conversation_id = p_conv
    and ot.user_id <> auth.uid()
    and public.dm_is_member(p_conv, auth.uid());
$$;

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
    case
      when coalesce((select show_read_receipts from public.profiles where id = auth.uid()), true)
       and coalesce(p.show_read_receipts, true)
      then ot.last_read_at
    end,
    exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = p.id),
    public.is_blocked_between(c.user_a, c.user_b),
    coalesce(p.is_frozen, false)
  from public.conversations c
  join public.conversation_members me on me.conversation_id = c.id and me.user_id = auth.uid()
  join public.conversation_members ot on ot.conversation_id = c.id and ot.user_id <> auth.uid()
  join public.profiles p on p.id = ot.user_id
  where c.id = p_conv and auth.uid() in (c.user_a, c.user_b);
$$;


-- 5) PERMISOS DE LAS FUNCIONES -------------------------------------------------------
revoke execute on function
  public.follow_list(uuid, text, int, int),
  public.dm_report(uuid, uuid, text, text),
  public.admin_dm_report_resolve(uuid, text, text),
  public.dm_my_pending_reports(),
  public.dm_other_read_at(uuid),
  public.dm_chat_info(uuid)
from public, anon;
grant execute on function
  public.follow_list(uuid, text, int, int),
  public.dm_report(uuid, uuid, text, text),
  public.admin_dm_report_resolve(uuid, text, text),
  public.dm_my_pending_reports(),
  public.dm_other_read_at(uuid),
  public.dm_chat_info(uuid)
to authenticated;

-- Listo.
