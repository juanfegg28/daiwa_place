alter table public.profiles add column if not exists security_word text;
alter table public.profiles add column if not exists security_word_hash text;
alter table public.profiles add column if not exists created_at timestamptz default now();
create table if not exists public.roles (id uuid primary key default gen_random_uuid(), name text, permissions jsonb not null default '{}'::jsonb);
create table if not exists public.user_roles (user_id uuid references public.profiles(id) on delete cascade, role_id uuid references public.roles(id) on delete cascade, primary key (user_id, role_id));
create table if not exists public.recovery_attempts (id bigint generated always as identity primary key, username text, ip text, created_at timestamptz not null default now());
create or replace function public.auth_revoke_sessions(p_user uuid) returns void language sql as $$ select 1 $$;
grant select, insert, update, delete on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;
grant usage on all sequences in schema public to service_role;
-- datos
truncate roles, user_roles, recovery_attempts, account_recovery_audit, account_recovery_links restart identity cascade;
insert into profiles (id, username, id_student, grado, security_word_hash) values
 ('00000000-0000-0000-0000-0000000000d4','renshsh','Ren Supremo','5A','hash'),
 ('00000000-0000-0000-0000-0000000000e5','staffy','Staffy Mod','4A',null),
 ('00000000-0000-0000-0000-0000000000f6','modsinpermiso','Mod SinPermiso','4B','hash')
 on conflict (id) do nothing;
insert into roles (id, name, permissions) values
 ('99999999-0000-0000-0000-000000000001','Recuperador','{"recover_accounts": true}'::jsonb),
 ('99999999-0000-0000-0000-000000000002','Moderador','{"manage_reports": true}'::jsonb);
insert into user_roles (user_id, role_id) values ('00000000-0000-0000-0000-0000000000e5','99999999-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-0000000000f6','99999999-0000-0000-0000-000000000002');
-- ana y caro: cuentas normales (caro sin palabra secreta)
update profiles set security_word_hash = 'hash' where username = 'ana';
