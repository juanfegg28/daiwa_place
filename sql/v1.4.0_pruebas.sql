-- =====================================================================
-- DaiwaPlace v1.4.0 · PRUEBAS (se pueden correr en Supabase → SQL Editor sin miedo)
-- Todo ocurre dentro de una transacción que se DESHACE al final (rollback): no deja ni un dato.
-- Usa tu propia base: renshsh como cuenta del equipo y la primera cuenta normal que encuentre.
--
-- Al final muestra una tabla PASS / FAIL. TODAS deben decir PASS.
-- Las primeras pruebas (A) demuestran que NADA de la versión 1.5.0 (Sangre Noir y Emo Abismo) aparece en
-- tienda, inventario, perfiles, packs ni misiones. Las demás (B) prueban compras, packs, premios y el acceso de renshsh.
-- =====================================================================
begin;

-- ---- ayudantes temporales (se van con el rollback) ----
create function public.zz_log(p_name text, p_ok boolean, p_detail text default '') returns void language plpgsql as $$
begin
  perform set_config('cos.log', coalesce(current_setting('cos.log', true), '') || (case when p_ok then 'PASS' else 'FAIL' end) || '|' || p_name || '|' || coalesce(p_detail, '') || E'\n', true);
end $$;
create function public.zz_err(p text) returns text language plpgsql as $$
begin execute p; return null; exception when others then return sqlerrm; end $$;
grant execute on function public.zz_log(text, boolean, text), public.zz_err(text) to public;

select set_config('cos.log', '', true);
select set_config('cos.staff',  (select id::text from public.profiles where lower(username) = 'renshsh'), true);
select set_config('cos.normal', (select p.id::text from public.profiles p
                                  where lower(p.username) not in ('renshsh', 'are_you_rena') and coalesce(p.is_frozen, false) = false
                                    and not exists (select 1 from public.cosmetic_staff_access s where s.user_id = p.id)
                                    and not exists (select 1 from public.user_cosmetics uc where uc.user_id = p.id)
                                  order by p.created_at desc limit 1), true);
select set_config('cos.next_title', (select slug from public.cosmetic_items where release_version = '1.5.0' and type = 'title' and obtainable = 'tienda' limit 1), true);
select set_config('cos.next_deco',  (select slug from public.cosmetic_items where release_version = '1.5.0' and type = 'avatar_decoration' limit 1), true);
select set_config('cos.next_deco_id', (select id::text from public.cosmetic_items where release_version = '1.5.0' and type = 'avatar_decoration' limit 1), true);
select set_config('cos.next_font_free', 'x', true);

-- el equipo y una cuenta normal deben existir para que las pruebas valgan
select public.zz_log('Hay cuenta del equipo (renshsh) y cuenta normal de prueba',
                     current_setting('cos.staff', true) is not null and current_setting('cos.normal', true) is not null);

-- ===================================================================
-- A) NADA DE LA 1.5.0 ES VISIBLE NI USABLE
-- ===================================================================
-- A1. Como CUENTA NORMAL
select set_config('request.jwt.claim.sub', current_setting('cos.normal'), true);
set local role authenticated;
do $$
declare n integer; e text;
begin
  select count(*) into n from public.shop_catalog() where release_version = '1.5.0';
  perform public.zz_log('A1 tienda (shop_catalog): 0 ítems de 1.5.0', n = 0, n::text);
  select count(*) into n from public.shop_catalog();
  perform public.zz_log('A1b tienda sí muestra lo de 1.4.0', n > 150, n::text);
  select count(*) into n from public.shop_catalog() where collection in ('crimson', 'emo');
  perform public.zz_log('A2 tienda: 0 ítems de las colecciones crimson/emo', n = 0, n::text);
  select count(*) into n from public.shop_collections() where id in ('crimson', 'emo');
  perform public.zz_log('A3 tienda: crimson y emo no salen como colección ni como pack', n = 0, n::text);
  select count(*) into n from public.my_inventory() where collection in ('crimson', 'emo');
  perform public.zz_log('A4 inventario: 0 ítems de 1.5.0', n = 0, n::text);
  select count(*) into n from public.staff_preview_items();
  perform public.zz_log('A5 «lo que viene» (staff_preview_items): 0 filas para una cuenta normal', n = 0, n::text);
  select count(*) into n from public.cosmetic_items where release_version = '1.5.0';
  perform public.zz_log('A6 lectura directa de cosmetic_items: 0 filas de 1.5.0 (RLS)', n = 0, n::text);
  select count(*) into n from public.cosmetic_collections where release_version = '1.5.0';
  perform public.zz_log('A7 lectura directa de colecciones: 0 filas de 1.5.0 (RLS)', n = 0, n::text);
  select count(*) into n from public.user_cosmetics uc join public.cosmetic_items i on i.id = uc.item_id where i.release_version = '1.5.0';
  perform public.zz_log('A8 lectura directa de user_cosmetics: 0 filas de 1.5.0', n = 0, n::text);
  perform public.zz_log('A9 pack de crimson: no existe', public.shop_pack_quote('crimson') is null and public.shop_pack_quote('emo') is null);
  e := public.zz_err(format('select public.shop_buy(%L::uuid, 1000, gen_random_uuid())', current_setting('cos.next_deco_id')));
  perform public.zz_log('A10 comprar un ítem de 1.5.0 se rechaza', e is not null and e like '%no está disponible%', coalesce(e, 'SE DEJÓ COMPRAR'));
  e := public.zz_err('select public.shop_buy_pack(''crimson'', 1000, gen_random_uuid())');
  perform public.zz_log('A11 comprar el pack de crimson se rechaza', e is not null, coalesce(e, 'SE DEJÓ COMPRAR'));
  e := public.zz_err(format('select public.cosmetic_save_look(jsonb_build_object(''avatar_deco'', jsonb_build_object(''id'', %L)))', current_setting('cos.next_deco')));
  perform public.zz_log('A12 equipar un ítem de 1.5.0 se rechaza', e is not null, coalesce(e, 'SE DEJÓ EQUIPAR'));
  e := public.zz_err(format('select public.welcome_pack_claim(array[%L::uuid])', current_setting('cos.next_deco_id')));
  perform public.zz_log('A13 el Pack Bienvenida no admite ítems de 1.5.0', e is not null, coalesce(e, 'SE DEJÓ'));
  e := public.zz_err(format('update public.profiles set avatar_deco = jsonb_build_object(''id'', %L) where id = auth.uid()', current_setting('cos.next_deco')));
  perform public.zz_log('A14 escribir a mano profiles.avatar_deco está prohibido', e is not null, coalesce(e, 'SE DEJÓ ESCRIBIR'));
end $$;
reset role;

-- A15. Aunque alguien con acceso total a la base lo intente: el guardián de profiles lo rechaza
do $$
declare e text;
begin
  e := public.zz_err(format('update public.profiles set avatar_deco = jsonb_build_object(''id'', %L, ''palette'', ''x'') where id = %L::uuid',
                            current_setting('cos.next_deco'), current_setting('cos.normal')));
  perform public.zz_log('A15 guardián: ni con permisos totales cabe un cosmético de 1.5.0 en un perfil', e is not null and e like '%todavía no está disponible%', coalesce(e, 'ENTRÓ'));
  e := public.zz_err(format('update public.profiles set title_style = jsonb_build_object(''id'', %L) where id = %L::uuid',
                            current_setting('cos.next_title'), current_setting('cos.normal')));
  perform public.zz_log('A16 guardián: tampoco un título de 1.5.0', e is not null, coalesce(e, 'ENTRÓ'));
  perform public.zz_log('A17 ningún perfil real lleva algo de 1.5.0',
    not exists (select 1 from public.profiles p join public.cosmetic_items i on i.release_version = '1.5.0' and i.is_active = false
                 where (i.type = 'avatar_decoration' and p.avatar_deco ->> 'id' = i.slug)
                    or (i.type = 'profile_card' and p.card_style ->> 'id' = i.slug)
                    or (i.type = 'entry_effect' and p.entry_effect ->> 'id' = i.slug)
                    or (i.type = 'background' and p.profile_bg ->> 'id' = i.slug)
                    or (i.type = 'title' and p.title_style ->> 'id' = i.slug)
                    or (i.type = 'name_effect' and p.name_style #>> '{effect,id}' = i.slug)));
end $$;

-- A2x. Como renshsh (cuenta del equipo con acceso total): ve lo que viene SOLO en su estudio
select set_config('request.jwt.claim.sub', current_setting('cos.staff'), true);
set local role authenticated;
do $$
declare n integer; e text;
begin
  select count(*) into n from public.shop_catalog() where release_version = '1.5.0';
  perform public.zz_log('A20 renshsh: la TIENDA tampoco muestra 1.5.0', n = 0, n::text);
  select count(*) into n from public.shop_collections() where id in ('crimson', 'emo');
  perform public.zz_log('A21 renshsh: los packs de 1.5.0 no existen en la tienda', n = 0, n::text);
end $$;
do $$
declare n integer; e text;
begin
  select count(*) into n from public.my_inventory() where collection in ('crimson', 'emo');
  perform public.zz_log('A22 renshsh: el INVENTARIO normal no muestra 1.5.0', n = 0, n::text);
  select count(*) into n from public.staff_preview_items() where release_version = '1.5.0';
  perform public.zz_log('A23 renshsh: «lo que viene» muestra los 30 de 1.5.0 (solo para probar)', n = 30, n::text);
  select count(*) into n from public.staff_preview_items() where release_version <> '1.5.0';
  perform public.zz_log('A24 renshsh: «lo que viene» NO mezcla nada de 1.4.0', n = 0, n::text);
  select count(*) into n from public.staff_preview_items() where owned;
  perform public.zz_log('A25 renshsh: todo lo que viene ya es suyo (gratis)', n = 30, n::text);
  e := public.zz_err(format('select public.cosmetic_save_look(jsonb_build_object(''avatar_deco'', jsonb_build_object(''id'', %L)))', current_setting('cos.next_deco')));
  perform public.zz_log('A26 renshsh NO puede equipar 1.5.0 en su perfil real antes del lanzamiento', e is not null, coalesce(e, 'SE DEJÓ EQUIPAR'));
  select count(*) into n from public.profile_badges(auth.uid()) where slug in ('crimson', 'emo');
  perform public.zz_log('A27 renshsh: las insignias públicas no incluyen 1.5.0', n = 0, n::text);
end $$;
reset role;
do $$
declare n integer;
begin
  perform public.zz_log('A28 renshsh tiene TODO el catálogo (250) en su inventario',
    (select count(*) from public.user_cosmetics where user_id = current_setting('cos.staff')::uuid) = (select count(*) from public.cosmetic_items),
    (select count(*) from public.user_cosmetics where user_id = current_setting('cos.staff')::uuid)::text);
  update public.app_settings set value = to_jsonb('off'::text) where key = 'cosmetics_staff_preview';
  insert into public.app_settings (key, value) select 'cosmetics_staff_preview', to_jsonb('off'::text) where not exists (select 1 from public.app_settings where key = 'cosmetics_staff_preview');
end $$;
select set_config('request.jwt.claim.sub', current_setting('cos.staff'), true);
set local role authenticated;
do $$
begin
  perform public.zz_log('A29 con el interruptor «cosmetics_staff_preview» en off, ni renshsh ve lo que viene',
    (select count(*) from public.staff_preview_items()) = 0);
end $$;
reset role;
update public.app_settings set value = to_jsonb('on'::text) where key = 'cosmetics_staff_preview';

-- A3x. Las misiones no cuentan ni muestran 1.5.0
do $$
declare v integer; u uuid := current_setting('cos.staff')::uuid;
begin
  v := public.mission_state_progress(u, 'cosmetics_total');
  perform public.zz_log('A30 misiones: renshsh tiene 250 regalados y el logro «5 cosméticos» cuenta 0 (los regalos del equipo no cobran logros)', v = 0, v::text);
  v := public.mission_state_progress(u, 'collections_done');
  perform public.zz_log('A31 misiones: «primera colección» cuenta 0 con regalos', v = 0, v::text);
  perform public.zz_log('A32 los logros A-08 y A-09 quedaron encendidos', (select count(*) from public.mission_templates where id in ('A-08', 'A-09') and active) = 2);
end $$;

-- ===================================================================
-- B) COMPRAS, PACKS, PREMIOS Y EQUIPAR (cuenta normal)
-- ===================================================================
do $$
declare u uuid := current_setting('cos.normal')::uuid;
begin
  perform public.coins_apply(u, 30000, 'admin_adjust', 'test', null, 'zz:topup:' || u::text, u);
end $$;
select set_config('request.jwt.claim.sub', current_setting('cos.normal'), true);
set local role authenticated;
do $$
declare
  v_deco uuid; v_price integer; v_bal0 integer; v_bal1 integer; e text; k uuid := gen_random_uuid(); r jsonb; n integer; q jsonb; v_pack integer;
begin
  select id, price into v_deco, v_price from public.shop_catalog() where type = 'avatar_decoration' and slug = 'halo-roto';
  v_bal0 := public.coins_balance();
  e := public.zz_err(format('select public.shop_buy(%L::uuid, %s, gen_random_uuid())', v_deco, v_price + 1));
  perform public.zz_log('B1 precio distinto al vigente: rechazado', e is not null and e like '%precio cambió%', coalesce(e, 'SE COBRÓ'));
  perform public.zz_log('B1b y no se cobró nada', public.coins_balance() = v_bal0);
  r := public.shop_buy(v_deco, v_price, k);
  perform public.zz_log('B2 compra correcta descuenta el precio', public.coins_balance() = v_bal0 - v_price, public.coins_balance()::text);
  r := public.shop_buy(v_deco, v_price, k);
  perform public.zz_log('B3 mismo toque dos veces (misma clave): no cobra dos veces', public.coins_balance() = v_bal0 - v_price and (r ->> 'replayed') = 'true');
  e := public.zz_err(format('select public.shop_buy(%L::uuid, %s, gen_random_uuid())', v_deco, v_price));
  perform public.zz_log('B4 comprar lo que ya tienes: rechazado', e like '%Ya tienes%', coalesce(e, 'SE COBRÓ'));
  select count(*) into n from public.my_inventory() where slug = 'halo-roto';
  perform public.zz_log('B5 aparece en mi inventario', n = 1);
  -- equipar
  e := public.zz_err('select public.cosmetic_save_look(jsonb_build_object(''avatar_deco'', jsonb_build_object(''id'', ''alas-de-cuervo'')))');
  perform public.zz_log('B6 equipar algo que NO tengo: rechazado', e like '%Todavía no tienes%', coalesce(e, 'SE DEJÓ'));
  e := public.zz_err('select public.cosmetic_save_look(jsonb_build_object(''avatar_deco'', jsonb_build_object(''id'', ''halo-roto'', ''palette'', ''inventada'')))');
  perform public.zz_log('B7 paleta que no es del ítem: rechazada', e like '%paleta%', coalesce(e, 'SE DEJÓ'));
  e := public.zz_err('select public.cosmetic_save_look(jsonb_build_object(''avatar_deco'', jsonb_build_object(''id'', ''halo-roto'', ''palette'', ''plata'', ''hue'', 90)))');
  perform public.zz_log('B8 color libre en un ítem que no lo admite: rechazado', e like '%color libre%', coalesce(e, 'SE DEJÓ'));
  r := public.cosmetic_save_look(jsonb_build_object('avatar_deco', jsonb_build_object('id', 'halo-roto', 'palette', 'plata')));
  perform public.zz_log('B9 equipar lo mío con paleta válida funciona', r -> 'avatar_deco' ->> 'palette' = 'plata', r::text);
  perform public.zz_log('B10 queda guardado en el perfil', (select avatar_deco ->> 'id' from public.profiles where id = auth.uid()) = 'halo-roto');
  e := public.zz_err('update public.profiles set avatar_deco = ''{"id":"halo-roto"}''::jsonb where id = auth.uid()');
  perform public.zz_log('B11 el navegador no puede escribir profiles.avatar_deco directo', e is not null, coalesce(e, 'SE DEJÓ'));
  e := public.zz_err('update public.profiles set avatar_deco = ''{"id":"alas-de-cuervo","palette":"carmesi"}''::jsonb where id = auth.uid()');
  perform public.zz_log('B11b tampoco puede saltarse la compra poniéndose a mano un cosmético que NO tiene', e is not null, coalesce(e, 'SE DEJÓ'));
  e := public.zz_err('update public.profiles set card_style = null, name_style = null, title_style = null, entry_effect = null, profile_bg = null, avatar_deco = null where id = auth.uid()');
  perform public.zz_log('B11c ni siquiera para quitarse cosas a mano (solo desde Personalizar)', e is not null, coalesce(e, 'SE DEJÓ'));
  perform public.zz_log('B11d los demás campos del perfil siguen editables (bio)', public.zz_err('update public.profiles set bio = ''hola'' where id = auth.uid()') is null);
  -- fuente gratis y de pago
  r := public.cosmetic_save_look('{"name_font":"cinzel"}'::jsonb);
  perform public.zz_log('B12 fuente gratis (Cinzel) se puede equipar sin comprar', r -> 'name_style' ->> 'font' = 'cinzel', r::text);
  e := public.zz_err('select public.cosmetic_save_look(''{"name_font":"pirata-one"}''::jsonb)');
  perform public.zz_log('B13 fuente de pago sin comprar: rechazada', e like '%Todavía no tienes%', coalesce(e, 'SE DEJÓ'));
  r := public.cosmetic_save_look('{"avatar_deco":null,"name_font":"clasica"}'::jsonb);
  perform public.zz_log('B14 quitar (null) y «Clásica» dejan el perfil limpio', r -> 'avatar_deco' is null or jsonb_typeof(r -> 'avatar_deco') = 'null');
  -- pack
  q := public.shop_pack_quote('sakura');
  perform public.zz_log('B15 el pack tiene 20 % de descuento', (q ->> 'price')::int = floor((q ->> 'full_price')::int * 0.8), q::text);
  e := public.zz_err(format('select public.shop_buy_pack(''sakura'', %s, gen_random_uuid())', (q ->> 'price')::int + 5));
  perform public.zz_log('B16 pack con precio equivocado: rechazado', e like '%precio cambió%', coalesce(e, 'SE COBRÓ'));
  v_bal0 := public.coins_balance();
  v_pack := (q ->> 'price')::int;
  r := public.shop_buy_pack('sakura', v_pack, gen_random_uuid());
  v_bal1 := public.coins_balance();
  -- el premio de completar la colección (+400) se suma al saldo
  perform public.zz_log('B17 comprar el pack cobra el precio con descuento y paga el premio de colección (+400 ☾)', v_bal1 = v_bal0 - v_pack + 400, format('antes %s, después %s, pack %s', v_bal0, v_bal1, v_pack));
  select count(*) into n from public.my_inventory() where collection = 'sakura' and type = 'avatar_decoration';
  perform public.zz_log('B18 el pack entregó todas las decoraciones de Sakura Dreams (6)', n = 6, n::text);
  select count(*) into n from public.profile_badges(auth.uid()) where slug = 'sakura';
  perform public.zz_log('B19 completar la colección dio la insignia', n = 1);
  select count(*) into n from public.my_inventory() where type = 'title' and collection = 'sakura';
  perform public.zz_log('B20 completar la colección dio el título exclusivo', n = 1);
  e := public.zz_err('select public.shop_buy_pack(''sakura'', 0, gen_random_uuid())');
  perform public.zz_log('B21 pack que ya tienes completo: rechazado', e like '%todo lo de este pack%' or e like '%no está disponible%', coalesce(e, 'SE COBRÓ'));
  -- pack bienvenida
  e := public.zz_err('select public.welcome_pack_claim(array[]::uuid[])');
  perform public.zz_log('B24 Pack Bienvenida vacío: rechazado', e is not null, coalesce(e, ''));
  select count(*) into n from public.shop_catalog() where type = 'font' and rarity = 'comun' and obtainable = 'tienda';
  perform public.zz_log('B25 hay fuentes comunes para elegir en el Pack Bienvenida', n >= 3, n::text);
end $$;
do $$
declare ids uuid[]; r jsonb; e text;
begin
  ids := array(select id from public.shop_catalog() where type = 'font' and rarity = 'comun' and obtainable = 'tienda' and not owned order by price limit 4);
  e := public.zz_err(format('select public.welcome_pack_claim(%L::uuid[])', ids::text));
  perform public.zz_log('B26 más de 3 fuentes en el Pack Bienvenida: rechazado', e like '%hasta 3 fuentes%', coalesce(e, 'SE DEJÓ'));
  ids := ids[1:3];
  r := public.welcome_pack_claim(ids);
  perform public.zz_log('B27 Pack Bienvenida (3 fuentes comunes) se entrega', (r ->> 'ok') = 'true');
  e := public.zz_err(format('select public.welcome_pack_claim(%L::uuid[])', ids::text));
  perform public.zz_log('B28 solo una vez', e like '%Ya reclamaste%', coalesce(e, 'SE DEJÓ'));
end $$;
reset role;

do $$
declare u uuid := current_setting('cos.normal')::uuid;
begin
  perform public.zz_log('B22 el logro «primera colección» cuenta 1', public.mission_state_progress(u, 'collections_done') = 1);
  perform public.zz_log('B23 y «5 cosméticos» cuenta ≥ 5', public.mission_state_progress(u, 'cosmetics_total') >= 5, public.mission_state_progress(u, 'cosmetics_total')::text);
end $$;

-- C) Cuenta «nueva» (después de la fecha de corte) no puede reclamar el Pack Fundador; las Lunas cuadran
select set_config('request.jwt.claim.sub', '', true);   -- sesión del SQL Editor (sin cuenta): permite correr la auditoría
do $$
declare n integer;
begin
  select count(*) into n from public.economy_audit();
  perform public.zz_log('C1 economy_audit(): el saldo de todas las cuentas = la suma de su libro', n = 0, n::text);
end $$;

-- D) Simulación del lanzamiento: se activa la 1.5.0 SOLO dentro de esta transacción (se deshace al final)
update public.cosmetic_collections set is_active = true where release_version = '1.5.0';
update public.cosmetic_items       set is_active = true where release_version = '1.5.0';
select set_config('request.jwt.claim.sub', current_setting('cos.normal'), true);
set local role authenticated;
do $$
declare n integer;
begin
  select count(*) into n from public.shop_catalog() where release_version = '1.5.0';
  perform public.zz_log('D1 al activar la 1.5.0 la tienda sí muestra sus 30 ítems', n = 30, n::text);
  select count(*) into n from public.shop_collections() where id in ('crimson', 'emo');
  perform public.zz_log('D2 y aparecen las colecciones Sangre Noir y Emo Abismo', n = 2, n::text);
  perform public.zz_log('D3 y el pack de crimson existe', public.shop_pack_quote('crimson') is not null);
end $$;
reset role;

-- ---- resultado ----
-- El SQL Editor de Supabase solo muestra la ÚLTIMA consulta: por eso aquí sale primero el resumen y luego
-- SOLO las pruebas que fallaron (si no hay ninguna, solo verás la fila RESUMEN con 0 fallos).
select resultado, prueba, detalle from (
  select 0 as orden, 'RESUMEN' as resultado,
         (select count(*) from regexp_split_to_table(current_setting('cos.log'), E'\n') l where l like 'FAIL%')::text || ' fallos / ' ||
         (select count(*) from regexp_split_to_table(current_setting('cos.log'), E'\n') l where l like 'PASS%')::text || ' aciertos' as prueba,
         '' as detalle
  union all
  select 1, split_part(l, '|', 1), split_part(l, '|', 2), split_part(l, '|', 3)
    from regexp_split_to_table(current_setting('cos.log'), E'\n') as l
   where l like 'FAIL%'
) r order by orden, prueba;

rollback;
