# DaiwaPlace v1.6.3 «Súper ahorro» — para que quepa en el Nano de Supabase

Qué hace: baja muchísimo lo que la página le pide a Supabase (CPU y lectura de disco), sin quitar ninguna función. Los mensajes siguen llegando al instante.
Trae 1 SQL obligatorio (+1 de diagnóstico opcional). **No hay variables nuevas en Vercel.**

---------------------------------------------------------------------
## PASO 1 · Subir el código
`git add .` → `git commit -m "v1.6.3 super ahorro"` → `git push`. Espera a que Vercel termine.

## PASO 2 · Correr el SQL
Supabase → **SQL Editor** → New query → pega TODO `sql/v1.6.3_ahorro_nano.sql` → **Run**. Se puede correr más de una vez.
Abajo sale una lista con cada índice: «CREADO», «ya tiene un índice que sirve» o «se omite» (si una tabla no existe). Todo eso es normal.
Si te dice que `pg_cron` no está activo, no pasa nada: la limpieza diaria solo no se programa sola (puedes activar pg_cron en Database → Extensions y volver a correr el SQL).

## PASO 3 · Comprobar
1. Abre la app en 2 cuentas y mándate un mensaje: debe llegar al instante (punto/contador en Mensajes) y el chat abierto debe mostrarlo sin recargar.
2. «Ver más» en el Inicio: trae las siguientes publicaciones.
3. Tienda: abre y compra algo → el inventario se actualiza al instante (la caché se borra sola al comprar).
4. Opcional: corre los bloques de `sql/v1.6.3_diagnostico_nano.sql` (uno por uno) para ver qué consultas gastan más.

---------------------------------------------------------------------
## Qué cambió (resumen)
**Página (código)**
- Nuevo `app/lib/eco.ts`: ahí están TODOS los tiempos. Los pedidos periódicos solo corren si la pestaña se ve y la persona está activa (si lleva 2 min sin tocar nada, se pausan) y se reanudan al volver. Para ahorrar más o menos, cambia solo los números de `ECO`.
- **Realtime filtrado**: antes cada persona escuchaba TODOS los mensajes, reacciones, notas y likes de notas de TODA la app (cada evento se revisaba contra cada usuario conectado). Ahora solo escucha SUS conversaciones y, dentro de un chat, solo las reacciones de ese chat.
- Pollings: contador de avisos 60 s → 5 min; mensajes 45 s → 3 min (y solo recarga la bandeja si cambió algo); «hay publicaciones nuevas» 45 s → 3 min y con una mirada barata antes de la función pesada; chat abierto 15 s → solo si Realtime se cae (60 s); historias 60 s → 3 min; saldo 60 s → 5 min; misiones 90 s → 5 min; confesión abierta 30 s → 90 s; brillitos de novedad 2/5 min → 10/15 min.
- Al volver a la pestaña ya no salen 10 pedidos juntos: una actualización por sección, con un pequeño desfase.
- «Ver más» y «Publicar» ya no vuelven a pedir TODO el feed: solo traen las publicaciones que faltan. Páginas del Inicio de 12 (antes 15).
- Las notas de Mensajes ya no se recargan con cada mensaje; el perfil de la sesión se pide en 1 consulta (antes 3) y sin ir al servidor de Auth; renovar el token no recarga todo.
- Tienda: caché de 3 min del catálogo, colecciones, ofertas e inventario (se borra al comprar, reclamar, guardar el look, tocar el corazón o cambiar de cuenta).
- El aviso de «misión completada» lee el saldo como mucho cada 6 s (antes 2,5 s).

**Base de datos (v1.6.3_ahorro_nano.sql)**
- Índices que faltaban (feed, likes, comentarios, seguidores, bloqueos…), sin duplicar los que ya existan.
- `dm_unread_summary()` liviana (antes armaba la bandeja completa DOS veces cada vez).
- El push a Vercel solo se dispara si la persona tiene un celular registrado (antes, en cada mensaje y notificación).
- Realtime deja de vigilar `notes` y `note_likes`.
- Limpieza diaria opcional: avisos ya leídos de más de 90 días (los no leídos no se tocan), eventos viejos de misiones y intentos viejos de recuperar cuenta / canjear código.

## Si quieres ahorrar todavía más (según lo que muestre el diagnóstico)
- Subir los números de `ECO` (por ejemplo `dmRecountMs`, `feedCheckMs`).
- `wallet_summary()` recorre todas tus misiones cada vez; si aparece arriba en el diagnóstico, se puede guardar el resultado en una tabla y recalcular solo al haber eventos.
- Quitar los índices que salgan «nunca usados» en el bloque E del diagnóstico.
- Si aun así el Disk IO se agota, el plan **Micro** (que Supabase te ofrece gratis en el cuadro de «Project low on resources» de tu Pro) duplica la memoria sin costo: con más RAM se lee menos del disco. Con este paquete + Micro vas muy holgado.
