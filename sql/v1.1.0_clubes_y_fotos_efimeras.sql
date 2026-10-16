-- =====================================================================
-- DaiwaPlace v1.1.0 — Clubes y Pandillas + fotos que se autodestruyen en los DMs
-- Pégalo completo en Supabase → SQL Editor → New query → Run.
-- Es seguro correrlo más de una vez (no duplica nada).
-- Requiere haber corrido antes los SQL anteriores (ya los tienes), en especial el de la
-- v0.12.0 (mensajes), el de la v0.13.0 (de ahí sale whisper_has_perm) y el de la v1.0.0.
--
-- Qué hace:
--   1) Clubes y Pandillas: solicitudes de creación, clubes, miembros, roles estéticos,
--      solicitudes para unirse, tablón de anuncios fijado y el feed exclusivo.
--   2) Permiso nuevo para el Taller de Roles: "manage_clubs" (aceptar/declinar clubes).
--      Se guarda dentro de roles.permissions igual que los demás: no hay que correr nada más.
--   3) Avisos nuevos: tu solicitud fue aprobada/declinada, alguien quiere unirse a tu club,
--      te aceptaron en un club.
--   4) Fotos efímeras en los mensajes directos (1, 4, 8, 12 o 24 horas) con el campo
--      expires_at y un bucket PRIVADO "dm-images".
-- =====================================================================


-- =====================================================================
-- PARTE 1 · CLUBES Y PANDILLAS
-- =====================================================================

-- 1.1 Solicitudes de creación -------------------------------------------
create table if not exists public.club_requests (
  id             uuid primary key default gen_random_uuid(),
  requester_id   uuid not null references public.profiles(id) on delete cascade,
  club_name      text not null check (char_length(btrim(club_name)) between 3 and 40),
  kind           text not null check (kind in ('club', 'pandilla')),
  details        text check (details is null or char_length(details) <= 500),
  status         text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'completed')),
  decline_reason text check (decline_reason is null or char_length(decline_reason) <= 300),
  decided_by     uuid references public.profiles(id) on delete set null,
  decided_at     timestamptz,
  club_id        uuid,
  created_at     timestamptz not null default now()
);
-- Una persona solo puede tener UNA solicitud abierta (pendiente o aprobada sin usar) a la vez
create unique index if not exists club_requests_one_open
  on public.club_requests (requester_id) where status in ('pending', 'approved');
create index if not exists club_requests_status_idx on public.club_requests (status, created_at desc);

-- 1.2 Clubes --------------------------------------------------------------
create table if not exists public.clubs (
  id                       uuid primary key default gen_random_uuid(),
  slug                     text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 50),
  name                     text not null check (char_length(btrim(name)) between 3 and 40),
  kind                     text not null check (kind in ('club', 'pandilla')),
  description              text check (description is null or char_length(description) <= 600),
  avatar_url               text check (avatar_url is null or char_length(avatar_url) <= 600),
  banner_url               text check (banner_url is null or char_length(banner_url) <= 600),
  color                    text not null default '#7c8cff' check (color ~ '^#[0-9a-fA-F]{6}$'),
  leader_id                uuid not null references public.profiles(id) on delete cascade,
  announcement             text check (announcement is null or char_length(announcement) <= 400),
  announcement_updated_at  timestamptz,
  request_id               uuid references public.club_requests(id) on delete set null,
  created_at               timestamptz not null default now()
);
create unique index if not exists clubs_name_unique on public.clubs (lower(btrim(name)));
create index if not exists clubs_leader_idx on public.clubs (leader_id);

-- 1.3 Roles internos (solo estéticos: no dan ningún permiso en la página) -------
create table if not exists public.club_roles (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references public.clubs(id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 60),
  color      text not null default '#7c8cff' check (color ~ '^#[0-9a-fA-F]{6}$'),
  is_leader  boolean not null default false,
  created_at timestamptz not null default now(),
  -- el rol base "Líder de ..." puede ser largo; los que crea el líder, máximo 24 letras
  constraint club_roles_custom_len check (is_leader or char_length(btrim(name)) <= 24)
);
create unique index if not exists club_roles_one_leader on public.club_roles (club_id) where is_leader;
create unique index if not exists club_roles_name_unique on public.club_roles (club_id, lower(btrim(name)));
create index if not exists club_roles_club_idx on public.club_roles (club_id);

-- 1.4 Miembros ---------------------------------------------------------------
create table if not exists public.club_members (
  club_id   uuid not null references public.clubs(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role_id   uuid references public.club_roles(id) on delete set null,
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);
create index if not exists club_members_user_idx on public.club_members (user_id);

-- 1.5 Solicitudes para unirse -------------------------------------------------
create table if not exists public.club_join_requests (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references public.clubs(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create unique index if not exists club_join_one_pending
  on public.club_join_requests (club_id, user_id) where status = 'pending';
create index if not exists club_join_club_idx on public.club_join_requests (club_id, status);

-- Ahora que existe "clubs", la solicitud puede apuntar al club que se creó con ella
do $$
begin
  alter table public.club_requests
    add constraint club_requests_club_id_fkey foreign key (club_id) references public.clubs(id) on delete set null;
exception when duplicate_object then null;
end;
$$;


-- 1.6 Funciones de ayuda ---------------------------------------------------------
create or replace function public.club_is_leader(p_club uuid, p_user uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select p_user is not null and exists (select 1 from public.clubs where id = p_club and leader_id = p_user);
$$;

-- Texto → dirección web: "Los Cuervos Ñ" → "los-cuervos-n"
create or replace function public.club_slugify(p_text text)
returns text
language sql immutable set search_path = public as $$
  select trim(both '-' from regexp_replace(
    translate(lower(coalesce(p_text, '')), 'áéíóúüñàèìòùâêîôûãõç', 'aeiouunaeiouaeiouaoc'),
    '[^a-z0-9]+', '-', 'g'));
$$;


-- 1.7 Seguridad (RLS) -------------------------------------------------------------
alter table public.club_requests      enable row level security;
alter table public.clubs              enable row level security;
alter table public.club_roles         enable row level security;
alter table public.club_members       enable row level security;
alter table public.club_join_requests enable row level security;

revoke all on public.club_requests, public.clubs, public.club_roles, public.club_members, public.club_join_requests
  from anon, authenticated;

-- Los clubes, sus roles y sus miembros se ven en todos lados (feed, perfiles): lectura abierta
drop policy if exists "clubs_select" on public.clubs;
create policy "clubs_select" on public.clubs for select to anon, authenticated using (true);
drop policy if exists "club_roles_select" on public.club_roles;
create policy "club_roles_select" on public.club_roles for select to anon, authenticated using (true);
drop policy if exists "club_members_select" on public.club_members;
create policy "club_members_select" on public.club_members for select to anon, authenticated using (true);
grant select on public.clubs, public.club_roles, public.club_members to anon, authenticated;

-- El líder edita SOLO la información visible de su club (no el nombre, no el tipo, no el líder)
drop policy if exists "clubs_update_leader" on public.clubs;
create policy "clubs_update_leader" on public.clubs
  for update to authenticated using (leader_id = auth.uid()) with check (leader_id = auth.uid());
grant update (description, avatar_url, banner_url, color, announcement) on public.clubs to authenticated;

-- El líder crea, renombra y borra los roles estéticos de SU club (nunca el rol base de líder)
drop policy if exists "club_roles_insert_leader" on public.club_roles;
create policy "club_roles_insert_leader" on public.club_roles
  for insert to authenticated with check (is_leader = false and public.club_is_leader(club_id, auth.uid()));
drop policy if exists "club_roles_update_leader" on public.club_roles;
create policy "club_roles_update_leader" on public.club_roles
  for update to authenticated
  using (is_leader = false and public.club_is_leader(club_id, auth.uid()))
  with check (is_leader = false and public.club_is_leader(club_id, auth.uid()));
drop policy if exists "club_roles_delete_leader" on public.club_roles;
create policy "club_roles_delete_leader" on public.club_roles
  for delete to authenticated using (is_leader = false and public.club_is_leader(club_id, auth.uid()));
grant insert (club_id, name, color) on public.club_roles to authenticated;
grant update (name, color) on public.club_roles to authenticated;
grant delete on public.club_roles to authenticated;

-- Solicitudes de creación: las ve quien las hizo y el equipo con el permiso "manage_clubs"
drop policy if exists "club_requests_select" on public.club_requests;
create policy "club_requests_select" on public.club_requests
  for select to authenticated
  using (requester_id = auth.uid() or public.whisper_has_perm(auth.uid(), 'manage_clubs'));
grant select on public.club_requests to authenticated;

-- Solicitudes para unirse: las ve quien las hizo y el líder del club
drop policy if exists "club_join_select" on public.club_join_requests;
create policy "club_join_select" on public.club_join_requests
  for select to authenticated using (user_id = auth.uid() or public.club_is_leader(club_id, auth.uid()));
grant select on public.club_join_requests to authenticated;


-- 1.8 Triggers --------------------------------------------------------------------

-- La fecha del anuncio fijado se pone sola cuando el texto cambia; máximo 12 roles por club
create or replace function public.trg_club_before_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.announcement is distinct from old.announcement then
    new.announcement := nullif(btrim(coalesce(new.announcement, '')), '');
    new.announcement_updated_at := case when new.announcement is null then null else now() end;
  end if;
  new.description := nullif(btrim(coalesce(new.description, '')), '');
  return new;
end;
$$;
drop trigger if exists club_before_update on public.clubs;
create trigger club_before_update before update on public.clubs
  for each row execute function public.trg_club_before_update();

create or replace function public.trg_club_role_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.club_roles where club_id = new.club_id and not is_leader) >= 12 then
    raise exception 'Un club puede tener máximo 12 roles propios';
  end if;
  return new;
end;
$$;
drop trigger if exists club_role_limit on public.club_roles;
create trigger club_role_limit before insert on public.club_roles
  for each row execute function public.trg_club_role_limit();


-- 1.9 Avisos nuevos (notificaciones) -------------------------------------------------
alter table public.notifications add column if not exists club_id uuid;
alter table public.notifications add column if not exists club_request_id uuid;
do $$
begin
  alter table public.notifications
    add constraint notifications_club_id_fkey foreign key (club_id) references public.clubs(id) on delete cascade;
exception when duplicate_object then null;
end;
$$;
do $$
begin
  alter table public.notifications
    add constraint notifications_club_request_id_fkey foreign key (club_request_id) references public.club_requests(id) on delete cascade;
exception when duplicate_object then null;
end;
$$;

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'like_post','like_comment','comment','reply','follow','like_note','whisper_comment','whisper_reply',
    'mention_post','mention_comment','whisper_mention','whisper_comment_mention',
    'club_approved','club_declined','club_join_request','club_join_accepted'
  ));

create unique index if not exists notifications_uniq_club_request
  on public.notifications (club_request_id, type) where type in ('club_approved', 'club_declined');
create unique index if not exists notifications_uniq_club_join_request
  on public.notifications (actor_id, club_id) where type = 'club_join_request';
create unique index if not exists notifications_uniq_club_join_accepted
  on public.notifications (recipient_id, club_id) where type = 'club_join_accepted';


-- 1.10 Funciones que usa la página (RPC) ----------------------------------------------

-- Pedir que se cree un club o pandilla (la reglas se muestran en pantalla antes de enviar)
create or replace function public.club_request_create(p_name text, p_kind text, p_details text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me     uuid := auth.uid();
  v_name text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_id   uuid;
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;
  if p_kind is null or p_kind not in ('club', 'pandilla') then raise exception 'Elige si es un Club o una Pandilla'; end if;
  if char_length(v_name) < 3 or char_length(v_name) > 40 then raise exception 'El nombre debe tener entre 3 y 40 caracteres'; end if;
  if exists (select 1 from public.profiles where id = me and is_frozen) then
    raise exception 'Tu cuenta está congelada';
  end if;
  if exists (select 1 from public.clubs where lower(btrim(name)) = lower(v_name))
     or exists (select 1 from public.club_requests where status in ('pending', 'approved') and lower(btrim(club_name)) = lower(v_name)) then
    raise exception 'Ya existe un club o una solicitud con ese nombre';
  end if;
  if exists (select 1 from public.club_requests where requester_id = me and status in ('pending', 'approved')) then
    raise exception 'Ya tienes una solicitud abierta. Espera a que el equipo la revise';
  end if;

  insert into public.club_requests (requester_id, club_name, kind, details)
  values (me, v_name, p_kind, nullif(left(btrim(coalesce(p_details, '')), 500), ''))
  returning id into v_id;
  return v_id;
end;
$$;

-- Cancelar mi solicitud mientras sigue pendiente
create or replace function public.club_request_cancel(p_request uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.club_requests where id = p_request and requester_id = auth.uid() and status = 'pending';
end;
$$;

-- El equipo acepta ('approve') o declina ('decline') una solicitud
create or replace function public.club_request_decide(p_request uuid, p_action text, p_reason text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  r  record;
begin
  if not (public.whisper_has_perm(me, 'manage_clubs') or session_user = 'postgres') then
    raise exception 'No tienes permiso para revisar solicitudes de clubes';
  end if;
  if p_action not in ('approve', 'decline') then raise exception 'Acción no válida'; end if;

  select * into r from public.club_requests where id = p_request for update;
  if not found then raise exception 'Solicitud no encontrada'; end if;
  if r.status <> 'pending' then raise exception 'Esta solicitud ya fue revisada'; end if;

  if p_action = 'approve' then
    if exists (select 1 from public.clubs where lower(btrim(name)) = lower(btrim(r.club_name))) then
      raise exception 'Ya existe un club con ese nombre';
    end if;
    update public.club_requests
       set status = 'approved', decided_by = me, decided_at = now(), decline_reason = null
     where id = p_request;
    insert into public.notifications (recipient_id, actor_id, type, club_request_id)
    values (r.requester_id, coalesce(me, r.requester_id), 'club_approved', p_request)
    on conflict do nothing;
  else
    update public.club_requests
       set status = 'declined', decided_by = me, decided_at = now(),
           decline_reason = nullif(left(btrim(coalesce(p_reason, '')), 300), '')
     where id = p_request;
    insert into public.notifications (recipient_id, actor_id, type, club_request_id)
    values (r.requester_id, coalesce(me, r.requester_id), 'club_declined', p_request)
    on conflict do nothing;
  end if;
end;
$$;

-- El enlace de configuración: solo lo puede usar quien hizo la solicitud, y una sola vez.
-- El nombre y el tipo quedan como los aprobó el equipo; aquí solo se ponen la descripción, las fotos y el color.
create or replace function public.club_create_from_request(
  p_request uuid, p_description text, p_avatar text, p_banner text, p_color text default '#7c8cff')
returns text
language plpgsql security definer set search_path = public as $$
declare
  me      uuid := auth.uid();
  r       record;
  v_base  text;
  v_slug  text;
  v_n     int := 1;
  v_club  uuid;
  v_role  uuid;
  v_color text := case when p_color ~ '^#[0-9a-fA-F]{6}$' then p_color else '#7c8cff' end;
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;

  select * into r from public.club_requests where id = p_request for update;
  if not found or r.requester_id <> me then raise exception 'Este enlace no es para ti'; end if;
  if r.status = 'completed' then raise exception 'Este enlace ya se usó'; end if;
  if r.status <> 'approved' then raise exception 'Esta solicitud todavía no está aprobada'; end if;

  if char_length(coalesce(p_description, '')) > 600 then raise exception 'La descripción es muy larga'; end if;
  if (p_avatar is not null and p_avatar !~ '^https://') or (p_banner is not null and p_banner !~ '^https://') then
    raise exception 'La imagen no es válida';
  end if;

  v_base := public.club_slugify(r.club_name);
  if v_base = '' or char_length(v_base) < 2 then v_base := 'club'; end if;
  if v_base in ('configurar', 'buscar', 'nuevo', 'solicitar', 'admin') then v_base := v_base || '-club'; end if;
  v_base := trim(both '-' from left(v_base, 44));
  if v_base = '' then v_base := 'club'; end if;
  v_slug := v_base;
  while exists (select 1 from public.clubs where slug = v_slug) loop
    v_n := v_n + 1;
    v_slug := v_base || '-' || v_n;
  end loop;

  insert into public.clubs (slug, name, kind, description, avatar_url, banner_url, color, leader_id, request_id)
  values (v_slug, r.club_name, r.kind, nullif(btrim(coalesce(p_description, '')), ''),
          nullif(p_avatar, ''), nullif(p_banner, ''), v_color, me, r.id)
  returning id into v_club;

  -- Rol base automático: "Líder de [Nombre]"
  insert into public.club_roles (club_id, name, color, is_leader)
  values (v_club, 'Líder de ' || r.club_name, v_color, true)
  returning id into v_role;

  insert into public.club_members (club_id, user_id, role_id) values (v_club, me, v_role);

  update public.club_requests set status = 'completed', club_id = v_club where id = r.id;
  return v_slug;
end;
$$;

-- Pedir unirme (ya lo hablé con el líder por Discord)
create or replace function public.club_request_join(p_club uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me       uuid := auth.uid();
  v_leader uuid;
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;
  select leader_id into v_leader from public.clubs where id = p_club;
  if not found then raise exception 'Ese club no existe'; end if;
  if exists (select 1 from public.club_members where club_id = p_club and user_id = me) then
    raise exception 'Ya eres parte de este club';
  end if;
  if exists (select 1 from public.profiles where id = me and is_frozen) then raise exception 'Tu cuenta está congelada'; end if;
  if public.is_blocked_between(me, v_leader) then raise exception 'No puedes enviar esta solicitud'; end if;
  if exists (select 1 from public.club_join_requests where club_id = p_club and user_id = me and status = 'pending') then
    raise exception 'Ya enviaste tu solicitud: espera la respuesta del líder';
  end if;

  insert into public.club_join_requests (club_id, user_id) values (p_club, me);
  insert into public.notifications (recipient_id, actor_id, type, club_id)
  values (v_leader, me, 'club_join_request', p_club)
  on conflict do nothing;
end;
$$;

-- Cancelar mi solicitud para unirme
create or replace function public.club_cancel_join(p_club uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
begin
  delete from public.club_join_requests where club_id = p_club and user_id = me and status = 'pending';
  delete from public.notifications where type = 'club_join_request' and actor_id = me and club_id = p_club;
end;
$$;

-- El líder acepta ('accept') o declina ('decline') una solicitud para unirse
create or replace function public.club_respond_join(p_request uuid, p_action text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  r  record;
begin
  if p_action not in ('accept', 'decline') then raise exception 'Acción no válida'; end if;
  select * into r from public.club_join_requests where id = p_request for update;
  if not found or not public.club_is_leader(r.club_id, me) then raise exception 'Solicitud no encontrada'; end if;
  if r.status <> 'pending' then raise exception 'Esta solicitud ya fue respondida'; end if;

  if p_action = 'accept' then
    insert into public.club_members (club_id, user_id) values (r.club_id, r.user_id) on conflict do nothing;
    update public.club_join_requests set status = 'accepted', decided_at = now() where id = p_request;
    insert into public.notifications (recipient_id, actor_id, type, club_id)
    values (r.user_id, me, 'club_join_accepted', r.club_id)
    on conflict do nothing;
  else
    update public.club_join_requests set status = 'declined', decided_at = now() where id = p_request;
  end if;
  -- el aviso de "quiere unirse" ya no hace falta
  delete from public.notifications where type = 'club_join_request' and actor_id = r.user_id and club_id = r.club_id;
end;
$$;

-- Salir de un club (el líder no puede salir: tendría que pedirle al equipo que lo cierre o lo traspase)
create or replace function public.club_leave(p_club uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.club_is_leader(p_club, auth.uid()) then
    raise exception 'El líder no puede salir de su propio club';
  end if;
  delete from public.club_members where club_id = p_club and user_id = auth.uid();
end;
$$;

-- El líder saca a un miembro
create or replace function public.club_remove_member(p_club uuid, p_user uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.club_is_leader(p_club, auth.uid()) then raise exception 'Solo el líder puede hacer esto'; end if;
  if p_user = auth.uid() then raise exception 'No puedes sacarte a ti mismo'; end if;
  delete from public.club_members where club_id = p_club and user_id = p_user;
end;
$$;

-- El líder le da (o le quita, con null) un rol estético a un miembro
create or replace function public.club_set_member_role(p_club uuid, p_user uuid, p_role uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.club_is_leader(p_club, auth.uid()) then raise exception 'Solo el líder puede hacer esto'; end if;
  if public.club_is_leader(p_club, p_user) then raise exception 'El líder siempre conserva su rol de líder'; end if;
  if p_role is not null and not exists (
    select 1 from public.club_roles where id = p_role and club_id = p_club and not is_leader
  ) then
    raise exception 'Ese rol no existe en este club';
  end if;
  update public.club_members set role_id = p_role where club_id = p_club and user_id = p_user;
end;
$$;

-- El equipo (permiso manage_clubs) puede cerrar un club que rompa las reglas
create or replace function public.club_admin_delete(p_club uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.whisper_has_perm(auth.uid(), 'manage_clubs') or session_user = 'postgres') then
    raise exception 'No tienes permiso para cerrar clubes';
  end if;
  delete from public.clubs where id = p_club;
end;
$$;

-- Feed de clubes: ids de las publicaciones más recientes de personas que están en algún club
-- (p_club = null → todos los clubes; con un id → solo los miembros de ese club)
create or replace function public.club_feed_ids(p_club uuid default null, p_limit int default 16)
returns setof uuid
language sql stable security definer set search_path = public as $$
  select p.id
  from public.posts p
  where exists (
    select 1 from public.club_members m
    where m.user_id = p.user_id and (p_club is null or m.club_id = p_club)
  )
  order by p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 16), 100));
$$;

-- Permisos de las funciones: solo personas con sesión iniciada
revoke execute on function
  public.club_is_leader(uuid, uuid), public.club_request_create(text, text, text), public.club_request_cancel(uuid),
  public.club_request_decide(uuid, text, text), public.club_create_from_request(uuid, text, text, text, text),
  public.club_request_join(uuid), public.club_cancel_join(uuid), public.club_respond_join(uuid, text),
  public.club_leave(uuid), public.club_remove_member(uuid, uuid), public.club_set_member_role(uuid, uuid, uuid),
  public.club_admin_delete(uuid), public.club_feed_ids(uuid, int)
from public, anon;
grant execute on function
  public.club_is_leader(uuid, uuid), public.club_request_create(text, text, text), public.club_request_cancel(uuid),
  public.club_request_decide(uuid, text, text), public.club_create_from_request(uuid, text, text, text, text),
  public.club_request_join(uuid), public.club_cancel_join(uuid), public.club_respond_join(uuid, text),
  public.club_leave(uuid), public.club_remove_member(uuid, uuid), public.club_set_member_role(uuid, uuid, uuid),
  public.club_admin_delete(uuid), public.club_feed_ids(uuid, int)
to authenticated;
-- El feed de clubes y las etiquetas también se pueden ver sin iniciar sesión (igual que el Inicio)
grant execute on function public.club_is_leader(uuid, uuid) to anon;


-- =====================================================================
-- PARTE 2 · FOTOS QUE SE AUTODESTRUYEN EN LOS MENSAJES DIRECTOS
-- =====================================================================

-- 2.1 Columnas nuevas en "messages"
--   image_path      → ruta de la foto dentro del bucket privado "dm-images"
--   image_hours     → lo que eligió quien la mandó: 1, 4, 8, 12 o 24 horas
--   expires_at      → cuándo desaparece (la calcula la base de datos, nadie puede inventarla)
--   image_purged_at → cuándo se borró el archivo de verdad del Storage (lo marca el cron job)
alter table public.messages add column if not exists image_path      text;
alter table public.messages add column if not exists image_w         int;
alter table public.messages add column if not exists image_h         int;
alter table public.messages add column if not exists image_hours     smallint;
alter table public.messages add column if not exists expires_at      timestamptz;
alter table public.messages add column if not exists image_purged_at timestamptz;

create index if not exists messages_expires_idx on public.messages (expires_at)
  where image_path is not null and image_purged_at is null;

-- Un mensaje puede ser solo una foto (texto vacío)
alter table public.messages drop constraint if exists messages_content_check;
alter table public.messages add constraint messages_content_check
  check (char_length(content) <= 2000 and (deleted_at is not null or image_path is not null or char_length(btrim(content)) >= 1));

alter table public.messages drop constraint if exists messages_image_check;
alter table public.messages add constraint messages_image_check
  check (image_path is null or (image_hours in (1, 4, 8, 12, 24) and expires_at is not null));

grant insert (image_path, image_w, image_h, image_hours) on public.messages to authenticated;

-- 2.2 Antes de guardar un mensaje: valida la foto y calcula expires_at con la hora del servidor
create or replace function public.trg_message_before()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.reply_to_id is not null then
    if not exists (
      select 1 from public.messages where id = new.reply_to_id and conversation_id = new.conversation_id
    ) then
      new.reply_to_id := null;
    end if;
  end if;

  if new.image_path is not null then
    if new.image_hours is null or new.image_hours not in (1, 4, 8, 12, 24) then
      raise exception 'Elige cuánto dura la foto: 1, 4, 8, 12 o 24 horas';
    end if;
    -- la foto tiene que estar guardada en la carpeta de ESTA conversación y de QUIEN la manda
    if split_part(new.image_path, '/', 1) <> new.conversation_id::text
       or split_part(new.image_path, '/', 2) <> new.sender_id::text then
      raise exception 'La foto no es válida';
    end if;
    new.expires_at := now() + make_interval(hours => new.image_hours);
    new.image_purged_at := null;
  else
    new.image_w := null;
    new.image_h := null;
    new.image_hours := null;
    new.expires_at := null;
    new.image_purged_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists message_before on public.messages;
create trigger message_before before insert on public.messages
  for each row execute function public.trg_message_before();

-- 2.3 Bandeja de entrada: si el último mensaje es una foto, se ve "📷 Foto" (misma firma de siempre)
create or replace function public.dm_inbox(p_requests boolean default false)
returns table (
  conversation_id uuid,
  status          text,
  initiator_id    uuid,
  other_id        uuid,
  other_username  text,
  other_id_student text,
  other_avatar_url text,
  nickname        text,
  last_message_at timestamptz,
  last_content    text,
  last_sender_id  uuid,
  last_deleted    boolean,
  unread_count    int
)
language sql stable security definer set search_path = public as $$
  select
    c.id, c.status, c.initiator_id,
    p.id, p.username, p.id_student, p.avatar_url,
    m.other_nickname,
    lm.created_at,
    case when lm.image_path is not null and btrim(lm.content) = '' then '📷 Foto' else lm.content end,
    lm.sender_id, (lm.deleted_at is not null),
    (select count(*)::int from public.messages x
      where x.conversation_id = c.id
        and x.sender_id <> auth.uid()
        and x.deleted_at is null
        and x.created_at > m.last_read_at
        and (m.hidden_at is null or x.created_at > m.hidden_at))
  from public.conversations c
  join public.conversation_members m on m.conversation_id = c.id and m.user_id = auth.uid()
  join public.profiles p on p.id = case when c.user_a = auth.uid() then c.user_b else c.user_a end
  left join lateral (
    select x.created_at, x.content, x.sender_id, x.deleted_at, x.image_path
    from public.messages x
    where x.conversation_id = c.id and (m.hidden_at is null or x.created_at > m.hidden_at)
    order by x.created_at desc
    limit 1
  ) lm on true
  where auth.uid() in (c.user_a, c.user_b)
    and lm.sender_id is not null
    and not public.is_blocked_between(c.user_a, c.user_b)
    and (
      (not p_requests and (c.status = 'accepted' or c.initiator_id = auth.uid()))
      or (p_requests and c.status = 'pending' and c.initiator_id <> auth.uid())
    )
  order by lm.created_at desc;
$$;

-- 2.4 Reportes: la copia de los mensajes dice "[Foto]" y guarda la ruta, para que el equipo
--     pueda abrir SOLO la foto reportada (y el cron job no la borra mientras el reporte siga pendiente)
create or replace function public.dm_report(
  p_conv uuid, p_message uuid, p_reason text, p_details text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me         uuid := auth.uid();
  v_other    uuid;
  v_snapshot jsonb;
  v_details  text := nullif(left(btrim(coalesce(p_details, '')), 300), '');
begin
  if me is null then raise exception 'Debes iniciar sesión'; end if;
  if p_reason is null or p_reason not in ('ofensivo','acoso','datos_personales','odio','spam','otro') then
    raise exception 'Elige un motivo para el reporte';
  end if;
  if not public.dm_is_member(p_conv, me) then raise exception 'Conversación no encontrada'; end if;

  select case when c.user_a = me then c.user_b else c.user_a end
    into v_other from public.conversations c where c.id = p_conv;

  if p_message is not null and not exists (
    select 1 from public.messages where id = p_message and conversation_id = p_conv
  ) then
    p_message := null;
  end if;

  -- Copia de los últimos 15 mensajes (sin los eliminados)
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', t.id,
           'from', case when t.sender_id = me then 'reporter' else 'reported' end,
           'content', case
                        when t.image_path is not null and btrim(t.content) = '' then '[Foto que se autodestruye]'
                        when t.image_path is not null then '[Foto que se autodestruye] ' || t.content
                        else t.content end,
           'image_path', t.image_path,
           'at', t.created_at,
           'flagged', (t.id = p_message)
         ) order by t.created_at), '[]'::jsonb)
    into v_snapshot
    from (
      select m.id, m.sender_id, m.content, m.created_at, m.image_path
      from public.messages m
      where m.conversation_id = p_conv and m.deleted_at is null
      order by m.created_at desc
      limit 15
    ) t;

  begin
    insert into public.dm_reports (reporter_id, reported_id, conversation_id, message_id, reason, details, snapshot)
    values (me, v_other, p_conv, p_message, p_reason, v_details, v_snapshot);
  exception when unique_violation then
    raise exception 'Ya reportaste esta conversación y está en revisión';
  end;
end;
$$;

-- 2.5 Bucket PRIVADO para las fotos (nadie las ve con un enlace público)
insert into storage.buckets (id, name, public)
values ('dm-images', 'dm-images', false)
on conflict (id) do nothing;

-- Tope de 5 MB por foto y solo imágenes (si tu versión de Supabase no tiene estas columnas, se ignora)
do $$
begin
  update storage.buckets
     set file_size_limit = 5242880,
         allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
   where id = 'dm-images';
exception when others then null;
end;
$$;

-- Ruta de cada foto:  <id de la conversación>/<id de quien la manda>/<archivo>.jpg
create or replace function public.dm_image_conv(p_name text)
returns uuid
language plpgsql immutable set search_path = public as $$
begin
  return split_part(p_name, '/', 1)::uuid;
exception when others then
  return null;
end;
$$;

-- Subir: solo dentro de una conversación donde puedes escribir, y solo en TU carpeta
drop policy if exists "dm_images_insert" on storage.objects;
create policy "dm_images_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'dm-images'
    and split_part(name, '/', 2) = auth.uid()::text
    and public.dm_can_send(public.dm_image_conv(name), auth.uid())
  );

-- ¿Puede esta persona ver esta foto ahora mismo?
--  · las dos personas de la conversación, mientras la foto no haya vencido ni se haya eliminado
--  · el equipo con "Ver evidencia", SOLO si la foto aparece en un reporte de mensajes
create or replace function public.dm_image_can_view(p_name text, p_user uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select p_user is not null and exists (
    select 1 from public.messages m
    where m.image_path = p_name
      and m.image_purged_at is null
      and (
        (public.dm_is_member(m.conversation_id, p_user) and m.deleted_at is null and m.expires_at > now())
        or (
          public.whisper_has_perm(p_user, 'view_evidence')
          and exists (
            select 1 from public.dm_reports r
            where r.conversation_id = m.conversation_id
              and r.snapshot @> jsonb_build_array(jsonb_build_object('id', m.id))
          )
        )
      )
  );
$$;

drop policy if exists "dm_images_select" on storage.objects;
create policy "dm_images_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'dm-images' and public.dm_image_can_view(name, auth.uid()));

-- Borrar: quien la subió (por ejemplo si el mensaje falló al enviarse o lo elimina)
drop policy if exists "dm_images_delete" on storage.objects;
create policy "dm_images_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'dm-images' and split_part(name, '/', 2) = auth.uid()::text);


-- 2.5.b Ayudantes del cron job (solo los puede llamar la clave de servicio del servidor, nadie desde el navegador)
--   · dm_images_to_purge: fotos vencidas (o de mensajes eliminados) cuyo archivo sigue en el Storage.
--     No incluye las que están en un reporte pendiente: se conservan hasta que el equipo lo resuelva.
--   · dm_images_mark_purged: marca que el archivo ya se borró de verdad.
create or replace function public.dm_images_to_purge(p_limit int default 200)
returns table (id uuid, image_path text)
language sql stable security definer set search_path = public as $$
  select m.id, m.image_path
  from public.messages m
  where m.image_path is not null
    and m.image_purged_at is null
    and (m.expires_at <= now() or m.deleted_at is not null)
    and not exists (
      select 1 from public.dm_reports r
      where r.status = 'pending'
        and r.conversation_id = m.conversation_id
        and r.snapshot @> jsonb_build_array(jsonb_build_object('id', m.id))
    )
  order by m.expires_at
  limit greatest(1, least(coalesce(p_limit, 200), 500));
$$;

create or replace function public.dm_images_mark_purged(p_ids uuid[])
returns void
language sql security definer set search_path = public as $$
  update public.messages set image_purged_at = now()
  where id = any (p_ids) and image_path is not null and image_purged_at is null;
$$;

revoke execute on function public.dm_images_to_purge(int), public.dm_images_mark_purged(uuid[]) from public, anon, authenticated;
grant execute on function public.dm_images_to_purge(int), public.dm_images_mark_purged(uuid[]) to service_role;


-- 2.6 BORRADO REAL DEL STORAGE (cron job)
--   Cuando una foto vence, la base de datos y las políticas de arriba ya dejan de entregarla a nadie.
--   Pero el ARCHIVO sigue ocupando espacio hasta que un cron job lo borre de verdad.
--   Ese cron job lee messages.expires_at, borra el archivo con la API de Storage y marca image_purged_at.
--   Está en  app/api/cron/dm-purge/route.ts  (se llama cada hora). Para programarlo desde Supabase:
--
--     1) Supabase → Database → Extensions: activa  pg_cron  y  pg_net.
--     2) En Vercel crea la variable  CRON_SECRET  (una clave larga que inventes) y vuelve a desplegar.
--     3) Corre esto UNA vez (cambia TU-DOMINIO y TU-CLAVE):
--
--        select cron.schedule(
--          'dm-purge-hourly', '0 * * * *',
--          $$ select net.http_post(
--               url     := 'https://TU-DOMINIO/api/cron/dm-purge',
--               headers := '{"Authorization": "Bearer TU-CLAVE"}'::jsonb
--             ) $$
--        );
--
--     Para ver o quitar el cron job:  select * from cron.job;   select cron.unschedule('dm-purge-hourly');
--   Mientras no lo programes, la foto igual desaparece de la pantalla al vencer y nadie puede abrirla.


-- 2.7 En vivo y recarga del esquema ---------------------------------------------------
-- (messages ya estaba en Realtime desde la v0.12.0; solo se pide recargar el esquema de la API)
notify pgrst, 'reload schema';

-- Listo. Puedes comprobarlo con:  select * from public.clubs;
