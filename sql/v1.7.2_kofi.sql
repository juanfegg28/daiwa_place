-- =====================================================================
-- DaiwaPlace v1.7.2 — Ko-fi (propinas) junto a PayPal.Me, con aprobación en el Centro de Mando
-- Pégalo COMPLETO en Supabase → SQL Editor → New query → Run. Se puede correr más de una vez.
-- Requiere haber corrido antes v1.7.0_circulo_lunar.sql y v1.7.1_paypalme_manual.sql.
--
-- Qué cambia:
--   1) Cada solicitud guarda con qué método se pagó: 'paypalme' (lo de antes) o 'kofi'.
--   2) Ko-fi no le da al que paga un «ID de transacción», así que el comprobante es un CÓDIGO que genera la página
--      (formato DW-XXXX-YYYYY) y que la persona pega en el mensaje de su propina. Los 4 primeros caracteres salen del id de
--      la persona y la base de datos los comprueba: nadie puede reclamar el código de otra persona.
--   3) El pago aprobado queda registrado con su método (Pagos del historial y «Mi membresía»).
--   4) El Centro de Mando muestra cuántas solicitudes esperan de cada método.
-- No borra ni modifica membresías ni solicitudes existentes (las anteriores quedan como 'paypalme').
-- =====================================================================

-- 1) Columnas nuevas ----------------------------------------------------------------------------------
alter table public.supporter_manual_requests
  add column if not exists method text not null default 'paypalme' check (method in ('paypalme', 'kofi'));

alter table public.supporter_payments
  add column if not exists method text check (method is null or method in ('paypalme', 'kofi'));
-- los pagos manuales que ya existían eran de PayPal.Me
update public.supporter_payments set method = 'paypalme' where source = 'manual' and method is null;

-- 2) Enviar una solicitud (ahora con método) ---------------------------------------------------------
drop function if exists public.supporter_manual_submit(text, text, text, integer);
drop function if exists public.supporter_manual_submit(text, text, text, integer, text);
create or replace function public.supporter_manual_submit(
  p_tier text, p_reference text, p_note text default null, p_months integer default 1, p_method text default 'paypalme'
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me       uuid := auth.uid();
  v_ref    text := btrim(coalesce(p_reference, ''));
  v_method text := coalesce(nullif(btrim(coalesce(p_method, '')), ''), 'paypalme');
  v_id     uuid;
begin
  if me is null then raise exception 'Inicia sesión primero'; end if;
  if v_method not in ('paypalme', 'kofi') then raise exception 'Método de pago no válido'; end if;
  if not exists (select 1 from public.supporter_tiers where tier = p_tier and is_active) then raise exception 'Elige un nivel'; end if;
  if p_months is null or p_months < 1 or p_months > 12 then raise exception 'Los meses van de 1 a 12'; end if;

  if v_method = 'kofi' then
    -- código DW-<4 primeros caracteres del id de quien envía>-<4 a 8 letras o números>
    if v_ref !~* ('^DW-' || upper(left(replace(me::text, '-', ''), 4)) || '-[A-Z0-9]{4,8}$') then
      raise exception 'El código de Ko-fi no es válido';
    end if;
  elsif v_ref !~ '^[A-Za-z0-9-]{6,40}$' then
    raise exception 'Escribe el ID de transacción de PayPal (solo letras y números, de 6 a 40 caracteres)';
  end if;

  if (select count(*) from public.supporter_manual_requests where user_id = me and status = 'pending') >= 2 then
    raise exception 'Ya tienes solicitudes en revisión. Espera a que se aprueben';
  end if;
  if (select count(*) from public.supporter_manual_requests where user_id = me and created_at > now() - interval '1 day') >= 5 then
    raise exception 'Demasiadas solicitudes hoy. Inténtalo mañana';
  end if;
  if exists (select 1 from public.supporter_manual_requests where lower(reference) = lower(v_ref) and status <> 'rejected') then
    raise exception '%', case when v_method = 'kofi' then 'Ese código ya fue enviado' else 'Ese ID de transacción ya fue enviado' end;
  end if;

  insert into public.supporter_manual_requests (user_id, tier, reference, note, months, method)
  values (me, p_tier, v_ref, nullif(left(btrim(coalesce(p_note, '')), 200), ''), p_months, v_method)
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.supporter_manual_submit(text, text, text, integer, text) from public, anon;
grant  execute on function public.supporter_manual_submit(text, text, text, integer, text) to authenticated;

-- 3) Lista de solicitudes para el Centro de Mando (ahora con método) ----------------------------------
drop function if exists public.supporter_admin_requests(text);
create or replace function public.supporter_admin_requests(p_status text default 'pending')
returns table (id uuid, user_id uuid, username text, id_student text, tier text, tier_name text, price_usd numeric,
               months integer, expected_usd numeric, reference text, note text, status text, created_at timestamptz,
               reviewed_at timestamptz, review_note text, is_renewal boolean, method text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_supporters') then raise exception 'No tienes permiso'; end if;
  return query
    select r.id, r.user_id, p.username, p.id_student, r.tier, t.name, t.price_usd,
           r.months, (t.price_usd * r.months), r.reference, r.note, r.status,
           r.created_at, r.reviewed_at, r.review_note,
           exists (select 1 from public.supporters s where s.user_id = r.user_id),
           r.method
      from public.supporter_manual_requests r
      join public.profiles p on p.id = r.user_id
      join public.supporter_tiers t on t.tier = r.tier
     where p_status is null or r.status = p_status
     order by r.created_at desc
     limit 100;
end;
$$;
revoke execute on function public.supporter_admin_requests(text) from public, anon;
grant  execute on function public.supporter_admin_requests(text) to authenticated;

-- 4) Aprobar / rechazar (igual que antes; ahora el pago y el registro guardan el método) -----------------
create or replace function public.supporter_admin_review(p_id uuid, p_approve boolean, p_note text default null, p_months integer default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r public.supporter_manual_requests;
  t public.supporter_tiers;
  v_months integer;
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
    values (auth.uid(), 'manual_rejected', r.user_id, jsonb_build_object('request', p_id, 'method', r.method, 'reference', r.reference, 'note', p_note));
    return jsonb_build_object('ok', true, 'approved', false);
  end if;

  v_months := coalesce(p_months, r.months);
  if v_months < 1 or v_months > 12 then raise exception 'Los meses van de 1 a 12'; end if;
  select * into t from public.supporter_tiers where tier = r.tier;
  v_until := greatest(now(), coalesce((select s.paid_until from public.supporters s where s.user_id = r.user_id
                                         and s.status in ('active', 'cancelled', 'past_due')), now())) + make_interval(days => 30 * v_months);
  insert into public.supporters (user_id, tier, status, source, paid_until, last_payment_at)
  values (r.user_id, r.tier, 'active', 'manual', v_until, now())
  on conflict (user_id) do update
     set tier = excluded.tier, status = 'active', source = 'manual', paypal_subscription_id = null,
         paid_until = excluded.paid_until, last_payment_at = now(), updated_at = now();
  insert into public.supporter_payments (user_id, tier, amount, currency, source, method, paypal_transaction_id)
  values (r.user_id, r.tier, t.price_usd * v_months, 'USD', 'manual', r.method, r.reference)
  on conflict (paypal_transaction_id) where paypal_transaction_id is not null do nothing;
  update public.supporter_manual_requests
     set status = 'approved', months = v_months, reviewed_by = auth.uid(), reviewed_at = now(), review_note = left(btrim(coalesce(p_note, '')), 200)
   where id = p_id;
  perform public.supporter_grant_weekly(r.user_id);
  insert into public.supporter_admin_log (admin_id, action, target_user, details)
  values (auth.uid(), 'manual_approved', r.user_id, jsonb_build_object('request', p_id, 'method', r.method, 'tier', r.tier, 'months', v_months, 'reference', r.reference, 'paid_until', v_until));
  return jsonb_build_object('ok', true, 'approved', true, 'paid_until', v_until, 'months', v_months);
end;
$$;
revoke execute on function public.supporter_admin_review(uuid, boolean, text, integer) from public, anon;
grant  execute on function public.supporter_admin_review(uuid, boolean, text, integer) to authenticated;

-- 5) Resumen del Centro de Mando: solicitudes en espera por método -------------------------------------
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
    'pending_paypalme', (select count(*) from public.supporter_manual_requests where status = 'pending' and method = 'paypalme'),
    'pending_kofi', (select count(*) from public.supporter_manual_requests where status = 'pending' and method = 'kofi'),
    'payments_30d', (select coalesce(sum(amount), 0) from public.supporter_payments where status = 'completed' and paid_at > now() - interval '30 days'),
    'events_failed', (select count(*) from public.paypal_events where processed_at is null and received_at > now() - interval '7 days')
  );
end;
$$;

-- 6) Historiales: los pagos ahora muestran el método ---------------------------------------------------
create or replace function public.supporter_admin_activity(p_kind text, p_limit integer default 60)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_lim integer := greatest(1, least(coalesce(p_limit, 60), 200));
begin
  if not public.eco_is_staff('manage_supporters') then raise exception 'No tienes permiso'; end if;
  if p_kind = 'payments' then
    return (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
      select p.username, y.tier, y.amount, y.currency, y.source, y.method, y.status, y.paid_at, y.paypal_transaction_id as tx
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

-- 7) «Mi membresía»: pagos y solicitudes con su método (igual que la v1.7.0, solo se añade `method`) -------
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
        select tier, amount, currency, source, method, status, paid_at from public.supporter_payments where user_id = me order by paid_at desc limit 12) p),
    'requests', (select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc), '[]'::jsonb) from (
        select id, tier, method, status, created_at, review_note from public.supporter_manual_requests where user_id = me order by created_at desc limit 5) r),
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

-- Le avisa a Supabase que hay funciones nuevas (así no hay que esperar a que se entere sola)
notify pgrst, 'reload schema';

-- Listo. Comprobación rápida (opcional):
--   select column_name from information_schema.columns where table_name = 'supporter_manual_requests' and column_name = 'method';  -- 1 fila
--   select method, count(*) from public.supporter_manual_requests group by method;                                                  -- las anteriores salen como 'paypalme'
