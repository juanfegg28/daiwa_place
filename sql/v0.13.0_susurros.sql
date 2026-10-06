-- =====================================================================
-- DaiwaPlace v0.13.0 — Muro de los Susurros (confesiones anónimas)
-- Pégalo completo en Supabase → SQL Editor → New query → Run.
-- REQUISITO: ya haber corrido los SQL de la v0.11.0 y la v0.12.0.
-- Es seguro correrlo más de una vez (no duplica nada).
--
-- CÓMO SE PROTEGE EL ANONIMATO
-- · Las confesiones y los comentarios anónimos NO guardan quién los escribió en la
--   tabla pública. El autor real vive en tablas aparte (whisper_authors y
--   whisper_comment_authors) que cada persona solo puede leer en lo suyo.
-- · Nadie puede escribir directo en las tablas: todo pasa por funciones (RPC)
--   que validan las reglas.
-- · Un moderador puede ocultar, eliminar y silenciar al autor SIN saber quién es.
--   Solo quien tenga el permiso "Ver autor de un susurro" (o el Admin Supremo) puede
--   revelarlo, debe escribir un motivo y queda registrado en un historial.
-- =====================================================================


-- 1) PERMISOS NUEVOS DEL CENTRO DE MANDO -------------------------------
-- Se guardan dentro de roles.permissions (jsonb) igual que los demás:
--   moderate_whispers      → ver reportes del Muro, ocultar/eliminar/restaurar, silenciar autores
--   reveal_whisper_authors → ver quién escribió un susurro (queda en el historial)
create or replace function public.whisper_is_supreme(p_user uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = p_user and lower(username) in ('renshsh', 'are_you_rena')
  );
$$;

create or replace function public.whisper_has_perm(p_user uuid, p_perm text)
returns boolean
language sql stable security definer set search_path = public as $$
  select p_user is not null and (
    public.whisper_is_supreme(p_user)
    or exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = p_user
        and coalesce((r.permissions ->> p_perm)::boolean, false)
    )
  );
$$;


-- 2) TABLAS --------------------------------------------------------------

-- 2.1 Confesiones. OJO: aquí NO hay ninguna columna que diga quién la escribió.
create table if not exists public.whispers (
  id            uuid primary key default gen_random_uuid(),
  content       text not null check (char_length(btrim(content)) between 5 and 1000),
  category      text not null default 'confesion' check (category in ('confesion','crush','chisme','pregunta','otro')),
  score         int  not null default 0,
  comment_count int  not null default 0,
  status        text not null default 'visible' check (status in ('visible','hidden','removed')),
  removed_by_author boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists whispers_status_created_idx on public.whispers (status, created_at desc);
create index if not exists whispers_status_score_idx   on public.whispers (status, score desc, created_at desc);

-- 2.2 Autor real de cada confesión (privado)
create table if not exists public.whisper_authors (
  whisper_id uuid primary key references public.whispers(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists whisper_authors_user_idx on public.whisper_authors (user_id, created_at desc);

-- 2.3 Votos hacia arriba (+1) o hacia abajo (-1). Una persona, un voto por confesión.
create table if not exists public.whisper_votes (
  whisper_id uuid not null references public.whispers(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  value      smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (whisper_id, user_id)
);

-- 2.4 Comentarios. Si is_anonymous es true, author_id queda vacío.
create table if not exists public.whisper_comments (
  id                uuid primary key default gen_random_uuid(),
  whisper_id        uuid not null references public.whispers(id) on delete cascade,
  parent_comment_id uuid references public.whisper_comments(id) on delete cascade,
  content           text not null default '',
  is_anonymous      boolean not null default true,
  author_id         uuid,
  anon_n            int,
  is_op             boolean not null default false,
  status            text not null default 'visible' check (status in ('visible','hidden','removed')),
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  constraint whisper_comments_author_id_fkey foreign key (author_id) references public.profiles(id) on delete set null,
  constraint whisper_comments_content_check check (deleted_at is not null or char_length(btrim(content)) between 1 and 500)
);
create index if not exists whisper_comments_whisper_idx on public.whisper_comments (whisper_id, created_at);

-- 2.5 Autor real de cada comentario (privado; también de los que salen con perfil)
create table if not exists public.whisper_comment_authors (
  comment_id uuid primary key references public.whisper_comments(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists whisper_comment_authors_user_idx on public.whisper_comment_authors (user_id, created_at desc);

-- 2.6 Número de "Chismoso Anónimo #n" de cada persona dentro de una confesión (privado, sin acceso)
create table if not exists public.whisper_aliases (
  whisper_id uuid not null references public.whispers(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  n          int  not null,
  primary key (whisper_id, user_id),
  unique (whisper_id, n)
);

-- 2.7 Reportes
create table if not exists public.whisper_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  whisper_id  uuid references public.whispers(id) on delete cascade,
  comment_id  uuid references public.whisper_comments(id) on delete cascade,
  reason      text not null check (reason in ('ofensivo','acoso','datos_personales','odio','spam','otro')),
  details     text check (details is null or char_length(details) <= 300),
  snapshot    text,
  status      text not null default 'pending' check (status in ('pending','resolved','dismissed')),
  created_at  timestamptz not null default now(),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  resolution  text,
  constraint whisper_reports_target_check check ((whisper_id is not null) <> (comment_id is not null))
);
create unique index if not exists whisper_reports_uniq_whisper on public.whisper_reports (reporter_id, whisper_id) where whisper_id is not null;
create unique index if not exists whisper_reports_uniq_comment on public.whisper_reports (reporter_id, comment_id) where comment_id is not null;
create index if not exists whisper_reports_status_idx on public.whisper_reports (status, created_at desc);

-- 2.8 Silencios (la persona no puede publicar ni comentar en el Muro hasta cierta fecha)
create table if not exists public.whisper_bans (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  until      timestamptz not null,
  reason     text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 2.9 Historial de revelaciones de autor (quién miró a quién y por qué)
create table if not exists public.whisper_reveals (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references public.profiles(id) on delete set null,
  target_kind text not null check (target_kind in ('whisper','comment')),
  target_id   uuid not null,
  author_id   uuid,
  reason      text not null,
  created_at  timestamptz not null default now()
);
create index if not exists whisper_reveals_created_idx on public.whisper_reveals (created_at desc);

-- 2.10 Notificaciones: avisos del Muro. Cuando el comentario es anónimo, "anonymous" es true
--      y la pantalla NO muestra a nadie (el actor guardado es solo un relleno).
alter table public.notifications add column if not exists whisper_id uuid;
alter table public.notifications add column if not exists whisper_comment_id uuid;
alter table public.notifications add column if not exists anonymous boolean not null default false;
do $$
begin
  alter table public.notifications
    add constraint notifications_whisper_id_fkey foreign key (whisper_id) references public.whispers(id) on delete cascade;
exception when duplicate_object then null;
end;
$$;
do $$
begin
  alter table public.notifications
    add constraint notifications_whisper_comment_id_fkey foreign key (whisper_comment_id) references public.whisper_comments(id) on delete cascade;
exception when duplicate_object then null;
end;
$$;
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('like_post','like_comment','comment','reply','follow','like_note','whisper_comment','whisper_reply'));
create unique index if not exists notifications_uniq_whisper_comment
  on public.notifications (type, whisper_comment_id) where type in ('whisper_comment','whisper_reply');


-- 3) FUNCIONES DE APOYO ----------------------------------------------------

-- ¿El Muro está encendido? (se apaga desde Centro de Mando → Sistema)
create or replace function public.whispers_enabled()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select value = 'true'::jsonb from public.app_settings where key = 'whispers_enabled' limit 1), true);
$$;

create or replace function public.whisper_is_mine(p_whisper uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.whisper_authors where whisper_id = p_whisper and user_id = auth.uid());
$$;

create or replace function public.whisper_comment_is_mine(p_comment uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.whisper_comment_authors where comment_id = p_comment and user_id = auth.uid());
$$;

-- Frena a quien no debería publicar: Muro apagado, cuenta congelada o silenciada
create or replace function public.whisper_guard(p_user uuid)
returns void
language plpgsql stable security definer set search_path = public as $$
declare
  v_until timestamptz;
begin
  if p_user is null then raise exception 'Debes iniciar sesión'; end if;
  if not public.whispers_enabled() then
    raise exception 'El Muro de los Susurros está en pausa por ahora';
  end if;
  if exists (select 1 from public.profiles where id = p_user and is_frozen) then
    raise exception 'Tu cuenta está congelada, por eso no puedes participar en el Muro';
  end if;
  select until into v_until from public.whisper_bans where user_id = p_user and until > now();
  if found then
    raise exception 'Estás silenciado en el Muro hasta el %', to_char(v_until at time zone 'America/Bogota', 'DD/MM/YYYY HH24:MI');
  end if;
end;
$$;

-- Revisa el texto: sin enlaces (evita spam y estafas)
create or replace function public.whisper_check_text(p_text text)
returns void
language plpgsql immutable as $$
begin
  if p_text ~* '(https?://|www\.|discord\.gg|t\.me/)' then
    raise exception 'No se permiten enlaces en el Muro';
  end if;
end;
$$;

-- Recalcula el puntaje de una confesión
create or replace function public.trg_whisper_score()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := coalesce(new.whisper_id, old.whisper_id);
begin
  update public.whispers
     set score = (select coalesce(sum(value), 0) from public.whisper_votes where whisper_id = v_id)
   where id = v_id;
  return null;
end;
$$;
drop trigger if exists whisper_score on public.whisper_votes;
create trigger whisper_score after insert or update or delete on public.whisper_votes
  for each row execute function public.trg_whisper_score();

-- Recalcula cuántos comentarios tiene una confesión
create or replace function public.trg_whisper_comment_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := coalesce(new.whisper_id, old.whisper_id);
begin
  update public.whispers
     set comment_count = (
       select count(*) from public.whisper_comments
        where whisper_id = v_id and deleted_at is null and status = 'visible')
   where id = v_id;
  return null;
end;
$$;
drop trigger if exists whisper_comment_count on public.whisper_comments;
create trigger whisper_comment_count after insert or update or delete on public.whisper_comments
  for each row execute function public.trg_whisper_comment_count();

-- Nadie puede votar su propia confesión
create or replace function public.trg_whisper_vote_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.whisper_authors where whisper_id = new.whisper_id and user_id = new.user_id) then
    raise exception 'No puedes votar tu propia confesión';
  end if;
  return new;
end;
$$;
drop trigger if exists whisper_vote_guard on public.whisper_votes;
create trigger whisper_vote_guard before insert or update on public.whisper_votes
  for each row execute function public.trg_whisper_vote_guard();


-- 4) SEGURIDAD (RLS) -------------------------------------------------------
alter table public.whispers                enable row level security;
alter table public.whisper_authors         enable row level security;
alter table public.whisper_votes           enable row level security;
alter table public.whisper_comments        enable row level security;
alter table public.whisper_comment_authors enable row level security;
alter table public.whisper_aliases         enable row level security;
alter table public.whisper_reports         enable row level security;
alter table public.whisper_bans            enable row level security;
alter table public.whisper_reveals         enable row level security;

revoke all on public.whispers, public.whisper_authors, public.whisper_votes, public.whisper_comments,
              public.whisper_comment_authors, public.whisper_aliases, public.whisper_reports,
              public.whisper_bans, public.whisper_reveals from anon, authenticated;

-- Se pueden leer las confesiones visibles; las tuyas siempre; y quien modera, todas.
drop policy if exists "whispers_select" on public.whispers;
create policy "whispers_select" on public.whispers
  for select to authenticated
  using (status = 'visible' or public.whisper_is_mine(id) or public.whisper_has_perm(auth.uid(), 'moderate_whispers'));
grant select on public.whispers to authenticated;

-- Cada quien solo ve SU fila (así la pantalla sabe cuáles son tuyas)
drop policy if exists "whisper_authors_select_own" on public.whisper_authors;
create policy "whisper_authors_select_own" on public.whisper_authors
  for select to authenticated using (user_id = auth.uid());
grant select on public.whisper_authors to authenticated;

drop policy if exists "whisper_votes_select_own" on public.whisper_votes;
create policy "whisper_votes_select_own" on public.whisper_votes
  for select to authenticated using (user_id = auth.uid());
grant select on public.whisper_votes to authenticated;

-- Los comentarios se ven si se puede ver la confesión (esa tabla ya aplica sus propias reglas).
-- Un comentario "oculto por reportes" solo lo ve quien lo escribió y moderación: su texto ni siquiera viaja.
drop policy if exists "whisper_comments_select" on public.whisper_comments;
create policy "whisper_comments_select" on public.whisper_comments
  for select to authenticated
  using (
    exists (select 1 from public.whispers w where w.id = whisper_id)
    and (status <> 'hidden'
         or public.whisper_comment_is_mine(id)
         or public.whisper_has_perm(auth.uid(), 'moderate_whispers'))
  );
grant select on public.whisper_comments to authenticated;

drop policy if exists "whisper_comment_authors_select_own" on public.whisper_comment_authors;
create policy "whisper_comment_authors_select_own" on public.whisper_comment_authors
  for select to authenticated using (user_id = auth.uid());
grant select on public.whisper_comment_authors to authenticated;

-- whisper_aliases: sin políticas ni permisos (solo las funciones la usan)

drop policy if exists "whisper_reports_select_staff" on public.whisper_reports;
create policy "whisper_reports_select_staff" on public.whisper_reports
  for select to authenticated using (public.whisper_has_perm(auth.uid(), 'moderate_whispers'));
grant select on public.whisper_reports to authenticated;

-- Ojo: quien solo modera NO puede leer esta lista (así no podría deducir quién escribió algo
-- mirando a quién silenció). La ve cada persona en lo suyo y quien tiene el permiso de revelar.
drop policy if exists "whisper_bans_select_own" on public.whisper_bans;
create policy "whisper_bans_select_own" on public.whisper_bans
  for select to authenticated
  using (user_id = auth.uid() or public.whisper_has_perm(auth.uid(), 'reveal_whisper_authors'));
grant select on public.whisper_bans to authenticated;

drop policy if exists "whisper_reveals_select_staff" on public.whisper_reveals;
create policy "whisper_reveals_select_staff" on public.whisper_reveals
  for select to authenticated using (public.whisper_has_perm(auth.uid(), 'reveal_whisper_authors'));
grant select on public.whisper_reveals to authenticated;


-- 5) FUNCIONES QUE USA LA APP (RPC) -------------------------------------------

-- 5.1 Publicar una confesión (anónima). Límite: 5 por día y 1 por minuto.
create or replace function public.whisper_create(p_content text, p_category text default 'confesion')
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me     uuid := auth.uid();
  v_text text := btrim(coalesce(p_content, ''));
  v_id   uuid;
begin
  perform public.whisper_guard(me);
  if char_length(v_text) < 5 or char_length(v_text) > 1000 then
    raise exception 'La confesión debe tener entre 5 y 1000 caracteres';
  end if;
  perform public.whisper_check_text(v_text);
  if p_category is null or p_category not in ('confesion','crush','chisme','pregunta','otro') then
    p_category := 'confesion';
  end if;

  if (select count(*) from public.whisper_authors where user_id = me and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'Llegaste al límite de 5 confesiones por día. Vuelve mañana';
  end if;
  if exists (select 1 from public.whisper_authors where user_id = me and created_at > now() - interval '1 minute') then
    raise exception 'Espera un minuto antes de publicar otra confesión';
  end if;

  insert into public.whispers (content, category) values (v_text, p_category) returning id into v_id;
  insert into public.whisper_authors (whisper_id, user_id) values (v_id, me);
  return v_id;
end;
$$;

-- 5.2 Votar: 1 (arriba), -1 (abajo) o 0 (quitar el voto). Devuelve el puntaje nuevo.
create or replace function public.whisper_vote(p_whisper uuid, p_value int)
returns int
language plpgsql security definer set search_path = public as $$
declare
  me      uuid := auth.uid();
  v_score int;
begin
  perform public.whisper_guard(me);
  if p_value not in (-1, 0, 1) then raise exception 'Voto no válido'; end if;
  if not exists (select 1 from public.whispers where id = p_whisper and status = 'visible') then
    raise exception 'Esta confesión no está disponible';
  end if;

  if p_value = 0 then
    delete from public.whisper_votes where whisper_id = p_whisper and user_id = me;
  else
    insert into public.whisper_votes (whisper_id, user_id, value) values (p_whisper, me, p_value)
    on conflict (whisper_id, user_id) do update set value = excluded.value, created_at = now();
  end if;

  select score into v_score from public.whispers where id = p_whisper;
  return v_score;
end;
$$;

-- 5.3 Comentar. p_anonymous = true → "Chismoso Anónimo #n"; false → con tu perfil.
create or replace function public.whisper_comment_create(
  p_whisper uuid, p_content text, p_parent uuid default null, p_anonymous boolean default true)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me            uuid := auth.uid();
  v_text        text := btrim(coalesce(p_content, ''));
  v_id          uuid;
  v_is_op       boolean := false;
  v_n           int := null;
  v_post_owner  uuid;
  v_parent_owner uuid;
  v_pref_ok     boolean;
begin
  perform public.whisper_guard(me);
  if char_length(v_text) < 1 or char_length(v_text) > 500 then
    raise exception 'El comentario debe tener entre 1 y 500 caracteres';
  end if;
  perform public.whisper_check_text(v_text);

  if not exists (select 1 from public.whispers where id = p_whisper and status = 'visible') then
    raise exception 'Esta confesión no está disponible';
  end if;
  if p_parent is not null and not exists (
    select 1 from public.whisper_comments
     where id = p_parent and whisper_id = p_whisper and deleted_at is null and status = 'visible'
  ) then
    raise exception 'El comentario al que respondes ya no está disponible';
  end if;

  if (select count(*) from public.whisper_comment_authors where user_id = me and created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'Estás comentando muy rápido. Espera unos minutos';
  end if;

  select user_id into v_post_owner from public.whisper_authors where whisper_id = p_whisper;

  if p_anonymous then
    if v_post_owner = me then
      v_is_op := true;            -- el autor de la confesión: se marca "Autor" sin revelar quién es
    else
      perform pg_advisory_xact_lock(hashtext(p_whisper::text));
      select n into v_n from public.whisper_aliases where whisper_id = p_whisper and user_id = me;
      if v_n is null then
        select coalesce(max(n), 0) + 1 into v_n from public.whisper_aliases where whisper_id = p_whisper;
        insert into public.whisper_aliases (whisper_id, user_id, n) values (p_whisper, me, v_n);
      end if;
    end if;
  end if;

  insert into public.whisper_comments (whisper_id, parent_comment_id, content, is_anonymous, author_id, anon_n, is_op)
  values (p_whisper, p_parent, v_text, p_anonymous, case when p_anonymous then null else me end, v_n, v_is_op)
  returning id into v_id;
  insert into public.whisper_comment_authors (comment_id, user_id) values (v_id, me);

  -- Avisos: a quien escribió el comentario respondido y/o a quien escribió la confesión
  if p_parent is not null then
    select user_id into v_parent_owner from public.whisper_comment_authors where comment_id = p_parent;
  end if;

  begin
    if v_parent_owner is not null and v_parent_owner <> me then
      select coalesce((notif_prefs ->> 'whispers')::boolean, true) into v_pref_ok from public.profiles where id = v_parent_owner;
      if coalesce(v_pref_ok, true)
         and (p_anonymous or not public.is_blocked_between(me, v_parent_owner)) then
        insert into public.notifications (recipient_id, actor_id, type, whisper_id, whisper_comment_id, anonymous)
        values (v_parent_owner, case when p_anonymous then v_parent_owner else me end, 'whisper_reply', p_whisper, v_id, p_anonymous)
        on conflict do nothing;
      end if;
    end if;

    if v_post_owner is not null and v_post_owner <> me and v_post_owner is distinct from v_parent_owner then
      select coalesce((notif_prefs ->> 'whispers')::boolean, true) into v_pref_ok from public.profiles where id = v_post_owner;
      if coalesce(v_pref_ok, true)
         and (p_anonymous or not public.is_blocked_between(me, v_post_owner)) then
        insert into public.notifications (recipient_id, actor_id, type, whisper_id, whisper_comment_id, anonymous)
        values (v_post_owner, case when p_anonymous then v_post_owner else me end, 'whisper_comment', p_whisper, v_id, p_anonymous)
        on conflict do nothing;
      end if;
    end if;
  exception when others then
    null;   -- un fallo en los avisos nunca impide comentar
  end;

  return v_id;
end;
$$;

-- 5.4 Borrar tu propia confesión. Si ya tiene reportes pendientes, queda retenida para que
--     moderación pueda revisarla (no se puede borrar para escapar de un reporte).
create or replace function public.whisper_delete(p_whisper uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;
  if not exists (select 1 from public.whisper_authors where whisper_id = p_whisper and user_id = me) then
    raise exception 'Solo quien la escribió puede borrarla';
  end if;
  if exists (select 1 from public.whisper_reports where whisper_id = p_whisper and status = 'pending') then
    update public.whispers set status = 'removed', removed_by_author = true where id = p_whisper;
  else
    delete from public.whispers where id = p_whisper;
  end if;
end;
$$;

-- 5.5 Borrar tu propio comentario (si tiene respuestas, queda el hueco "comentario eliminado")
create or replace function public.whisper_comment_delete(p_comment uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;
  if not exists (select 1 from public.whisper_comment_authors where comment_id = p_comment and user_id = me) then
    raise exception 'Solo quien lo escribió puede borrarlo';
  end if;
  update public.whisper_comments set content = '', deleted_at = coalesce(deleted_at, now()) where id = p_comment;
  delete from public.notifications where whisper_comment_id = p_comment;
end;
$$;

-- 5.6 Reportar una confesión o un comentario. Con 3 reportes distintos se oculta solo,
--     mientras moderación lo revisa.
create or replace function public.whisper_report(
  p_whisper uuid, p_comment uuid, p_reason text, p_details text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me         uuid := auth.uid();
  v_snapshot text;
  v_count    int;
  v_details  text := nullif(left(btrim(coalesce(p_details, '')), 300), '');
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;
  if (p_whisper is null) = (p_comment is null) then raise exception 'Reporte no válido'; end if;
  if p_reason is null or p_reason not in ('ofensivo','acoso','datos_personales','odio','spam','otro') then
    raise exception 'Elige un motivo para el reporte';
  end if;

  if p_whisper is not null then
    select content into v_snapshot from public.whispers where id = p_whisper and status in ('visible','hidden');
    if not found then raise exception 'Esta confesión no está disponible'; end if;
    if exists (select 1 from public.whisper_authors where whisper_id = p_whisper and user_id = me) then
      raise exception 'No puedes reportar tu propia confesión';
    end if;
    begin
      insert into public.whisper_reports (reporter_id, whisper_id, reason, details, snapshot)
      values (me, p_whisper, p_reason, v_details, v_snapshot);
    exception when unique_violation then
      raise exception 'Ya reportaste esta confesión';
    end;
    select count(*) into v_count from public.whisper_reports where whisper_id = p_whisper and status = 'pending';
    if v_count >= 3 then
      update public.whispers set status = 'hidden' where id = p_whisper and status = 'visible';
    end if;
  else
    select content into v_snapshot from public.whisper_comments
     where id = p_comment and deleted_at is null and status in ('visible','hidden');
    if not found then raise exception 'Este comentario no está disponible'; end if;
    if exists (select 1 from public.whisper_comment_authors where comment_id = p_comment and user_id = me) then
      raise exception 'No puedes reportar tu propio comentario';
    end if;
    begin
      insert into public.whisper_reports (reporter_id, comment_id, reason, details, snapshot)
      values (me, p_comment, p_reason, v_details, v_snapshot);
    exception when unique_violation then
      raise exception 'Ya reportaste este comentario';
    end;
    select count(*) into v_count from public.whisper_reports where comment_id = p_comment and status = 'pending';
    if v_count >= 3 then
      update public.whisper_comments set status = 'hidden' where id = p_comment and status = 'visible';
    end if;
  end if;
end;
$$;

-- 5.6b ¿Ya reporté esto? (para que el botón no deje reportar dos veces)
create or replace function public.whisper_my_reports()
returns table (whisper_id uuid, comment_id uuid)
language sql stable security definer set search_path = public as $$
  select r.whisper_id, r.comment_id from public.whisper_reports r where r.reporter_id = auth.uid();
$$;


-- 6) HERRAMIENTAS DE MODERACIÓN -----------------------------------------------

-- 6.1 Resolver un contenido reportado.
--     p_kind: 'whisper' | 'comment'   ·   p_action: 'dismiss' (todo bien, se restaura) | 'remove' (se elimina)
create or replace function public.admin_whisper_action(p_kind text, p_id uuid, p_action text, p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
begin
  if not public.whisper_has_perm(me, 'moderate_whispers') then
    raise exception 'No tienes permiso para moderar el Muro';
  end if;
  if p_kind not in ('whisper','comment') or p_action not in ('dismiss','remove') then
    raise exception 'Acción no válida';
  end if;

  if p_kind = 'whisper' then
    if p_action = 'remove' then
      update public.whispers set status = 'removed' where id = p_id;
    else
      update public.whispers set status = 'visible' where id = p_id and status = 'hidden';
    end if;
    update public.whisper_reports
       set status = case when p_action = 'remove' then 'resolved' else 'dismissed' end,
           resolved_by = me, resolved_at = now(), resolution = nullif(btrim(coalesce(p_note, '')), '')
     where whisper_id = p_id and status = 'pending';
  else
    if p_action = 'remove' then
      update public.whisper_comments
         set content = '', deleted_at = coalesce(deleted_at, now()), status = 'removed'
       where id = p_id;
      delete from public.notifications where whisper_comment_id = p_id;
    else
      update public.whisper_comments set status = 'visible' where id = p_id and status = 'hidden';
    end if;
    update public.whisper_reports
       set status = case when p_action = 'remove' then 'resolved' else 'dismissed' end,
           resolved_by = me, resolved_at = now(), resolution = nullif(btrim(coalesce(p_note, '')), '')
     where comment_id = p_id and status = 'pending';
  end if;
end;
$$;

-- 6.2 Silenciar al autor de un contenido SIN saber quién es (1 a 365 días)
create or replace function public.admin_whisper_silence_author(p_kind text, p_id uuid, p_days int, p_reason text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me      uuid := auth.uid();
  v_user  uuid;
begin
  if not public.whisper_has_perm(me, 'moderate_whispers') then
    raise exception 'No tienes permiso para moderar el Muro';
  end if;
  if p_days is null or p_days < 1 or p_days > 365 then raise exception 'Los días deben ir de 1 a 365'; end if;

  if p_kind = 'whisper' then
    select user_id into v_user from public.whisper_authors where whisper_id = p_id;
  elsif p_kind = 'comment' then
    select user_id into v_user from public.whisper_comment_authors where comment_id = p_id;
  else
    raise exception 'Acción no válida';
  end if;
  if v_user is null then raise exception 'No se encontró al autor'; end if;
  if public.whisper_is_supreme(v_user) then raise exception 'No se puede silenciar a un Admin Supremo'; end if;

  insert into public.whisper_bans (user_id, until, reason, created_by)
  values (v_user, now() + make_interval(days => p_days), nullif(btrim(coalesce(p_reason, '')), ''), me)
  on conflict (user_id) do update
    set until = excluded.until, reason = excluded.reason, created_by = excluded.created_by, created_at = now();
end;
$$;

-- 6.3 Revelar quién escribió un contenido. Solo con el permiso especial, con motivo, y queda registrado.
create or replace function public.admin_whisper_reveal(p_kind text, p_id uuid, p_reason text)
returns table (author_id uuid, username text, id_student text, avatar_url text)
language plpgsql security definer set search_path = public as $$
declare
  me      uuid := auth.uid();
  v_user  uuid;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if not public.whisper_has_perm(me, 'reveal_whisper_authors') then
    raise exception 'No tienes permiso para ver autores del Muro';
  end if;
  if char_length(v_reason) < 10 then
    raise exception 'Escribe un motivo de al menos 10 caracteres: queda registrado en el historial';
  end if;

  if p_kind = 'whisper' then
    select user_id into v_user from public.whisper_authors where whisper_id = p_id;
  elsif p_kind = 'comment' then
    select user_id into v_user from public.whisper_comment_authors where comment_id = p_id;
  else
    raise exception 'Acción no válida';
  end if;
  if v_user is null then raise exception 'No se encontró al autor (la cuenta pudo haberse eliminado)'; end if;

  insert into public.whisper_reveals (admin_id, target_kind, target_id, author_id, reason)
  values (me, p_kind, p_id, v_user, v_reason);

  return query
    select p.id, p.username, p.id_student, p.avatar_url from public.profiles p where p.id = v_user;
end;
$$;

-- 6.4 Encender o apagar el Muro (solo Admin Supremo)
create or replace function public.admin_set_whispers_enabled(p_enabled boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.whisper_is_supreme(auth.uid()) then
    raise exception 'Solo el Admin Supremo puede hacer esto';
  end if;
  update public.app_settings
     set value = to_jsonb(p_enabled), updated_at = now(), updated_by = auth.uid()
   where key = 'whispers_enabled';
  if not found then
    insert into public.app_settings (key, value, updated_at, updated_by)
    values ('whispers_enabled', to_jsonb(p_enabled), now(), auth.uid());
  end if;
end;
$$;


-- 7) PERMISOS DE LAS FUNCIONES ----------------------------------------------------
revoke execute on function
  public.whisper_is_supreme(uuid), public.whisper_has_perm(uuid, text), public.whispers_enabled(),
  public.whisper_is_mine(uuid), public.whisper_comment_is_mine(uuid), public.whisper_guard(uuid), public.whisper_create(text, text),
  public.whisper_vote(uuid, int), public.whisper_comment_create(uuid, text, uuid, boolean),
  public.whisper_delete(uuid), public.whisper_comment_delete(uuid),
  public.whisper_report(uuid, uuid, text, text), public.whisper_my_reports(),
  public.admin_whisper_action(text, uuid, text, text),
  public.admin_whisper_silence_author(text, uuid, int, text),
  public.admin_whisper_reveal(text, uuid, text), public.admin_set_whispers_enabled(boolean)
from public, anon;
grant execute on function
  public.whisper_is_supreme(uuid), public.whisper_has_perm(uuid, text), public.whispers_enabled(),
  public.whisper_is_mine(uuid), public.whisper_comment_is_mine(uuid), public.whisper_create(text, text),
  public.whisper_vote(uuid, int), public.whisper_comment_create(uuid, text, uuid, boolean),
  public.whisper_delete(uuid), public.whisper_comment_delete(uuid),
  public.whisper_report(uuid, uuid, text, text), public.whisper_my_reports(),
  public.admin_whisper_action(text, uuid, text, text),
  public.admin_whisper_silence_author(text, uuid, int, text),
  public.admin_whisper_reveal(text, uuid, text), public.admin_set_whispers_enabled(boolean)
to authenticated;

-- Listo. Para ver el Muro desde Supabase:  select id, content, score from public.whispers;
