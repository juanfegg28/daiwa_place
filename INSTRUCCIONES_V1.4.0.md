# DaiwaPlace v1.4.0 «Tienda y Estilo» — instrucciones

## 1. Cómo subirla (en este orden)
1. **Supabase → SQL Editor**, pega y ejecuta **completo y en orden**:
   1. `sql/v1.4.0_tienda.sql` (esquema, compras, packs, guardián, acceso de renshsh…)
   2. `sql/v1.4.0_catalogo.sql` (los 250 ítems: 220 activos de la 1.4.0 + 30 de la 1.5.0 apagados)
   3. *(opcional, recomendado)* `sql/v1.4.0_pruebas.sql` → debe terminar con `fallos = 0`. Se deshace sola (rollback).
   Se pueden correr varias veces sin romper nada. Requiere haber corrido antes la v1.3.0.
   **Si ya corriste `v1.4.0_tienda.sql` antes:** corre solo `sql/v1.4.0_hotfix_guardian.sql` (cierra un hueco: con el UPDATE general que tiene `profiles` en Supabase se podía escribir `avatar_deco` directo, saltándose la compra). Si vuelves a correr `v1.4.0_tienda.sql` completo, ya lo incluye.
2. Sube el código (zip) a Vercel. **El SQL va ANTES del código.**
3. Entra como **renshsh** → `/tienda/inventario` (ya tiene todo gratis) y `/personalizar`.

Para ver la galería de comparación en producción: variable de entorno `NEXT_PUBLIC_DEV_COSMETICOS=1` → `/dev/cosmeticos` (solo muestra la 1.4.0). En desarrollo (`npm run dev`) está siempre disponible.

## 2. Lanzar la 1.5.0 (Sangre Noir y Emo Abismo) — más adelante
Corre `sql/v1.5.0_activar_sangre_noir_y_emo.sql` (dos `UPDATE`). Los diseños ya viajan en la app, así que no hace falta redesplegar nada para encenderlos (sí conviene subir la versión/novedades). Los 30 ítems de 1.5.0 están en la base con `is_active = false`.

## 3. Qué trae
**Tienda (`/tienda`)**: catálogo con filtros (categoría, rareza, colección, «lo que puedo pagar»), vista previa sobre TU foto y TU nombre, paletas incluidas y color libre en Legendarios/Míticos, compra con confirmación (precio, saldo, saldo después), colecciones con **pack −20 %**, premio por completar colección (insignia + título exclusivo + 400 ☾), **Pack Bienvenida** (3 decoraciones, 3 fuentes, 3 títulos comunes; configurable) y **Pack Fundador** con sus cosméticos.
**Inventario (`/tienda/inventario`)**: equipar/quitar con un toque.
**Estudio (`/personalizar`)**: pestañas Color · Nombre · Avatar · Tarjeta · Entrada · Fondo · Título, vista previa con la misma estructura del perfil, **probador** (tocar lo que no es tuyo lo prueba gratis; se compra desde la barra de abajo).
**Perfil**: decoración de avatar, nombre con fuente/efecto, título, insignias, fondo, efecto de entrada (una vez por visita, con «↻ Repetir» para visitantes) y **tarjetas v2** (ver sección 3b).
**Feed y comentarios**: decoración de avatar y efecto de nombre (consulta aparte y en lote; si falla, el feed queda como antes).
**Configuración → Apariencia**: «Animaciones de perfiles» (todas / solo en perfiles / ninguna) y «Efectos de nombre» (completa / ligera / plana). Además se respeta `prefers-reduced-motion` y el ahorro de datos.

### Los 3 cambios extra que pediste
1. **Racha** (Misiones): rediseñada — días seguidos, explicación corta, **semana en orden de calendario (Dom · Lun · Mar · Mié · Jue · Vie · Sáb)** con los días de racha marcados y «hoy» resaltado, y un solo bloque «Siguiente premio: día N · +X ☾ — te faltan N días» con su barra.
2. **Saldo**: chip del menú ahora es una tarjeta dorada «Mi saldo» con el número grande; píldora dorada brillante en el celular, en la tienda y en Misiones («Ver mi saldo →»).
3. **Puntito dorado**: aparece en el ícono de **Misiones** (menú de PC, menú del celular, botón de menú del celular), en el chip de saldo y en el botón Misiones de la tienda, mientras haya algo por reclamar. Se actualiza al cambiar de pantalla y cada 60 s.

## 3b. Tarjetas de perfil v2 (reemplazan a las anteriores)
Se reemplazaron las 27 tarjetas por las nuevas del otro chat (`src/cards/` nuevo, **sin tocar**). Ya NO son un póster 340×420: son una **superficie fluida** que envuelve los bloques reales del perfil.
- **Estructura del perfil con tarjeta**: banner del usuario arriba (afuera, nunca lo cubre) → tarjeta `.sk` que envuelve: avatar (sube sobre el banner), botones, nombre + roles/clubes + título + insignias, @usuario, biografía + canción, identidad, chips, «Se unió» y contadores. Debajo de la tarjeta siguen Destacadas y publicaciones.
- Sin tarjeta equipada **nada cambia**: encabezado clásico + tarjeta de color gratis de siempre.
- Los bloques usan los tokens de la tarjeta (`--sk-ink`, `--sk-mute`, `--sk-panel`, `--sk-line`, `--sk-chip`, `--sk-accent`) mediante estilos `.sk-in …` al final de `globals.css` y las clases `pf-box`, `pf-id`, `pf-chip`. Con tarjetas **claras** el texto se invierte solo; además, en tarjetas claras se ignora el color de nombre elegido (está calculado para tema oscuro).
- Se eliminó todo lo viejo: `_kit/cards/render.js`, `lib.js`, `c2.js`, `c3.js`, el componente `KitCard`, el recorte de biografía y las estadísticas «SEGUIDORES/SIGUIENDO/AMIGOS» (ya no existen en la tarjeta; los contadores reales son los del perfil).
- Slugs, precios, rarezas y paletas **no cambian**: **no hay SQL nuevo**; los SQL de arriba siguen siendo los mismos.
- Tienda/inventario/estudio muestran las tarjetas como miniatura suelta (`SkinThumb`) y, en el estudio, con la misma estructura del perfil real.
- `/dev/cosmeticos` → sección «Tarjetas»: elige tarjeta, paleta, banner (incluye uno oscuro B/N con murciélagos y «sin banner») y ancho 380 / 672 px, renderizado con el MISMO componente del perfil real. Las 23 tarjetas se montan sin errores.
- Capturas en `docs/capturas/`.

## 4. Renshsh (acceso total)
`cosmetic_staff_access` le entrega **todo el catálogo gratis** (250 ítems, incluidos los 30 de 1.5.0) y **todo lo que se agregue después** (trigger). Es una excepción a «nada de 1.5.0 visible», pensada para probar, y está acotada:
- Los 30 de 1.5.0 solo salen en su **inventario → «Lo que viene · solo equipo»** y en el **probador** del estudio (se ven, no se guardan). Para cualquier otra cuenta `staff_preview_items()` devuelve 0 filas.
- **No** puede equiparlos en su perfil real antes del lanzamiento (el guardián de `profiles` lo rechaza, incluso con permisos totales). En la tienda, packs y perfiles públicos no aparecen.
- Los regalos del equipo **no cuentan** para los logros «5 cosméticos» ni «Primera colección» (no cobra Lunas por regalos).
- Interruptor: `update app_settings set value = to_jsonb('off'::text) where key = 'cosmetics_staff_preview';` apaga incluso su vista previa.
Si renshsh no existía al correr el SQL, vuelve a correr `v1.4.0_tienda.sql`.

## 5. Decisiones que tomé (avísame si quieres otra)
- **Unicidad por `(type, slug)`**, no solo slug: «nebulosa», «luciernagas», «colmillos» y «aurora» existen en dos tipos. Con `slug unique` del plan habría fallado.
- **Tarjeta v2**: ya no trae estadísticas ni datos de muestra (todo son los bloques reales del perfil). Sin banner propio queda el degradado de siempre de DaiwaPlace.
- **Títulos exclusivos por colección** (el kit trae solo el nombre): la pastilla usa el estilo de los títulos épicos con los colores de la primera decoración de esa colección.
- **Pack Bienvenida**: README del kit dice 3/3/3 y el plan dice «1 de 3»; implementé **3/3/3 a elegir entre comunes** y es configurable (`cosmetics_welcome_decos/fonts/titles` en `app_settings`).
- **Corona de eclipse**: se entrega sola al completar 3 colecciones. **Alas de fénix** (evento) no se puede conseguir todavía.
- La **CSS** de los diseños se envía en el HTML (componente de servidor), y el kit JS se descarga **solo si alguien en pantalla lleva algo**. El código de 1.5.0 sí va en el bundle (no hace daño; no se dibuja ni se envía su CSS).

## 6. Fuentes (verificadas contra npm + los archivos reales)
- 41/41 con glifos completos de «Ñandú José Ángel ¿¡ü». Todas existen. Cinzel ya la carga la app.
- **No son OFL**: **Chewy** y **Special Elite** son **Apache-2.0** (permite uso comercial; está registrado así en la base y en `public/fonts/cosmetics/LICENSES.txt`). `fonts.json` decía OFL.
- **Pesan más de 40 KB** (aun recortadas a Latin): Metal Mania 72 KB, Rubik Glitch 68 KB, Special Elite 51 KB, Jim Nightshade 49 KB, Yuji Syuku 41 KB. Se cargan solo cuando alguien las usa. No inventé reemplazos.
- «Clásica» = quitar la fuente (es la de la app).

## 7. Lo que probé y lo que NO
**Probado**: SQL en Postgres 16 real (v1.3.0 + esta, dos veces seguidas), **65/65 pruebas** (incluye que nada de 1.5.0 aparece en tienda, inventario, packs, perfiles, misiones; compra doble, concurrencia con dos sesiones, precio cambiado, packs, premios, guardián), `next build` OK, `eslint` y `tsc` limpios, `/dev/cosmeticos` en Chromium: 65 decoraciones, 23 tarjetas, 14 entradas, 16 efectos de nombre, 14 fondos, 17 títulos, 42 fuentes, 15 insignias y **cero** rastro de Sangre Noir/Emo Abismo en el DOM; 3 perfiles de ejemplo (capturas en `docs/capturas/`).
**No probado**: contra tu Supabase real ni con tus datos; las pantallas con login (tienda, estudio, perfil) no las pude abrir sin sesión — las verifiqué por compilación y por la galería; fps en un teléfono real (meta ≥ 50 fps con 20 posts); el build usó fuentes de Google sustituidas porque el sandbox no tiene internet.

## 8. Lo que NO está (quedó fuera de esta versión)
- La decoración/efecto **aún no sale** en: notificaciones, mensajes, bandeja de historias, listas de likes/seguidores, Explorar y menciones (esas consultas/RPC — `dm_inbox`, `stories_tray`… — hay que recrearlas con las columnas nuevas; propuesta para 1.4.1).
- Looks guardados, ofertas del día / destacado de la semana, lista de deseos, códigos que regalan cosméticos, fondo con **imagen propia** + moderación, galería de pruebas `/admin/cosmeticos`, pestaña de admin del catálogo (existen las funciones SQL `admin_cosmetic_list`, `admin_cosmetic_set_price`, `admin_cosmetic_releases`, sin pantalla).
- Cobro por reemplazar misión, tope de 8 animaciones simultáneas (solo se anima lo visible y hay el ajuste de movimiento).

## 9. Archivos nuevos/clave
`sql/v1.4.0_*.sql`, `sql/v1.5.0_activar_*.sql`, `app/components/cosmetics/` (`_kit` intacto, `kit.ts`, `cosmetics.tsx`, `Avatar`, `NameText`, `ItemPreview`, `ShopItemCard`, `ItemSheet`, `WelcomePackSheet`, `useShopData`), `app/lib/cosmetics*.ts`, `app/tienda/**`, `app/personalizar/page.tsx`, `app/perfil/[username]/ProfileHero.tsx` (banner + tarjeta que envuelve los bloques), `app/dev/cosmeticos/**`, `public/fonts/cosmetics/`, `tools/gen_catalog_sql.py`.
