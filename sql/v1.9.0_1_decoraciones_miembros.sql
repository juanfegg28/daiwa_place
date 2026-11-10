-- =====================================================================
-- DaiwaPlace v1.9.0 (parte 1 de 2) · DECORACIONES EXCLUSIVAS DE MIEMBROS (Círculo Lunar)
--   (antes se llamaba «parche v1.7.3»: el número de versión ya no importa, ahora es parte de la 1.9.0)
--
--   · 31 cosméticos MÍTICOS exclusivos de miembros: 14 decoraciones de avatar · 5 tarjetas de perfil · 3 efectos de entrada ·
--     3 efectos de nombre · 6 títulos. Cada uno con 10 paletas (5 oscuras + 5 rosas/pastel) y color libre.
--     Reparto: Creciente 8 · Llena 19 (incluye los de Creciente) · Eclipse 31 (todo). Se reclaman desde «Mi membresía».
--   · Un nivel superior reclama las suyas Y las de los niveles anteriores (Eclipse = las 14).
--   · Lo reclamado se queda para siempre, aunque la membresía se cancele o venza.
--   · NO se venden y NO salen en la tienda pública: obtainable = 'supporter' (solo las ve quien ya las tiene).
--   · Es independiente de Lestat: funciona igual si ya corriste el SQL de Lestat o si no.
--   · Idempotente: se puede correr varias veces sin duplicar nada.
--   · Requiere haber corrido antes v1.7.0_circulo_lunar.sql y v1.7.2_kofi.sql (ya lo tienes en la 1.7.2).
--
--   ARREGLO IMPORTANTE: en la 1.7.0 la tabla del inventario (user_cosmetics) no aceptaba source = 'supporter',
--   así que «Reclamar» fallaba con un error de restricción. Aquí se corrige (paso 1).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Restricciones: se reconstruyen como UNIÓN de todo lo que existe (por si ya corriste Lestat u otra versión)
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  -- cosmetic_items.obtainable
  for r in select conname from pg_constraint where conrelid = 'public.cosmetic_items'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%obtainable%' loop
    execute format('alter table public.cosmetic_items drop constraint %I', r.conname);
  end loop;
  alter table public.cosmetic_items add constraint cosmetic_items_obtainable_check
    check (obtainable in ('tienda', 'gratis', 'logro', 'evento', 'fundador', 'supporter', 'exclusivo'));

  -- cosmetic_collections.kind
  for r in select conname from pg_constraint where conrelid = 'public.cosmetic_collections'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%kind%' loop
    execute format('alter table public.cosmetic_collections drop constraint %I', r.conname);
  end loop;
  alter table public.cosmetic_collections add constraint cosmetic_collections_kind_check
    check (kind in ('coleccion', 'base', 'miticas', 'exclusiva', 'miembros'));

  -- user_cosmetics.source  (← aquí estaba el fallo de «Reclamar»)
  for r in select conname from pg_constraint where conrelid = 'public.user_cosmetics'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%source%' loop
    execute format('alter table public.user_cosmetics drop constraint %I', r.conname);
  end loop;
  alter table public.user_cosmetics add constraint user_cosmetics_source_check
    check (source in ('shop', 'pack', 'welcome', 'founder', 'collection', 'logro', 'staff_grant', 'code', 'evento', 'supporter', 'exclusivo'));
end $$;

-- ---------------------------------------------------------------------
-- 2) Colección «Círculo Lunar» (no se muestra en la tienda: kind = 'miembros')
-- ---------------------------------------------------------------------
insert into public.cosmetic_collections (id, name, theme, kind, release_version, is_active, has_pack, sort) values
  ('supporters', 'Círculo Lunar', 'exclusivo de miembros: lunas, perlas, cristales y eclipses', 'miembros', '1.9.0', true, false, 90)
on conflict (id) do update set name = excluded.name, theme = excluded.theme, kind = excluded.kind, is_active = true;

-- ---------------------------------------------------------------------
-- 3) Los 31 cosméticos de miembros (generados leyendo el kit): 14 decoraciones · 5 tarjetas · 3 efectos de entrada ·
--    3 efectos de nombre · 6 títulos. Todos míticos, 10 paletas, color libre. Al volver a correr NO se pisa is_active.
-- ---------------------------------------------------------------------
insert into public.cosmetic_items (type, slug, name, rarity, price, collection, min_size, custom_hue, palettes, meta, origin, license, obtainable, release_version, is_active) values
('avatar_decoration','halo-naciente','Halo Naciente','mitico',0,'supporters',56,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Luna Creciente). Se reclama en Mi membresía.", "tier": "creciente", "pad": 44}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('avatar_decoration','lazo-de-seda-y-perlas','Lazo de seda y perlas','mitico',0,'supporters',56,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Luna Creciente). Se reclama en Mi membresía.", "tier": "creciente", "pad": 40}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('avatar_decoration','jardin-de-luna','Jardín de luna','mitico',0,'supporters',56,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Luna Creciente). Se reclama en Mi membresía.", "tier": "creciente", "pad": 40}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('avatar_decoration','orbita-de-plata','Órbita de plata','mitico',0,'supporters',56,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Luna Llena). Se reclama en Mi membresía.", "tier": "llena", "pad": 70}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('avatar_decoration','astrolabio-de-selene','Astrolabio de Selene','mitico',0,'supporters',60,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Luna Llena). Se reclama en Mi membresía.", "tier": "llena", "pad": 52}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('avatar_decoration','polilla-lunar','Polilla lunar','mitico',0,'supporters',80,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Luna Llena). Se reclama en Mi membresía.", "tier": "llena", "pad": 100}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('avatar_decoration','diadema-de-selene','Diadema de Selene','mitico',0,'supporters',60,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Luna Llena). Se reclama en Mi membresía.", "tier": "llena", "pad": 62}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('avatar_decoration','medusas-de-medianoche','Medusas de medianoche','mitico',0,'supporters',56,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Luna Llena). Se reclama en Mi membresía.", "tier": "llena", "pad": 56}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('avatar_decoration','corona-de-la-totalidad','Corona de la Totalidad','mitico',0,'supporters',60,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Eclipse). Se reclama en Mi membresía.", "tier": "eclipse", "pad": 66}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('avatar_decoration','caliz-de-rosas','Cáliz de rosas','mitico',0,'supporters',60,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Eclipse). Se reclama en Mi membresía.", "tier": "eclipse", "pad": 58}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('avatar_decoration','serafin-lunar','Serafín lunar','mitico',0,'supporters',80,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Eclipse). Se reclama en Mi membresía.", "tier": "eclipse", "pad": 112}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('avatar_decoration','reloj-de-selene','Reloj de Selene','mitico',0,'supporters',60,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Eclipse). Se reclama en Mi membresía.", "tier": "eclipse", "pad": 66}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('avatar_decoration','cristales-de-eclipse','Cristales de eclipse','mitico',0,'supporters',60,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Eclipse). Se reclama en Mi membresía.", "tier": "eclipse", "pad": 62}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('avatar_decoration','gatita-celestial','Gatita celestial','mitico',0,'supporters',60,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Eclipse). Se reclama en Mi membresía.", "tier": "eclipse", "pad": 62}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('profile_card','velo-de-luna','Velo de Luna','mitico',0,'supporters',NULL,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Luna Creciente). Se reclama en Mi membresía.", "tier": "creciente", "tone": "dark"}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('profile_card','marea-de-plata','Marea de Plata','mitico',0,'supporters',NULL,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Luna Llena). Se reclama en Mi membresía.", "tier": "llena", "tone": "dark"}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('profile_card','jardin-de-seda','Jardín de seda','mitico',0,'supporters',NULL,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Luna Llena). Se reclama en Mi membresía.", "tier": "llena", "tone": "dark"}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('profile_card','umbra','Umbra','mitico',0,'supporters',NULL,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Eclipse). Se reclama en Mi membresía.", "tier": "eclipse", "tone": "dark"}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('profile_card','salon-de-cristal','Salón de cristal','mitico',0,'supporters',NULL,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Eclipse). Se reclama en Mi membresía.", "tier": "eclipse", "tone": "dark"}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('entry_effect','marea-de-petalos-lunares','Marea de pétalos lunares','mitico',0,'supporters',NULL,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Luna Creciente). Se reclama en Mi membresía.", "tier": "creciente"}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('entry_effect','lluvia-de-estrellas-de-plata','Lluvia de estrellas de plata','mitico',0,'supporters',NULL,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Luna Llena). Se reclama en Mi membresía.", "tier": "llena"}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('entry_effect','eclipse-total-lunar','Eclipse Total Lunar','mitico',0,'supporters',NULL,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Eclipse). Se reclama en Mi membresía.", "tier": "eclipse"}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('name_effect','luz-de-luna','Luz de luna','mitico',0,'supporters',NULL,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Luna Creciente). Se reclama en Mi membresía.", "tier": "creciente"}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('name_effect','seda-y-perlas','Seda y perlas','mitico',0,'supporters',NULL,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Luna Llena). Se reclama en Mi membresía.", "tier": "llena"}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('name_effect','aura-de-eclipse','Aura de eclipse','mitico',0,'supporters',NULL,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Eclipse). Se reclama en Mi membresía.", "tier": "eclipse"}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('title','bajo-la-luna','Bajo la Luna','mitico',0,'supporters',NULL,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Luna Creciente). Se reclama en Mi membresía.", "tier": "creciente"}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('title','sueno-de-plata','Sueño de plata','mitico',0,'supporters',NULL,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Luna Creciente). Se reclama en Mi membresía.", "tier": "creciente"}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('title','heredero-de-selene','Heredero de Selene','mitico',0,'supporters',NULL,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Luna Llena). Se reclama en Mi membresía.", "tier": "llena"}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('title','reina-de-las-perlas','Reina de las perlas','mitico',0,'supporters',NULL,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Luna Llena). Se reclama en Mi membresía.", "tier": "llena"}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('title','testigo-de-la-totalidad','Testigo de la Totalidad','mitico',0,'supporters',NULL,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Eclipse). Se reclama en Mi membresía.", "tier": "eclipse"}'::jsonb,'codigo','Propia','supporter','1.9.0',true),
('title','soberano-del-eclipse','Soberano del eclipse','mitico',0,'supporters',NULL,true,array['medianoche','sangre-lunar','obsidiana','orquidea','abismo','rosa-eclipse','algodon','chicle','sakura','rosa-oro']::text[],'{"how": "Exclusivo de miembros del Círculo Lunar (desde Eclipse). Se reclama en Mi membresía.", "tier": "eclipse"}'::jsonb,'codigo','Propia','supporter','1.9.0',true)
on conflict (type, slug) do update set name = excluded.name, rarity = excluded.rarity, collection = excluded.collection,
  min_size = excluded.min_size, custom_hue = excluded.custom_hue, palettes = excluded.palettes, meta = excluded.meta,
  origin = excluded.origin, license = excluded.license, obtainable = excluded.obtainable, price = 0;

-- ---------------------------------------------------------------------
-- 4) Beneficios reclamables. Los 10 de relleno de la 1.7.0 (halo_naciente, titulo_bajo_la_luna, orbita_de_plata,
--    tarjeta_marea_plata, titulo_heredero, corona_totalidad, tarjeta_umbra, entrada_eclipse, efecto_nombre, titulo_testigo)
--    pasan a ser reales (mismo código, ahora con diseño y available = true) + 21 nuevos.
-- ---------------------------------------------------------------------
insert into public.supporter_perks (code, min_tier, kind, name, item_id, sort)
select v.code, v.min_tier, v.kind, v.name, (select i.id from public.cosmetic_items i where i.type = v.type and i.slug = v.slug), v.sort
  from (values
  ('halo_naciente', 'creciente', 'decoration', 'Decoración Halo Naciente', 'halo-naciente', 'avatar_decoration', 11),
  ('deco_lazo_de_seda_y_perlas', 'creciente', 'decoration', 'Decoración Lazo de seda y perlas', 'lazo-de-seda-y-perlas', 'avatar_decoration', 12),
  ('deco_jardin_de_luna', 'creciente', 'decoration', 'Decoración Jardín de luna', 'jardin-de-luna', 'avatar_decoration', 13),
  ('orbita_de_plata', 'llena', 'decoration', 'Decoración Órbita de plata', 'orbita-de-plata', 'avatar_decoration', 14),
  ('deco_astrolabio_de_selene', 'llena', 'decoration', 'Decoración Astrolabio de Selene', 'astrolabio-de-selene', 'avatar_decoration', 15),
  ('deco_polilla_lunar', 'llena', 'decoration', 'Decoración Polilla lunar', 'polilla-lunar', 'avatar_decoration', 16),
  ('deco_diadema_de_selene', 'llena', 'decoration', 'Decoración Diadema de Selene', 'diadema-de-selene', 'avatar_decoration', 17),
  ('deco_medusas_de_medianoche', 'llena', 'decoration', 'Decoración Medusas de medianoche', 'medusas-de-medianoche', 'avatar_decoration', 18),
  ('corona_totalidad', 'eclipse', 'decoration', 'Decoración Corona de la Totalidad', 'corona-de-la-totalidad', 'avatar_decoration', 19),
  ('deco_caliz_de_rosas', 'eclipse', 'decoration', 'Decoración Cáliz de rosas', 'caliz-de-rosas', 'avatar_decoration', 20),
  ('deco_serafin_lunar', 'eclipse', 'decoration', 'Decoración Serafín lunar', 'serafin-lunar', 'avatar_decoration', 21),
  ('deco_reloj_de_selene', 'eclipse', 'decoration', 'Decoración Reloj de Selene', 'reloj-de-selene', 'avatar_decoration', 22),
  ('deco_cristales_de_eclipse', 'eclipse', 'decoration', 'Decoración Cristales de eclipse', 'cristales-de-eclipse', 'avatar_decoration', 23),
  ('deco_gatita_celestial', 'eclipse', 'decoration', 'Decoración Gatita celestial', 'gatita-celestial', 'avatar_decoration', 24),
  ('tarjeta_velo_de_luna', 'creciente', 'card', 'Tarjeta de perfil Velo de Luna', 'velo-de-luna', 'profile_card', 115),
  ('tarjeta_marea_plata', 'llena', 'card', 'Tarjeta de perfil Marea de Plata', 'marea-de-plata', 'profile_card', 116),
  ('tarjeta_jardin_de_seda', 'llena', 'card', 'Tarjeta de perfil Jardín de seda', 'jardin-de-seda', 'profile_card', 117),
  ('tarjeta_umbra', 'eclipse', 'card', 'Tarjeta de perfil Umbra', 'umbra', 'profile_card', 118),
  ('tarjeta_salon_de_cristal', 'eclipse', 'card', 'Tarjeta de perfil Salón de cristal', 'salon-de-cristal', 'profile_card', 119),
  ('entrada_marea_de_petalos_lunares', 'creciente', 'entry_effect', 'Efecto de entrada Marea de pétalos lunares', 'marea-de-petalos-lunares', 'entry_effect', 220),
  ('entrada_lluvia_de_estrellas_de_plata', 'llena', 'entry_effect', 'Efecto de entrada Lluvia de estrellas de plata', 'lluvia-de-estrellas-de-plata', 'entry_effect', 221),
  ('entrada_eclipse', 'eclipse', 'entry_effect', 'Efecto de entrada Eclipse Total Lunar', 'eclipse-total-lunar', 'entry_effect', 222),
  ('nombre_luz_de_luna', 'creciente', 'name_effect', 'Efecto de nombre Luz de luna', 'luz-de-luna', 'name_effect', 323),
  ('nombre_seda_y_perlas', 'llena', 'name_effect', 'Efecto de nombre Seda y perlas', 'seda-y-perlas', 'name_effect', 324),
  ('efecto_nombre', 'eclipse', 'name_effect', 'Efecto de nombre Aura de eclipse', 'aura-de-eclipse', 'name_effect', 325),
  ('titulo_bajo_la_luna', 'creciente', 'title', 'Título «Bajo la Luna»', 'bajo-la-luna', 'title', 426),
  ('titulo_sueno_de_plata', 'creciente', 'title', 'Título «Sueño de plata»', 'sueno-de-plata', 'title', 427),
  ('titulo_heredero', 'llena', 'title', 'Título «Heredero de Selene»', 'heredero-de-selene', 'title', 428),
  ('titulo_reina_de_las_perlas', 'llena', 'title', 'Título «Reina de las perlas»', 'reina-de-las-perlas', 'title', 429),
  ('titulo_testigo', 'eclipse', 'title', 'Título «Testigo de la Totalidad»', 'testigo-de-la-totalidad', 'title', 430),
  ('titulo_soberano_del_eclipse', 'eclipse', 'title', 'Título «Soberano del eclipse»', 'soberano-del-eclipse', 'title', 431)
  ) as v(code, min_tier, kind, name, slug, type, sort)
on conflict (code) do update set min_tier = excluded.min_tier, kind = excluded.kind, name = excluded.name, item_id = excluded.item_id, sort = excluded.sort;
update public.supporter_perks k set available = true
 where k.item_id in (select id from public.cosmetic_items where collection = 'supporters');

-- ---------------------------------------------------------------------
-- 5) «Reclamar todas»: entrega de una vez todo lo que tu nivel ya desbloquea. Se puede llamar las veces que quieras.
-- ---------------------------------------------------------------------
create or replace function public.supporter_claim_all()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  k  public.supporter_perks;
  n  integer := 0;
  v_rank integer;
begin
  if me is null then raise exception 'Inicia sesión primero'; end if;
  v_rank := public.supporter_rank_of(me);
  if v_rank < 1 then raise exception 'Necesitas una membresía activa para reclamar'; end if;
  for k in
    select * from public.supporter_perks p
     where p.available and p.item_id is not null
       and (select t.rank from public.supporter_tiers t where t.tier = p.min_tier) <= v_rank
       and not exists (select 1 from public.supporter_perk_claims c where c.user_id = me and c.code = p.code)
     order by p.sort
  loop
    perform public.cos_grant(me, k.item_id, 'supporter', 0);
    insert into public.supporter_perk_claims (user_id, code) values (me, k.code) on conflict do nothing;
    n := n + 1;
  end loop;
  return jsonb_build_object('ok', true, 'claimed', n);
end;
$$;
revoke execute on function public.supporter_claim_all() from public, anon;
grant  execute on function public.supporter_claim_all() to authenticated;

-- ---------------------------------------------------------------------
-- 6) Tienda: lo exclusivo (de miembros o de Lestat) solo lo ve quien ya lo tiene.
--    Copia de shop_catalog de la 1.7.0 (con descuento Supporter) + el filtro ampliado.
-- ---------------------------------------------------------------------
drop function if exists public.shop_catalog();
create or replace function public.shop_catalog()
returns table (
  id uuid, type text, slug text, name text, rarity text, price integer, collection text,
  min_size integer, custom_hue boolean, palettes text[], meta jsonb, obtainable text, release_version text, owned boolean,
  base_price integer, sale_id uuid, sale_name text, sale_ends_at timestamptz, wished boolean
)
language sql stable security definer set search_path = public as $$
  select i.id, i.type, i.slug, i.name, i.rarity,
         least(coalesce(s.sale_price, i.price), public.cos_supporter_price(i.price, i.obtainable, auth.uid())) as price,
         i.collection, i.min_size, i.custom_hue, i.palettes, i.meta, i.obtainable, i.release_version,
         public.cos_owns(auth.uid(), i.id),
         i.price as base_price,
         s.sid, s.sname, s.ends_at,
         exists (select 1 from public.shop_wishlist w where w.user_id = auth.uid() and w.item_id = i.id)
    from public.cosmetic_items i
    join public.cosmetic_collections c on c.id = i.collection
    left join lateral (
      select si.sale_price, sa.id as sid, sa.name as sname, sa.ends_at
        from public.shop_sale_items si
        join public.shop_sales sa on sa.id = si.sale_id
       where si.item_id = i.id
         and sa.is_active and now() >= sa.starts_at and now() < sa.ends_at
         and i.obtainable = 'tienda' and i.price > 0 and si.sale_price < i.price
       order by si.sale_price asc, sa.ends_at asc
       limit 1
    ) s on true
   where auth.uid() is not null and i.is_active and c.is_active
     and (i.obtainable not in ('supporter', 'exclusivo') or public.cos_owns(auth.uid(), i.id))
   order by c.sort, i.type, i.price, i.name;
$$;
revoke execute on function public.shop_catalog() from public, anon;
grant  execute on function public.shop_catalog() to authenticated;

-- Colecciones de la tienda: sin las de miembros ni las exclusivas (copia de la 1.4.0 + el filtro)
drop function if exists public.shop_collections();
create or replace function public.shop_collections()
returns table (
  id text, name text, theme text, kind text, has_pack boolean, pack_card text, pack_effect text, completion_title text,
  total integer, owned integer, pack_price integer, pack_full_price integer, all_owned boolean
)
language plpgsql stable security definer set search_path = public as $$
declare r record; q jsonb;
begin
  if auth.uid() is null then return; end if;
  for r in
    select c.*,
           (select count(*)::int from public.cosmetic_items i where i.collection = c.id and i.type = 'avatar_decoration' and i.is_active) as n_total,
           (select count(*)::int from public.cosmetic_items i join public.user_cosmetics uc on uc.item_id = i.id and uc.user_id = auth.uid()
             where i.collection = c.id and i.type = 'avatar_decoration' and i.is_active) as n_owned
      from public.cosmetic_collections c where c.is_active and c.kind not in ('exclusiva', 'miembros') order by c.sort
  loop
    q := case when r.has_pack then public.shop_pack_quote(r.id) else null end;
    id := r.id; name := r.name; theme := r.theme; kind := r.kind; has_pack := r.has_pack;
    pack_card := r.pack_card; pack_effect := r.pack_effect; completion_title := r.completion_title;
    total := r.n_total; owned := r.n_owned;
    pack_price := coalesce((q ->> 'price')::int, 0);
    pack_full_price := coalesce((q ->> 'full_price')::int, 0);
    all_owned := r.n_total > 0 and r.n_owned >= r.n_total;
    return next;
  end loop;
end;
$$;
revoke execute on function public.shop_collections() from public, anon;
grant  execute on function public.shop_collections() to authenticated;

-- ---------------------------------------------------------------------
-- 7) supporter_me(): igual que la 1.7.2 pero cada beneficio trae el diseño (slug) para poder mostrarlo
-- ---------------------------------------------------------------------
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
  if v_tier is not null then v_granted := public.supporter_grant_weekly(me); end if;

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
        'unlocked', (select t.rank from public.supporter_tiers t where t.tier = k.min_tier) <= public.supporter_rank_of(me),
        'slug', (select i.slug from public.cosmetic_items i where i.id = k.item_id),
        'palettes', (select coalesce(array_length(i.palettes, 1), 0) from public.cosmetic_items i where i.id = k.item_id)
      ) order by k.sort), '[]'::jsonb) from public.supporter_perks k)
  );
end;
$$;
revoke execute on function public.supporter_me() from public, anon;
grant  execute on function public.supporter_me() to authenticated;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- Comprobación rápida (opcional):
--   select type, count(*) from public.cosmetic_items where collection = 'supporters' group by 1;   -- avatar_decoration 14 · profile_card 5 · entry_effect 3 · name_effect 3 · title 6
--   select min_tier, count(*) from public.supporter_perks where item_id is not null group by 1;     -- creciente 8 · llena 11 · eclipse 12
--   select count(*) from public.supporter_perks where available and item_id is not null;            -- 31
-- ---------------------------------------------------------------------
