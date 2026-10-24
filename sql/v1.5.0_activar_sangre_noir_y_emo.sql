-- =====================================================================
-- DaiwaPlace v1.5.0 · ACTIVAR «Sangre Noir» y «Emo Abismo»  (NO correr hasta el lanzamiento de la 1.5.0)
-- No hace falta redesplegar diseños: los diseños ya viajan en la app. Esto solo los enciende.
-- Activa: colecciones crimson y emo + 30 ítems (decoraciones, tarjetas, entradas, efectos de nombre, fondos,
-- títulos, insignias y títulos exclusivos). Los packs de ambas colecciones se encienden con la colección.
-- Idempotente. Antes de correrlo, sube el código de la 1.5.0 (versión y novedades).
-- =====================================================================
begin;
update public.cosmetic_collections set is_active = true where release_version = '1.5.0';
update public.cosmetic_items       set is_active = true where release_version = '1.5.0';
commit;

-- Comprobación:
select release_version, count(*) as items, count(*) filter (where is_active) as activos
  from public.cosmetic_items group by 1 order by 1;

-- Para volver a esconderla (por si algo sale mal, ANTES de que la gente la equipe):
--   update public.cosmetic_collections set is_active = false where release_version = '1.5.0';
--   update public.cosmetic_items       set is_active = false where release_version = '1.5.0';
-- (si alguien ya equipó algo de 1.5.0, primero habría que quitárselo de su perfil)
