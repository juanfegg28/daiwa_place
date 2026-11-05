# DaiwaPlace v1.7.2 — Ko-fi + PayPal.Me (paso a paso)

Desde esta versión hay **dos métodos principales de apoyo: PayPal.Me y Ko-fi** (https://ko-fi.com/daiwaplace, con propinas). Los dos son **manuales**: la persona avisa en la página y **tú compruebas el pago y lo apruebas en el Centro de Mando**. Las personas de **Colombia** siguen yendo por Discord en los dos casos.
Trae **1 SQL** y **ninguna variable nueva**. No hay webhook de Ko-fi (no gasta ejecuciones extra de Vercel).

---------------------------------------------------------------------
## A) Qué archivos reemplazar y dónde

Dos formas. Usa la que prefieras:

**Forma 1 (la más fácil): el zip completo `DaiwaPlace_1_7_2.zip`.** Descomprímelo y reemplaza TODA tu carpeta `daiwa_place` (menos tu carpeta `node_modules`, tu `.env` si lo usas en local y tu llave de firma del APK, que no vienen en el zip). Luego `git add .` → `git commit -m "v1.7.2 kofi"` → `git push`.

**Forma 2: solo los archivos que cambiaron, `DaiwaPlace_1_7_2_solo_cambios.zip`.** Descomprímelo **encima de tu carpeta `daiwa_place`** y acepta reemplazar. Mantiene las mismas rutas. Son estos:

| Archivo (dentro de `daiwa_place/`) | Qué es |
|---|---|
| `app/components/supporters/ManualSteps.tsx` | Tarjeta de pago: ahora con selector **PayPal.Me / Ko-fi** y los pasos de Ko-fi |
| `app/lib/kofiCode.ts` | **NUEVO** · genera el código de verificación de Ko-fi (`DW-XXXX-YYYYY`) |
| `app/lib/supporters.ts` | Enlace de Ko-fi y envío del método al servidor |
| `app/apoyar/page.tsx` | Página pública /apoyar (textos, preguntas frecuentes y «Cómo funciona» con Ko-fi) |
| `app/apoyar/mi-membresia/page.tsx` | Mi membresía: muestra con qué método pagó cada vez |
| `app/components/supporters/ColombiaNotice.tsx` | Aviso de Colombia (ahora menciona los dos métodos) |
| `app/admin/SupportersTab.tsx` | Centro de Mando → Supporters: etiqueta y filtro por método, instrucciones de comprobación |
| `app/lib/changelog.ts` | Novedades (v1.7.2) |
| `package.json` y `package-lock.json` | Número de versión |
| `public/sw.js` | Versión del service worker (para que los celulares actualicen) |
| `sql/v1.7.2_kofi.sql` | **NUEVO** · el SQL (no se sube a Vercel; se corre en Supabase) |
(`CONTEXTO_PARA_OTRO_CHAT.md` e `INSTRUCCIONES_V1.7.2.md` son solo documentación.)

**Los enlaces que debes personalizar** están en **`app/lib/supporters.ts`**: `PAYPAL_ME_BASE` (tu PayPal.Me), `KOFI_URL = 'https://ko-fi.com/daiwaplace'` (tu Ko-fi) y `DISCORD_CONTACT` (tu Discord). Ya traen los tuyos.

## B) SQL en Supabase
SQL Editor → New query → pega TODO `sql/v1.7.2_kofi.sql` → Run. Requiere que ya hayas corrido `v1.7.0_circulo_lunar.sql` y `v1.7.1_paypalme_manual.sql`. **Se puede correr varias veces.** No toca membresías ni solicitudes existentes: las que ya hay quedan marcadas como PayPal.Me.

**Corre el SQL ANTES o justo después de desplegar.** Si alguien abre /apoyar con la versión nueva y el SQL aún no está, el envío falla con «Falta correr el SQL más reciente (v1.7.2) en Supabase». No se pierde nada, pero es mejor evitarlo.

## C) Qué hacer en Vercel
1. **Nada con las variables.** No hay ninguna nueva. Sigue sin ponerse `PAYPAL_AUTO`.
2. **Despliega:** `git push` (o Redeploy) y mira que salga en verde. Si el despliegue falla, mándame el mensaje exacto.
3. Comprueba que `https://daiwaplace.vercel.app/api/paypal/config` siga diciendo `"mode":"manual"` (no cambió).

## D) Revisa tu Ko-fi (2 minutos)
Estas cosas dependen de tu cuenta de Ko-fi y no pude verlas desde aquí, así que compruébalas tú una vez:
1. **Que se pueda dejar un mensaje con la propina.** Es donde la persona pega su código; sin eso no tienes cómo encontrar el pago.
2. **Moneda en USD.** Los montos de las tarjetas están en dólares (Creciente $1 · Llena $2 · Eclipse $5 por mes).
3. **Monto mínimo y montos libres.** La persona debe poder escribir el monto exacto (por ejemplo $6 por 3 meses de Llena). Haz una propina de prueba tú mismo para ver cómo se ve y que acepte $1.
4. **Avisos por correo.** Deja activadas las notificaciones de Ko-fi: te llega un correo por cada propina y es la forma más cómoda de enterarte de que hay algo por aprobar.
5. **Comisiones.** Según la ayuda de Ko-fi, en el plan gratuito Ko-fi no cobra comisión propia por propinas únicas (revisa la de tu plan), pero PayPal o Stripe sí cobran la suya (típicamente alrededor de 3 % + $0.30 por pago). Con $1 esa tarifa fija pesa mucho; por eso conviene animar a pagar varios meses juntos.

## E) Cómo funciona para tus usuarios
1. Entran a **Círculo Lunar** → tarjeta del nivel → **Apoyar con …**.
2. Eligen el método (**PayPal.Me** o **Ko-fi**) y cuántos meses (1, 2, 3, 6 o 12). La página calcula el total.
3. **Con PayPal.Me**: pagan y pegan el ID de transacción (igual que en la v1.7.1).
4. **Con Ko-fi**:
   1. La tarjeta les muestra **su código** (por ejemplo `DW-3FA9-K7M2Q`) y un botón para copiarlo.
   2. Dan la propina en Ko-fi por el monto exacto y **pegan el código en el mensaje** (puede ser privado).
   3. Vuelven y pulsan **«Ya di la propina · enviar para revisión»** (opcional: el nombre o correo que usaron en Ko-fi).
5. En «Mi membresía» ven su solicitud «En revisión» hasta que tú la apruebes.

**Detalles del código de Ko-fi:** se recuerda en el dispositivo hasta que la solicitud se envíe (si alguien paga y cierra la página, al volver ve el mismo código). Sus 4 primeros caracteres salen del id de la persona y **la base de datos los comprueba**: nadie puede reclamar el código que otra persona escribió en su propina, aunque lo vea en tu muro público de Ko-fi. Si un código ya se usó, la página genera otro sola.

## F) Cómo comprobar y aprobar los pagos (tu rutina)
Las solicitudes llegan a **Centro de Mando → Supporters → Solicitudes**. Arriba, «Solicitudes manuales» te dice cuántas esperan (con el desglose PayPal.Me / Ko-fi) y hay filtros **Todos · PayPal.Me · Ko-fi**. Cada solicitud tiene su etiqueta de método.

**Si es PayPal.Me** (igual que antes): copia el ID de transacción → PayPal → Actividad → comprueba que el pago existe, es **recibido**, está **Completado**, es por el **monto esperado** y no está reembolsado ni en disputa.

**Si es Ko-fi:**
1. Copia el **código** de la solicitud (se puede seleccionar y copiar).
2. Abre tu **Ko-fi** (tu actividad de propinas, o el correo de aviso de esa propina) y busca la propina cuyo **mensaje contenga ese código**. Si el mensaje era privado, solo tú lo ves, y está bien.
3. Comprueba: la propina **existe**, el **monto** es el esperado que muestra la tarjeta (nivel × meses, en USD) y no está reembolsada ni en disputa.
4. Si todo cuadra: confirma los **meses** (ya viene lo que pidió la persona; cámbialo solo si pagó otra cantidad) → **Aprobar**. La membresía se activa, recibe su primer bono de Lunas y queda registrado quién aprobó y con qué método.
5. Si algo no cuadra: escribe una **nota** corta («No encontramos una propina con tu código» / «Diste $2: elige Luna Llena de 1 mes») → **Rechazar**.
6. **Si la persona pagó pero olvidó el código en el mensaje:** usa el nombre o correo que dejó en la nota para buscar la propina por monto y hora. Si cuadra, apruébala; si tienes dudas, escríbele por Discord.

Los meses nuevos **se suman** a los que le queden a la persona, sea cual sea el método. Hazlo una vez al día o cuando te llegue el correo de aviso.

## G) Cómo organizar a las personas
Igual que en la v1.7.1: **Suscriptores** (buscador), **Por renovar** (vencen en 10 días o vencieron hace 14), **Ajuste manual** (regalos, Colombia, acuerdos por Discord; con motivo obligatorio), **Quitar membresía**, y **Historial** (Pagos, Bonos semanales, Registro de cambios). Novedad: en **Historial → Pagos** y en el registro de cambios ahora aparece el método (`paypalme` o `kofi`).
**Colombia:** no ven los botones de pago (ni PayPal.Me ni Ko-fi); les sale el aviso para escribirte por Discord y los activas con Ajuste manual. Se detecta por la zona horaria del dispositivo; quien no es de Colombia puede pulsar «Mostrar los métodos de pago».

## H) Pruebas rápidas antes de abrirlo
1. Con una cuenta de prueba: /apoyar → **Apoyar con Luna Creciente** → **Ko-fi** → 1 mes. Debes ver un código `DW-XXXX-YYYYY`, el botón rojo «Dar propina en Ko-fi» (abre `ko-fi.com/daiwaplace`) y el aviso de pegar el código en el mensaje.
2. **Sin pagar nada**, pulsa «Ya di la propina · enviar para revisión»: debe decir «Tu solicitud quedó en revisión».
3. En tu cuenta admin: Centro de Mando → Supporters → Solicitudes: aparece con la etiqueta **Ko-fi**, «esperado $1.00 USD · nueva» y el código. **Recházala** con la nota «prueba» (así no regalas nada).
4. Comprueba que el filtro **Ko-fi** muestra solo esa y que **PayPal.Me** sigue funcionando como antes.
5. (Opcional) Haz una propina real de $1 desde otra cuenta con el código en el mensaje y apruébala de punta a punta: debe aparecer la lunita, el bono de Lunas y «Cubierta hasta» a 30 días; en «Mi membresía» el pago sale como «Ko-fi (manual)».

## I) Opcional a futuro: comprobación automática con el webhook de Ko-fi
Ko-fi puede avisar a una dirección de tu app cada vez que llega una propina (con el monto y el mensaje). Eso permitiría marcar solo «✔ propina encontrada con este código» en cada solicitud y que tú aprobaras con un clic, sin abrir Ko-fi. **No lo incluí** para mantener esta versión simple y sin variables nuevas (necesitaría una ruta nueva, un token de verificación y una tabla). Si quieres, es el siguiente paso natural.

## Verificado y NO verificado
**Verificado aquí:**
- El SQL se corrió de verdad en un Postgres 16 local, encadenando tu v1.7.0 → v1.7.1 → v1.7.2 sobre datos que ya existían antes: **40 comprobaciones, todas bien** (código ajeno rechazado, tope de solicitudes, duplicados, aprobar/rechazar con método, suma de meses, bono semanal, permisos de anon/authenticated, que una llamada «vieja» sin método siga funcionando y que lo anterior quede como PayPal.Me). Correrlo dos veces seguidas no da error.
- El generador de códigos del navegador se cruzó con la validación del SQL: 3.000 códigos, 3.000 aceptados; con el id de otra persona, 0.
- Los archivos que toqué pasan la revisión de tipos de TypeScript.
- Las pantallas se probaron en un navegador real (Chromium): la tarjeta de pago (22 comprobaciones: enlaces y montos, código, portapapeles, argumentos exactos enviados a Supabase, recuperación de errores) y el Centro de Mando (12: resumen, filtros, aprobar con meses ajustados, rechazar).

**NO verificado:**
- **ESLint, `npm run build` y la revisión de tipos con las dependencias reales:** desde mi entorno no se podían instalar los paquetes de npm (el registro no respondió), así que la revisión de tipos se hizo con versiones simplificadas de React y Next. Vercel hará el build real al desplegar; si algo falla, mándame el mensaje exacto. Si puedes, corre `npm run lint` y `npm run build` en tu PC antes de subir.
- **El SQL en tu Supabase real.** Mis pruebas usaron tablas de mentira para las partes de DaiwaPlace que no tengo (perfiles, billetera de Lunas, permisos de staff). Una cosa a saber: el SQL vuelve a definir `supporter_me()` copiando la versión de la v1.7.0 y añadiéndole solo el método; si algún día la cambiaste a mano en Supabase, tu cambio se pierde.
- **Cómo se ve con los estilos reales** (Tailwind no estaba cargado en mi prueba): colores, tamaños y el aspecto en celular.
- **Una propina real de Ko-fi** y los detalles de tu cuenta: menús exactos del panel de Ko-fi, monto mínimo, y que el mensaje de la propina esté disponible. Por eso la sección D y la prueba H.5.

Fuentes consultadas sobre Ko-fi: [¿Ko-fi cobra comisión?](https://help.ko-fi.com/hc/en-us/articles/360002506494-Does-Ko-fi-Take-a-Fee) · [Qué información comparte quien apoya (nombre, correo, mensaje público o privado)](https://help.ko-fi.com/hc/en-us/articles/360009392953-What-information-do-supporters-share-Public-private-options)
