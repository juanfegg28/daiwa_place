-- =====================================================================
-- DaiwaPlace v1.4.5 · Acceso total GRATIS a todos los cosméticos (actuales y futuros)
-- para @miyuakima, @pingsheng y @illuci — igual que @renshsh.
-- Requiere haber corrido v1.4.0_tienda.sql. Es idempotente: se puede correr varias veces.
-- =====================================================================
do $$
declare
  v_name text;
  v_id   uuid;
  v_n    integer;
begin
  foreach v_name in array array['miyuakima', 'pingsheng', 'illuci'] loop
    select p.id into v_id from public.profiles p where lower(p.username) = v_name;
    if v_id is null then
      raise notice 'No existe todavía el usuario @% (corre este archivo de nuevo cuando exista)', v_name;
      continue;
    end if;
    -- Al insertar la fila, el trigger le entrega TODO el catálogo actual; y los ítems que se agreguen después le llegan solos.
    insert into public.cosmetic_staff_access (user_id, note)
    values (v_id, 'Acceso total al catálogo (v1.4.5): cuenta del equipo')
    on conflict (user_id) do nothing;
    -- Por si el acceso ya existía y faltaron ítems:
    v_n := public.cos_staff_grant_all(v_id);
    raise notice '@%: acceso total activo (% ítems nuevos entregados)', v_name, v_n;
  end loop;
end $$;

-- Comprobación: debe listar a renshsh + los 3 usuarios nuevos, con todo el catálogo.
select p.username,
       (select count(*) from public.user_cosmetics uc where uc.user_id = p.id) as cosmeticos,
       (select count(*) from public.cosmetic_items) as catalogo_total
  from public.cosmetic_staff_access sa
  join public.profiles p on p.id = sa.user_id
 order by p.username;
