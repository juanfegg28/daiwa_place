-- =====================================================================
-- DaiwaPlace v1.10.0 «IRIS» — SQL 3 de 3: índices que faltaban + búsqueda rápida de personas
-- Pégalo COMPLETO en Supabase → SQL Editor → New query → Run. Es seguro correrlo más de una vez. NO borra ni cambia datos.
--
-- Revisé los índices que ya crearon los SQL anteriores (v0.11, v1.6.3 «ahorro nano», v1.8.0, v1.9.0) y NO los repito: este archivo solo
-- agrega lo que de verdad faltaba. Cada índice se crea solo si la tabla existe y no hay ya uno equivalente (aunque tenga otro nombre).
--
--   1) saved_posts (post_id)   → borrar una publicación (o que un admin la borre) recorría TODA la tabla de guardados buscando quién la guardó
--   2) reposts (post_id)       → igual con los compartidos (y con el recuento de compartidos de la v1.10.0)
--   3) Búsqueda de personas (Explorar, Centro de Mando, menciones): ilike '%texto%' no puede usar un índice normal; con pg_trgm sí.
--      Si tu proyecto no permite activar la extensión, ese paso se salta solo y no pasa nada (la búsqueda sigue funcionando igual).
-- =====================================================================

-- Ayudante: crea un índice solo si no hay ya uno que empiece por esas mismas columnas (se borra al final, como el de la v1.6.3)
create or replace function public._daiwa_ix110(p_table text, p_cols text[], p_where text default null)
returns text language plpgsql as $$
declare
  v_oid   oid := to_regclass('public.' || quote_ident(p_table));
  v_attrs int2[];
  v_name  text;
begin
  if v_oid is null then return p_table || ': no existe (se omite)'; end if;
  select array_agg(a.attnum order by u.ord) into v_attrs
    from unnest(p_cols) with ordinality as u(col, ord)
    join pg_attribute a on a.attrelid = v_oid and a.attname = u.col and not a.attisdropped;
  if v_attrs is null or array_length(v_attrs, 1) <> array_length(p_cols, 1) then return p_table || ': faltan columnas (se omite)'; end if;
  -- ¿ya hay un índice (no parcial) cuyas primeras columnas sean estas?
  if exists (
    select 1 from pg_index i
     where i.indrelid = v_oid and i.indpred is null and i.indisvalid
       and (i.indkey::int2[])[0:array_length(v_attrs, 1) - 1] = v_attrs
  ) then return p_table || '(' || array_to_string(p_cols, ', ') || '): ya tiene un índice que sirve'; end if;
  v_name := left(p_table || '_' || array_to_string(p_cols, '_') || '_ix110', 60);
  execute format('create index if not exists %I on public.%I (%s)%s', v_name, p_table,
                 (select string_agg(quote_ident(c), ', ') from unnest(p_cols) c),
                 case when p_where is null then '' else ' where ' || p_where end);
  return p_table || '(' || array_to_string(p_cols, ', ') || '): índice creado';
end;
$$;

select public._daiwa_ix110('saved_posts', array['post_id']) as paso_1;
select public._daiwa_ix110('reposts',     array['post_id']) as paso_2;

drop function public._daiwa_ix110(text, text[], text);

-- 3) BÚSQUEDA DE PERSONAS (pg_trgm) ------------------------------------------------------------------
do $$
declare
  v_ns   text;
  v_col  text;
begin
  begin
    create extension if not exists pg_trgm with schema extensions;
  exception when others then
    begin
      create extension if not exists pg_trgm;
    exception when others then
      raise notice 'No se pudo activar pg_trgm (no pasa nada): la búsqueda sigue funcionando igual. Puedes activarlo en Database → Extensions y volver a correr este SQL.';
      return;
    end;
  end;
  select n.nspname into v_ns from pg_extension e join pg_namespace n on n.oid = e.extnamespace where e.extname = 'pg_trgm';
  if v_ns is null then return; end if;
  foreach v_col in array array['username', 'id_student', 'grado'] loop
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = v_col) then
      execute format('create index if not exists %I on public.profiles using gin (%I %I.gin_trgm_ops)', 'profiles_' || v_col || '_trgm_ix110', v_col, v_ns);
    end if;
  end loop;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clubs' and column_name = 'name') then
    execute format('create index if not exists clubs_name_trgm_ix110 on public.clubs using gin (name %I.gin_trgm_ops)', v_ns);
  end if;
end $$;

-- Para que el planificador conozca las tablas nuevas/índices nuevos
analyze public.profiles;
do $$ begin if to_regclass('public.saved_posts') is not null then execute 'analyze public.saved_posts'; end if; if to_regclass('public.reposts') is not null then execute 'analyze public.reposts'; end if; end $$;
