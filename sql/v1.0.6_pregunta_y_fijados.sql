-- =====================================================================
-- DaiwaPlace v1.0.6 — #PreguntaDelDia + publicación fijada en el perfil
-- Pégalo completo en Supabase → SQL Editor → New query → Run.
-- Es seguro correrlo más de una vez (no duplica nada).
-- Requiere haber corrido antes los SQL anteriores (ya los tienes), en especial
-- el de la v0.13.0, de donde sale la función whisper_has_perm.
--
-- Qué hace:
--   1) Pregunta del día: una tabla con las preguntas (solo hay UNA activa a la vez) y dos
--      funciones para cambiarla: set_daily_question() y clear_daily_question().
--      Las pueden usar los Admin Supremos y los roles con el permiso "Anuncios globales".
--   2) Publicación fijada: una columna nueva en los perfiles + funciones pin_post() y unpin_post().
--      Solo puedes fijar publicaciones TUYAS (la base de datos lo comprueba).
-- =====================================================================


-- 1) PREGUNTA DEL DÍA -----------------------------------------------------
create table if not exists public.daily_questions (
  id         uuid primary key default gen_random_uuid(),
  question   text not null check (char_length(btrim(question)) between 3 and 200),
  active     boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Solo una pregunta activa a la vez
create unique index if not exists daily_questions_one_active
  on public.daily_questions ((true)) where active;

alter table public.daily_questions enable row level security;

-- Toda persona con sesión puede LEER las preguntas; escribir solo se puede con las funciones de abajo
revoke all on public.daily_questions from anon, authenticated;
grant select on public.daily_questions to authenticated;

drop policy if exists "daily_questions_select" on public.daily_questions;
create policy "daily_questions_select" on public.daily_questions
  for select to authenticated using (true);

-- 1.1 Poner una pregunta nueva (reemplaza a la anterior).
--     Desde la página: Admin → "Pregunta del día".
--     A mano (SQL Editor):  select public.set_daily_question('¿Cuál es tu canción del día?');
create or replace function public.set_daily_question(p_question text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_q  text := btrim(coalesce(p_question, ''));
  v_id uuid;
begin
  -- Se permite desde la página (con permiso) o desde el SQL Editor de Supabase (sesión "postgres")
  if not (public.whisper_has_perm(auth.uid(), 'global_announcements') or session_user = 'postgres') then
    raise exception 'No tienes permiso para cambiar la pregunta del día';
  end if;
  if char_length(v_q) < 3 then raise exception 'La pregunta es muy corta'; end if;
  if char_length(v_q) > 200 then raise exception 'La pregunta puede tener máximo 200 caracteres'; end if;

  update public.daily_questions set active = false where active;
  insert into public.daily_questions (question, created_by)
  values (v_q, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- 1.2 Quitar la pregunta (la sección desaparece del Inicio hasta que pongas otra).
--     A mano:  select public.clear_daily_question();
create or replace function public.clear_daily_question()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.whisper_has_perm(auth.uid(), 'global_announcements') or session_user = 'postgres') then
    raise exception 'No tienes permiso para cambiar la pregunta del día';
  end if;
  update public.daily_questions set active = false where active;
end;
$$;

revoke execute on function public.set_daily_question(text)  from public, anon;
revoke execute on function public.clear_daily_question()    from public, anon;
grant  execute on function public.set_daily_question(text)  to authenticated;
grant  execute on function public.clear_daily_question()    to authenticated;


-- 2) PUBLICACIÓN FIJADA EN EL PERFIL ---------------------------------------
-- Si se borra la publicación fijada, el perfil queda sin fijada solo (on delete set null).
alter table public.profiles
  add column if not exists pinned_post_id uuid references public.posts(id) on delete set null;

-- Tu base entrega las columnas de "profiles" una por una, así que esta también se habilita
grant select (pinned_post_id) on public.profiles to authenticated;

create or replace function public.pin_post(p_post uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Inicia sesión primero'; end if;
  if not exists (select 1 from public.posts where id = p_post and user_id = auth.uid()) then
    raise exception 'Solo puedes fijar tus propias publicaciones';
  end if;
  update public.profiles set pinned_post_id = p_post where id = auth.uid();
end;
$$;

create or replace function public.unpin_post()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Inicia sesión primero'; end if;
  update public.profiles set pinned_post_id = null where id = auth.uid();
end;
$$;

revoke execute on function public.pin_post(uuid) from public, anon;
revoke execute on function public.unpin_post()   from public, anon;
grant  execute on function public.pin_post(uuid) to authenticated;
grant  execute on function public.unpin_post()   to authenticated;

-- Listo. Para probar la pregunta del día desde aquí:
--   select public.set_daily_question('¿Cuál es la canción que más has escuchado esta semana?');
--   select * from public.daily_questions order by created_at desc;
