-- =====================================================================
-- DaiwaPlace v1.6.3 — «Súper ahorro» para el plan NANO de Supabase
-- Pégalo COMPLETO en Supabase → SQL Editor → New query → Run.
-- Es seguro correrlo más de una vez. No borra datos de nadie (salvo la limpieza vieja del punto 6, que es opcional y está explicada).
--
-- Qué hace:
--   1) Crea los índices que faltan (sin duplicar los que ya tengas): el feed, los likes, los comentarios, los seguidores…
--   2) dm_unread_summary() pasa a una versión liviana (antes calculaba toda la bandeja DOS veces cada vez que se pedía).
--   3) El aviso push solo sale si la persona tiene un celular registrado (antes se llamaba a Vercel en CADA mensaje y notificación).
--   4) Realtime deja de vigilar «notas» y «likes de notas» (la página ya no los escucha).
--   5) Limpieza diaria automática de cosas viejas que ya no sirven (opcional, usa pg_cron si lo tienes activo).
--   6) Actualiza las estadísticas para que Postgres use los índices nuevos.
-- =====================================================================

-- 1) ÍNDICES (solo se crea el que NO exista ya, aunque tenga otro nombre) ---------------------
create or replace function public._daiwa_ix(p_table text, p_cols text[])
returns text
language plpgsql
as $$
declare
  v_oid  oid := to_regclass('public.' || quote_ident(p_table));
  v_nums int[] := '{}';
  v_c    text;
  v_att  int;
begin
  if v_oid is null then
    return p_table || ': la tabla no existe (se omite)';
  end if;
  foreach v_c in array p_cols loop
    select a.attnum into v_att from pg_attribute a where a.attrelid = v_oid and a.attname = v_c and not a.attisdropped;
    if v_att is null then
      return p_table || ': falta la columna ' || v_c || ' (se omite)';
    end if;
    v_nums := v_nums || v_att;
  end loop;
  if exists (
    select 1 from pg_index i
    where i.indrelid = v_oid and i.indisvalid and i.indpred is null
      and (string_to_array(i.indkey::text, ' ')::int[])[1:array_length(v_nums, 1)] = v_nums
  ) then
    return p_table || '(' || array_to_string(p_cols, ',') || '): ya tiene un índice que sirve';
  end if;
  execute format(
    'create index if not exists %I on public.%I (%s)',
    left('ix_' || p_table || '_' || array_to_string(p_cols, '_'), 60), p_table,
    (select string_agg(quote_ident(x), ', ') from unnest(p_cols) x)
  );
  return p_table || '(' || array_to_string(p_cols, ',') || '): CREADO';
end;
$$;

-- (el resultado lista cada índice: CREADO, ya existía, o se omitió)
select r as resultado from unnest(array[
  public._daiwa_ix('posts',         array['created_at']),
  public._daiwa_ix('posts',         array['user_id', 'created_at']),
  public._daiwa_ix('reposts',       array['created_at']),
  public._daiwa_ix('likes',         array['post_id']),
  public._daiwa_ix('likes',         array['user_id']),
  public._daiwa_ix('comments',      array['post_id', 'created_at']),
  public._daiwa_ix('comments',      array['user_id']),
  public._daiwa_ix('comment_likes', array['comment_id']),
  public._daiwa_ix('comment_likes', array['user_id']),
  public._daiwa_ix('follows',       array['follower_id', 'following_id']),
  public._daiwa_ix('follows',       array['following_id', 'follower_id']),
  public._daiwa_ix('blocks',        array['blocker_id', 'blocked_id']),
  public._daiwa_ix('blocks',        array['blocked_id']),
  public._daiwa_ix('user_roles',    array['user_id']),
  public._daiwa_ix('conversation_members', array['conversation_id', 'user_id']),
  public._daiwa_ix('user_cosmetics', array['user_id']),
  public._daiwa_ix('notes',         array['user_id']),
  public._daiwa_ix('notes',         array['expires_at'])
]) r;

drop function public._daiwa_ix(text, text[]);

-- 2) dm_unread_summary LIVIANA -----------------------------------------------------------------
-- Mismo resultado de siempre (chats con algo sin leer + solicitudes con algo sin leer), pero con EXISTS:
-- se detiene en el primer mensaje sin leer, en vez de contar todos y armar la bandeja completa dos veces.
create or replace function public.dm_unread_summary()
returns table (unread_conversations int, pending_requests int)
language sql stable security definer set search_path = public as $$
  select
    (count(*) filter (where not x.is_request))::int,
    (count(*) filter (where x.is_request))::int
  from (
    select
      (c.status = 'pending' and c.initiator_id <> auth.uid()) as is_request,
      c.user_a, c.user_b
    from public.conversation_members m
    join public.conversations c on c.id = m.conversation_id
    where m.user_id = auth.uid()
      and auth.uid() in (c.user_a, c.user_b)
      and (
        c.status = 'accepted' or c.initiator_id = auth.uid()            -- cuenta como chat
        or (c.status = 'pending' and c.initiator_id <> auth.uid())       -- cuenta como solicitud
      )
      and exists (
        select 1 from public.messages x
        where x.conversation_id = c.id
          and x.sender_id <> auth.uid()
          and x.deleted_at is null
          and x.created_at > m.last_read_at
          and (m.hidden_at is null or x.created_at > m.hidden_at)
      )
  ) x
  where not public.is_blocked_between(x.user_a, x.user_b);
$$;
revoke execute on function public.dm_unread_summary() from public, anon;
grant  execute on function public.dm_unread_summary() to authenticated;

-- 3) PUSH: solo si la persona tiene un celular registrado ----------------------------------------
create or replace function public.trg_push_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.push_subscriptions s where s.user_id = new.recipient_id) then
    perform public.push_ping('notification', new.id);
  end if;
  return new;
exception when others then
  return new;   -- el push NUNCA debe romper una notificación
end;
$$;
revoke all on function public.trg_push_notification() from public, anon, authenticated;

create or replace function public.trg_push_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.deleted_at is null and exists (
    select 1
    from public.conversations c
    join public.push_subscriptions s on s.user_id = case when c.user_a = new.sender_id then c.user_b else c.user_a end
    where c.id = new.conversation_id
  ) then
    perform public.push_ping('message', new.id);
  end if;
  return new;
exception when others then
  return new;   -- el push NUNCA debe romper un mensaje
end;
$$;
revoke all on function public.trg_push_message() from public, anon, authenticated;

-- 4) REALTIME: ya no se vigilan notas ni likes de notas (menos trabajo para el servidor) ---------------
do $$
begin
  begin alter publication supabase_realtime drop table public.notes;      exception when others then null; end;
  begin alter publication supabase_realtime drop table public.note_likes; exception when others then null; end;
end $$;
do $$
begin
  alter table public.note_likes replica identity default;   -- ya no hace falta guardar la fila completa en cada cambio
exception when others then null;
end $$;

-- 5) LIMPIEZA diaria de cosas viejas --------------------------------------------------------------
--   · avisos YA LEÍDOS de hace más de 90 días (los no leídos nunca se tocan)
--   · eventos viejos de misiones (los de más de 120 días; ya lo hacía economy_cleanup)
--   · intentos viejos de recuperar cuenta y de canjear códigos (más de 30 días)
create or replace function public.daiwa_housekeeping()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notif int := 0;
  v_ev    int := 0;
  v_rec   int := 0;
  v_code  int := 0;
begin
  delete from public.notifications where read = true and created_at < now() - interval '90 days';
  get diagnostics v_notif = row_count;

  begin
    v_ev := public.economy_cleanup();
  exception when others then
    v_ev := -1;
  end;

  if to_regclass('public.recovery_attempts') is not null then
    delete from public.recovery_attempts where created_at < now() - interval '30 days';
    get diagnostics v_rec = row_count;
  end if;
  if to_regclass('public.code_attempts') is not null then
    delete from public.code_attempts where at < now() - interval '30 days';
    get diagnostics v_code = row_count;
  end if;

  return jsonb_build_object('notifications', v_notif, 'mission_events', v_ev, 'recovery_attempts', v_rec, 'code_attempts', v_code);
end;
$$;
revoke all on function public.daiwa_housekeeping() from public, anon, authenticated;

-- Programarla cada día a las 04:15 (hora de Colombia) si pg_cron está activo
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'daiwa-housekeeping';
    perform cron.schedule('daiwa-housekeeping', '15 9 * * *', 'select public.daiwa_housekeeping()');
  else
    raise notice 'pg_cron no está activo: la limpieza no se programó sola. Puedes correr  select public.daiwa_housekeeping();  de vez en cuando a mano.';
  end if;
exception when others then
  raise notice 'No se pudo programar la limpieza (no pasa nada): %', sqlerrm;
end $$;

-- 6) ESTADÍSTICAS al día (para que Postgres use los índices nuevos) -------------------------------
do $$
declare t text;
begin
  foreach t in array array['posts','reposts','likes','comments','comment_likes','follows','messages','conversations','conversation_members','notifications']
  loop
    if to_regclass('public.' || t) is not null then
      execute format('analyze public.%I', t);
    end if;
  end loop;
end $$;

-- Listo. Para ver qué índices se crearon, mira los mensajes de arriba (o corre v1.6.3_diagnostico_nano.sql).
