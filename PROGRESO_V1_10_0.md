# DaiwaPlace v1.10.0 · IRIS — registro de avance (uso interno)

Base: v1.9.0 + layout.tsx/globals.css corregidos por el usuario. Compila con `next build` (Turbopack, Next 16.3.6).
Medir: `npm run build && node tools/medir-bundles.mjs`. Pruebas de SQL/API: `tools/pruebas/LEEME.md`.

## Hecho
- [x] Fuentes locales (next/font/local): Geist, Geist Mono, Cinzel + 4 de historias (app/fonts, lib/fonts.ts, storyFonts.ts). Sin Google.
- [x] changelog fuera del JS común (lib/version.ts); version 1.10.0 (package.json, lock, sw.js, changelog)
- [x] Centro de Mando: 14 pestañas con next/dynamic + precarga al hover/foco
- [x] Faded Iris (theme.ts, globals.css claro/oscuro, script de arranque con rampa completa, presets, stickers)
- [x] ScrollCarousel (flechas, teclado, aria, solo ratón): Inicio, Explorar, Clubes, Vitrina, Tienda
- [x] Panel de misiones compacto (MissionsPanel.tsx + SupportBanner compact)
- [x] Feed ligero: post_counters (SQL 1) + tarjetas ligeras (lib/queries.ts modos full/light/detail) + comentarios bajo demanda
      en Inicio, Perfil, Guardados, Etiquetas y Clubes; sin recargar todo al comentar/editar/dar like
- [x] Caché en memoria del feed con restauración de scroll (lib/feedCache.ts)
- [x] Recuperación de cuentas: SQL 2, API /api/admin/account-recovery + /api/recover/link, pestaña del Centro de Mando, /recuperar/enlace, permiso recover_accounts
- [x] CSS de cosméticos como archivo estático con caché larga (app/cosmetics.css/route.ts); HTML de cada página ≈10× más liviano
- [x] Kit de cosméticos fuera del JS inicial: Perfil, Tienda, Inventario, Personalizar (Closet diferido), Supporter/Estilos (useKit)
- [x] SQL 3 (índices que faltaban + búsqueda pg_trgm) y diagnóstico v1.10.0
- [x] Búsquedas sin respuestas atrasadas (Explorar, Identidades, Roles, Lunas, Supporters, Recuperación)
- [x] Perfil: el encabezado no espera a las publicaciones; susurros: renovación de 2 peticiones en vez de 4; imágenes de listas con lazy
- [x] Lint limpio en archivos nuevos/modificados; pruebas SQL/PostgREST/API (ver tools/pruebas)

## Pendiente
- [x] INSTRUCCIONES_V1.10.0.md y CONTEXTO_PARA_OTRO_CHAT.md (sección v1.10.0)
- [x] Mediciones en navegador real (Chromium headless, móvil emulado): tools/pruebas/medir-navegador.mjs
- [ ] INP y usuarios reales: no medibles en este entorno
- [ ] ZIP final (al terminar)
