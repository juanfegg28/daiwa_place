-- =====================================================================
-- DaiwaPlace v1.10.0 «IRIS» — SQL 1 de 2: contadores livianos para el feed
-- Pégalo COMPLETO en Supabase → SQL Editor → New query → Run. Es seguro correrlo más de una vez.
-- NO borra ni cambia datos de nadie, NO toca las políticas RLS existentes, NO toca la tabla posts.
--
-- Qué hace
--   1) Crea public.post_counters: UNA fila diminuta por publicación con sus contadores (likes, comentarios, compartidos).
--      Con ella el feed ya no descarga la lista completa de likes ni de comentarios de cada tarjeta (era lo que más datos movía).
--   2) Triggers que mantienen los contadores al dar/quitar like, comentar/borrar y compartir/quitar.
--      Son funciones SECURITY DEFINER que solo tocan post_counters. Una falla de contador NUNCA bloquea un like o un comentario.
--   3) Calcula los contadores de lo que ya existe (relleno inicial) y deja la función recount_post_counters() por si algún día
--      quieres recalcularlos a mano (select public.recount_post_counters();).
--   4) RLS: se ve el contador solo de las publicaciones que ya puedes ver (misma regla que posts).
--
-- Si NO corres este SQL, la página sigue funcionando igual que en la 1.9.0 (detecta que falta y usa la consulta completa de siempre).
-- =====================================================================

-- 1) TABLA ---------------------------------------------------------------------------------------
create table if not exists public.post_counters (
  post_id        uuid primary key references public.posts(id) on delete cascade,
  likes_count    integer not null default 0 check (likes_count    >= 0),
  comments_count integer not null default 0 check (comments_count >= 0),
  reposts_count  integer not null default 0 check (reposts_count  >= 0),
  updated_at     timestamptz not null default now()
);

-- 2) RLS: solo lectura, y solo de publicaciones que puedes ver (las escrituras las hacen los triggers) ---------------
alter table public.post_counters enable row level security;
revoke all on public.post_counters from anon, authenticated;
grant select on public.post_counters to authenticated;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'post_counters' and policyname = 'post_counters_select') then
    create policy post_counters_select on public.post_counters for select to authenticated
      using (exists (select 1 from public.posts p where p.id = post_counters.post_id));
  end if;
end $$;

-- 3) TRIGGERS -------------------------------------------------------------------------------------
-- INSERT: upsert (la fila se crea con el primer like/comentario/compartido). DELETE: solo UPDATE (si la publicación se está
-- borrando en cascada, no se intenta crear nada). greatest(...,0) evita negativos aunque algo se desfase.
create or replace function public.trg_pc_likes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    if tg_op = 'INSERT' then
      insert into public.post_counters as c (post_id, likes_count) values (new.post_id, 1)
        on conflict (post_id) do update set likes_count = c.likes_count + 1, updated_at = now();
    else
      update public.post_counters set likes_count = greatest(likes_count - 1, 0), updated_at = now() where post_id = old.post_id;
    end if;
  exception when others then null;   -- un contador jamás debe impedir un like
  end;
  return null;
end;
$$;

create or replace function public.trg_pc_comments()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    if tg_op = 'INSERT' then
      insert into public.post_counters as c (post_id, comments_count) values (new.post_id, 1)
        on conflict (post_id) do update set comments_count = c.comments_count + 1, updated_at = now();
    else
      update public.post_counters set comments_count = greatest(comments_count - 1, 0), updated_at = now() where post_id = old.post_id;
    end if;
  exception when others then null;
  end;
  return null;
end;
$$;

create or replace function public.trg_pc_reposts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    if tg_op = 'INSERT' then
      insert into public.post_counters as c (post_id, reposts_count) values (new.post_id, 1)
        on conflict (post_id) do update set reposts_count = c.reposts_count + 1, updated_at = now();
    else
      update public.post_counters set reposts_count = greatest(reposts_count - 1, 0), updated_at = now() where post_id = old.post_id;
    end if;
  exception when others then null;
  end;
  return null;
end;
$$;

revoke all on function public.trg_pc_likes(), public.trg_pc_comments(), public.trg_pc_reposts() from public, anon, authenticated;

drop trigger if exists pc_likes on public.likes;
create trigger pc_likes after insert or delete on public.likes for each row execute function public.trg_pc_likes();
drop trigger if exists pc_comments on public.comments;
create trigger pc_comments after insert or delete on public.comments for each row execute function public.trg_pc_comments();
do $$
begin
  if to_regclass('public.reposts') is not null then
    execute 'drop trigger if exists pc_reposts on public.reposts';
    execute 'create trigger pc_reposts after insert or delete on public.reposts for each row execute function public.trg_pc_reposts()';
  end if;
end $$;

-- 4) RECÁLCULO (relleno inicial y herramienta de mantenimiento) ---------------------------------------
-- Deja los contadores exactos según las filas reales. Solo escribe donde hay diferencia. No cambia nada más.
create or replace function public.recount_post_counters()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ins int := 0; v_upd int := 0; v_del int := 0;
begin
  with real as (
    select p.id as post_id,
           coalesce((select count(*) from public.likes    l where l.post_id = p.id), 0)::int as likes_count,
           coalesce((select count(*) from public.comments c where c.post_id = p.id), 0)::int as comments_count,
           case when to_regclass('public.reposts') is null then 0
                else coalesce((select count(*) from public.reposts r where r.post_id = p.id), 0)::int end as reposts_count
    from public.posts p
  ), up as (
    insert into public.post_counters as c (post_id, likes_count, comments_count, reposts_count)
    select r.post_id, r.likes_count, r.comments_count, r.reposts_count from real r
    where r.likes_count + r.comments_count + r.reposts_count > 0
    on conflict (post_id) do update
      set likes_count = excluded.likes_count, comments_count = excluded.comments_count, reposts_count = excluded.reposts_count, updated_at = now()
      where (c.likes_count, c.comments_count, c.reposts_count) is distinct from (excluded.likes_count, excluded.comments_count, excluded.reposts_count)
    returning 1
  )
  select count(*) into v_upd from up;
  -- contadores que quedaron en cero absoluto no necesitan fila
  delete from public.post_counters where likes_count = 0 and comments_count = 0 and reposts_count = 0;
  get diagnostics v_del = row_count;
  return jsonb_build_object('escritos', v_upd, 'filas_vacias_borradas', v_del);
end;
$$;
revoke all on function public.recount_post_counters() from public, anon, authenticated;

-- Relleno inicial (una sola vez; es seguro repetirlo)
select public.recount_post_counters() as relleno_inicial;

analyze public.post_counters;
-- Listo. Para comprobar: select count(*) from public.post_counters;  (debe ser ≈ el número de publicaciones con al menos un like, comentario o compartido)
