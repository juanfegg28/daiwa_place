# DaiwaPlace v1.5.10 «Día de Muertos» — qué hacer

## 1) Subir el código
Reemplaza el proyecto con este zip (sin tocar tu `.env.local`) y súbelo a GitHub como siempre (`git add . && git commit -m "v1.5.10" && git push`). Vercel lo despliega solo.

## 2) SQL en Supabase (SQL Editor, uno por uno)
Esta versión **no trae SQL nuevo propio**. Solo los dos de la colección Día de Muertos (ya vienen renombrados a 1.5.10):

1. **Ahora (antes del 31)**: `sql/v1.5.10_catalogo_dia_de_muertos.sql` — crea la colección y sus 32 prendas, ocultas (`is_active = false`).
2. **El 31 de octubre** (cuando quieras lanzarla): `sql/v1.5.10_lanzar_dia_de_muertos.sql` — la enciende y crea la «Selección de Día de Muertos» con su banner (tema `muertos`).
   Marcha atrás: bloque comentado al final de ese archivo.

Si ya habías corrido el SQL del zip «1.6.0» (antes de renombrarlo), corre primero esto una vez: `update public.cosmetic_collections set release_version='1.5.10' where release_version='1.6.0'; update public.cosmetic_items set release_version='1.5.10' where release_version='1.6.0';`

Orden recomendado: SQL 1 → subir el código → el 31, SQL 2. Los dos son idempotentes (se pueden correr más de una vez).

## 3) Banners nuevos (panel de admin)
En **Admin → Selecciones** y **Admin → Descuentos** el banner ya no es una fila de colores: es una cuadrícula con la vista previa real de cada uno. Hay 19 (Halloween, Día de Muertos, Sakura, Aurora, Neón, Otoño, Invierno, Terciopelo, Océano, Bosque Fae, Cosmos, Atardecer + los de siempre). Se elige tocando uno; no hace falta SQL (la base guarda solo el nombre del tema).

## 4) Qué trae
- **Marcos:** «Corazones de vida» y «Barra de XP» ya no cuelgan bajo el avatar (van dentro del círculo, y las vidas se gastan de derecha a izquierda). El perfil ahora reserva debajo del avatar el espacio que el marco necesite, así ningún marco tapa el nombre. Los que más colgaban: Altar de calaveritas, Luz de ventana, Nubes de algodón, Gran catrina, Verja y telaraña, Velas de ofrenda, Niebla carmesí, Papel picado y Gato dormido.
- **Brillito de novedad:** «Nueva confesión» junto a Susurros y «Novedad» en la Tienda (barra lateral, pestañas y tarjetas nuevas). Letra brillante con el color del tema de cada persona; se apaga al entrar. Se guarda por navegador (localStorage), no en la base: en otro dispositivo se vuelve a ver una vez. Las colecciones que ya existían no cuentan como novedad.
- **Misiones en celular:** el aviso «Misión lista» ya no sale corrido a la izquierda y no se duplica con el toast.
- **Clóset:** más ancho, prendas y tarjetas grandes, interruptor «Grande / Compacta», barra lateral minimizada por defecto en PC, cajón de celular arrastrable (cerrado/mitad/alto), carga por tandas y sin blur.
- **Historias:** gestos del editor una vez por cuadro, botones con nombre, pistas contextuales, visor con menos re-dibujos.
- **Rendimiento general:** se quitó `backdrop-blur` de la cabecera móvil, el menú, las tarjetas de la tienda y varios botones.
- **Identidad «Doll»:** sello nuevo (muñeca de porcelana con hilos).
- **Editar perfil / Registro:** la vista previa ahora muestra identidad (con su detalle especial), quién la ve y la canción.

## 5) Cosas que debes saber
- `tools/gen_deco_pad.ts` (opcional) vuelve a medir cuánto sobresale cada marco y regenera `app/components/cosmetics/decoPad.ts`. Córrelo solo si agregas marcos nuevos (necesita `@resvg/resvg-js` instalado aparte).
- Verificado aquí: `tsc --noEmit` limpio, ESLint limpio en lo modificado y renders de los banners, corazones, barra de XP y sello Doll. **No** pude correr `next build` completo (sin internet para Google Fonts) ni probar contra tu Supabase real ni en un teléfono real: prueba en tu celular el clóset (arrastrar el cajón) y reclamar una misión.
