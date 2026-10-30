-- =====================================================================
-- DaiwaPlace v1.5.10 «Día de Muertos» · PASO 2 de 2: LANZAR
-- Córrelo al final (después de v1.5.10_catalogo_dia_de_muertos.sql) y con el código de la 1.5.10 ya subido.
--   · Enciende la colección «Ofrenda de Día de Muertos» (todo lo marcado 1.5.10): tienda, inventario, pack, perfiles.
--   · Crea la «Selección de Día de Muertos» del banner principal de la tienda (se puede editar o quitar en el Centro de Mando → Tienda y Lunas → Selecciones).
-- Idempotente (se puede correr dos veces). Los diseños ya viajan en la app: esto solo los enciende.
-- Para volver a esconderlo (por si algo sale mal, ANTES de que la gente lo equipe), al final del archivo hay un bloque de marcha atrás.
-- =====================================================================
begin;

update public.cosmetic_collections set is_active = true where release_version = '1.5.10';
update public.cosmetic_items       set is_active = true where release_version = '1.5.10';

insert into public.shop_features (slug, title, subtitle, cta, theme, collections, sort, is_active)
values (
  'dia-de-muertos-2026',
  'Selección de Día de Muertos',
  'Catrinas, cempasúchil, pan de muerto, calaveritas de colores y papel picado: la ofrenda llega a tu perfil.',
  'Ver la selección',
  'muertos',
  array['muertos']::text[],
  0, true
)
on conflict (slug) do update set title = excluded.title, subtitle = excluded.subtitle, cta = excluded.cta, theme = excluded.theme,
  collections = excluded.collections;

commit;

-- Comprobación: 1.5.10 debe mostrar todos sus ítems activos
select release_version, count(*) as items, count(*) filter (where is_active) as activos
  from public.cosmetic_items group by 1 order by 1;
select c.id, c.name, c.is_active from public.cosmetic_collections c where c.release_version = '1.5.10' order by c.sort;

-- ---------------------------------------------------------------------
-- MARCHA ATRÁS (solo si hace falta; si alguien ya equipó algo de 1.5.10, primero habría que quitárselo de su perfil):
--   update public.cosmetic_collections set is_active = false where release_version = '1.5.10';
--   update public.cosmetic_items       set is_active = false where release_version = '1.5.10';
--   update public.shop_features        set is_active = false where slug = 'dia-de-muertos-2026';
-- ---------------------------------------------------------------------
