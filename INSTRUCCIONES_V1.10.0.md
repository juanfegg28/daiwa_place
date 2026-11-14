# DaiwaPlace v1.10.0 · IRIS — instrucciones

Actualización dedicada a **velocidad y eficiencia**, sobre la v1.9.0 «Constelaciones», sin reconstruir nada. Partí de tus `layout.tsx` y `globals.css` corregidos.

## 1. Cómo instalarla

1. **Código**: reemplaza la carpeta del proyecto por la de este ZIP (igual que en otras versiones) y corre `npm install`. **No hay dependencias nuevas** (solo cambió el número de versión).
2. **SQL** (Supabase → SQL Editor → New query → pega el archivo completo → Run). Son 3, en este orden, y **se pueden correr más de una vez sin problema**. No borran ni cambian datos de nadie ni tocan las políticas RLS existentes:
   | Orden | Archivo | Para qué | Si no lo corres |
   | --- | --- | --- | --- |
   | 1 | `sql/v1.10.0_1_iris_rendimiento.sql` | Contadores livianos (`post_counters`) para que el feed no descargue todos los likes y comentarios de cada tarjeta | La página funciona igual que la 1.9.0 (lo detecta y usa la consulta de siempre) |
   | 2 | `sql/v1.10.0_2_recuperacion_cuentas.sql` | Tablas y funciones de la herramienta «Recuperación de cuentas» | La herramienta avisa «Falta correr el SQL de la v1.10.0»; lo demás funciona |
   | 3 | `sql/v1.10.0_3_indices_y_busqueda.sql` | Dos índices que faltaban y búsqueda rápida de personas (`pg_trgm`) | Nada se rompe (es solo velocidad) |
   Recomiendo correr el 1 **antes** de subir el código para que el feed ligero funcione desde el primer momento.
3. **Subir a Vercel** como siempre. **No hay variables de entorno nuevas** (la recuperación usa `SUPABASE_SERVICE_ROLE_KEY`, que ya usas en `/api/recover`).
4. **Permiso nuevo**: en Centro de Mando → Taller de roles aparece «Recuperar cuentas (generar enlaces de acceso)». El Admin Supremo ya lo tiene siempre; dáselo a un rol solo si es de total confianza.
5. La primera vez los usuarios ven la versión nueva al recargar (el service worker pasó a `v1.10.0` y limpia lo viejo).

Opcional: `sql/v1.10.0_diagnostico.sql` (solo lee) para comparar antes/después en tu proyecto (consultas, índices duplicados, tablas en Realtime, salud de contadores). Antes de actualizar, corre `select pg_stat_statements_reset();` y compara 1–2 días después con el diagnóstico de la v1.6.3.

## 2. Lo nuevo

- **Faded Iris** (#4e3559) como acento predeterminado, con Raven Black #080d10, Gothic Plum #571947, Royal Lilac #9166a6 y Lavender #c8bbe9. La rampa de color está afinada a mano en `globals.css` (600 = Faded Iris para botones, 500 = Royal Lilac, 400/300 = lilas claros para texto) con contraste ≥ 4,5:1 en oscuro y claro (calculado, ver comentarios). Quien eligió otro color en Configuración lo conserva. **Ojo**: el sistema siempre guardó «Granate» como «sin color elegido» (null), así que quien nunca eligió color *y* quien eligió Granate expresamente verán Faded Iris; si alguien quiere Granate, lo elige otra vez y ahora se guarda de forma explícita. El script que pinta el tema antes de mostrar la página ahora fija las 5 variables del acento (antes solo 1 y el resto «saltaba» al cargar).
- **Flechas en carruseles** (`ScrollCarousel`): sugerencias de amistad, clubes y pandillas de Explorar, página de Clubes, vitrinas y carriles de la tienda. Solo mueven contenido ya cargado (cero peticiones), aparecen solo con ratón/trackpad (en el celular se desliza como siempre), se ocultan si todo cabe, se atenúan al llegar al borde, funcionan con teclado (Tab y ← →) y lector de pantalla.
- **Panel de misiones minimalista**: una sola tarjeta, resumen de Diarias con barra delgada, racha pequeña (sección plegable con escudo, bono de entrada e hitos), «Por reclamar» (acceso rápido a premios que están en secciones plegadas), Semanales plegadas, enlace a `/misiones` y el Círculo Lunar en una línea discreta. Mismas funciones, mucho menos espacio.
- **Recuperación de cuentas** (Centro de Mando): ver sección 4.

## 3. Optimización por sección (lo que realmente cambió)

**Inicio / feed**
- Tarjetas **ligeras**: antes cada publicación traía *todos* los likes (`user_id` de cada persona) y *todos* los comentarios con el perfil de cada autor y los likes de cada comentario. Ahora trae contadores (`post_counters`), **tu** like y **tu** compartido (filtros sobre las relaciones embebidas) y los comentarios se piden al abrirlos (una consulta de esa publicación).
- Comentar, editar o borrar ya no recarga todo el feed: se renueva solo esa publicación (antes: lista de ids + todas las publicaciones con sus comentarios + etiquetas).
- Los cosméticos del autor (decoración, estilo de nombre) vienen incluidos en la misma consulta: una petición menos por carga del feed.
- **Caché en memoria** del feed (`lib/feedCache.ts`): al abrir una publicación y volver, el Inicio reaparece al instante *en el mismo punto*, sin pedir nada si tiene menos de 45 s (y se renueva por debajo si es más vieja, hasta 20 min). Atada a la cuenta (nunca se muestra a otra), solo en memoria (no se guarda en disco), se borra al cerrar sesión y cuando cambias lo que el feed muestra (seguir/silenciar/preferencia del feed).
- Las pantallas **Perfil, Guardados, Etiquetas y Clubes** usan las mismas tarjetas ligeras y comentarios bajo demanda. El feed de **Clubes** dejó de recargar todo en cada like (era la sección más cara por interacción).
- **Perfil**: el encabezado aparece cuando llegan sus datos; las publicaciones cargan debajo con esqueleto (antes esperaba a *todas* las consultas).
- La vista de **una sola publicación** (`/post/[id]`) sigue cargando todo, como antes.

**JavaScript y página (medido)**: ver sección 5. Resumen: Centro de Mando −54 %, Perfil −40 %, Tienda −44 %, Inventario −46 %, Personalizar −49 %; el HTML de cada página pasó de ≈226 KB a ≈23 KB.
- Centro de Mando: cada pestaña es su propio paquete (se precarga al pasar el cursor o enfocar).
- El kit de cosméticos (≈650 KB) ya no va en el JavaScript inicial de Perfil, Tienda, Inventario, Personalizar ni Supporter → Estilos: se carga bajo demanda (`ItemPreview` partido, `ItemSheet`/`Closet` diferidos, `useKit`, `cardTone` ligero).
- El CSS de los cosméticos (≈102 KB) salió del HTML de todas las páginas: es un archivo estático (`/cosmetics.css?v=hash`) con caché de un año que se pide sin bloquear el pintado.
- Las notas de versión (≈57 KB) ya no viajan en cada página (solo en `/novedades`).
- **Fuentes**: Geist, Geist Mono, Cinzel y las 4 fuentes de historias ahora se sirven desde el propio proyecto (`app/fonts`, `next/font/local`, licencia OFL en `app/fonts/LICENCIAS.md`). Cero peticiones a Google ni al compilar ni en el navegador, y la compilación ya no depende de internet. **No volver a `next/font/google`.**
- Búsquedas (Explorar, Identidades, Roles, Lunas, Supporters, Recuperación): descartan respuestas atrasadas si sigues escribiendo.
- Susurros: la renovación automática pide el susurro y sus comentarios (2 peticiones en vez de 4).
- Imágenes de listas (notificaciones, respuestas a historias, fotos de chat) con carga diferida.
- Ya estaban bien y las conservé: el ritmo de renovaciones (3–15 min, solo con la pestaña visible), el hub de Realtime, la paginación de mensajes y del feed, `feed_items` con publicaciones ya cargadas.

**Supabase**
- `post_counters`: una fila diminuta por publicación (no se toca la tabla `posts`), triggers que nunca bloquean un like/comentario, relleno inicial automático y `recount_post_counters()` para recalcular.
- Índices: revisé los de v0.11, v1.6.3, v1.8.0 y v1.9.0 y **no repetí ninguno**; solo agregué `saved_posts(post_id)` y `reposts(post_id)` (borrar una publicación recorría esas tablas enteras) y búsqueda de personas con `pg_trgm`.
- No encontré fuentes de *Log Ingestion* en SQL: ninguna función emite `NOTICE/WARNING` en tiempo de ejecución (los de los SQL anteriores son solo de las migraciones). Lo que se puede reducir son las **peticiones** (cada una genera registro): ver sección 5.
- Realtime: la página solo escucha `notifications`, `conversations`, `messages` y `message_reactions`; el diagnóstico lista si tu publicación tiene tablas de más.

## 4. Recuperación de cuentas (Centro de Mando)

Para quien olvidó **contraseña y palabra secreta**. Pestaña «Recuperación de cuentas» (solo Admin Supremo o rol con el permiso `recover_accounts`).

1. Busca por nombre de usuario o nombre de estudiante (con retraso de 300 ms al escribir; resultados con avatar, nombre, @usuario e ID).
2. Elige la cuenta. Verás si tiene palabra secreta registrada, si hay un enlace activo y el historial.
3. **Verifica a la persona por un canal privado** (Discord/Roblox…), escribe cómo la verificaste (mín. 10 caracteres, queda en la auditoría) y marca la confirmación.
4. «Generar enlace»: se muestra **una sola vez**. Entrégaselo por mensaje privado. **Sirve una vez y vence a las 4 horas.**
5. La persona lo abre (`/recuperar/enlace#…`), elige contraseña y palabra secreta nuevas. Nunca se ve nada anterior. Se cierran sus demás sesiones.

Seguridad (comprobado en el servidor, no en el navegador): permisos validados con el token de sesión y leídos de la base de datos; **solo el Admin Supremo puede recuperar cuentas del staff o del propio Admin Supremo**; no se puede generar un enlace para la propia cuenta; el enlace es de 256 bits y en la base solo queda su hash SHA-256; viaja en el fragmento `#` de la URL (no llega a ningún registro del servidor ni a otros sitios; la página no se indexa); se consume con un UPDATE atómico (dos personas a la vez: solo una); el sistema **no envía nada por correo** (los correos de DaiwaPlace son internos y no verificados) y **nunca entrega acceso por sí solo**; límites (5 enlaces por cuenta/24 h, 20 por administrador/hora, 20 intentos fallidos por conexión/hora); auditoría permanente en `account_recovery_audit`. No toca perfil, publicaciones ni Lunas. La recuperación tradicional por palabra secreta (`/recuperar`) sigue igual.

## 5. Mediciones (todo lo que está aquí se midió; lo que no, está dicho)

**JavaScript de primera carga por ruta** (`next build` de Next 16.3.6 con Turbopack; Next 16 ya no imprime tamaños, así que lo mide `tools/medir-bundles.mjs`). KB sin comprimir / brotli:

| Ruta | v1.9.0 | v1.10.0 | Cambio |
| --- | --- | --- | --- |
| `/admin` | 1.837 / 427 | 840 / 206 | -54 % |
| `/perfil/[usuario]` | 1.770 / 422 | 1.065 / 269 | -40 % |
| `/tienda` | 1.636 / 384 | 912 / 225 | -44 % |
| `/personalizar` | 1.653 / 392 | 839 / 207 | -49 % |
| `/tienda/inventario` | 1.583 / 371 | 857 / 212 | -46 % |
| `/apoyar/estilos` | 1.567 / 366 | 850 / 209 | -46 % |
| `/ (Inicio)` | 1.070 / 273 | 1.024 / 258 | -4 % |
| `/explorar` | 905 / 227 | 852 / 210 | -6 % |
| `/mensajes/[[...id]]` | 996 / 250 | 940 / 232 | -6 % |
| `/misiones` | 904 / 226 | 848 / 209 | -6 % |
| `/login` | 768 / 187 | 768 / 187 | +0 % |

El piso de ≈768 KB de toda página son React/Next (460 KB) y el cliente de Supabase (≈217 KB); no lo toqué. HTML de `/login`: 226.224 B (26,5 KB gzip) → 22.900 B (5,5 KB brotli).

**Navegador real** (Chromium 153 sin interfaz, móvil 390×844, CPU 4× más lenta, 1,6 Mbps / 150 ms, **caché fría**, compresión emulada como la de la CDN, mediana de 3 cargas; 7 en `/`). Son páginas **sin sesión** (se ve la estructura y el JavaScript de cada ruta, no datos de Supabase) y es medición de laboratorio, **no** el percentil 75 de usuarios reales:

| Página | FCP | LCP | TBT | JS transferido | Total |
| --- | --- | --- | --- | --- | --- |
| `/login` | 864 → 836 ms | 2.348 → 2.284 ms | 85 → 78 ms | 211 → 211 KB | 331 → 321 KB |
| `/tienda` | 864 → 776 ms | 4.092 → 3.140 ms | 100 → 55 ms | 438 → 254 KB | 575 → 374 KB |
| `/personalizar` | 808 → 764 ms | 3.964 → 2.836 ms | 88 → 50 ms | 446 → 232 KB | 583 → 352 KB |
| `/admin` | 840 → 764 ms | = FCP | 170 → 56 ms | 487 → 231 KB | 619 → 347 KB |
| `/` (7 cargas) | 808 → 784 ms | = FCP | 28 → 60 ms | 306 → 289 KB | 426 → 400 KB |

CLS fue 0 en todas. En `/` el TBT subió de 28 a 60 ms (ambos muy por debajo de 200 ms; con tan pocos milisegundos entra en el ruido del laboratorio, pero lo anoto). **Una medición mala que encontré y corregí**: la primera versión cargaba el CSS de cosméticos como `<link>` normal y el primer pintado de `/login` tardó más de 1 s *más*; ahora se pide sin bloquear.

**No medido**: INP (necesita interacción real de personas), LCP/CLS/INP al percentil 75 con usuarios reales, páginas con sesión iniciada, Supabase en producción (egress, tiempos de consultas) y Android/iPhone reales. Objetivos de referencia (LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1): el CLS cumple en lo medido; para LCP/INP necesitas datos reales (Vercel Speed Insights o `web-vitals`).

**Egress y Log Ingestion**: no tengo acceso a tu proyecto, así que **no puedo darte porcentajes verificados**. Lo que sí es verificable por inspección del código: peticiones por acción — comentar en el Inicio: 3 (+ publicaciones completas) → 1 consulta de comentarios; like en un club: 3 → 1 (y ahora es instantáneo); cargar el feed: 4 → 3; renovar un susurro: 4 → 2; y cada tarjeta ya no lleva likes ni comentarios completos. Para medirlo en tu proyecto: Supabase → Reports (API/Egress) antes y después, y `v1.10.0_diagnostico.sql`.

## 6. Pruebas realizadas

- **Compilación** `next build` (misma configuración de Vercel, Turbopack) sin errores; `tsc --noEmit` y ESLint limpios en los 49 archivos TS/TSX nuevos o modificados.
- **SQL en PostgreSQL 16** con un esquema mínimo: contadores (insertar/borrar, borrado en cascada de una publicación con likes y comentarios, recálculo, RLS, idempotencia), enlaces de recuperación (un solo uso, vencimiento, revocación, límites, permisos), índices (corrido dos veces).
- **PostgREST 12.2.12** (el motor de la API de Supabase): la consulta ligera del feed devuelve `post_counters` como objeto y `likes`/`reposts` solo con la fila de quien consulta; búsqueda del buscador; RLS (lectura sí, escritura no, anónimo no).
- **API de recuperación de punta a punta (42 comprobaciones)**: sin sesión 401, usuario normal y moderador sin permiso 403, búsqueda, cuentas del staff protegidas, validaciones, enlace de 43 caracteres y solo su hash en la base, un solo uso, contraseña cambiada solo en la cuenta correcta, auditoría, revocación y freno de intentos. Los archivos están en `tools/pruebas/` (ver su `LEEME.md`).
- Lo anterior es en un entorno de trabajo, **no en tu Supabase real**. La autenticación de Supabase se simuló (solo `/auth/v1/user` y el cambio de contraseña); el cambio real de contraseña con GoTrue no se probó.

## 7. Verificaciones pendientes en producción

1. Correr los 3 SQL y revisar el feed (que cargue ligero): en el navegador → pestaña Network → una petición `posts?select=…post_counters…` debe pesar mucho menos que antes.
2. Probar una recuperación completa con una cuenta de prueba (genera → abre → cambia → inicia sesión con la nueva contraseña).
3. Revisar a ojo Faded Iris en claro y oscuro y las flechas de los carruseles en computadora.
4. Que Vercel comprima `/cosmetics.css` (lo hace con los archivos de texto; en la medición se emuló).
5. Medir LCP/INP reales unos días (Speed Insights).

## 8. Volver atrás

El código de la 1.9.0 funciona con los SQL nuevos (las tablas nuevas no le estorban). Para revertir el feed ligero sin tocar el código basta no usar `post_counters`: si borras la tabla, la página detecta que falta y vuelve sola a la consulta completa.

## 9. Archivos nuevos o cambiados importantes

`app/lib/queries.ts` (modos full/light/detail, comentarios bajo demanda), `app/lib/feedCache.ts`, `app/lib/fonts.ts`, `app/lib/version.ts`, `app/lib/theme.ts`, `app/components/ScrollCarousel.tsx`, `app/components/economy/MissionsPanel.tsx`, `app/components/cosmetics/{ItemPreview,ItemPreviewBody,CosmeticsStyles,lightCards,useKit}`, `app/cosmetics.css/route.ts`, `app/admin/RecuperacionTab.tsx`, `app/api/admin/account-recovery/route.ts`, `app/api/recover/link/route.ts`, `app/recuperar/enlace/`, `app/fonts/`, `sql/v1.10.0_*.sql`, `tools/medir-bundles.mjs`, `tools/pruebas/`, `public/sw.js` (v1.10.0).
