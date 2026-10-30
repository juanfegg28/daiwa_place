-- =====================================================================
-- DaiwaPlace v1.5.10 «Día de Muertos» · PASO 1 de 2: CATÁLOGO de la colección «Ofrenda de Día de Muertos»
-- (generado con tools/gen_muertos_sql.mjs leyendo directamente el kit). Córrelo cuando quieras, antes del lanzamiento.
--   · 10 decoraciones de avatar · 5 tarjetas de perfil · 4 fondos · 4 efectos de entrada
--     · 7 títulos de tienda + 1 título exclusivo de colección completa + 1 insignia = 32 filas.
--   · Entran con is_active = false: nadie los ve ni los puede usar hasta correr v1.5.10_lanzar_dia_de_muertos.sql.
--   · Idempotente. Al volver a correrlo NO se pisan is_active, release_version ni price (los puede cambiar el equipo).
--   · Las cuentas con acceso total (el equipo) reciben automáticamente cada ítem nuevo (trigger de la 1.4.0).
-- =====================================================================

-- 1) Colección
insert into public.cosmetic_collections (id, name, theme, kind, release_version, is_active, has_pack, pack_card, pack_effect, completion_title, sort) values
('muertos','Ofrenda de Día de Muertos','día de muertos: cempasúchil, catrinas, pan de muerto, calaveritas y papel picado','coleccion','1.5.10',false,true,'altar-de-ofrenda','vuelo-de-monarcas','Guardián de la ofrenda',22)
on conflict (id) do update set name = excluded.name, theme = excluded.theme, kind = excluded.kind, has_pack = excluded.has_pack,
  pack_card = excluded.pack_card, pack_effect = excluded.pack_effect, completion_title = excluded.completion_title, sort = excluded.sort;
-- «Míticas» se queda al final de la lista
update public.cosmetic_collections set sort = 23 where id = 'miticas';

-- 2) Ítems (32)
insert into public.cosmetic_items (type, slug, name, rarity, price, collection, min_size, custom_hue, palettes, meta, origin, license, obtainable, release_version, is_active) values
('avatar_decoration','marco-de-cempasuchil','Marco de cempasúchil','comun',700,'muertos',52,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{"pad":20}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('avatar_decoration','papel-picado','Papel picado','raro',1400,'muertos',52,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{"pad":22}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('avatar_decoration','calaveritas-de-colores','Calaveritas de colores','raro',1600,'muertos',52,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{"pad":24}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('avatar_decoration','pan-de-muerto','Pan de muerto','raro',1500,'muertos',52,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{"pad":22}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('avatar_decoration','velas-de-ofrenda','Velas de ofrenda','raro',1600,'muertos',52,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{"pad":24}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('avatar_decoration','mariposas-monarca','Mariposas monarca','raro',1500,'muertos',56,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{"pad":30}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('avatar_decoration','corona-de-catrina','Corona de catrina','epico',3000,'muertos',56,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{"pad":40}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('avatar_decoration','camino-de-petalos','Camino de pétalos','epico',2800,'muertos',56,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{"pad":26}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('avatar_decoration','altar-de-calaveritas','Altar de calaveritas','epico',3200,'muertos',56,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{"pad":46}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('avatar_decoration','gran-catrina','Gran catrina','legendario',6200,'muertos',60,true,array['cempasuchil','magenta','morado','turquesa']::text[],'{"pad":46}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('profile_card','altar-de-ofrenda','Altar de ofrenda','epico',3000,'muertos',NULL,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('profile_card','papel-picado-tarjeta','Papel picado','raro',1500,'muertos',NULL,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('profile_card','mesa-de-pan-de-muerto','Mesa de pan de muerto','raro',1600,'muertos',NULL,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('profile_card','salon-de-la-catrina','Salón de la catrina','epico',2900,'muertos',NULL,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('profile_card','cielo-de-monarcas','Cielo de monarcas','legendario',6500,'muertos',NULL,true,array['cempasuchil','magenta','morado','turquesa']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('background','cielo-de-papel-picado','Cielo de papel picado','comun',700,'muertos',NULL,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('background','ofrenda-de-cempasuchil','Ofrenda de cempasúchil','raro',1400,'muertos',NULL,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('background','panteon-de-las-velas','Panteón de las velas','epico',2200,'muertos',NULL,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('background','camino-de-monarcas','Camino de monarcas','legendario',5200,'muertos',NULL,true,array['cempasuchil','magenta','morado','turquesa']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('entry_effect','lluvia-de-papel-picado','Lluvia de papel picado','comun',900,'muertos',NULL,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('entry_effect','petalos-de-cempasuchil','Pétalos de cempasúchil','raro',1700,'muertos',NULL,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('entry_effect','luces-de-velas','Luces de velas','raro',1800,'muertos',NULL,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('entry_effect','vuelo-de-monarcas','Vuelo de monarcas','epico',3200,'muertos',NULL,false,array['cempasuchil','magenta','morado','turquesa']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('title','flor-de-cempasuchil','Flor de cempasúchil','comun',200,'muertos',NULL,false,array['a','b','c','d']::text[],'{"glyph":"✿"}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('title','alma-de-papel-picado','Alma de papel picado','comun',200,'muertos',NULL,false,array['a','b','c','d']::text[],'{"glyph":"❖"}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('title','calaverita-de-azucar','Calaverita de azúcar','comun',200,'muertos',NULL,false,array['a','b','c','d']::text[],'{"glyph":"☠"}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('title','pan-de-muerto-caliente','Pan de muerto caliente','raro',400,'muertos',NULL,false,array['a','b','c','d']::text[],'{"glyph":"◉"}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('title','luz-de-la-ofrenda','Luz de la ofrenda','raro',400,'muertos',NULL,false,array['a','b','c','d']::text[],'{"glyph":"✧"}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('title','catrina-elegante','Catrina elegante','epico',600,'muertos',NULL,false,array['a','b','c','d']::text[],'{"glyph":"♛"}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('title','monarca-del-regreso','Monarca del regreso','epico',600,'muertos',NULL,false,array['a','b','c','d']::text[],'{"glyph":"❦"}'::jsonb,'codigo','Propia','tienda','1.5.10',false),
('title','guardian-de-la-ofrenda','Guardián de la ofrenda','epico',0,'muertos',NULL,false,array['a','b','c','d']::text[],'{"glyph":"✦","exclusive":true}'::jsonb,'codigo','Propia','logro','1.5.10',false),
('badge','muertos','Insignia Día de Muertos','epico',0,'muertos',NULL,false,'{}'::text[],'{}'::jsonb,'codigo','Propia','logro','1.5.10',false)
on conflict (type, slug) do update set name = excluded.name, rarity = excluded.rarity, collection = excluded.collection,
  min_size = excluded.min_size, custom_hue = excluded.custom_hue, palettes = excluded.palettes, meta = excluded.meta,
  origin = excluded.origin, license = excluded.license, obtainable = excluded.obtainable;

-- 3) Comprobación rápida (1.5.10 debe mostrar 0 activos por ahora)
select release_version, count(*) as items, count(*) filter (where is_active) as activos from public.cosmetic_items group by 1 order by 1;
