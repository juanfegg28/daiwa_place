# DaiwaPlace — contexto para continuar en otro chat (estado: v1.5.10 · Día de Muertos listo para lanzar el 31-oct; ver INSTRUCCIONES_V1.5.10.md)

Red social gratuita para miembros de un servidor de rol escolar de Roblox (perfiles, muro, comentarios, historias, mensajes, tienda de cosméticos, Lunas y misiones). Next.js 16 (App Router) + Supabase + Tailwind. Se despliega en Vercel (daiwaplace.vercel.app).

## Cómo correrlo
1. `npm install`  2. crear `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`  3. `npm run dev`
(Este zip NO trae node_modules ni .env: se instalan/crean aparte.)

## SQL
Todos los scripts están en /sql (por versión). La v1.5.8 y la v1.5.9 NO añadieron SQL; los últimos son el de la v1.5.0 y los dos de Día de Muertos (sql/v1.5.10_*).

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
