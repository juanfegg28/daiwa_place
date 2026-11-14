\set ON_ERROR_STOP off
truncate account_recovery_links, account_recovery_audit restart identity cascade;
insert into profiles (id, username) values ('00000000-0000-0000-0000-0000000000d4','admin1'),('00000000-0000-0000-0000-0000000000e5','victima') on conflict do nothing;
\set A '00000000-0000-0000-0000-0000000000d4'
\set V '00000000-0000-0000-0000-0000000000e5'
-- 1) crear (hash de 64 hex)
select 'crear' t, public.recovery_link_create(:'V', :'A', repeat('a',64), 'verifique por Discord que es el dueno') > now() + interval '3 hours 59 minutes' as vence_en_4h;
-- 2) peek valido
select 'peek valido (1 fila)' t, count(*) from public.recovery_link_peek(repeat('a',64));
select 'peek invalido (0 filas)' t, count(*) from public.recovery_link_peek(repeat('b',64));
-- 3) un solo uso: claim 1ro OK, 2do null
select 'claim 1' t, public.recovery_link_claim(repeat('a',64)) is not null as ok;
select 'claim 2 (debe ser null)' t, public.recovery_link_claim(repeat('a',64)) is null as ok;
select 'peek tras usar (0)' t, count(*) from public.recovery_link_peek(repeat('a',64));
-- 4) unclaim devuelve a usable si no vencio
select public.recovery_link_unclaim(l.id) from account_recovery_links l where token_hash = repeat('a',64);
select 'peek tras unclaim (1)' t, count(*) from public.recovery_link_peek(repeat('a',64));
-- 5) vencido: forzar expires_at al pasado
update account_recovery_links set expires_at = now() - interval '1 minute' where token_hash = repeat('a',64);
select 'peek vencido (0)' t, count(*) from public.recovery_link_peek(repeat('a',64));
select 'claim vencido (null)' t, public.recovery_link_claim(repeat('a',64)) is null as ok;
-- 6) nuevo enlace revoca el anterior activo
select public.recovery_link_create(:'V', :'A', repeat('c',64), 'otro motivo suficientemente largo', 4) is not null as creado;
select public.recovery_link_create(:'V', :'A', repeat('d',64), 'tercer enlace de prueba aqui', 4) is not null as creado2;
select 'activos tras 2 creaciones (esperado 1)' t, count(*) from account_recovery_links where user_id = :'V' and used_at is null and revoked_at is null;
-- 7) revocar
select 'revocar (true)' t, public.recovery_link_revoke(l.id, :'A') from account_recovery_links l where l.token_hash = repeat('d',64);
select 'peek revocado (0)' t, count(*) from public.recovery_link_peek(repeat('d',64));
-- 8) limite por cuenta: 5/24h  (ya hay 3 creaciones; 2 mas OK, la 6ta falla)
select public.recovery_link_create(:'V', :'A', repeat('e',64), 'cuarto enlace de prueba', 4) is not null as c4;
select public.recovery_link_create(:'V', :'A', repeat('f',64), 'quinto enlace de prueba', 4) is not null as c5;
select public.recovery_link_create(:'V', :'A', repeat('1',64), 'sexto enlace: debe fallar', 4) as c6_debe_fallar;
-- 9) no a si mismo, hash invalido
select public.recovery_link_create(:'A', :'A', repeat('2',64), 'a mi mismo', 4) as self_debe_fallar;
select public.recovery_link_create(:'V', :'A', 'corto', 'x', 4) as hash_corto_debe_fallar;
-- 10) evento usado revoca activos y audita
select public.recovery_link_event('link_used', null, :'V', '{"ip":"1.2.3.4"}'::jsonb);
select 'auditoria' t, action, count(*) from account_recovery_audit group by action order by action;
-- 11) permisos: authenticated NO puede leer tablas ni ejecutar funciones
set role authenticated;
select 'leer links como authenticated' t, (select count(*) from account_recovery_links) as n;
select public.recovery_link_claim(repeat('a',64));
select * from account_recovery_audit;
reset role;
-- 12) service_role si puede ejecutar
set role service_role;
select 'service_role ejecuta peek' t, count(*) from public.recovery_link_peek(repeat('a',64));
reset role;
