-- =====================================================================
-- DaiwaPlace v1.5.0 «Tienda Halloween» · PASO 3 de 3: LANZAR
-- Córrelo al final (después de v1.5.0_tienda_descuentos.sql y v1.5.0_catalogo_halloween.sql) y con el código de la 1.5.0 ya subido.
--   · Enciende Sangre Noir, Emo Abismo y las 7 colecciones de Halloween (todo lo marcado 1.5.0): tienda, inventario, packs, perfiles.
--   · Crea la «Selección de Halloween» del banner principal de la tienda (se puede editar o quitar en el Centro de Mando → Tienda y Lunas → Selecciones).
-- Idempotente (se puede correr dos veces). Los diseños ya viajan en la app: esto solo los enciende.
-- Para volver a esconderlo (por si algo sale mal, ANTES de que la gente lo equipe), al final del archivo hay un bloque de marcha atrás.
-- =====================================================================
begin;

update public.cosmetic_collections set is_active = true where release_version = '1.5.0';
update public.cosmetic_items       set is_active = true where release_version = '1.5.0';

insert into public.shop_features (slug, title, subtitle, cta, theme, collections, sort, is_active)
values (
  'halloween-2026',
  'Selección de Halloween',
  'Sangre Noir, Emo Abismo y 7 colecciones nuevas: criptas, cuervos, calabazas, vampiros y más.',
  'Ver la selección',
  'halloween',
  array['crimson','emo','cripta','cruces','calabaza','cuervo','barroco','creepy','vampiro']::text[],
  0, true
)
on conflict (slug) do update set title = excluded.title, subtitle = excluded.subtitle, cta = excluded.cta, theme = excluded.theme,
  collections = excluded.collections;

commit;

-- Comprobación: 1.5.0 debe mostrar todos sus ítems activos
select release_version, count(*) as items, count(*) filter (where is_active) as activos
  from public.cosmetic_items group by 1 order by 1;
select c.id, c.name, c.is_active from public.cosmetic_collections c where c.release_version = '1.5.0' order by c.sort;

-- ---------------------------------------------------------------------
-- MARCHA ATRÁS (solo si hace falta; si alguien ya equipó algo de 1.5.0, primero habría que quitárselo de su perfil):
--   update public.cosmetic_collections set is_active = false where release_version = '1.5.0';
--   update public.cosmetic_items       set is_active = false where release_version = '1.5.0';
--   update public.shop_features        set is_active = false where slug = 'halloween-2026';
-- ---------------------------------------------------------------------
