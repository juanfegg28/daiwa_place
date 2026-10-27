# DaiwaPlace v1.5.0 «Tienda de Halloween» — qué hacer

## 1) Orden (3 SQL en Supabase → SQL Editor, uno por uno, en este orden)
1. `sql/v1.5.0_tienda_descuentos.sql` — ofertas, selecciones del banner, lista de deseos, precios vigentes, compra/packs con oferta, funciones del panel y bucket de GIF (25 MB).
2. `sql/v1.5.0_catalogo_halloween.sql` — las 7 colecciones de Halloween (75 filas: 61 cosméticos + 7 insignias + 7 títulos exclusivos). Entran ocultas.
3. `sql/v1.5.0_lanzar_halloween.sql` — **enciende** Sangre Noir, Emo Abismo y las 7 de Halloween y crea la «Selección de Halloween» del banner.

Los tres son idempotentes (si los corres dos veces no pasa nada). **No corras** `v1.5.0_activar_sangre_noir_y_emo.sql` (quedó reemplazado por el paso 3).
Después sube el código (reemplaza todo el proyecto con este zip) y haz deploy. Orden recomendado: SQL 1 → SQL 2 → subir código → SQL 3 (así nadie ve la tienda nueva a medias).

## 2) Lo nuevo para la gente
- **Tienda estilo Discord** (`/tienda`): Destacado · Explorar ▾ (por categoría) · Descuentos · Colecciones · Mi inventario · Canjear código, buscador, ♥ lista de deseos y saldo.
- **Banner 1** (Destacado): las *Selecciones* (hoy «Selección de Halloween»). Rota solo cada 7 s; se detiene si lo señalas/tocas; se puede deslizar en el celular. Al tocar el botón entras a `/tienda/seleccion/halloween-2026` con todo lo nuevo (incluye Sangre Noir y Emo Abismo).
- **Banner 2**: las ofertas activas (nombre, cuenta atrás, «hasta −X %» y 3 cosméticos con su precio tachado). Cada una lleva a la pestaña **Descuentos**.
- **Colecciones**: cada colección muestra ahora sus decoraciones (sobre tu foto) y cuáles ya tienes; tocar una abre su detalle. Cada una tiene página propia (`/tienda/coleccion/<id>`).
- **Banner de perfil con GIF** (máx. 25 MB): se sube sin recortar para que siga animado. Si pesa más, avisa y no lo sube. Aplica al registro y a Editar perfil.
- **Comentarios**: arreglado el que se achicaba al responder en cadena. Ahora la sangría máxima son 2 niveles (antes 4) y más compacta en celular; desde ahí las respuestas se aplanan (siguen mostrando «En respuesta a @…»).

## 3) Para ti como admin (Centro de Mando → «Catálogo y ofertas»; permiso `manage_shop`, el admin supremo ya lo tiene)
- **Descuentos**: *Nueva oferta* → (1) nombre, frase, tipo (Oferta / Oferta del día / Destacado de la semana), colores del banner, empieza (ahora o programada) y **termina** (fecha y hora; atajos +24 h/+3 d/+7 d); (2) elige los cosméticos con buscador y filtros (uno a uno, «los que se ven», o una colección entera); (3) pon el precio: botones −10…−70 % para todos, o precio por cosmético. Vista previa del banner en vivo. Puedes **pausar, terminar ya, duplicar, editar o borrar**. Cuando llega la hora, el precio vuelve solo a la normalidad (sin tocar nada).
- **Selecciones (banner)**: crea/edita las diapositivas del banner principal (título, frase, botón, colores, colecciones que entran + cosméticos sueltos, fechas, orden). Si no hay ninguna, la tienda muestra un banner de bienvenida.
- **Catálogo y precios**: todos los cosméticos con filtros (tipo, colección, versión, estado), dueños, ♥ de deseos, edición de precio y selección múltiple → «Poner en oferta».
- El precio que se cobra lo decide **el servidor** (si la oferta termina mientras alguien mira, la compra se rechaza con el precio nuevo). Una oferta solo cuenta si baja el precio de lista; si dos ofertas coinciden, gana el precio más bajo. Packs: se cobra el mejor entre −20 % del pack y la suma de los precios con oferta.

## 4) Rendimiento (se conserva todo lo de la 1.4.5)
Miniaturas quietas y animadas solo con el cursor encima (en celular, en el detalle) · carga perezosa por IntersectionObserver · tope de 8 animaciones · movimiento reducido apagado. Nuevo: los datos de la tienda se cargan **una sola vez** (layout compartido, cambiar de pestaña es instantáneo), las rejillas muestran 24 y «Mostrar más», solo se monta la diapositiva visible del banner, el reloj del banner se detiene fuera de pantalla/pestaña oculta/movimiento reducido, y las cuentas atrás se refrescan cada 30 s.

## 5) Cosas que debes saber
- **Corregí un choque del kit nuevo**: «Marco barroco» (Barroco Monocromo) tenía el mismo slug que «Marco barroco» de Oro Barroco; la base no permite dos iguales. La nueva quedó como `marco-barroco-gris` («Marco barroco gris»). Es el único cambio al kit original.
- Los diseños de Halloween son originales (SVG/CSS/canvas); el banner de Halloween también es dibujo propio, sin material de terceros.
- Las cuentas con acceso total (renshsh, miyuakima, pingsheng, illuci) reciben solas los ítems nuevos.
- Para esconder la selección de Halloween cuando quieras: Catálogo y ofertas → Selecciones → Quitar (o ponle fecha de fin).
- Probé el SQL en un Postgres local con una réplica mínima de tu esquema (compra con/sin oferta, precio equivocado, packs, deseos, permisos, validaciones, idempotencia) y la interfaz con datos de muestra en `/dev/tienda`; no pude probar contra tu Supabase real.

## 6) Lo que NO entró en esta versión (y por qué)
- Decoración/efecto en notificaciones, mensajes, bandeja de historias, listas de likes/seguidores, Explorar y menciones: requiere recrear funciones SQL de mensajes/historias (`dm_inbox`, `stories_tray`…) cuyo tipo de retorno cambia; es delicado sin poder probarlo contra tu base, así que va como parche aparte (1.5.1).
- Looks guardados, códigos que regalan cosméticos, fondo con imagen propia + moderación, galería `/admin/cosmeticos`, cobro por reemplazar misión.
- El tope de 8 animaciones simultáneas **ya estaba hecho en la 1.4.5**.
