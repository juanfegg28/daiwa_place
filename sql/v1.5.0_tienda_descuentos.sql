-- =====================================================================
-- DaiwaPlace v1.5.0 «Tienda Halloween» · PASO 1 de 3: descuentos, selecciones (banners) y lista de deseos
-- Córrelo PRIMERO (después de v1.4.0_tienda.sql y v1.4.5_acceso_total_equipo.sql, que ya tienes corridos).
-- Es idempotente: se puede correr varias veces sin romper nada.
--
--   · shop_sales / shop_sale_items  → ofertas: un grupo de cosméticos con precio rebajado hasta una fecha.
--   · shop_features                 → «Selecciones» del banner principal (p. ej. «Selección de Halloween»).
--   · shop_wishlist                 → lista de deseos (el corazón de la tienda).
--   · shop_catalog() ahora devuelve el PRECIO VIGENTE (con oferta si la hay) y el precio de lista aparte.
--   · shop_buy / packs cobran el precio vigente. Todo lo decide el servidor: nadie puede comprar a un precio inventado.
--   · Panel del equipo (permiso «manage_shop»): admin_shop_* y admin_cosmetic_list (ahora con ofertas).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) TABLAS
-- ---------------------------------------------------------------------
create table if not exists public.shop_sales (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 2 and 60),
  blurb      text check (blurb is null or char_length(blurb) <= 140),
  kind       text not null default 'oferta' check (kind in ('oferta', 'dia', 'semana', 'evento')),
  theme      text not null default 'garnet' check (theme ~ '^[a-z]{3,12}$'),
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz not null,
  is_active  boolean not null default true,      -- interruptor manual (pausar sin borrar)
  in_banner  boolean not null default true,      -- ¿sale en el banner de ofertas de la portada?
  sort       integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint shop_sales_window check (ends_at > starts_at)
);
create index if not exists shop_sales_window_idx on public.shop_sales (is_active, starts_at, ends_at);

create table if not exists public.shop_sale_items (
  sale_id    uuid not null references public.shop_sales(id) on delete cascade,
  item_id    uuid not null references public.cosmetic_items(id) on delete cascade,
  sale_price integer not null check (sale_price >= 1),
  primary key (sale_id, item_id)
);
create index if not exists shop_sale_items_item_idx on public.shop_sale_items (item_id);

create table if not exists public.shop_features (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  title       text not null check (char_length(btrim(title)) between 2 and 60),
  subtitle    text check (subtitle is null or char_length(subtitle) <= 160),
  cta         text not null default 'Ver la selección' check (char_length(cta) between 2 and 30),
  theme       text not null default 'halloween' check (theme ~ '^[a-z]{3,12}$'),
  collections text[] not null default '{}',      -- colecciones que entran en la selección
  item_ids    uuid[] not null default '{}',      -- cosméticos sueltos que también entran
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz,                       -- null = sin fecha de fin
  is_active   boolean not null default true,
  sort        integer not null default 0,
  created_at  timestamptz not null default now(),
  constraint shop_features_window check (ends_at is null or ends_at > starts_at)
);

create table if not exists public.shop_wishlist (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  item_id    uuid not null references public.cosmetic_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
create index if not exists shop_wishlist_item_idx on public.shop_wishlist (item_id);

-- Nadie toca estas tablas desde el navegador: solo las funciones de abajo (security definer).
alter table public.shop_sales      enable row level security;
alter table public.shop_sale_items enable row level security;
alter table public.shop_features   enable row level security;
alter table public.shop_wishlist   enable row level security;
revoke all on public.shop_sales, public.shop_sale_items, public.shop_features, public.shop_wishlist from anon, authenticated;


-- ---------------------------------------------------------------------
-- 2) PRECIO VIGENTE (con oferta) · interno
-- ---------------------------------------------------------------------
-- Devuelve el precio rebajado más bajo de las ofertas activas AHORA, o null si no hay oferta.
-- Una oferta solo cuenta si de verdad baja el precio de lista y el ítem se vende en la tienda.
create or replace function public.cos_sale_price(p_item uuid)
returns integer
language sql stable security definer set search_path = public as $$
  select min(si.sale_price)::int
    from public.shop_sale_items si
    join public.shop_sales sa on sa.id = si.sale_id
    join public.cosmetic_items i on i.id = si.item_id
   where si.item_id = p_item
     and sa.is_active and now() >= sa.starts_at and now() < sa.ends_at
     and i.obtainable = 'tienda' and i.price > 0 and si.sale_price < i.price;
$$;


-- ---------------------------------------------------------------------
-- 3) CATÁLOGO DE LA TIENDA (ahora con ofertas y deseos)
-- ---------------------------------------------------------------------
-- Cambia el tipo de lo que devuelve, por eso se borra primero.
drop function if exists public.shop_catalog();
create or replace function public.shop_catalog()
returns table (
  id uuid, type text, slug text, name text, rarity text, price integer, collection text,
  min_size integer, custom_hue boolean, palettes text[], meta jsonb, obtainable text, release_version text, owned boolean,
  base_price integer, sale_id uuid, sale_name text, sale_ends_at timestamptz, wished boolean
)
language sql stable security definer set search_path = public as $$
  select i.id, i.type, i.slug, i.name, i.rarity,
         coalesce(s.sale_price, i.price) as price,          -- el que se cobra AHORA
         i.collection, i.min_size, i.custom_hue, i.palettes, i.meta, i.obtainable, i.release_version,
         public.cos_owns(auth.uid(), i.id),
         i.price as base_price,                               -- el de lista
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
   order by c.sort, i.type, i.price, i.name;
$$;


-- ---------------------------------------------------------------------
-- 4) COMPRAR: se cobra el precio vigente (oferta incluida)
-- ---------------------------------------------------------------------
create or replace function public.shop_buy(p_item uuid, p_expected_price integer, p_key uuid default gen_random_uuid())
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  i       public.cosmetic_items;
  c       public.cosmetic_collections;
  v_price integer;
  res     jsonb;
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  -- doble toque o reintento con la misma clave: no se cobra dos veces
  if exists (select 1 from public.coin_ledger where idempotency_key = 'shop:' || p_key::text) then
    return jsonb_build_object('ok', true, 'replayed', true, 'balance', public.coins_balance());
  end if;
  select * into i from public.cosmetic_items where id = p_item;
  if not found then raise exception 'Ese cosmético no existe'; end if;
  select * into c from public.cosmetic_collections where id = i.collection;
  if not i.is_active or not coalesce(c.is_active, false) then raise exception 'Ese cosmético todavía no está disponible'; end if;
  if i.obtainable <> 'tienda' or i.price <= 0 then raise exception 'Este cosmético no se vende en la tienda'; end if;

  -- se bloquea la billetera: dos pestañas comprando a la vez se ponen en fila
  insert into public.user_wallets (user_id) values (v_me) on conflict (user_id) do nothing;
  perform 1 from public.user_wallets where user_id = v_me for update;

  if exists (select 1 from public.user_cosmetics where user_id = v_me and item_id = i.id) then
    raise exception 'Ya tienes este cosmético';
  end if;

  v_price := coalesce(public.cos_sale_price(i.id), i.price);
  if p_expected_price is distinct from v_price then
    raise exception 'El precio cambió: ahora cuesta % ☾', v_price using errcode = 'P0001';
  end if;

  res := public.coins_apply(v_me, -v_price, 'shop_buy', 'cosmetic', i.id::text, 'shop:' || p_key::text);
  perform public.cos_grant(v_me, i.id, 'shop', v_price);
  perform public.cos_check_collection(v_me, i.collection);
  delete from public.shop_wishlist where user_id = v_me and item_id = i.id;   -- ya es tuyo: sale de tus deseos
  return jsonb_build_object('ok', true, 'balance', (res ->> 'balance')::int, 'type', i.type, 'slug', i.slug, 'name', i.name);
end;
$$;


-- ---------------------------------------------------------------------
-- 5) PACKS: el mejor de dos precios (−20 % de pack  ó  suma de los precios vigentes con oferta)
-- ---------------------------------------------------------------------
create or replace function public.shop_pack_quote(p_collection text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  c       public.cosmetic_collections;
  v_full  integer;
  v_eff   integer;
  v_disc  integer := public.cos_pack_discount();
  v_price integer;
  v_items jsonb;
begin
  if v_me is null then return null; end if;
  select * into c from public.cosmetic_collections where id = p_collection and is_active and has_pack;
  if not found then return null; end if;
  select coalesce(sum(i.price), 0)::int,
         coalesce(sum(coalesce(public.cos_sale_price(i.id), i.price)), 0)::int,
         coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'type', i.type, 'slug', i.slug, 'name', i.name, 'price', i.price,
                                               'eff', coalesce(public.cos_sale_price(i.id), i.price)) order by i.type, i.price), '[]'::jsonb)
    into v_full, v_eff, v_items
    from public.cosmetic_items i
   where i.is_active and i.obtainable = 'tienda' and i.price > 0
     and ((i.collection = c.id and i.type = 'avatar_decoration')
          or (i.type = 'profile_card' and i.slug = c.pack_card)
          or (i.type = 'entry_effect' and i.slug = c.pack_effect))
     and not exists (select 1 from public.user_cosmetics uc where uc.user_id = v_me and uc.item_id = i.id);
  v_price := least(floor(v_full * (100 - v_disc) / 100.0)::int, v_eff);
  return jsonb_build_object(
    'collection', c.id, 'items', v_items, 'full_price', v_full,
    'discount_pct', case when v_full > 0 then round(100.0 - v_price * 100.0 / v_full)::int else 0 end,
    'price', v_price
  );
end;
$$;

create or replace function public.shop_buy_pack(p_collection text, p_expected_price integer, p_key uuid default gen_random_uuid())
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  q      jsonb;
  it     jsonb;
  v_disc integer := public.cos_pack_discount();
  res    jsonb;
  n      integer := 0;
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  if exists (select 1 from public.coin_ledger where idempotency_key = 'shop:' || p_key::text) then
    return jsonb_build_object('ok', true, 'replayed', true, 'balance', public.coins_balance());
  end if;
  insert into public.user_wallets (user_id) values (v_me) on conflict (user_id) do nothing;
  perform 1 from public.user_wallets where user_id = v_me for update;

  q := public.shop_pack_quote(p_collection);
  if q is null then raise exception 'Ese pack no está disponible'; end if;
  if jsonb_array_length(q -> 'items') = 0 then raise exception 'Ya tienes todo lo de este pack'; end if;
  if p_expected_price is distinct from (q ->> 'price')::int then
    raise exception 'El precio cambió: ahora cuesta % ☾', (q ->> 'price') using errcode = 'P0001';
  end if;

  res := public.coins_apply(v_me, -(q ->> 'price')::int, 'shop_buy', 'pack', p_collection, 'shop:' || p_key::text);
  for it in select * from jsonb_array_elements(q -> 'items') loop
    if public.cos_grant(v_me, (it ->> 'id')::uuid, 'pack',
         least(floor((it ->> 'price')::int * (100 - v_disc) / 100.0)::int, (it ->> 'eff')::int)) then
      n := n + 1;
      delete from public.shop_wishlist where user_id = v_me and item_id = (it ->> 'id')::uuid;
    end if;
  end loop;
  perform public.cos_check_collection(v_me, p_collection);
  return jsonb_build_object('ok', true, 'balance', (res ->> 'balance')::int, 'items', n);
end;
$$;


-- ---------------------------------------------------------------------
-- 6) LO QUE VE LA GENTE: ofertas y selecciones activas, y la lista de deseos
-- ---------------------------------------------------------------------
-- Ofertas activas AHORA (solo las que tienen al menos un ítem visible). Los ítems vienen en shop_catalog (sale_id).
create or replace function public.shop_sales_active()
returns table (id uuid, name text, blurb text, kind text, theme text, starts_at timestamptz, ends_at timestamptz, in_banner boolean, sort integer)
language sql stable security definer set search_path = public as $$
  select s.id, s.name, s.blurb, s.kind, s.theme, s.starts_at, s.ends_at, s.in_banner, s.sort
    from public.shop_sales s
   where auth.uid() is not null
     and s.is_active and now() >= s.starts_at and now() < s.ends_at
     and exists (
       select 1 from public.shop_sale_items si
         join public.cosmetic_items i on i.id = si.item_id
         join public.cosmetic_collections c on c.id = i.collection
        where si.sale_id = s.id and i.is_active and c.is_active and i.obtainable = 'tienda' and i.price > 0 and si.sale_price < i.price)
   order by s.sort, s.ends_at;
$$;

-- Selecciones del banner principal (las vigentes)
create or replace function public.shop_features_active()
returns table (id uuid, slug text, title text, subtitle text, cta text, theme text, collections text[], item_ids uuid[], starts_at timestamptz, ends_at timestamptz, sort integer)
language sql stable security definer set search_path = public as $$
  select f.id, f.slug, f.title, f.subtitle, f.cta, f.theme, f.collections, f.item_ids, f.starts_at, f.ends_at, f.sort
    from public.shop_features f
   where auth.uid() is not null
     and f.is_active and now() >= f.starts_at and (f.ends_at is null or now() < f.ends_at)
   order by f.sort, f.starts_at desc;
$$;

-- Corazón: agrega o quita un cosmético de mi lista de deseos. Devuelve true si quedó en la lista.
create or replace function public.shop_wish_toggle(p_item uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  if exists (select 1 from public.shop_wishlist where user_id = v_me and item_id = p_item) then
    delete from public.shop_wishlist where user_id = v_me and item_id = p_item;
    return false;
  end if;
  if not exists (select 1 from public.cosmetic_items i join public.cosmetic_collections c on c.id = i.collection
                  where i.id = p_item and i.is_active and c.is_active and i.obtainable = 'tienda') then
    raise exception 'Ese cosmético no está en la tienda';
  end if;
  if (select count(*) from public.shop_wishlist where user_id = v_me) >= 200 then
    raise exception 'Tu lista de deseos está llena (máximo 200)';
  end if;
  insert into public.shop_wishlist (user_id, item_id) values (v_me, p_item) on conflict do nothing;
  return true;
end;
$$;


-- ---------------------------------------------------------------------
-- 7) PANEL DEL EQUIPO (permiso «manage_shop»)
-- ---------------------------------------------------------------------
-- 7.1 Todo el catálogo para el Centro de Mando (ahora con nombre de colección, oferta vigente y deseos)
drop function if exists public.admin_cosmetic_list();
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
     order by c.sort, i.type, i.price, i.name;
end;
$$;

-- 7.2 Colecciones (para armar selecciones y ofertas por colección)
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
    into v from public.cosmetic_collections c;
  return v;
end;
$$;

-- 7.3 Ofertas: lista completa (activas, programadas, terminadas, pausadas) con sus ítems
create or replace function public.admin_shop_sales()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id, 'name', s.name, 'blurb', s.blurb, 'kind', s.kind, 'theme', s.theme,
    'starts_at', s.starts_at, 'ends_at', s.ends_at, 'is_active', s.is_active, 'in_banner', s.in_banner, 'sort', s.sort,
    'status', case when not s.is_active then 'pausada' when now() < s.starts_at then 'programada' when now() >= s.ends_at then 'terminada' else 'activa' end,
    'items', coalesce((select jsonb_agg(jsonb_build_object('item_id', si.item_id, 'sale_price', si.sale_price)) from public.shop_sale_items si where si.sale_id = s.id), '[]'::jsonb)
  ) order by (s.is_active and s.ends_at > now()) desc, s.ends_at desc), '[]'::jsonb)
    into v from public.shop_sales s;
  return v;
end;
$$;

-- 7.4 Crear / editar una oferta. p_id null = nueva. p_data:
--     { name, blurb, kind, theme, starts_at, ends_at, is_active, in_banner, sort, items: [{ item_id, sale_price }] }
create or replace function public.admin_shop_sale_save(p_id uuid, p_data jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id     uuid := p_id;
  v_name   text := btrim(coalesce(p_data ->> 'name', ''));
  v_blurb  text := nullif(btrim(coalesce(p_data ->> 'blurb', '')), '');
  v_kind   text := coalesce(nullif(p_data ->> 'kind', ''), 'oferta');
  v_theme  text := coalesce(nullif(p_data ->> 'theme', ''), 'garnet');
  v_start  timestamptz := coalesce(nullif(p_data ->> 'starts_at', '')::timestamptz, now());
  v_end    timestamptz := nullif(p_data ->> 'ends_at', '')::timestamptz;
  v_active boolean := coalesce((p_data ->> 'is_active')::boolean, true);
  v_banner boolean := coalesce((p_data ->> 'in_banner')::boolean, true);
  v_sort   integer := coalesce((p_data ->> 'sort')::int, 0);
  it       jsonb;
  v_item   public.cosmetic_items;
  v_sp     integer;
  n        integer := 0;
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 60 then raise exception 'El nombre de la oferta debe tener entre 2 y 60 letras'; end if;
  if v_blurb is not null and char_length(v_blurb) > 140 then raise exception 'La frase corta puede tener hasta 140 letras'; end if;
  if v_kind not in ('oferta', 'dia', 'semana', 'evento') then raise exception 'Tipo de oferta no válido'; end if;
  if v_theme !~ '^[a-z]{3,12}$' then raise exception 'Tema no válido'; end if;
  if v_end is null then raise exception 'Falta la fecha y hora en que termina la oferta'; end if;
  if v_end <= v_start then raise exception 'La oferta debe terminar después de empezar'; end if;
  if p_id is null and v_end <= now() then raise exception 'La fecha de fin ya pasó'; end if;
  if jsonb_typeof(p_data -> 'items') is distinct from 'array' or jsonb_array_length(p_data -> 'items') = 0 then
    raise exception 'Elige al menos un cosmético para la oferta';
  end if;
  if jsonb_array_length(p_data -> 'items') > 300 then raise exception 'Máximo 300 cosméticos por oferta'; end if;

  if p_id is null then
    insert into public.shop_sales (name, blurb, kind, theme, starts_at, ends_at, is_active, in_banner, sort, created_by)
    values (v_name, v_blurb, v_kind, v_theme, v_start, v_end, v_active, v_banner, v_sort, auth.uid())
    returning id into v_id;
  else
    update public.shop_sales
       set name = v_name, blurb = v_blurb, kind = v_kind, theme = v_theme, starts_at = v_start, ends_at = v_end,
           is_active = v_active, in_banner = v_banner, sort = v_sort
     where id = p_id;
    if not found then raise exception 'Esa oferta no existe'; end if;
    delete from public.shop_sale_items where sale_id = p_id;
  end if;

  for it in select * from jsonb_array_elements(p_data -> 'items') loop
    select * into v_item from public.cosmetic_items where id = (it ->> 'item_id')::uuid;
    if not found then raise exception 'Un cosmético de la lista ya no existe'; end if;
    if v_item.obtainable <> 'tienda' or v_item.price <= 0 then raise exception '«%» no se vende en la tienda, no puede tener oferta', v_item.name; end if;
    v_sp := (it ->> 'sale_price')::int;
    if v_sp is null or v_sp < 1 then raise exception 'El precio de oferta de «%» debe ser de al menos 1 ☾', v_item.name; end if;
    if v_sp >= v_item.price then raise exception 'El precio de oferta de «%» (% ☾) debe ser menor que el normal (% ☾)', v_item.name, v_sp, v_item.price; end if;
    insert into public.shop_sale_items (sale_id, item_id, sale_price) values (v_id, v_item.id, v_sp)
    on conflict (sale_id, item_id) do update set sale_price = excluded.sale_price;
    n := n + 1;
  end loop;

  perform public.eco_log('shop_sale_save', v_id::text, jsonb_build_object('name', v_name, 'items', n, 'ends_at', v_end, 'new', p_id is null));
  return jsonb_build_object('id', v_id, 'items', n);
end;
$$;

-- 7.5 Pausar / reanudar, terminar ya, borrar
create or replace function public.admin_shop_sale_set_active(p_id uuid, p_active boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  update public.shop_sales set is_active = coalesce(p_active, true) where id = p_id;
  if not found then raise exception 'Esa oferta no existe'; end if;
  perform public.eco_log('shop_sale_active', p_id::text, jsonb_build_object('active', p_active));
end;
$$;

create or replace function public.admin_shop_sale_end(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  -- termina ahora (starts_at se ajusta por si estaba programada para el futuro)
  update public.shop_sales set starts_at = least(starts_at, now() - interval '1 second'), ends_at = now() where id = p_id;
  if not found then raise exception 'Esa oferta no existe'; end if;
  perform public.eco_log('shop_sale_end', p_id::text, '{}'::jsonb);
end;
$$;

create or replace function public.admin_shop_sale_delete(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  delete from public.shop_sales where id = p_id;
  if not found then raise exception 'Esa oferta no existe'; end if;
  perform public.eco_log('shop_sale_delete', p_id::text, '{}'::jsonb);
end;
$$;

-- 7.6 Selecciones del banner principal
create or replace function public.admin_shop_features()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', f.id, 'slug', f.slug, 'title', f.title, 'subtitle', f.subtitle, 'cta', f.cta, 'theme', f.theme,
    'collections', to_jsonb(f.collections), 'item_ids', to_jsonb(f.item_ids),
    'starts_at', f.starts_at, 'ends_at', f.ends_at, 'is_active', f.is_active, 'sort', f.sort,
    'status', case when not f.is_active then 'pausada' when now() < f.starts_at then 'programada'
                   when f.ends_at is not null and now() >= f.ends_at then 'terminada' else 'activa' end
  ) order by f.sort, f.starts_at desc), '[]'::jsonb)
    into v from public.shop_features f;
  return v;
end;
$$;

-- p_data: { slug, title, subtitle, cta, theme, collections: [], item_ids: [], starts_at, ends_at (opcional), is_active, sort }
create or replace function public.admin_shop_feature_save(p_id uuid, p_data jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id    uuid := p_id;
  v_slug  text := lower(btrim(coalesce(p_data ->> 'slug', '')));
  v_title text := btrim(coalesce(p_data ->> 'title', ''));
  v_sub   text := nullif(btrim(coalesce(p_data ->> 'subtitle', '')), '');
  v_cta   text := coalesce(nullif(btrim(coalesce(p_data ->> 'cta', '')), ''), 'Ver la selección');
  v_theme text := coalesce(nullif(p_data ->> 'theme', ''), 'halloween');
  v_colls text[] := coalesce(array(select jsonb_array_elements_text(coalesce(p_data -> 'collections', '[]'::jsonb))), '{}');
  v_items uuid[] := coalesce(array(select (jsonb_array_elements_text(coalesce(p_data -> 'item_ids', '[]'::jsonb)))::uuid), '{}');
  v_start timestamptz := coalesce(nullif(p_data ->> 'starts_at', '')::timestamptz, now());
  v_end   timestamptz := nullif(p_data ->> 'ends_at', '')::timestamptz;
  v_act   boolean := coalesce((p_data ->> 'is_active')::boolean, true);
  v_sort  integer := coalesce((p_data ->> 'sort')::int, 0);
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  if v_slug !~ '^[a-z0-9-]{2,40}$' then raise exception 'El enlace solo puede llevar letras sin tilde, números y guiones (2 a 40)'; end if;
  if char_length(v_title) < 2 or char_length(v_title) > 60 then raise exception 'El título debe tener entre 2 y 60 letras'; end if;
  if v_sub is not null and char_length(v_sub) > 160 then raise exception 'La frase puede tener hasta 160 letras'; end if;
  if char_length(v_cta) < 2 or char_length(v_cta) > 30 then raise exception 'El texto del botón debe tener entre 2 y 30 letras'; end if;
  if v_theme !~ '^[a-z]{3,12}$' then raise exception 'Tema no válido'; end if;
  if v_end is not null and v_end <= v_start then raise exception 'La selección debe terminar después de empezar'; end if;
  if coalesce(array_length(v_colls, 1), 0) = 0 and coalesce(array_length(v_items, 1), 0) = 0 then
    raise exception 'Elige al menos una colección o un cosmético para la selección';
  end if;
  if exists (select 1 from unnest(v_colls) x where not exists (select 1 from public.cosmetic_collections c where c.id = x)) then
    raise exception 'Una de las colecciones no existe';
  end if;
  if exists (select 1 from unnest(v_items) x where not exists (select 1 from public.cosmetic_items i where i.id = x)) then
    raise exception 'Uno de los cosméticos no existe';
  end if;

  if p_id is null then
    insert into public.shop_features (slug, title, subtitle, cta, theme, collections, item_ids, starts_at, ends_at, is_active, sort)
    values (v_slug, v_title, v_sub, v_cta, v_theme, v_colls, v_items, v_start, v_end, v_act, v_sort)
    returning id into v_id;
  else
    update public.shop_features
       set slug = v_slug, title = v_title, subtitle = v_sub, cta = v_cta, theme = v_theme, collections = v_colls, item_ids = v_items,
           starts_at = v_start, ends_at = v_end, is_active = v_act, sort = v_sort
     where id = p_id;
    if not found then raise exception 'Esa selección no existe'; end if;
  end if;
  perform public.eco_log('shop_feature_save', v_id::text, jsonb_build_object('title', v_title, 'collections', v_colls));
  return jsonb_build_object('id', v_id);
exception when unique_violation then
  raise exception 'Ya hay una selección con ese enlace, cámbialo un poco';
end;
$$;

create or replace function public.admin_shop_feature_delete(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  delete from public.shop_features where id = p_id;
  if not found then raise exception 'Esa selección no existe'; end if;
  perform public.eco_log('shop_feature_delete', p_id::text, '{}'::jsonb);
end;
$$;


-- ---------------------------------------------------------------------
-- 8) PERMISOS DE LAS FUNCIONES NUEVAS (todo cerrado; se abre solo lo que usa la página)
-- ---------------------------------------------------------------------
revoke all on function
  public.cos_sale_price(uuid),
  public.shop_catalog(),
  public.shop_sales_active(), public.shop_features_active(), public.shop_wish_toggle(uuid),
  public.admin_cosmetic_list(), public.admin_shop_collections(),
  public.admin_shop_sales(), public.admin_shop_sale_save(uuid, jsonb), public.admin_shop_sale_set_active(uuid, boolean),
  public.admin_shop_sale_end(uuid), public.admin_shop_sale_delete(uuid),
  public.admin_shop_features(), public.admin_shop_feature_save(uuid, jsonb), public.admin_shop_feature_delete(uuid)
from public, anon, authenticated;

grant execute on function
  public.shop_catalog(),
  public.shop_sales_active(), public.shop_features_active(), public.shop_wish_toggle(uuid),
  public.admin_cosmetic_list(), public.admin_shop_collections(),
  public.admin_shop_sales(), public.admin_shop_sale_save(uuid, jsonb), public.admin_shop_sale_set_active(uuid, boolean),
  public.admin_shop_sale_end(uuid), public.admin_shop_sale_delete(uuid),
  public.admin_shop_features(), public.admin_shop_feature_save(uuid, jsonb), public.admin_shop_feature_delete(uuid)
to authenticated;
-- cos_sale_price es interna (la usan las otras funciones); el navegador no la llama.

-- ---------------------------------------------------------------------
-- 9) BANNERS CON GIF: el bucket «avatars» acepta GIF y hasta 25 MB por archivo (el tope lo hace cumplir el servidor)
-- ---------------------------------------------------------------------
do $$
begin
  if to_regclass('storage.buckets') is not null then
    update storage.buckets set file_size_limit = 26214400
     where id = 'avatars' and (file_size_limit is null or file_size_limit < 26214400);
    update storage.buckets
       set allowed_mime_types = array(select distinct x from unnest(allowed_mime_types || array['image/gif']) as x)
     where id = 'avatars' and allowed_mime_types is not null and not ('image/gif' = any (allowed_mime_types));
  end if;
end $$;

notify pgrst, 'reload schema';

-- Listo. Siguiente: v1.5.0_catalogo_halloween.sql  (las 7 colecciones nuevas)  y luego  v1.5.0_lanzar_halloween.sql
