-- =====================================================================
-- DaiwaPlace v1.9.0 · «CONSTELACIONES»  (SQL principal)
--
--   Orden de ejecución en el SQL Editor de Supabase (se puede repetir sin problema, es idempotente):
--     1) sql/v1.9.0_1_decoraciones_miembros.sql   (las 31 decoraciones/cosméticos del Círculo Lunar)
--     2) sql/v1.9.0_2_constelaciones.sql          (este archivo: todo lo demás de la 1.9.0)
--   Requiere haber corrido ya hasta la v1.8.0.
--
--   Qué trae:
--     §1  Círculo Lunar: entrega AUTOMÁTICA de los cosméticos a quien ya tiene plan + looks guardados
--     §2  Encuestas en publicaciones (y en los espacios de club)
--     §3  Publicaciones guardadas + colecciones privadas
--     §4  Calendario de eventos (oficiales y de club) + asistencia + avisos
--     §5  Vitrina personal del perfil
--     §6  Explorar 2.0 (un solo paquete con caché de 30 min: casi no cuesta nada)
--     §7  Seguridad: palabra secreta con hash (bcrypt), RLS reforzado
--     §8  Ahorro: limpieza de tablas de «registro», menos escritura, índices
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- §1 · CÍRCULO LUNAR
-- ---------------------------------------------------------------------

-- 1.1 Entrega automática: lo que tu nivel desbloquea se te da solo (sin tocar «Reclamar» y sin volver a pagar).
--     Lo ya reclamado se conserva siempre (aunque la membresía venza).
create or replace function public.supporter_sync_perks(p_user uuid)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_rank integer;
  k      record;
  n      integer := 0;
begin
  if p_user is null then return 0; end if;
  v_rank := coalesce(public.supporter_rank_of(p_user), 0);
  if v_rank < 1 then return 0; end if;
  for k in
    select p.code, p.item_id
      from public.supporter_perks p
     where p.available and p.item_id is not null
       and (select t.rank from public.supporter_tiers t where t.tier = p.min_tier) <= v_rank
       and not exists (select 1 from public.supporter_perk_claims c where c.user_id = p_user and c.code = p.code)
     order by p.sort
  loop
    perform public.cos_grant(p_user, k.item_id, 'supporter', 0);
    insert into public.supporter_perk_claims (user_id, code) values (p_user, k.code) on conflict do nothing;
    n := n + 1;
  end loop;
  return n;
end;
$$;
revoke all on function public.supporter_sync_perks(uuid) from public, anon, authenticated;

-- 1.2 Se dispara solo cuando alguien empieza o sube de plan, o se le renueva (nunca puede romper un pago)
create or replace function public.trg_supporter_sync()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    perform public.supporter_sync_perks(new.user_id);
  exception when others then
    null;
  end;
  return new;
end;
$$;
drop trigger if exists supporter_sync_perks on public.supporters;
create trigger supporter_sync_perks
  after insert or update of tier, status, paid_until on public.supporters
  for each row execute function public.trg_supporter_sync();

-- 1.3 A quien ya tiene un plan activo se le entrega TODO ahora mismo
do $$
declare r record;
begin
  for r in select user_id from public.supporters loop
    begin
      perform public.supporter_sync_perks(r.user_id);
    exception when others then
      null;
    end;
  end loop;
end $$;

-- 1.4 Looks guardados (combinaciones de cosméticos). Se escriben SOLO con look_save().
create table if not exists public.user_looks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 30),
  config     jsonb not null check (jsonb_typeof(config) = 'object' and pg_column_size(config) < 4096),
  created_at timestamptz not null default now()
);
create index if not exists user_looks_user_idx on public.user_looks (user_id, created_at desc);
alter table public.user_looks enable row level security;
drop policy if exists user_looks_select on public.user_looks;
create policy user_looks_select on public.user_looks for select to authenticated using (user_id = auth.uid());
revoke all on public.user_looks from anon;
revoke insert, update, delete on public.user_looks from authenticated;

-- Cuántos looks se pueden guardar: gratis 2 · Creciente 5 · Llena 10 · Eclipse 20
create or replace function public.look_limit_of(p_user uuid)
returns integer
language sql stable security definer set search_path = public as $$
  select case coalesce(public.supporter_rank_of(p_user), 0) when 1 then 5 when 2 then 10 when 3 then 20 else 2 end;
$$;
revoke all on function public.look_limit_of(uuid) from public, anon;
grant execute on function public.look_limit_of(uuid) to authenticated;

create or replace function public.look_list()
returns table (id uuid, name text, config jsonb, created_at timestamptz, max_looks integer)
language sql stable security definer set search_path = public as $$
  select l.id, l.name, l.config, l.created_at, public.look_limit_of(auth.uid())
    from public.user_looks l
   where l.user_id = auth.uid()
   order by l.created_at desc
   limit 40;
$$;
revoke all on function public.look_list() from public, anon;
grant execute on function public.look_list() to authenticated;

create or replace function public.look_save(p_name text, p_config jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me     uuid := auth.uid();
  v_name text := btrim(coalesce(p_name, ''));
  v_cfg  jsonb := '{}'::jsonb;
  v_font text;
  f      public.cosmetic_items;
  k      text;
  v_slot text;
  v_id   uuid;
begin
  if me is null then raise exception 'Inicia sesión primero'; end if;
  if char_length(v_name) < 1 or char_length(v_name) > 30 then raise exception 'El nombre del look debe tener entre 1 y 30 caracteres'; end if;
  if p_config is null or jsonb_typeof(p_config) <> 'object' then raise exception 'No hay nada que guardar'; end if;
  if (select count(*) from public.user_looks where user_id = me) >= public.look_limit_of(me) then
    raise exception 'Llegaste al límite de looks guardados (%). Con el Círculo Lunar puedes guardar más.', public.look_limit_of(me);
  end if;
  if exists (select 1 from public.user_looks where user_id = me and lower(name) = lower(v_name)) then
    raise exception 'Ya tienes un look con ese nombre';
  end if;

  -- cada pieza se valida con las mismas reglas que al ponértela (solo cosas tuyas, paleta y color libre correctos)
  foreach k in array array['avatar_deco', 'title', 'card', 'entry', 'background', 'name_effect'] loop
    if p_config ? k and p_config -> k is not null and jsonb_typeof(p_config -> k) = 'object' then
      v_slot := case k when 'avatar_deco' then 'avatar_decoration' when 'title' then 'title' when 'card' then 'profile_card'
                       when 'entry' then 'entry_effect' when 'background' then 'background' else 'name_effect' end;
      v_cfg := v_cfg || jsonb_build_object(k, public.cos_slot_value(me, v_slot, p_config -> k));
    end if;
  end loop;
  v_font := nullif(p_config ->> 'name_font', '');
  if v_font is not null then
    if v_font !~ '^[a-z0-9-]{1,48}$' then raise exception 'Formato de fuente inválido'; end if;
    select i2.* into f from public.cosmetic_items i2 where i2.type = 'font' and i2.slug = v_font and i2.is_active;
    if not found or not public.cos_owns(me, f.id) then raise exception 'Todavía no tienes esa fuente'; end if;
    v_cfg := v_cfg || jsonb_build_object('name_font', v_font);
  end if;
  if v_cfg = '{}'::jsonb then raise exception 'Ese look está vacío: ponte algo primero'; end if;

  insert into public.user_looks (user_id, name, config) values (me, v_name, v_cfg) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.look_save(text, jsonb) from public, anon;
grant execute on function public.look_save(text, jsonb) to authenticated;

create or replace function public.look_delete(p_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Inicia sesión primero'; end if;
  delete from public.user_looks where id = p_id and user_id = auth.uid();
  return found;
end;
$$;
revoke all on function public.look_delete(uuid) from public, anon;
grant execute on function public.look_delete(uuid) to authenticated;

-- 1.5 supporter_me(): igual que la de la v1.7.3 + entrega automática + cuántos looks puedes guardar
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
  if v_tier is not null then
    v_granted := public.supporter_grant_weekly(me);
    perform public.supporter_sync_perks(me);
  end if;

  return jsonb_build_object(
    'tiers', (select coalesce(jsonb_agg(to_jsonb(t) order by t.rank), '[]'::jsonb) from public.supporter_tiers t where t.is_active),
    'membership', case when v_sup.user_id is null then null else jsonb_build_object(
        'tier', v_sup.tier, 'status', v_sup.status, 'source', v_sup.source, 'active', v_tier is not null,
        'paid_until', v_sup.paid_until, 'started_at', v_sup.started_at, 'hide_badge', v_sup.hide_badge,
        'has_subscription', v_sup.paypal_subscription_id is not null and v_sup.source = 'paypal') end,
    'week_start', v_week,
    'weekly_granted_now', v_granted,
    'weekly_granted', exists (select 1 from public.supporter_weekly_grants g where g.user_id = me and g.week_start = v_week),
    'looks_limit', public.look_limit_of(me),
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

-- ---------------------------------------------------------------------
-- §2 · ENCUESTAS (en publicaciones normales y en el espacio de cada club)
--   · La encuesta se crea justo al publicar (poll_create) y hereda TODOS los permisos de la publicación:
--     si alguien puede publicar en un club, puede poner una encuesta ahí; si no, no.
--   · Un voto por persona, definitivo: lo garantiza la clave primaria (poll_id, user_id) + RLS (no hay forma de votar dos veces
--     ni de votar una encuesta cerrada, ni de votar en una publicación que no puedes ver).
--   · Los contadores los mantiene un disparador: leer los resultados no cuenta votos uno por uno.
--   · Nadie ve QUIÉN votó qué: poll_votes solo se puede leer la propia fila.
-- ---------------------------------------------------------------------
create table if not exists public.polls (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null unique references public.posts(id) on delete cascade,
  question    text check (question is null or char_length(question) <= 140),
  ends_at     timestamptz not null,
  total_votes integer not null default 0,
  created_at  timestamptz not null default now()
);
create table if not exists public.poll_options (
  id      uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  pos     smallint not null,
  label   text not null check (char_length(btrim(label)) between 1 and 60),
  votes   integer not null default 0,
  unique (poll_id, pos)
);
create table if not exists public.poll_votes (
  poll_id    uuid not null references public.polls(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  option_id  uuid not null references public.poll_options(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);
create index if not exists poll_votes_option_idx on public.poll_votes (option_id);

alter table public.polls        enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes   enable row level security;

drop policy if exists polls_select on public.polls;
create policy polls_select on public.polls for select to authenticated
  using (exists (select 1 from public.posts p where p.id = polls.post_id));
drop policy if exists poll_options_select on public.poll_options;
create policy poll_options_select on public.poll_options for select to authenticated
  using (exists (select 1 from public.polls p where p.id = poll_options.poll_id));
drop policy if exists poll_votes_select on public.poll_votes;
create policy poll_votes_select on public.poll_votes for select to authenticated using (user_id = auth.uid());
drop policy if exists poll_votes_insert on public.poll_votes;
create policy poll_votes_insert on public.poll_votes for insert to authenticated
  with check (
    poll_votes.user_id = auth.uid()
    and exists (select 1 from public.polls p where p.id = poll_votes.poll_id and p.ends_at > now())
    and exists (select 1 from public.poll_options o where o.id = poll_votes.option_id and o.poll_id = poll_votes.poll_id)
  );
revoke all on public.polls, public.poll_options, public.poll_votes from anon;
revoke insert, update, delete on public.polls, public.poll_options from authenticated;
revoke update, delete on public.poll_votes from authenticated;

create or replace function public.trg_poll_vote_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.poll_options set votes = votes + 1 where id = new.option_id;
    update public.polls set total_votes = total_votes + 1 where id = new.poll_id;
  else
    update public.poll_options set votes = greatest(0, votes - 1) where id = old.option_id;
    update public.polls set total_votes = greatest(0, total_votes - 1) where id = old.poll_id;
  end if;
  return null;
end;
$$;
drop trigger if exists poll_vote_count on public.poll_votes;
create trigger poll_vote_count after insert or delete on public.poll_votes
  for each row execute function public.trg_poll_vote_count();

-- Crear la encuesta de una publicación TUYA recién publicada (hasta 6 opciones, de 1 hora a 14 días)
create or replace function public.poll_create(p_post uuid, p_question text, p_options text[], p_hours integer)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me     uuid := auth.uid();
  p      public.posts;
  v_opts text[];
  v_id   uuid;
  i      integer;
begin
  if me is null then raise exception 'Inicia sesión primero'; end if;
  select * into p from public.posts where id = p_post;
  if not found or p.user_id <> me then raise exception 'Solo puedes agregar una encuesta a tu propia publicación'; end if;
  if p.created_at < now() - interval '15 minutes' then raise exception 'La encuesta se crea al publicar, no después'; end if;
  if exists (select 1 from public.polls where post_id = p_post) then raise exception 'Esa publicación ya tiene una encuesta'; end if;
  v_opts := array(select btrim(x) from unnest(coalesce(p_options, '{}'::text[])) as x where btrim(x) <> '');
  if coalesce(array_length(v_opts, 1), 0) < 2 or array_length(v_opts, 1) > 6 then raise exception 'Una encuesta lleva entre 2 y 6 opciones'; end if;
  if (select count(distinct lower(x)) from unnest(v_opts) as x) <> array_length(v_opts, 1) then raise exception 'Hay opciones repetidas'; end if;
  if exists (select 1 from unnest(v_opts) as x where char_length(x) > 60) then raise exception 'Cada opción puede tener máximo 60 caracteres'; end if;
  if p_hours is null or p_hours < 1 or p_hours > 336 then raise exception 'La duración va de 1 hora a 14 días'; end if;
  if p_question is not null and char_length(btrim(p_question)) > 140 then raise exception 'La pregunta es muy larga (máximo 140 caracteres)'; end if;
  insert into public.polls (post_id, question, ends_at)
  values (p_post, nullif(btrim(coalesce(p_question, '')), ''), now() + make_interval(hours => p_hours))
  returning id into v_id;
  for i in 1 .. array_length(v_opts, 1) loop
    insert into public.poll_options (poll_id, pos, label) values (v_id, i, v_opts[i]);
  end loop;
  return v_id;
end;
$$;
revoke all on function public.poll_create(uuid, text, text[], integer) from public, anon;
grant execute on function public.poll_create(uuid, text, text[], integer) to authenticated;

-- Votar. SECURITY INVOKER a propósito: las reglas (publicación visible, encuesta abierta, un voto) las pone RLS, no el código.
create or replace function public.poll_vote(p_poll uuid, p_option uuid)
returns jsonb
language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Inicia sesión primero'; end if;
  begin
    insert into public.poll_votes (poll_id, user_id, option_id) values (p_poll, auth.uid(), p_option);
  exception
    when unique_violation then raise exception 'Ya votaste en esta encuesta';
    when insufficient_privilege or check_violation then raise exception 'Esta encuesta ya cerró o no puedes votar en ella';
  end;
  return jsonb_build_object(
    'my_option', p_option,
    'total', (select total_votes from public.polls where id = p_poll),
    'options', (select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'votes', o.votes) order by o.pos), '[]'::jsonb)
                  from public.poll_options o where o.poll_id = p_poll)
  );
end;
$$;
revoke all on function public.poll_vote(uuid, uuid) from public, anon;
grant execute on function public.poll_vote(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------
-- §3 · PUBLICACIONES GUARDADAS (privadas) + COLECCIONES PERSONALES
--   Todo es 100 % tuyo: solo tú puedes leerlo y escribirlo (RLS). Nadie ve cuántas veces guardaron su publicación.
-- ---------------------------------------------------------------------
create table if not exists public.saved_collections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 30),
  created_at timestamptz not null default now()
);
create unique index if not exists saved_collections_user_name on public.saved_collections (user_id, lower(btrim(name)));
create table if not exists public.saved_posts (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  post_id       uuid not null references public.posts(id) on delete cascade,
  collection_id uuid references public.saved_collections(id) on delete set null,
  saved_at      timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index if not exists saved_posts_user_col on public.saved_posts (user_id, collection_id, saved_at desc);

alter table public.saved_collections enable row level security;
alter table public.saved_posts       enable row level security;
drop policy if exists saved_collections_all on public.saved_collections;
create policy saved_collections_all on public.saved_collections for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists saved_posts_select on public.saved_posts;
create policy saved_posts_select on public.saved_posts for select to authenticated using (user_id = auth.uid());
drop policy if exists saved_posts_insert on public.saved_posts;
create policy saved_posts_insert on public.saved_posts for insert to authenticated
  with check (
    saved_posts.user_id = auth.uid()
    and exists (select 1 from public.posts p where p.id = saved_posts.post_id)
    and (saved_posts.collection_id is null
         or exists (select 1 from public.saved_collections c where c.id = saved_posts.collection_id and c.user_id = auth.uid()))
  );
drop policy if exists saved_posts_update on public.saved_posts;
create policy saved_posts_update on public.saved_posts for update to authenticated
  using (user_id = auth.uid())
  with check (
    saved_posts.user_id = auth.uid()
    and (saved_posts.collection_id is null
         or exists (select 1 from public.saved_collections c where c.id = saved_posts.collection_id and c.user_id = auth.uid()))
  );
drop policy if exists saved_posts_delete on public.saved_posts;
create policy saved_posts_delete on public.saved_posts for delete to authenticated using (user_id = auth.uid());
revoke all on public.saved_collections, public.saved_posts from anon;

-- Topes para que nadie llene la base: 500 guardadas y 20 colecciones por persona
create or replace function public.trg_saved_limits()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'saved_posts' then
    if (select count(*) from public.saved_posts where user_id = new.user_id) >= 500 then
      raise exception 'Llegaste al límite de 500 publicaciones guardadas. Quita algunas para guardar más.';
    end if;
  else
    if (select count(*) from public.saved_collections where user_id = new.user_id) >= 20 then
      raise exception 'Puedes tener hasta 20 colecciones';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists saved_posts_limit on public.saved_posts;
create trigger saved_posts_limit before insert on public.saved_posts for each row execute function public.trg_saved_limits();
drop trigger if exists saved_collections_limit on public.saved_collections;
create trigger saved_collections_limit before insert on public.saved_collections for each row execute function public.trg_saved_limits();

-- Resumen (total, sin colección y cuántas hay en cada colección) en UNA sola consulta
create or replace function public.saved_overview()
returns jsonb
language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'total',   (select count(*) from public.saved_posts where user_id = auth.uid()),
    'unfiled', (select count(*) from public.saved_posts where user_id = auth.uid() and collection_id is null),
    'collections', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name,
                      'count', (select count(*) from public.saved_posts s where s.user_id = auth.uid() and s.collection_id = c.id)
                    ) order by c.created_at), '[]'::jsonb)
                    from public.saved_collections c where c.user_id = auth.uid())
  );
$$;
revoke all on function public.saved_overview() from public, anon;
grant execute on function public.saved_overview() to authenticated;

-- Página de guardadas (solo ids; la tarjeta completa se pide aparte y respeta la privacidad de cada autor)
create or replace function public.saved_list(p_collection uuid default null, p_unfiled boolean default false, p_limit integer default 12, p_before timestamptz default null)
returns table (post_id uuid, collection_id uuid, saved_at timestamptz)
language sql stable security invoker set search_path = public as $$
  select s.post_id, s.collection_id, s.saved_at
    from public.saved_posts s
   where s.user_id = auth.uid()
     and (p_collection is null or s.collection_id = p_collection)
     and (not coalesce(p_unfiled, false) or s.collection_id is null)
     and (p_before is null or s.saved_at < p_before)
   order by s.saved_at desc
   limit greatest(1, least(coalesce(p_limit, 12), 40));
$$;
revoke all on function public.saved_list(uuid, boolean, integer, timestamptz) from public, anon;
grant execute on function public.saved_list(uuid, boolean, integer, timestamptz) to authenticated;

-- ---------------------------------------------------------------------
-- §4 · CALENDARIO DE EVENTOS (oficiales y de club)
--   · Los crea el equipo con el permiso «manage_events» (oficiales) o el líder de cada club (actividades del club).
--   · Todo el mundo los ve; confirmar asistencia es privado (solo se muestran los totales).
--   · Avisos: al crearlos (a todos / a los miembros del club) y un recordatorio a quien confirmó, poco antes de empezar.
-- ---------------------------------------------------------------------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(btrim(title)) between 3 and 80),
  description text check (description is null or char_length(description) <= 1000),
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  location    text check (location is null or char_length(location) <= 80),
  link_url    text check (link_url is null or (link_url ~* '^https://' and char_length(link_url) <= 300)),
  kind        text not null default 'club' check (kind in ('oficial', 'club')),
  club_id     uuid references public.clubs(id) on delete cascade,
  created_by  uuid references public.profiles(id) on delete set null,
  going_count integer not null default 0,
  maybe_count integer not null default 0,
  reminded_at timestamptz,
  cancelled_at timestamptz,
  created_at  timestamptz not null default now(),
  constraint events_kind_club check ((kind = 'oficial' and club_id is null) or (kind = 'club' and club_id is not null)),
  constraint events_ends_after check (ends_at is null or ends_at > starts_at)
);
create index if not exists events_starts_idx on public.events (starts_at) where cancelled_at is null;
create index if not exists events_club_idx   on public.events (club_id, starts_at) where club_id is not null;
create table if not exists public.event_rsvps (
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  status     text not null check (status in ('going', 'maybe')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index if not exists event_rsvps_user_idx on public.event_rsvps (user_id, event_id);

alter table public.events      enable row level security;
alter table public.event_rsvps enable row level security;
drop policy if exists events_select on public.events;
create policy events_select on public.events for select to authenticated using (true);
drop policy if exists event_rsvps_select on public.event_rsvps;
create policy event_rsvps_select on public.event_rsvps for select to authenticated using (user_id = auth.uid());
revoke all on public.events, public.event_rsvps from anon;
revoke insert, update, delete on public.events, public.event_rsvps from authenticated;

-- Avisos de eventos: columna nueva + tipos nuevos (la restricción se reconstruye con TODOS los tipos que ya existen)
alter table public.notifications add column if not exists event_id uuid references public.events(id) on delete cascade;
create index if not exists notifications_event_idx on public.notifications (event_id) where event_id is not null;
create unique index if not exists notifications_uniq_event on public.notifications (recipient_id, event_id, type) where event_id is not null;
do $$
declare v_types text[]; v_sql text;
begin
  select coalesce(array_agg(distinct t), '{}') into v_types from (
    select type as t from public.notifications
    union select unnest(array['like_post','like_comment','comment','reply','follow','like_note','whisper_comment','whisper_reply',
      'mention_post','mention_comment','whisper_mention','whisper_comment_mention','club_approved','club_declined','club_join_request',
      'club_join_accepted','repost','like_story','mention_story','event_new','event_reminder'])
  ) s;
  alter table public.notifications drop constraint if exists notifications_type_check;
  select 'alter table public.notifications add constraint notifications_type_check check (type in (' ||
         string_agg(quote_literal(x), ',') || '))' into v_sql from unnest(v_types) as x;
  execute v_sql;
end $$;

-- ¿Quién puede cambiar o cancelar un evento? quien lo creó, el líder del club, o el equipo con «manage_events»
create or replace function public.event_can_manage(p_event uuid, p_user uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select p_user is not null and exists (
    select 1 from public.events e
     where e.id = p_event
       and (e.created_by = p_user
            or (e.club_id is not null and public.club_is_leader(e.club_id, p_user))
            or public.whisper_has_perm(p_user, 'manage_events'))
  );
$$;
revoke all on function public.event_can_manage(uuid, uuid) from public, anon;
grant execute on function public.event_can_manage(uuid, uuid) to authenticated;

-- Lista de eventos en una ventana de tiempo (calendario del mes, próximos, o los de un club). Una sola consulta.
create or replace function public.events_list(p_from timestamptz default null, p_to timestamptz default null, p_club uuid default null, p_limit integer default 60)
returns table (
  id uuid, title text, description text, starts_at timestamptz, ends_at timestamptz, location text, link_url text,
  kind text, club_id uuid, club_name text, club_slug text, club_color text, created_by uuid,
  going_count integer, maybe_count integer, my_status text, cancelled boolean, can_manage boolean
)
language sql stable security definer set search_path = public as $$
  select e.id, e.title, e.description, e.starts_at, e.ends_at, e.location, e.link_url,
         e.kind, e.club_id, c.name, c.slug, c.color, e.created_by,
         e.going_count, e.maybe_count,
         (select r.status from public.event_rsvps r where r.event_id = e.id and r.user_id = auth.uid()),
         e.cancelled_at is not null,
         public.event_can_manage(e.id, auth.uid())
    from public.events e
    left join public.clubs c on c.id = e.club_id
   where auth.uid() is not null
     and coalesce(e.ends_at, e.starts_at + interval '2 hours') >= coalesce(p_from, now())
     and (p_to is null or e.starts_at < p_to)
     and (p_club is null or e.club_id = p_club)
   order by e.starts_at
   limit greatest(1, least(coalesce(p_limit, 60), 120));
$$;
revoke all on function public.events_list(timestamptz, timestamptz, uuid, integer) from public, anon;
grant execute on function public.events_list(timestamptz, timestamptz, uuid, integer) to authenticated;

-- Crear (p_id nulo) o editar un evento
create or replace function public.event_save(
  p_id uuid, p_title text, p_description text, p_starts timestamptz, p_ends timestamptz,
  p_location text, p_link text, p_kind text, p_club uuid
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me      uuid := auth.uid();
  v_title text := btrim(coalesce(p_title, ''));
  v_desc  text := nullif(btrim(coalesce(p_description, '')), '');
  v_loc   text := nullif(btrim(coalesce(p_location, '')), '');
  v_link  text := nullif(btrim(coalesce(p_link, '')), '');
  v_kind  text := coalesce(p_kind, 'club');
  v_id    uuid;
  v_old   public.events;
begin
  if me is null then raise exception 'Inicia sesión primero'; end if;
  if public.eco_is_frozen(me) then raise exception 'Tu cuenta está congelada'; end if;
  if char_length(v_title) < 3 or char_length(v_title) > 80 then raise exception 'El título debe tener entre 3 y 80 caracteres'; end if;
  if v_desc is not null and char_length(v_desc) > 1000 then raise exception 'La descripción es muy larga (máximo 1000 caracteres)'; end if;
  if v_loc is not null and char_length(v_loc) > 80 then raise exception 'El lugar es muy largo'; end if;
  if v_link is not null and (v_link !~* '^https://[^\s]+$' or char_length(v_link) > 300) then raise exception 'El enlace debe empezar por https://'; end if;
  if p_starts is null then raise exception 'Elige la fecha y hora de inicio'; end if;
  if p_ends is not null and (p_ends <= p_starts or p_ends > p_starts + interval '14 days') then raise exception 'La hora de fin no es válida'; end if;

  if p_id is null then
    if p_starts < now() - interval '10 minutes' then raise exception 'La fecha de inicio ya pasó'; end if;
    if p_starts > now() + interval '400 days' then raise exception 'Esa fecha queda demasiado lejos'; end if;
    if v_kind = 'oficial' then
      if not public.eco_is_staff('manage_events') then raise exception 'No tienes permiso para crear eventos oficiales'; end if;
      p_club := null;
    elsif v_kind = 'club' then
      if p_club is null or not (public.club_is_leader(p_club, me) or public.eco_is_staff('manage_events')) then
        raise exception 'Solo el líder del club puede crear sus eventos';
      end if;
    else
      raise exception 'Tipo de evento no válido';
    end if;
    if not public.eco_is_staff('manage_events')
       and (select count(*) from public.events where created_by = me and cancelled_at is null
              and coalesce(ends_at, starts_at + interval '2 hours') > now()) >= 10 then
      raise exception 'Ya tienes 10 eventos activos. Cancela o espera a que pase alguno.';
    end if;
    insert into public.events (title, description, starts_at, ends_at, location, link_url, kind, club_id, created_by)
    values (v_title, v_desc, p_starts, p_ends, v_loc, v_link, v_kind, p_club, me)
    returning id into v_id;

    -- aviso de «evento nuevo»: a todos los que no lo hayan apagado (oficial) o a los miembros del club (de club)
    begin
      if v_kind = 'oficial' then
        insert into public.notifications (recipient_id, actor_id, type, event_id)
        select pr.id, me, 'event_new', v_id
          from public.profiles pr
         where pr.id <> me and not coalesce(pr.is_frozen, false)
           and coalesce((pr.notif_prefs ->> 'events')::boolean, true)
           and not exists (select 1 from public.blocks b where (b.blocker_id = pr.id and b.blocked_id = me) or (b.blocker_id = me and b.blocked_id = pr.id))
         limit 1500
        on conflict do nothing;
      else
        insert into public.notifications (recipient_id, actor_id, type, event_id, club_id)
        select m.user_id, me, 'event_new', v_id, p_club
          from public.club_members m
          join public.profiles pr on pr.id = m.user_id
         where m.club_id = p_club and m.user_id <> me and not coalesce(pr.is_frozen, false)
           and coalesce((pr.notif_prefs ->> 'events')::boolean, true)
           and not exists (select 1 from public.blocks b where (b.blocker_id = pr.id and b.blocked_id = me) or (b.blocker_id = me and b.blocked_id = pr.id))
         limit 1500
        on conflict do nothing;
      end if;
    exception when others then
      null;   -- un aviso que falle nunca impide crear el evento
    end;
    return v_id;
  end if;

  select * into v_old from public.events where id = p_id;
  if not found then raise exception 'Ese evento no existe'; end if;
  if not public.event_can_manage(p_id, me) then raise exception 'No puedes editar este evento'; end if;
  update public.events
     set title = v_title, description = v_desc, starts_at = p_starts, ends_at = p_ends, location = v_loc, link_url = v_link,
         reminded_at = case when p_starts is distinct from v_old.starts_at then null else reminded_at end
   where id = p_id;
  return p_id;
end;
$$;
revoke all on function public.event_save(uuid, text, text, timestamptz, timestamptz, text, text, text, uuid) from public, anon;
grant execute on function public.event_save(uuid, text, text, timestamptz, timestamptz, text, text, text, uuid) to authenticated;

create or replace function public.event_cancel(p_id uuid, p_cancel boolean default true)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Inicia sesión primero'; end if;
  if not public.event_can_manage(p_id, auth.uid()) then raise exception 'No puedes cambiar este evento'; end if;
  update public.events set cancelled_at = case when p_cancel then now() else null end where id = p_id;
  return true;
end;
$$;
revoke all on function public.event_cancel(uuid, boolean) from public, anon;
grant execute on function public.event_cancel(uuid, boolean) to authenticated;

create or replace function public.event_delete(p_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Inicia sesión primero'; end if;
  if not public.event_can_manage(p_id, auth.uid()) then raise exception 'No puedes borrar este evento'; end if;
  delete from public.events where id = p_id;
  return true;
end;
$$;
revoke all on function public.event_delete(uuid) from public, anon;
grant execute on function public.event_delete(uuid) to authenticated;

-- Confirmar asistencia: 'going' (voy) · 'maybe' (quizá) · 'none' (ya no)
create or replace function public.event_rsvp(p_event uuid, p_status text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  e  public.events;
begin
  if me is null then raise exception 'Inicia sesión primero'; end if;
  if public.eco_is_frozen(me) then raise exception 'Tu cuenta está congelada'; end if;
  select * into e from public.events where id = p_event;
  if not found then raise exception 'Ese evento no existe'; end if;
  if e.cancelled_at is not null then raise exception 'Ese evento fue cancelado'; end if;
  if coalesce(e.ends_at, e.starts_at + interval '2 hours') < now() then raise exception 'Ese evento ya terminó'; end if;
  if p_status = 'none' then
    delete from public.event_rsvps where event_id = p_event and user_id = me;
  elsif p_status in ('going', 'maybe') then
    insert into public.event_rsvps (event_id, user_id, status) values (p_event, me, p_status)
    on conflict (event_id, user_id) do update set status = excluded.status;
  else
    raise exception 'Opción no válida';
  end if;
  select * into e from public.events where id = p_event;
  return jsonb_build_object('my_status', case when p_status = 'none' then null else p_status end, 'going', e.going_count, 'maybe', e.maybe_count);
end;
$$;
revoke all on function public.event_rsvp(uuid, text) from public, anon;
grant execute on function public.event_rsvp(uuid, text) to authenticated;

create or replace function public.trg_event_rsvp_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_event uuid := coalesce(new.event_id, old.event_id);
begin
  update public.events e
     set going_count = (select count(*) from public.event_rsvps r where r.event_id = e.id and r.status = 'going'),
         maybe_count = (select count(*) from public.event_rsvps r where r.event_id = e.id and r.status = 'maybe')
   where e.id = v_event;
  return null;
end;
$$;
drop trigger if exists event_rsvp_count on public.event_rsvps;
create trigger event_rsvp_count after insert or update or delete on public.event_rsvps
  for each row execute function public.trg_event_rsvp_count();

-- Recordatorio: a quien confirmó, cuando falta menos de ~40 min (se llama cada 30 min; si el cron no existe, no pasa nada)
create or replace function public.events_send_reminders()
returns integer
language plpgsql security definer set search_path = public as $$
declare n integer := 0; k integer;
        e record;
begin
  for e in
    select id, created_by from public.events
     where reminded_at is null and cancelled_at is null
       and starts_at > now() and starts_at <= now() + interval '40 minutes'
  loop
    insert into public.notifications (recipient_id, actor_id, type, event_id)
    select r.user_id, coalesce(e.created_by, r.user_id), 'event_reminder', e.id
      from public.event_rsvps r
      join public.profiles pr on pr.id = r.user_id
     where r.event_id = e.id and not coalesce(pr.is_frozen, false)
       and coalesce((pr.notif_prefs ->> 'events')::boolean, true)
    on conflict do nothing;
    get diagnostics k = row_count;
    n := n + k;
    update public.events set reminded_at = now() where id = e.id;
  end loop;
  return n;
end;
$$;
revoke all on function public.events_send_reminders() from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'daiwa-event-reminders';
    perform cron.schedule('daiwa-event-reminders', '*/30 * * * *', 'select public.events_send_reminders()');
  end if;
exception when others then
  raise notice 'No se pudo programar el recordatorio de eventos (no pasa nada, se puede programar a mano): %', sqlerrm;
end $$;

-- ---------------------------------------------------------------------
-- §5 · VITRINA PERSONAL (opcional) en el perfil
--   Publicaciones tuyas, frases, canciones y recuerdos. Se puede activar y desactivar. Gratis: 4 elementos ·
--   Creciente 6 · Llena 8 · Eclipse 12. Quien mira tu perfil la pide SOLO si la tienes activada (has_showcase).
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists has_showcase boolean not null default false;
grant select (has_showcase) on public.profiles to anon, authenticated;

create table if not exists public.profile_showcase (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  enabled    boolean not null default false,
  title      text check (title is null or char_length(title) <= 30),
  items      jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 12),
  updated_at timestamptz not null default now()
);
alter table public.profile_showcase enable row level security;
drop policy if exists profile_showcase_owner on public.profile_showcase;
create policy profile_showcase_owner on public.profile_showcase for select to authenticated using (user_id = auth.uid());
revoke all on public.profile_showcase from anon;
revoke insert, update, delete on public.profile_showcase from authenticated;

create or replace function public.showcase_limit_of(p_user uuid)
returns integer
language sql stable security definer set search_path = public as $$
  select case coalesce(public.supporter_rank_of(p_user), 0) when 1 then 6 when 2 then 8 when 3 then 12 else 4 end;
$$;
revoke all on function public.showcase_limit_of(uuid) from public, anon;
grant execute on function public.showcase_limit_of(uuid) to authenticated;

-- Quién la ve: tú siempre; los demás solo si está activada, si pueden ver tus publicaciones (cuenta privada = solo seguidores) y no hay bloqueo.
create or replace function public.showcase_get(p_user uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  s  public.profile_showcase;
begin
  if me is null or p_user is null then return null; end if;
  select * into s from public.profile_showcase where user_id = p_user;
  if not found then
    return case when me = p_user then jsonb_build_object('enabled', false, 'title', null, 'items', '[]'::jsonb, 'limit', public.showcase_limit_of(me)) else null end;
  end if;
  if me <> p_user then
    if not s.enabled then return null; end if;
    if not public.can_view_posts_of(me, p_user) or public.is_blocked_between(me, p_user) then return null; end if;
    if coalesce((select pr.is_frozen from public.profiles pr where pr.id = p_user), false) then return null; end if;
  end if;
  return jsonb_build_object(
    'enabled', s.enabled, 'title', s.title,
    'limit', case when me = p_user then public.showcase_limit_of(me) else null end,
    'items', (
      select coalesce(jsonb_agg(
               case when t.e ->> 'type' = 'post'
                    then t.e || jsonb_build_object('post', (
                           select jsonb_build_object('id', po.id, 'content', left(po.content, 240), 'created_at', po.created_at, 'image', po.images -> 0)
                             from public.posts po where po.id = (t.e ->> 'post_id')::uuid))
                    else t.e end
               order by t.ord), '[]'::jsonb)
        from jsonb_array_elements(s.items) with ordinality as t(e, ord)
       where t.e ->> 'type' <> 'post'
          or exists (select 1 from public.posts po where po.id = (t.e ->> 'post_id')::uuid and po.club_id is null)
    )
  );
end;
$$;
revoke all on function public.showcase_get(uuid) from public, anon;
grant execute on function public.showcase_get(uuid) to authenticated;

create or replace function public.showcase_save(p_enabled boolean, p_title text, p_items jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me      uuid := auth.uid();
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_items jsonb := '[]'::jsonb;
  it      jsonb;
  v_type  text;
  v_id    text;
  v_post  uuid;
  v_text  text;
  v_ttl   text;
  v_by    text;
  v_date  text;
  v_track jsonb;
begin
  if me is null then raise exception 'Inicia sesión primero'; end if;
  if public.eco_is_frozen(me) then raise exception 'Tu cuenta está congelada'; end if;
  if v_title is not null and char_length(v_title) > 30 then raise exception 'El título de la vitrina puede tener máximo 30 caracteres'; end if;
  if p_items is null then p_items := '[]'::jsonb; end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'La vitrina no es válida'; end if;
  if jsonb_array_length(p_items) > public.showcase_limit_of(me) then
    raise exception 'Tu vitrina admite hasta % elementos. Con el Círculo Lunar caben más.', public.showcase_limit_of(me);
  end if;

  for it in select e from jsonb_array_elements(p_items) as e loop
    v_type := it ->> 'type';
    v_id := it ->> 'id';
    if v_id is null or v_id !~ '^[A-Za-z0-9-]{1,40}$' then v_id := gen_random_uuid()::text; end if;
    if v_type = 'post' then
      begin v_post := (it ->> 'post_id')::uuid; exception when others then raise exception 'Una publicación de la vitrina no es válida'; end;
      if not exists (select 1 from public.posts po where po.id = v_post and po.user_id = me and po.club_id is null) then
        raise exception 'Solo puedes destacar publicaciones tuyas (las de club no)';
      end if;
      v_items := v_items || jsonb_build_array(jsonb_build_object('id', v_id, 'type', 'post', 'post_id', v_post));
    elsif v_type = 'quote' then
      v_text := btrim(coalesce(it ->> 'text', ''));
      v_by := nullif(btrim(coalesce(it ->> 'by', '')), '');
      if char_length(v_text) < 1 or char_length(v_text) > 280 then raise exception 'La frase debe tener entre 1 y 280 caracteres'; end if;
      if v_by is not null and char_length(v_by) > 60 then raise exception 'El autor de la frase es muy largo'; end if;
      v_items := v_items || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('id', v_id, 'type', 'quote', 'text', v_text, 'by', v_by)));
    elsif v_type = 'song' then
      v_track := it -> 'track';
      if v_track is null or jsonb_typeof(v_track) <> 'object' or not public.music_is_valid(v_track) then raise exception 'Una canción de la vitrina no es válida'; end if;
      v_text := nullif(btrim(coalesce(it ->> 'note', '')), '');
      if v_text is not null and char_length(v_text) > 120 then raise exception 'La nota de la canción es muy larga'; end if;
      v_items := v_items || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('id', v_id, 'type', 'song', 'track', v_track, 'note', v_text)));
    elsif v_type = 'memory' then
      v_ttl := btrim(coalesce(it ->> 'title', ''));
      v_text := nullif(btrim(coalesce(it ->> 'text', '')), '');
      v_date := nullif(btrim(coalesce(it ->> 'date', '')), '');
      if char_length(v_ttl) < 1 or char_length(v_ttl) > 60 then raise exception 'El título del recuerdo debe tener entre 1 y 60 caracteres'; end if;
      if v_text is not null and char_length(v_text) > 400 then raise exception 'El recuerdo es muy largo (máximo 400 caracteres)'; end if;
      if v_date is not null and v_date !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'La fecha del recuerdo no es válida'; end if;
      v_items := v_items || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('id', v_id, 'type', 'memory', 'title', v_ttl, 'text', v_text, 'date', v_date)));
    else
      raise exception 'Tipo de elemento no válido';
    end if;
  end loop;

  insert into public.profile_showcase (user_id, enabled, title, items, updated_at)
  values (me, coalesce(p_enabled, false), v_title, v_items, now())
  on conflict (user_id) do update set enabled = excluded.enabled, title = excluded.title, items = excluded.items, updated_at = now();
  update public.profiles set has_showcase = (coalesce(p_enabled, false) and jsonb_array_length(v_items) > 0) where id = me;
  return public.showcase_get(me);
end;
$$;
revoke all on function public.showcase_save(boolean, text, jsonb) from public, anon;
grant execute on function public.showcase_save(boolean, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- §6 · EXPLORAR 2.0
--   UN solo paquete para todos (cuentas nuevas, activas, publicaciones populares, clubes y temas en tendencia), guardado 30 minutos.
--   Mientras la caché esté fresca, abrir Explorar no calcula NADA: es leer una fila. Sin algoritmos por persona.
-- ---------------------------------------------------------------------
create table if not exists public.explore_cache (
  key        text primary key,
  payload    jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.explore_cache enable row level security;
revoke all on public.explore_cache from anon, authenticated;

create or replace function public.explore_build()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  return jsonb_build_object(
    'new_members', (
      select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
        select p.id, p.username, p.id_student, p.avatar_url, p.created_at
          from public.profiles p
         where p.username is not null and not coalesce(p.is_frozen, false) and not coalesce(p.ghost_mode, false)
         order by p.created_at desc limit 12) x),
    'active_members', (
      select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
        select p.id, p.username, p.id_student, p.avatar_url, a.n as posts
          from (select po.user_id, count(*) as n from public.posts po
                 where po.created_at > now() - interval '7 days' and po.club_id is null
                 group by po.user_id order by count(*) desc limit 16) a
          join public.profiles p on p.id = a.user_id
         where not coalesce(p.is_frozen, false) and not coalesce(p.ghost_mode, false) and coalesce(p.posts_visibility, 'public') <> 'followers'
         order by a.n desc limit 10) x),
    'popular_posts', (
      select coalesce(jsonb_agg(x.id), '[]'::jsonb) from (
        select po.id
          from public.posts po
          join public.profiles pr on pr.id = po.user_id
         where po.created_at > now() - interval '7 days' and po.club_id is null
           and coalesce(pr.posts_visibility, 'public') <> 'followers' and not coalesce(pr.is_frozen, false) and not coalesce(pr.ghost_mode, false)
         order by ((select count(*) from public.likes l where l.post_id = po.id) + 2 * (select count(*) from public.comments c where c.post_id = po.id)) desc, po.created_at desc
         limit 12) x),
    'clubs', (
      select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
        select c.id, c.slug, c.name, c.kind, c.color, c.avatar_url, left(c.description, 120) as description,
               (select count(*) from public.club_members m where m.club_id = c.id) as members
          from public.clubs c
         order by (select count(*) from public.club_members m where m.club_id = c.id) desc, c.created_at desc
         limit 8) x),
    'tags', (
      select coalesce(jsonb_agg(jsonb_build_object('tag', t.tag, 'n', t.n)), '[]'::jsonb) from (
        select lower(m[1]) as tag, count(*) as n
          from public.posts po
          join public.profiles pr on pr.id = po.user_id
          cross join lateral regexp_matches(po.content, '#([[:alnum:]_]{2,30})', 'g') as m
         where po.created_at > now() - interval '7 days' and po.club_id is null and coalesce(pr.posts_visibility, 'public') <> 'followers'
         group by 1 having count(*) >= 2 order by count(*) desc, 1 limit 10) t)
  );
end;
$$;
revoke all on function public.explore_build() from public, anon, authenticated;

create or replace function public.explore_hub()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_row public.explore_cache;
  v_new jsonb;
begin
  if auth.uid() is null then return null; end if;
  select * into v_row from public.explore_cache where key = 'hub';
  if found and v_row.updated_at > now() - interval '30 minutes' then
    return v_row.payload || jsonb_build_object('updated_at', v_row.updated_at);
  end if;
  if pg_try_advisory_xact_lock(hashtext('daiwa_explore_hub')) then
    v_new := public.explore_build();
    insert into public.explore_cache (key, payload, updated_at) values ('hub', v_new, now())
    on conflict (key) do update set payload = excluded.payload, updated_at = excluded.updated_at;
    return v_new || jsonb_build_object('updated_at', now());
  end if;
  -- otra persona lo está recalculando justo ahora: se devuelve lo anterior
  return coalesce(v_row.payload, '{}'::jsonb) || jsonb_build_object('updated_at', v_row.updated_at);
end;
$$;
revoke all on function public.explore_hub() from public, anon;
grant execute on function public.explore_hub() to authenticated;

-- ---------------------------------------------------------------------
-- §7 · SEGURIDAD
-- ---------------------------------------------------------------------

-- 7.1 Palabra secreta: nunca más en texto legible.
--     · Se guarda solo el hash (bcrypt) en security_word_hash. Un disparador convierte cualquier valor que llegue en security_word
--       (registro, cambio de palabra, código viejo) en hash y deja security_word vacío: no hay forma de que quede en claro.
--     · Las cuentas existentes se migran aquí mismo (no pierden la recuperación) y la verificación acepta ambos formatos mientras tanto.
alter table public.profiles add column if not exists security_word_hash text;
do $$ begin
  alter table public.profiles alter column security_word drop not null;
exception when others then null;
end $$;

create or replace function public.trg_profiles_security_word()
returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  if new.security_word is not null and btrim(new.security_word) <> '' then
    new.security_word_hash := extensions.crypt(lower(btrim(new.security_word)), extensions.gen_salt('bf', 10));
  end if;
  new.security_word := null;
  return new;
end;
$$;
drop trigger if exists profiles_security_word on public.profiles;
create trigger profiles_security_word
  before insert or update of security_word on public.profiles
  for each row execute function public.trg_profiles_security_word();

-- Migración de las cuentas que ya existen (pasa de texto legible a hash y borra el texto)
update public.profiles
   set security_word_hash = extensions.crypt(lower(btrim(security_word)), extensions.gen_salt('bf', 10))
 where security_word is not null and btrim(security_word) <> '' and security_word_hash is null;
update public.profiles set security_word = null where security_word is not null and security_word_hash is not null;
update public.profiles set security_word = null where security_word is not null and btrim(security_word) = '';

-- Verificación (solo la llama el servidor con la llave de servicio). Gasta el mismo tiempo exista o no el usuario.
create or replace function public.security_word_verify(p_username text, p_word text)
returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare
  r      record;
  v_word text := lower(btrim(coalesce(p_word, '')));
begin
  select id, security_word_hash, security_word into r
    from public.profiles where username = lower(btrim(coalesce(p_username, ''))) limit 1;
  if not found then
    perform extensions.crypt(v_word, extensions.gen_salt('bf', 10));   -- mismo costo: no se puede averiguar qué usuarios existen
    return null;
  end if;
  if r.security_word_hash is not null then
    if extensions.crypt(v_word, r.security_word_hash) = r.security_word_hash then return r.id; end if;
    return null;
  end if;
  if r.security_word is not null and lower(btrim(r.security_word)) = v_word then
    update public.profiles set security_word = r.security_word where id = r.id;   -- el disparador la pasa a hash en ese momento
    return r.id;
  end if;
  perform extensions.crypt(v_word, extensions.gen_salt('bf', 10));
  return null;
end;
$$;
revoke all on function public.security_word_verify(text, text) from public, anon, authenticated;
grant execute on function public.security_word_verify(text, text) to service_role;

-- Tras recuperar la cuenta se cierran las demás sesiones abiertas (si alguien tenía la cuenta, queda fuera). Mejor esfuerzo.
create or replace function public.auth_revoke_sessions(p_user uuid)
returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  begin
    delete from auth.sessions where user_id = p_user;
  exception when others then
    null;
  end;
end;
$$;
revoke all on function public.auth_revoke_sessions(uuid) from public, anon, authenticated;
grant execute on function public.auth_revoke_sessions(uuid) to service_role;

-- ¿Alguien del navegador puede leer esas columnas? Si sí (permiso a nivel de tabla), se cierra dejando todo lo demás como estaba.
do $$
declare v_cols text;
begin
  if has_column_privilege('anon', 'public.profiles', 'security_word_hash', 'select')
     or has_column_privilege('authenticated', 'public.profiles', 'security_word_hash', 'select')
     or has_column_privilege('anon', 'public.profiles', 'security_word', 'select')
     or has_column_privilege('authenticated', 'public.profiles', 'security_word', 'select') then
    select string_agg(quote_ident(a.attname), ', ' order by a.attnum) into v_cols
      from pg_attribute a
     where a.attrelid = 'public.profiles'::regclass and a.attnum > 0 and not a.attisdropped
       and a.attname not in ('security_word', 'security_word_hash');
    execute 'revoke select on public.profiles from anon, authenticated';
    execute format('grant select (%s) on public.profiles to anon, authenticated', v_cols);
  end if;
end $$;

-- 7.2 RLS y permisos de membresías, economía y contenido privado.
--     Todo lo de abajo se lee/escribe SOLO con funciones del servidor (SECURITY DEFINER): se activa RLS, se quita el acceso a «anon»
--     y se quitan las escrituras directas desde el navegador (el SELECT propio que ya existía no se toca).
do $$
declare t text;
begin
  foreach t in array array[
    'user_wallets','coin_ledger','coin_admin_log','economy_flags','mission_events','user_missions','mission_streaks','streak_shields',
    'redeem_codes','code_redemptions','code_attempts','supporters','supporter_payments','supporter_subscriptions','supporter_manual_requests',
    'supporter_admin_log','supporter_perk_claims','supporter_weekly_grants','supporter_perks','supporter_tiers','paypal_events',
    'user_cosmetics','cosmetic_claims','cosmetic_staff_access','push_subscriptions','push_config','recovery_attempts',
    'whisper_authors','whisper_comment_authors','whisper_reveals','whisper_aliases','dm_reports','story_reports','story_views'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('revoke all on public.%I from anon', t);
      execute format('revoke insert, update, delete, truncate on public.%I from authenticated', t);
    end if;
  end loop;
end $$;
-- Las funciones que solo debe llamar el servidor (webhook de PayPal) no se pueden llamar desde el navegador
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and (p.proname like 'supporter\_server\_%' or p.proname like 'paypal\_event\_%')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- §8 · AHORRO (Supabase gratis: egress, log ingestion y disco)
--   Limpieza diaria más corta de todo lo que es «registro»: avisos leídos, eventos de misiones, intentos de recuperar cuenta y de
--   canjear códigos, historial del cron y respuestas de pg_net. Lo que es dinero/auditoría (coin_ledger, pagos) NO se toca.
-- ---------------------------------------------------------------------
create or replace function public.daiwa_housekeeping()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_notif int := 0; v_unread int := 0; v_ev int := 0; v_rec int := 0; v_code int := 0; v_flags int := 0; v_events int := 0;
begin
  delete from public.notifications where read = true and created_at < now() - interval '30 days';
  get diagnostics v_notif = row_count;
  delete from public.notifications where read = false and created_at < now() - interval '180 days';
  get diagnostics v_unread = row_count;

  if to_regclass('public.mission_events') is not null then
    begin
      delete from public.mission_events where created_at < now() - interval '45 days';
      get diagnostics v_ev = row_count;
    exception when others then v_ev := -1; end;
  end if;
  if to_regclass('public.recovery_attempts') is not null then
    delete from public.recovery_attempts where created_at < now() - interval '3 days';
    get diagnostics v_rec = row_count;
  end if;
  if to_regclass('public.code_attempts') is not null then
    delete from public.code_attempts where at < now() - interval '3 days';
    get diagnostics v_code = row_count;
  end if;
  if to_regclass('public.economy_flags') is not null then
    begin
      delete from public.economy_flags where resolved_at is not null and resolved_at < now() - interval '60 days';
      get diagnostics v_flags = row_count;
    exception when others then v_flags := -1; end;
  end if;
  -- eventos que terminaron hace más de 45 días (y sus confirmaciones, por cascada)
  delete from public.events where coalesce(ends_at, starts_at + interval '2 hours') < now() - interval '45 days';
  get diagnostics v_events = row_count;

  return jsonb_build_object('notifications_read', v_notif, 'notifications_unread', v_unread, 'mission_events', v_ev,
                            'recovery_attempts', v_rec, 'code_attempts', v_code, 'economy_flags', v_flags, 'events', v_events);
end;
$$;
revoke all on function public.daiwa_housekeeping() from public, anon, authenticated;

create or replace function public.daiwa_housekeeping_lite()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_cron integer := 0;
  v_net  integer := 0;
  v_seen integer := 0;
begin
  if to_regclass('cron.job_run_details') is not null then
    begin
      delete from cron.job_run_details where end_time < now() - interval '1 day';
      get diagnostics v_cron = row_count;
    exception when others then null; end;
  end if;
  if to_regclass('net._http_response') is not null then
    begin
      delete from net._http_response where created < now() - interval '12 hours';
      get diagnostics v_net = row_count;
    exception when others then null; end;
  end if;
  if to_regclass('public.story_views') is not null and to_regclass('public.stories') is not null then
    begin
      delete from public.story_views v using public.stories st
       where v.story_id = st.id and st.expires_at < now() - interval '2 days';
      get diagnostics v_seen = row_count;
    exception when others then null; end;
  end if;
  return jsonb_build_object('cron_runs', v_cron, 'pg_net_responses', v_net, 'story_views', v_seen);
end;
$$;
revoke all on function public.daiwa_housekeeping_lite() from public, anon, authenticated;

-- Paquete de arranque de la app: antes cada carga completa hacía 5 consultas (mantenimiento, perfil, roles, avisos sin leer, chats
-- sin leer). Ahora es UNA sola: menos peticiones = menos egress y menos «log ingestion» en Supabase.
create or replace function public.shell_bootstrap()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  v_dm record;
begin
  if me is null then return null; end if;
  select s.unread_conversations, s.pending_requests into v_dm from public.dm_unread_summary() s limit 1;
  return jsonb_build_object(
    'maintenance', coalesce((select a.value = 'true'::jsonb from public.app_settings a where a.key = 'maintenance_mode' limit 1), false),
    'profile', (select jsonb_build_object('username', p.username, 'avatar_url', p.avatar_url, 'id_student', p.id_student, 'theme', p.theme,
                                           'accent_color', p.accent_color, 'show_online_status', p.show_online_status, 'show_read_receipts', p.show_read_receipts)
                  from public.profiles p where p.id = me),
    'roles', (select coalesce(jsonb_agg(r.permissions), '[]'::jsonb) from public.user_roles ur join public.roles r on r.id = ur.role_id where ur.user_id = me),
    'unread_notifications', (select count(*) from public.notifications n where n.recipient_id = me and n.read = false),
    'dm_unread', coalesce(v_dm.unread_conversations, 0),
    'dm_requests', coalesce(v_dm.pending_requests, 0)
  );
end;
$$;
revoke all on function public.shell_bootstrap() from public, anon;
grant execute on function public.shell_bootstrap() to authenticated;

-- Contadores del perfil en una sola llamada (antes: seguidores, siguiendo, publicaciones, ¿lo sigo?, ¿me sigue?, ¿bloqueo? = 6 consultas)
create or replace function public.profile_stats(p_user uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select case when auth.uid() is null or p_user is null then null else jsonb_build_object(
    'followers', (select count(*) from public.follows f where f.following_id = p_user),
    'following', (select count(*) from public.follows f where f.follower_id = p_user),
    'posts',     (select count(*) from public.posts po where po.user_id = p_user and po.club_id is null),
    'i_follow',  exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = p_user),
    'follows_me', exists (select 1 from public.follows f where f.follower_id = p_user and f.following_id = auth.uid()),
    'i_blocked',  exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = p_user),
    'blocked_me', exists (select 1 from public.blocks b where b.blocker_id = p_user and b.blocked_id = auth.uid())
  ) end;
$$;
revoke all on function public.profile_stats(uuid) from public, anon;
grant execute on function public.profile_stats(uuid) to authenticated;

-- Índices que ayudan a las consultas nuevas y estadísticas al día
create index if not exists notifications_read_created_idx on public.notifications (created_at) where read = true;
create index if not exists posts_created_noclub_idx on public.posts (created_at desc) where club_id is null;
analyze public.polls;
analyze public.poll_options;
analyze public.events;
analyze public.saved_posts;

-- Que la API vea las funciones y tablas nuevas enseguida
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- Comprobación rápida (opcional):
--   select count(*) from public.supporter_perk_claims;                      -- las membresías activas ya recibieron todo
--   select to_regclass('public.polls'), to_regclass('public.events'), to_regclass('public.saved_posts'), to_regclass('public.profile_showcase');
--   select count(*) filter (where security_word is not null) as en_claro, count(*) filter (where security_word_hash is not null) as con_hash from public.profiles;
--     → en_claro debe ser 0
-- ---------------------------------------------------------------------
