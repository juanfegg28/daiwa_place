# DaiwaPlace v1.4.5 «Mi clóset y arreglos»

## Cómo subirla
1. **Supabase → SQL Editor**: pega y ejecuta `sql/v1.4.5_acceso_total_equipo.sql` (da acceso total gratis, actual y futuro, a @miyuakima, @pingsheng y @illuci, igual que a renshsh). Si algún usuario no existía, avisa con un NOTICE: córrelo de nuevo cuando exista. Al final lista a los 4 usuarios con su cantidad de cosméticos.
2. Reemplaza el código con este zip y súbelo a Vercel. No hay más SQL.

## Lista de parches
1. **Chat en celular**: al abrir el teclado la pestaña ya no se va hacia arriba ni se queda desplazada al cerrarlo (el chat mide lo que deja libre el teclado; la página no se mueve). El cuadro de texto pasó a 16 px en celular (en iPhone hacía zoom).
2. **Alas que no se veían** (cuervo, plumas, estrellas, fénix): necesitan un avatar de ≥ 80 px y la tienda dibujaba uno de 64 px. Ahora el avatar se dibuja a su tamaño natural y todo se escala para caber (se ven completas).
3. **Entradas y fondos en blanco** al elegirlos: su contenedor medía 0 de ancho. Corregido (también afectaba a otros apartados).
4. **Lag en el selector**: cada prenda se reconstruía entera en cada toque (componente definido dentro de otro). Ahora es estable.
5. **Personalizar se salía por la derecha en celular**: corregido.
6. **Decoraciones desaparecían al escalar una vista previa** (se medía con getBoundingClientRect, que cuenta el scale): ahora offsetWidth.
7. **Hook condicional** en el efecto de nombre (podía romper el orden de hooks): corregido.
8. «?probar=» del botón «Probar en mi perfil» se aplicaba con setState durante el render de forma frágil: limpiado.

## Rendimiento
- Tienda, inventario y clóset: miniaturas **quietas**; se animan con el cursor encima (PC). En celular: en la tienda el toque abre el detalle (se anima); en el inventario el toque en la vista previa (▶); en el clóset se anima la prenda elegida.
- Miniaturas **perezosas**: solo se dibujan al acercarse a la pantalla.
- **Tope de 8 animaciones** simultáneas (perfil abierto primero).
- Perfil: el fondo y la tarjeta animados se **pausan mientras deslizas**.
- Efectos de entrada en miniatura: un fotograma quieto (no un bucle por cada tarjeta).

## Mi clóset (rediseño de /personalizar)
Cajones con íconos (Color, Nombre, Avatar, Tarjeta, Entrada, Fondo, Título) con puntito si llevas algo / estás probando; «Llevas puesto» + Quitar; paleta del ítem; «Lo mío / Para probar» con filtro por colección; marca «Puesto». PC: dos columnas. Celular: cajón fijo abajo (se abre/cierra) con Guardar siempre visible.
Prueba sin login: `/dev/closet` (en desarrollo o con `NEXT_PUBLIC_DEV_COSMETICOS=1`).

## Probado / no probado
Probado: `tsc` y `eslint` limpios; `/dev/closet` en Chromium a 390 px y 1280 px sin desbordes ni errores, alas visibles, entradas con vista. **No probado**: contra tu Supabase real, el chat con teclado real de un teléfono (la lógica usa visualViewport; pruébalo en tu celular) ni el `next build` completo (el sandbox no tiene internet para las fuentes de Google).
