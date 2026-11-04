-- =====================================================================
-- DaiwaPlace v1.7.1 — PayPal.Me como método principal (pago manual con aprobación en el Centro de Mando)
-- Pégalo COMPLETO en Supabase → SQL Editor → New query → Run. Se puede correr más de una vez.
-- Requiere haber corrido antes v1.7.0_circulo_lunar.sql.
--
-- Qué cambia:
--   1) Las solicitudes pueden pedir varios meses de una vez (1 a 12) y guardan cuántos.
--   2) Al aprobar, el admin puede ajustar los meses; cada mes = 30 días y el pago queda registrado.
--   3) Nueva lista «Por renovar» en el Centro de Mando: quién vence pronto (o venció hace poco).
-- =====================================================================

alter table public.supporter_manual_requests
  add column if not exists months integer not null default 1;
do $$
begin
  alter table public.supporter_manual_requests drop constraint if exists supporter_manual_months_check;
  alter table public.supporter_manual_requests add constraint supporter_manual_months_check check (months between 1 and 12);
exception when others then
  raise notice 'No se pudo poner la restricción de meses (no pasa nada): %', sqlerrm;
end $$;

-- 1) Enviar una solicitud (con meses) -------------------------------------------------------------
drop function if exists public.supporter_manual_submit(text, text, text);
create or replace function public.supporter_manual_submit(p_tier text, p_reference text, p_note text default null, p_months integer default 1)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me  uuid := auth.uid();
  v_ref text := btrim(coalesce(p_reference, ''));
  v_id uuid;
begin
  if me is null then raise exception 'Inicia sesión primero'; end if;
  if not exists (select 1 from public.supporter_tiers where tier = p_tier and is_active) then raise exception 'Elige un nivel'; end if;
  if p_months is null or p_months < 1 or p_months > 12 then raise exception 'Los meses van de 1 a 12'; end if;
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
  insert into public.supporter_manual_requests (user_id, tier, reference, note, months)
  values (me, p_tier, v_ref, nullif(left(btrim(coalesce(p_note, '')), 200), ''), p_months)
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.supporter_manual_submit(text, text, text, integer) from public, anon;
grant  execute on function public.supporter_manual_submit(text, text, text, integer) to authenticated;

-- 2) Lista de solicitudes para el Centro de Mando (ahora con meses y monto esperado) --------------------
drop function if exists public.supporter_admin_requests(text);
create or replace function public.supporter_admin_requests(p_status text default 'pending')
returns table (id uuid, user_id uuid, username text, id_student text, tier text, tier_name text, price_usd numeric,
               months integer, expected_usd numeric, reference text, note text, status text, created_at timestamptz,
               reviewed_at timestamptz, review_note text, is_renewal boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_supporters') then raise exception 'No tienes permiso'; end if;
  return query
    select r.id, r.user_id, p.username, p.id_student, r.tier, t.name, t.price_usd,
           r.months, (t.price_usd * r.months), r.reference, r.note, r.status,
           r.created_at, r.reviewed_at, r.review_note,
           exists (select 1 from public.supporters s where s.user_id = r.user_id)
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

-- 3) Aprobar / rechazar (cada mes = 30 días; el admin puede cambiar los meses antes de aprobar) -----------
drop function if exists public.supporter_admin_review(uuid, boolean, text);
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
    values (auth.uid(), 'manual_rejected', r.user_id, jsonb_build_object('request', p_id, 'reference', r.reference, 'note', p_note));
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
  insert into public.supporter_payments (user_id, tier, amount, currency, source, paypal_transaction_id)
  values (r.user_id, r.tier, t.price_usd * v_months, 'USD', 'manual', r.reference)
  on conflict (paypal_transaction_id) where paypal_transaction_id is not null do nothing;
  update public.supporter_manual_requests
     set status = 'approved', months = v_months, reviewed_by = auth.uid(), reviewed_at = now(), review_note = left(btrim(coalesce(p_note, '')), 200)
   where id = p_id;
  perform public.supporter_grant_weekly(r.user_id);
  insert into public.supporter_admin_log (admin_id, action, target_user, details)
  values (auth.uid(), 'manual_approved', r.user_id, jsonb_build_object('request', p_id, 'tier', r.tier, 'months', v_months, 'reference', r.reference, 'paid_until', v_until));
  return jsonb_build_object('ok', true, 'approved', true, 'paid_until', v_until, 'months', v_months);
end;
$$;
revoke execute on function public.supporter_admin_review(uuid, boolean, text, integer) from public, anon;
grant  execute on function public.supporter_admin_review(uuid, boolean, text, integer) to authenticated;

-- 4) «Por renovar»: quién vence en los próximos días (o venció hace poco) ---------------------------------
create or replace function public.supporter_admin_expiring(p_days integer default 10)
returns table (user_id uuid, username text, id_student text, tier text, source text, paid_until timestamptz, days_left integer, pending_request boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_supporters') then raise exception 'No tienes permiso'; end if;
  return query
    select s.user_id, p.username, p.id_student, s.tier, s.source, s.paid_until,
           floor(extract(epoch from (s.paid_until - now())) / 86400)::int,
           exists (select 1 from public.supporter_manual_requests q where q.user_id = s.user_id and q.status = 'pending')
      from public.supporters s
      join public.profiles p on p.id = s.user_id
     where s.status in ('active', 'cancelled', 'past_due', 'expired')
       and s.paid_until < now() + make_interval(days => greatest(1, least(coalesce(p_days, 10), 60)))
       and s.paid_until > now() - interval '14 days'
     order by s.paid_until asc
     limit 100;
end;
$$;
revoke execute on function public.supporter_admin_expiring(integer) from public, anon;
grant  execute on function public.supporter_admin_expiring(integer) to authenticated;
