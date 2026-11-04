-- =====================================================================
-- DaiwaPlace v1.6.3 — DIAGNÓSTICO (solo lee, no cambia nada). Corre cada bloque por separado en el SQL Editor.
-- Sirve para ver QUÉ está gastando el disco y el CPU de tu Nano, antes y después del ahorro.
-- =====================================================================

-- A) Las 15 consultas que más TIEMPO de base de datos consumen
select left(query, 110) as consulta, calls, round(total_exec_time::numeric / 1000, 1) as segundos_total,
       round(mean_exec_time::numeric, 2) as ms_promedio, rows
from pg_stat_statements
where query not ilike '%pg_stat_statements%'
order by total_exec_time desc limit 15;

-- B) Las 15 que más LEEN DEL DISCO (es lo que agota el «Disk IO Budget»)
select left(query, 110) as consulta, calls, shared_blks_read as bloques_leidos_disco, shared_blks_hit as bloques_en_memoria,
       shared_blks_dirtied as bloques_escritos
from pg_stat_statements
where query not ilike '%pg_stat_statements%'
order by shared_blks_read desc limit 15;

-- C) Las 15 más llamadas (para detectar pollings)
select left(query, 110) as consulta, calls, round(mean_exec_time::numeric, 2) as ms_promedio
from pg_stat_statements
where query not ilike '%pg_stat_statements%'
order by calls desc limit 15;

-- D) Las tablas más grandes (con sus índices)
select relname as tabla, pg_size_pretty(pg_total_relation_size(relid)) as total, n_live_tup as filas_aprox
from pg_stat_user_tables order by pg_total_relation_size(relid) desc limit 15;

-- E) Índices que nunca se usan (cada uno cuesta disco en CADA escritura). Revisa antes de borrar alguno.
select s.relname as tabla, s.indexrelname as indice, pg_size_pretty(pg_relation_size(s.indexrelid)) as tamano, s.idx_scan as usos
from pg_stat_user_indexes s
join pg_index i on i.indexrelid = s.indexrelid
where s.idx_scan = 0 and not i.indisunique and not i.indisprimary
order by pg_relation_size(s.indexrelid) desc limit 20;

-- F) ¿Cuánto se resuelve en memoria? (debería ser > 99 %. Si baja de 95 %, el Nano se queda sin RAM y lee de disco)
select round(100.0 * sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2) as pct_tablas_en_memoria
from pg_statio_user_tables;
select round(100.0 * sum(idx_blks_hit) / nullif(sum(idx_blks_hit) + sum(idx_blks_read), 0), 2) as pct_indices_en_memoria
from pg_statio_user_indexes;

-- G) Tablas que Realtime está vigilando ahora mismo (después del v1.6.3 deberían ser: notifications, conversations, messages, message_reactions)
select schemaname, tablename from pg_publication_tables where pubname = 'supabase_realtime' order by tablename;

-- H) Cola de llamadas a Vercel (pg_net): si crece sin parar, algo está disparando demasiados avisos
select count(*) as respuestas_guardadas, min(created) as la_mas_vieja from net._http_response;

-- I) Cuántas conexiones hay y de quién (el Nano aguanta pocas)
select usename, application_name, state, count(*) from pg_stat_activity group by 1, 2, 3 order by 4 desc;
