-- =====================================================================
-- DaiwaPlace v1.6.1 — Notificaciones push (avisos en el celular, como WhatsApp)
-- Pégalo COMPLETO en Supabase → SQL Editor → New query → Run.
-- Es seguro correrlo más de una vez. NO necesita que cambies nada.
-- =====================================================================

-- 0) pg_net (permite que la base de datos «llame» a tu página). Si ya lo activaste para el cron de fotos, no pasa nada.
do $$ begin
  create extension if not exists pg_net;
exception when others then
  raise notice 'No se pudo activar pg_net aquí: actívalo en Database → Extensions y vuelve a correr este SQL.';
end $$;

-- 1) DISPOSITIVOS que recibirán avisos (un celular = una fila) -----------
create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  endpoint     text not null unique,   -- «dirección» del celular que da Google/Apple (no es un dato personal)
  p256dh       text not null,
  auth         text not null,
  user_agent   text,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
drop policy if exists "push_subs_select_own" on public.push_subscriptions;
create policy "push_subs_select_own" on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
drop policy if exists "push_subs_delete_own" on public.push_subscriptions;
create policy "push_subs_delete_own" on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());
-- Guardar un dispositivo solo lo hace la página (ruta /api/push/subscribe, con la sesión verificada), nunca el navegador directo.
revoke all on public.push_subscriptions from anon, authenticated;
grant select, delete on public.push_subscriptions to authenticated;

-- 2) AJUSTES de la conexión con tu página (nadie puede leerlos desde el navegador) ---
create table if not exists public.push_config (
  key   text primary key,
  value text not null
);
alter table public.push_config enable row level security;   -- sin políticas = nadie lo lee ni lo cambia desde la web
revoke all on public.push_config from anon, authenticated;

-- 3) El «aviso» que la base de datos le manda a tu página ----------------
create or replace function public.push_ping(p_kind text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url    text;
  v_secret text;
begin
  select value into v_url    from public.push_config where key = 'url';
  select value into v_secret from public.push_config where key = 'secret';
  if v_url is null or v_secret is null then
    return;   -- todavía no hiciste el paso 2 (conectar): no pasa nada, simplemente no se envía
  end if;
  perform net.http_post(
    url     := v_url || '/api/push/send',
    body    := jsonb_build_object('kind', p_kind, 'id', p_id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', v_secret),
    timeout_milliseconds := 5000
  );
exception when others then
  null;   -- pase lo que pase con el push, NUNCA se rompe publicar, comentar o escribir un mensaje
end;
$$;
revoke all on function public.push_ping(text, uuid) from public, anon, authenticated;

-- 4) Cuando nace un AVISO (likes, comentarios, seguidores, clubes, Muro…) -----
--    Esos avisos YA respetan lo que cada persona apagó en Configuración → Notificaciones.
create or replace function public.trg_push_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.push_ping('notification', new.id);
  return new;
end;
$$;
revoke all on function public.trg_push_notification() from public, anon, authenticated;

drop trigger if exists trg_push_notification on public.notifications;
create trigger trg_push_notification
  after insert on public.notifications
  for each row execute function public.trg_push_notification();

-- 5) Cuando llega un MENSAJE directo ---------------------------------------
create or replace function public.trg_push_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.deleted_at is null then
    perform public.push_ping('message', new.id);
  end if;
  return new;
end;
$$;
revoke all on function public.trg_push_message() from public, anon, authenticated;

drop trigger if exists trg_push_message on public.messages;
create trigger trg_push_message
  after insert on public.messages
  for each row execute function public.trg_push_message();

-- Listo. Ahora falta el PASO 2: v1.6.1_conectar_push.sql
