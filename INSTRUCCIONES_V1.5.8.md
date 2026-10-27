# DaiwaPlace v1.5.8 — Historias a punto, Misiones en el Inicio y más fluidez

**No necesita SQL.** Todo usa las funciones que ya tienes (missions_today, missions_week, mission_claim, chest_claim).

## Cómo instalarla
1. Reemplaza los archivos de tu proyecto con los del zip (misma estructura).
2. `npm run dev` para probar en local → `git add . && git commit -m "v1.5.8" && git push` para Vercel.

## Qué cambió
- Historias (celular): arreglado no poder responder/enviar (controles que se escondían solos, botón perdido al cerrarse el teclado, zoom en iPhone); tocar foto/nombre lleva al perfil; editor con íconos de arriba siempre visibles; tocar la historia con teclado abierto solo lo cierra.
- Misiones en el Inicio: columna a la derecha en PC (≥1280 px) con Diarias y Semanales minimizables y reclamables; tarjeta plegable en pantallas chicas.
- Barra lateral de PC minimizable (3 rayitas), abierta por defecto, con puntitos de avisos/mensajes/misiones.
- Tienda en celular: «Explorar» ahora abre una hoja desde abajo; pestañas que se centran; filtros en una fila deslizable.
- Rendimiento: likes instantáneos, escribir ya no repinta el feed, decoraciones pausadas al hacer scroll y tope menor en celulares, eventos en vivo agrupados, sesión memoizada.

## Probar en el celular (importante)
No pude probar en un teléfono real: prueba responder una historia, enviar un mensaje con el teclado abierto, el editor de historias y «Explorar» en la tienda.

## Archivos nuevos / tocados
Nuevo: app/components/economy/MissionsPanel.tsx
Tocados: app/page.tsx, AppShell.tsx, WalletChip.tsx, PostCard.tsx, StoryViewer.tsx, ReplyBar.tsx, StoryEditor.tsx, StoriesTray.tsx, ChatPane.tsx, ShopFrame.tsx, ItemFilters.tsx, cosmetics.tsx, animBudget.ts, globals.css, changelog.ts, package.json
