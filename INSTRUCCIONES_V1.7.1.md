# DaiwaPlace v1.7.1 — Apoyo con PayPal.Me (paso a paso)

Desde esta versión **el método de pago es PayPal.Me, con aprobación tuya en el Centro de Mando**. El código de suscripciones automáticas de la 1.7.0 sigue en el proyecto pero queda **apagado** (solo se enciende con la variable `PAYPAL_AUTO=1`).
Trae **1 SQL** y **ninguna variable nueva**.

---------------------------------------------------------------------
## A) Qué archivos reemplazar y dónde

Tienes dos formas. Usa la que prefieras:

**Forma 1 (la más fácil): el zip completo `DaiwaPlace_1_7_1.zip`.** Descomprímelo y reemplaza TODA tu carpeta `daiwa_place` (menos tu carpeta `node_modules`, tu `.env` si lo usas en local y tu llave de firma del APK, que no vienen en el zip). Luego `git add .` → `git commit -m "v1.7.1 paypalme"` → `git push`.

**Forma 2: solo los archivos que cambiaron, `DaiwaPlace_1_7_1_solo_cambios.zip`.** Descomprímelo **encima de tu carpeta `daiwa_place`** y acepta reemplazar. Mantiene las mismas rutas. Son estos 11 archivos:

| Archivo (dentro de `daiwa_place/`) | Qué es |
|---|---|
| `app/apoyar/page.tsx` | Página pública /apoyar (ahora con los pasos de PayPal.Me dentro de cada tarjeta) |
| `app/components/supporters/ManualSteps.tsx` | **NUEVO** · los 2 pasos: pagar + pegar el ID |
| `app/apoyar/mi-membresia/page.tsx` | Mi membresía (aviso de «renueva pronto» y de «pago en revisión») |
| `app/admin/SupportersTab.tsx` | Centro de Mando → Supporters (meses, monto esperado y «Por renovar») |
| `app/lib/supporters.ts` | Funciones del navegador (envía los meses) |
| `app/api/paypal/config/route.ts` | Apaga el modo automático por defecto |
| `app/lib/changelog.ts` | Novedades (v1.7.1) |
| `package.json` y `package-lock.json` | Número de versión |
| `public/sw.js` | Versión del service worker (para que los celulares actualicen) |
| `sql/v1.7.1_paypalme_manual.sql` | **NUEVO** · el SQL (no se sube a Vercel; se corre en Supabase) |
(`CONTEXTO_PARA_OTRO_CHAT.md` también cambió, es solo documentación.)

**El número que debes personalizar:** tu usuario de PayPal.Me (`juanfe280206`) está en **`app/lib/supporters.ts`**, línea `export const PAYPAL_ME_BASE = 'https://paypal.me/juanfe280206'`. Ya trae el tuyo; solo cámbialo ahí si algún día cambias de enlace. Tu Discord (`@juanfegg28`) está en la misma carpeta de utilidades: busca `DISCORD_CONTACT` en `app/lib/supporters.ts`.

## B) SQL en Supabase
SQL Editor → New query → pega TODO `sql/v1.7.1_paypalme_manual.sql` → Run. Requiere que ya hayas corrido `v1.7.0_circulo_lunar.sql`. (Si no lo habías corrido, córrelo primero y luego este.) Se puede correr varias veces.

## C) Qué hacer en Vercel
1. **Nada obligatorio con las variables.** Como el modo automático ahora está apagado, `PAYPAL_CLIENT_SECRET` y `PAYPAL_WEBHOOK_ID` se ignoran. Puedes dejarlas o borrarlas (Settings → Environment Variables). **No pongas `PAYPAL_AUTO`**: sin esa variable, todo queda en modo manual.
2. **Despliega:** `git push` (o Redeploy). Vercel construye solo. Mira que el despliegue salga en verde.
3. **Revisa el aviso de límites** (el correo de las 1.000.000 de peticiones CDN): entra a Vercel → Usage. Si la cuenta ya está pausada o a punto de pausarse, no vas a poder desplegar hasta que se resuelva (subir de plan o esperar el nuevo período). Si ya está resuelto, sigue.
4. **Apaga el webhook en PayPal** (developer.paypal.com → Apps & Credentials → Live → tu app → Webhooks → borra o desactiva el de `daiwaplace.vercel.app/api/paypal/webhook`). Ya no se usa y cada aviso que PayPal manda gasta una ejecución de Vercel y una escritura en Supabase.
5. Comprueba: abre `https://daiwaplace.vercel.app/api/paypal/config` → debe decir `"mode":"manual"`.

## D) Cómo funciona para tus usuarios
1. Entran a **Círculo Lunar** (menú lateral o Misiones) → tarjeta del nivel → **Apoyar con …**.
2. Eligen cuántos meses (1, 2, 3, 6 o 12). La página calcula el total y arma el botón **Pagar $X USD** que abre `paypal.me/juanfe280206/XUSD` con el monto ya puesto.
3. Pagan en PayPal. PayPal les muestra un **ID de transacción** (también está en su actividad).
4. Lo pegan en el Paso 2 (y, si quieren, el nombre o correo con el que pagaron) → **Enviar para revisión**.
5. En «Mi membresía» ven su solicitud como «En revisión» hasta que tú la apruebes.

## E) Cómo comprobar y aprobar los pagos (tu rutina)
Las solicitudes llegan a **Centro de Mando → Supporters → Solicitudes**. (El número de «Solicitudes manuales» arriba te dice cuántas esperan.) Para cada una:
1. Copia el **ID de transacción** que escribió la persona (se puede seleccionar y copiar).
2. Abre **PayPal → Actividad** (paypal.com/myaccount/transactions) y busca ese ID (o el monto y la fecha).
3. Comprueba las **cuatro cosas**:
   - El pago **existe** y es un pago **recibido** (no uno que tú enviaste).
   - Su estado es **Completado** (no «Pendiente»).
   - El monto es el **esperado** que muestra la tarjeta (nivel × meses, en USD).
   - El pago no está reembolsado ni en disputa.
4. Si todo cuadra: confirma los **meses** (ya viene lo que pidió la persona; cámbialo solo si pagó otra cantidad) → **Aprobar**. La membresía se activa, recibe su primer bono de Lunas y queda registrado quién aprobó.
5. Si algo no cuadra: escribe una **nota** corta («No encontramos ese pago, revisa el ID» / «Pagaste $2: vuelve a enviar eligiendo Luna Llena») → **Rechazar**. Un ID rechazado se puede volver a enviar.
Consejo: hazlo una vez al día o cuando te avise tu correo de PayPal de un pago nuevo.

## F) Cómo organizar a las personas
- **Quién es Supporter y hasta cuándo:** Supporters → **Suscriptores** (buscador por @usuario o nombre; muestra nivel, origen y fecha de fin).
- **Quién debe renovar:** Supporters → **Por renovar** (vencen en 10 días o vencieron hace 14). Escríbeles por Discord; cuando paguen les llega al flujo normal de arriba. Los meses nuevos **se suman** a los que les queden, así que no pierden nada por renovar antes.
- **Dar la membresía a mano** (regalos, Colombia, acuerdos por Discord): Suscriptores → **Ajuste manual** (@usuario, nivel, días y un motivo obligatorio).
- **Quitar una membresía** (reembolso, contracargo, mal uso): Ajuste manual → **Quitar membresía** con el motivo.
- **Registro:** Supporters → **Historial** → Pagos, Bonos semanales y Registro de cambios (quién hizo qué y por qué).
- **Colombia:** PayPal no permite pagos entre dos cuentas de residentes en Colombia. Esas personas te escriben por Discord y las activas con Ajuste manual.

## G) Pruebas rápidas antes de abrirlo
1. Con una cuenta de prueba: /apoyar → Apoyar con Luna Creciente → 1 mes → el botón debe abrir `paypal.me/juanfe280206/1USD`.
2. Envía una solicitud con un ID inventado de 8+ letras/números (ej. `PRUEBA12345`): debe decir «Tu solicitud quedó en revisión».
3. En tu cuenta admin: Centro de Mando → Supporters → Solicitudes: aparece con «esperado $1.00 USD · nueva». **Recházala** con la nota «prueba» (así no regalas nada).
4. (Opcional) Haz un pago real de $1 con otra persona y apruébalo de punta a punta: comprueba que aparece la lunita, el bono de Lunas y «Cubierta hasta» a 30 días.

## H) Si quieres volver a las suscripciones automáticas algún día
Cuando PayPal te habilite lo necesario: pon en Vercel `PAYPAL_AUTO=1` (además de `PAYPAL_CLIENT_SECRET` y `PAYPAL_WEBHOOK_ID`), vuelve a crear el webhook y haz Redeploy. Todo el código sigue ahí (INSTRUCCIONES_V1.7.0.md).

## I) Comisiones
PayPal cobra una comisión por cada pago recibido (porcentaje + tarifa fija). Pagar varios meses de una vez le conviene a quien apoya y a ti (la tarifa fija se cobra una vez). Revisa en tu actividad cuánto te llega neto.

## Verificado y NO verificado
Verificado aquí: `tsc` y ESLint limpios; el SQL se parseó entero; las rutas cargan.
NO verificado: el SQL en tu Supabase real ni un pago real de PayPal.Me. Haz la prueba G y, si algo falla, mándame el mensaje exacto.
