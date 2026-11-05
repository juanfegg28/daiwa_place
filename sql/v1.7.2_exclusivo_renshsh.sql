-- =====================================================================
-- DaiwaPlace v1.7.2 · «Lestat de Lioncourt» · COLECCIÓN EXCLUSIVA del usuario fundador @renshsh
-- (generado con tools/gen_lestat_sql.mjs leyendo directamente el kit)
--
--   ★ SOLO PARA @renshsh. No se vende, no sale en la tienda, no la ve ni la puede tener nadie más (ni el equipo).
--   · 10 decoraciones · 6 tarjetas · 6 fondos · 6 efectos de entrada · 4 efectos de nombre
--     · 7 títulos · 1 insignia = 40 filas, TODAS míticas.
--   · Un solo archivo, idempotente: se puede correr dos veces. Si @renshsh todavía no existe, crea todo y avisa;
--     al volver a correrlo cuando exista, se le entrega.
--
-- CÓMO SE GARANTIZA QUE SEA SOLO SUYA (cinco candados):
--   1) obtainable = 'exclusivo' y colección kind = 'exclusiva' (no hay forma de comprarla: shop_buy exige 'tienda').
--   2) El acceso total del equipo (cos_staff_grant_all y su trigger) se SALTA lo exclusivo.
--   3) Un trigger en user_cosmetics rechaza entregar un ítem exclusivo a cualquiera que no sea su dueño (meta.owner_id).
--   4) shop_catalog, shop_collections, admin_cosmetic_list y admin_shop_collections no muestran nada exclusivo
--      (shop_catalog se lo devuelve solo a su dueño, para que pueda equiparlo en Personalizar; la tienda lo oculta).
--   5) Las políticas de lectura directa (RLS) de cosmetic_items y cosmetic_collections ocultan lo exclusivo a todos menos al dueño.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Valores nuevos en las restricciones (obtainable / kind / source)
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  for r in select c.conname, c.conrelid::regclass as t from pg_constraint c
            where c.contype = 'c' and c.conrelid in ('public.cosmetic_items'::regclass, 'public.cosmetic_collections'::regclass, 'public.user_cosmetics'::regclass)
              and ((c.conrelid = 'public.cosmetic_items'::regclass and pg_get_constraintdef(c.oid) like '%obtainable%')
                or (c.conrelid = 'public.cosmetic_collections'::regclass and pg_get_constraintdef(c.oid) like '%kind%')
                or (c.conrelid = 'public.user_cosmetics'::regclass and pg_get_constraintdef(c.oid) like '%source%')) loop
    execute format('alter table %s drop constraint %I', r.t, r.conname);
  end loop;
end $$;
alter table public.cosmetic_items add constraint cosmetic_items_obtainable_check
  check (obtainable in ('tienda', 'gratis', 'logro', 'evento', 'fundador', 'supporter', 'exclusivo'));
alter table public.cosmetic_collections add constraint cosmetic_collections_kind_check
  check (kind in ('coleccion', 'base', 'miticas', 'exclusiva'));
alter table public.user_cosmetics add constraint user_cosmetics_source_check
  check (source in ('shop', 'pack', 'welcome', 'founder', 'collection', 'logro', 'staff_grant', 'code', 'evento', 'supporter', 'exclusivo'));

-- ---------------------------------------------------------------------
-- 2) El acceso total del equipo NO recibe lo exclusivo
-- ---------------------------------------------------------------------
create or replace function public.cos_staff_grant_all(p_user uuid)
returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  insert into public.user_cosmetics (user_id, item_id, source, price_paid)
  select p_user, i.id, 'staff_grant', 0 from public.cosmetic_items i
   where i.obtainable <> 'exclusivo'
  on conflict (user_id, item_id) do nothing;
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.trg_cosmetic_items_staff_grant()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.obtainable = 'exclusivo' then return new; end if;
  insert into public.user_cosmetics (user_id, item_id, source, price_paid)
  select sa.user_id, new.id, 'staff_grant', 0 from public.cosmetic_staff_access sa
  on conflict (user_id, item_id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3) Candado en el inventario: un ítem exclusivo solo puede entrar al inventario de su dueño
-- ---------------------------------------------------------------------
create or replace function public.trg_user_cosmetics_exclusive_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_ob text; v_owner text;
begin
  select i.obtainable, i.meta ->> 'owner_id' into v_ob, v_owner from public.cosmetic_items i where i.id = new.item_id;
  if v_ob = 'exclusivo' and (v_owner is null or v_owner <> new.user_id::text) then
    raise exception 'Este cosmético es exclusivo de su dueño y no se puede entregar a otra cuenta';
  end if;
  return new;
end;
$$;
drop trigger if exists user_cosmetics_exclusive_guard on public.user_cosmetics;
create trigger user_cosmetics_exclusive_guard before insert or update of user_id, item_id on public.user_cosmetics
  for each row execute function public.trg_user_cosmetics_exclusive_guard();

-- ---------------------------------------------------------------------
-- 4) Lectura directa (RLS): lo exclusivo solo lo ve su dueño
--    (funciones SECURITY DEFINER para no caer en recursión con las políticas de user_cosmetics)
-- ---------------------------------------------------------------------
create or replace function public.cos_can_read_exclusive_item(p_item uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_cosmetics where user_id = auth.uid() and item_id = p_item);
$$;
create or replace function public.cos_can_read_exclusive_coll(p_coll text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_cosmetics uc join public.cosmetic_items i on i.id = uc.item_id
                  where uc.user_id = auth.uid() and i.collection = p_coll);
$$;
grant execute on function public.cos_can_read_exclusive_item(uuid), public.cos_can_read_exclusive_coll(text) to authenticated;

drop policy if exists cosmetic_collections_read on public.cosmetic_collections;
create policy cosmetic_collections_read on public.cosmetic_collections for select to authenticated
  using (is_active and (kind <> 'exclusiva' or public.cos_can_read_exclusive_coll(id)));
drop policy if exists cosmetic_items_read on public.cosmetic_items;
create policy cosmetic_items_read on public.cosmetic_items for select to authenticated
  using (is_active
         and exists (select 1 from public.cosmetic_collections c where c.id = collection and c.is_active)
         and (obtainable <> 'exclusivo' or public.cos_can_read_exclusive_item(id)));

-- ---------------------------------------------------------------------
-- 5) Tienda y panel del equipo: lo exclusivo no aparece
-- ---------------------------------------------------------------------
-- 5.1 Catálogo: igual que el vigente (con el descuento Supporter), pero lo exclusivo solo se devuelve a su dueño (para equiparlo en Personalizar).
--     La pantalla de la tienda además lo filtra (obtainable = 'exclusivo').
create or replace function public.shop_catalog()
returns table (
  id uuid, type text, slug text, name text, rarity text, price integer, collection text,
  min_size integer, custom_hue boolean, palettes text[], meta jsonb, obtainable text, release_version text, owned boolean,
  base_price integer, sale_id uuid, sale_name text, sale_ends_at timestamptz, wished boolean
)
language sql stable security definer set search_path = public as $$
  select i.id, i.type, i.slug, i.name, i.rarity,
         least(coalesce(s.sale_price, i.price), public.cos_supporter_price(i.price, i.obtainable, auth.uid())) as price,   -- oferta o descuento Supporter (el más bajo)
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
     and (i.obtainable not in ('exclusivo', 'supporter') or public.cos_owns(auth.uid(), i.id))
   order by c.sort, i.type, i.price, i.name;
$$;

-- 5.2 Colecciones de la tienda: la exclusiva no sale
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
      from public.cosmetic_collections c where c.is_active and c.kind <> 'exclusiva' order by c.sort
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

-- 5.3 Panel del equipo (lista de cosméticos y de colecciones): lo exclusivo no aparece
create or replace function public.admin_cosmetic_list()
returns table (
  id uuid, type text, slug text, name text, rarity text, price integer, collection text, collection_name text,
  release_version text, is_active boolean, obtainable text, owners bigint, sale_price integer, sale_name text, wishes bigint
)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  return query
    select i.id, i.type, i.slug, i.name, i.rarity, i.price, i.collection, c.name, i.release_version,
           (i.is_active and c.is_active), i.obtainable,
           (select count(*) from public.user_cosmetics uc where uc.item_id = i.id and uc.source <> 'staff_grant'),
           public.cos_sale_price(i.id),
           (select sa.name from public.shop_sale_items si join public.shop_sales sa on sa.id = si.sale_id
             where si.item_id = i.id and sa.is_active and now() >= sa.starts_at and now() < sa.ends_at and si.sale_price < i.price
             order by si.sale_price limit 1),
           (select count(*) from public.shop_wishlist w where w.item_id = i.id)
      from public.cosmetic_items i join public.cosmetic_collections c on c.id = i.collection
     where i.obtainable <> 'exclusivo' and c.kind <> 'exclusiva'
     order by c.sort, i.type, i.price, i.name;
end;
$$;

create or replace function public.admin_shop_collections()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', c.id, 'name', c.name, 'kind', c.kind, 'release_version', c.release_version, 'is_active', c.is_active,
           'items', (select count(*) from public.cosmetic_items i where i.collection = c.id and i.type <> 'badge')
         ) order by c.sort), '[]'::jsonb)
    into v from public.cosmetic_collections c where c.kind <> 'exclusiva';
  return v;
end;
$$;

-- Los permisos de las funciones que se reemplazaron se conservan (create or replace no los toca).

-- ---------------------------------------------------------------------
-- 6) La colección y sus 40 ítems (is_active = true: el dueño los usa desde ya)
--    Ojo: el trigger de «acceso total» se salta lo exclusivo, así que el equipo NO los recibe.
-- ---------------------------------------------------------------------
insert into public.cosmetic_collections (id, name, theme, kind, release_version, is_active, has_pack, pack_card, pack_effect, completion_title, sort) values
('lestat','Lestat de Lioncourt','exclusiva de @renshsh: entrevista con el vampiro — terciopelo, oro, cera y noche','exclusiva','1.7.2',true,false,NULL,NULL,NULL,24)
on conflict (id) do update set name = excluded.name, theme = excluded.theme, kind = excluded.kind, has_pack = false,
  pack_card = NULL, pack_effect = NULL, completion_title = NULL, sort = excluded.sort;

insert into public.cosmetic_items (type, slug, name, rarity, price, collection, min_size, custom_hue, palettes, meta, origin, license, obtainable, release_version, is_active) values
('avatar_decoration','eclipse-del-principe','Eclipse del Príncipe','mitico',0,'lestat',56,true,array['lioncourt','brocado','sangre','marfil']::text[],'{"pad":46}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('avatar_decoration','alas-de-onix-y-oro','Alas de ónix y oro','mitico',0,'lestat',80,true,array['lioncourt','brocado','sangre','marfil']::text[],'{"pad":86}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('avatar_decoration','corona-de-lioncourt','Corona de Lioncourt','mitico',0,'lestat',60,true,array['lioncourt','brocado','sangre','marfil']::text[],'{"pad":58}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('avatar_decoration','gola-de-encaje-real','Gola de encaje real','mitico',0,'lestat',56,true,array['lioncourt','brocado','sangre','marfil']::text[],'{"pad":8}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('avatar_decoration','candelabro-de-los-condenados','Candelabro de los condenados','mitico',0,'lestat',56,true,array['lioncourt','brocado','sangre','marfil']::text[],'{"pad":62}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('avatar_decoration','espejo-rococo','Espejo rococó','mitico',0,'lestat',56,true,array['lioncourt','brocado','sangre','marfil']::text[],'{"pad":40}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('avatar_decoration','brocado-bordado','Brocado bordado','mitico',0,'lestat',56,true,array['azul','granate','esmeralda','marfil']::text[],'{"pad":22}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('avatar_decoration','rosas-negras-y-espinas','Rosas negras y espinas','mitico',0,'lestat',56,true,array['lioncourt','brocado','sangre','marfil']::text[],'{"pad":34}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('avatar_decoration','luna-de-sangre-y-murcielagos','Luna de sangre y murciélagos','mitico',0,'lestat',56,true,array['lioncourt','brocado','sangre','marfil']::text[],'{"pad":40}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('avatar_decoration','caliz-y-rio-de-sangre','Cáliz y río de sangre','mitico',0,'lestat',56,true,array['lioncourt','brocado','sangre','marfil']::text[],'{"pad":40}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('profile_card','salon-de-terciopelo-carmesi','Salón de terciopelo carmesí','mitico',0,'lestat',NULL,true,array['lioncourt','brocado','sangre','marfil']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('profile_card','banquete-a-la-luz-de-las-velas','Banquete a la luz de las velas','mitico',0,'lestat',NULL,true,array['lioncourt','brocado','sangre','marfil']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('profile_card','brocado-azul-y-oro','Brocado azul y oro','mitico',0,'lestat',NULL,true,array['azul','granate','esmeralda','marfil']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('profile_card','noche-en-nueva-orleans-1794','Noche en Nueva Orleans, 1794','mitico',0,'lestat',NULL,true,array['lioncourt','brocado','sangre','marfil']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('profile_card','teatro-de-los-vampiros','Teatro de los vampiros','mitico',0,'lestat',NULL,true,array['lioncourt','brocado','sangre','marfil']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('profile_card','arco-de-las-velas','Arco de las velas','mitico',0,'lestat',NULL,true,array['lioncourt','brocado','sangre','marfil']::text[],'{"tone":"dark"}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('background','eclipse-del-principe-fondo','Eclipse del príncipe','mitico',0,'lestat',NULL,true,array['lioncourt','brocado','sangre','marfil']::text[],'{}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('background','catedral-de-velas-fondo','Catedral de velas','mitico',0,'lestat',NULL,true,array['lioncourt','brocado','sangre','marfil']::text[],'{}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('background','salon-de-terciopelo-fondo','Salón de la araña de cristal','mitico',0,'lestat',NULL,true,array['lioncourt','brocado','sangre','marfil']::text[],'{}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('background','nueva-orleans-1794-fondo','Calle de Nueva Orleans, 1794','mitico',0,'lestat',NULL,true,array['lioncourt','brocado','sangre','marfil']::text[],'{}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('background','gran-teatro-de-los-vampiros','Gran teatro de los vampiros','mitico',0,'lestat',NULL,true,array['lioncourt','brocado','sangre','marfil']::text[],'{}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('background','luna-de-sangre','Luna de sangre','mitico',0,'lestat',NULL,true,array['lioncourt','brocado','sangre','marfil']::text[],'{}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('entry_effect','eclipse-dorado','Eclipse dorado','mitico',0,'lestat',NULL,false,array['lioncourt','brocado','sangre','marfil']::text[],'{}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('entry_effect','lluvia-de-rosas-y-oro','Lluvia de rosas y oro','mitico',0,'lestat',NULL,false,array['lioncourt','brocado','sangre','marfil']::text[],'{}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('entry_effect','bandada-de-lioncourt','Bandada de Lioncourt','mitico',0,'lestat',NULL,false,array['lioncourt','brocado','sangre','marfil']::text[],'{}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('entry_effect','velas-que-despiertan','Velas que despiertan','mitico',0,'lestat',NULL,false,array['lioncourt','brocado','sangre','marfil']::text[],'{}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('entry_effect','telon-de-terciopelo','Telón de terciopelo','mitico',0,'lestat',NULL,false,array['lioncourt','brocado','sangre','marfil']::text[],'{}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('entry_effect','flores-de-lis-doradas','Flores de lis doradas','mitico',0,'lestat',NULL,false,array['lioncourt','brocado','sangre','marfil']::text[],'{}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('name_effect','oro-de-lioncourt','Oro de Lioncourt','mitico',0,'lestat',NULL,true,array['lioncourt','brocado','sangre','marfil']::text[],'{}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('name_effect','sangre-y-terciopelo','Sangre y terciopelo','mitico',0,'lestat',NULL,true,array['lioncourt','brocado','sangre','marfil']::text[],'{}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('name_effect','eclipse-de-oro','Eclipse de oro','mitico',0,'lestat',NULL,true,array['lioncourt','brocado','sangre','marfil']::text[],'{}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('name_effect','marfil-y-encaje','Marfil y encaje','mitico',0,'lestat',NULL,true,array['lioncourt','brocado','sangre','marfil']::text[],'{}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('title','principe-de-los-condenados','Príncipe de los condenados','mitico',0,'lestat',NULL,false,array['a','b','c','d']::text[],'{"glyph":"♛"}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('title','caido-redimido-y-eterno','Caído, redimido y eterno','mitico',0,'lestat',NULL,false,array['a','b','c','d']::text[],'{"glyph":"✝"}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('title','el-enigma-eterno','El enigma eterno','mitico',0,'lestat',NULL,false,array['a','b','c','d']::text[],'{"glyph":"∞"}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('title','amo-del-salon-de-terciopelo','Amo del salón de terciopelo','mitico',0,'lestat',NULL,false,array['a','b','c','d']::text[],'{"glyph":"❦"}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('title','fantasma-de-nueva-orleans','Fantasma de Nueva Orleans','mitico',0,'lestat',NULL,false,array['a','b','c','d']::text[],'{"glyph":"☾"}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('title','rey-de-la-noche-1794','Rey de la noche, 1794','mitico',0,'lestat',NULL,false,array['a','b','c','d']::text[],'{"glyph":"♚"}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('title','belleza-peligrosa','Belleza peligrosa','mitico',0,'lestat',NULL,false,array['a','b','c','d']::text[],'{"glyph":"❀"}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true),
('badge','lestat','Insignia Lestat de Lioncourt','mitico',0,'lestat',NULL,false,'{}'::text[],'{}'::jsonb,'codigo','Propia','exclusivo','1.7.2',true)
on conflict (type, slug) do update set name = excluded.name, rarity = excluded.rarity, collection = excluded.collection,
  min_size = excluded.min_size, custom_hue = excluded.custom_hue, palettes = excluded.palettes,
  meta = public.cosmetic_items.meta || excluded.meta, obtainable = 'exclusivo', price = 0, is_active = true;

-- ---------------------------------------------------------------------
-- 7) Entrega a @renshsh (y SOLO a él) + limpieza por si algún ítem exclusivo hubiera llegado a otra cuenta
-- ---------------------------------------------------------------------
do $$
declare v_uid uuid; n integer;
begin
  select p.id into v_uid from public.profiles p where lower(p.username) = 'renshsh' limit 1;
  if v_uid is null then
    raise notice 'No existe la cuenta @renshsh: la colección quedó creada pero NO entregada. Vuelve a correr este archivo cuando exista.';
    return;
  end if;
  -- el dueño queda anotado dentro de cada ítem (el trigger de seguridad lo usa)
  update public.cosmetic_items set meta = meta || jsonb_build_object('owner_id', v_uid::text) where collection = 'lestat';
  -- cualquier copia en otra cuenta se retira
  delete from public.user_cosmetics uc using public.cosmetic_items i
   where uc.item_id = i.id and i.collection = 'lestat' and uc.user_id <> v_uid;
  -- se entrega todo (la insignia con origen 'collection' para que salga en su perfil)
  insert into public.user_cosmetics (user_id, item_id, source, price_paid)
  select v_uid, i.id, case when i.type = 'badge' then 'collection' else 'exclusivo' end, 0
    from public.cosmetic_items i where i.collection = 'lestat'
  on conflict (user_id, item_id) do nothing;
  get diagnostics n = row_count;
  raise notice 'Colección Lestat entregada a @renshsh: % ítems nuevos en su inventario', n;
end $$;

-- ---------------------------------------------------------------------
-- 8) Comprobaciones (corre estas consultas para verificar)
-- ---------------------------------------------------------------------
-- 8.1 Debe dar 40 ítems y exactamente 1 dueño (@renshsh):
select count(distinct i.id) as items, count(distinct uc.user_id) as duenos,
       string_agg(distinct p.username, ', ') as quien
  from public.cosmetic_items i
  left join public.user_cosmetics uc on uc.item_id = i.id
  left join public.profiles p on p.id = uc.user_id
 where i.collection = 'lestat';
-- 8.2 Debe dar 0 filas (nadie del equipo recibió nada exclusivo):
select uc.user_id from public.user_cosmetics uc join public.cosmetic_items i on i.id = uc.item_id
 where i.obtainable = 'exclusivo' and uc.source = 'staff_grant';

-- ---------------------------------------------------------------------
-- DESHACER (solo si hiciera falta; no lo corras si no estás seguro):
--   delete from public.user_cosmetics where item_id in (select id from public.cosmetic_items where collection = 'lestat');
--   delete from public.cosmetic_items where collection = 'lestat';
--   delete from public.cosmetic_collections where id = 'lestat';
--   drop trigger if exists user_cosmetics_exclusive_guard on public.user_cosmetics;
-- (Las funciones y políticas nuevas son inofensivas y pueden quedarse.)
-- ---------------------------------------------------------------------
