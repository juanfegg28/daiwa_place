-- =====================================================================
-- DaiwaPlace v1.7.0 — PRUEBAS del sistema Supporter (opcional, se corre DESPUÉS de v1.7.0_circulo_lunar.sql)
-- Pégalo en Supabase → SQL Editor → Run.
-- IMPORTANTE: al final lanza un «error» A PROPÓSITO que contiene el resultado. Eso es lo normal: así TODO lo que
-- probó (membresías, Lunas, pagos de prueba) se DESHACE y no queda nada en tu base. Lee el texto del mensaje:
-- cada línea dice «OK» o «FALLÓ».
-- =====================================================================
do $$
declare
  v_u    uuid;
  v_out  text := '';
  v_n    integer;
  v_a    timestamptz;
  v_b    timestamptz;
  v_id   uuid;
  v_week date := public.supporter_week_start();
  r      record;
  v_sub  text := 'I-TEST000001';
  v_ok   boolean;
begin
  select id into v_u from public.profiles where not coalesce(is_frozen, false) order by created_at limit 1;
  if v_u is null then raise exception 'No hay perfiles para probar'; end if;
  -- se simula que esa persona tiene la sesión iniciada
  perform set_config('request.jwt.claim.sub', v_u::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_u, 'role', 'authenticated')::text, true);

  v_out := v_out || 'Base: límite de historias sin membresía = ' || public.story_limit_per_day() || E'\n';
  v_ok := public.supporter_tier_of(v_u) is null;
  v_out := v_out || case when v_ok then 'OK     ' else 'FALLÓ  ' end || 'sin membresía no tiene nivel' || E'\n';

  -- 1) los tres niveles: historias, descuento y bono
  for r in select * from (values ('creciente', 4, 5, 500), ('llena', 5, 10, 1000), ('eclipse', 7, 15, 2500)) t(tier, lim, pct, lunas) loop
    delete from public.supporter_weekly_grants where user_id = v_u;
    perform public.supporter_server_activate(v_u, r.tier, v_sub, 'P-TEST', 'ACTIVE', now() + interval '31 days', now());
    v_out := v_out || case when public.supporter_tier_of(v_u) = r.tier then 'OK     ' else 'FALLÓ  ' end || r.tier || ': nivel activo' || E'\n';
    v_out := v_out || case when public.story_limit_per_day() = r.lim then 'OK     ' else 'FALLÓ  ' end || r.tier || ': historias por día = ' || public.story_limit_per_day() || ' (esperado ' || r.lim || ')' || E'\n';
    v_out := v_out || case when public.supporter_discount_pct(v_u) = r.pct then 'OK     ' else 'FALLÓ  ' end || r.tier || ': descuento ' || public.supporter_discount_pct(v_u) || '%' || E'\n';
    v_out := v_out || case when public.cos_supporter_price(1000, 'tienda', v_u) = 1000 - r.pct * 10 then 'OK     ' else 'FALLÓ  ' end || r.tier || ': un cosmético de 1000 cuesta ' || public.cos_supporter_price(1000, 'tienda', v_u) || E'\n';
    select lunas into v_n from public.supporter_weekly_grants where user_id = v_u and week_start = v_week;
    v_out := v_out || case when v_n = r.lunas then 'OK     ' else 'FALLÓ  ' end || r.tier || ': bono inmediato de ' || coalesce(v_n::text, 'NADA') || ' Lunas' || E'\n';
  end loop;

  -- 2) descuentos que NO deben existir
  v_out := v_out || case when public.cos_supporter_price(1000, 'gratis', v_u) = 1000 and public.cos_supporter_price(0, 'tienda', v_u) = 0
                          and public.cos_supporter_price(1000, 'supporter', v_u) = 1000 then 'OK     ' else 'FALLÓ  ' end || 'sin descuento en gratis / precio 0 / exclusivos' || E'\n';

  -- 3) activar dos veces (navegador + webhook) no suma de más ni repite el bono
  select paid_until into v_a from public.supporters where user_id = v_u;
  perform public.supporter_server_activate(v_u, 'eclipse', v_sub, 'P-TEST', 'ACTIVE', now() + interval '31 days', now());
  perform public.supporter_server_activate(v_u, 'eclipse', v_sub, 'P-TEST', 'ACTIVE', now() + interval '31 days', now());
  select paid_until into v_b from public.supporters where user_id = v_u;
  v_out := v_out || case when v_b - v_a < interval '1 minute' then 'OK     ' else 'FALLÓ  ' end || 'activar varias veces no alarga la membresía' || E'\n';
  select count(*) into v_n from public.coin_ledger where idempotency_key = 'supporter:weekly:' || v_u::text || ':' || v_week::text;
  v_out := v_out || case when v_n = 1 then 'OK     ' else 'FALLÓ  ' end || 'el bono semanal solo se entregó 1 vez (movimientos: ' || v_n || ')' || E'\n';
  v_out := v_out || case when public.supporter_grant_weekly(v_u) = false then 'OK     ' else 'FALLÓ  ' end || 'pedir el bono otra vez esa semana no hace nada' || E'\n';

  -- 4) pagos duplicados
  perform public.supporter_server_payment(v_u, v_sub, 'TESTSALE0001', 5, 'USD', now(), 'eclipse');
  perform public.supporter_server_payment(v_u, v_sub, 'TESTSALE0001', 5, 'USD', now(), 'eclipse');
  select count(*) into v_n from public.supporter_payments where paypal_transaction_id = 'TESTSALE0001';
  v_out := v_out || case when v_n = 1 then 'OK     ' else 'FALLÓ  ' end || 'el mismo pago avisado dos veces se guarda 1 vez' || E'\n';

  -- 5) avisos de PayPal duplicados
  v_out := v_out || case when public.paypal_event_begin('WH-TEST-1', 'PAYMENT.SALE.COMPLETED', 'x') then 'OK     ' else 'FALLÓ  ' end || 'aviso nuevo: se procesa' || E'\n';
  perform public.paypal_event_done('WH-TEST-1', 'ok');
  v_out := v_out || case when not public.paypal_event_begin('WH-TEST-1', 'PAYMENT.SALE.COMPLETED', 'x') then 'OK     ' else 'FALLÓ  ' end || 'aviso repetido: se ignora' || E'\n';

  -- 6) cancelación y pago fallido conservan lo pagado; vencida lo corta
  perform public.supporter_server_status(v_sub, 'CANCELLED', 'cancelled');
  v_out := v_out || case when public.supporter_tier_of(v_u) = 'eclipse' then 'OK     ' else 'FALLÓ  ' end || 'cancelada: conserva el mes pagado' || E'\n';
  perform public.supporter_server_status(v_sub, 'ACTIVE', 'past_due');
  v_out := v_out || case when public.supporter_tier_of(v_u) = 'eclipse' then 'OK     ' else 'FALLÓ  ' end || 'pago fallido: conserva lo pagado' || E'\n';
  perform public.supporter_server_status(v_sub, 'EXPIRED', 'expired');
  v_out := v_out || case when public.supporter_tier_of(v_u) is null and public.story_limit_per_day() = 3 then 'OK     ' else 'FALLÓ  ' end || 'vencida: vuelve a 3 historias y sin descuentos' || E'\n';

  -- 7) renovación y reembolso
  perform public.supporter_server_activate(v_u, 'llena', v_sub, 'P-TEST', 'ACTIVE', now() + interval '31 days', now());
  v_out := v_out || case when public.supporter_tier_of(v_u) = 'llena' then 'OK     ' else 'FALLÓ  ' end || 'renovada: vuelve a estar activa' || E'\n';
  perform public.supporter_server_reverse('TESTSALE0001', 'refunded');
  v_out := v_out || case when public.supporter_tier_of(v_u) is null then 'OK     ' else 'FALLÓ  ' end || 'reembolso: se corta la membresía' || E'\n';

  -- 8) datos inválidos
  begin
    perform public.supporter_server_activate(v_u, 'oro', v_sub, 'P-TEST', 'ACTIVE', now(), now());
    v_out := v_out || 'FALLÓ  un nivel inventado fue aceptado' || E'\n';
  exception when others then
    v_out := v_out || 'OK     un nivel inventado se rechaza' || E'\n';
  end;

  -- 9) pago manual (PayPal.Me): enviar y aprobar
  v_id := public.supporter_manual_submit('creciente', 'TESTREF123456', 'prueba');
  begin
    perform public.supporter_manual_submit('creciente', 'TESTREF123456', 'repetido');
    v_out := v_out || 'FALLÓ  un ID de transacción repetido fue aceptado' || E'\n';
  exception when others then
    v_out := v_out || 'OK     un ID de transacción repetido se rechaza' || E'\n';
  end;
  perform set_config('request.jwt.claim.sub', '', true);                 -- ahora actúa «el sistema» (postgres) como admin
  perform set_config('request.jwt.claims', '', true);
  perform public.supporter_admin_review(v_id, true, 'prueba');
  perform set_config('request.jwt.claim.sub', v_u::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_u, 'role', 'authenticated')::text, true);
  v_out := v_out || case when public.supporter_tier_of(v_u) = 'creciente' then 'OK     ' else 'FALLÓ  ' end || 'solicitud manual aprobada: membresía activa' || E'\n';

  -- 10) seguridad: el navegador no puede leer ni escribir las tablas directo
  begin
    set local role authenticated;
    perform count(*) from public.supporters;
    reset role;
    v_out := v_out || 'FALLÓ  se pudo leer supporters directo' || E'\n';
  exception when others then
    reset role;
    v_out := v_out || 'OK     el navegador no puede leer supporters directo (RLS/permisos)' || E'\n';
  end;
  begin
    set local role authenticated;
    perform public.supporter_server_activate(v_u, 'eclipse', v_sub, 'P-TEST', 'ACTIVE', now() + interval '31 days', now());
    reset role;
    v_out := v_out || 'FALLÓ  el navegador pudo activar una membresía' || E'\n';
  exception when others then
    reset role;
    v_out := v_out || 'OK     el navegador NO puede activar membresías' || E'\n';
  end;

  raise exception E'RESULTADO DE LAS PRUEBAS (todo se deshizo, es lo normal):\n%', v_out;
end $$;
