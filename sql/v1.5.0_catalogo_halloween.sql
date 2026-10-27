-- =====================================================================
-- DaiwaPlace v1.5.0 «Tienda Halloween» · PASO 2 de 3: CATÁLOGO de las 7 colecciones de Halloween
-- (generado desde daiwa-cosmetics/catalog/*.json con tools/gen_halloween_sql.py). Córrelo DESPUÉS de v1.5.0_tienda_descuentos.sql.
--   · Cripta de Hueso, Cruz de Plata, Noche de Calabazas, Cuervo de Hierro, Barroco Monocromo, Creepypastas y Vampiro Azul:
--     61 cosméticos + 7 insignias + 7 títulos exclusivos de colección completa.
--   · Entran con is_active = false: nadie los ve ni los puede usar hasta correr v1.5.0_lanzar_halloween.sql.
--   · Idempotente. Al volver a correrlo NO se pisan is_active, release_version ni price (los puede cambiar el equipo).
--   · Las cuentas con acceso total (renshsh y el equipo) reciben automáticamente cada ítem nuevo (trigger de la 1.4.0).
-- =====================================================================

-- 1) Colecciones
insert into public.cosmetic_collections (id, name, theme, kind, release_version, is_active, has_pack, pack_card, pack_effect, completion_title, sort) values
('cripta','Cripta de Hueso','halloween: murciélagos y cadenas','coleccion','1.5.0',false,true,'cripta-de-hueso','bandada-de-la-cripta','Señor de la cripta',15),
('cruces','Cruz de Plata','halloween: cruces góticas','coleccion','1.5.0',false,true,'altar-de-plata','lluvia-de-cruces','Portador de la cruz de plata',16),
('calabaza','Noche de Calabazas','halloween clásico','coleccion','1.5.0',false,true,'noche-de-calabazas','calabazas-flotantes','Rey de la cosecha',17),
('cuervo','Cuervo de Hierro','hierro forjado y cuervos','coleccion','1.5.0',false,true,'reja-de-hierro','parvada-de-cuervos','Voz de la parvada',18),
('barroco','Barroco Monocromo','barroco gris','coleccion','1.5.0',false,true,'salon-barroco','petalos-y-perlas','Duquesa del monocromo',19),
('creepy','Creepypastas','creepypasta: sets de ambiente','coleccion','1.5.0',false,true,'bosque-sin-rostro','niebla-del-bosque','Habitante del bosque',20),
('vampiro','Vampiro Azul','vampiro azul','coleccion','1.5.0',false,true,'fan-club-vampirico','bruma-y-estrellas-azules','Conde de la bruma azul',21)
on conflict (id) do update set name = excluded.name, theme = excluded.theme, kind = excluded.kind, has_pack = excluded.has_pack,
  pack_card = excluded.pack_card, pack_effect = excluded.pack_effect, completion_title = excluded.completion_title, sort = excluded.sort;
-- «Míticas» se queda al final de la lista
update public.cosmetic_collections set sort = 22 where id = 'miticas';

-- 2) Ítems (75)
insert into public.cosmetic_items (type, slug, name, rarity, price, collection, min_size, custom_hue, palettes, meta, origin, license, obtainable, release_version, is_active) values
('avatar_decoration','murcielago-y-cadenas','Murciélago y cadenas','raro',1500,'cripta',52,false,array['hueso','violeta','azul','ambar']::text[],'{"pad":16}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','calavera-guardiana','Calavera guardiana','epico',2800,'cripta',56,false,array['hueso','violeta','azul','ambar']::text[],'{"pad":24}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','doble-anillo','Doble anillo','raro',1400,'cruces',52,false,array['plata','sangre','oro','violeta']::text[],'{"pad":20}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','cruces-de-plata','Cruces de plata','epico',3000,'cruces',56,false,array['plata','sangre','oro','violeta']::text[],'{"pad":26}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','marco-de-calabazas','Marco de calabazas','comun',800,'calabaza',52,false,array['naranja','violeta','toxico','sangre']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','verja-y-telarana','Verja y telaraña','raro',1600,'calabaza',56,false,array['naranja','violeta','toxico','sangre']::text[],'{"pad":12}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','cuervo-y-hierro-forjado','Cuervo y hierro forjado','epico',3000,'cuervo',56,false,array['plata','sangre','violeta','oro']::text[],'{"pad":24}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','corona-de-hierro','Corona de hierro','legendario',6500,'cuervo',60,true,array['plata','sangre','violeta','oro']::text[],'{"pad":30}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','marco-barroco-gris','Marco barroco gris','raro',1800,'barroco',56,false,array['grafito','sepia','rosa','acero']::text[],'{"pad":22}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','rosas-y-espadas','Rosas y espadas','epico',3200,'barroco',60,false,array['grafito','sepia','rosa','acero']::text[],'{"pad":26}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','bosque-en-la-niebla','Bosque en la niebla','raro',1500,'creepy',56,false,array['niebla','sangre','verde','azul']::text[],'{"pad":40}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','estatica-y-arboles','Estática y árboles','epico',3000,'creepy',60,false,array['niebla','sangre','verde','azul']::text[],'{"pad":44}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','borde-de-tinta','Borde de tinta','raro',1600,'creepy',56,false,array['tinta','blanco','azul','verde']::text[],'{"pad":14}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','cuchillo-y-luna','Cuchillo y luna','epico',3000,'creepy',60,false,array['tinta','blanco','azul','verde']::text[],'{"pad":30}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','foto-corrupta','Foto corrupta','raro',1500,'creepy',56,false,array['rojo','cian','crt','violeta']::text[],'{"pad":22}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','sonrisa-sin-cara','Sonrisa sin cara','epico',3000,'creepy',60,false,array['rojo','cian','crt','violeta']::text[],'{"pad":26}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','anillo-de-ceniza','Anillo de ceniza','raro',1400,'creepy',52,false,array['ceniza','rosa','sangre','azul']::text[],'{"pad":10}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','lazo-y-ceniza','Lazo y ceniza','epico',2800,'creepy',56,false,array['ceniza','rosa','sangre','azul']::text[],'{"pad":22}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','orbitas-y-estrellas','Órbitas y estrellas','raro',1700,'vampiro',56,false,array['bruma','noche','hielo','menta']::text[],'{"pad":28}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','relicario-y-bruma','Relicario y bruma','epico',3000,'vampiro',60,false,array['bruma','noche','hielo','menta']::text[],'{"pad":30}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('avatar_decoration','condesa-de-la-bruma','Condesa de la bruma','legendario',6500,'vampiro',64,true,array['bruma','noche','hielo','menta']::text[],'{"pad":34}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('profile_card','cripta-de-hueso','Cripta de hueso','epico',2800,'cripta',NULL,false,array['hueso','violeta','azul','ambar']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('profile_card','altar-de-plata','Altar de plata','raro',1500,'cruces',NULL,false,array['plata','sangre','oro','violeta']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('profile_card','noche-de-calabazas','Noche de calabazas','raro',1700,'calabaza',NULL,false,array['naranja','violeta','toxico','sangre']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('profile_card','reja-de-hierro','Reja de hierro','epico',3000,'cuervo',NULL,false,array['plata','sangre','violeta','oro']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('profile_card','salon-barroco','Salón barroco','epico',2800,'barroco',NULL,false,array['grafito','sepia','rosa','acero']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('profile_card','bosque-sin-rostro','Bosque sin rostro','epico',2900,'creepy',NULL,false,array['niebla','sangre','verde','azul']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('profile_card','duerme','Duerme.','epico',2900,'creepy',NULL,false,array['tinta','blanco','azul','verde']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('profile_card','archivo-corrupto','Archivo corrupto','epico',2800,'creepy',NULL,false,array['rojo','cian','crt','violeta']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('profile_card','muneca-de-ceniza','Muñeca de ceniza','raro',1500,'creepy',NULL,false,array['ceniza','rosa','sangre','azul']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('profile_card','fan-club-vampirico','Fan club vampírico','legendario',6200,'vampiro',NULL,true,array['bruma','noche','hielo','menta']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('entry_effect','bandada-de-la-cripta','Bandada de la cripta','epico',2400,'cripta',NULL,false,array['hueso','violeta','azul','ambar']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('entry_effect','lluvia-de-cruces','Lluvia de cruces','raro',1600,'cruces',NULL,false,array['plata','sangre','oro','violeta']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('entry_effect','calabazas-flotantes','Calabazas flotantes','comun',900,'calabaza',NULL,false,array['naranja','violeta','toxico','sangre']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('entry_effect','parvada-de-cuervos','Parvada de cuervos','epico',2500,'cuervo',NULL,false,array['plata','sangre','violeta','oro']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('entry_effect','petalos-y-perlas','Pétalos y perlas','raro',1700,'barroco',NULL,false,array['grafito','sepia','rosa','acero']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('entry_effect','niebla-del-bosque','Niebla del bosque','epico',2400,'creepy',NULL,false,array['niebla','sangre','verde','azul']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('entry_effect','tinta-y-luna','Tinta y luna','epico',2400,'creepy',NULL,false,array['tinta','blanco','azul','verde']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('entry_effect','glitch-de-senal','Glitch de señal','epico',2400,'creepy',NULL,false,array['rojo','cian','crt','violeta']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('entry_effect','ceniza-cayendo','Ceniza cayendo','raro',1500,'creepy',NULL,false,array['ceniza','rosa','sangre','azul']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('entry_effect','bruma-y-estrellas-azules','Bruma y estrellas azules','legendario',5000,'vampiro',NULL,true,array['bruma','noche','hielo','menta']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('background','pasillo-de-la-cripta','Pasillo de la cripta','epico',2200,'cripta',NULL,false,array['hueso','violeta','azul','ambar']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('background','cementerio-de-plata','Cementerio de plata','raro',1400,'cruces',NULL,false,array['plata','sangre','oro','violeta']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('background','campo-de-calabazas','Campo de calabazas','comun',700,'calabaza',NULL,false,array['naranja','violeta','toxico','sangre']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('background','cuervos-en-la-reja','Cuervos en la reja','epico',2200,'cuervo',NULL,false,array['plata','sangre','violeta','oro']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('background','salon-de-espejos','Salón de espejos','epico',2200,'barroco',NULL,false,array['grafito','sepia','rosa','acero']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('background','bosque-sin-rostro','Bosque sin rostro','epico',2200,'creepy',NULL,false,array['niebla','sangre','verde','azul']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('background','habitacion-a-oscuras','Habitación a oscuras','epico',2200,'creepy',NULL,false,array['tinta','blanco','azul','verde']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('background','senal-perdida','Señal perdida','epico',2200,'creepy',NULL,false,array['rojo','cian','crt','violeta']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('background','ceniza-en-el-aire','Ceniza en el aire','raro',1300,'creepy',NULL,false,array['ceniza','rosa','sangre','azul']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('background','noche-de-bruma-azul','Noche de bruma azul','legendario',5200,'vampiro',NULL,true,array['bruma','noche','hielo','menta']::text[],'{}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('title','guardian-de-la-cripta','Guardián de la cripta','epico',600,'cripta',NULL,false,array['a','b','c','d']::text[],'{"glyph":"☠"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('title','portador-de-plata','Portador de plata','raro',400,'cruces',NULL,false,array['a','b','c','d']::text[],'{"glyph":"†"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('title','cazador-de-calabazas','Cazador de calabazas','raro',400,'calabaza',NULL,false,array['a','b','c','d']::text[],'{"glyph":"●"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('title','heraldo-del-cuervo','Heraldo del cuervo','epico',600,'cuervo',NULL,false,array['a','b','c','d']::text[],'{"glyph":"❦"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('title','dama-del-salon-gris','Dama del salón gris','raro',400,'barroco',NULL,false,array['a','b','c','d']::text[],'{"glyph":"❧"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('title','duerme-tranquilo','Duerme tranquilo','epico',600,'creepy',NULL,false,array['a','b','c','d']::text[],'{"glyph":"✕"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('title','archivo-trece','Archivo trece','raro',400,'creepy',NULL,false,array['a','b','c','d']::text[],'{"glyph":"▣"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('title','sonrisa-en-la-niebla','Sonrisa en la niebla','epico',600,'creepy',NULL,false,array['a','b','c','d']::text[],'{"glyph":"◡"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('title','nina-de-ceniza','Niña de ceniza','raro',400,'creepy',NULL,false,array['a','b','c','d']::text[],'{"glyph":"❀"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('title','noble-de-la-bruma-azul','Noble de la bruma azul','epico',800,'vampiro',NULL,false,array['a','b','c','d']::text[],'{"glyph":"✦"}'::jsonb,'codigo','Propia','tienda','1.5.0',false),
('title','portador-de-la-cruz-de-plata','Portador de la cruz de plata','epico',0,'cruces',NULL,false,array['a','b','c','d']::text[],'{"glyph":"✦","exclusive":true}'::jsonb,'codigo','Propia','logro','1.5.0',false),
('title','habitante-del-bosque','Habitante del bosque','epico',0,'creepy',NULL,false,array['a','b','c','d']::text[],'{"glyph":"✦","exclusive":true}'::jsonb,'codigo','Propia','logro','1.5.0',false),
('title','rey-de-la-cosecha','Rey de la cosecha','epico',0,'calabaza',NULL,false,array['a','b','c','d']::text[],'{"glyph":"✦","exclusive":true}'::jsonb,'codigo','Propia','logro','1.5.0',false),
('title','senor-de-la-cripta','Señor de la cripta','epico',0,'cripta',NULL,false,array['a','b','c','d']::text[],'{"glyph":"✦","exclusive":true}'::jsonb,'codigo','Propia','logro','1.5.0',false),
('title','duquesa-del-monocromo','Duquesa del monocromo','epico',0,'barroco',NULL,false,array['a','b','c','d']::text[],'{"glyph":"✦","exclusive":true}'::jsonb,'codigo','Propia','logro','1.5.0',false),
('title','conde-de-la-bruma-azul','Conde de la bruma azul','epico',0,'vampiro',NULL,false,array['a','b','c','d']::text[],'{"glyph":"✦","exclusive":true}'::jsonb,'codigo','Propia','logro','1.5.0',false),
('title','voz-de-la-parvada','Voz de la parvada','epico',0,'cuervo',NULL,false,array['a','b','c','d']::text[],'{"glyph":"✦","exclusive":true}'::jsonb,'codigo','Propia','logro','1.5.0',false),
('badge','cripta','Insignia Cripta de Hueso','epico',0,'cripta',NULL,false,'{}'::text[],'{}'::jsonb,'codigo','Propia','logro','1.5.0',false),
('badge','cruces','Insignia Cruz de Plata','epico',0,'cruces',NULL,false,'{}'::text[],'{}'::jsonb,'codigo','Propia','logro','1.5.0',false),
('badge','calabaza','Insignia Noche de Calabazas','epico',0,'calabaza',NULL,false,'{}'::text[],'{}'::jsonb,'codigo','Propia','logro','1.5.0',false),
('badge','cuervo','Insignia Cuervo de Hierro','epico',0,'cuervo',NULL,false,'{}'::text[],'{}'::jsonb,'codigo','Propia','logro','1.5.0',false),
('badge','barroco','Insignia Barroco Monocromo','epico',0,'barroco',NULL,false,'{}'::text[],'{}'::jsonb,'codigo','Propia','logro','1.5.0',false),
('badge','creepy','Insignia Creepypastas','epico',0,'creepy',NULL,false,'{}'::text[],'{}'::jsonb,'codigo','Propia','logro','1.5.0',false),
('badge','vampiro','Insignia Vampiro Azul','epico',0,'vampiro',NULL,false,'{}'::text[],'{}'::jsonb,'codigo','Propia','logro','1.5.0',false)
on conflict (type, slug) do update set name = excluded.name, rarity = excluded.rarity, collection = excluded.collection,
  min_size = excluded.min_size, custom_hue = excluded.custom_hue, palettes = excluded.palettes, meta = excluded.meta,
  origin = excluded.origin, license = excluded.license, obtainable = excluded.obtainable;

-- 3) Comprobación rápida (1.5.0 debe mostrar 0 activos por ahora)
select release_version, count(*) as items, count(*) filter (where is_active) as activos from public.cosmetic_items group by 1 order by 1;
