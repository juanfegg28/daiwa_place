-- =====================================================================
-- DaiwaPlace v1.7.0 — CÍRCULO LUNAR (sistema Supporter)
-- Pégalo COMPLETO en Supabase → SQL Editor → New query → Run. Se puede correr más de una vez.
-- No borra ni modifica datos existentes. Reutiliza coin_ledger / coins_apply (no crea otra billetera).
--
-- Qué crea:
--   1) Niveles (Luna Creciente $1, Luna Llena $2, Eclipse $5) y sus ventajas, guardados en una tabla.
--   2) Membresías, suscripciones PayPal, pagos, eventos de webhook (sin repetir), solicitudes manuales (PayPal.me).
--   3) Bono semanal de Lunas (una sola vez por semana, lunes hora de Colombia) usando coins_apply.
--   4) Límite de historias por día según el nivel (3 normales · 4 · 5 · 7), validado en el servidor.
--   5) Descuentos en la tienda (5 / 10 / 15 %), aplicados en shop_buy, shop_catalog y los packs. No se acumulan: gana el precio más bajo.
--   6) Espacios (SIN diseños todavía) para decoraciones, tarjetas, efectos y títulos exclusivos.
--   7) Funciones del Centro de Mando (permiso nuevo: manage_supporters) con registro de todo lo que se hace.
--
-- Seguridad: todas las tablas tienen RLS activado y NADIE las toca directo desde el navegador.
-- Las funciones que activan membresías solo las puede llamar el servidor (service_role), nunca el navegador.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) NIVELES (la fuente de verdad de precios y ventajas)
-- ---------------------------------------------------------------------
create table if not exists public.supporter_tiers (
  tier              text primary key check (tier in ('creciente', 'llena', 'eclipse')),
  rank              integer not null unique check (rank between 1 and 9),
  name              text not null,
  price_usd         numeric(6, 2) not null check (price_usd > 0),
  weekly_lunas      integer not null check (weekly_lunas >= 0),
  story_limit       integer not null check (story_limit between 1 and 20),
  shop_discount_pct integer not null check (shop_discount_pct between 0 and 50),
  is_active         boolean not null default true
);
insert into public.supporter_tiers (tier, rank, name, price_usd, weekly_lunas, story_limit, shop_discount_pct) values
  ('creciente', 1, 'Luna Creciente', 1.00,  500, 4,  5),
  ('llena',     2, 'Luna Llena',     2.00, 1000, 5, 10),
  ('eclipse',   3, 'Eclipse',        5.00, 2500, 7, 15)
on conflict (tier) do nothing;

-- ---------------------------------------------------------------------
-- 2) TABLAS
-- ---------------------------------------------------------------------
-- La membresía de cada persona (una fila por persona)
create table if not exists public.supporters (
  user_id                uuid primary key references public.profiles(id) on delete cascade,
  tier                   text not null references public.supporter_tiers(tier),
  status                 text not null default 'active' check (status in ('active', 'cancelled', 'past_due', 'expired', 'suspended')),
  source                 text not null default 'paypal' check (source in ('paypal', 'manual', 'admin')),
  paypal_subscription_id text,
  started_at             timestamptz not null default now(),
  paid_until             timestamptz not null,
  last_payment_at        timestamptz,
  hide_badge             boolean not null default false,
  updated_at             timestamptz not null default now()
);
create index if not exists supporters_paid_until_idx on public.supporters (paid_until);
create index if not exists supporters_sub_idx on public.supporters (paypal_subscription_id);

-- Suscripciones de PayPal (para saber de quién es cada una)
create table if not exists public.supporter_subscriptions (
  paypal_subscription_id text primary key,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  plan_id           text not null,
  tier              text not null references public.supporter_tiers(tier),
  paypal_status     text not null,
  next_billing_time timestamptz,
  cancelled_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists supporter_subs_user_idx on public.supporter_subscriptions (user_id, created_at desc);

-- Historial de pagos (el id de transacción de PayPal es ÚNICO: un pago nunca se cuenta dos veces)
create table if not exists public.supporter_payments (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references public.profiles(id) on delete cascade,
  tier                   text not null references public.supporter_tiers(tier),
  amount                 numeric(8, 2) not null,
  currency               text not null default 'USD',
  source                 text not null check (source in ('paypal', 'manual', 'admin')),
  paypal_subscription_id text,
  paypal_transaction_id  text,
  status                 text not null default 'completed' check (status in ('completed', 'refunded', 'reversed', 'failed')),
  paid_at                timestamptz not null default now(),
  created_at             timestamptz not null default now()
);
create unique index if not exists supporter_payments_tx_uniq on public.supporter_payments (paypal_transaction_id) where paypal_transaction_id is not null;
create index if not exists supporter_payments_user_idx on public.supporter_payments (user_id, paid_at desc);

-- Avisos de PayPal ya recibidos (idempotencia: el mismo aviso nunca se procesa dos veces)
create table if not exists public.paypal_events (
  event_id     text primary key,
  event_type   text not null,
  resource_id  text,
  received_at  timestamptz not null default now(),
  processed_at timestamptz,
  result       text
);
create index if not exists paypal_events_received_idx on public.paypal_events (received_at desc);

-- Solicitudes de pago MANUAL (PayPal.me): la persona dice que pagó y un admin lo comprueba en su PayPal
create table if not exists public.supporter_manual_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  tier        text not null references public.supporter_tiers(tier),
  reference   text not null check (char_length(reference) between 6 and 40),
  note        text check (note is null or char_length(note) <= 200),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_note text
);
create index if not exists supporter_manual_status_idx on public.supporter_manual_requests (status, created_at desc);
create index if not exists supporter_manual_user_idx on public.supporter_manual_requests (user_id, created_at desc);
-- Un mismo código de transacción no se puede usar en dos solicitudes vivas
create unique index if not exists supporter_manual_ref_uniq on public.supporter_manual_requests (lower(reference)) where status <> 'rejected';

-- Bono semanal entregado (una fila por persona y semana)
create table if not exists public.supporter_weekly_grants (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  tier       text not null references public.supporter_tiers(tier),
  lunas      integer not null,
  created_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

-- Registro de todo lo que hace el equipo con las membresías
create table if not exists public.supporter_admin_log (
  id          bigserial primary key,
  admin_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  target_user uuid,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists supporter_admin_log_idx on public.supporter_admin_log (created_at desc);

-- Espacios para beneficios exclusivos (SIN diseños todavía: available = false hasta que existan)
create table if not exists public.supporter_perks (
  code      text primary key,
  min_tier  text not null references public.supporter_tiers(tier),
  kind      text not null check (kind in ('decoration', 'card', 'entry_effect', 'name_effect', 'title', 'other')),
  name      text not null,
  item_id   uuid,                         -- el cosmético real, cuando exista (cosmetic_items.id)
  available boolean not null default false,
  sort      integer not null default 0
);
create table if not exists public.supporter_perk_claims (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  code       text not null references public.supporter_perks(code) on delete cascade,
  claimed_at timestamptz not null default now(),
  primary key (user_id, code)
);
insert into public.supporter_perks (code, min_tier, kind, name, sort) values
  ('halo_naciente',        'creciente', 'decoration',  'Decoración Halo Naciente',            10),
  ('titulo_bajo_la_luna',  'creciente', 'title',       'Título «Bajo la Luna»',               11),
  ('orbita_de_plata',      'llena',     'decoration',  'Decoración Órbita de Plata',          20),
  ('tarjeta_marea_plata',  'llena',     'card',        'Tarjeta de perfil Marea de Plata',    21),
  ('titulo_heredero',      'llena',     'title',       'Título «Heredero de Selene»',         22),
  ('corona_totalidad',     'eclipse',   'decoration',  'Decoración animada Corona de Totalidad', 30),
  ('tarjeta_umbra',        'eclipse',   'card',        'Tarjeta de perfil Umbra',             31),
  ('entrada_eclipse',      'eclipse',   'entry_effect','Efecto de entrada Eclipse Total',     32),
  ('efecto_nombre',        'eclipse',   'name_effect', 'Efecto especial para el nombre',      33),
  ('titulo_testigo',       'eclipse',   'title',       'Título «Testigo de la Totalidad»',    34)
on conflict (code) do nothing;

-- RLS: activado en todo y sin permisos directos (todo pasa por funciones)
alter table public.supporter_tiers          enable row level security;
alter table public.supporters               enable row level security;
alter table public.supporter_subscriptions  enable row level security;
alter table public.supporter_payments       enable row level security;
alter table public.paypal_events            enable row level security;
alter table public.supporter_manual_requests enable row level security;
alter table public.supporter_weekly_grants  enable row level security;
alter table public.supporter_admin_log      enable row level security;
alter table public.supporter_perks          enable row level security;
alter table public.supporter_perk_claims    enable row level security;
revoke all on public.supporter_tiers, public.supporters, public.supporter_subscriptions, public.supporter_payments,
  public.paypal_events, public.supporter_manual_requests, public.supporter_weekly_grants, public.supporter_admin_log,
  public.supporter_perks, public.supporter_perk_claims from anon, authenticated;

-- Los cosméticos exclusivos de Supporter se marcan con obtainable = 'supporter' (no se venden ni salen en la tienda pública)
do $$
begin
  alter table public.cosmetic_items drop constraint if exists cosmetic_items_obtainable_check;
  alter table public.cosmetic_items add constraint cosmetic_items_obtainable_check
    check (obtainable in ('tienda', 'gratis', 'logro', 'evento', 'fundador', 'supporter'));
exception when others then
  raise notice 'No se pudo ampliar la restricción obtainable (no pasa nada, solo afecta a cosméticos futuros): %', sqlerrm;
end $$;

-- ---------------------------------------------------------------------
-- 3) CONSULTAS BÁSICAS (internas)
-- ---------------------------------------------------------------------
-- ¿Tiene membresía vigente? (activa, cancelada pero ya pagada, o con pago atrasado dentro de lo ya pagado)
create or replace function public.supporter_tier_of(p_user uuid)
returns text
language sql stable security definer set search_path = public as $$
  select s.tier
    from public.supporters s
   where s.user_id = p_user
     and s.status in ('active', 'cancelled', 'past_due')
     and s.paid_until > now();
$$;

create or replace function public.supporter_rank_of(p_user uuid)
returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select t.rank from public.supporter_tiers t where t.tier = public.supporter_tier_of(p_user)), 0);
$$;

create or replace function public.supporter_discount_pct(p_user uuid)
returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select t.shop_discount_pct from public.supporter_tiers t where t.tier = public.supporter_tier_of(p_user)), 0);
$$;

create or replace function public.supporter_week_start()
returns date
language sql stable as $$
  -- lunes de esta semana, en la hora de Colombia (la misma zona de las misiones)
  select date_trunc('week', now() at time zone public.eco_tz())::date;
$$;

-- Insignia pública: solo los que no la ocultaron. Para pintar muchas insignias de una vez (máx. 120 personas).
create or replace function public.supporter_tiers_of(p_ids uuid[])
returns table (user_id uuid, tier text)
language sql stable security definer set search_path = public as $$
  select s.user_id, s.tier
    from public.supporters s
   where auth.uid() is not null
     and s.user_id = any (p_ids[1:120])
     and not s.hide_badge
     and s.status in ('active', 'cancelled', 'past_due')
     and s.paid_until > now();
$$;
revoke execute on function public.supporter_tiers_of(uuid[]) from public, anon;
grant  execute on function public.supporter_tiers_of(uuid[]) to authenticated;

create or replace function public.supporter_set_hide_badge(p_hide boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Inicia sesión primero'; end if;
  update public.supporters set hide_badge = coalesce(p_hide, false), updated_at = now() where user_id = auth.uid();
end;
$$;
revoke execute on function public.supporter_set_hide_badge(boolean) from public, anon;
grant  execute on function public.supporter_set_hide_badge(boolean) to authenticated;

-- ---------------------------------------------------------------------
-- 4) BONO SEMANAL DE LUNAS (usa coins_apply: queda en el historial de Lunas)
-- ---------------------------------------------------------------------
-- Interna. Una sola vez por persona y semana (la clave del movimiento es única).
create or replace function public.supporter_grant_weekly(p_user uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_tier text := public.supporter_tier_of(p_user);
  v_week date := public.supporter_week_start();
  v_amt  integer;
begin
  if v_tier is null then return false; end if;
  select weekly_lunas into v_amt from public.supporter_tiers where tier = v_tier;
  if coalesce(v_amt, 0) <= 0 then return false; end if;

  begin
    insert into public.supporter_weekly_grants (user_id, week_start, tier, lunas)
    values (p_user, v_week, v_tier, v_amt)
    on conflict (user_id, week_start) do nothing;
    if not found then return false; end if;       -- esta semana ya se entregó

    perform public.coins_apply(p_user, v_amt, 'supporter_weekly', 'supporter', v_week::text,
                               'supporter:weekly:' || p_user::text || ':' || v_week::text);
    return true;
  exception when others then
    return false;   -- p. ej. cuenta congelada: se deshace la fila de arriba y se reintenta otro día
  end;
end;
$$;

-- Para el cron de los lunes: entrega a todas las membresías vigentes
create or replace function public.supporter_weekly_all()
returns integer
language plpgsql security definer set search_path = public as $$
declare r record; n integer := 0;
begin
  for r in select user_id from public.supporters where status in ('active', 'cancelled', 'past_due') and paid_until > now() loop
    if public.supporter_grant_weekly(r.user_id) then n := n + 1; end if;
  end loop;
  return n;
end;
$$;
revoke all on function public.supporter_grant_weekly(uuid), public.supporter_weekly_all() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'daiwa-supporter-weekly';
    -- lunes 00:05 hora de Colombia (UTC-5) = 05:05 UTC
    perform cron.schedule('daiwa-supporter-weekly', '5 5 * * 1', 'select public.supporter_weekly_all()');
  else
    raise notice 'pg_cron no está activo: el bono semanal se entrega cuando cada persona abre «Mi membresía» (también sirve).';
  end if;
exception when others then
  raise notice 'No se pudo programar el bono semanal (no pasa nada): %', sqlerrm;
end $$;

-- ---------------------------------------------------------------------
-- 5) FUNCIONES SOLO PARA EL SERVIDOR (webhooks de PayPal). El navegador NO puede llamarlas.
-- ---------------------------------------------------------------------
-- ¿Este aviso de PayPal es nuevo? (true = procesarlo; false = ya se procesó: ignorarlo)
create or replace function public.paypal_event_begin(p_event_id text, p_type text, p_resource text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_new boolean;
begin
  insert into public.paypal_events (event_id, event_type, resource_id)
  values (p_event_id, p_type, p_resource)
  on conflict (event_id) do update set received_at = now() where public.paypal_events.processed_at is null
  returning true into v_new;
  return coalesce(v_new, false);
end;
$$;
create or replace function public.paypal_event_done(p_event_id text, p_result text)
returns void
language sql security definer set search_path = public as $$
  update public.paypal_events set processed_at = now(), result = left(coalesce(p_result, 'ok'), 200) where event_id = p_event_id;
$$;

-- Activar / renovar una membresía de PayPal. paid_until viene de PayPal (next_billing_time), así que
-- confirmar dos veces (navegador + webhook) da EXACTAMENTE el mismo resultado: nunca se suma de más.
create or replace function public.supporter_server_activate(
  p_user uuid, p_tier text, p_sub text, p_plan text, p_paypal_status text,
  p_paid_until timestamptz, p_last_payment_at timestamptz default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_old public.supporters; v_granted boolean;
begin
  if not exists (select 1 from public.profiles where id = p_user) then raise exception 'No existe esa persona'; end if;
  if not exists (select 1 from public.supporter_tiers where tier = p_tier) then raise exception 'Nivel no válido'; end if;

  insert into public.supporter_subscriptions (paypal_subscription_id, user_id, plan_id, tier, paypal_status, next_billing_time)
  values (p_sub, p_user, p_plan, p_tier, coalesce(p_paypal_status, 'ACTIVE'), p_paid_until)
  on conflict (paypal_subscription_id) do update
     set paypal_status = excluded.paypal_status, next_billing_time = excluded.next_billing_time, updated_at = now();

  select * into v_old from public.supporters where user_id = p_user;
  insert into public.supporters (user_id, tier, status, source, paypal_subscription_id, paid_until, last_payment_at)
  values (p_user, p_tier, 'active', 'paypal', p_sub, p_paid_until, p_last_payment_at)
  on conflict (user_id) do update
     set tier = excluded.tier,
         status = 'active',
         source = 'paypal',
         paypal_subscription_id = excluded.paypal_subscription_id,
         paid_until = greatest(supporters.paid_until, excluded.paid_until),
         last_payment_at = coalesce(excluded.last_payment_at, supporters.last_payment_at),
         updated_at = now();

  v_granted := public.supporter_grant_weekly(p_user);   -- el primer bono llega de inmediato
  return jsonb_build_object('ok', true, 'first_bonus', v_granted, 'tier', p_tier, 'replaced', v_old.user_id is not null);
end;
$$;

-- Registrar un cobro (id de transacción único: repetirlo no hace nada)
create or replace function public.supporter_server_payment(
  p_user uuid, p_sub text, p_tx text, p_amount numeric, p_currency text, p_paid_at timestamptz, p_tier text
)
returns boolean
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  insert into public.supporter_payments (user_id, tier, amount, currency, source, paypal_subscription_id, paypal_transaction_id, paid_at)
  values (p_user, p_tier, p_amount, coalesce(p_currency, 'USD'), 'paypal', p_sub, p_tx, coalesce(p_paid_at, now()))
  on conflict (paypal_transaction_id) where paypal_transaction_id is not null do nothing;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

-- Cancelación / suspensión / vencimiento / pago fallido de una suscripción
-- cancelled y past_due conservan lo ya pagado hasta paid_until; expired y suspended lo cortan al instante.
create or replace function public.supporter_server_status(p_sub text, p_paypal_status text, p_kind text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if p_kind not in ('cancelled', 'past_due', 'expired', 'suspended') then raise exception 'Estado no válido'; end if;
  update public.supporter_subscriptions
     set paypal_status = coalesce(p_paypal_status, paypal_status),
         cancelled_at = case when p_kind in ('cancelled', 'expired') then coalesce(cancelled_at, now()) else cancelled_at end,
         updated_at = now()
   where paypal_subscription_id = p_sub;
  update public.supporters
     set status = p_kind,
         paid_until = case when p_kind in ('expired', 'suspended') then least(paid_until, now()) else paid_until end,
         updated_at = now()
   where paypal_subscription_id = p_sub and source = 'paypal';
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

-- Reembolso o reversión: se marca el pago y se corta la membresía al momento. Los bonos ya entregados no se descuentan.
create or replace function public.supporter_server_reverse(p_tx text, p_kind text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_pay public.supporter_payments;
begin
  if p_kind not in ('refunded', 'reversed') then raise exception 'Tipo no válido'; end if;
  update public.supporter_payments set status = p_kind where paypal_transaction_id = p_tx returning * into v_pay;
  if not found then return false; end if;
  update public.supporters
     set status = 'suspended', paid_until = least(paid_until, now()), updated_at = now()
   where user_id = v_pay.user_id and source = 'paypal';
  insert into public.supporter_admin_log (admin_id, action, target_user, details)
  values (null, 'payment_' || p_kind, v_pay.user_id, jsonb_build_object('tx', p_tx, 'amount', v_pay.amount));
  return true;
end;
$$;

-- ¿De quién es esta suscripción? (para los webhooks)
create or replace function public.supporter_server_sub_owner(p_sub text)
returns table (user_id uuid, tier text)
language sql stable security definer set search_path = public as $$
  select s.user_id, s.tier from public.supporter_subscriptions s where s.paypal_subscription_id = p_sub;
$$;
-- La suscripción vigente de una persona (para cancelarla)
create or replace function public.supporter_server_current_sub(p_user uuid)
returns text
language sql stable security definer set search_path = public as $$
  select s.paypal_subscription_id from public.supporters s where s.user_id = p_user and s.source = 'paypal';
$$;

revoke all on function
  public.paypal_event_begin(text, text, text), public.paypal_event_done(text, text),
  public.supporter_server_activate(uuid, text, text, text, text, timestamptz, timestamptz),
  public.supporter_server_payment(uuid, text, text, numeric, text, timestamptz, text),
  public.supporter_server_status(text, text, text), public.supporter_server_reverse(text, text),
  public.supporter_server_sub_owner(text), public.supporter_server_current_sub(uuid)
  from public, anon, authenticated;
grant execute on function
  public.paypal_event_begin(text, text, text), public.paypal_event_done(text, text),
  public.supporter_server_activate(uuid, text, text, text, text, timestamptz, timestamptz),
  public.supporter_server_payment(uuid, text, text, numeric, text, timestamptz, text),
  public.supporter_server_status(text, text, text), public.supporter_server_reverse(text, text),
  public.supporter_server_sub_owner(text), public.supporter_server_current_sub(uuid)
  to service_role;

-- ---------------------------------------------------------------------
-- 6) PÁGINA «MI MEMBRESÍA» (una sola consulta trae todo)
-- ---------------------------------------------------------------------
create or replace function public.supporter_me()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me     uuid := auth.uid();
  v_sup  public.supporters;
  v_tier text;
  v_week date := public.supporter_week_start();
  v_granted boolean := false;
begin
  if me is null then raise exception 'Inicia sesión primero'; end if;
  select * into v_sup from public.supporters where user_id = me;
  v_tier := public.supporter_tier_of(me);
  if v_tier is not null then v_granted := public.supporter_grant_weekly(me); end if;   -- bono de esta semana (una sola vez)

  return jsonb_build_object(
    'tiers', (select coalesce(jsonb_agg(to_jsonb(t) order by t.rank), '[]'::jsonb) from public.supporter_tiers t where t.is_active),
    'membership', case when v_sup.user_id is null then null else jsonb_build_object(
        'tier', v_sup.tier, 'status', v_sup.status, 'source', v_sup.source, 'active', v_tier is not null,
        'paid_until', v_sup.paid_until, 'started_at', v_sup.started_at, 'hide_badge', v_sup.hide_badge,
        'has_subscription', v_sup.paypal_subscription_id is not null and v_sup.source = 'paypal') end,
    'week_start', v_week,
    'weekly_granted_now', v_granted,
    'weekly_granted', exists (select 1 from public.supporter_weekly_grants g where g.user_id = me and g.week_start = v_week),
    'payments', (select coalesce(jsonb_agg(to_jsonb(p) order by p.paid_at desc), '[]'::jsonb) from (
        select tier, amount, currency, source, status, paid_at from public.supporter_payments where user_id = me order by paid_at desc limit 12) p),
    'requests', (select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc), '[]'::jsonb) from (
        select id, tier, status, created_at, review_note from public.supporter_manual_requests where user_id = me order by created_at desc limit 5) r),
    'perks', (select coalesce(jsonb_agg(jsonb_build_object(
        'code', k.code, 'kind', k.kind, 'name', k.name, 'min_tier', k.min_tier,
        'available', k.available and k.item_id is not null,
        'claimed', exists (select 1 from public.supporter_perk_claims c where c.user_id = me and c.code = k.code),
        'unlocked', (select t.rank from public.supporter_tiers t where t.tier = k.min_tier) <= public.supporter_rank_of(me)
      ) order by k.sort), '[]'::jsonb) from public.supporter_perks k)
  );
end;
$$;
revoke execute on function public.supporter_me() from public, anon;
grant  execute on function public.supporter_me() to authenticated;

-- Reclamar un beneficio cosmético. Hoy ninguno está disponible: se activarán uno por uno cuando existan los diseños.
-- Las recompensas reclamadas se conservan aunque la membresía se cancele (así se entregan en cos_grant).
create or replace function public.supporter_claim_perk(p_code text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  k  public.supporter_perks;
begin
  if me is null then raise exception 'Inicia sesión primero'; end if;
  select * into k from public.supporter_perks where code = p_code;
  if not found then raise exception 'Ese beneficio no existe'; end if;
  if not k.available or k.item_id is null then raise exception 'Este beneficio todavía no está disponible. ¡Pronto!'; end if;
  if public.supporter_rank_of(me) < (select rank from public.supporter_tiers where tier = k.min_tier) then
    raise exception 'Necesitas una membresía activa de este nivel para reclamarlo';
  end if;
  if exists (select 1 from public.supporter_perk_claims where user_id = me and code = k.code) then
    return jsonb_build_object('ok', true, 'already', true);
  end if;
  perform public.cos_grant(me, k.item_id, 'supporter', 0);
  insert into public.supporter_perk_claims (user_id, code) values (me, k.code) on conflict do nothing;
  return jsonb_build_object('ok', true);
end;
$$;
revoke execute on function public.supporter_claim_perk(text) from public, anon;
grant  execute on function public.supporter_claim_perk(text) to authenticated;

-- ---------------------------------------------------------------------
-- 7) PAGO MANUAL (PayPal.me): la persona avisa y un admin lo comprueba en su PayPal
-- ---------------------------------------------------------------------
create or replace function public.supporter_manual_submit(p_tier text, p_reference text, p_note text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me  uuid := auth.uid();
  v_ref text := btrim(coalesce(p_reference, ''));
  v_id uuid;
begin
  if me is null then raise exception 'Inicia sesión primero'; end if;
  if not exists (select 1 from public.supporter_tiers where tier = p_tier and is_active) then raise exception 'Elige un nivel'; end if;
  if v_ref !~ '^[A-Za-z0-9-]{6,40}$' then
    raise exception 'Escribe el ID de transacción de PayPal (solo letras y números, de 6 a 40 caracteres)';
  end if;
  if (select count(*) from public.supporter_manual_requests where user_id = me and status = 'pending') >= 2 then
    raise exception 'Ya tienes solicitudes en revisión. Espera a que se aprueben';
  end if;
  if (select count(*) from public.supporter_manual_requests where user_id = me and created_at > now() - interval '1 day') >= 5 then
    raise exception 'Demasiadas solicitudes hoy. Inténtalo mañana';
  end if;
  if exists (select 1 from public.supporter_manual_requests where lower(reference) = lower(v_ref) and status <> 'rejected') then
    raise exception 'Ese ID de transacción ya fue enviado';
  end if;
  insert into public.supporter_manual_requests (user_id, tier, reference, note)
  values (me, p_tier, v_ref, nullif(left(btrim(coalesce(p_note, '')), 200), ''))
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.supporter_manual_submit(text, text, text) from public, anon;
grant  execute on function public.supporter_manual_submit(text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 8) LÍMITE DE HISTORIAS (servidor): 3 normales, y 4 / 5 / 7 según el nivel
-- story_quota y story_create ya leen esta función, así que el servidor lo valida siempre.
-- ---------------------------------------------------------------------
create or replace function public.story_limit_per_day()
returns int
language sql stable security definer set search_path = public as $$
  select greatest(
    greatest(1, least(20, public.story_cfg_int('stories_limit_per_day', 3))),
    coalesce((select t.story_limit from public.supporter_tiers t where t.tier = public.supporter_tier_of(auth.uid())), 0)
  );
$$;

-- ---------------------------------------------------------------------
-- 9) TIENDA: descuento Supporter (no se acumula con ofertas: se cobra el precio MÁS BAJO)
--    Solo cosméticos que de verdad se venden (obtainable = 'tienda' y precio > 0).
-- ---------------------------------------------------------------------
create or replace function public.cos_supporter_price(p_price integer, p_obtainable text, p_user uuid)
returns integer
language sql stable security definer set search_path = public as $$
  select case
           when p_obtainable = 'tienda' and coalesce(p_price, 0) > 0
             then greatest(1, floor(p_price * (100 - public.supporter_discount_pct(p_user)) / 100.0)::int)
           else p_price
         end;
$$;
revoke all on function public.cos_supporter_price(integer, text, uuid) from public, anon, authenticated;


-- Catálogo, compra y cotización de packs con el descuento Supporter (copias de las de la v1.5.0, cambiando solo el precio)
create or replace function public.shop_catalog()
returns table (
  id uuid, type text, slug text, name text, rarity text, price integer, collection text,
  min_size integer, custom_hue boolean, palettes text[], meta jsonb, obtainable text, release_version text, owned boolean,
  base_price integer, sale_id uuid, sale_name text, sale_ends_at timestamptz, wished boolean
)
language sql stable security definer set search_path = public as $$
  select i.id, i.type, i.slug, i.name, i.rarity,
         least(coalesce(s.sale_price, i.price), public.cos_supporter_price(i.price, i.obtainable, auth.uid())) as price,   -- el que se cobra AHORA (oferta o descuento Supporter: el más bajo)
         i.collection, i.min_size, i.custom_hue, i.palettes, i.meta, i.obtainable, i.release_version,
         public.cos_owns(auth.uid(), i.id),
         i.price as base_price,                               -- el de lista
         s.sid, s.sname, s.ends_at,
         exists (select 1 from public.shop_wishlist w where w.user_id = auth.uid() and w.item_id = i.id)
    from public.cosmetic_items i
    join public.cosmetic_collections c on c.id = i.collection
    left join lateral (
      select si.sale_price, sa.id as sid, sa.name as sname, sa.ends_at
        from public.shop_sale_items si
        join public.shop_sales sa on sa.id = si.sale_id
       where si.item_id = i.id
         and sa.is_active and now() >= sa.starts_at and now() < sa.ends_at
         and i.obtainable = 'tienda' and i.price > 0 and si.sale_price < i.price
       order by si.sale_price asc, sa.ends_at asc
       limit 1
    ) s on true
   where auth.uid() is not null and i.is_active and c.is_active
     -- los cosméticos exclusivos de Supporter no salen en la tienda pública; solo los ve quien ya los tiene
     and (i.obtainable <> 'supporter' or public.cos_owns(auth.uid(), i.id))
   order by c.sort, i.type, i.price, i.name;
$$;

create or replace function public.shop_buy(p_item uuid, p_expected_price integer, p_key uuid default gen_random_uuid())
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  i       public.cosmetic_items;
  c       public.cosmetic_collections;
  v_price integer;
  res     jsonb;
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  -- doble toque o reintento con la misma clave: no se cobra dos veces
  if exists (select 1 from public.coin_ledger where idempotency_key = 'shop:' || p_key::text) then
    return jsonb_build_object('ok', true, 'replayed', true, 'balance', public.coins_balance());
  end if;
  select * into i from public.cosmetic_items where id = p_item;
  if not found then raise exception 'Ese cosmético no existe'; end if;
  select * into c from public.cosmetic_collections where id = i.collection;
  if not i.is_active or not coalesce(c.is_active, false) then raise exception 'Ese cosmético todavía no está disponible'; end if;
  if i.obtainable <> 'tienda' or i.price <= 0 then raise exception 'Este cosmético no se vende en la tienda'; end if;

  -- se bloquea la billetera: dos pestañas comprando a la vez se ponen en fila
  insert into public.user_wallets (user_id) values (v_me) on conflict (user_id) do nothing;
  perform 1 from public.user_wallets where user_id = v_me for update;

  if exists (select 1 from public.user_cosmetics where user_id = v_me and item_id = i.id) then
    raise exception 'Ya tienes este cosmético';
  end if;

  v_price := least(coalesce(public.cos_sale_price(i.id), i.price), public.cos_supporter_price(i.price, i.obtainable, v_me));   -- oferta o descuento Supporter: el más bajo
  if p_expected_price is distinct from v_price then
    raise exception 'El precio cambió: ahora cuesta % ☾', v_price using errcode = 'P0001';
  end if;

  res := public.coins_apply(v_me, -v_price, 'shop_buy', 'cosmetic', i.id::text, 'shop:' || p_key::text);
  perform public.cos_grant(v_me, i.id, 'shop', v_price);
  perform public.cos_check_collection(v_me, i.collection);
  delete from public.shop_wishlist where user_id = v_me and item_id = i.id;   -- ya es tuyo: sale de tus deseos
  return jsonb_build_object('ok', true, 'balance', (res ->> 'balance')::int, 'type', i.type, 'slug', i.slug, 'name', i.name);
end;
$$;

create or replace function public.shop_pack_quote(p_collection text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  c       public.cosmetic_collections;
  v_full  integer;
  v_eff   integer;
  v_disc  integer := public.cos_pack_discount();
  v_price integer;
  v_items jsonb;
begin
  if v_me is null then return null; end if;
  select * into c from public.cosmetic_collections where id = p_collection and is_active and has_pack;
  if not found then return null; end if;
  select coalesce(sum(i.price), 0)::int,
         coalesce(sum(least(coalesce(public.cos_sale_price(i.id), i.price), public.cos_supporter_price(i.price, i.obtainable, v_me))), 0)::int,
         coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'type', i.type, 'slug', i.slug, 'name', i.name, 'price', i.price,
                                               'eff', least(coalesce(public.cos_sale_price(i.id), i.price), public.cos_supporter_price(i.price, i.obtainable, v_me))) order by i.type, i.price), '[]'::jsonb)
    into v_full, v_eff, v_items
    from public.cosmetic_items i
   where i.is_active and i.obtainable = 'tienda' and i.price > 0
     and ((i.collection = c.id and i.type = 'avatar_decoration')
          or (i.type = 'profile_card' and i.slug = c.pack_card)
          or (i.type = 'entry_effect' and i.slug = c.pack_effect))
     and not exists (select 1 from public.user_cosmetics uc where uc.user_id = v_me and uc.item_id = i.id);
  v_price := least(floor(v_full * (100 - v_disc) / 100.0)::int, v_eff);
  return jsonb_build_object(
    'collection', c.id, 'items', v_items, 'full_price', v_full,
    'discount_pct', case when v_full > 0 then round(100.0 - v_price * 100.0 / v_full)::int else 0 end,
    'price', v_price
  );
end;
$$;


-- ---------------------------------------------------------------------
-- 10) CENTRO DE MANDO → Supporters (permiso nuevo: manage_supporters; el Admin Supremo lo tiene siempre)
--     Todo cambio queda en supporter_admin_log.
-- ---------------------------------------------------------------------
create or replace function public.supporter_admin_overview()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_supporters') then raise exception 'No tienes permiso'; end if;
  return jsonb_build_object(
    'active', (select count(*) from public.supporters s where s.status in ('active', 'cancelled', 'past_due') and s.paid_until > now()),
    'by_tier', (select coalesce(jsonb_object_agg(x.tier, x.n), '{}'::jsonb) from (
        select s.tier, count(*)::int n from public.supporters s
         where s.status in ('active', 'cancelled', 'past_due') and s.paid_until > now() group by s.tier) x),
    'pending_requests', (select count(*) from public.supporter_manual_requests where status = 'pending'),
    'payments_30d', (select coalesce(sum(amount), 0) from public.supporter_payments where status = 'completed' and paid_at > now() - interval '30 days'),
    'events_failed', (select count(*) from public.paypal_events where processed_at is null and received_at > now() - interval '7 days')
  );
end;
$$;

create or replace function public.supporter_admin_list(p_query text default null, p_limit integer default 50)
returns table (user_id uuid, username text, id_student text, tier text, status text, source text, paid_until timestamptz,
               started_at timestamptz, active boolean, hide_badge boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_supporters') then raise exception 'No tienes permiso'; end if;
  return query
    select s.user_id, p.username, p.id_student, s.tier, s.status, s.source, s.paid_until, s.started_at,
           (s.status in ('active', 'cancelled', 'past_due') and s.paid_until > now()), s.hide_badge
      from public.supporters s
      join public.profiles p on p.id = s.user_id
     where p_query is null or btrim(p_query) = ''
        or p.username ilike '%' || btrim(p_query) || '%' or coalesce(p.id_student, '') ilike '%' || btrim(p_query) || '%'
     order by (s.status in ('active', 'cancelled', 'past_due') and s.paid_until > now()) desc, s.paid_until desc
     limit greatest(1, least(coalesce(p_limit, 50), 200));
end;
$$;

create or replace function public.supporter_admin_requests(p_status text default 'pending')
returns table (id uuid, user_id uuid, username text, id_student text, tier text, tier_name text, price_usd numeric,
               reference text, note text, status text, created_at timestamptz, reviewed_at timestamptz, review_note text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_supporters') then raise exception 'No tienes permiso'; end if;
  return query
    select r.id, r.user_id, p.username, p.id_student, r.tier, t.name, t.price_usd, r.reference, r.note, r.status,
           r.created_at, r.reviewed_at, r.review_note
      from public.supporter_manual_requests r
      join public.profiles p on p.id = r.user_id
      join public.supporter_tiers t on t.tier = r.tier
     where p_status is null or r.status = p_status
     order by r.created_at desc
     limit 100;
end;
$$;

-- Aprobar (da 30 días del nivel pedido + el bono de la semana) o rechazar una solicitud de PayPal.me
create or replace function public.supporter_admin_review(p_id uuid, p_approve boolean, p_note text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r public.supporter_manual_requests;
  t public.supporter_tiers;
  v_until timestamptz;
begin
  if not public.eco_is_staff('manage_supporters') then raise exception 'No tienes permiso'; end if;
  select * into r from public.supporter_manual_requests where id = p_id for update;
  if not found then raise exception 'No existe esa solicitud'; end if;
  if r.status <> 'pending' then raise exception 'Esa solicitud ya fue revisada'; end if;

  if not coalesce(p_approve, false) then
    update public.supporter_manual_requests
       set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), review_note = left(btrim(coalesce(p_note, '')), 200)
     where id = p_id;
    insert into public.supporter_admin_log (admin_id, action, target_user, details)
    values (auth.uid(), 'manual_rejected', r.user_id, jsonb_build_object('request', p_id, 'reference', r.reference, 'note', p_note));
    return jsonb_build_object('ok', true, 'approved', false);
  end if;

  select * into t from public.supporter_tiers where tier = r.tier;
  v_until := greatest(now(), coalesce((select s.paid_until from public.supporters s where s.user_id = r.user_id
                                         and s.status in ('active', 'cancelled', 'past_due')), now())) + interval '30 days';
  insert into public.supporters (user_id, tier, status, source, paid_until, last_payment_at)
  values (r.user_id, r.tier, 'active', 'manual', v_until, now())
  on conflict (user_id) do update
     set tier = excluded.tier, status = 'active', source = 'manual', paypal_subscription_id = null,
         paid_until = excluded.paid_until, last_payment_at = now(), updated_at = now();
  insert into public.supporter_payments (user_id, tier, amount, currency, source, paypal_transaction_id)
  values (r.user_id, r.tier, t.price_usd, 'USD', 'manual', r.reference)
  on conflict (paypal_transaction_id) where paypal_transaction_id is not null do nothing;
  update public.supporter_manual_requests
     set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), review_note = left(btrim(coalesce(p_note, '')), 200)
   where id = p_id;
  perform public.supporter_grant_weekly(r.user_id);
  insert into public.supporter_admin_log (admin_id, action, target_user, details)
  values (auth.uid(), 'manual_approved', r.user_id, jsonb_build_object('request', p_id, 'tier', r.tier, 'reference', r.reference, 'paid_until', v_until));
  return jsonb_build_object('ok', true, 'approved', true, 'paid_until', v_until);
end;
$$;

-- Ajuste manual: dar, extender o quitar una membresía (el motivo es obligatorio)
create or replace function public.supporter_admin_set(p_user uuid, p_tier text, p_days integer, p_reason text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_reason text := btrim(coalesce(p_reason, ''));
  v_until timestamptz;
begin
  if not public.eco_is_staff('manage_supporters') then raise exception 'No tienes permiso'; end if;
  if char_length(v_reason) < 3 then raise exception 'El motivo es obligatorio'; end if;
  if not exists (select 1 from public.profiles where id = p_user) then raise exception 'No existe esa persona'; end if;

  if p_tier is null or p_tier = '' then          -- quitar
    update public.supporters set status = 'suspended', paid_until = least(paid_until, now()), updated_at = now() where user_id = p_user;
    insert into public.supporter_admin_log (admin_id, action, target_user, details)
    values (auth.uid(), 'removed', p_user, jsonb_build_object('reason', v_reason));
    return jsonb_build_object('ok', true, 'removed', true);
  end if;

  if not exists (select 1 from public.supporter_tiers where tier = p_tier) then raise exception 'Nivel no válido'; end if;
  if p_days is null or p_days < 1 or p_days > 365 then raise exception 'Los días van de 1 a 365'; end if;
  v_until := greatest(now(), coalesce((select s.paid_until from public.supporters s where s.user_id = p_user
                                         and s.status in ('active', 'cancelled', 'past_due')), now())) + make_interval(days => p_days);
  insert into public.supporters (user_id, tier, status, source, paid_until)
  values (p_user, p_tier, 'active', 'admin', v_until)
  on conflict (user_id) do update
     set tier = excluded.tier, status = 'active', paid_until = excluded.paid_until, updated_at = now(),
         source = case when public.supporters.paypal_subscription_id is not null and public.supporters.source = 'paypal' then 'paypal' else 'admin' end;
  perform public.supporter_grant_weekly(p_user);
  insert into public.supporter_admin_log (admin_id, action, target_user, details)
  values (auth.uid(), 'granted', p_user, jsonb_build_object('tier', p_tier, 'days', p_days, 'reason', v_reason, 'paid_until', v_until));
  return jsonb_build_object('ok', true, 'paid_until', v_until);
end;
$$;

-- Historiales: pagos · bonos · registro de cambios · avisos de PayPal
create or replace function public.supporter_admin_activity(p_kind text, p_limit integer default 60)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_lim integer := greatest(1, least(coalesce(p_limit, 60), 200));
begin
  if not public.eco_is_staff('manage_supporters') then raise exception 'No tienes permiso'; end if;
  if p_kind = 'payments' then
    return (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
      select p.username, y.tier, y.amount, y.currency, y.source, y.status, y.paid_at, y.paypal_transaction_id as tx
        from public.supporter_payments y join public.profiles p on p.id = y.user_id order by y.paid_at desc limit v_lim) x);
  elsif p_kind = 'grants' then
    return (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
      select p.username, g.tier, g.lunas, g.week_start, g.created_at
        from public.supporter_weekly_grants g join public.profiles p on p.id = g.user_id order by g.created_at desc limit v_lim) x);
  elsif p_kind = 'log' then
    return (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
      select a.action, ad.username as admin, tu.username as target, a.details, a.created_at
        from public.supporter_admin_log a
        left join public.profiles ad on ad.id = a.admin_id
        left join public.profiles tu on tu.id = a.target_user
       order by a.created_at desc limit v_lim) x);
  elsif p_kind = 'events' then
    return (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
      select e.event_type, e.resource_id, e.received_at, e.processed_at, e.result
        from public.paypal_events e order by e.received_at desc limit v_lim) x);
  end if;
  raise exception 'Historial no válido';
end;
$$;

revoke execute on function public.supporter_admin_overview(), public.supporter_admin_list(text, integer),
  public.supporter_admin_requests(text), public.supporter_admin_review(uuid, boolean, text),
  public.supporter_admin_set(uuid, text, integer, text), public.supporter_admin_activity(text, integer) from public, anon;
grant execute on function public.supporter_admin_overview(), public.supporter_admin_list(text, integer),
  public.supporter_admin_requests(text), public.supporter_admin_review(uuid, boolean, text),
  public.supporter_admin_set(uuid, text, integer, text), public.supporter_admin_activity(text, integer) to authenticated;

-- Listo. Comprobación rápida (opcional):
--   select tier, name, price_usd, weekly_lunas, story_limit, shop_discount_pct from public.supporter_tiers order by rank;
--   select public.story_limit_per_day();   -- 3 para una cuenta normal
