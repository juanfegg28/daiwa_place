\set ON_ERROR_STOP on
-- datos
insert into profiles (id, username) values ('00000000-0000-0000-0000-0000000000a1','ana'),('00000000-0000-0000-0000-0000000000b2','beto'),('00000000-0000-0000-0000-0000000000c3','caro');
insert into posts (id, user_id, content) values ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000a1','hola'),('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-0000000000a1','segundo');
-- likes / comentarios / compartidos
insert into likes (post_id,user_id) values ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000b2'),('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000c3');
insert into comments (id,post_id,user_id,content) values ('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000b2','c1');
insert into comments (id,post_id,user_id,content,parent_comment_id) values ('aaaaaaaa-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000c3','respuesta','aaaaaaaa-0000-0000-0000-000000000001');
insert into reposts (user_id,post_id) values ('00000000-0000-0000-0000-0000000000c3','11111111-1111-1111-1111-111111111111');
select 'tras insertar (esperado likes=2 comments=2 reposts=1)' as t, likes_count, comments_count, reposts_count from post_counters where post_id='11111111-1111-1111-1111-111111111111';
-- quitar un like, borrar un comentario RAIZ (borra en cascada la respuesta), quitar el repost
delete from likes where post_id='11111111-1111-1111-1111-111111111111' and user_id='00000000-0000-0000-0000-0000000000b2';
delete from comments where id='aaaaaaaa-0000-0000-0000-000000000001';
delete from reposts where post_id='11111111-1111-1111-1111-111111111111';
select 'tras borrar (esperado likes=1 comments=0 reposts=0)' as t, likes_count, comments_count, reposts_count from post_counters where post_id='11111111-1111-1111-1111-111111111111';
-- el segundo post no tiene fila
select 'post sin actividad (esperado 0 filas)' as t, count(*) from post_counters where post_id='22222222-2222-2222-2222-222222222222';
-- borrar la PUBLICACION con likes/comentarios: la cascada NO debe fallar
insert into comments (post_id,user_id,content) values ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000b2','otro');
delete from posts where id='11111111-1111-1111-1111-111111111111';
select 'tras borrar la publicacion (esperado 0 filas)' as t, count(*) from post_counters;
-- recount: desfasar a mano y recalcular
insert into posts (id, user_id, content) values ('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-0000000000a1','tercero');
insert into likes (post_id,user_id) values ('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-0000000000b2');
update post_counters set likes_count = 99 where post_id='33333333-3333-3333-3333-333333333333';
select public.recount_post_counters() as recount;
select 'tras recount (esperado likes=1)' as t, likes_count from post_counters where post_id='33333333-3333-3333-3333-333333333333';
-- RLS: authenticated puede leer, no escribir
set role authenticated;
select 'lectura authenticated (esperado 1)' as t, count(*) from post_counters;
do $$ begin begin insert into post_counters(post_id) values ('33333333-3333-3333-3333-333333333333'); raise exception 'NO DEBIO PERMITIR ESCRIBIR'; exception when insufficient_privilege then raise notice 'OK: escritura directa denegada'; end; end $$;
reset role;
