# DaiwaPlace — contexto para continuar en otro chat (estado: v1.7.0 · «Círculo Lunar» (Supporters con PayPal); antes v1.6.3 · «Súper ahorro» para Supabase Nano; antes v1.6.2 · Estado + menciones en historias + sugerencias de seguimiento + mejoras móvil; antes v1.6.1 · notificaciones push (Web Push/VAPID) · APK de Android puesto en public/daiwaplace.apk · app instalable (PWA) + APK por PWABuilder; Día de Muertos listo para lanzar el 31-oct; ver INSTRUCCIONES_V1.5.11.md)

Red social gratuita para miembros de un servidor de rol escolar de Roblox (perfiles, muro, comentarios, historias, mensajes, tienda de cosméticos, Lunas y misiones). Next.js 16 (App Router) + Supabase + Tailwind. Se despliega en Vercel (daiwaplace.vercel.app).

## Cómo correrlo
1. `npm install`  2. crear `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`  3. `npm run dev`
(Este zip NO trae node_modules ni .env: se instalan/crean aparte.)

## SQL
Todos los scripts están en /sql (por versión). La v1.5.8 y la v1.5.9 NO añadieron SQL; los últimos son el de la v1.5.0 y los dos de Día de Muertos (sql/v1.5.10_*).

## Qué se hizo en v1.7.0 (Círculo Lunar / Supporters)
Niveles en la tabla supporter_tiers: Luna Creciente $1 (500 Lunas/semana, 4 historias, 5 % tienda), Luna Llena $2 (1000, 5, 10 %), Eclipse $5 (2500, 7, 15 %). SQL: sql/v1.7.0_circulo_lunar.sql (tablas supporters, supporter_subscriptions, supporter_payments, paypal_events, supporter_manual_requests, supporter_weekly_grants, supporter_admin_log, supporter_perks…; todo con RLS y solo por funciones). Pagos: suscripciones de PayPal confirmadas por el SERVIDOR (app/api/paypal/{config,confirm,webhook,cancel}; app/lib/paypalServer.ts). El nivel se deduce del PRECIO REAL del plan en PayPal (no del orden de los IDs). paid_until = próximo cobro de PayPal + 1 día, así confirmar dos veces (navegador + webhook) no suma de más. Webhook con firma verificada e idempotente (paypal_events.event_id). Bono semanal por coins_apply con clave única por semana (cron lunes 05:05 UTC + al abrir «Mi membresía»). Límite de historias: story_limit_per_day() ahora mira el nivel. Descuento: cos_supporter_price() dentro de shop_catalog/shop_buy/shop_pack_quote (gana el precio más bajo; no hay descuento en gratis, precio 0 ni exclusivos). Insignia: components/supporters/SupporterBadge + hook useSupporterTier (una consulta por lote, caché 10 min), ocultable. Páginas /apoyar (pública) y /apoyar/mi-membresia; Centro de Mando → Supporters (permiso manage_supporters). Cosméticos exclusivos: solo estructura (supporter_perks con available=false; obtainable='supporter'); sin botones de reclamar activos. PayPal.Me = solo alternativa manual con aprobación admin. Colombia: aviso para hablar por Discord (@juanfegg28). Variables nuevas en Vercel: PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID, PAYPAL_ENV (+ opcionales). Pendiente: probar contra PayPal real/sandbox y crear los cosméticos exclusivos.

## Qué se hizo en v1.6.3
Ahorro de CPU/Disk IO para el plan Nano de Supabase. app/lib/eco.ts centraliza intervalos (ECO), actividad (pausa si la pestaña no se ve o hay 2 min de inactividad), `startPoll` y `onWake`. Realtime filtrado (AppShell escucha solo `conversations` con user_a/user_b = yo; ChatPane filtra reacciones por conversación). Pollings alargados, «Ver más»/publicar incrementales (fetchFeedItems con `known`), chequeo barato de publicaciones nuevas, 1 sola consulta de perfil y getSession en AppShell, caché de la tienda (cosmetics.ts, `invalidateShopCache`/`mutate`), notas de Mensajes sin recarga por cada mensaje. SQL: sql/v1.6.3_ahorro_nano.sql (índices que faltan con detección de duplicados, dm_unread_summary liviana, push solo si hay suscripción, quita notes/note_likes de Realtime, daiwa_housekeeping + cron) y sql/v1.6.3_diagnostico_nano.sql (solo lectura). Sin variables nuevas. Pendiente: probar en producción con 2 cuentas y mirar el diagnóstico (bloques A/B) para ver qué más pesa (sospechoso: wallet_summary, feed_items).

## Qué se hizo en v1.6.2
Estado tipo SpaceHey (tablas user_status/status_likes; RPC status_set/status_clear/status_get/status_feed/status_like_toggle; StatusCard, StatusSheet, ProfileStatus; el feed de app/page.tsx mezcla estados con publicaciones). Menciones @ en historias (capa 'mention', máx. 5; story_elements_valid y story_visible actualizadas; trigger notify_story_mentions; tipo de aviso 'mention_story' con texto en notificaciones y push). Sugerencias de seguimiento (RPC follow_suggestions; FollowSuggestions, ~60 % de las visitas, posición 4–7, descartes en localStorage). Móvil: inputs a 16 px en táctil (sin zoom iOS), vh→dvh, sw v1.6.2, PwaRegister busca actualización al volver, atajos nuevos en el manifest (requieren regenerar el APK), offline.html. SQL: sql/v1.6.2_estado_menciones_sugerencias.sql. Sin variables nuevas. Pendiente de probar en producción con 2 cuentas.

## Qué se hizo en v1.6.1
Web Push: tabla push_subscriptions + push_config, triggers (notifications y messages) que llaman por pg_net a /api/push/send (cabecera x-push-secret = PUSH_WEBHOOK_SECRET); sw.js muestra y abre las notificaciones; Configuración → Notificaciones tiene PushSection; prefs nuevas notif_prefs.dm y notif_prefs.push_preview. Variables en Vercel: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, PUSH_WEBHOOK_SECRET. Los avisos del Muro nunca nombran a nadie. Ya probado y funcionando en producción (Brave y APK). Lecciones: VAPID_SUBJECT debe empezar por mailto: o https://; si net._http_response da 401 las claves PUSH_WEBHOOK_SECRET (Vercel) y push_config.secret (Supabase) no coinciden.

## Qué se hizo en v1.6.0
APK de PWABuilder (paquete app.vercel.daiwaplace.twa) en public/daiwaplace.apk, assetlinks.json real en public/.well-known, APK_URL activado. La llave de firma NO está en el proyecto (está en .gitignore). Sin SQL.

## Qué se hizo en v1.5.11
PWA: app/manifest.ts, public/sw.js (solo guarda estáticos), public/offline.html, íconos en public/icons, app/apple-icon.png, página /descargar, InstallBanner en el Inicio, lib/pwa.ts, public/.well-known/assetlinks.json (placeholder) y app/lib/appConfig.ts (APK_URL). Sin SQL.

## Qué se hizo en v1.5.10
Día de Muertos (colección + banner ilustrado), 11 banners nuevos con selector visual en el admin, brillito «Nueva confesión»/«Novedad» (lib/novelty.ts + components/NewTag.tsx), arreglo del aviso de misiones en celular, marcos que no tapan el nombre (components/cosmetics/decoPad.ts), clóset rediseñado, mejoras del editor/visor de historias, sello Doll nuevo y vista previa de Editar perfil/registro con identidad. Sin SQL propio.

## Qué se hizo en v1.5.8
Historias en celular (responder/enviar, editor con íconos visibles, ir al perfil tocando nombre/foto), Misiones en el Inicio (columna a la derecha, plegable, reclamables), barra lateral de PC minimizable, tienda en celular (hoja «Explorar», filtros), rendimiento (likes instantáneos, PostCard memo, decoraciones pausadas al hacer scroll, presupuesto de animaciones adaptativo, eventos en vivo agrupados, contexto de sesión memoizado).

## Qué se hizo en v1.5.9
- Pantalla pegada en celular: `app/lib/scrollLock.ts` (bloqueo de scroll con contador), fuga arreglada en `useKeyboardFit.ts`, red de seguridad en `AppShell.tsx`.
- Aviso instantáneo de misión completada: `components/economy/MissionNotifier.tsx` + evento `daiwa:action` emitido por `lib/supabaseClient.ts` (fetch observado) + evento `daiwa:missions-changed`.
- Reclamar misiones: candado anti doble toque, marcado optimista, cola de recargas (panel del Inicio y /misiones), recompensa mostrada con el multiplicador de eventos (`effectiveReward` en `lib/economy.ts`). El servidor (`mission_claim`) ya era idempotente.
- Misiones del Inicio con caché local (salen al instante) y primer pedido diferido 0,7 s.

## Notas
- Lado del panel de misiones: constante `MISSIONS_SIDE` en `app/page.tsx` ('right' / 'left').
- Nunca se probó en un teléfono real; revisar en celular: responder historia, enviar mensaje, editor de historias, «Explorar» en la tienda, salir de una historia y poder bajar.
- Verificado: `tsc` y `eslint` sin errores nuevos; `next dev` sirve todas las rutas principales (200). El único error de tsc (`LayoutProps` en layout.tsx) es de tipos generados de Next y ya existía.
