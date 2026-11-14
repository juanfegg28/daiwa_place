-- =====================================================================
-- DaiwaPlace v1.10.0 — DIAGNÓSTICO (solo LEE, no cambia nada). Corre cada bloque por separado en el SQL Editor.
-- Complementa a v1.6.3_diagnostico_nano.sql (consultas lentas, tablas grandes, índices sin uso, memoria): aquí está lo nuevo de la v1.10.0.
--
-- CÓMO COMPARAR «ANTES / DESPUÉS» EN TU PROYECTO:
--   1) Antes de actualizar la página: corre  select pg_stat_statements_reset();  (borra las estadísticas acumuladas)
--   2) Usa la página normalmente 1–2 días con la v1.10.0.
--   3) Corre los bloques A, B y C del diagnóstico v1.6.3 y compara con tus capturas de antes. Debes ver MENOS llamadas y MENOS bloques leídos
--      en las consultas de posts/comentarios/likes (el feed ya no los descarga completos).
-- =====================================================================

-- A) ¿Los contadores del feed coinciden con la realidad? (debe dar 0 filas; si da filas: select public.recount_post_counters();)
select p.id as post_id,
       coalesce(c.likes_count, 0) as likes_guardados,    (select count(*) from public.likes l where l.post_id = p.id) as likes_reales,
       coalesce(c.comments_count, 0) as comentarios_guardados, (select count(*) from public.comments m where m.post_id = p.id) as comentarios_reales
from public.posts p
left join public.post_counters c on c.post_id = p.id
where p.created_at > now() - interval '30 days'
  and (coalesce(c.likes_count, 0) <> (select count(*) from public.likes l where l.post_id = p.id)
    or coalesce(c.comments_count, 0) <> (select count(*) from public.comments m where m.post_id = p.id))
limit 50;

-- B) Índices DUPLICADOS (mismas columnas, mismo tipo y misma condición): sobra uno y cada uno cuesta disco en cada escritura.
--    Revisa antes de borrar; los que respaldan una clave primaria o UNIQUE NO se deben borrar.
select i1.indrelid::regclass as tabla, i1.indexrelid::regclass as indice, i2.indexrelid::regclass as duplicado_de,
       pg_size_pretty(pg_relation_size(i1.indexrelid)) as tamano
from pg_index i1
join pg_index i2 on i1.indrelid = i2.indrelid and i1.indexrelid > i2.indexrelid
 and i1.indkey = i2.indkey and i1.indclass = i2.indclass and i1.indcollation = i2.indcollation
 and coalesce(pg_get_expr(i1.indpred, i1.indrelid), '') = coalesce(pg_get_expr(i2.indpred, i2.indrelid), '')
 and coalesce(pg_get_expr(i1.indexprs, i1.indrelid), '') = coalesce(pg_get_expr(i2.indexprs, i2.indrelid), '')
where i1.indrelid::regclass::text like 'public.%' or i1.indrelid::regclass::text !~ '\.'
order by pg_relation_size(i1.indexrelid) desc;

-- C) Plan de ejecución de la tarjeta LIGERA del feed (la v1.10.0): contadores + «¿me gustó?». Cambia el uuid por el tuyo (select id from profiles where username = 'tu_usuario').
--    Mira «Execution Time» y «Buffers: shared read» (lo que lee del disco): deben ser pequeños.
explain (analyze, buffers)
select p.id, p.content, p.created_at,
       coalesce(c.likes_count, 0) as likes, coalesce(c.comments_count, 0) as comentarios, coalesce(c.reposts_count, 0) as compartidos,
       exists (select 1 from public.likes l where l.post_id = p.id and l.user_id = '00000000-0000-0000-0000-000000000000') as me_gusta
from public.posts p
left join public.post_counters c on c.post_id = p.id
where p.id in (select id from public.posts where club_id is null order by created_at desc limit 15);

-- D) Plan de los comentarios que se piden al abrir una publicación (usa el índice comments(post_id, created_at))
explain (analyze, buffers)
select * from public.comments where post_id = (select id from public.posts order by created_at desc limit 1) order by created_at asc limit 1000;

-- E) Tablas en Realtime. La página SOLO escucha: notifications, conversations, messages y message_reactions.
--    Cualquier otra tabla de esta lista gasta CPU leyendo el registro de cambios sin que nadie la use. Para quitar una (no borra datos):
--      alter publication supabase_realtime drop table public.NOMBRE;
select tablename as tabla_en_realtime,
       case when tablename in ('notifications', 'conversations', 'messages', 'message_reactions') then 'se usa' else 'NO la usa la página (se puede quitar)' end as estado
from pg_publication_tables where pubname = 'supabase_realtime' order by 2, 1;

-- F) Salud de las tablas «calientes» (filas muertas = trabajo pendiente del autovacuum). post_counters recibe una escritura por like/comentario.
select relname as tabla, n_live_tup as filas, n_dead_tup as muertas, last_autovacuum, last_autoanalyze
from pg_stat_user_tables
where relname in ('posts', 'likes', 'comments', 'post_counters', 'notifications', 'messages', 'coin_ledger')
order by n_dead_tup desc;

-- G) Recuperación de cuentas: últimos movimientos del registro de auditoría (quién generó/revocó/usó enlaces)
select created_at, action, actor_name, target_name, detail->>'note' as motivo
from public.account_recovery_audit order by created_at desc limit 50;
