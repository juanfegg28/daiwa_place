-- =====================================================================
-- DaiwaPlace v1.4.0 «Tienda y Estilo»
-- Pega este archivo COMPLETO en Supabase → SQL Editor y ejecútalo; DESPUÉS pega y ejecuta
-- v1.4.0_catalogo.sql (los ítems). Es idempotente: se puede correr varias veces sin que falle ni duplique nada.
-- Córrelo ANTES de subir el código nuevo a Vercel (solo agrega cosas: lo viejo sigue funcionando).
-- Requiere haber corrido antes la v1.3.0 (Lunas y Misiones).
--
-- Qué hace:
--   1) Ajustes nuevos (descuento de packs, premio por colección, bienvenida).
--   2) Tablas: colecciones, cosméticos, inventario, acceso del equipo y reclamos únicos.
--   3) Columnas nuevas en profiles (lo que llevas puesto) y el GUARDIÁN que impide
--      equipar algo que todavía no está lanzado (la versión 1.5.0 queda cerrada con llave).
--   4) Tienda: catálogo, compra, packs por colección y premio por completar una colección.
--   5) Inventario y «Guardar mi look» (ÚNICO camino para escribir lo que llevas puesto).
--   6) Pack Bienvenida y Pack Fundador (cosméticos).
--   7) Misiones: logros «5 cosméticos» y «primera colección» + equipar cuenta como cambio de perfil.
--   8) Acceso del equipo (renshsh): todo el catálogo gratis, incluido lo que viene.
--   9) Panel del equipo, seguridad (RLS) y permisos de las funciones.
--
-- REGLA DE ORO (igual que en la v1.3.0): el servidor decide TODO lo económico y lo que es dueño de qué.
-- El navegador solo pide. Precios, saldo, packs y «qué llevas puesto» no se pueden falsear desde la consola.
--
-- REGLA DE LA 1.5.0: todo lo que tenga release_version = '1.5.0' existe en la base pero con is_active = false.
-- Tienda, inventario, packs, misiones y perfiles solo leen ítems activos, y el guardián de profiles
-- rechaza cualquier cosmético inactivo. Lanzarla = correr v1.5.0_activar_sangre_noir_y_emo.sql (un UPDATE).
--
-- Notas de diseño que cambian un poco el plan original (gana el código real):
--   · (type, slug) es único, NO solo slug: «nebulosa», «luciernagas», «colmillos» y «aurora» existen
--     en dos tipos distintos (p. ej. decoración y fondo).
--   · Las paletas de cada ítem se guardan como lista de ids; los colores viven en el código de la app.
--   · Lo que llevas puesto va en columnas de profiles que SOLO se escriben con cosmetic_save_look().
-- =====================================================================


-- =====================================================================
-- 1) AJUSTES (solo se crean si no existen; se cambian en Centro de Mando → Tienda y Lunas → Ajustes)
-- =====================================================================
insert into public.app_settings (key, value) values ('cosmetics_pack_discount_pct',  to_jsonb(20))   on conflict (key) do nothing;
insert into public.app_settings (key, value) values ('cosmetics_collection_reward',  to_jsonb(400))  on conflict (key) do nothing;
insert into public.app_settings (key, value) values ('cosmetics_welcome_decos',      to_jsonb(3))    on conflict (key) do nothing;
insert into public.app_settings (key, value) values ('cosmetics_welcome_fonts',      to_jsonb(3))    on conflict (key) do nothing;
insert into public.app_settings (key, value) values ('cosmetics_welcome_titles',     to_jsonb(3))    on conflict (key) do nothing;
-- «on»: las cuentas del equipo con acceso total ven en su estudio lo que viene (solo para probar, nunca en perfiles).
insert into public.app_settings (key, value) values ('cosmetics_staff_preview',      to_jsonb('on'::text)) on conflict (key) do nothing;


-- =====================================================================
-- 2) TABLAS
-- =====================================================================

-- 2.1 Colecciones (Noctis Gótico, Velvet Rouge…). «base» agrupa lo suelto y «miticas» lo que no se compra.
create table if not exists public.cosmetic_collections (
  id              text primary key,
  name            text not null,
  theme           text,
  kind            text not null default 'coleccion' check (kind in ('coleccion', 'base', 'miticas')),
  release_version text not null default '1.4.0',
  is_active       boolean not null default false,
  has_pack        boolean not null default false,   -- ¿tiene pack con -20 %?
  pack_card       text,                             -- slug de la tarjeta que incluye el pack
  pack_effect     text,                             -- slug del efecto de entrada que incluye el pack
  completion_title text,                            -- nombre del título exclusivo al completarla
  sort            integer not null default 0
);

-- 2.2 Cosméticos. Una fila por ítem. El diseño vive en el código (carpeta _kit); aquí solo sus datos.
create table if not exists public.cosmetic_items (
  id              uuid primary key default gen_random_uuid(),
  type            text not null check (type in ('avatar_decoration', 'profile_card', 'entry_effect', 'name_effect', 'background', 'title', 'font', 'badge')),
  slug            text not null check (slug ~ '^[a-z0-9-]{1,48}$'),
  name            text not null,
  rarity          text not null check (rarity in ('comun', 'raro', 'epico', 'legendario', 'mitico')),
  price           integer not null default 0 check (price >= 0),
  collection      text not null references public.cosmetic_collections(id),
  min_size        integer,                          -- tamaño mínimo del avatar (px) para dibujar la decoración
  custom_hue      boolean not null default false,   -- ¿admite color libre? (Legendarios y Míticos)
  palettes        text[] not null default '{}',     -- ids de paletas incluidas con la compra
  meta            jsonb not null default '{}'::jsonb,
  origin          text not null default 'codigo' check (origin in ('codigo', 'artista', 'cc0', 'licencia', 'ia')),
  license         text not null default 'Propia',
  author          text,
  obtainable      text not null default 'tienda' check (obtainable in ('tienda', 'gratis', 'logro', 'evento', 'fundador')),
  release_version text not null default '1.4.0',
  is_active       boolean not null default false,
  created_at      timestamptz not null default now()
);
-- Si la tabla ya existía de un intento anterior, se aseguran las dos columnas de versiones (ver releases.sql del kit)
alter table public.cosmetic_items add column if not exists release_version text not null default '1.4.0';
alter table public.cosmetic_items add column if not exists is_active boolean not null default false;
create unique index if not exists cosmetic_items_type_slug_uq on public.cosmetic_items (type, slug);
create index if not exists cosmetic_items_active_idx on public.cosmetic_items (is_active, type);
create index if not exists cosmetic_items_coll_idx on public.cosmetic_items (collection);
create index if not exists cosmetic_items_release_idx on public.cosmetic_items (release_version);

-- 2.3 Inventario (privado: solo su dueño). Lo que ya compraste es tuyo para siempre.
create table if not exists public.user_cosmetics (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  item_id     uuid not null references public.cosmetic_items(id) on delete restrict,
  acquired_at timestamptz not null default now(),
  source      text not null default 'shop' check (source in ('shop', 'pack', 'welcome', 'founder', 'collection', 'logro', 'staff_grant', 'code', 'evento')),
  price_paid  integer not null default 0 check (price_paid >= 0),
  primary key (user_id, item_id)
);
create index if not exists user_cosmetics_item_idx on public.user_cosmetics (item_id);

-- 2.4 Cuentas del equipo con acceso a TODO el catálogo (gratis), incluido lo que viene.
create table if not exists public.cosmetic_staff_access (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

-- 2.5 Reclamos de una sola vez (Pack Bienvenida, cosméticos del Pack Fundador)
create table if not exists public.cosmetic_claims (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('welcome_pack', 'founder_items')),
  claimed_at timestamptz not null default now(),
  primary key (user_id, kind)
);


-- =====================================================================
-- 3) LO QUE LLEVAS PUESTO (columnas de profiles) Y EL GUARDIÁN
-- =====================================================================
-- Cada columna guarda SLUGS (no archivos ni HTML): {"id":"halo-roto","palette":"plata","hue":0}
alter table public.profiles add column if not exists avatar_deco  jsonb;   -- decoración del avatar
alter table public.profiles add column if not exists name_style   jsonb;   -- {"font":"pirata-one","effect":{"id":"neon","palette":"rosa","hue":0}}
alter table public.profiles add column if not exists title_style  jsonb;   -- {"id":"alma-nocturna","palette":"a"}
alter table public.profiles add column if not exists card_style   jsonb;   -- estilo de tarjeta de perfil
alter table public.profiles add column if not exists entry_effect jsonb;   -- efecto de entrada al perfil
alter table public.profiles add column if not exists profile_bg   jsonb;   -- fondo prediseñado del perfil

alter table public.profiles drop constraint if exists profiles_cosmetics_shape_check;
alter table public.profiles add constraint profiles_cosmetics_shape_check check (
  (avatar_deco  is null or (jsonb_typeof(avatar_deco)  = 'object' and octet_length(avatar_deco::text)  <= 160)) and
  (name_style   is null or (jsonb_typeof(name_style)   = 'object' and octet_length(name_style::text)   <= 260)) and
  (title_style  is null or (jsonb_typeof(title_style)  = 'object' and octet_length(title_style::text)  <= 160)) and
  (card_style   is null or (jsonb_typeof(card_style)   = 'object' and octet_length(card_style::text)   <= 160)) and
  (entry_effect is null or (jsonb_typeof(entry_effect) = 'object' and octet_length(entry_effect::text) <= 160)) and
  (profile_bg   is null or (jsonb_typeof(profile_bg)   = 'object' and octet_length(profile_bg::text)   <= 160))
);

-- Se LEEN igual que el resto del perfil, pero NO se pueden escribir desde el navegador (sin grant update):
-- el único camino es cosmetic_save_look(), que comprueba que el ítem sea tuyo y esté lanzado.
grant select (avatar_deco, name_style, title_style, card_style, entry_effect, profile_bg) on public.profiles to authenticated;
-- (por si acaso: si alguna vez se dio UPDATE por columna sobre estas, se quita; el guardián de abajo cubre también el UPDATE general de la tabla)
revoke update (avatar_deco, name_style, title_style, card_style, entry_effect, profile_bg) on public.profiles from anon, authenticated;

-- 3.1 ¿Qué cosméticos referencia este perfil que NO están activos? (devuelve el primero que encuentre, o null)
create or replace function public.cos_inactive_ref(p_type text, p_slug text)
returns text
language sql stable security definer set search_path = public as $$
  select case
    when p_slug is null then null
    when exists (
      select 1 from public.cosmetic_items i join public.cosmetic_collections c on c.id = i.collection
      where i.type = p_type and i.slug = p_slug and i.is_active and c.is_active
    ) then null
    else p_slug
  end;
$$;

-- 3.2 EL GUARDIÁN: ningún perfil puede quedar con un cosmético que no esté lanzado, y NADIE desde el navegador
--     puede escribir estas columnas directo (aunque la tabla profiles tenga permiso de UPDATE general: en Supabase lo
--     tiene). Solo cosmetic_save_look() (que corre como dueño de la base) puede escribirlas, y esa sí comprueba que el
--     ítem sea tuyo. Esta función NO es security definer a propósito: así current_user es quien hace la escritura
--     («authenticated»/«anon» = el navegador; el dueño de la base = una función del servidor o el SQL Editor).
create or replace function public.trg_profiles_cosmetics_guard()
returns trigger language plpgsql set search_path = public as $$
declare bad text;
begin
  if tg_op = 'UPDATE'
     and new.avatar_deco is not distinct from old.avatar_deco
     and new.name_style is not distinct from old.name_style
     and new.title_style is not distinct from old.title_style
     and new.card_style is not distinct from old.card_style
     and new.entry_effect is not distinct from old.entry_effect
     and new.profile_bg is not distinct from old.profile_bg then
    return new;
  end if;
  if tg_op = 'INSERT'
     and new.avatar_deco is null and new.name_style is null and new.title_style is null
     and new.card_style is null and new.entry_effect is null and new.profile_bg is null then
    return new;
  end if;
  if current_user in ('authenticated', 'anon') then
    raise exception 'Los cosméticos solo se cambian desde Personalizar' using errcode = '42501';
  end if;
  bad := coalesce(
    public.cos_inactive_ref('avatar_decoration', new.avatar_deco ->> 'id'),
    public.cos_inactive_ref('font',              new.name_style ->> 'font'),
    public.cos_inactive_ref('name_effect',       new.name_style #>> '{effect,id}'),
    public.cos_inactive_ref('title',             new.title_style ->> 'id'),
    public.cos_inactive_ref('profile_card',      new.card_style ->> 'id'),
    public.cos_inactive_ref('entry_effect',      new.entry_effect ->> 'id'),
    public.cos_inactive_ref('background',        new.profile_bg ->> 'id')
  );
  if bad is not null then
    raise exception 'El cosmético «%» todavía no está disponible', bad using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_cosmetics_guard on public.profiles;
create trigger profiles_cosmetics_guard before insert or update of avatar_deco, name_style, title_style, card_style, entry_effect, profile_bg
  on public.profiles for each row execute function public.trg_profiles_cosmetics_guard();


-- =====================================================================
-- 4) AYUDANTES
-- =====================================================================

-- ¿Esta cuenta tiene el acceso total del equipo?
create or replace function public.cos_is_staff_all(p_user uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select p_user is not null and exists (select 1 from public.cosmetic_staff_access where user_id = p_user);
$$;

-- ¿Puedo ver, solo en mi estudio, lo que todavía no se lanza? (solo cuentas del equipo con acceso total y el interruptor en «on»)
create or replace function public.cos_staff_preview()
returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null
     and public.eco_cfg_text('cosmetics_staff_preview', 'on') = 'on'
     and public.cos_is_staff_all(auth.uid());
$$;

-- ¿Este ítem es mío? (inventario, o fuente gratis para todas las cuentas)
create or replace function public.cos_owns(p_user uuid, p_item uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select p_user is not null and (
    exists (select 1 from public.user_cosmetics where user_id = p_user and item_id = p_item)
    or exists (select 1 from public.cosmetic_items where id = p_item and obtainable = 'gratis')
  );
$$;

-- Da un ítem a alguien (no hace nada si ya lo tiene). Interna.
create or replace function public.cos_grant(p_user uuid, p_item uuid, p_source text, p_price integer default 0)
returns boolean
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  insert into public.user_cosmetics (user_id, item_id, source, price_paid)
  values (p_user, p_item, p_source, greatest(0, coalesce(p_price, 0)))
  on conflict (user_id, item_id) do nothing;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

-- Da un ítem por (tipo, slug), solo si está activo. Interna.
create or replace function public.cos_grant_slug(p_user uuid, p_type text, p_slug text, p_source text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select i.id into v_id
    from public.cosmetic_items i join public.cosmetic_collections c on c.id = i.collection
   where i.type = p_type and i.slug = p_slug and i.is_active and c.is_active;
  if v_id is null then return false; end if;
  return public.cos_grant(p_user, v_id, p_source, 0);
end;
$$;

-- Porcentaje de descuento de los packs
create or replace function public.cos_pack_discount()
returns integer
language sql stable security definer set search_path = public as $$
  select greatest(0, least(90, public.eco_cfg_num('cosmetics_pack_discount_pct', 20)::int));
$$;

-- Cuenta del equipo con acceso total: se le entrega TODO el catálogo (activo o no) y todo lo que se añada después.
create or replace function public.cos_staff_grant_all(p_user uuid)
returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  insert into public.user_cosmetics (user_id, item_id, source, price_paid)
  select p_user, i.id, 'staff_grant', 0 from public.cosmetic_items i
  on conflict (user_id, item_id) do nothing;
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.trg_cosmetic_staff_access_grant()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.cos_staff_grant_all(new.user_id);
  return new;
end;
$$;
drop trigger if exists cosmetic_staff_access_grant on public.cosmetic_staff_access;
create trigger cosmetic_staff_access_grant after insert on public.cosmetic_staff_access
  for each row execute function public.trg_cosmetic_staff_access_grant();

-- Cada ítem nuevo que entre al catálogo llega también (gratis) a las cuentas con acceso total
create or replace function public.trg_cosmetic_items_staff_grant()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_cosmetics (user_id, item_id, source, price_paid)
  select sa.user_id, new.id, 'staff_grant', 0 from public.cosmetic_staff_access sa
  on conflict (user_id, item_id) do nothing;
  return new;
end;
$$;
drop trigger if exists cosmetic_items_staff_grant on public.cosmetic_items;
create trigger cosmetic_items_staff_grant after insert on public.cosmetic_items
  for each row execute function public.trg_cosmetic_items_staff_grant();


-- =====================================================================
-- 5) TIENDA: CATÁLOGO, COLECCIONES, COMPRA Y PACKS
-- =====================================================================

-- 5.1 Catálogo ACTIVO (solo lo lanzado). Incluye si ya es mío.
create or replace function public.shop_catalog()
returns table (
  id uuid, type text, slug text, name text, rarity text, price integer, collection text,
  min_size integer, custom_hue boolean, palettes text[], meta jsonb, obtainable text, release_version text, owned boolean
)
language sql stable security definer set search_path = public as $$
  select i.id, i.type, i.slug, i.name, i.rarity, i.price, i.collection, i.min_size, i.custom_hue, i.palettes, i.meta,
         i.obtainable, i.release_version, public.cos_owns(auth.uid(), i.id)
    from public.cosmetic_items i
    join public.cosmetic_collections c on c.id = i.collection
   where auth.uid() is not null and i.is_active and c.is_active
   order by c.sort, i.type, i.price, i.name;
$$;

-- 5.2 Lo que incluye un pack y cuánto cuesta ahora (descontando lo que ya tienes)
create or replace function public.shop_pack_quote(p_collection text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  c      public.cosmetic_collections;
  v_full integer;
  v_disc integer := public.cos_pack_discount();
  v_items jsonb;
begin
  if v_me is null then return null; end if;
  select * into c from public.cosmetic_collections where id = p_collection and is_active and has_pack;
  if not found then return null; end if;
  select coalesce(sum(i.price), 0)::int,
         coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'type', i.type, 'slug', i.slug, 'name', i.name, 'price', i.price) order by i.type, i.price), '[]'::jsonb)
    into v_full, v_items
    from public.cosmetic_items i
   where i.is_active and i.obtainable = 'tienda' and i.price > 0
     and ((i.collection = c.id and i.type = 'avatar_decoration')
          or (i.type = 'profile_card' and i.slug = c.pack_card)
          or (i.type = 'entry_effect' and i.slug = c.pack_effect))
     and not exists (select 1 from public.user_cosmetics uc where uc.user_id = v_me and uc.item_id = i.id);
  return jsonb_build_object(
    'collection', c.id, 'items', v_items, 'full_price', v_full,
    'discount_pct', v_disc, 'price', floor(v_full * (100 - v_disc) / 100.0)::int
  );
end;
$$;

-- 5.3 Colecciones con mi progreso y el precio del pack
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
      from public.cosmetic_collections c where c.is_active order by c.sort
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

-- 5.4 Premio por completar una colección (todas sus decoraciones): insignia + título exclusivo + Lunas.
--     Se entrega solo una vez (la clave del libro lo garantiza). Interna: la llaman las compras.
create or replace function public.cos_check_collection(p_user uuid, p_collection text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  c         public.cosmetic_collections;
  n_total   integer;
  n_owned   integer;
  v_done    integer;
begin
  select * into c from public.cosmetic_collections where id = p_collection and is_active and kind in ('coleccion', 'miticas');
  if not found then return; end if;
  select count(*)::int, count(uc.item_id)::int into n_total, n_owned
    from public.cosmetic_items i
    left join public.user_cosmetics uc on uc.user_id = p_user and uc.item_id = i.id
   where i.collection = c.id and i.type = 'avatar_decoration' and i.is_active;
  if n_total = 0 or n_owned < n_total then return; end if;

  perform public.cos_grant_slug(p_user, 'badge', c.id, 'collection');
  perform public.cos_grant(p_user, i.id, 'collection', 0)
     from public.cosmetic_items i
    where i.collection = c.id and i.type = 'title' and i.obtainable = 'logro' and i.is_active;
  begin
    perform public.coins_apply(p_user, greatest(1, public.eco_cfg_num('cosmetics_collection_reward', 400)::int),
                               'collection', 'collection', c.id, 'collection:' || c.id || ':' || p_user::text);
  exception when others then null;   -- una cuenta congelada igual conserva su insignia y su título
  end;

  -- Corona de eclipse (Mítica): al completar 3 colecciones
  select count(*)::int into v_done
    from public.user_cosmetics uc join public.cosmetic_items i on i.id = uc.item_id join public.cosmetic_collections cc on cc.id = i.collection
   where uc.user_id = p_user and uc.source = 'collection' and i.type = 'badge' and i.is_active and cc.kind = 'coleccion';
  if v_done >= 3 then perform public.cos_grant_slug(p_user, 'avatar_decoration', 'corona-de-eclipse', 'logro'); end if;
end;
$$;

-- 5.5 Comprar un ítem. Todo lo decide el servidor: precio vigente, saldo, dueño y disponibilidad.
create or replace function public.shop_buy(p_item uuid, p_expected_price integer, p_key uuid default gen_random_uuid())
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  i     public.cosmetic_items;
  c     public.cosmetic_collections;
  res   jsonb;
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
  if p_expected_price is distinct from i.price then
    raise exception 'El precio cambió: ahora cuesta % ☾', i.price using errcode = 'P0001';
  end if;

  res := public.coins_apply(v_me, -i.price, 'shop_buy', 'cosmetic', i.id::text, 'shop:' || p_key::text);
  perform public.cos_grant(v_me, i.id, 'shop', i.price);
  perform public.cos_check_collection(v_me, i.collection);
  return jsonb_build_object('ok', true, 'balance', (res ->> 'balance')::int, 'type', i.type, 'slug', i.slug, 'name', i.name);
end;
$$;

-- 5.6 Comprar el pack de una colección (todas sus decoraciones + 1 tarjeta + 1 efecto), con descuento
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
    if public.cos_grant(v_me, (it ->> 'id')::uuid, 'pack', floor((it ->> 'price')::int * (100 - v_disc) / 100.0)::int) then n := n + 1; end if;
  end loop;
  perform public.cos_check_collection(v_me, p_collection);
  return jsonb_build_object('ok', true, 'balance', (res ->> 'balance')::int, 'items', n);
end;
$$;


-- =====================================================================
-- 6) INVENTARIO Y «GUARDAR MI LOOK»
-- =====================================================================

-- 6.1 Mi inventario (solo lo lanzado; las gratis de todos incluidas por la app, no aquí)
create or replace function public.my_inventory()
returns table (
  id uuid, type text, slug text, name text, rarity text, collection text, min_size integer, custom_hue boolean,
  palettes text[], meta jsonb, obtainable text, source text, acquired_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select i.id, i.type, i.slug, i.name, i.rarity, i.collection, i.min_size, i.custom_hue, i.palettes, i.meta,
         i.obtainable, uc.source, uc.acquired_at
    from public.user_cosmetics uc
    join public.cosmetic_items i on i.id = uc.item_id
    join public.cosmetic_collections c on c.id = i.collection
   where uc.user_id = auth.uid() and i.is_active and c.is_active
   order by uc.acquired_at desc, i.name;
$$;

-- 6.2 SOLO para cuentas del equipo con acceso total: lo que viene (para verlo y probarlo en el estudio).
--     Para cualquier otra cuenta devuelve 0 filas. Nunca se puede equipar ni aparece en perfiles.
create or replace function public.staff_preview_items()
returns table (
  id uuid, type text, slug text, name text, rarity text, price integer, collection text, min_size integer,
  custom_hue boolean, palettes text[], meta jsonb, obtainable text, release_version text, owned boolean
)
language sql stable security definer set search_path = public as $$
  select i.id, i.type, i.slug, i.name, i.rarity, i.price, i.collection, i.min_size, i.custom_hue, i.palettes, i.meta,
         i.obtainable, i.release_version, public.cos_owns(auth.uid(), i.id)
    from public.cosmetic_items i
    join public.cosmetic_collections c on c.id = i.collection
   where public.cos_staff_preview() and not (i.is_active and c.is_active)
   order by c.sort, i.type, i.price, i.name;
$$;

-- 6.3 Normaliza una pieza: comprueba que sea mía, que esté lanzada, que la paleta sea de ese ítem
--     y que el color libre solo se use donde se permite. Devuelve {id, palette, hue?} o null (= quitar).
create or replace function public.cos_slot_value(p_user uuid, p_type text, p_val jsonb)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  i       public.cosmetic_items;
  v_slug  text;
  v_pal   text;
  v_hue   integer := 0;
begin
  if p_val is null or jsonb_typeof(p_val) = 'null' then return null; end if;
  if jsonb_typeof(p_val) <> 'object' then raise exception 'Formato de cosmético inválido'; end if;
  v_slug := p_val ->> 'id';
  if v_slug is null or v_slug !~ '^[a-z0-9-]{1,48}$' then raise exception 'Formato de cosmético inválido'; end if;

  select i2.* into i
    from public.cosmetic_items i2 join public.cosmetic_collections c on c.id = i2.collection
   where i2.type = p_type and i2.slug = v_slug and i2.is_active and c.is_active;
  if not found then raise exception 'El cosmético «%» todavía no está disponible', v_slug; end if;
  if not public.cos_owns(p_user, i.id) then raise exception 'Todavía no tienes «%»', i.name; end if;

  v_pal := coalesce(nullif(p_val ->> 'palette', ''), i.palettes[1]);
  if i.type <> 'font' and (v_pal is null or not (v_pal = any (i.palettes))) then
    raise exception 'Esa paleta no es de «%»', i.name;
  end if;
  -- la paleta «fundador» es solo para quienes reclamaron el Pack Fundador (y el equipo)
  if v_pal = 'fundador' and not (public.cos_is_staff_all(p_user)
       or exists (select 1 from public.cosmetic_claims where user_id = p_user and kind = 'founder_items')) then
    raise exception 'Esa paleta es exclusiva del Pack Fundador';
  end if;

  if p_val ? 'hue' and coalesce(p_val ->> 'hue', '0') <> '0' then
    if not i.custom_hue then raise exception '«%» no admite color libre', i.name; end if;
    begin
      v_hue := (p_val ->> 'hue')::int;
    exception when others then raise exception 'El color libre no es válido';
    end;
    if v_hue < 0 or v_hue > 355 then raise exception 'El color libre no es válido'; end if;
  end if;

  return case when v_hue <> 0 then jsonb_build_object('id', i.slug, 'palette', v_pal, 'hue', v_hue)
              else jsonb_build_object('id', i.slug, 'palette', v_pal) end;
end;
$$;

-- 6.4 ÚNICO camino para cambiar lo que llevas puesto. Solo se tocan las piezas que vienen en p_config
--     (una pieza en null = quitarla). Todo o nada. Devuelve lo que quedó guardado.
--       { "avatar_deco": {id,palette,hue}, "name_font": "slug", "name_effect": {id,palette,hue},
--         "title": {id,palette}, "card": {…}, "entry": {…}, "background": {…} }
create or replace function public.cosmetic_save_look(p_config jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  p       public.profiles;
  v_deco  jsonb; v_title jsonb; v_card jsonb; v_entry jsonb; v_bg jsonb;
  v_font  text;  v_fx jsonb;   v_style jsonb;
  f       public.cosmetic_items;
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  if p_config is null or jsonb_typeof(p_config) <> 'object' then raise exception 'No hay nada que guardar'; end if;
  select * into p from public.profiles where id = v_me for update;
  if not found then raise exception 'No se encontró tu perfil'; end if;

  v_deco  := p.avatar_deco;  v_title := p.title_style; v_card := p.card_style;
  v_entry := p.entry_effect; v_bg    := p.profile_bg;
  v_font  := p.name_style ->> 'font';
  v_fx    := p.name_style -> 'effect';

  if p_config ? 'avatar_deco'  then v_deco  := public.cos_slot_value(v_me, 'avatar_decoration', p_config -> 'avatar_deco'); end if;
  if p_config ? 'title'        then v_title := public.cos_slot_value(v_me, 'title',             p_config -> 'title');       end if;
  if p_config ? 'card'         then v_card  := public.cos_slot_value(v_me, 'profile_card',      p_config -> 'card');        end if;
  if p_config ? 'entry'        then v_entry := public.cos_slot_value(v_me, 'entry_effect',      p_config -> 'entry');       end if;
  if p_config ? 'background'   then v_bg    := public.cos_slot_value(v_me, 'background',        p_config -> 'background');  end if;
  if p_config ? 'name_effect'  then v_fx    := public.cos_slot_value(v_me, 'name_effect',       p_config -> 'name_effect'); end if;
  if p_config ? 'name_font' then
    v_font := nullif(p_config ->> 'name_font', '');
    if v_font is not null then
      if v_font !~ '^[a-z0-9-]{1,48}$' then raise exception 'Formato de fuente inválido'; end if;
      select i2.* into f from public.cosmetic_items i2 join public.cosmetic_collections c on c.id = i2.collection
       where i2.type = 'font' and i2.slug = v_font and i2.is_active and c.is_active;
      if not found then raise exception 'La fuente «%» todavía no está disponible', v_font; end if;
      if not public.cos_owns(v_me, f.id) then raise exception 'Todavía no tienes la fuente «%»', f.name; end if;
      if v_font = 'clasica' then v_font := null; end if;   -- «Clásica» = la fuente normal de la app
    end if;
  end if;

  v_style := case when v_font is null and v_fx is null then null
                  else jsonb_strip_nulls(jsonb_build_object('font', v_font, 'effect', v_fx)) end;

  update public.profiles
     set avatar_deco = v_deco, title_style = v_title, card_style = v_card,
         entry_effect = v_entry, profile_bg = v_bg, name_style = v_style
   where id = v_me;

  return jsonb_build_object('avatar_deco', v_deco, 'name_style', v_style, 'title_style', v_title,
                            'card_style', v_card, 'entry_effect', v_entry, 'profile_bg', v_bg);
end;
$$;

-- 6.5 Insignias que alguien ganó al completar colecciones (trofeos públicos; el inventario sigue siendo privado)
create or replace function public.profile_badges(p_user uuid)
returns table (slug text, name text)
language sql stable security definer set search_path = public as $$
  select i.slug, i.name
    from public.user_cosmetics uc
    join public.cosmetic_items i on i.id = uc.item_id
    join public.cosmetic_collections c on c.id = i.collection
   where uc.user_id = p_user and i.type = 'badge' and i.is_active and c.is_active
     and uc.source in ('collection', 'founder')
   order by uc.acquired_at
   limit 8;
$$;


-- =====================================================================
-- 7) PACK BIENVENIDA (gratis, una vez) Y PACK FUNDADOR (cosméticos)
-- =====================================================================

-- 7.1 Estado del Pack Bienvenida: cuántas piezas puedes elegir de cada tipo (comunes de la tienda)
create or replace function public.welcome_pack_status()
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'claimed', exists (select 1 from public.cosmetic_claims where user_id = auth.uid() and kind = 'welcome_pack'),
    'decos',  greatest(0, public.eco_cfg_num('cosmetics_welcome_decos', 3)::int),
    'fonts',  greatest(0, public.eco_cfg_num('cosmetics_welcome_fonts', 3)::int),
    'titles', greatest(0, public.eco_cfg_num('cosmetics_welcome_titles', 3)::int)
  );
$$;

create or replace function public.welcome_pack_claim(p_items uuid[])
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me     uuid := auth.uid();
  st       jsonb := public.welcome_pack_status();
  r        record;
  n_deco   integer := 0; n_font integer := 0; n_title integer := 0;
  v_ids    uuid[];
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  if (st ->> 'claimed')::boolean then raise exception 'Ya reclamaste tu Pack Bienvenida'; end if;
  v_ids := array(select distinct x from unnest(coalesce(p_items, '{}'::uuid[])) as x);
  if coalesce(array_length(v_ids, 1), 0) = 0 then raise exception 'Elige al menos una pieza'; end if;

  for r in
    select i.id, i.type from public.cosmetic_items i join public.cosmetic_collections c on c.id = i.collection
     where i.id = any (v_ids) and i.is_active and c.is_active and i.rarity = 'comun' and i.obtainable = 'tienda' and i.price > 0
       and i.type in ('avatar_decoration', 'font', 'title')
  loop
    if r.type = 'avatar_decoration' then n_deco := n_deco + 1;
    elsif r.type = 'font' then n_font := n_font + 1;
    else n_title := n_title + 1; end if;
  end loop;
  if n_deco + n_font + n_title <> array_length(v_ids, 1) then raise exception 'Solo puedes elegir piezas comunes de la tienda'; end if;
  if n_deco  > (st ->> 'decos')::int  then raise exception 'Puedes elegir hasta % decoraciones', st ->> 'decos'; end if;
  if n_font  > (st ->> 'fonts')::int  then raise exception 'Puedes elegir hasta % fuentes',      st ->> 'fonts'; end if;
  if n_title > (st ->> 'titles')::int then raise exception 'Puedes elegir hasta % títulos',      st ->> 'titles'; end if;

  insert into public.cosmetic_claims (user_id, kind) values (v_me, 'welcome_pack');
  perform public.cos_grant(v_me, x, 'welcome', 0) from unnest(v_ids) as x;
  perform public.cos_check_collection(v_me, i.collection) from public.cosmetic_items i where i.id = any (v_ids);
  return jsonb_build_object('ok', true, 'items', array_length(v_ids, 1));
end;
$$;

-- 7.2 Pack Fundador: ahora también trae los cosméticos (Marco Fundador, insignia, título y Oro foil en paleta Fundador).
--     Las Lunas (300 ☾) ya existían en la v1.3.0; quien ya las cobró solo recibe los cosméticos que le faltan.
create or replace function public.founder_status()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_me           uuid := auth.uid();
  v_created      timestamptz;
  v_cutoff       date;
  v_coins_done   boolean;
  v_items_done   boolean;
begin
  if v_me is null then return jsonb_build_object('eligible', false, 'claimed', false, 'coins', 0); end if;
  select created_at into v_created from public.profiles where id = v_me;
  begin
    v_cutoff := public.eco_cfg_text('founder_cutoff', '2026-10-13')::date;
  exception when others then
    v_cutoff := date '2026-10-13';
  end;
  v_coins_done := exists (select 1 from public.coin_ledger where idempotency_key = 'founder:' || v_me::text);
  v_items_done := exists (select 1 from public.cosmetic_claims where user_id = v_me and kind = 'founder_items');
  return jsonb_build_object(
    'eligible', v_created is not null and (v_created at time zone public.eco_tz())::date < v_cutoff,
    'claimed', v_coins_done and v_items_done,
    'coins_claimed', v_coins_done,
    'items_claimed', v_items_done,
    'coins', greatest(1, public.eco_cfg_num('founder_coins', 300)::int),
    'cutoff', v_cutoff
  );
end;
$$;

create or replace function public.founder_claim()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  st    jsonb;
  res   jsonb := '{}'::jsonb;
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  st := public.founder_status();
  if not (st ->> 'eligible')::boolean then raise exception 'El Pack Fundador es solo para las cuentas de la beta'; end if;
  if (st ->> 'claimed')::boolean then raise exception 'Ya reclamaste tu Pack Fundador'; end if;

  if not (st ->> 'coins_claimed')::boolean then
    res := public.coins_apply(v_me, (st ->> 'coins')::int, 'founder', 'pack', 'fundador', 'founder:' || v_me::text);
  end if;
  if not (st ->> 'items_claimed')::boolean then
    insert into public.cosmetic_claims (user_id, kind) values (v_me, 'founder_items') on conflict do nothing;
    perform public.cos_grant_slug(v_me, 'avatar_decoration', 'marco-fundador', 'founder');
    perform public.cos_grant_slug(v_me, 'badge',             'fundador',        'founder');
    perform public.cos_grant_slug(v_me, 'title',             'fundador-de-daiwa', 'founder');
    perform public.cos_grant_slug(v_me, 'name_effect',       'oro-foil',        'founder');
  end if;
  return res || jsonb_build_object('items_granted', not (st ->> 'items_claimed')::boolean);
end;
$$;


-- =====================================================================
-- 8) MISIONES: logros de cosméticos y «equipar cuenta como cambio de perfil»
-- =====================================================================

-- 8.1 «Misiones de tener algo»: se añaden cosmetics_total y collections_done (solo cuenta lo LANZADO;
--     lo que el equipo recibe gratis no cuenta, para que nadie cobre logros con regalos).
create or replace function public.mission_state_progress(p_user uuid, p_key text)
returns integer
language plpgsql stable security definer set search_path = public as $$
declare v integer := 0;
begin
  case p_key
    when 'has_avatar' then
      select (avatar_url is not null and btrim(avatar_url) <> '')::int into v from public.profiles where id = p_user;
    when 'has_bio' then
      select (bio is not null and char_length(btrim(bio)) >= 3)::int into v from public.profiles where id = p_user;
    when 'has_profile_color' then
      select (profile_color is not null)::int into v from public.profiles where id = p_user;
    when 'has_music' then
      select (music is not null and jsonb_typeof(music) = 'object')::int into v from public.profiles where id = p_user;
    when 'follows_total' then
      select count(*)::int into v from public.follows where follower_id = p_user;
    when 'posts_total' then
      select count(*)::int into v from public.posts where user_id = p_user;
    when 'stories_total' then
      select count(*)::int into v from public.stories where user_id = p_user;
    when 'comments_total' then
      select count(*)::int into v from public.comments where user_id = p_user;
    when 'highlights_total' then
      select count(*)::int into v from public.highlights where user_id = p_user;
    when 'club_any' then
      select (exists (select 1 from public.club_members where user_id = p_user)
           or exists (select 1 from public.club_join_requests where user_id = p_user))::int into v;
    when 'shop_visited' then
      select exists (select 1 from public.mission_events where user_id = p_user and event_type = 'shop_visited')::int into v;
    when 'daily_claimed_total' then
      select count(*)::int into v from public.mission_events where user_id = p_user and event_type = 'daily_claimed' and not void;
    when 'likes_received_total' then
      select (
        (select count(*) from public.likes l join public.posts p on p.id = l.post_id where p.user_id = p_user and l.user_id <> p_user)
      + (select count(*) from public.comment_likes cl join public.comments c on c.id = cl.comment_id where c.user_id = p_user and cl.user_id <> p_user)
      )::int into v;
    when 'account_age_days' then
      select greatest(0, floor(extract(epoch from (now() - created_at)) / 86400))::int into v from public.profiles where id = p_user;
    when 'cosmetics_total' then
      select count(*)::int into v
        from public.user_cosmetics uc
        join public.cosmetic_items i on i.id = uc.item_id
        join public.cosmetic_collections c on c.id = i.collection
       where uc.user_id = p_user and uc.source <> 'staff_grant' and i.is_active and c.is_active and i.type <> 'badge';
    when 'collections_done' then
      select count(*)::int into v
        from public.user_cosmetics uc
        join public.cosmetic_items i on i.id = uc.item_id
        join public.cosmetic_collections c on c.id = i.collection
       where uc.user_id = p_user and uc.source = 'collection' and i.type = 'badge' and i.is_active and c.is_active and c.kind = 'coleccion';
    else
      v := 0;
  end case;
  return coalesce(v, 0);
end;
$$;

-- Los dos logros ya tienen su función: se encienden (solo la primera vez; si el equipo los apaga después, se respeta)
update public.mission_templates set requires_feature = null, active = true
 where id in ('A-08', 'A-09') and requires_feature = 'shop';

-- 8.2 Cambiar tus cosméticos cuenta como cambio de perfil (Estilista: «cambia 3 cosas de tu perfil»)
create or replace function public.trg_mt_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_day text := to_char(now() at time zone public.eco_tz(), 'YYYYMMDD');
  f text;
begin
  begin
    foreach f in array array['avatar_url', 'bio', 'banner_url', 'profile_color', 'name_color', 'card_color', 'music',
                             'avatar_deco', 'name_style', 'title_style', 'card_style', 'entry_effect', 'profile_bg'] loop
      if to_jsonb(new) -> f is distinct from to_jsonb(old) -> f then
        perform public.mission_track(new.id, 'profile_updated', f || ':' || v_day, null, jsonb_build_object('field', f));
      end if;
    end loop;
  exception when others then null;
  end;
  return new;
end;
$$;
drop trigger if exists mt_profile on public.profiles;
create trigger mt_profile after update of avatar_url, bio, banner_url, profile_color, name_color, card_color, music,
                                           avatar_deco, name_style, title_style, card_style, entry_effect, profile_bg
  on public.profiles for each row execute function public.trg_mt_profile();


-- =====================================================================
-- 9) ACCESO TOTAL DEL EQUIPO (renshsh): todo el catálogo gratis, incluido lo que viene
-- =====================================================================
-- Al insertarse la fila, el trigger le entrega todos los ítems que existan (y los que se añadan después).
-- Si la cuenta no existe todavía cuando corres este archivo, vuelve a correrlo cuando exista.
insert into public.cosmetic_staff_access (user_id, note)
select p.id, 'Acceso total al catálogo (v1.4.0): para probar la tienda, el estudio y lo que viene'
  from public.profiles p where lower(p.username) = 'renshsh'
on conflict (user_id) do nothing;
-- Si el acceso ya existía y se añadieron ítems con un SQL de catálogo viejo, se completa:
select public.cos_staff_grant_all(user_id) from public.cosmetic_staff_access;


-- =====================================================================
-- 10) PANEL DEL EQUIPO (permiso «manage_shop»)
-- =====================================================================

-- Todo el catálogo, activo o no (para el Centro de Mando)
create or replace function public.admin_cosmetic_list()
returns table (
  id uuid, type text, slug text, name text, rarity text, price integer, collection text,
  release_version text, is_active boolean, obtainable text, owners bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  return query
    select i.id, i.type, i.slug, i.name, i.rarity, i.price, i.collection, i.release_version, i.is_active, i.obtainable,
           (select count(*) from public.user_cosmetics uc where uc.item_id = i.id and uc.source <> 'staff_grant')
      from public.cosmetic_items i join public.cosmetic_collections c on c.id = i.collection
     order by c.sort, i.type, i.price, i.name;
end;
$$;

-- Cambiar el precio de un ítem a la venta (queda en el registro del equipo)
create or replace function public.admin_cosmetic_set_price(p_id uuid, p_price integer)
returns void
language plpgsql security definer set search_path = public as $$
declare i public.cosmetic_items;
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  if p_price is null or p_price < 0 or p_price > 100000 then raise exception 'Precio no válido'; end if;
  select * into i from public.cosmetic_items where id = p_id;
  if not found then raise exception 'Ese cosmético no existe'; end if;
  if i.obtainable <> 'tienda' then raise exception 'Este cosmético no se vende'; end if;
  update public.cosmetic_items set price = p_price where id = p_id;
  perform public.eco_log('cosmetic_price', i.type || ':' || i.slug, jsonb_build_object('from', i.price, 'to', p_price));
end;
$$;

-- Resumen para el equipo: cuántos ítems hay por versión y cuántos están activos
create or replace function public.admin_cosmetic_releases()
returns table (release_version text, items bigint, active_items bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eco_is_staff('manage_shop') then raise exception 'No tienes permiso'; end if;
  return query select i.release_version, count(*), count(*) filter (where i.is_active)
                 from public.cosmetic_items i group by i.release_version order by i.release_version;
end;
$$;


-- =====================================================================
-- 11) SEGURIDAD (RLS) Y PERMISOS DE LAS FUNCIONES
-- =====================================================================
alter table public.cosmetic_collections   enable row level security;
alter table public.cosmetic_items         enable row level security;
alter table public.user_cosmetics         enable row level security;
alter table public.cosmetic_staff_access  enable row level security;
alter table public.cosmetic_claims        enable row level security;

revoke all on public.cosmetic_collections, public.cosmetic_items, public.user_cosmetics,
              public.cosmetic_staff_access, public.cosmetic_claims from anon, authenticated;

-- El catálogo se puede leer directo, pero SOLO lo activo (la 1.5.0 no existe para nadie mientras esté apagada)
grant select on public.cosmetic_collections, public.cosmetic_items to authenticated;
drop policy if exists cosmetic_collections_read on public.cosmetic_collections;
create policy cosmetic_collections_read on public.cosmetic_collections for select to authenticated using (is_active);
drop policy if exists cosmetic_items_read on public.cosmetic_items;
create policy cosmetic_items_read on public.cosmetic_items for select to authenticated
  using (is_active and exists (select 1 from public.cosmetic_collections c where c.id = collection and c.is_active));

-- Mi inventario: solo lo mío y solo lo lanzado
grant select on public.user_cosmetics to authenticated;
drop policy if exists user_cosmetics_own on public.user_cosmetics;
create policy user_cosmetics_own on public.user_cosmetics for select to authenticated
  using (user_id = auth.uid() and exists (
    select 1 from public.cosmetic_items i join public.cosmetic_collections c on c.id = i.collection
     where i.id = item_id and i.is_active and c.is_active));
-- cosmetic_staff_access y cosmetic_claims: sin políticas ni permisos (solo las funciones las tocan)

-- Funciones: se cierran todas y se abren solo las de la página
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and (p.proname like 'cos\_%' or p.proname like 'cosmetic\_%' or p.proname like 'shop\_%' or p.proname like 'welcome\_pack%'
        or p.proname like 'staff\_preview%' or p.proname like 'admin\_cosmetic%' or p.proname = 'my_inventory'
        or p.proname = 'profile_badges' or p.proname = 'founder_status' or p.proname = 'founder_claim'
        or p.proname = 'mission_state_progress' or p.proname = 'trg_mt_profile'
        or p.proname like 'trg\_cosmetic%' or p.proname = 'trg_profiles_cosmetics_guard')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end;
$$;

grant execute on function
  public.shop_catalog(), public.shop_collections(), public.shop_pack_quote(text),
  public.shop_buy(uuid, integer, uuid), public.shop_buy_pack(text, integer, uuid),
  public.my_inventory(), public.staff_preview_items(), public.cos_staff_preview(),
  public.cosmetic_save_look(jsonb), public.profile_badges(uuid),
  public.welcome_pack_status(), public.welcome_pack_claim(uuid[]),
  public.founder_status(), public.founder_claim(),
  public.admin_cosmetic_list(), public.admin_cosmetic_set_price(uuid, integer), public.admin_cosmetic_releases()
to authenticated;

notify pgrst, 'reload schema';

-- Listo. Ahora corre v1.4.0_catalogo.sql (los ítems) y, para comprobar todo:  v1.4.0_pruebas.sql
-- Cuando quieras lanzar Sangre Noir y Emo Abismo:  v1.5.0_activar_sangre_noir_y_emo.sql
