-- =====================================================================
-- DaiwaPlace v1.6.1 — PASO 2: conectar la base de datos con tu página
-- ANTES de correrlo cambia las DOS líneas marcadas con  <<<  y pégalo en SQL Editor.
--   · TU-CLAVE  = la MISMA clave secreta que pusiste en Vercel como  PUSH_WEBHOOK_SECRET
--   · la dirección = la de tu página (sin la barra final)
-- Se puede correr de nuevo si algún día cambias la clave o la dirección.
-- =====================================================================
insert into public.push_config (key, value) values
  ('url',    'https://daiwaplace.vercel.app'),   -- <<< tu dirección (sin «/» al final)
  ('secret', 'TU-CLAVE')                          -- <<< la misma de Vercel (PUSH_WEBHOOK_SECRET)
on conflict (key) do update set value = excluded.value;

-- Para comprobar que quedó (no muestra la clave):
select key, case when key = 'secret' then '••••••' else value end as value from public.push_config order by key;

-- ─────────── CÓMO VER SI FUNCIONA (después de enviar un mensaje de prueba) ───────────
--   select id, status_code, left(content::text, 120) as respuesta, created
--     from net._http_response order by created desc limit 5;
--   · 200 = enviado ✔     · 401 = la clave de Supabase y la de Vercel NO son iguales
--   · 500 = faltan las claves VAPID en Vercel     · 404 = la dirección está mal escrita
