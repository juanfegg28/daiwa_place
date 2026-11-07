-- =====================================================================
-- DaiwaPlace v1.8.0 — Clubes renovados · Rachas con escudo · Bono diario · Ventajas del Círculo Lunar · Ahorro
-- Pégalo COMPLETO en Supabase → SQL Editor → New query → Run. Se puede correr más de una vez.
-- Requiere haber corrido antes (en este orden, como siempre): … v1.3.0, v1.1.10, v1.1.0, v1.6.3, v1.7.0, v1.7.1, v1.7.2.
--
-- Qué hace:
--   1) CLUBES: publicaciones «solo del club» (posts.club_id) y anuncios de líderes; esas publicaciones NO salen en el Inicio,
--      ni en el perfil, ni en hashtags: solo en la página del club. El feed general de Clubes muestra solo lo que publican o
--      anuncian los LÍDERES. Cada club puede dejar publicar a todos sus miembros o solo a los líderes.
--   2) CLUBES: niveles (Semilla → Eclipse) según miembros + actividad, «reclutando», categoría, reglas, y premios semanales
--      en Lunas para líderes y miembros activos de clubes con nivel. Más roles propios según el nivel.
--   3) MISIONES: la misión semanal de club (que estaba apagada) y una diaria nueva, solo para quien está en un club.
--   4) RACHAS: hitos nuevos (5, 10 y 21 días), ESCUDO de racha (salva 1 día perdido), contador con hora en que se apaga,
--      y un bono diario de entrada en Lunas que crece con la racha. Los planes del Círculo Lunar suben el bono y el escudo
--      se recarga más rápido.
--   5) CÍRCULO LUNAR: my_perks() con las ventajas nuevas (Lunas extra en misiones y cofre, GIF más grande, bono ×, escudo más seguido).
--      Cambio rápido de cuentas: tope de 2 para todos (el rol solo permite 2 personajes); @renshsh sin límite.
--   6) AHORRO (Supabase gratis): limpieza diaria de registros internos (historial de cron y respuestas de pg_net) y índices.
-- No borra publicaciones, clubes, membresías ni Lunas existentes.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) Ventajas del Círculo Lunar (se piden desde la página con my_perks())
-- ---------------------------------------------------------------------
create or replace function public.my_perks()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  me     uuid := auth.uid();
  v_tier text;
  v_rank integer := 0;
  v_user text;
begin
  if me is null then return null; end if;
  select lower(username) into v_user from public.profiles where id = me;
  begin
    v_tier := public.supporter_tier_of(me);
    v_rank := coalesce(public.supporter_rank_of(me), 0);
  exception when others then
    v_tier := null; v_rank := 0;   -- si el Círculo Lunar aún no está instalado, todos son «gratis»
  end;
  return jsonb_build_object(
    'tier', v_tier,
    'rank', v_rank,
    -- cambio rápido de cuentas: en el rol solo se pueden tener 2 personajes, así que el tope es 2 para todos
    -- (la cuenta del creador, @renshsh, no tiene límite porque la usa para hacer pruebas)
    'account_cap', case when v_user = 'renshsh' then 30 else 2 end,
    'gif_mb',      case when v_rank = 0 then 6 else 12 end,
    -- Lunas extra en cada misión completada y en el cofre semanal
    'mission_bonus_pct', case v_rank when 0 then 0 when 1 then 15 when 2 then 25 else 40 end,
    'daily_mult',  case v_rank when 0 then 1 when 1 then 1.25 when 2 then 1.5 else 2 end,
    'shield_days', case v_rank when 0 then 30 when 1 then 14 when 2 then 10 else 7 end,
    'streak_boost_pct', case v_rank when 0 then 0 when 1 then 10 when 2 then 20 else 30 end
  );
end;
$$;
revoke execute on function public.my_perks() from public, anon;
grant  execute on function public.my_perks() to authenticated;

-- Funciones internas (para otras funciones; el navegador no las llama)
create or replace function public.perk_rank(p_user uuid)
returns integer
language plpgsql stable security definer set search_path = public as $$
begin
  return coalesce(public.supporter_rank_of(p_user), 0);
exception when others then
  return 0;
end;
$$;
revoke all on function public.perk_rank(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 1) CLUBES · publicaciones solo del club
-- ---------------------------------------------------------------------
alter table public.posts add column if not exists club_id         uuid references public.clubs(id) on delete cascade;
alter table public.posts add column if not exists is_announcement boolean not null default false;
create index if not exists posts_club_idx on public.posts (club_id, created_at desc) where club_id is not null;

alter table public.clubs add column if not exists post_policy text    not null default 'members';
alter table public.clubs add column if not exists recruiting  boolean not null default false;
alter table public.clubs add column if not exists category    text;
alter table public.clubs add column if not exists rules       text;
do $$
begin
  alter table public.clubs add constraint clubs_post_policy_check check (post_policy in ('members', 'leaders'));
exception when duplicate_object then null; end $$;
do $$
begin
  alter table public.clubs add constraint clubs_rules_len check (rules is null or char_length(rules) <= 600);
exception when duplicate_object then null; end $$;
do $$
begin
  alter table public.clubs add constraint clubs_category_len check (category is null or char_length(category) <= 30);
exception when duplicate_object then null; end $$;

-- Reglas de una publicación de club: solo miembros (o solo líderes, si el club lo pidió); solo líderes marcan anuncios;
-- y nadie puede cambiar a qué club pertenece una publicación después de hecha.
create or replace function public.trg_post_club_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_leader uuid;
  v_policy text;
begin
  if tg_op = 'UPDATE' then
    if new.club_id is distinct from old.club_id or new.is_announcement is distinct from old.is_announcement then
      raise exception 'No se puede cambiar el club de una publicación';
    end if;
    return new;
  end if;

  if new.club_id is null then
    new.is_announcement := false;
    return new;
  end if;

  select leader_id, post_policy into v_leader, v_policy from public.clubs where id = new.club_id;
  if v_leader is null then raise exception 'Ese club no existe'; end if;
  if not exists (select 1 from public.club_members where club_id = new.club_id and user_id = new.user_id) then
    raise exception 'Solo los miembros del club pueden publicar en él';
  end if;
  if v_policy = 'leaders' and v_leader <> new.user_id then
    raise exception 'En este club solo publican los líderes';
  end if;
  if new.is_announcement and v_leader <> new.user_id then
    raise exception 'Solo el líder puede marcar un anuncio';
  end if;
  return new;
end;
$$;
drop trigger if exists post_club_guard on public.posts;
create trigger post_club_guard before insert or update on public.posts
  for each row execute function public.trg_post_club_guard();

-- Una publicación de club cuenta para las misiones de club (un solo evento por publicación)
create or replace function public.trg_post_club_track()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.club_id is not null then
    begin
      perform public.mission_track(new.user_id, 'club_activity', new.id::text, null, '{}'::jsonb);
    exception when others then null;   -- las misiones nunca deben impedir publicar
    end;
  end if;
  return new;
end;
$$;
drop trigger if exists post_club_track on public.posts;
create trigger post_club_track after insert on public.posts
  for each row when (new.club_id is not null) execute function public.trg_post_club_track();

-- ---------------------------------------------------------------------
-- 2) FEEDS: las publicaciones de club NO salen en el Inicio, el perfil ni los compartidos
-- ---------------------------------------------------------------------
create or replace function public.feed_items(p_scope text default 'home', p_user uuid default null, p_limit int default 16)
returns table (kind text, post_id uuid, reposter_id uuid, sort_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare
  me      uuid := auth.uid();
  v_pref  text := 'all';
  v_limit int := greatest(1, least(coalesce(p_limit, 16), 100));
begin
  if me is not null then
    select coalesce(pr.feed_pref, 'all') into v_pref from public.profiles pr where pr.id = me;
  end if;

  if p_scope = 'profile' then
    return query
      select x.kind, x.post_id, x.reposter_id, x.sort_at
      from (
        select 'post'::text as kind, p.id as post_id, null::uuid as reposter_id, p.created_at as sort_at
        from public.posts p
        where p.user_id = p_user and p.club_id is null
        union all
        select 'repost'::text, r.post_id, r.user_id, r.created_at
        from public.reposts r
        join public.posts p on p.id = r.post_id
        where r.user_id = p_user
          and p.club_id is null
          and public.author_visible_to(p.user_id, me)
      ) x
      order by x.sort_at desc
      limit v_limit;
    return;
  end if;

  return query
    select x.kind, x.post_id, x.reposter_id, x.sort_at
    from (
      select 'post'::text as kind, p.id as post_id, null::uuid as reposter_id, p.created_at as sort_at,
             p.user_id as author_id, p.user_id as actor_id
      from public.posts p
      where p.club_id is null
      union all
      select 'repost'::text, r.post_id, r.user_id, r.created_at, p.user_id, r.user_id
      from public.reposts r
      join public.posts p on p.id = r.post_id
      where p.club_id is null
    ) x
    where
      public.author_visible_to(x.author_id, me)
      and (x.kind = 'post' or public.author_visible_to(x.actor_id, me))
      and (
        me is null
        or not exists (
          select 1 from public.muted_users m
          where m.user_id = me and m.muted_user_id in (x.author_id, x.actor_id)
        )
      )
      and (
        me is null
        or v_pref = 'all'
        or x.actor_id = me
        or (v_pref = 'following' and exists (
              select 1 from public.follows f where f.follower_id = me and f.following_id = x.actor_id))
        or (v_pref = 'mutuals' and exists (
              select 1 from public.follows f1
              join public.follows f2 on f2.follower_id = f1.following_id and f2.following_id = f1.follower_id
              where f1.follower_id = me and f1.following_id = x.actor_id))
      )
    order by x.sort_at desc
    limit v_limit;
end;
$$;

-- Feed de clubes (mismo nombre y firma de antes):
--   · con p_club: las publicaciones SOLO DEL CLUB de ese club (anuncios recientes arriba)
--   · sin p_club (la página general de Clubes): solo anuncios y publicaciones de los LÍDERES
create or replace function public.club_feed_ids(p_club uuid default null, p_limit int default 16)
returns setof uuid
language sql stable security definer set search_path = public as $$
  select p.id
  from public.posts p
  join public.clubs c on c.id = p.club_id
  where p.club_id is not null
    and (p_club is null or p.club_id = p_club)
    and (p_club is not null or p.is_announcement or p.user_id = c.leader_id)
    and (auth.uid() is null or (
      not exists (select 1 from public.muted_users mu where mu.user_id = auth.uid() and mu.muted_user_id = p.user_id)
      and not public.is_blocked_between(auth.uid(), p.user_id)
    ))
  order by (p.is_announcement and p.created_at > now() - interval '7 days') desc, p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 16), 100));
$$;

-- ---------------------------------------------------------------------
-- 3) CLUBES · niveles, ajustes y premios
-- ---------------------------------------------------------------------
create or replace function public.club_level_for(p_points integer)
returns integer
language sql immutable as $$
  select case when coalesce(p_points, 0) >= 300 then 5 when p_points >= 160 then 4 when p_points >= 80 then 3 when p_points >= 30 then 2 else 1 end;
$$;

-- Puntos = 4 por miembro + 3 por cada (miembro, día) con publicación de club en los últimos 30 días
-- (contar días distintos evita inflar el nivel publicando 50 veces seguidas)
create or replace function public.club_overview()
returns table (club_id uuid, members_count integer, posts_30d integer, points integer, level integer, recruiting boolean, category text)
language sql stable security definer set search_path = public as $$
  select c.id,
         coalesce(m.n, 0)::int,
         coalesce(p.n, 0)::int,
         (coalesce(m.n, 0) * 4 + coalesce(p.n, 0) * 3)::int,
         public.club_level_for(coalesce(m.n, 0) * 4 + coalesce(p.n, 0) * 3),
         c.recruiting,
         c.category
  from public.clubs c
  left join (select cm.club_id, count(*) n from public.club_members cm group by cm.club_id) m on m.club_id = c.id
  left join (
    select x.club_id, count(distinct (x.user_id::text || x.created_at::date::text)) n
    from public.posts x
    where x.club_id is not null and x.created_at > now() - interval '30 days'
    group by x.club_id
  ) p on p.club_id = c.id;
$$;
revoke execute on function public.club_overview() from public;
grant  execute on function public.club_overview() to anon, authenticated;

create or replace function public.club_level_of(p_club uuid)
returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select o.level from public.club_overview() o where o.club_id = p_club), 1);
$$;
revoke all on function public.club_level_of(uuid) from public, anon, authenticated;

-- Roles propios: 12 y +3 por cada nivel (nivel 5 = 24)
create or replace function public.trg_club_role_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_max integer := 12 + 3 * (public.club_level_of(new.club_id) - 1);
begin
  if (select count(*) from public.club_roles where club_id = new.club_id and not is_leader) >= v_max then
    raise exception 'Este club puede tener máximo % roles propios (sube de nivel para tener más)', v_max;
  end if;
  return new;
end;
$$;

-- El líder cambia los ajustes nuevos de SU club (el trigger de columnas no se toca)
create or replace function public.club_update_settings(
  p_club uuid, p_post_policy text, p_recruiting boolean, p_category text, p_rules text
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Inicia sesión primero'; end if;
  if not public.club_is_leader(p_club, auth.uid()) then raise exception 'Solo el líder puede cambiar esto'; end if;
  if p_post_policy not in ('members', 'leaders') then raise exception 'Opción no válida'; end if;
  update public.clubs
     set post_policy = p_post_policy,
         recruiting  = coalesce(p_recruiting, false),
         category    = nullif(left(btrim(coalesce(p_category, '')), 30), ''),
         rules       = nullif(left(btrim(coalesce(p_rules, '')), 600), '')
   where id = p_club;
end;
$$;
revoke execute on function public.club_update_settings(uuid, text, boolean, text, text) from public, anon;
grant  execute on function public.club_update_settings(uuid, text, boolean, text, text) to authenticated;

-- Premio semanal (lunes): líderes de clubes nivel 2+ y, desde el nivel 4, quien publicó en el club esa semana
create or replace function public.club_weekly_rewards()
returns integer
language plpgsql security definer set search_path = public as $$
declare
  r      record;
  m      record;
  w      date := public.supporter_week_start();
  v_lead uuid;
  v_amt  integer;
  v_mem  integer;
  n      integer := 0;
begin
  for r in select * from public.club_overview() o where o.level >= 2 loop
    select leader_id into v_lead from public.clubs where id = r.club_id;
    if v_lead is null then continue; end if;
    v_amt := case r.level when 2 then 60 when 3 then 120 when 4 then 200 else 320 end;
    begin
      perform public.coins_apply(v_lead, v_amt, 'club_weekly', 'club', r.club_id::text || ':' || w::text,
                                 'club:lead:' || r.club_id::text || ':' || w::text);
      n := n + 1;
    exception when others then null; end;

    if r.level >= 4 then
      v_mem := case when r.level = 5 then 25 else 15 end;
      for m in
        select distinct p.user_id from public.posts p
         where p.club_id = r.club_id and p.created_at >= now() - interval '7 days' and p.user_id <> v_lead
      loop
        begin
          perform public.coins_apply(m.user_id, v_mem, 'club_weekly', 'club', r.club_id::text || ':' || w::text,
                                     'club:mem:' || r.club_id::text || ':' || m.user_id::text || ':' || w::text);
          n := n + 1;
        exception when others then null; end;
      end loop;
    end if;
  end loop;
  return n;
end;
$$;
revoke all on function public.club_weekly_rewards() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'daiwa-club-weekly';
    perform cron.schedule('daiwa-club-weekly', '10 5 * * 1', 'select public.club_weekly_rewards()');   -- lunes 00:10 Colombia
  else
    raise notice 'pg_cron no está activo: los premios semanales de clubes no se programaron (puedes correr select public.club_weekly_rewards(); los lunes).';
  end if;
exception when others then
  raise notice 'No se pudo programar el premio semanal de clubes (no pasa nada): %', sqlerrm;
end $$;

-- ---------------------------------------------------------------------
-- 4) MISIONES de club (solo para quien está en un club)
-- ---------------------------------------------------------------------
do $$
begin
  alter table public.mission_templates drop constraint if exists mission_templates_requires_check;
  alter table public.mission_templates add constraint mission_templates_requires_check check (requires in ('friend', 'follows', 'club'));
exception when others then
  raise notice 'No se pudo ampliar mission_templates.requires: %', sqlerrm;
end $$;

create or replace function public.mission_requires_ok(p_user uuid, p_requires text)
returns boolean
language sql stable security definer set search_path = public as $$
  select case p_requires
    when 'friend'  then exists (
      select 1 from public.follows a
      join public.follows b on b.follower_id = a.following_id and b.following_id = a.follower_id
      where a.follower_id = p_user)
    when 'follows' then exists (select 1 from public.follows where follower_id = p_user)
    when 'club'    then exists (select 1 from public.club_members where user_id = p_user)
    else true
  end;
$$;

update public.mission_templates
   set text = 'Publica 2 veces en tu club', target = 2, params = '{}'::jsonb, requires = 'club', requires_feature = null, active = true, reward = 120
 where id = 'W-H05';

insert into public.mission_templates (id, period, difficulty, category, text, event_type, target, params, reward, weight, active, requires_feature, requires, go_href, sort) values
('D-M13', 'daily', 'medium', 'comunidad', 'Publica algo solo para tu club', 'club_activity', 1, '{}', 20, 10, true, null, 'club', '/', 23)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 5) RACHAS · hitos nuevos, escudo y bono diario de entrada
-- ---------------------------------------------------------------------
create table if not exists public.streak_shields (
  user_id   uuid primary key references public.profiles(id) on delete cascade,
  last_used date
);
alter table public.streak_shields enable row level security;
revoke all on public.streak_shields from anon, authenticated;

-- ¿Hay escudo listo? (se recarga cada N días: 30 gratis · 14 / 10 / 7 con el Círculo Lunar)
create or replace function public.streak_shield_ready(p_user uuid)
returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  v_last date;
  v_days integer := case public.perk_rank(p_user) when 0 then 30 when 1 then 14 when 2 then 10 else 7 end;
  v_today date := (now() at time zone public.eco_tz())::date;
begin
  select last_used into v_last from public.streak_shields where user_id = p_user;
  return v_last is null or v_last <= v_today - v_days;
end;
$$;
revoke all on function public.streak_shield_ready(uuid) from public, anon, authenticated;

-- Premio extra de hitos para el Círculo Lunar: +10 / +20 / +30 %
create or replace function public.streak_boost_pct(p_user uuid)
returns integer
language sql stable security definer set search_path = public as $$
  select case public.perk_rank(p_user) when 0 then 0 when 1 then 10 when 2 then 20 else 30 end;
$$;
revoke all on function public.streak_boost_pct(uuid) from public, anon, authenticated;

create or replace function public.streak_state(p_user uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  s        public.mission_streaks%rowtype;
  v_tz     text := public.eco_tz();
  v_today  date := (now() at time zone public.eco_tz())::date;
  v_cur    integer := 0;
  v_cycle  integer;
  v_start  date;
  v_ms     jsonb := '[]'::jsonb;
  d        integer;
  amt      integer;
  base     integer;
  v_boost  integer := public.streak_boost_pct(p_user);
  v_shield boolean := public.streak_shield_ready(p_user);
  v_via_shield boolean := false;
  v_ends   timestamptz;
  v_found  boolean;
begin
  select * into s from public.mission_streaks where user_id = p_user;
  v_found := found;
  if v_found and s.last_day is not null then
    if s.last_day >= v_today - 1 then
      v_cur := s.current;
    elsif s.last_day = v_today - 2 and s.current >= 3 and v_shield then
      v_cur := s.current; v_via_shield := true;     -- el escudo la salvará al entrar hoy
    end if;
  end if;
  v_cycle := case when v_cur = 0 then 0 else ((v_cur - 1) % 30) + 1 end;
  if v_cur > 0 and s.last_day is not null then v_start := s.last_day - (v_cycle - 1); end if;

  foreach d in array array[3, 5, 7, 10, 14, 21, 30] loop
    base := case d when 3 then 20 when 5 then 30 when 7 then 100 when 10 then 80 when 14 then 200 when 21 then 300 else 500 end;
    base := greatest(0, public.eco_cfg_num('streak_' || d::text, base)::int);
    amt  := round(base * (100 + v_boost) / 100.0)::int;
    v_ms := v_ms || jsonb_build_object(
      'day', d, 'amount', amt, 'base', base,
      'reached', v_cycle >= d,
      'claimed', v_start is not null and exists (
        select 1 from public.coin_ledger where idempotency_key = 'streak:' || p_user::text || ':' || v_start::text || ':' || d::text)
    );
  end loop;

  -- la racha se apaga al terminar el día siguiente al último que entraste (hora del colegio)
  if v_cur > 0 and s.last_day is not null then
    v_ends := ((case when v_via_shield then v_today + 1 else s.last_day + 2 end)::timestamp) at time zone v_tz;
  end if;

  return jsonb_build_object(
    'current', v_cur, 'best', coalesce(s.best, 0), 'cycle_day', v_cycle,
    'today_done', v_found and s.last_day = v_today,
    'milestones', v_ms,
    'ends_at', v_ends,
    'server_now', now(),
    'shield_ready', v_shield,
    'saved_by_shield', v_via_shield,
    'boost_pct', v_boost
  );
end;
$$;
revoke execute on function public.streak_state(uuid) from public, anon, authenticated;

create or replace function public.streak_touch()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  v_today date := (now() at time zone public.eco_tz())::date;
  s       public.mission_streaks%rowtype;
  v_new   integer;
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  insert into public.mission_streaks (user_id) values (v_me) on conflict (user_id) do nothing;
  select * into s from public.mission_streaks where user_id = v_me for update;

  if s.last_day is distinct from v_today then
    if s.last_day = v_today - 1 then
      v_new := s.current + 1;
    elsif s.last_day = v_today - 2 and s.current >= 3 and public.streak_shield_ready(v_me) then
      -- ESCUDO: perdiste UN día, pero tenías una racha de 3 o más: se salva y el escudo se gasta
      v_new := s.current + 1;
      insert into public.streak_shields (user_id, last_used) values (v_me, v_today - 1)
      on conflict (user_id) do update set last_used = excluded.last_used;
    else
      v_new := 1;
    end if;
    update public.mission_streaks
       set current = v_new, best = greatest(s.best, v_new), last_day = v_today
     where user_id = v_me;
  end if;

  insert into public.mission_events (user_id, event_type, ref_id)
  values (v_me, 'login_day', v_today::text)
  on conflict (user_id, event_type, ref_id) do nothing;

  return public.streak_state(v_me);
end;
$$;

create or replace function public.streak_claim(p_day integer)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  st     jsonb;
  m      jsonb;
  s      public.mission_streaks%rowtype;
  v_cycle integer;
  v_start date;
  v_age   integer;
  res    jsonb;
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  if p_day not in (3, 5, 7, 10, 14, 21, 30) then raise exception 'Ese hito no existe'; end if;
  select greatest(0, floor(extract(epoch from (now() - created_at)) / 86400))::int into v_age from public.profiles where id = v_me;
  if coalesce(v_age, 0) < 3 then raise exception 'Los premios de racha se desbloquean cuando tu cuenta tiene 3 días'; end if;

  st := public.streak_state(v_me);
  select e into m from jsonb_array_elements(st -> 'milestones') e where (e ->> 'day')::int = p_day;
  if m is null or not (m ->> 'reached')::boolean then raise exception 'Todavía no llegas a ese día de racha'; end if;
  if (m ->> 'claimed')::boolean then raise exception 'Ya reclamaste este premio de racha'; end if;
  if (m ->> 'amount')::int <= 0 then raise exception 'Este premio no está disponible'; end if;

  select * into s from public.mission_streaks where user_id = v_me;
  v_cycle := (st ->> 'cycle_day')::int;
  v_start := s.last_day - (v_cycle - 1);
  res := public.coins_apply(v_me, (m ->> 'amount')::int, 'streak', 'streak', v_start::text || ':' || p_day::text,
                            'streak:' || v_me::text || ':' || v_start::text || ':' || p_day::text);
  return jsonb_build_object('ok', true, 'reward', (m ->> 'amount')::int, 'balance', (res ->> 'balance')::int, 'applied', (res ->> 'applied')::boolean);
end;
$$;

-- Bono diario de entrada: 10 ☾ + 2 por cada día de racha (hasta 15 días) → de 12 a 40 ☾; ×1,25 / ×1,5 / ×2 con el Círculo Lunar
create or replace function public.daily_login_claim()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  v_today date := (now() at time zone public.eco_tz())::date;
  s       public.mission_streaks%rowtype;
  v_age   integer;
  v_mult  numeric;
  v_amt   integer;
  res     jsonb;
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  select greatest(0, floor(extract(epoch from (now() - created_at)) / 86400))::int into v_age from public.profiles where id = v_me;
  if coalesce(v_age, 0) < 1 then raise exception 'El bono diario se desbloquea cuando tu cuenta tiene 1 día'; end if;

  perform public.streak_touch();
  select * into s from public.mission_streaks where user_id = v_me;
  v_mult := case public.perk_rank(v_me) when 0 then 1 when 1 then 1.25 when 2 then 1.5 else 2 end;
  v_amt  := round((10 + 2 * least(greatest(s.current, 1), 15)) * v_mult)::int;

  res := public.coins_apply(v_me, v_amt, 'login_bonus', 'login', v_today::text, 'login:' || v_me::text || ':' || v_today::text);
  if not (res ->> 'applied')::boolean then raise exception 'Ya reclamaste el bono de hoy'; end if;
  return jsonb_build_object('ok', true, 'reward', v_amt, 'balance', (res ->> 'balance')::int);
end;
$$;
revoke execute on function public.daily_login_claim() from public, anon;
grant  execute on function public.daily_login_claim() to authenticated;

-- Todo lo de la racha para el panel de Misiones y el Inicio en UNA sola llamada
create or replace function public.streak_overview()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  v_today date := (now() at time zone public.eco_tz())::date;
  s       public.mission_streaks%rowtype;
  v_mult  numeric;
  v_amt   integer;
  v_done  boolean;
begin
  if v_me is null then return null; end if;
  select * into s from public.mission_streaks where user_id = v_me;
  v_mult := case public.perk_rank(v_me) when 0 then 1 when 1 then 1.25 when 2 then 1.5 else 2 end;
  v_amt  := round((10 + 2 * least(greatest(coalesce(s.current, 0), 1), 15)) * v_mult)::int;
  v_done := exists (select 1 from public.coin_ledger where idempotency_key = 'login:' || v_me::text || ':' || v_today::text);
  return public.streak_state(v_me) || jsonb_build_object(
    'daily', jsonb_build_object('amount', v_amt, 'claimed', v_done, 'mult', v_mult),
    'shield_days', case public.perk_rank(v_me) when 0 then 30 when 1 then 14 when 2 then 10 else 7 end
  );
end;
$$;
revoke execute on function public.streak_overview() from public, anon;
grant  execute on function public.streak_overview() to authenticated;

-- streak_state_me (la usa la página /misiones) sigue funcionando con el estado ampliado
create or replace function public.streak_state_me()
returns jsonb
language sql stable security definer set search_path = public as $$
  select public.streak_state(auth.uid());
$$;
revoke execute on function public.streak_state_me() from public, anon;
grant  execute on function public.streak_state_me() to authenticated;
grant  execute on function public.streak_claim(integer), public.streak_touch() to authenticated;

-- ---------------------------------------------------------------------
-- 5b) CÍRCULO LUNAR · Lunas extra en cada misión completada y en el cofre semanal (+15 % / +25 % / +40 %)
-- ---------------------------------------------------------------------
create or replace function public.trg_supporter_mission_bonus()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_pct   integer;
  v_extra integer;
begin
  if new.delta <= 0 or new.reason not in ('mission_claim', 'chest') then return new; end if;
  v_pct := case public.perk_rank(new.user_id) when 0 then 0 when 1 then 15 when 2 then 25 else 40 end;
  if v_pct = 0 then return new; end if;
  v_extra := round(new.delta * v_pct / 100.0)::int;
  if v_extra <= 0 then return new; end if;
  begin
    perform public.coins_apply(new.user_id, v_extra, 'supporter_bonus', 'bonus', new.id::text, 'sbonus:' || new.id::text);
  exception when others then null;   -- el bono extra nunca debe impedir cobrar la misión
  end;
  return new;
end;
$$;
drop trigger if exists supporter_mission_bonus on public.coin_ledger;
create trigger supporter_mission_bonus after insert on public.coin_ledger
  for each row when (new.reason in ('mission_claim', 'chest') and new.delta > 0)
  execute function public.trg_supporter_mission_bonus();

-- ---------------------------------------------------------------------
-- 6) AHORRO (Supabase gratis: «Egress» y «Log ingestion»)
-- ---------------------------------------------------------------------
-- Limpieza diaria de registros internos que crecen solos y no sirven de nada pasados unos días
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
      delete from cron.job_run_details where end_time < now() - interval '2 days';
      get diagnostics v_cron = row_count;
    exception when others then null; end;
  end if;
  if to_regclass('net._http_response') is not null then
    begin
      delete from net._http_response where created < now() - interval '1 day';
      get diagnostics v_net = row_count;
    exception when others then null; end;
  end if;
  -- «quién vio mi historia» de historias ya vencidas hace más de 2 días (si la tabla existe)
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

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'daiwa-housekeeping-lite';
    perform cron.schedule('daiwa-housekeeping-lite', '40 9 * * *', 'select public.daiwa_housekeeping_lite()');
  end if;
exception when others then
  raise notice 'No se pudo programar la limpieza ligera (no pasa nada): %', sqlerrm;
end $$;

-- Índices que ayudan a las consultas nuevas
create index if not exists club_members_club_idx on public.club_members (club_id);
create index if not exists mission_events_club_idx on public.mission_events (user_id, created_at desc) where event_type = 'club_activity' and not void;

-- Estadísticas al día
analyze public.posts;
analyze public.clubs;
analyze public.club_members;

-- ---------------------------------------------------------------------
-- 7) Permisos
-- ---------------------------------------------------------------------
grant select (club_id, is_announcement) on public.posts to anon, authenticated;
grant select (post_policy, recruiting, category, rules) on public.clubs to anon, authenticated;

-- Listo. Comprobación rápida (opcional):
--   select * from public.club_overview();
--   select public.club_weekly_rewards();     -- solo si quieres probar el premio semanal a mano (usa claves únicas por semana)
