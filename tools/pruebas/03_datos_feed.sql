do $$ begin
  if not exists (select 1 from pg_roles where rolname='authenticator') then create role authenticator login password 'pw' noinherit; end if;
end $$;
grant anon, authenticated, service_role to authenticator;
grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;
-- politicas minimas parecidas a las reales para probar embeds
alter table likes enable row level security; drop policy if exists likes_read on likes; create policy likes_read on likes for select to authenticated using (true);
alter table reposts enable row level security; drop policy if exists reposts_read on reposts; create policy reposts_read on reposts for select to authenticated using (true);
alter table comments enable row level security; drop policy if exists comments_read on comments; create policy comments_read on comments for select to authenticated using (true);
alter table profiles enable row level security; drop policy if exists profiles_read on profiles; create policy profiles_read on profiles for select to authenticated using (true);
-- datos de prueba nuevos
truncate posts, profiles restart identity cascade;
insert into profiles (id, username, id_student, grado) values
 ('00000000-0000-0000-0000-0000000000a1','ana','Ana Torres','3A'),
 ('00000000-0000-0000-0000-0000000000b2','beto','Beto Ruiz','3B'),
 ('00000000-0000-0000-0000-0000000000c3','caro','Caro Mejia','2A');
insert into posts (id, user_id, content) values
 ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000a1','post con likes'),
 ('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-0000000000a1','post sin nada'),
 ('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-0000000000b2','post de beto');
-- ana (a1) y caro (c3) dan like al post 1; beto (b2) comenta 2 veces; caro comparte
insert into likes (post_id,user_id) values ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000a1'),('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000c3');
insert into comments (post_id,user_id,content) values ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000b2','hola'),('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000b2','otro');
insert into reposts (user_id,post_id) values ('00000000-0000-0000-0000-0000000000c3','11111111-1111-1111-1111-111111111111');
