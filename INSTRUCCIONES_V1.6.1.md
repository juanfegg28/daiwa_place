# DaiwaPlace v1.6.1 «Notificaciones en el celular» — paso a paso (en criollo)

Qué hace: cuando alguien te escribe o interactúa contigo, te llega un aviso al celular aunque la app esté cerrada, como WhatsApp. Respeta lo que cada persona apagó en Configuración → Notificaciones.

Trae SQL (2 archivos) y 4 variables nuevas en Vercel. Hazlo en este orden.

---------------------------------------------------------------------
## PASO 1 · Crear las claves (en tu PC, 3 minutos)
Las notificaciones necesitan un «par de llaves» (VAPID) y una clave secreta que inventamos. Se hacen con dos comandos.

1. Descomprime este zip y abre una terminal DENTRO de la carpeta `daiwa_place`.
2. Corre `npm install` (instala la librería nueva; tarda un minuto).
3. Corre:  `npx web-push generate-vapid-keys`
   Te muestra **Public Key** y **Private Key**. Cópialas en un bloc de notas.
4. Corre:  `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`
   Te muestra una clave larga: es tu **clave secreta**. Cópiala también.

⚠️ La Private Key y la clave secreta son como contraseñas: no las pegues en el chat, en Discord ni en GitHub.

## PASO 2 · Ponerlas en Vercel
Vercel → tu proyecto → **Settings → Environment Variables**. Crea estas 4 (marca Production; puedes marcar las tres):

| Nombre | Valor |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | la **Public Key** |
| `VAPID_PRIVATE_KEY` | la **Private Key** |
| `VAPID_SUBJECT` | `mailto:tucorreo@ejemplo.com` (un correo tuyo; o `https://daiwaplace.vercel.app`) |
| `PUSH_WEBHOOK_SECRET` | la **clave secreta** del paso 1.4 |

(La `SUPABASE_SERVICE_ROLE_KEY` ya la tienes, no hay que tocarla.)

## PASO 3 · Subir el código
`git add .` → `git commit -m "v1.6.1 notificaciones"` → `git push`. Espera a que Vercel termine. (Las variables nuevas solo se leen en un despliegue NUEVO: si las pusiste después, haz «Redeploy».)

## PASO 4 · SQL 1 (la tabla y los disparadores)
Supabase → **SQL Editor** → New query → pega TODO `sql/v1.6.1_notificaciones_push.sql` → **Run**. No hay que cambiar nada. Se puede correr más de una vez.
(Si te avisa que no pudo activar `pg_net`: Database → Extensions → activa **pg_net** y vuelve a correrlo. Si ya hiciste el cron de las fotos, ya lo tienes.)

## PASO 5 · SQL 2 (conectar la base con tu página)
1. Abre `sql/v1.6.1_conectar_push.sql`.
2. Cambia **TU-CLAVE** por la MISMA clave secreta del paso 1.4 (la de `PUSH_WEBHOOK_SECRET`). Revisa que la dirección sea la de tu página, sin «/» al final.
3. Pégalo en SQL Editor y **Run**. Abajo te muestra lo guardado (la clave sale tapada).

## PASO 6 · Probar
1. En el celular (app instalada o Chrome): **Configuración → Notificaciones → «Activar notificaciones»** y acepta el permiso.
2. Toca **«Enviar notificación de prueba»**: tiene que llegarte «¡Funciona! 🌙».
3. Prueba de verdad con 2 cuentas: desde la otra cuenta mándale un mensaje a la tuya (con tu app cerrada o en otra pantalla). Debe llegar con el nombre y el texto, y al tocarla abre ese chat.
4. También: que te den like, comenten, te sigan.

## Si algo no llega
Corre esto en el SQL Editor justo después de mandar el mensaje de prueba:
`select id, status_code, left(content::text, 120) as respuesta, created from net._http_response order by created desc limit 5;`

| Sale | Significa |
|---|---|
| 200 | La base sí avisó a la página. Si igual no llega, revisa el permiso del celular y que no esté en «No molestar». |
| 401 | La clave de Supabase (SQL 2) y la de Vercel (`PUSH_WEBHOOK_SECRET`) NO son iguales. Corrige y vuelve a correr el SQL 2. |
| 500 | Faltan las claves VAPID en Vercel, o no hiciste un despliegue nuevo después de ponerlas. |
| 404 | La dirección del SQL 2 está mal escrita. |
| no sale nada | No corriste el SQL 2, o `pg_net` no está activado. |

- «Enviar prueba» dice **«Este dispositivo todavía no está registrado»**: toca «Activar» primero.
- **iPhone**: solo funciona con iOS 16.4 o más nuevo y con DaiwaPlace instalada en la pantalla de inicio (abre la app desde ahí, no desde Safari).
- **APK de Android**: el permiso lo pide el navegador de Android por detrás. Si en el APK no aparece nunca el cuadro de permiso, avísame (puede hacer falta volver a generar el APK activando «Enable notifications» en PWABuilder).
- Para apagar todo de golpe: en Configuración → Notificaciones, «Desactivar en este dispositivo».

## Problemas reales que ya aparecieron (y cómo se arreglaron)
Estos 3 te pueden pasar de nuevo si algún día cambias una clave o reinstalas algo.

1. **«No se pudo enviar la prueba. Vuelve a intentarlo»** → en Vercel → Logs salía `Vapid subject is not a valid URL`.
   La variable `VAPID_SUBJECT` estaba con el correo solo. Tiene que llevar `mailto:` delante (`mailto:tucorreo@gmail.com`) o ser la dirección de la página (`https://daiwaplace.vercel.app`). Se corrige la variable y se hace un despliegue nuevo.
   Parecido: comillas o espacios pegados en `VAPID_PRIVATE_KEY` o en `NEXT_PUBLIC_VAPID_PUBLIC_KEY` hacen el mismo error.
2. **La prueba llegaba pero los mensajes de otra persona NO** → en Supabase, `net._http_response` mostraba **401 «No autorizado»**.
   La clave que guardó el SQL 2 (`push_config`) y la `PUSH_WEBHOOK_SECRET` de Vercel no eran idénticas. Como las Secret de Vercel no se pueden leer, la solución es inventar una clave NUEVA y ponerla en los dos lados: `PUSH_WEBHOOK_SECRET` en Vercel y el SQL 2 en Supabase, y hacer un despliegue nuevo. Después, a probar con `select public.push_ping('message', (select id from public.messages order by created_at desc limit 1));` y mirar que salga **200**.
3. **Llega en Brave pero no en el APK (o al revés)** → cada uno cuenta como un dispositivo distinto: hay que tocar «Activar notificaciones» dentro de cada uno.

Regla de oro: las claves (Private Key, `PUSH_WEBHOOK_SECRET`) no se pegan en chats, Discord ni GitHub. Si una se filtra, se cambia por otra nueva en Vercel y en el SQL 2.

## Cómo desplegar rápido (después de cambiar variables)
Guarda la variable en Vercel y luego, en la terminal dentro de la carpeta del proyecto:
`git commit --allow-empty -m "redeploy"`  →  `git push`
(Las variables solo se toman en un despliegue NUEVO.)

## Guarda estas cosas (copia de seguridad)
- Tu **clave secreta** y tu **Private Key** (bloc de notas / gestor de contraseñas).
- `signing.keystore` y `signing-key-info.txt` del APK (ver `INSTRUCCIONES_V1.6.0.md`).

---------------------------------------------------------------------
## Cómo se comporta (lo que pediste: «como WhatsApp»)
- **Mensajes**: título = el nombre de quien te escribió; texto = el mensaje (o «📷 Foto»). Varios mensajes del mismo chat se juntan en una sola notificación que vuelve a sonar. Las solicitudes de mensaje dicen «Quiere enviarte un mensaje» (sin el texto).
- **Avisos**: comentarios, respuestas, likes, seguidores, etiquetas, compartidos, historias, clubes. Solo los que la persona NO apagó en Configuración.
- **Muro de los Susurros**: siempre «Alguien…», nunca el nombre.
- Si estás mirando la app en ese momento, no aparece (ya lo ves en pantalla).
- Si dos personas están bloqueadas, no se avisan entre sí.
- Si alguien apaga «Mensajes directos» o «Mostrar el texto del mensaje» en su Configuración, se respeta.

## Qué trae esta versión (archivos)
- `app/api/push/send` (la llama la base de datos), `app/api/push/subscribe`, `app/api/push/test`, `app/lib/pushServer.ts`, `app/lib/push.ts`.
- `public/sw.js` (ahora también muestra las notificaciones y las abre al tocarlas), `public/icons/badge-96.png` (la lunita de la barra de estado de Android).
- Configuración → Notificaciones: nueva sección arriba (`PushSection`); invitación en el Inicio (`PushPrompt`).
- `sql/v1.6.1_notificaciones_push.sql` y `sql/v1.6.1_conectar_push.sql`. `package.json` y `package-lock.json` suman la librería `web-push`.

## Verificado y no verificado
(Actualizado: en tu instalación real ya se confirmó que la prueba y los mensajes de otra cuenta llegan al celular.)
Verificado aquí: `tsc` y ESLint limpios; el cifrado del aviso (VAPID) funciona; los textos de los 17 tipos de aviso; la ruta de envío rechaza claves malas (401), sin claves VAPID (500) y pedidos inválidos (400).
NO verificado (no se puede desde aquí): que tu Supabase llame a tu página (SQL contra tu base real), que Google/Apple entreguen el aviso a TU celular y cómo se ve en el APK y en iPhone. Eso lo confirmas con el Paso 6.
