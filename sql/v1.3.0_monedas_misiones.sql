-- =====================================================================
-- DaiwaPlace v1.3.0 «Lunas y Misiones»
-- Pega este archivo COMPLETO en Supabase → SQL Editor y ejecútalo.
-- Es idempotente: se puede correr varias veces sin que falle ni duplique nada.
-- Córrelo ANTES de subir el código nuevo a Vercel (solo agrega cosas: lo viejo sigue funcionando).
--
-- Qué hace:
--   0) Ajustes y ayudantes (nombre de la moneda, zona horaria, permisos nuevos).
--   1) Perfil gratis: color del perfil, del nombre y de la tarjeta + visibilidad de la identidad.
--   2) Lunas ☾: billetera PRIVADA, libro contable inmutable y la función que mueve el saldo.
--   3) Bienvenida (150 ☾) y Pack Fundador (300 ☾) para las cuentas de la beta.
--   4) Misiones: plantillas, asignación diaria/semanal, progreso, rachas y cofre semanal.
--   5) Triggers que registran las acciones reales (publicar, comentar, like, seguir…).
--   6) Códigos canjeables y su panel de admin.
--   7) Ajuste manual, economía, auditoría y ajustes del sistema (solo equipo).
--   8) Nombre con color en la bandeja de mensajes (dm_inbox / dm_chat_info).
--   9) Seguridad (RLS), permisos de las funciones y valores por defecto.
--
-- REGLA DE ORO: el servidor decide TODO lo económico (saldo, precios, misiones, códigos).
-- El navegador solo pide. Nada de aquí se puede «hackear» desde la consola del navegador.
--
-- Notas de diseño que cambian un poco el plan original (gana el código real):
--   · El registro del equipo se llama coin_admin_log (no admin_log) para no chocar con
--     ninguna tabla que ya tengas con ese nombre.
--   · No se tocan los tipos de notificación: completar misiones NO manda avisos a la campana.
-- =====================================================================


-- =====================================================================
-- 0) AJUSTES Y AYUDANTES
-- =====================================================================

-- Lee un ajuste de texto de app_settings (si no existe, usa el valor por defecto)
create or replace function public.eco_cfg_text(p_key text, p_default text)
returns text
language plpgsql stable security definer set search_path = public as $$
declare v text;
begin
  select value #>> '{}' into v from public.app_settings where key = p_key;
  if v is null or btrim(v) = '' then return p_default; end if;
  return v;
exception when others then
  return p_default;
end;
$$;

-- Lee un ajuste numérico (acepta decimales, p. ej. el multiplicador 1.5)
create or replace function public.eco_cfg_num(p_key text, p_default numeric)
returns numeric
language plpgsql stable security definer set search_path = public as $$
declare v text;
begin
  select value #>> '{}' into v from public.app_settings where key = p_key;
  if v is null or btrim(v) = '' then return p_default; end if;
  return v::numeric;
exception when others then
  return p_default;
end;
$$;

-- ¿Esta persona es del equipo con este permiso? (Admin Supremo o rol con el permiso).
-- También se permite desde el SQL Editor de Supabase (sesión «postgres»).
create or replace function public.eco_is_staff(p_perm text)
returns boolean
language sql stable security definer set search_path = public as $$
  select (session_user = 'postgres' and auth.uid() is null)
      or (auth.uid() is not null and public.whisper_has_perm(auth.uid(), p_perm));
$$;

-- ¿Cuenta congelada? (las congeladas no ganan ni gastan Lunas)
create or replace function public.eco_is_frozen(p_user uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_frozen from public.profiles where id = p_user), false);
$$;

-- Zona horaria con la que se reinician las misiones (editable en Centro de Mando → Tienda y Lunas)
create or replace function public.eco_tz()
returns text
language plpgsql stable security definer set search_path = public as $$
declare v text := public.eco_cfg_text('missions_timezone', 'America/Bogota');
begin
  if exists (select 1 from pg_timezone_names where name = v) then return v; end if;
  return 'America/Bogota';
end;
$$;

-- Multiplicador de eventos (1 = normal, 2 = doble Lunas). Solo afecta a las misiones.
create or replace function public.eco_multiplier()
returns numeric
language sql stable security definer set search_path = public as $$
  select greatest(0.5, least(5, public.eco_cfg_num('coins_multiplier', 1)));
$$;


-- =====================================================================
-- 1) PERFIL GRATIS: colores y visibilidad de la identidad
-- =====================================================================
-- profile_color: color del perfil, lo ven TODOS al entrar a tu perfil (null = el de la app).
-- name_color:    color de tu nombre en publicaciones, comentarios y listas.
-- card_color / card_mode: color y estilo de la tarjeta de tu perfil.
-- identity_visibility: quién puede ver tu identidad (todos / seguidores / nadie).
alter table public.profiles add column if not exists profile_color        text;
alter table public.profiles add column if not exists name_color           text;
alter table public.profiles add column if not exists card_color           text;
alter table public.profiles add column if not exists card_mode            text not null default 'suave';
alter table public.profiles add column if not exists identity_visibility  text not null default 'todos';

alter table public.profiles drop constraint if exists profiles_profile_color_check;
alter table public.profiles add constraint profiles_profile_color_check
  check (profile_color is null or profile_color ~ '^#[0-9a-fA-F]{6}$');
alter table public.profiles drop constraint if exists profiles_name_color_check;
alter table public.profiles add constraint profiles_name_color_check
  check (name_color is null or name_color ~ '^#[0-9a-fA-F]{6}$');
alter table public.profiles drop constraint if exists profiles_card_color_check;
alter table public.profiles add constraint profiles_card_color_check
  check (card_color is null or card_color ~ '^#[0-9a-fA-F]{6}$');
alter table public.profiles drop constraint if exists profiles_card_mode_check;
alter table public.profiles add constraint profiles_card_mode_check
  check (card_mode in ('solida', 'suave', 'vidrio'));
alter table public.profiles drop constraint if exists profiles_identity_visibility_check;
alter table public.profiles add constraint profiles_identity_visibility_check
  check (identity_visibility in ('todos', 'seguidores', 'nadie'));

-- La tabla de perfiles tiene permisos por columna: hay que darlos para las nuevas
grant select (profile_color, name_color, card_color, card_mode, identity_visibility) on public.profiles to authenticated;
grant update (profile_color, name_color, card_color, card_mode, identity_visibility) on public.profiles to authenticated;

-- 1.1 Identidad con visibilidad REAL (la decide la base de datos, no el navegador).
--     Tu identidad la ves siempre; la de otra persona solo si su visibilidad lo permite
--     (todos · solo seguidores · nadie). El equipo con «sobreescribir identidades» siempre la ve.
create or replace function public.profile_identity(p_user uuid)
returns table (identity text, identity_detail text, identity_visibility text)
language plpgsql stable security definer set search_path = public as $$
declare
  r record;
  v_ok boolean;
begin
  select p.identity as ident, p.identity_detail as detail, p.identity_visibility as vis
    into r from public.profiles p where p.id = p_user;
  if not found then return; end if;

  v_ok := (auth.uid() is not null and auth.uid() = p_user)
          or r.vis = 'todos'
          or (r.vis = 'seguidores' and auth.uid() is not null
              and exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = p_user))
          or public.eco_is_staff('override_identity');

  if v_ok then
    return query select r.ident::text, r.detail::text, r.vis::text;
  else
    return query select null::text, null::text, r.vis::text;
  end if;
end;
$$;

-- Con la función de arriba, las columnas de identidad ya no se leen directo (así nadie se salta la visibilidad).
-- Escribirlas (registro / editar perfil) sigue funcionando igual.
revoke select (identity, identity_detail) on public.profiles from authenticated;


-- =====================================================================
-- 2) LUNAS ☾: BILLETERA, LIBRO Y MOVIMIENTOS
-- =====================================================================

-- 2.1 Billetera PRIVADA (el saldo NO va en profiles porque profiles lo puede leer cualquiera)
create table if not exists public.user_wallets (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  coins      integer not null default 0 check (coins >= 0),
  updated_at timestamptz not null default now()
);

-- 2.2 Libro contable. SOLO se inserta: nunca se edita ni se borra (la cuenta siempre cuadra).
create table if not exists public.coin_ledger (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  delta           integer not null check (delta <> 0),
  balance_after   integer not null check (balance_after >= 0),
  reason          text not null,   -- mission_claim, welcome, founder, daily_bonus, chest, streak, achievement, code, admin_adjust, mission_reroll…
  ref_type        text,
  ref_id          text,
  idempotency_key text not null unique,
  created_by      uuid,
  created_at      timestamptz not null default now()
);
create index if not exists coin_ledger_user_idx   on public.coin_ledger (user_id, created_at desc);
create index if not exists coin_ledger_reason_idx on public.coin_ledger (reason, created_at desc);

-- El libro es inmutable. Única excepción: si la persona borra su cuenta, sus filas se van con ella.
create or replace function public.trg_coin_ledger_immutable()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'DELETE' and not exists (select 1 from public.profiles where id = old.user_id) then
    return old;
  end if;
  raise exception 'El libro de Lunas no se puede modificar';
end;
$$;
drop trigger if exists coin_ledger_immutable on public.coin_ledger;
create trigger coin_ledger_immutable before update or delete on public.coin_ledger
  for each row execute function public.trg_coin_ledger_immutable();

-- 2.3 Banderas de la economía (granjas de interacciones, topes diarios, etc.) para revisión del equipo
create table if not exists public.economy_flags (
  id          bigint generated always as identity primary key,
  user_id     uuid references public.profiles(id) on delete cascade,
  kind        text not null,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid
);
create index if not exists economy_flags_open_idx on public.economy_flags (created_at desc) where resolved_at is null;

-- 2.4 Historial de acciones del equipo sobre Lunas, códigos y ajustes
create table if not exists public.coin_admin_log (
  id         bigint generated always as identity primary key,
  admin_id   uuid,
  action     text not null,
  target     text,
  details    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists coin_admin_log_idx on public.coin_admin_log (created_at desc);

create or replace function public.eco_log(p_action text, p_target text, p_details jsonb)
returns void
language sql security definer set search_path = public as $$
  insert into public.coin_admin_log (admin_id, action, target, details)
  values (auth.uid(), p_action, p_target, coalesce(p_details, '{}'::jsonb));
$$;

-- 2.5 LA función que mueve el saldo. Interna: el navegador NO puede llamarla.
--     · Bloquea la billetera (dos pestañas a la vez no pagan dos veces).
--     · Si la clave ya existe, no hace nada y devuelve el movimiento anterior (idempotente).
--     · Nunca deja el saldo en negativo. Cuentas congeladas no ganan ni gastan.
--     · Tope diario de seguridad para premios repetibles (racha, cofre, bono diario, eventos).
create or replace function public.coins_apply(
  p_user     uuid,
  p_delta    integer,
  p_reason   text,
  p_ref_type text,
  p_ref_id   text,
  p_key      text,
  p_by       uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_balance  integer;
  v_prev     public.coin_ledger%rowtype;
  v_today    integer;
  v_cap      integer;
  v_tz       text := public.eco_tz();
begin
  if p_user is null then raise exception 'Falta la persona'; end if;
  if p_delta = 0 then raise exception 'El movimiento no puede ser 0'; end if;
  if p_key is null or btrim(p_key) = '' then raise exception 'Falta la clave del movimiento'; end if;

  -- billetera (se crea si no existe) y bloqueo de fila
  insert into public.user_wallets (user_id) values (p_user) on conflict (user_id) do nothing;
  select coins into v_balance from public.user_wallets where user_id = p_user for update;

  -- ¿ya se hizo este movimiento? (doble toque, reintento…)
  select * into v_prev from public.coin_ledger where idempotency_key = p_key;
  if found then
    return jsonb_build_object('applied', false, 'delta', v_prev.delta, 'balance', v_prev.balance_after);
  end if;

  if public.eco_is_frozen(p_user) and p_by is null then
    raise exception 'Tu cuenta está congelada';
  end if;

  -- tope diario de seguridad (solo premios repetibles; los puntuales ya son únicos por su clave)
  if p_delta > 0 and p_reason in ('daily_bonus', 'chest', 'streak', 'event') then
    v_cap := greatest(0, public.eco_cfg_num('coins_daily_cap', 600)::int);
    select coalesce(sum(delta), 0)::int into v_today
      from public.coin_ledger
     where user_id = p_user and delta > 0 and reason in ('daily_bonus', 'chest', 'streak', 'event')
       and (created_at at time zone v_tz)::date = (now() at time zone v_tz)::date;
    if v_today + p_delta > v_cap then
      insert into public.economy_flags (user_id, kind, details)
      values (p_user, 'daily_cap', jsonb_build_object('reason', p_reason, 'tried', p_delta, 'today', v_today, 'cap', v_cap));
      return jsonb_build_object('applied', false, 'capped', true, 'delta', 0, 'balance', v_balance);
    end if;
  end if;

  if v_balance + p_delta < 0 then
    raise exception 'No te alcanzan las Lunas';
  end if;

  v_balance := v_balance + p_delta;
  update public.user_wallets set coins = v_balance, updated_at = now() where user_id = p_user;
  insert into public.coin_ledger (user_id, delta, balance_after, reason, ref_type, ref_id, idempotency_key, created_by)
  values (p_user, p_delta, v_balance, p_reason, p_ref_type, p_ref_id, p_key, p_by);

  return jsonb_build_object('applied', true, 'delta', p_delta, 'balance', v_balance);
end;
$$;

-- 2.6 Funciones que sí usa la página --------------------------------

-- Mi saldo
create or replace function public.coins_balance()
returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select coins from public.user_wallets where user_id = auth.uid()), 0);
$$;

-- Mi historial (paginado: pasa la fecha del último movimiento que ya viste en p_before)
create or replace function public.coins_history(p_limit integer default 30, p_before timestamptz default null)
returns table (id bigint, delta integer, balance_after integer, reason text, ref_type text, ref_id text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select l.id, l.delta, l.balance_after, l.reason, l.ref_type, l.ref_id, l.created_at
  from public.coin_ledger l
  where l.user_id = auth.uid()
    and (p_before is null or l.created_at < p_before)
  order by l.created_at desc, l.id desc
  limit greatest(1, least(coalesce(p_limit, 30), 100));
$$;


-- =====================================================================
-- 3) BIENVENIDA Y PACK FUNDADOR
-- =====================================================================

-- 3.1 Cada cuenta nueva recibe su billetera y la bienvenida (150 ☾ por defecto).
--     Si algo fallara aquí, NUNCA se rompe el registro.
create or replace function public.trg_profile_wallet()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into public.user_wallets (user_id) values (new.id) on conflict (user_id) do nothing;
    perform public.coins_apply(
      new.id, greatest(1, public.eco_cfg_num('welcome_coins', 150)::int),
      'welcome', 'profile', new.id::text, 'welcome:' || new.id::text
    );
  exception when others then
    null;
  end;
  return new;
end;
$$;
drop trigger if exists profile_wallet on public.profiles;
create trigger profile_wallet after insert on public.profiles
  for each row execute function public.trg_profile_wallet();

-- 3.2 Pack Fundador (Lunas): para las cuentas creadas ANTES del lanzamiento oficial (13-oct-2026).
--     Se reclama una sola vez. (Los cosméticos exclusivos del pack llegan con la tienda, en la v1.4.0.)
create or replace function public.founder_status()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_me      uuid := auth.uid();
  v_created timestamptz;
  v_cutoff  date;
  v_claimed boolean;
begin
  if v_me is null then return jsonb_build_object('eligible', false, 'claimed', false, 'coins', 0); end if;
  select created_at into v_created from public.profiles where id = v_me;
  begin
    v_cutoff := public.eco_cfg_text('founder_cutoff', '2026-10-13')::date;
  exception when others then
    v_cutoff := date '2026-10-13';
  end;
  v_claimed := exists (select 1 from public.coin_ledger where idempotency_key = 'founder:' || v_me::text);
  return jsonb_build_object(
    'eligible', v_created is not null and (v_created at time zone public.eco_tz())::date < v_cutoff,
    'claimed', v_claimed,
    'coins', greatest(1, public.eco_cfg_num('founder_coins', 300)::int),
    'cutoff', v_cutoff
  );
end;
$$;

create or replace function public.founder_claim()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  st   jsonb;
  res  jsonb;
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  st := public.founder_status();
  if not (st ->> 'eligible')::boolean then raise exception 'El Pack Fundador es solo para las cuentas de la beta'; end if;
  if (st ->> 'claimed')::boolean then raise exception 'Ya reclamaste tu Pack Fundador'; end if;
  res := public.coins_apply(v_me, (st ->> 'coins')::int, 'founder', 'pack', 'fundador', 'founder:' || v_me::text);
  return res;
end;
$$;

-- 3.3 Cuentas que ya existen: billetera + bienvenida (una sola vez; la clave evita duplicados)
do $$
declare r record;
begin
  for r in select id from public.profiles loop
    begin
      insert into public.user_wallets (user_id) values (r.id) on conflict (user_id) do nothing;
      perform public.coins_apply(
        r.id, greatest(1, public.eco_cfg_num('welcome_coins', 150)::int),
        'welcome', 'profile', r.id::text, 'welcome:' || r.id::text, null
      );
    exception when others then
      null;   -- una cuenta con problemas no frena a las demás
    end;
  end loop;
end;
$$;


-- =====================================================================
-- 4) MISIONES
-- =====================================================================

-- 4.1 Plantillas (las edita el equipo desde Centro de Mando → Tienda y Lunas → Misiones)
--     event_type: qué acción cuenta (ver sección 5) o «state:xxx» para misiones de «tener algo» (bienvenida y logros).
--     params (todo opcional):
--       min_len        largo mínimo del texto        meta_true   claves de meta que deben ser true
--       meta_false     claves que deben ser false    meta_any    al menos una de estas claves true
--       events         varias acciones que cuentan   distinct    'target' | 'day' | 'meta:<clave>' (cuenta distintos)
--       min_distinct   mínimo de personas distintas  cap_per_day tope de acciones que cuentan por día
--       all_of         combo: [{event, count, …}]    (la meta = suma de los count)
create table if not exists public.mission_templates (
  id               text primary key,
  period           text not null check (period in ('daily', 'weekly', 'onboarding', 'achievement', 'event')),
  difficulty       text check (difficulty in ('easy', 'medium', 'hard', 'challenge')),
  category         text not null default 'social' check (category in ('social', 'creacion', 'descubrimiento', 'comunidad', 'personalizacion')),
  text             text not null check (char_length(btrim(text)) between 3 and 140),
  event_type       text not null,
  target           integer not null check (target >= 1),
  params           jsonb not null default '{}'::jsonb,
  reward           integer not null check (reward >= 0 and reward <= 10000),
  weight           integer not null default 10 check (weight >= 0 and weight <= 1000),
  active           boolean not null default true,
  requires_feature text,    -- si la función aún no existe en la app, la misión queda inactiva hasta que exista
  requires         text check (requires in ('friend', 'follows')),
  go_href          text,
  event_slug       text,
  sort             integer not null default 0
);

-- 4.2 Misiones asignadas a cada persona
create table if not exists public.user_missions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  template_id   text not null references public.mission_templates(id) on delete cascade,
  period_key    text not null,            -- '2026-10-19' · '2026-W43' · 'once'
  starts_at     timestamptz,
  ends_at       timestamptz,
  assigned_at   timestamptz not null default now(),
  claimed_at    timestamptz,
  reward_paid   integer,
  rerolled_from text,
  constraint user_missions_unique unique (user_id, template_id, period_key)
);
create index if not exists user_missions_user_idx on public.user_missions (user_id, period_key);

-- 4.3 Acciones reales de cada persona (las escriben los triggers de la sección 5; el navegador NO escribe aquí)
create table if not exists public.mission_events (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  event_type     text not null,
  ref_id         text not null,
  target_user_id uuid,
  meta           jsonb not null default '{}'::jsonb,
  void           boolean not null default false,
  created_at     timestamptz not null default now(),
  constraint mission_events_unique unique (user_id, event_type, ref_id)
);
create index if not exists mission_events_lookup_idx on public.mission_events (user_id, event_type, created_at desc) where not void;
create index if not exists mission_events_ref_idx    on public.mission_events (ref_id);
create index if not exists mission_events_target_idx on public.mission_events (user_id, target_user_id, created_at desc);

-- 4.4 Rachas diarias
create table if not exists public.mission_streaks (
  user_id  uuid primary key references public.profiles(id) on delete cascade,
  current  integer not null default 0,
  best     integer not null default 0,
  last_day date
);

-- 4.5 Ventana de tiempo de cada periodo (día y semana de calendario en la zona horaria del colegio)
create or replace function public.mission_window(p_period text, p_now timestamptz default now())
returns table (period_key text, starts_at timestamptz, ends_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare
  v_tz   text := public.eco_tz();
  v_day  date := (p_now at time zone v_tz)::date;
  v_mon  date;
begin
  if p_period = 'weekly' then
    v_mon := date_trunc('week', v_day::timestamp)::date;
    return query select to_char(v_mon, 'IYYY"-W"IW'),
                        (v_mon::timestamp) at time zone v_tz,
                        ((v_mon + 7)::timestamp) at time zone v_tz;
  else
    return query select to_char(v_day, 'YYYY-MM-DD'),
                        (v_day::timestamp) at time zone v_tz,
                        ((v_day + 1)::timestamp) at time zone v_tz;
  end if;
end;
$$;

-- 4.6 ¿Esta misión es posible para esta cuenta? (nunca se asigna algo imposible)
create or replace function public.mission_requires_ok(p_user uuid, p_requires text)
returns boolean
language sql stable security definer set search_path = public as $$
  select case p_requires
    when 'friend'  then exists (
      select 1 from public.follows a
      join public.follows b on b.follower_id = a.following_id and b.following_id = a.follower_id
      where a.follower_id = p_user)
    when 'follows' then exists (select 1 from public.follows where follower_id = p_user)
    else true
  end;
$$;

-- 4.7 Misiones de «tener algo» (bienvenida y logros): se miran en las tablas reales, así cuentan
--     también las cosas que la persona ya hizo antes de que existieran las Lunas.
create or replace function public.mission_state_progress(p_user uuid, p_key text)
returns integer
language plpgsql stable security definer set search_path = public as $$
declare v integer := 0;
begin
  case p_key
    when 'has_avatar' then
      select (avatar_url is not null and btrim(avatar_url) <> '')::int into v from public.profiles where id = p_user;
    when 'has_bio' then
      select (bio is not null and char_length(btrim(bio)) >= 3)::int into v from public.profiles where id = p_user;
    when 'has_profile_color' then
      select (profile_color is not null)::int into v from public.profiles where id = p_user;
    when 'has_music' then
      select (music is not null and jsonb_typeof(music) = 'object')::int into v from public.profiles where id = p_user;
    when 'follows_total' then
      select count(*)::int into v from public.follows where follower_id = p_user;
    when 'posts_total' then
      select count(*)::int into v from public.posts where user_id = p_user;
    when 'stories_total' then
      select count(*)::int into v from public.stories where user_id = p_user;
    when 'comments_total' then
      select count(*)::int into v from public.comments where user_id = p_user;
    when 'highlights_total' then
      select count(*)::int into v from public.highlights where user_id = p_user;
    when 'club_any' then
      select (exists (select 1 from public.club_members where user_id = p_user)
           or exists (select 1 from public.club_join_requests where user_id = p_user))::int into v;
    when 'shop_visited' then
      select exists (select 1 from public.mission_events where user_id = p_user and event_type = 'shop_visited')::int into v;
    when 'daily_claimed_total' then
      select count(*)::int into v from public.mission_events where user_id = p_user and event_type = 'daily_claimed' and not void;
    when 'likes_received_total' then
      select (
        (select count(*) from public.likes l join public.posts p on p.id = l.post_id where p.user_id = p_user and l.user_id <> p_user)
      + (select count(*) from public.comment_likes cl join public.comments c on c.id = cl.comment_id where c.user_id = p_user and cl.user_id <> p_user)
      )::int into v;
    when 'account_age_days' then
      select greatest(0, floor(extract(epoch from (now() - created_at)) / 86400))::int into v from public.profiles where id = p_user;
    else
      v := 0;
  end case;
  return coalesce(v, 0);
end;
$$;

-- 4.8 Cuenta las acciones válidas de una persona dentro de una ventana, según las reglas de la plantilla
create or replace function public.mission_progress_events(
  p_user   uuid,
  p_events text[],
  p_params jsonb,
  p_from   timestamptz,
  p_to     timestamptz,
  p_target integer
)
returns integer
language plpgsql stable security definer set search_path = public as $$
declare
  v_tz        text := public.eco_tz();
  v_min_len   integer := nullif(p_params ->> 'min_len', '')::int;
  v_cap       integer := nullif(p_params ->> 'cap_per_day', '')::int;
  v_mind      integer := nullif(p_params ->> 'min_distinct', '')::int;
  v_dist      text := nullif(p_params ->> 'distinct', '');
  v_true      text[] := coalesce(array(select jsonb_array_elements_text(coalesce(p_params -> 'meta_true',  '[]'::jsonb))), '{}');
  v_false     text[] := coalesce(array(select jsonb_array_elements_text(coalesce(p_params -> 'meta_false', '[]'::jsonb))), '{}');
  v_any       text[] := coalesce(array(select jsonb_array_elements_text(coalesce(p_params -> 'meta_any',   '[]'::jsonb))), '{}');
  v_key       text;
  v_val       integer;
  v_people    integer;
begin
  if v_dist like 'meta:%' then v_key := substr(v_dist, 6); end if;

  with ev as (
    select e.target_user_id, e.meta, e.created_at
    from public.mission_events e
    where e.user_id = p_user
      and e.event_type = any (p_events)
      and not e.void
      and (p_from is null or e.created_at >= p_from)
      and (p_to   is null or e.created_at <  p_to)
      and (v_min_len is null or coalesce((e.meta ->> 'len')::int, 0) >= v_min_len)
      and not exists (select 1 from unnest(v_true)  k where coalesce((e.meta ->> k)::boolean, false) is not true)
      and not exists (select 1 from unnest(v_false) k where coalesce((e.meta ->> k)::boolean, true)  is not false)
      and (cardinality(v_any) = 0 or exists (select 1 from unnest(v_any) k where coalesce((e.meta ->> k)::boolean, false)))
  )
  select
    case
      when v_dist = 'target' then (select count(distinct target_user_id) from ev)
      when v_dist = 'day'    then (select count(distinct (created_at at time zone v_tz)::date) from ev)
      when v_dist like 'meta:%' then (select count(distinct meta ->> v_key) from ev where meta ->> v_key is not null)
      else (select coalesce(sum(case when v_cap is null then c else least(c, v_cap) end), 0)
              from (select count(*) c from ev group by (created_at at time zone v_tz)::date) d)
    end,
    (select count(distinct target_user_id) from ev)
  into v_val, v_people;

  -- «de 5 personas distintas»: sin ese mínimo la misión no se puede completar
  if v_mind is not null and coalesce(v_people, 0) < v_mind then
    v_val := least(coalesce(v_val, 0), greatest(0, p_target - 1));
  end if;

  return coalesce(v_val, 0);
end;
$$;

-- 4.9 Progreso de UNA misión asignada (siempre se calcula al pedirla: no hay contador que se pueda editar)
create or replace function public.mission_progress(
  p_user   uuid,
  p_tpl    public.mission_templates,
  p_from   timestamptz,
  p_to     timestamptz
)
returns integer
language plpgsql stable security definer set search_path = public as $$
declare
  v_total integer := 0;
  v_part  jsonb;
  v_events text[];
begin
  if p_tpl.event_type like 'state:%' then
    return least(p_tpl.target, public.mission_state_progress(p_user, substr(p_tpl.event_type, 7)));
  end if;

  -- combo: varias acciones, cada una con su cantidad
  if p_tpl.params ? 'all_of' then
    for v_part in select * from jsonb_array_elements(p_tpl.params -> 'all_of') loop
      v_total := v_total + least(
        coalesce((v_part ->> 'count')::int, 1),
        public.mission_progress_events(
          p_user, array[v_part ->> 'event'], v_part, p_from, p_to, coalesce((v_part ->> 'count')::int, 1)
        )
      );
    end loop;
    return least(p_tpl.target, v_total);
  end if;

  if p_tpl.params ? 'events' then
    v_events := array(select jsonb_array_elements_text(p_tpl.params -> 'events'));
  else
    v_events := array[p_tpl.event_type];
  end if;
  return least(p_tpl.target, public.mission_progress_events(p_user, v_events, p_tpl.params, p_from, p_to, p_tpl.target));
end;
$$;

-- Ventana efectiva de una misión asignada: si se cambió por otra, solo cuenta lo que se hizo DESPUÉS del cambio
create or replace function public.mission_effective_from(p_um public.user_missions)
returns timestamptz
language sql immutable as $$
  select case when p_um.rerolled_from is not null and p_um.starts_at is not null
              then greatest(p_um.starts_at, p_um.assigned_at)
              else p_um.starts_at end;
$$;


-- 4.10 Catálogo inicial de misiones. Solo se insertan si no existen: si las editas desde el panel,
--      volver a correr este archivo NO pisa tus cambios.
insert into public.mission_templates (id, period, difficulty, category, text, event_type, target, params, reward, weight, active, requires_feature, requires, go_href, sort) values
-- ───── Diarias · fáciles (10 ☾)
('D-F01','daily','easy','social','Da like a 5 publicaciones distintas','like_post',5,'{"meta_true":["post_other"],"cap_per_day":20}',10,10,true,null,null,'/',1),
('D-F02','daily','easy','descubrimiento','Mira 5 historias','story_viewed',5,'{"distinct":"target"}',10,10,true,null,'follows','/',2),
('D-F03','daily','easy','comunidad','Responde la pregunta del día','daily_question_answered',1,'{}',10,12,true,null,null,'/',3),
('D-F04','daily','easy','social','Deja un comentario de al menos 10 caracteres en una publicación ajena','comment_created',1,'{"min_len":10,"meta_true":["post_other"]}',10,10,true,null,null,'/',4),
('D-F05','daily','easy','social','Dale like a una historia','story_liked',1,'{}',10,8,true,null,'follows','/',5),
('D-F06','daily','easy','creacion','Publica una nota','note_created',1,'{}',10,8,true,null,null,'/mensajes',6),
('D-F07','daily','easy','descubrimiento','Sigue a una persona nueva','follow_created',1,'{"meta_true":["fresh"]}',10,10,true,null,null,'/explorar',7),
('D-F08','daily','easy','descubrimiento','Visita 3 perfiles distintos','profile_visited',3,'{"distinct":"target"}',10,8,true,null,null,'/explorar',8),
('D-F09','daily','easy','social','Da like a 3 comentarios','like_comment',3,'{"meta_true":["other"],"cap_per_day":20}',10,8,true,null,null,'/',9),
('D-F10','daily','easy','social','Envía un mensaje a un amigo','dm_sent',1,'{"meta_true":["friend"]}',10,8,true,null,'friend','/mensajes',10),
-- ───── Diarias · medias (20 ☾)
('D-M01','daily','medium','creacion','Publica algo de al menos 40 caracteres','post_created',1,'{"min_len":40}',20,12,true,null,null,'/',11),
('D-M02','daily','medium','social','Comenta en 3 publicaciones distintas','comment_created',3,'{"min_len":10,"distinct":"meta:post_id","meta_true":["post_other"]}',20,10,true,null,null,'/',12),
('D-M03','daily','medium','creacion','Publica una historia','story_published',1,'{}',20,10,true,null,null,'/historias/nueva',13),
('D-M04','daily','medium','social','Responde a 2 comentarios de otras personas','comment_created',2,'{"meta_true":["is_reply","reply_other"]}',20,10,true,null,null,'/',14),
('D-M05','daily','medium','comunidad','Participa en Susurros','whisper_created',1,'{"events":["whisper_created","whisper_comment_created"]}',20,8,true,null,null,'/susurros',15),
('D-M06','daily','medium','social','Comparte la publicación de alguien','repost_created',1,'{}',20,8,true,null,null,'/',16),
('D-M07','daily','medium','social','Menciona (@) a un amigo','mention_made',1,'{"meta_true":["friend"]}',20,8,true,null,'friend','/',17),
('D-M08','daily','medium','creacion','Usa un hashtag en una publicación','post_created',1,'{"meta_true":["has_hashtag"]}',20,10,true,null,null,'/',18),
('D-M09','daily','medium','creacion','Publica con una canción','post_created',1,'{"meta_true":["has_music"]}',20,8,true,null,null,'/',19),
('D-M10','daily','medium','creacion','Publica con una foto','post_created',1,'{"meta_true":["has_image"]}',20,10,true,null,null,'/',20),
('D-M11','daily','medium','social','Da like a 10 publicaciones distintas','like_post',10,'{"meta_true":["post_other"],"cap_per_day":20}',20,8,true,null,null,'/',21),
('D-M12','daily','medium','social','Responde a 2 historias','story_replied',2,'{}',20,8,true,null,'follows','/',22),
-- ───── Diarias · difíciles (35 ☾)
('D-H01','daily','hard','creacion','Combo creador: 1 publicación + 1 historia + 1 comentario','post_created',3,'{"all_of":[{"event":"post_created","count":1},{"event":"story_published","count":1},{"event":"comment_created","count":1,"meta_true":["post_other"]}]}',35,12,true,null,null,'/',31),
('D-H02','daily','hard','social','Comenta en publicaciones de 5 personas distintas (mínimo 15 caracteres)','comment_created',5,'{"min_len":15,"distinct":"target","meta_true":["post_other"]}',35,10,true,null,null,'/',32),
('D-H03','daily','hard','descubrimiento','Descubre: interactúa con 3 personas que no sigues','like_post',3,'{"events":["like_post","comment_created","story_liked"],"distinct":"target","meta_true":["other"],"meta_false":["following"]}',35,10,true,null,null,'/explorar',33),
('D-H04','daily','hard','creacion','Publica una historia con música','story_published',1,'{"meta_true":["has_music"]}',35,8,true,null,null,'/historias/nueva',34),
('D-H05','daily','hard','creacion','Haz una publicación con foto, canción y hashtag','post_created',1,'{"meta_true":["has_image","has_music","has_hashtag"]}',35,8,true,null,null,'/',35),
('D-H06','daily','hard','social','Haz 3 comentarios de al menos 40 caracteres','comment_created',3,'{"min_len":40,"meta_true":["post_other"]}',35,10,true,null,null,'/',36),
('D-H07','daily','hard','social','Recibe comentarios de 3 personas distintas','comment_received',3,'{"distinct":"target"}',35,8,true,null,null,'/',37),
('D-H08','daily','hard','social','Responde a 3 historias de personas distintas','story_replied',3,'{"distinct":"target"}',35,8,true,null,'follows','/',38)
on conflict (id) do nothing;

insert into public.mission_templates (id, period, difficulty, category, text, event_type, target, params, reward, weight, active, requires_feature, requires, go_href, sort) values
-- ───── Semanales · fáciles (60 ☾)
('W-F01','weekly','easy','comunidad','Entra 5 días distintos','login_day',5,'{}',60,10,true,null,null,'/',1),
('W-F02','weekly','easy','social','Da like a 30 publicaciones distintas','like_post',30,'{"meta_true":["post_other"],"cap_per_day":20}',60,10,true,null,null,'/',2),
('W-F03','weekly','easy','descubrimiento','Mira 25 historias','story_viewed',25,'{}',60,10,true,null,'follows','/',3),
('W-F04','weekly','easy','descubrimiento','Sigue a 3 personas nuevas','follow_created',3,'{"meta_true":["fresh"]}',60,10,true,null,null,'/explorar',4),
('W-F05','weekly','easy','comunidad','Responde la pregunta del día 3 veces','daily_question_answered',3,'{"distinct":"day"}',60,10,true,null,null,'/',5),
('W-F06','weekly','easy','social','Comenta 7 veces (mínimo 10 caracteres)','comment_created',7,'{"min_len":10,"meta_true":["post_other"]}',60,10,true,null,null,'/',6),
-- ───── Semanales · medias (90 ☾)
('W-M01','weekly','medium','creacion','Publica 3 veces en días distintos','post_created',3,'{"distinct":"day"}',90,10,true,null,null,'/',11),
('W-M02','weekly','medium','creacion','Publica 3 historias','story_published',3,'{}',90,10,true,null,null,'/historias/nueva',12),
('W-M03','weekly','medium','social','Comenta en 10 publicaciones de 5 o más personas','comment_created',10,'{"min_len":10,"distinct":"meta:post_id","min_distinct":5,"meta_true":["post_other"]}',90,10,true,null,null,'/',13),
('W-M04','weekly','medium','comunidad','Participa en 3 Susurros','whisper_created',3,'{"events":["whisper_created","whisper_comment_created"]}',90,10,true,null,null,'/susurros',14),
('W-M05','weekly','medium','social','Responde a 5 historias','story_replied',5,'{}',90,10,true,null,'follows','/',15),
('W-M06','weekly','medium','creacion','Publica 3 notas','note_created',3,'{}',90,8,true,null,null,'/mensajes',16),
-- ───── Semanales · difíciles (120 ☾)
('W-H01','weekly','hard','comunidad','Completa 5 misiones diarias','daily_claimed',5,'{}',120,10,true,null,null,'/misiones',21),
('W-H02','weekly','hard','creacion','Haz 3 publicaciones con foto o canción','post_created',3,'{"meta_any":["has_image","has_music"]}',120,10,true,null,null,'/',22),
('W-H03','weekly','hard','social','Recibe 15 likes en total de 5 o más personas distintas','like_received',15,'{"min_distinct":5}',120,10,true,null,null,'/',23),
('W-H04','weekly','hard','social','Habla con 5 personas distintas por mensaje','dm_sent',5,'{"distinct":"target"}',120,10,true,null,null,'/mensajes',24),
('W-H05','weekly','hard','comunidad','Participa en tu club 3 veces','club_activity',3,'{}',120,10,false,'club_activity',null,'/clubes',25),
('W-H06','weekly','hard','creacion','Usa 5 hashtags distintos','post_created',5,'{"distinct":"meta:tag1"}',120,10,true,null,null,'/',26),
-- ───── Semanales · desafío (180 ☾)
('W-L01','weekly','challenge','comunidad','Racha: completa al menos 1 misión diaria 6 de 7 días','daily_claimed',6,'{"distinct":"day"}',180,10,true,null,null,'/misiones',31),
('W-L02','weekly','challenge','social','Social: interactúa con 15 personas distintas','like_post',15,'{"events":["like_post","comment_created","story_liked","story_replied","dm_sent","follow_created","repost_created"],"distinct":"target","meta_true":["other"]}',180,10,true,null,null,'/',32),
('W-L03','weekly','challenge','creacion','Creador: 1 publicación + 1 historia + 1 nota + 1 susurro','post_created',4,'{"all_of":[{"event":"post_created","count":1},{"event":"story_published","count":1},{"event":"note_created","count":1},{"event":"whisper_created","count":1}]}',180,10,true,null,null,'/',33),
('W-L04','weekly','challenge','descubrimiento','Exploradora: visita 10 perfiles y sigue a 2','profile_visited',12,'{"all_of":[{"event":"profile_visited","count":10,"distinct":"target"},{"event":"follow_created","count":2,"meta_true":["fresh"]}]}',180,10,true,null,null,'/explorar',34),
('W-L05','weekly','challenge','personalizacion','Estilista: cambia 3 cosas de tu perfil (foto, bio, color, banner…)','profile_updated',3,'{"distinct":"meta:field"}',180,10,true,null,null,'/personalizar',35),
('W-L06','weekly','challenge','descubrimiento','Descubre 3 funciones que no hayas usado','feature_discovery',3,'{}',180,10,false,'feature_discovery',null,'/explorar',36)
on conflict (id) do nothing;

insert into public.mission_templates (id, period, difficulty, category, text, event_type, target, params, reward, weight, active, requires_feature, requires, go_href, sort) values
-- ───── Bienvenida (una vez; ≈ 370 ☾ en total)
('O-01','onboarding',null,'personalizacion','Sube tu foto de perfil','state:has_avatar',1,'{}',50,10,true,null,null,'/editar-perfil',1),
('O-02','onboarding',null,'personalizacion','Escribe tu biografía','state:has_bio',1,'{}',30,10,true,null,null,'/editar-perfil',2),
('O-03','onboarding',null,'personalizacion','Elige el color de tu perfil','state:has_profile_color',1,'{}',30,10,true,null,null,'/personalizar',3),
('O-04','onboarding',null,'descubrimiento','Sigue a 3 personas','state:follows_total',3,'{}',40,10,true,null,null,'/explorar',4),
('O-05','onboarding',null,'creacion','Haz tu primera publicación','state:posts_total',1,'{}',50,10,true,null,null,'/',5),
('O-06','onboarding',null,'creacion','Publica tu primera historia','state:stories_total',1,'{}',50,10,true,null,null,'/historias/nueva',6),
('O-07','onboarding',null,'comunidad','Únete o solicita entrar a un club','state:club_any',1,'{}',40,10,true,null,null,'/clubes',7),
('O-08','onboarding',null,'personalizacion','Pon una canción en tu perfil','state:has_music',1,'{}',30,10,true,null,null,'/editar-perfil',8),
('O-09','onboarding',null,'descubrimiento','Visita la tienda','state:shop_visited',1,'{}',20,10,true,null,null,'/tienda',9),
('O-10','onboarding',null,'comunidad','Reclama tu primera misión diaria','state:daily_claimed_total',1,'{}',30,10,true,null,null,'/misiones',10),
-- ───── Logros (una vez cada uno)
('A-01','achievement',null,'social','Recibe tu primer like','state:likes_received_total',1,'{}',20,10,true,null,null,'/',1),
('A-02','achievement',null,'social','Deja tu primer comentario','state:comments_total',1,'{}',20,10,true,null,null,'/',2),
('A-03','achievement',null,'social','Recibe 100 likes','state:likes_received_total',100,'{}',150,10,true,null,null,'/',3),
('A-04','achievement',null,'creacion','Crea tu primera destacada','state:highlights_total',1,'{}',50,10,true,null,null,'/historias/archivo',4),
('A-05','achievement',null,'creacion','Publica 10 historias','state:stories_total',10,'{}',100,10,true,null,null,'/historias/nueva',5),
('A-06','achievement',null,'social','Deja 50 comentarios','state:comments_total',50,'{}',100,10,true,null,null,'/',6),
('A-07','achievement',null,'comunidad','Cumple 1 año en DaiwaPlace','state:account_age_days',365,'{}',300,10,true,null,null,'/',7),
('A-08','achievement',null,'personalizacion','Ten 5 cosméticos en tu colección','state:cosmetics_total',5,'{}',150,10,false,'shop',null,'/tienda',8),
('A-09','achievement',null,'personalizacion','Completa tu primera colección','state:collections_done',1,'{}',400,10,false,'shop',null,'/tienda',9)
on conflict (id) do nothing;

-- Las rachas de 7 y 30 días ya pagan con sus hitos de racha (sección 4.14): por eso no hay logros aparte.


-- 4.11 Asignación de misiones (perezosa e idempotente: pedirlas dos veces devuelve las mismas)
--      Diarias: 1 fácil + 1 media + 1 difícil, sin repetir las de los 2 días anteriores ni la categoría.
--      Semanales: 1 fácil + 1 media + 1 difícil + 1 desafío, sin repetir las de las 2 semanas anteriores.
--      Más peso a las funciones que la persona todavía no ha usado. Nunca algo imposible para su cuenta.
create or replace function public.mission_pick(
  p_user       uuid,
  p_period     text,
  p_difficulty text,
  p_start      timestamptz,
  p_key        text,
  p_exclude    text default null     -- plantilla que se está cambiando (no se repite)
)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_back   interval := case when p_period = 'weekly' then interval '14 days' else interval '2 days' end;
  v_id     text;
  v_try    integer;
begin
  for v_try in 1..3 loop
    select t.id into v_id
    from public.mission_templates t
    where t.period = p_period
      and t.difficulty = p_difficulty
      and t.active
      and t.weight > 0
      and t.id is distinct from p_exclude
      and (t.requires is null or public.mission_requires_ok(p_user, t.requires))
      -- ya asignada en este periodo
      and not exists (select 1 from public.user_missions um where um.user_id = p_user and um.template_id = t.id and um.period_key = p_key)
      -- intento 1 y 2: sin repetir las recientes
      and (v_try >= 3 or not exists (
            select 1 from public.user_missions um
            where um.user_id = p_user and um.template_id = t.id and um.starts_at >= p_start - v_back and um.period_key <> p_key))
      -- intento 1: tampoco repetir categoría dentro del mismo día
      and (v_try >= 2 or p_period <> 'daily' or not exists (
            select 1 from public.user_missions um
            join public.mission_templates t2 on t2.id = um.template_id
            where um.user_id = p_user and um.period_key = p_key and t2.category = t.category))
    order by -ln(greatest(random(), 1e-9)) /
             (t.weight * case when t.event_type not like 'state:%'
                               and not exists (select 1 from public.mission_events e where e.user_id = p_user and e.event_type = t.event_type)
                              then 3 else 1 end)
    limit 1;
    exit when v_id is not null;
  end loop;
  return v_id;
end;
$$;

create or replace function public.missions_assign(p_user uuid, p_period text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  w       record;
  v_slot  text;
  v_slots text[];
  v_tpl   text;
begin
  select * into w from public.mission_window(p_period);
  v_slots := case when p_period = 'weekly' then array['easy', 'medium', 'hard', 'challenge'] else array['easy', 'medium', 'hard'] end;

  foreach v_slot in array v_slots loop
    -- ¿ya tiene una misión de esta dificultad en este periodo?
    if exists (
      select 1 from public.user_missions um
      join public.mission_templates t on t.id = um.template_id
      where um.user_id = p_user and um.period_key = w.period_key and t.period = p_period and t.difficulty = v_slot
    ) then continue; end if;
    v_tpl := public.mission_pick(p_user, p_period, v_slot, w.starts_at, w.period_key);
    if v_tpl is not null then
      insert into public.user_missions (user_id, template_id, period_key, starts_at, ends_at)
      values (p_user, v_tpl, w.period_key, w.starts_at, w.ends_at)
      on conflict (user_id, template_id, period_key) do nothing;
    end if;
  end loop;
end;
$$;

-- Bienvenida y logros: una fila por plantilla activa (la primera vez que se piden)
create or replace function public.missions_assign_once(p_user uuid, p_period text)
returns void
language sql security definer set search_path = public as $$
  insert into public.user_missions (user_id, template_id, period_key)
  select p_user, t.id, 'once'
  from public.mission_templates t
  where t.period = p_period and t.active
  on conflict (user_id, template_id, period_key) do nothing;
$$;

-- 4.12 Arma la lista de misiones (con progreso) de un periodo, lista para la pantalla
create or replace function public.missions_build(p_user uuid, p_period text, p_key text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  r        record;
  v_prog   integer;
  v_arr    jsonb := '[]'::jsonb;
  v_mult   numeric := public.eco_multiplier();
  v_reward integer;
begin
  for r in
    select um.*, t.period, t.difficulty, t.category, t.text, t.event_type, t.target, t.reward, t.go_href, t.sort, t.active
    from public.user_missions um
    join public.mission_templates t on t.id = um.template_id
    where um.user_id = p_user and um.period_key = p_key and t.period = p_period
    order by coalesce(array_position(array['easy','medium','hard','challenge'], t.difficulty), 9), t.sort, t.id
  loop
    v_prog := public.mission_progress(
      p_user,
      (select t from public.mission_templates t where t.id = r.template_id),
      public.mission_effective_from(row(r.id, r.user_id, r.template_id, r.period_key, r.starts_at, r.ends_at, r.assigned_at, r.claimed_at, r.reward_paid, r.rerolled_from)::public.user_missions),
      r.ends_at
    );
    v_reward := case when r.period in ('daily', 'weekly', 'event') then round(r.reward * v_mult)::int else r.reward end;
    v_arr := v_arr || jsonb_build_object(
      'id', r.id, 'template_id', r.template_id, 'period', r.period, 'difficulty', r.difficulty,
      'category', r.category, 'text', r.text, 'target', r.target, 'progress', v_prog,
      'reward', coalesce(r.reward_paid, v_reward), 'claimed', r.claimed_at is not null,
      'claimable', r.claimed_at is null and v_prog >= r.target,
      'rerolled', r.rerolled_from is not null, 'go_href', r.go_href
    );
  end loop;
  return v_arr;
end;
$$;

-- Misiones de HOY
create or replace function public.missions_today()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  w       record;
  v_free  integer;
  v_cost  integer := greatest(0, public.eco_cfg_num('reroll_cost', 25)::int);
  v_bonus integer := greatest(0, public.eco_cfg_num('daily_bonus_coins', 15)::int);
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  perform public.missions_assign(v_me, 'daily');
  select * into w from public.mission_window('daily');
  select greatest(0, 1 - count(*))::int into v_free
    from public.user_missions where user_id = v_me and period_key = w.period_key and rerolled_from is not null;
  return jsonb_build_object(
    'period_key', w.period_key,
    'ends_at', w.ends_at,
    'server_now', now(),
    'missions', public.missions_build(v_me, 'daily', w.period_key),
    'rerolls_free_left', v_free,
    'reroll_cost', v_cost,
    'bonus_amount', v_bonus,
    'bonus_paid', exists (select 1 from public.coin_ledger where idempotency_key = 'daily3:' || v_me::text || ':' || w.period_key),
    'multiplier', public.eco_multiplier()
  );
end;
$$;

-- Misiones de la SEMANA (+ el cofre)
create or replace function public.missions_week()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me     uuid := auth.uid();
  w        record;
  v_total  integer;
  v_done   integer;
  v_chest  integer := greatest(0, public.eco_cfg_num('chest_coins', 100)::int);
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  perform public.missions_assign(v_me, 'weekly');
  select * into w from public.mission_window('weekly');
  select count(*)::int, count(*) filter (where um.claimed_at is not null)::int into v_total, v_done
    from public.user_missions um join public.mission_templates t on t.id = um.template_id
   where um.user_id = v_me and um.period_key = w.period_key and t.period = 'weekly';
  return jsonb_build_object(
    'period_key', w.period_key,
    'ends_at', w.ends_at,
    'server_now', now(),
    'missions', public.missions_build(v_me, 'weekly', w.period_key),
    'chest_amount', v_chest,
    'chest_ready', v_total > 0 and v_done = v_total,
    'chest_paid', exists (select 1 from public.coin_ledger where idempotency_key = 'chest:' || v_me::text || ':' || w.period_key),
    'multiplier', public.eco_multiplier()
  );
end;
$$;

create or replace function public.missions_onboarding()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  perform public.missions_assign_once(v_me, 'onboarding');
  return public.missions_build(v_me, 'onboarding', 'once');
end;
$$;

create or replace function public.achievements_list()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  perform public.missions_assign_once(v_me, 'achievement');
  return public.missions_build(v_me, 'achievement', 'once');
end;
$$;

-- 4.13 Reclamar una misión. TODO en una transacción, con la fila bloqueada: un doble toque paga UNA vez.
--      Se vuelve a comprobar el progreso en el servidor (no se puede «completar» desde la consola).
create or replace function public.mission_claim(p_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me     uuid := auth.uid();
  um       public.user_missions%rowtype;
  t        public.mission_templates%rowtype;
  v_prog   integer;
  v_reward integer;
  res      jsonb;
  v_bonus  jsonb := null;
  v_bamt   integer;
  v_done   integer;
  v_age    integer;
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  select * into um from public.user_missions where id = p_id and user_id = v_me for update;
  if not found then raise exception 'No encontré esa misión'; end if;
  if um.claimed_at is not null then raise exception 'Ya reclamaste esta misión'; end if;
  select * into t from public.mission_templates where id = um.template_id;
  if um.ends_at is not null and um.ends_at <= now() then raise exception 'Esta misión ya terminó'; end if;

  v_prog := public.mission_progress(v_me, t, public.mission_effective_from(um), um.ends_at);
  if v_prog < t.target then raise exception 'Todavía no completas esta misión'; end if;

  v_reward := case when t.period in ('daily', 'weekly', 'event') then round(t.reward * public.eco_multiplier())::int else t.reward end;

  if v_reward > 0 then
    res := public.coins_apply(v_me, v_reward, 'mission_claim', 'mission', um.id::text, 'mission:' || um.id::text || ':claim');
  else
    res := jsonb_build_object('applied', true, 'delta', 0, 'balance', public.coins_balance());
  end if;

  update public.user_missions set claimed_at = now(), reward_paid = v_reward where id = um.id;

  if t.period = 'daily' then
    -- cuenta para las misiones semanales (W-H01, W-L01)
    insert into public.mission_events (user_id, event_type, ref_id, meta)
    values (v_me, 'daily_claimed', um.id::text, jsonb_build_object('template', t.id))
    on conflict (user_id, event_type, ref_id) do nothing;

    -- bono «las 3 del día»
    select count(*)::int into v_done
      from public.user_missions x join public.mission_templates tx on tx.id = x.template_id
     where x.user_id = v_me and x.period_key = um.period_key and tx.period = 'daily' and x.claimed_at is not null;
    if v_done >= 3 then
      v_bamt := greatest(0, public.eco_cfg_num('daily_bonus_coins', 15)::int);
      if v_bamt > 0 then
        v_bonus := public.coins_apply(v_me, v_bamt, 'daily_bonus', 'daily', um.period_key, 'daily3:' || v_me::text || ':' || um.period_key);
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'reward', v_reward,
    'balance', coalesce((select coins from public.user_wallets where user_id = v_me), 0),
    'bonus', case when v_bonus is not null and (v_bonus ->> 'applied')::boolean then (v_bonus ->> 'delta')::int else 0 end
  );
end;
$$;

-- 4.14 Cambiar una misión por otra de la misma dificultad (1 gratis al día; las demás cuestan Lunas)
create or replace function public.mission_reroll(p_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me     uuid := auth.uid();
  um       public.user_missions%rowtype;
  t        public.mission_templates%rowtype;
  v_used   integer;
  v_cost   integer := greatest(0, public.eco_cfg_num('reroll_cost', 25)::int);
  v_new    text;
  v_paid   integer := 0;
  w        record;
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  select * into um from public.user_missions where id = p_id and user_id = v_me for update;
  if not found then raise exception 'No encontré esa misión'; end if;
  select * into t from public.mission_templates where id = um.template_id;
  if t.period <> 'daily' then raise exception 'Solo se pueden cambiar las misiones del día'; end if;
  if um.claimed_at is not null then raise exception 'Esta misión ya está reclamada'; end if;
  if um.ends_at <= now() then raise exception 'Esta misión ya terminó'; end if;
  if public.mission_progress(v_me, t, public.mission_effective_from(um), um.ends_at) >= t.target then
    raise exception 'Esta misión ya está completa: reclámala';
  end if;

  select * into w from public.mission_window('daily');
  select count(*)::int into v_used from public.user_missions where user_id = v_me and period_key = um.period_key and rerolled_from is not null;

  v_new := public.mission_pick(v_me, 'daily', t.difficulty, w.starts_at, um.period_key, t.id);
  if v_new is null then raise exception 'No hay otra misión disponible para cambiar'; end if;

  if v_used >= 1 and v_cost > 0 then
    perform public.coins_apply(v_me, -v_cost, 'mission_reroll', 'mission', um.id::text, 'reroll:' || um.id::text || ':' || (v_used + 1)::text);
    v_paid := v_cost;
  end if;

  update public.user_missions
     set template_id = v_new, rerolled_from = t.id, assigned_at = now()
   where id = um.id;

  return jsonb_build_object('ok', true, 'paid', v_paid, 'template_id', v_new);
end;
$$;

-- 4.15 Rachas: entrar cada día. Hitos 3 / 7 / 14 / 30 con premio; ciclo de 30 días.
create or replace function public.streak_state(p_user uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  s        public.mission_streaks%rowtype;
  v_today  date := (now() at time zone public.eco_tz())::date;
  v_cur    integer := 0;
  v_cycle  integer;
  v_start  date;
  v_ms     jsonb := '[]'::jsonb;
  d        integer;
  amt      integer;
begin
  select * into s from public.mission_streaks where user_id = p_user;
  if found and s.last_day is not null and s.last_day >= v_today - 1 then v_cur := s.current; end if;
  v_cycle := case when v_cur = 0 then 0 else ((v_cur - 1) % 30) + 1 end;
  if v_cur > 0 and s.last_day is not null then v_start := s.last_day - (v_cycle - 1); end if;

  foreach d in array array[3, 7, 14, 30] loop
    amt := case d when 3 then 20 when 7 then 100 when 14 then 200 else 500 end;
    amt := greatest(0, public.eco_cfg_num('streak_' || d::text, amt)::int);
    v_ms := v_ms || jsonb_build_object(
      'day', d, 'amount', amt,
      'reached', v_cycle >= d,
      'claimed', v_start is not null and exists (
        select 1 from public.coin_ledger where idempotency_key = 'streak:' || p_user::text || ':' || v_start::text || ':' || d::text)
    );
  end loop;

  return jsonb_build_object(
    'current', v_cur, 'best', coalesce(s.best, 0), 'cycle_day', v_cycle,
    'today_done', found and s.last_day = v_today,
    'milestones', v_ms
  );
end;
$$;

create or replace function public.streak_touch()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  v_today date := (now() at time zone public.eco_tz())::date;
  s       public.mission_streaks%rowtype;
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  insert into public.mission_streaks (user_id) values (v_me) on conflict (user_id) do nothing;
  select * into s from public.mission_streaks where user_id = v_me for update;

  if s.last_day is distinct from v_today then
    update public.mission_streaks
       set current  = case when s.last_day = v_today - 1 then s.current + 1 else 1 end,
           best     = greatest(s.best, case when s.last_day = v_today - 1 then s.current + 1 else 1 end),
           last_day = v_today
     where user_id = v_me;
  end if;

  -- «Entra 5 días distintos» (misión semanal): un evento por día
  insert into public.mission_events (user_id, event_type, ref_id)
  values (v_me, 'login_day', v_today::text)
  on conflict (user_id, event_type, ref_id) do nothing;

  return public.streak_state(v_me);
end;
$$;

create or replace function public.streak_claim(p_day integer)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  st     jsonb;
  m      jsonb;
  s      public.mission_streaks%rowtype;
  v_cycle integer;
  v_start date;
  v_age   integer;
  res    jsonb;
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  if p_day not in (3, 7, 14, 30) then raise exception 'Ese hito no existe'; end if;
  select greatest(0, floor(extract(epoch from (now() - created_at)) / 86400))::int into v_age from public.profiles where id = v_me;
  if coalesce(v_age, 0) < 3 then raise exception 'Los premios de racha se desbloquean cuando tu cuenta tiene 3 días'; end if;

  st := public.streak_state(v_me);
  select * into m from jsonb_array_elements(st -> 'milestones') e where (e ->> 'day')::int = p_day;
  if m is null or not (m ->> 'reached')::boolean then raise exception 'Todavía no llegas a ese día de racha'; end if;
  if (m ->> 'claimed')::boolean then raise exception 'Ya reclamaste este premio de racha'; end if;
  if (m ->> 'amount')::int <= 0 then raise exception 'Este premio no está disponible'; end if;

  select * into s from public.mission_streaks where user_id = v_me;
  v_cycle := (st ->> 'cycle_day')::int;
  v_start := s.last_day - (v_cycle - 1);
  res := public.coins_apply(v_me, (m ->> 'amount')::int, 'streak', 'streak', v_start::text || ':' || p_day::text,
                            'streak:' || v_me::text || ':' || v_start::text || ':' || p_day::text);
  return jsonb_build_object('ok', true, 'reward', (m ->> 'amount')::int, 'balance', (res ->> 'balance')::int, 'applied', (res ->> 'applied')::boolean);
end;
$$;

-- 4.16 Cofre semanal: al completar las 4 misiones de la semana (premio FIJO, nada de azar)
create or replace function public.chest_claim()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  w       record;
  v_total integer;
  v_done  integer;
  v_amt   integer := greatest(0, public.eco_cfg_num('chest_coins', 100)::int);
  v_age   integer;
  res     jsonb;
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  select greatest(0, floor(extract(epoch from (now() - created_at)) / 86400))::int into v_age from public.profiles where id = v_me;
  if coalesce(v_age, 0) < 3 then raise exception 'El cofre se desbloquea cuando tu cuenta tiene 3 días'; end if;
  select * into w from public.mission_window('weekly');
  select count(*)::int, count(*) filter (where um.claimed_at is not null)::int into v_total, v_done
    from public.user_missions um join public.mission_templates t on t.id = um.template_id
   where um.user_id = v_me and um.period_key = w.period_key and t.period = 'weekly';
  if v_total = 0 or v_done < v_total then raise exception 'Completa y reclama las 4 misiones de la semana para abrir el cofre'; end if;
  if v_amt <= 0 then raise exception 'El cofre no está disponible'; end if;
  res := public.coins_apply(v_me, v_amt, 'chest', 'chest', w.period_key, 'chest:' || v_me::text || ':' || w.period_key);
  if not (res ->> 'applied')::boolean then raise exception 'Ya abriste el cofre de esta semana'; end if;
  return jsonb_build_object('ok', true, 'reward', v_amt, 'balance', (res ->> 'balance')::int);
end;
$$;

-- 4.17 Resumen para el chip de saldo (y el puntito de «tienes misiones por reclamar»)
create or replace function public.wallet_summary()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me      uuid := auth.uid();
  um        public.user_missions%rowtype;
  t         public.mission_templates%rowtype;
  v_claim   integer := 0;
  v_fs      jsonb;
  v_streak  jsonb;
begin
  if v_me is null then return null; end if;

  -- misiones asignadas que se pueden reclamar ahora mismo
  for um in
    select x.* from public.user_missions x
    join public.mission_templates tt on tt.id = x.template_id
    where x.user_id = v_me and x.claimed_at is null and tt.active
      and (x.ends_at is null or x.ends_at > now())
  loop
    select * into t from public.mission_templates where id = um.template_id;
    if public.mission_progress(v_me, t, public.mission_effective_from(um), um.ends_at) >= t.target then
      v_claim := v_claim + 1;
    end if;
  end loop;

  v_fs := public.founder_status();
  v_streak := public.streak_state(v_me);

  return jsonb_build_object(
    'balance', coalesce((select coins from public.user_wallets where user_id = v_me), 0),
    'currency', public.eco_cfg_text('currency_name', 'Lunas'),
    'claimable', v_claim,
    'founder_available', (v_fs ->> 'eligible')::boolean and not (v_fs ->> 'claimed')::boolean,
    'streak', (v_streak ->> 'current')::int,
    'multiplier', public.eco_multiplier()
  );
end;
$$;

-- Se llama al abrir la app (una vez cada rato): marca el día, asigna las misiones y devuelve el resumen
create or replace function public.economy_touch()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null then return null; end if;
  begin
    perform public.streak_touch();
    perform public.missions_assign(v_me, 'daily');
    perform public.missions_assign(v_me, 'weekly');
  exception when others then
    null;   -- la economía nunca debe tumbar la app
  end;
  return public.wallet_summary();
end;
$$;


-- =====================================================================
-- 5) TRIGGERS: registran las acciones REALES para las misiones
-- =====================================================================
-- Todos están envueltos en «begin … exception when others then null» para que
-- un fallo de misiones NUNCA impida la acción real (como pasa con los avisos).

-- Registra una acción (no cuenta dos veces lo mismo; si estaba anulada, se reactiva SIN cambiar su fecha)
create or replace function public.mission_track(p_user uuid, p_type text, p_ref text, p_target uuid, p_meta jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_user is null or p_ref is null then return; end if;
  insert into public.mission_events (user_id, event_type, ref_id, target_user_id, meta)
  values (p_user, p_type, p_ref, p_target, coalesce(p_meta, '{}'::jsonb))
  on conflict (user_id, event_type, ref_id) do update set void = false
  where public.mission_events.void;
end;
$$;

-- Anula las acciones que salieron de algo que se borró (publicación, comentario, like quitado…)
create or replace function public.mission_void(p_ref text, p_types text[] default null)
returns void
language sql security definer set search_path = public as $$
  update public.mission_events set void = true
   where ref_id = p_ref and not void and (p_types is null or event_type = any (p_types));
$$;

-- ¿La acción de a sobre b cuenta? (no a uno mismo, no con bloqueos, no con cuentas congeladas)
create or replace function public.mission_target_ok(p_actor uuid, p_target uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select p_actor is not null and p_target is not null and p_actor <> p_target
     and not public.is_blocked_between(p_actor, p_target)
     and not public.eco_is_frozen(p_target);
$$;

create or replace function public.mission_following(p_actor uuid, p_target uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.follows where follower_id = p_actor and following_id = p_target);
$$;

-- Menciones: ¿hay alguien (que exista y no sea uno mismo) mencionado? ¿alguno es amigo?
create or replace function public.mission_mentions(p_actor uuid, p_text text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  m text[];
  v_id uuid;
  v_any boolean := false;
  v_friend boolean := false;
begin
  for m in select regexp_matches(coalesce(p_text, ''), '(?:^|[^A-Za-z0-9_.@#])@([A-Za-z0-9_.]{3,24})', 'g') loop
    select id into v_id from public.profiles where lower(username) = lower(m[1]);
    if v_id is not null and v_id <> p_actor then
      v_any := true;
      if public.are_friends(p_actor, v_id) then v_friend := true; end if;
    end if;
  end loop;
  return jsonb_build_object('any', v_any, 'friend', v_friend);
end;
$$;

-- 5.1 Publicaciones
create or replace function public.trg_mt_post()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_txt  text := coalesce(new.content, '');
  v_men  jsonb;
begin
  begin
    perform public.mission_track(new.user_id, 'post_created', new.id::text, null, jsonb_build_object(
      'len', char_length(btrim(v_txt)),
      'has_image', new.images is not null and jsonb_typeof(new.images) = 'array' and jsonb_array_length(new.images) > 0,
      'has_music', new.music is not null and jsonb_typeof(new.music) = 'object',
      'has_hashtag', v_txt ~ '#[A-Za-z0-9_]{1,50}',
      'tag1', lower((regexp_match(v_txt, '#([A-Za-z0-9_]{1,50})'))[1]),
      'has_mention', v_txt ~ '@[A-Za-z0-9_.]{3,24}'
    ));
    if v_txt ~* '#preguntadeldia' then
      perform public.mission_track(new.user_id, 'daily_question_answered', new.id::text, null, '{}'::jsonb);
    end if;
    v_men := public.mission_mentions(new.user_id, v_txt);
    if (v_men ->> 'any')::boolean then
      perform public.mission_track(new.user_id, 'mention_made', new.id::text, null, jsonb_build_object('friend', (v_men ->> 'friend')::boolean));
    end if;
  exception when others then null;
  end;
  return new;
end;
$$;
create or replace function public.trg_mt_post_del()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin perform public.mission_void(old.id::text, array['post_created', 'daily_question_answered', 'mention_made']);
  exception when others then null; end;
  return old;
end;
$$;
drop trigger if exists mt_post on public.posts;
create trigger mt_post after insert on public.posts for each row execute function public.trg_mt_post();
drop trigger if exists mt_post_del on public.posts;
create trigger mt_post_del after delete on public.posts for each row execute function public.trg_mt_post_del();

-- 5.2 Comentarios (el que comenta y quien los recibe)
create or replace function public.trg_mt_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner  uuid;
  v_parent uuid;
  v_target uuid;
  v_men    jsonb;
begin
  begin
    select user_id into v_owner from public.posts where id = new.post_id;
    if new.parent_comment_id is not null then
      select user_id into v_parent from public.comments where id = new.parent_comment_id;
    end if;
    v_target := case when v_parent is not null then v_parent else v_owner end;

    if v_owner is not null and not public.is_blocked_between(new.user_id, v_owner)
       and not (v_target <> new.user_id and public.eco_is_frozen(v_target)) then
      perform public.mission_track(new.user_id, 'comment_created', new.id::text, v_target, jsonb_build_object(
        'len', char_length(btrim(coalesce(new.content, ''))),
        'is_reply', new.parent_comment_id is not null,
        'post_other', v_owner <> new.user_id,
        'reply_other', v_parent is not null and v_parent <> new.user_id,
        'other', v_target <> new.user_id,
        'following', public.mission_following(new.user_id, v_target),
        'post_id', new.post_id::text
      ));
    end if;

    -- quien recibe el comentario (dueño de la publicación y, si es respuesta, dueño del comentario)
    if v_owner is not null and public.mission_target_ok(new.user_id, v_owner) then
      perform public.mission_track(v_owner, 'comment_received', new.id::text, new.user_id, '{}'::jsonb);
    elsif v_parent is not null and public.mission_target_ok(new.user_id, v_parent) then
      perform public.mission_track(v_parent, 'comment_received', new.id::text, new.user_id, '{}'::jsonb);
    end if;

    v_men := public.mission_mentions(new.user_id, new.content);
    if (v_men ->> 'any')::boolean then
      perform public.mission_track(new.user_id, 'mention_made', new.id::text, null, jsonb_build_object('friend', (v_men ->> 'friend')::boolean));
    end if;
  exception when others then null;
  end;
  return new;
end;
$$;
create or replace function public.trg_mt_comment_del()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin perform public.mission_void(old.id::text, array['comment_created', 'comment_received', 'mention_made']);
  exception when others then null; end;
  return old;
end;
$$;
drop trigger if exists mt_comment on public.comments;
create trigger mt_comment after insert on public.comments for each row execute function public.trg_mt_comment();
drop trigger if exists mt_comment_del on public.comments;
create trigger mt_comment_del after delete on public.comments for each row execute function public.trg_mt_comment_del();

-- 5.3 Likes en publicaciones
create or replace function public.trg_mt_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  begin
    select user_id into v_owner from public.posts where id = new.post_id;
    if public.mission_target_ok(new.user_id, v_owner) then
      perform public.mission_track(new.user_id, 'like_post', new.post_id::text, v_owner, jsonb_build_object(
        'post_other', true, 'other', true, 'following', public.mission_following(new.user_id, v_owner)));
      perform public.mission_track(v_owner, 'like_received', 'p:' || new.post_id::text || ':' || new.user_id::text, new.user_id, '{}'::jsonb);
    end if;
  exception when others then null;
  end;
  return new;
end;
$$;
create or replace function public.trg_mt_like_del()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform public.mission_void(old.post_id::text, array['like_post']);
    perform public.mission_void('p:' || old.post_id::text || ':' || old.user_id::text, array['like_received']);
  exception when others then null; end;
  return old;
end;
$$;
drop trigger if exists mt_like on public.likes;
create trigger mt_like after insert on public.likes for each row execute function public.trg_mt_like();
drop trigger if exists mt_like_del on public.likes;
create trigger mt_like_del after delete on public.likes for each row execute function public.trg_mt_like_del();

-- 5.4 Likes en comentarios
create or replace function public.trg_mt_comment_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid;
begin
  begin
    select user_id into v_author from public.comments where id = new.comment_id;
    if public.mission_target_ok(new.user_id, v_author) then
      perform public.mission_track(new.user_id, 'like_comment', new.comment_id::text, v_author, jsonb_build_object(
        'other', true, 'following', public.mission_following(new.user_id, v_author)));
      perform public.mission_track(v_author, 'like_received', 'c:' || new.comment_id::text || ':' || new.user_id::text, new.user_id, '{}'::jsonb);
    end if;
  exception when others then null;
  end;
  return new;
end;
$$;
create or replace function public.trg_mt_comment_like_del()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform public.mission_void(old.comment_id::text, array['like_comment']);
    perform public.mission_void('c:' || old.comment_id::text || ':' || old.user_id::text, array['like_received']);
  exception when others then null; end;
  return old;
end;
$$;
drop trigger if exists mt_comment_like on public.comment_likes;
create trigger mt_comment_like after insert on public.comment_likes for each row execute function public.trg_mt_comment_like();
drop trigger if exists mt_comment_like_del on public.comment_likes;
create trigger mt_comment_like_del after delete on public.comment_likes for each row execute function public.trg_mt_comment_like_del();

-- 5.5 Seguir (solo cuenta si NO seguías a esa persona en los últimos 30 días: nada de seguir/dejar de seguir)
create or replace function public.trg_mt_follow()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_fresh boolean;
begin
  begin
    if public.mission_target_ok(new.follower_id, new.following_id) then
      v_fresh := not exists (
        select 1 from public.mission_events
        where user_id = new.follower_id and event_type = 'follow_created' and target_user_id = new.following_id
          and created_at > now() - interval '30 days');
      perform public.mission_track(new.follower_id, 'follow_created',
        new.following_id::text || ':' || to_char(now() at time zone public.eco_tz(), 'YYYYMMDD'),
        new.following_id, jsonb_build_object('fresh', v_fresh, 'other', true, 'following', false));
    end if;
  exception when others then null;
  end;
  return new;
end;
$$;
create or replace function public.trg_mt_follow_del()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    update public.mission_events set void = true
     where user_id = old.follower_id and event_type = 'follow_created' and target_user_id = old.following_id
       and not void and created_at > now() - interval '1 day';
  exception when others then null; end;
  return old;
end;
$$;
drop trigger if exists mt_follow on public.follows;
create trigger mt_follow after insert on public.follows for each row execute function public.trg_mt_follow();
drop trigger if exists mt_follow_del on public.follows;
create trigger mt_follow_del after delete on public.follows for each row execute function public.trg_mt_follow_del();

-- 5.6 Notas, likes de notas, compartidos, destacadas, clubes
create or replace function public.trg_mt_note()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin perform public.mission_track(new.user_id, 'note_created', new.id::text, null, '{}'::jsonb);
  exception when others then null; end;
  return new;
end;
$$;
drop trigger if exists mt_note on public.notes;
create trigger mt_note after insert on public.notes for each row execute function public.trg_mt_note();

create or replace function public.trg_mt_note_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  begin
    select user_id into v_owner from public.notes where id = new.note_id;
    if public.mission_target_ok(new.user_id, v_owner) then
      perform public.mission_track(new.user_id, 'like_note', new.note_id::text, v_owner, jsonb_build_object('other', true));
    end if;
  exception when others then null; end;
  return new;
end;
$$;
drop trigger if exists mt_note_like on public.note_likes;
create trigger mt_note_like after insert on public.note_likes for each row execute function public.trg_mt_note_like();

create or replace function public.trg_mt_repost()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  begin
    select user_id into v_owner from public.posts where id = new.post_id;
    if public.mission_target_ok(new.user_id, v_owner) then
      perform public.mission_track(new.user_id, 'repost_created', new.post_id::text, v_owner, jsonb_build_object('other', true, 'following', public.mission_following(new.user_id, v_owner)));
    end if;
  exception when others then null; end;
  return new;
end;
$$;
create or replace function public.trg_mt_repost_del()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    update public.mission_events set void = true
     where user_id = old.user_id and event_type = 'repost_created' and ref_id = old.post_id::text and not void;
  exception when others then null; end;
  return old;
end;
$$;
drop trigger if exists mt_repost on public.reposts;
create trigger mt_repost after insert on public.reposts for each row execute function public.trg_mt_repost();
drop trigger if exists mt_repost_del on public.reposts;
create trigger mt_repost_del after delete on public.reposts for each row execute function public.trg_mt_repost_del();

create or replace function public.trg_mt_highlight()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin perform public.mission_track(new.user_id, 'highlight_created', new.id::text, null, '{}'::jsonb);
  exception when others then null; end;
  return new;
end;
$$;
drop trigger if exists mt_highlight on public.highlights;
create trigger mt_highlight after insert on public.highlights for each row execute function public.trg_mt_highlight();

create or replace function public.trg_mt_club_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin perform public.mission_track(new.user_id, 'club_joined', new.club_id::text, null, '{}'::jsonb);
  exception when others then null; end;
  return new;
end;
$$;
drop trigger if exists mt_club_member on public.club_members;
create trigger mt_club_member after insert on public.club_members for each row execute function public.trg_mt_club_member();

create or replace function public.trg_mt_club_request()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin perform public.mission_track(new.user_id, 'club_requested', new.club_id::text, null, '{}'::jsonb);
  exception when others then null; end;
  return new;
end;
$$;
drop trigger if exists mt_club_request on public.club_join_requests;
create trigger mt_club_request after insert on public.club_join_requests for each row execute function public.trg_mt_club_request();

-- 5.7 Susurros (el autor real vive en tablas privadas; aquí solo se cuenta que participó, nunca qué escribió)
create or replace function public.trg_mt_whisper_author()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin perform public.mission_track(new.user_id, 'whisper_created', new.whisper_id::text, null, '{}'::jsonb);
  exception when others then null; end;
  return new;
end;
$$;
drop trigger if exists mt_whisper_author on public.whisper_authors;
create trigger mt_whisper_author after insert on public.whisper_authors for each row execute function public.trg_mt_whisper_author();

create or replace function public.trg_mt_wcomment_author()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin perform public.mission_track(new.user_id, 'whisper_comment_created', new.comment_id::text, null, '{}'::jsonb);
  exception when others then null; end;
  return new;
end;
$$;
drop trigger if exists mt_wcomment_author on public.whisper_comment_authors;
create trigger mt_wcomment_author after insert on public.whisper_comment_authors for each row execute function public.trg_mt_wcomment_author();

-- 5.8 Historias: publicar, ver, dar like
create or replace function public.trg_mt_story()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform public.mission_track(new.user_id, 'story_published', new.id::text, null,
      jsonb_build_object('has_music', new.music is not null and jsonb_typeof(new.music) = 'object'));
  exception when others then null; end;
  return new;
end;
$$;
create or replace function public.trg_mt_story_upd()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    if new.deleted_at is not null and old.deleted_at is null then
      perform public.mission_void(new.id::text, array['story_published']);
    end if;
  exception when others then null; end;
  return new;
end;
$$;
drop trigger if exists mt_story on public.stories;
create trigger mt_story after insert on public.stories for each row execute function public.trg_mt_story();
drop trigger if exists mt_story_upd on public.stories;
create trigger mt_story_upd after update of deleted_at on public.stories for each row execute function public.trg_mt_story_upd();

create or replace function public.trg_mt_story_view()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  begin
    select user_id into v_owner from public.stories where id = new.story_id;
    if public.mission_target_ok(new.viewer_id, v_owner) then
      perform public.mission_track(new.viewer_id, 'story_viewed', new.story_id::text, v_owner, jsonb_build_object('other', true));
    end if;
  exception when others then null; end;
  return new;
end;
$$;
drop trigger if exists mt_story_view on public.story_views;
create trigger mt_story_view after insert on public.story_views for each row execute function public.trg_mt_story_view();

create or replace function public.trg_mt_story_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  begin
    select user_id into v_owner from public.stories where id = new.story_id;
    if public.mission_target_ok(new.user_id, v_owner) then
      perform public.mission_track(new.user_id, 'story_liked', new.story_id::text, v_owner,
        jsonb_build_object('other', true, 'following', public.mission_following(new.user_id, v_owner)));
    end if;
  exception when others then null; end;
  return new;
end;
$$;
drop trigger if exists mt_story_like on public.story_likes;
create trigger mt_story_like after insert on public.story_likes for each row execute function public.trg_mt_story_like();

-- 5.9 Mensajes: a una persona distinta (las respuestas a historias cuentan como respuesta a historia)
create or replace function public.trg_mt_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  c record;
  v_other uuid;
begin
  begin
    if new.deleted_at is not null then return new; end if;
    select user_a, user_b into c from public.conversations where id = new.conversation_id;
    v_other := case when c.user_a = new.sender_id then c.user_b else c.user_a end;
    if public.mission_target_ok(new.sender_id, v_other) then
      if new.story_id is not null then
        perform public.mission_track(new.sender_id, 'story_replied', new.id::text, v_other,
          jsonb_build_object('other', true, 'following', public.mission_following(new.sender_id, v_other)));
      else
        perform public.mission_track(new.sender_id, 'dm_sent', new.id::text, v_other,
          jsonb_build_object('other', true, 'friend', public.are_friends(new.sender_id, v_other),
                             'following', public.mission_following(new.sender_id, v_other)));
      end if;
    end if;
  exception when others then null;
  end;
  return new;
end;
$$;
create or replace function public.trg_mt_message_upd()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    if new.deleted_at is not null and old.deleted_at is null then
      perform public.mission_void(new.id::text, array['dm_sent', 'story_replied']);
    end if;
  exception when others then null; end;
  return new;
end;
$$;
drop trigger if exists mt_message on public.messages;
create trigger mt_message after insert on public.messages for each row execute function public.trg_mt_message();
drop trigger if exists mt_message_upd on public.messages;
create trigger mt_message_upd after update of deleted_at on public.messages for each row execute function public.trg_mt_message_upd();

-- 5.10 Cambios de perfil (foto, bio, banner, colores, canción): una vez por campo y por día
create or replace function public.trg_mt_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_day text := to_char(now() at time zone public.eco_tz(), 'YYYYMMDD');
  f text;
begin
  begin
    foreach f in array array['avatar_url', 'bio', 'banner_url', 'profile_color', 'name_color', 'card_color', 'music'] loop
      if to_jsonb(new) -> f is distinct from to_jsonb(old) -> f then
        perform public.mission_track(new.id, 'profile_updated', f || ':' || v_day, null, jsonb_build_object('field', f));
      end if;
    end loop;
  exception when others then null;
  end;
  return new;
end;
$$;
drop trigger if exists mt_profile on public.profiles;
create trigger mt_profile after update of avatar_url, bio, banner_url, profile_color, name_color, card_color, music on public.profiles
  for each row execute function public.trg_mt_profile();

-- 5.11 Acciones que manda la página (con tope): visitar un perfil y visitar la tienda
create or replace function public.track_profile_visit(p_user uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  v_n   integer;
begin
  if v_me is null or p_user is null or v_me = p_user then return; end if;
  if not public.mission_target_ok(v_me, p_user) then return; end if;
  -- tope: 30 visitas distintas al día
  select count(*)::int into v_n from public.mission_events
   where user_id = v_me and event_type = 'profile_visited'
     and created_at > date_trunc('day', now() at time zone public.eco_tz()) at time zone public.eco_tz();
  if v_n >= 30 then return; end if;
  perform public.mission_track(v_me, 'profile_visited',
    p_user::text || ':' || to_char(now() at time zone public.eco_tz(), 'YYYYMMDD'), p_user, jsonb_build_object('other', true));
end;
$$;

create or replace function public.track_shop_visit()
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  perform public.mission_track(auth.uid(), 'shop_visited', 'once', null, '{}'::jsonb);
end;
$$;

-- 5.12 Antigranja: si más del 60 % de las interacciones de una persona en una semana son con 1–2 cuentas,
--      se deja una bandera para el equipo y esas interacciones dejan de contar. El equipo la corre desde
--      Centro de Mando → Economía (o puedes programarla con pg_cron cada día).
create or replace function public.economy_scan_farms()
returns integer
language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_flags integer := 0;
begin
  if not public.eco_is_staff('manage_shop') then
    raise exception 'No tienes permiso';
  end if;
  for r in
    with base as (
      select user_id, target_user_id, count(*) c
      from public.mission_events
      where created_at > now() - interval '7 days' and not void and target_user_id is not null
        and event_type in ('like_post','like_comment','comment_created','story_liked','story_viewed','follow_created','dm_sent','repost_created')
      group by user_id, target_user_id
    ), tot as (
      select user_id, sum(c) total from base group by user_id having sum(c) >= 30
    ), top2 as (
      select b.user_id, array_agg(b.target_user_id) targets, sum(b.c) top_c
      from (select b.*, row_number() over (partition by user_id order by c desc) rn from base b) b
      where b.rn <= 2 group by b.user_id
    )
    select t.user_id, o.targets, o.top_c, t.total
    from tot t join top2 o on o.user_id = t.user_id
    where o.top_c::numeric / t.total > 0.6
  loop
    update public.mission_events set void = true
     where user_id = r.user_id and target_user_id = any (r.targets) and not void and created_at > now() - interval '7 days'
       and event_type in ('like_post','like_comment','comment_created','story_liked','story_viewed','follow_created','dm_sent','repost_created');
    if not exists (select 1 from public.economy_flags where user_id = r.user_id and kind = 'farming' and created_at > now() - interval '7 days') then
      insert into public.economy_flags (user_id, kind, details)
      values (r.user_id, 'farming', jsonb_build_object('targets', r.targets, 'share', round(r.top_c::numeric / r.total, 2), 'total', r.total));
      v_flags := v_flags + 1;
    end if;
  end loop;
  return v_flags;
end;
$$;

-- 5.13 Limpieza: borra acciones de más de 120 días (los logros miran las tablas reales, no esta)
create or replace function public.economy_cleanup()
returns integer
language plpgsql security definer set search_path = public as $$
declare v integer;
begin
  delete from public.mission_events where created_at < now() - interval '120 days' and event_type not in ('shop_visited');
  get diagnostics v = row_count;
  return v;
end;
$$;


-- =====================================================================
-- 6) CÓDIGOS CANJEABLES
-- =====================================================================
create table if not exists public.redeem_codes (
  id                   uuid primary key default gen_random_uuid(),
  code                 text not null,            -- como se muestra (MAYÚSCULAS, con guiones)
  code_norm            text not null,            -- solo letras y números: con esto se compara
  description          text,
  lunas                integer not null default 0 check (lunas between 0 and 100000),
  item_ids             uuid[],                   -- cosméticos que regala (se usa desde la v1.4.0)
  max_redemptions      integer check (max_redemptions is null or max_redemptions >= 1),
  max_per_user         integer not null default 1 check (max_per_user >= 1),
  redeemed_count       integer not null default 0,
  starts_at            timestamptz,
  expires_at           timestamptz,
  min_account_age_days integer not null default 0 check (min_account_age_days >= 0),
  active               boolean not null default true,
  batch_id             uuid,
  created_by           uuid,
  created_at           timestamptz not null default now()
);
create unique index if not exists redeem_codes_norm_uniq on public.redeem_codes (code_norm);

create table if not exists public.code_redemptions (
  id            bigint generated always as identity primary key,
  code_id       uuid not null references public.redeem_codes(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  redeemed_at   timestamptz not null default now(),
  lunas_granted integer not null default 0,
  items_granted jsonb
);
create index if not exists code_redemptions_code_idx on public.code_redemptions (code_id);
create index if not exists code_redemptions_user_idx on public.code_redemptions (user_id, redeemed_at desc);

create table if not exists public.code_attempts (
  id    bigint generated always as identity primary key,
  user_id uuid not null,
  at    timestamptz not null default now(),
  ok    boolean not null,
  hint  text
);
create index if not exists code_attempts_user_idx on public.code_attempts (user_id, at desc);

create or replace function public.code_normalize(p text)
returns text language sql immutable as $$
  select upper(regexp_replace(coalesce(p, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

-- Código al azar XXXX-XXXX-XXXX (sin 0, O, 1, I para que no se confundan)
create or replace function public.code_generate(p_groups integer default 3)
returns text
language plpgsql volatile as $$
declare
  alpha  constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes  bytea;
  out    text := '';
  i      integer;
begin
  bytes := decode(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 'hex');
  for i in 0..(p_groups * 4 - 1) loop
    if i > 0 and i % 4 = 0 then out := out || '-'; end if;
    out := out || substr(alpha, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return out;
end;
$$;

-- 6.1 Canjear (la persona). Devuelve {ok:false, error:'…'} en vez de lanzar error, para que el intento
--     quede registrado. Mensajes genéricos: nadie puede adivinar si un código existe.
create or replace function public.code_redeem(p_code text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me     uuid := auth.uid();
  v_norm   text := public.code_normalize(p_code);
  c        public.redeem_codes%rowtype;
  v_min    integer;
  v_fail   integer;
  v_last   timestamptz;
  v_mine   integer;
  v_age    integer;
  v_res    jsonb;
  v_wait   integer;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if public.eco_is_frozen(v_me) then return jsonb_build_object('ok', false, 'error', 'frozen'); end if;

  -- límite de intentos: 5 por minuto y 10 fallidos por hora (bloqueo de 30 min)
  select count(*)::int into v_min from public.code_attempts where user_id = v_me and at > now() - interval '1 minute';
  select count(*)::int, max(at) into v_fail, v_last from public.code_attempts where user_id = v_me and not ok and at > now() - interval '1 hour';
  if v_fail >= 10 and v_last > now() - interval '30 minutes' then
    v_wait := greatest(1, ceil(extract(epoch from (v_last + interval '30 minutes' - now())) / 60)::int);
    return jsonb_build_object('ok', false, 'error', 'rate', 'minutes', v_wait);
  end if;
  if v_min >= 5 then return jsonb_build_object('ok', false, 'error', 'rate', 'minutes', 1); end if;

  if char_length(v_norm) < 4 or char_length(v_norm) > 40 then
    insert into public.code_attempts (user_id, ok, hint) values (v_me, false, left(v_norm, 3));
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  -- se bloquea la fila: dos personas a la vez con un código de 1 uso → solo una gana
  select * into c from public.redeem_codes where code_norm = v_norm for update;
  if not found then
    insert into public.code_attempts (user_id, ok, hint) values (v_me, false, left(v_norm, 3));
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  -- quien ya lo canjeó lo sabe: «Ya canjeaste este código» (aunque ya se haya agotado)
  select count(*)::int into v_mine from public.code_redemptions where code_id = c.id and user_id = v_me;
  if v_mine >= c.max_per_user then
    insert into public.code_attempts (user_id, ok, hint) values (v_me, false, left(v_norm, 3));
    return jsonb_build_object('ok', false, 'error', 'already');
  end if;

  if not c.active
     or (c.starts_at is not null and c.starts_at > now())
     or (c.expires_at is not null and c.expires_at <= now())
     or (c.max_redemptions is not null and c.redeemed_count >= c.max_redemptions) then
    insert into public.code_attempts (user_id, ok, hint) values (v_me, false, left(v_norm, 3));
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  select greatest(0, floor(extract(epoch from (now() - created_at)) / 86400))::int into v_age from public.profiles where id = v_me;
  if coalesce(v_age, 0) < c.min_account_age_days then
    insert into public.code_attempts (user_id, ok, hint) values (v_me, false, left(v_norm, 3));
    return jsonb_build_object('ok', false, 'error', 'too_new');
  end if;

  update public.redeem_codes set redeemed_count = redeemed_count + 1 where id = c.id;
  insert into public.code_redemptions (code_id, user_id, lunas_granted) values (c.id, v_me, c.lunas);
  if c.lunas > 0 then
    v_res := public.coins_apply(v_me, c.lunas, 'code', 'code', c.id::text, 'code:' || c.id::text || ':' || v_me::text || ':' || (v_mine + 1)::text);
  else
    v_res := jsonb_build_object('balance', public.coins_balance());
  end if;
  insert into public.code_attempts (user_id, ok, hint) values (v_me, true, left(v_norm, 3));

  return jsonb_build_object('ok', true, 'lunas', c.lunas, 'balance', (v_res ->> 'balance')::int);
end;
$$;

-- Mis códigos canjeados (sin mostrar el código en sí)
create or replace function public.code_my_redemptions(p_limit integer default 30)
returns table (description text, lunas integer, redeemed_at timestamptz)
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(btrim(c.description), ''), 'Código del equipo'), r.lunas_granted, r.redeemed_at
  from public.code_redemptions r join public.redeem_codes c on c.id = r.code_id
  where r.user_id = auth.uid()
  order by r.redeemed_at desc
  limit greatest(1, least(coalesce(p_limit, 30), 100));
$$;

-- 6.2 Panel del equipo (permiso «manage_codes»). Quien no es Admin Supremo tiene un tope menor de Lunas por código.
create or replace function public.code_staff_check(p_lunas integer)
returns void
language plpgsql security definer set search_path = public as $$
declare v_max integer;
begin
  if not public.eco_is_staff('manage_codes') then raise exception 'No tienes permiso para manejar códigos'; end if;
  if p_lunas < 0 or p_lunas > 100000 then raise exception 'Las Lunas deben estar entre 0 y 100 000'; end if;
  if auth.uid() is not null and not exists (
       select 1 from public.profiles where id = auth.uid() and lower(username) in ('renshsh', 'are_you_rena')) then
    v_max := greatest(1, public.eco_cfg_num('code_max_lunas_staff', 1000)::int);
    if p_lunas > v_max then raise exception 'Tu rol puede crear códigos de hasta % Lunas', v_max; end if;
  end if;
end;
$$;

create or replace function public.admin_code_create(
  p_code text, p_lunas integer, p_description text default null, p_max integer default null,
  p_per_user integer default 1, p_starts timestamptz default null, p_expires timestamptz default null,
  p_min_age integer default 0, p_active boolean default true
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_id   uuid;
  v_try  integer := 0;
begin
  perform public.code_staff_check(coalesce(p_lunas, 0));
  if v_code = '' then
    loop
      v_code := public.code_generate(3);
      exit when not exists (select 1 from public.redeem_codes where code_norm = public.code_normalize(v_code));
      v_try := v_try + 1;
      if v_try > 10 then raise exception 'No pude generar un código único, intenta otra vez'; end if;
    end loop;
  else
    if v_code !~ '^[A-Z0-9-]{4,32}$' then raise exception 'El código solo puede llevar letras, números y guiones (4 a 32 caracteres)'; end if;
    if char_length(public.code_normalize(v_code)) < 4 then raise exception 'El código es muy corto'; end if;
    if exists (select 1 from public.redeem_codes where code_norm = public.code_normalize(v_code)) then raise exception 'Ya existe un código igual'; end if;
  end if;
  if p_expires is not null and p_starts is not null and p_expires <= p_starts then raise exception 'El vencimiento debe ser después del inicio'; end if;

  insert into public.redeem_codes (code, code_norm, description, lunas, max_redemptions, max_per_user, starts_at, expires_at, min_account_age_days, active, created_by)
  values (v_code, public.code_normalize(v_code), nullif(btrim(coalesce(p_description, '')), ''), p_lunas,
          p_max, greatest(1, coalesce(p_per_user, 1)), p_starts, p_expires, greatest(0, coalesce(p_min_age, 0)), coalesce(p_active, true), auth.uid())
  returning id into v_id;
  perform public.eco_log('code_create', v_id::text, jsonb_build_object('lunas', p_lunas, 'max', p_max));
  return jsonb_build_object('id', v_id, 'code', v_code);
end;
$$;

create or replace function public.admin_code_create_batch(
  p_prefix text, p_count integer, p_lunas integer, p_description text default null,
  p_expires timestamptz default null, p_min_age integer default 0
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_prefix text := upper(btrim(coalesce(p_prefix, '')));
  v_batch  uuid := gen_random_uuid();
  v_codes  jsonb := '[]'::jsonb;
  v_code   text;
  i        integer := 0;
  v_guard  integer := 0;
begin
  perform public.code_staff_check(coalesce(p_lunas, 0));
  if p_count is null or p_count < 1 or p_count > 500 then raise exception 'Puedes crear de 1 a 500 códigos a la vez'; end if;
  if v_prefix !~ '^[A-Z0-9]{0,12}$' then raise exception 'El prefijo solo puede llevar letras y números (máximo 12)'; end if;
  while i < p_count loop
    v_guard := v_guard + 1;
    if v_guard > p_count * 5 + 20 then raise exception 'No pude generar tantos códigos únicos'; end if;
    v_code := case when v_prefix = '' then public.code_generate(3) else v_prefix || '-' || public.code_generate(2) end;
    if exists (select 1 from public.redeem_codes where code_norm = public.code_normalize(v_code)) then continue; end if;
    insert into public.redeem_codes (code, code_norm, description, lunas, max_redemptions, max_per_user, expires_at, min_account_age_days, batch_id, created_by)
    values (v_code, public.code_normalize(v_code), nullif(btrim(coalesce(p_description, '')), ''), p_lunas, 1, 1, p_expires, greatest(0, coalesce(p_min_age, 0)), v_batch, auth.uid());
    v_codes := v_codes || to_jsonb(v_code);
    i := i + 1;
  end loop;
  perform public.eco_log('code_batch', v_batch::text, jsonb_build_object('count', p_count, 'lunas', p_lunas, 'prefix', v_prefix));
  return jsonb_build_object('batch_id', v_batch, 'codes', v_codes);
end;
$$;

-- Lista con filtros: todos · activos · vencidos · agotados · desactivados
create or replace function public.admin_code_list(p_filter text default 'todos', p_search text default null, p_limit integer default 100, p_offset integer default 0)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.eco_is_staff('manage_codes') then raise exception 'No tienes permiso para manejar códigos'; end if;
  select coalesce(jsonb_agg(row_to_json(x) order by x.created_at desc), '[]'::jsonb) into v from (
    select c.id, c.code, c.description, c.lunas, c.max_redemptions, c.max_per_user, c.redeemed_count,
           c.starts_at, c.expires_at, c.min_account_age_days, c.active, c.batch_id, c.created_at,
           case when not c.active then 'desactivado'
                when c.expires_at is not null and c.expires_at <= now() then 'vencido'
                when c.max_redemptions is not null and c.redeemed_count >= c.max_redemptions then 'agotado'
                when c.starts_at is not null and c.starts_at > now() then 'pendiente'
                else 'activo' end as status
    from public.redeem_codes c
    where (p_search is null or btrim(p_search) = '' or c.code ilike '%' || btrim(p_search) || '%' or c.description ilike '%' || btrim(p_search) || '%')
    order by c.created_at desc
    limit greatest(1, least(coalesce(p_limit, 100), 500)) offset greatest(0, coalesce(p_offset, 0))
  ) x
  where p_filter is null or p_filter = 'todos' or x.status = case p_filter when 'activos' then 'activo' when 'vencidos' then 'vencido'
        when 'agotados' then 'agotado' when 'desactivados' then 'desactivado' else p_filter end;
  return v;
end;
$$;

create or replace function public.admin_code_redemptions(p_id uuid)
returns table (username text, id_student text, redeemed_at timestamptz, lunas_granted integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_codes') then raise exception 'No tienes permiso para manejar códigos'; end if;
  return query
    select p.username::text, p.id_student::text, r.redeemed_at, r.lunas_granted
    from public.code_redemptions r join public.profiles p on p.id = r.user_id
    where r.code_id = p_id order by r.redeemed_at desc limit 500;
end;
$$;

create or replace function public.admin_code_set_active(p_id uuid, p_active boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_codes') then raise exception 'No tienes permiso para manejar códigos'; end if;
  update public.redeem_codes set active = coalesce(p_active, false) where id = p_id;
  perform public.eco_log(case when p_active then 'code_enable' else 'code_disable' end, p_id::text, '{}'::jsonb);
end;
$$;

-- Editar límites y fechas (la cantidad de Lunas NO se puede cambiar si el código ya se canjeó)
create or replace function public.admin_code_update(
  p_id uuid, p_lunas integer, p_description text, p_max integer, p_per_user integer,
  p_starts timestamptz, p_expires timestamptz, p_min_age integer
)
returns void
language plpgsql security definer set search_path = public as $$
declare c public.redeem_codes%rowtype;
begin
  perform public.code_staff_check(coalesce(p_lunas, 0));
  select * into c from public.redeem_codes where id = p_id for update;
  if not found then raise exception 'No existe ese código'; end if;
  if c.redeemed_count > 0 and p_lunas <> c.lunas then raise exception 'No se pueden cambiar las Lunas de un código que ya se canjeó'; end if;
  if p_max is not null and p_max < c.redeemed_count then raise exception 'Los usos totales no pueden ser menos de los que ya se usaron (%)', c.redeemed_count; end if;
  update public.redeem_codes
     set lunas = p_lunas, description = nullif(btrim(coalesce(p_description, '')), ''), max_redemptions = p_max,
         max_per_user = greatest(1, coalesce(p_per_user, 1)), starts_at = p_starts, expires_at = p_expires,
         min_account_age_days = greatest(0, coalesce(p_min_age, 0))
   where id = p_id;
  perform public.eco_log('code_update', p_id::text, jsonb_build_object('lunas', p_lunas));
end;
$$;

create or replace function public.admin_code_delete(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_codes') then raise exception 'No tienes permiso para manejar códigos'; end if;
  if exists (select 1 from public.code_redemptions where code_id = p_id) then raise exception 'Este código ya se usó: desactívalo en vez de borrarlo'; end if;
  delete from public.redeem_codes where id = p_id;
  perform public.eco_log('code_delete', p_id::text, '{}'::jsonb);
end;
$$;


-- =====================================================================
-- 7) EQUIPO: ajuste manual, economía, auditoría, misiones y ajustes
-- =====================================================================

-- 7.1 Ajuste manual de Lunas (permiso «adjust_coins»; el motivo es obligatorio y queda en el libro)
create or replace function public.admin_coins_adjust(p_user uuid, p_delta integer, p_reason text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_reason text := btrim(coalesce(p_reason, ''));
  res      jsonb;
begin
  if not public.eco_is_staff('adjust_coins') then raise exception 'No tienes permiso para ajustar Lunas'; end if;
  if p_delta is null or p_delta = 0 then raise exception 'Escribe una cantidad distinta de 0'; end if;
  if abs(p_delta) > 100000 then raise exception 'Máximo 100 000 Lunas por ajuste'; end if;
  if char_length(v_reason) < 3 then raise exception 'El motivo es obligatorio'; end if;
  if not exists (select 1 from public.profiles where id = p_user) then raise exception 'No existe esa persona'; end if;
  res := public.coins_apply(p_user, p_delta, 'admin_adjust', 'admin', v_reason, 'admin:' || gen_random_uuid()::text, auth.uid());
  perform public.eco_log('coins_adjust', p_user::text, jsonb_build_object('delta', p_delta, 'reason', v_reason));
  return res;
end;
$$;

-- Saldo y últimos movimientos de una persona (para el ajuste manual)
create or replace function public.admin_wallet_of(p_user uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.eco_is_staff('adjust_coins') or public.eco_is_staff('manage_shop')) then raise exception 'No tienes permiso'; end if;
  return jsonb_build_object(
    'balance', coalesce((select coins from public.user_wallets where user_id = p_user), 0),
    'history', coalesce((select jsonb_agg(row_to_json(h)) from (
        select delta, balance_after, reason, ref_id, created_at from public.coin_ledger where user_id = p_user order by id desc limit 15) h), '[]'::jsonb)
  );
end;
$$;

-- 7.2 Auditoría: el saldo siempre debe ser igual a la suma del libro (debe dar 0 diferencias)
create or replace function public.economy_audit()
returns table (user_id uuid, wallet integer, ledger_sum bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  return query
    select w.user_id, w.coins, coalesce(l.s, 0)
    from public.user_wallets w
    left join (select x.user_id, sum(x.delta) s from public.coin_ledger x group by x.user_id) l on l.user_id = w.user_id
    where w.coins <> coalesce(l.s, 0);
end;
$$;

-- 7.3 Panel de Economía
create or replace function public.admin_economy_stats()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  select jsonb_build_object(
    'wallets',     (select count(*) from public.user_wallets),
    'circulation', (select coalesce(sum(coins), 0) from public.user_wallets),
    'average',     (select coalesce(round(avg(coins)), 0) from public.user_wallets),
    'median',      (select coalesce(round((percentile_cont(0.5) within group (order by coins))::numeric), 0) from public.user_wallets),
    'earned_7',    (select coalesce(sum(delta), 0) from public.coin_ledger where delta > 0 and created_at > now() - interval '7 days'),
    'spent_7',     (select coalesce(-sum(delta), 0) from public.coin_ledger where delta < 0 and created_at > now() - interval '7 days'),
    'earned_30',   (select coalesce(sum(delta), 0) from public.coin_ledger where delta > 0 and created_at > now() - interval '30 days'),
    'spent_30',    (select coalesce(-sum(delta), 0) from public.coin_ledger where delta < 0 and created_at > now() - interval '30 days'),
    'by_reason_30',(select coalesce(jsonb_agg(row_to_json(r) order by r.total desc), '[]'::jsonb) from (
                      select reason, sum(delta)::int total, count(*)::int n from public.coin_ledger
                      where created_at > now() - interval '30 days' group by reason) r),
    'codes_total', (select coalesce(sum(lunas_granted), 0) from public.code_redemptions),
    'codes_30',    (select coalesce(sum(lunas_granted), 0) from public.code_redemptions where redeemed_at > now() - interval '30 days'),
    'distribution',(select coalesce(jsonb_agg(row_to_json(d) order by d.sort), '[]'::jsonb) from (
                      select b.label, b.sort, count(w.*)::int n from (values
                        ('0–99', 1, 0, 99), ('100–299', 2, 100, 299), ('300–699', 3, 300, 699),
                        ('700–1 499', 4, 700, 1499), ('1 500+', 5, 1500, 2147483647)) b(label, sort, lo, hi)
                      left join public.user_wallets w on w.coins between b.lo and b.hi
                      group by b.label, b.sort) d),
    'open_flags',  (select count(*) from public.economy_flags where resolved_at is null)
  ) into v;
  return v;
end;
$$;

create or replace function public.admin_economy_flags()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  return coalesce((select jsonb_agg(row_to_json(f) order by f.created_at desc) from (
    select e.id, e.kind, e.details, e.created_at, e.resolved_at, p.username, p.id_student
    from public.economy_flags e left join public.profiles p on p.id = e.user_id
    order by e.created_at desc limit 50) f), '[]'::jsonb);
end;
$$;

create or replace function public.admin_economy_flag_resolve(p_id bigint)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  update public.economy_flags set resolved_at = now(), resolved_by = auth.uid() where id = p_id and resolved_at is null;
end;
$$;

create or replace function public.admin_log_list(p_limit integer default 50)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.eco_is_staff('manage_shop') or public.eco_is_staff('manage_codes') or public.eco_is_staff('adjust_coins')) then
    raise exception 'No tienes permiso';
  end if;
  return coalesce((select jsonb_agg(row_to_json(l) order by l.created_at desc) from (
    select g.id, g.action, g.target, g.details, g.created_at, p.username as admin
    from public.coin_admin_log g left join public.profiles p on p.id = g.admin_id
    order by g.id desc limit greatest(1, least(coalesce(p_limit, 50), 200))) l), '[]'::jsonb);
end;
$$;

-- 7.4 Plantillas de misiones (editar sin tocar código)
create or replace function public.admin_mission_templates()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  return coalesce((select jsonb_agg(row_to_json(t) order by
      coalesce(array_position(array['daily','weekly','onboarding','achievement','event'], t.period), 9),
      coalesce(array_position(array['easy','medium','hard','challenge'], t.difficulty), 9), t.sort, t.id)
    from public.mission_templates t), '[]'::jsonb);
end;
$$;

create or replace function public.admin_mission_template_set(
  p_id text, p_text text, p_reward integer, p_weight integer, p_active boolean, p_target integer
)
returns void
language plpgsql security definer set search_path = public as $$
declare t public.mission_templates%rowtype;
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  select * into t from public.mission_templates where id = p_id;
  if not found then raise exception 'No existe esa misión'; end if;
  if p_active and t.requires_feature is not null then raise exception 'Esta misión necesita una función que todavía no existe en la app'; end if;
  if char_length(btrim(coalesce(p_text, ''))) < 3 then raise exception 'El texto es muy corto'; end if;
  update public.mission_templates
     set text = btrim(p_text), reward = greatest(0, least(10000, p_reward)), weight = greatest(0, least(1000, p_weight)),
         active = p_active,
         target = case when params ? 'all_of' or event_type like 'state:%' then target else greatest(1, least(1000, p_target)) end
   where id = p_id;
  perform public.eco_log('mission_edit', p_id, jsonb_build_object('reward', p_reward, 'weight', p_weight, 'active', p_active));
end;
$$;

-- 7.5 Ajustes del sistema (lista blanca de claves)
create or replace function public.admin_eco_settings()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  return jsonb_build_object(
    'currency_name', public.eco_cfg_text('currency_name', 'Lunas'),
    'coins_multiplier', public.eco_cfg_num('coins_multiplier', 1),
    'missions_timezone', public.eco_tz(),
    'welcome_coins', public.eco_cfg_num('welcome_coins', 150),
    'founder_coins', public.eco_cfg_num('founder_coins', 300),
    'founder_cutoff', public.eco_cfg_text('founder_cutoff', '2026-10-13'),
    'coins_daily_cap', public.eco_cfg_num('coins_daily_cap', 600),
    'daily_bonus_coins', public.eco_cfg_num('daily_bonus_coins', 15),
    'chest_coins', public.eco_cfg_num('chest_coins', 100),
    'reroll_cost', public.eco_cfg_num('reroll_cost', 25),
    'code_max_lunas_staff', public.eco_cfg_num('code_max_lunas_staff', 1000)
  );
end;
$$;

create or replace function public.admin_eco_setting_set(p_key text, p_value text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v    text := btrim(coalesce(p_value, ''));
  v_n  numeric;
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  if p_key not in ('currency_name', 'coins_multiplier', 'missions_timezone', 'welcome_coins', 'founder_coins', 'founder_cutoff',
                   'coins_daily_cap', 'daily_bonus_coins', 'chest_coins', 'reroll_cost', 'code_max_lunas_staff') then
    raise exception 'Ese ajuste no existe';
  end if;
  if p_key = 'currency_name' then
    if char_length(v) < 2 or char_length(v) > 20 then raise exception 'El nombre debe tener de 2 a 20 caracteres'; end if;
    insert into public.app_settings (key, value, updated_at, updated_by) values (p_key, to_jsonb(v), now(), auth.uid())
      on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = auth.uid();
  elsif p_key = 'missions_timezone' then
    if not exists (select 1 from pg_timezone_names where name = v) then raise exception 'Esa zona horaria no existe (ejemplo: America/Bogota)'; end if;
    insert into public.app_settings (key, value, updated_at, updated_by) values (p_key, to_jsonb(v), now(), auth.uid())
      on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = auth.uid();
  elsif p_key = 'founder_cutoff' then
    perform v::date;
    insert into public.app_settings (key, value, updated_at, updated_by) values (p_key, to_jsonb(v), now(), auth.uid())
      on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = auth.uid();
  else
    v_n := v::numeric;
    if p_key = 'coins_multiplier' and (v_n < 0.5 or v_n > 5) then raise exception 'El multiplicador va de 0.5 a 5'; end if;
    if p_key <> 'coins_multiplier' and (v_n < 0 or v_n > 100000) then raise exception 'Número fuera de rango'; end if;
    insert into public.app_settings (key, value, updated_at, updated_by) values (p_key, to_jsonb(v_n), now(), auth.uid())
      on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = auth.uid();
  end if;
  perform public.eco_log('setting', p_key, jsonb_build_object('value', v));
end;
$$;

-- 7.6 Buscar personas para el ajuste manual
create or replace function public.admin_user_search(p_q text)
returns table (id uuid, username text, id_student text, coins integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.eco_is_staff('adjust_coins') or public.eco_is_staff('manage_shop')) then raise exception 'No tienes permiso'; end if;
  return query
    select p.id, p.username::text, p.id_student::text, coalesce(w.coins, 0)
    from public.profiles p left join public.user_wallets w on w.user_id = p.id
    where p.username ilike '%' || btrim(coalesce(p_q, '')) || '%' or p.id_student ilike '%' || btrim(coalesce(p_q, '')) || '%'
    order by p.username limit 8;
end;
$$;


-- =====================================================================
-- 8) NOMBRE CON COLOR EN LOS MENSAJES
-- =====================================================================
-- dm_inbox y dm_chat_info ahora devuelven también other_name_color (columna extra al final).
drop function if exists public.dm_inbox(boolean);
create or replace function public.dm_inbox(p_requests boolean default false)
returns table (
  conversation_id uuid, status text, initiator_id uuid, other_id uuid, other_username text, other_id_student text,
  other_avatar_url text, nickname text, last_message_at timestamptz, last_content text, last_sender_id uuid,
  last_deleted boolean, unread_count integer, other_name_color text
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
        and (m.hidden_at is null or x.created_at > m.hidden_at)),
    p.name_color
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

drop function if exists public.dm_chat_info(uuid);
create or replace function public.dm_chat_info(p_conv uuid)
returns table (
  conversation_id uuid, status text, initiator_id uuid, other_id uuid, other_username text, other_id_student text,
  other_avatar_url text, nickname text, hidden_at timestamptz, other_read_at timestamptz, i_blocked boolean,
  blocked boolean, other_frozen boolean, other_name_color text
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
    coalesce(p.is_frozen, false),
    p.name_color
  from public.conversations c
  join public.conversation_members me on me.conversation_id = c.id and me.user_id = auth.uid()
  join public.conversation_members ot on ot.conversation_id = c.id and ot.user_id <> auth.uid()
  join public.profiles p on p.id = ot.user_id
  where c.id = p_conv and auth.uid() in (c.user_a, c.user_b);
$$;

revoke execute on function public.dm_inbox(boolean), public.dm_chat_info(uuid) from public, anon;
grant execute on function public.dm_inbox(boolean), public.dm_chat_info(uuid) to authenticated;


-- =====================================================================
-- 9) SEGURIDAD (RLS), PERMISOS DE FUNCIONES Y VALORES POR DEFECTO
-- =====================================================================
alter table public.user_wallets     enable row level security;
alter table public.coin_ledger      enable row level security;
alter table public.economy_flags    enable row level security;
alter table public.coin_admin_log   enable row level security;
alter table public.mission_templates enable row level security;
alter table public.user_missions    enable row level security;
alter table public.mission_events   enable row level security;
alter table public.mission_streaks  enable row level security;
alter table public.redeem_codes     enable row level security;
alter table public.code_redemptions enable row level security;
alter table public.code_attempts    enable row level security;

-- Nadie toca estas tablas directo desde el navegador: todo pasa por las funciones de arriba
revoke all on public.user_wallets, public.coin_ledger, public.economy_flags, public.coin_admin_log,
              public.mission_templates, public.user_missions, public.mission_events, public.mission_streaks,
              public.redeem_codes, public.code_redemptions, public.code_attempts from anon, authenticated;

-- Funciones: por defecto cualquiera podría ejecutarlas; se cierran todas y se abren solo las de la página
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and (p.proname like 'eco\_%' or p.proname like 'coins\_%' or p.proname like 'mission%' or p.proname like 'missions\_%'
        or p.proname like 'streak\_%' or p.proname like 'chest\_%' or p.proname like 'code\_%' or p.proname like 'admin\_code%'
        or p.proname like 'admin\_coins%' or p.proname like 'admin\_economy%' or p.proname like 'admin\_mission%'
        or p.proname like 'admin\_eco%' or p.proname like 'admin\_log%' or p.proname like 'admin\_wallet%' or p.proname like 'admin\_user%'
        or p.proname like 'founder\_%' or p.proname like 'wallet\_%' or p.proname like 'economy\_%' or p.proname like 'track\_%'
        or p.proname like 'achievements\_%' or p.proname like 'profile\_identity%' or p.proname like 'trg\_mt\_%'
        or p.proname = 'trg_profile_wallet' or p.proname = 'trg_coin_ledger_immutable')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end;
$$;

-- Lo que SÍ puede llamar una persona con sesión (cada función comprueba por dentro quién es y qué permiso tiene)
grant execute on function
  public.coins_balance(), public.coins_history(integer, timestamptz),
  public.wallet_summary(), public.economy_touch(),
  public.founder_status(), public.founder_claim(),
  public.missions_today(), public.missions_week(), public.missions_onboarding(), public.achievements_list(),
  public.mission_claim(uuid), public.mission_reroll(uuid),
  public.streak_state(uuid), public.streak_touch(), public.streak_claim(integer), public.chest_claim(),
  public.code_redeem(text), public.code_my_redemptions(integer),
  public.track_profile_visit(uuid), public.track_shop_visit(),
  public.profile_identity(uuid),
  public.admin_code_create(text, integer, text, integer, integer, timestamptz, timestamptz, integer, boolean),
  public.admin_code_create_batch(text, integer, integer, text, timestamptz, integer),
  public.admin_code_list(text, text, integer, integer), public.admin_code_redemptions(uuid),
  public.admin_code_set_active(uuid, boolean),
  public.admin_code_update(uuid, integer, text, integer, integer, timestamptz, timestamptz, integer),
  public.admin_code_delete(uuid),
  public.admin_coins_adjust(uuid, integer, text), public.admin_wallet_of(uuid), public.admin_user_search(text),
  public.economy_audit(), public.admin_economy_stats(), public.admin_economy_flags(),
  public.admin_economy_flag_resolve(bigint), public.admin_log_list(integer),
  public.admin_mission_templates(), public.admin_mission_template_set(text, text, integer, integer, boolean, integer),
  public.admin_eco_settings(), public.admin_eco_setting_set(text, text),
  public.economy_scan_farms()
to authenticated;

-- streak_state(uuid) solo debe verse a uno mismo desde la página
create or replace function public.streak_state_me()
returns jsonb language sql stable security definer set search_path = public as $$
  select public.streak_state(auth.uid());
$$;
revoke execute on function public.streak_state_me() from public, anon;
grant execute on function public.streak_state_me() to authenticated;
revoke execute on function public.streak_state(uuid) from public, anon, authenticated;

-- Valores por defecto (solo se crean si no existen; se cambian en Centro de Mando → Tienda y Lunas → Ajustes)
insert into public.app_settings (key, value) values ('currency_name', to_jsonb('Lunas'::text))       on conflict (key) do nothing;
insert into public.app_settings (key, value) values ('coins_multiplier', to_jsonb(1))                on conflict (key) do nothing;
insert into public.app_settings (key, value) values ('missions_timezone', to_jsonb('America/Bogota'::text)) on conflict (key) do nothing;
insert into public.app_settings (key, value) values ('welcome_coins', to_jsonb(150))                 on conflict (key) do nothing;
insert into public.app_settings (key, value) values ('founder_coins', to_jsonb(300))                 on conflict (key) do nothing;
insert into public.app_settings (key, value) values ('founder_cutoff', to_jsonb('2026-10-13'::text)) on conflict (key) do nothing;
insert into public.app_settings (key, value) values ('coins_daily_cap', to_jsonb(600))               on conflict (key) do nothing;

notify pgrst, 'reload schema';

-- Listo. Para comprobar que la cuenta cuadra:  select * from public.economy_audit();   (debe salir vacío)
-- Antigranja y limpieza (opcional, cada día con pg_cron):
--   select cron.schedule('economy-scan', '30 4 * * *', $$ select public.economy_scan_farms() $$);
--   select cron.schedule('economy-cleanup', '40 4 * * 0', $$ select public.economy_cleanup() $$);
