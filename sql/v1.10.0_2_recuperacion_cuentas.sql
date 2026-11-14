-- =====================================================================
-- DaiwaPlace v1.10.0 «IRIS» — SQL 2 de 2: Recuperación de cuentas (Centro de Mando)
-- Pégalo COMPLETO en Supabase → SQL Editor → New query → Run. Es seguro correrlo más de una vez.
-- NO borra ni cambia datos de nadie. NO toca contraseñas, perfiles, publicaciones ni Lunas.
--
-- Cómo funciona (resumen)
--   · Quien lo necesite (admin supremo o rol con el permiso «recover_accounts») genera en el Centro de Mando un ENLACE temporal para una
--     cuenta, después de verificar por un canal privado que la persona es la dueña. El sistema NUNCA entrega acceso por sí solo.
--   · El enlace sirve UNA sola vez y vence a las 4 horas. De él solo se guarda un hash (SHA-256): ni la base de datos puede reconstruirlo.
--   · Con el enlace la persona define una contraseña nueva y una palabra secreta nueva. Nunca se muestra ni se cambia nada más.
--   · Todo queda en un registro de auditoría permanente (quién lo generó, cuándo, con qué motivo, si se usó y desde qué conexión).
--   · Estas tablas y funciones NO son accesibles desde el navegador: solo las usa el servidor (service_role) tras comprobar los permisos.
-- =====================================================================

-- 1) ENLACES ----------------------------------------------------------------------------------------
create table if not exists public.account_recovery_links (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  token_hash  text not null unique,                       -- SHA-256 (hex) del enlace; el enlace en sí NUNCA se guarda
  created_by  uuid references public.profiles(id) on delete set null,
  note        text check (note is null or char_length(note) <= 400),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  used_at     timestamptz,
  revoked_at  timestamptz,
  revoked_by  uuid references public.profiles(id) on delete set null
);
create index if not exists account_recovery_links_user_idx   on public.account_recovery_links (user_id, created_at desc);
create index if not exists account_recovery_links_active_idx on public.account_recovery_links (user_id) where used_at is null and revoked_at is null;

-- 2) AUDITORÍA (permanente: sin FK para que el registro sobreviva aunque se borre una cuenta) --------------
create table if not exists public.account_recovery_audit (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  action      text not null check (action in ('link_created', 'link_revoked', 'link_opened', 'link_used', 'link_failed')),
  actor_id    uuid,
  actor_name  text,
  target_id   uuid,
  target_name text,
  link_id     uuid,
  detail      jsonb not null default '{}'::jsonb
);
create index if not exists account_recovery_audit_target_idx on public.account_recovery_audit (target_id, created_at desc);
create index if not exists account_recovery_audit_actor_idx  on public.account_recovery_audit (actor_id, created_at desc);

-- 3) PERMISOS: nadie del navegador toca estas tablas (ni lectura). Solo el servidor con service_role. -------------
alter table public.account_recovery_links enable row level security;
alter table public.account_recovery_audit enable row level security;
revoke all on public.account_recovery_links from anon, authenticated;
revoke all on public.account_recovery_audit from anon, authenticated;
-- (sin políticas: con RLS activo y sin políticas, anon/authenticated no ven ni escriben nada)

-- 4) FUNCIONES (SECURITY DEFINER, solo service_role) ------------------------------------------------------
-- 4.1 Crear un enlace. Revoca los anteriores de esa cuenta (solo hay UNO activo), vence en ≤ 4 h y limita la frecuencia.
create or replace function public.recovery_link_create(p_user uuid, p_admin uuid, p_hash text, p_note text, p_hours int default 4)
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  v_exp   timestamptz := now() + make_interval(hours => least(greatest(coalesce(p_hours, 4), 1), 4));
  v_id    uuid;
  v_tname text;
  v_aname text;
begin
  if p_hash is null or char_length(p_hash) <> 64 then raise exception 'Enlace no válido'; end if;
  select username into v_tname from public.profiles where id = p_user;
  if v_tname is null then raise exception 'Cuenta no encontrada'; end if;
  select username into v_aname from public.profiles where id = p_admin;
  if v_aname is null then raise exception 'Administrador no encontrado'; end if;
  if p_user = p_admin then raise exception 'No puedes generar un enlace para tu propia cuenta'; end if;

  -- Freno de frecuencia (autoritativo, aquí en la base de datos): por cuenta y por administrador
  if (select count(*) from public.account_recovery_audit where action = 'link_created' and target_id = p_user and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'Ya se generaron demasiados enlaces para esta cuenta hoy. Espera o revisa el registro.';
  end if;
  if (select count(*) from public.account_recovery_audit where action = 'link_created' and actor_id = p_admin and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'Generaste demasiados enlaces en la última hora. Espera un poco.';
  end if;

  -- un solo enlace activo por cuenta
  update public.account_recovery_links set revoked_at = now(), revoked_by = p_admin
   where user_id = p_user and used_at is null and revoked_at is null;

  insert into public.account_recovery_links (user_id, token_hash, created_by, note, expires_at)
  values (p_user, p_hash, p_admin, left(nullif(btrim(p_note), ''), 400), v_exp)
  returning id into v_id;

  insert into public.account_recovery_audit (action, actor_id, actor_name, target_id, target_name, link_id, detail)
  values ('link_created', p_admin, v_aname, p_user, v_tname, v_id, jsonb_build_object('note', left(nullif(btrim(p_note), ''), 400), 'expires_at', v_exp));
  return v_exp;
end;
$$;

-- 4.2 Mirar un enlace SIN consumirlo (para mostrar «Recuperando la cuenta de @usuario»). Vacío si no sirve.
create or replace function public.recovery_link_peek(p_hash text)
returns table (link_id uuid, user_id uuid, username text, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select l.id, l.user_id, p.username, l.expires_at
    from public.account_recovery_links l join public.profiles p on p.id = l.user_id
   where l.token_hash = p_hash and l.used_at is null and l.revoked_at is null and l.expires_at > now()
   limit 1;
$$;

-- 4.3 Consumir el enlace de forma ATÓMICA (un solo UPDATE: dos personas usándolo a la vez → solo una gana). Devuelve {link_id, user_id} o null.
create or replace function public.recovery_link_claim(p_hash text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_user uuid;
begin
  update public.account_recovery_links set used_at = now()
   where token_hash = p_hash and used_at is null and revoked_at is null and expires_at > now()
  returning id, user_id into v_id, v_user;
  if v_id is null then return null; end if;
  return jsonb_build_object('link_id', v_id, 'user_id', v_user);
end;
$$;

-- 4.4 Si el cambio de contraseña falló DESPUÉS de consumir el enlace, se devuelve a su estado (solo si sigue vigente)
create or replace function public.recovery_link_unclaim(p_link uuid)
returns void
language sql security definer set search_path = public as $$
  update public.account_recovery_links set used_at = null
   where id = p_link and revoked_at is null and expires_at > now();
$$;

-- 4.5 Registrar un evento del enlace en la auditoría (abierto / usado / fallido). Al usarse, se revocan los demás enlaces activos de la cuenta.
create or replace function public.recovery_link_event(p_action text, p_link uuid, p_target uuid, p_detail jsonb default '{}'::jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare v_tname text;
begin
  if p_action not in ('link_opened', 'link_used', 'link_failed') then raise exception 'Evento no válido'; end if;
  select username into v_tname from public.profiles where id = p_target;
  insert into public.account_recovery_audit (action, target_id, target_name, link_id, detail)
  values (p_action, p_target, v_tname, p_link, coalesce(p_detail, '{}'::jsonb));
  if p_action = 'link_used' and p_target is not null then
    update public.account_recovery_links set revoked_at = now()
     where user_id = p_target and used_at is null and revoked_at is null;
  end if;
end;
$$;

-- 4.6 Revocar un enlace activo (por un administrador autorizado)
create or replace function public.recovery_link_revoke(p_link uuid, p_admin uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_user uuid; v_tname text; v_aname text;
begin
  update public.account_recovery_links set revoked_at = now(), revoked_by = p_admin
   where id = p_link and used_at is null and revoked_at is null
  returning user_id into v_user;
  if v_user is null then return false; end if;
  select username into v_tname from public.profiles where id = v_user;
  select username into v_aname from public.profiles where id = p_admin;
  insert into public.account_recovery_audit (action, actor_id, actor_name, target_id, target_name, link_id)
  values ('link_revoked', p_admin, v_aname, v_user, v_tname, p_link);
  return true;
end;
$$;

revoke all on function public.recovery_link_create(uuid, uuid, text, text, int), public.recovery_link_peek(text), public.recovery_link_claim(text),
  public.recovery_link_unclaim(uuid), public.recovery_link_event(text, uuid, uuid, jsonb), public.recovery_link_revoke(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.recovery_link_create(uuid, uuid, text, text, int), public.recovery_link_peek(text), public.recovery_link_claim(text),
  public.recovery_link_unclaim(uuid), public.recovery_link_event(text, uuid, uuid, jsonb), public.recovery_link_revoke(uuid, uuid)
  to service_role;

-- Listo. Después: en Centro de Mando → «Taller de roles» puedes darle el permiso «Recuperar cuentas» a un rol de confianza
-- (el Admin Supremo ya lo tiene siempre). Revisa el historial en la propia herramienta o con:
--   select * from public.account_recovery_audit order by created_at desc limit 50;
