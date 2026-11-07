# DaiwaPlace v1.8.0 — Instrucciones

**Clubes renovados · Racha con escudo · Bono diario · Más ventajas del Círculo Lunar · Cambio rápido de cuentas · Arreglos · Ahorro**

## 1) Pasos para publicarla
1. **Supabase → SQL Editor → New query →** pega TODO `sql/v1.8.0_clubes_rachas_beneficios.sql` → **Run**. Se puede correr más de una vez. Hazlo antes (o justo después) de desplegar.
2. Sube el proyecto a GitHub/Vercel como siempre. No hay variables de entorno nuevas.
3. Abre la página, entra a **Clubes**, **Misiones** y **Configuración → Mis cuentas** para comprobar.

> Si despliegas antes de correr el SQL, la página sigue funcionando: lo nuevo (selector de club, racha, bono diario, niveles) simplemente no aparece hasta correr el SQL.

## 2) Qué trae

### Arreglos de los reportes
| Reporte | Causa | Arreglo |
|---|---|---|
| Susurros: comentarios en columna de letras (celular) | Cada respuesta se metía un nivel a la derecha; a partir del 4.º el texto se quedaba sin ancho | Solo se anidan 2 niveles. Lo más profundo va en una columna con «↪ en respuesta a…». Avatares más chicos en respuestas |
| Estado: se sobreponen historias/fotos | La hoja vivía dentro de la tarjeta del perfil/feed (con efectos que atrapan el `fixed`) | La hoja se dibuja en `<body>` (portal) con z-index alto y bloquea el scroll de fondo |
| Perfil dice «Seguir» pero chat y «Seguidos» dicen «Amigos» | Condición de carrera: el estado de seguimiento se calculaba con la sesión aún sin cargar | Se usa siempre el id de sesión más reciente y se recalcula al cargar sesión o perfil |

### Clubes
- **Publicar solo en el club:** en el Inicio, si estás en un club aparece «Publicar en: 🌐 Todo Daiwa / 🏷️ Solo [club]». Esas publicaciones **no salen** en el Inicio, el perfil, hashtags ni compartidos. Solo en la página del club.
- **Página general de Clubes:** ahora muestra solo **anuncios y publicaciones de líderes** (con etiqueta 📢 Anuncio y el nombre del club).
- **Líderes:** marcan 📢 anuncio (queda arriba 7 días) y eligen si publican **todos los miembros** o **solo líderes** (Administrar → Ajustes de publicación).
- **Niveles:** puntos = 4 por miembro + 3 por cada (miembro, día) con publicación de club en 30 días (no se infla publicando 50 veces el mismo día).
  | Nivel | Puntos | Beneficio |
  |---|---|---|
  | 1 Semilla | 0 | Página, tablón, roles |
  | 2 Brote | 30 | Insignia y 60 ☾/semana al líder |
  | 3 Constelación | 80 | «Destacado» (sale primero) y 120 ☾/semana al líder |
  | 4 Aurora | 160 | 200 ☾ al líder y +15 ☾ a quien publicó en el club esa semana |
  | 5 Eclipse | 300 | 320 ☾ al líder y +25 ☾ a los miembros que publicaron |
  Además: **+3 roles propios por nivel** (12 → 24). Premios cada **lunes 00:10 (Colombia)** con `pg_cron`.
- **Nuevo en cada club:** «Reclutando», categoría, reglas, pestaña «Info y reglas»; en Clubes: «Mis clubes» y explicación de niveles.
- **Misiones de club:** diaria «Publica algo solo para tu club» y semanal «Publica 2 veces en tu club» (solo a quien está en un club).

### Racha, bono y beneficios para todos
- **Inicio:** pastilla 🔥 con los días de racha y **cuánto falta para que se apague**; si aún no reclamaste el bono, muestra 🎁.
- **Panel de Misiones** (columna derecha en PC / tarjeta en celular): racha, progreso al próximo premio, bono de entrada, premios por reclamar y estado del escudo.
- **Bono de entrada diario:** 10 ☾ + 2 por día de racha (máx. 15 días) → **12 a 40 ☾**. Cuenta con ≥ 1 día.
- **Hitos nuevos:** 5 d (30 ☾), 10 d (80 ☾), 21 d (300 ☾), además de 3/7/14/30. Cambia montos con `eco_cfg` (`streak_5`, `streak_10`, `streak_21`…).
- **🛡️ Escudo de racha:** racha ≥ 3 y se pasa **un** día → se salva. Recarga: 30 días (gratis).

### Círculo Lunar (`my_perks()`)
| | Gratis | Creciente | Llena | Eclipse |
|---|---|---|---|---|
| Bono de entrada | ×1 | ×1,25 | ×1,5 | ×2 |
| Premios de racha | — | +10 % | +20 % | +30 % |
| Recarga del escudo | 30 d | 14 d | 10 d | 7 d |
| Lunas extra en misiones y cofre | — | +15 % | +25 % | +40 % |
| Banner GIF | 6 MB | 12 MB | 12 MB | 12 MB |

Para cambiar estos números edita `my_perks()`, `streak_overview()`, `daily_login_claim()`, `streak_shield_ready()` y `streak_boost_pct()` en el SQL (y `app/lib/perks.ts` → `FREE_PERKS`).

**Lunas extra:** un trigger en `coin_ledger` paga el porcentaje extra cada vez que se cobra una misión o el cofre semanal (reason `supporter_bonus`, una sola vez por cobro).

**Anuncio «Apoya a DaiwaPlace»:** debajo de las Misiones, lleva a `/apoyar` (Círculo Lunar). Quien ya apoya ve un agradecimiento con sus ventajas. Se oculta 7 días con la ×.

### Cambio rápido de cuentas
- **Límite:** 2 cuentas guardadas por dispositivo para todos (en el rol solo hay 2 personajes). **@renshsh no tiene límite** (se decide en `my_perks()`). Ya no es ventaja del Círculo Lunar.
- **Dónde:** menú (celular) → «Cambiar de cuenta», barra lateral (PC), y **Configuración → Mis cuentas**. Se quitó de la idea poner más botones en el perfil.
- **Cómo funciona:** cada cuenta en la que entras con contraseña en ese dispositivo queda guardada (solo sus tokens de sesión, igual que Supabase ya hace; **nunca la contraseña**). «Cambiar» restaura esa sesión y recarga.
- **Añadir otra cuenta:** va a `/login?add=1`; la actual queda guardada para volver. Crear una cuenta nueva (registro) desde el mismo dispositivo también la añade.
- **Por qué NO se cambia «por IP / cuenta relacionada»:** en un colegio o una casa muchas personas comparten IP; cualquiera podría entrar a cuentas ajenas. La relación entre tus cuentas es **el dispositivo donde ya entraste**. Cambiar de dispositivo siempre pide contraseña.
- **Cerrar sesión** en una cuenta la quita de la lista. La × «Quitar de este dispositivo» la olvida sin cerrar sus otras sesiones. Si una sesión caduca, se pide volver a añadirla.
- El dispositivo deja de recibir los avisos push de la cuenta que se va (y se vincula a la nueva al cargar).

### Ahorro de Supabase (Egress y Log ingestion) y Vercel
Tus capturas: Egress 5,71 / 5 GB y Log ingestion 3,29 / 1 GB (ambos pasados). Qué se hizo:
- **Menos peticiones (lo que más llena los logs):** cada página montaba su propio `AppShell` y repetía 3-4 consultas (perfil, roles, modo mantenimiento) en **cada cambio de página**. Ahora se recuerdan 5 min entre páginas. Configuración pasa de **5 consultas a 1**. Publicar ya no hace `auth.getUser()` (consulta a Auth); usa la sesión local.
- **Menos egress:** banner GIF máx. 6 MB (antes 25 MB para todos; es lo más pesado en cada visita al perfil), caché de un año para banners y fotos del chat, `Cache-Control: immutable` para iconos/estáticos en Vercel, hashtags limitados a 60 resultados, sin `X-Powered-By`.
- **Limpieza diaria** (`daiwa_housekeeping_lite`, 04:40 Colombia): historial de `pg_cron` (> 2 días), respuestas de `pg_net` (> 1 día) y vistas de historias vencidas.
- **Qué más puedes hacer en el panel de Supabase** (no se puede desde código):
  1. *Logs → Settings*: en proyectos gratis los logs de Postgres/Edge/Auth se ingieren siempre; la forma de bajar es **menos requests** (ya hecho). Mira *Reports → API* para ver qué rutas más se llaman.
  2. Si sigues pasándote de Egress, activa en Vercel `NEXT_PUBLIC_UNOPTIMIZED_IMAGES=1` solo si se acaban las optimizaciones; de lo contrario deja el optimizador (guarda cada foto 30 días y **reduce** el egress de Supabase).
  3. Pide a quienes tengan GIF de banner de más de 6 MB que lo cambien (los ya subidos siguen funcionando).
  4. Borra del bucket `avatars` los banners GIF muy pesados desde *Storage* si ves que unos pocos concentran el egress.
- **Honestidad:** con 73 usuarios activos y varias pestañas abiertas, bajar a < 5 GB y < 1 GB depende de cuánto se use; estos cambios recortan lo más repetitivo, pero si el uso crece el plan Pro sigue siendo lo seguro.

## 3) Archivos nuevos / cambiados
- **SQL:** `sql/v1.8.0_clubes_rachas_beneficios.sql` (nuevo).
- **Nuevos:** `app/lib/accounts.ts`, `app/lib/perks.ts`, `app/components/AccountsPanel.tsx`, `AccountSwitcherSheet.tsx`, `economy/SupportBanner.tsx`, `economy/StreakChip.tsx`.
- **Cambiados:** `AppShell.tsx`, `StatusSheet.tsx`, `ProfilePageClient.tsx`, `susurros/CommentsThread.tsx`, `page.tsx` (Inicio), `MissionsPanel.tsx`, `clubes/*` (ClubFeed, página, ClubManage, ClubCard), `lib/clubs.ts`, `lib/economy.ts`, `lib/banner.ts`, `lib/supporters.ts`, `lib/changelog.ts`, `configuracion/page.tsx`, `(auth)/login`, `next.config.ts`, `public/sw.js`, `package.json`.

## 4) Cosas que conviene saber / probar
- Probar con 2 cuentas: añadir una segunda, cambiar, cerrar sesión en una (debe desaparecer de la lista).
- Publicar «solo en el club» y comprobar que **no** sale en el Inicio ni en el perfil, pero sí en el club.
- Reclamar el bono diario y revisar el ledger (`reason = 'login_bonus'`).
- Para dar premios de club a mano: `select public.club_weekly_rewards();` (usa claves únicas por semana, no paga doble).
- Esta versión no pudo compilarse con `next build` en el entorno donde se hizo (sin acceso a Google Fonts), pero pasó `tsc --noEmit` (solo queda el aviso conocido de `LayoutProps` que `next build` genera) y `eslint` sin errores, y el SQL pasó el análisis de sintaxis de PostgreSQL.
