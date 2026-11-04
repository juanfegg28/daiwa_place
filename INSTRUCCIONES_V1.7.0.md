# DaiwaPlace v1.7.0 «Círculo Lunar» (Supporters con PayPal) — paso a paso

Trae **1 SQL de instalación** (+ 1 SQL de pruebas opcional) y **3 variables nuevas en Vercel**. Hazlo en este orden.
Sin esas variables, la página funciona igual pero en **modo manual** (solo PayPal.Me con aprobación tuya); no se rompe nada.

---------------------------------------------------------------------
## 0) Diagnóstico: qué se reutilizó (y qué NO se tocó)
| Necesidad | Se reutilizó |
|---|---|
| Bono semanal de Lunas | `coins_apply` + `coin_ledger` (v1.3.0), con clave única por persona y semana. No hay otra billetera. |
| Límite de historias | `story_limit_per_day()` (v1.2.0): `story_quota` y `story_create` ya la leen, así que el servidor lo valida siempre (el contador de React solo muestra). |
| Descuentos | `shop_catalog`, `shop_buy`, `shop_pack_quote` (v1.5.0) con el mismo patrón de ofertas: se cobra el precio MÁS BAJO, no se suman. |
| Cosméticos exclusivos | `cosmetic_items` + `cos_grant`. Solo se dejó la estructura (`obtainable = 'supporter'`, tabla `supporter_perks`). |
| Insignia | Componente nuevo `SupporterBadge`, **independiente de `user_roles`** y de los roles de Daiwa Academy. |
| Admin | `eco_is_staff()` / `whisper_has_perm()` con permiso nuevo `manage_supporters` (el Admin Supremo lo tiene siempre). |
| Servidor | Mismo patrón de `app/api/*` con `SUPABASE_SERVICE_ROLE_KEY` (que ya tienes) y verificación real de sesión. |
No se modificó nada más. Los scripts SQL anteriores NO se editaron: la v1.7.0 reemplaza solo `story_limit_per_day`, `shop_catalog`, `shop_buy` y `shop_pack_quote` con `create or replace`.

---------------------------------------------------------------------
## 1) SQL (Supabase)
SQL Editor → New query → pega TODO `sql/v1.7.0_circulo_lunar.sql` → Run. Se puede correr varias veces.
Opcional pero recomendado: corre después `sql/v1.7.0_pruebas_supporters.sql`. **Termina con un «error» a propósito** (es lo normal): el mensaje trae el resultado línea por línea («OK» / «FALLÓ») y deshace todo lo que probó, así que no deja nada en tu base. Si alguna línea dice «FALLÓ», mándamela.

## 2) Tu cuenta de PayPal y la app de desarrollador
Necesitas una cuenta **PayPal Business verificada** (PayPal exige que el titular sea mayor de edad). Las suscripciones automáticas pueden no estar habilitadas en todas las cuentas/países; si PayPal no te las deja usar, el sistema queda en modo manual sin romperse.

1. En https://developer.paypal.com/dashboard/ → **Apps & Credentials** → elige **Live** (o **Sandbox** para probar) → tu app → copia **Client ID** y **Secret**.
2. **Los 3 planes ya los creaste.** Se ven así en tu panel (los nombres coinciden con los niveles; el SISTEMA deduce el nivel por el PRECIO que tiene cada plan en PayPal, no por el orden):
   - `P-5S82278884936931KNLVJFOI` → Luna Creciente → debe ser **$1.00 USD, cada 1 mes**
   - `P-12M44345KA179801XNLVJBMA` → Luna Llena → debe ser **$2.00 USD, cada 1 mes**
   - `P-2WE95953LC4454440NLVJGBQ` → Eclipse → debe ser **$5.00 USD, cada 1 mes**
   La página solo muestra el botón de un nivel si el plan está ACTIVO, en USD, mensual y con ESE precio exacto. Si algún precio no coincide, ese botón no sale (así nadie paga un monto distinto al anunciado).
3. **Webhook**: en la misma app → **Webhooks → Add Webhook**:
   - URL: `https://daiwaplace.vercel.app/api/paypal/webhook`
   - Eventos: `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.RE-ACTIVATED`, `BILLING.SUBSCRIPTION.CANCELLED`, `BILLING.SUBSCRIPTION.SUSPENDED`, `BILLING.SUBSCRIPTION.EXPIRED`, `BILLING.SUBSCRIPTION.PAYMENT.FAILED`, `PAYMENT.SALE.COMPLETED`, `PAYMENT.SALE.REFUNDED`, `PAYMENT.SALE.REVERSED`.
   - Copia el **Webhook ID** que te muestra.

## 3) Variables de entorno en Vercel
Vercel → Project → Settings → Environment Variables → después **Redeploy**.
| Variable | Valor | Obligatoria |
|---|---|---|
| `PAYPAL_CLIENT_SECRET` | el **Secret** de tu app de PayPal (PRIVADO, nunca en GitHub) | Sí |
| `PAYPAL_WEBHOOK_ID` | el Webhook ID del paso 2.3 | Sí |
| `PAYPAL_ENV` | `live` (dinero real) o `sandbox` (pruebas). Si no la pones, es `live`. | Recomendada |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | el Client ID (público). Si no la pones se usa el que me pasaste. Debe ser de LA MISMA app y del MISMO modo que el secret. | Opcional |
| `PAYPAL_PLAN_IDS` | los 3 IDs separados por coma. Si no la pones se usan los 3 que me pasaste. | Opcional |
| `SUPABASE_SERVICE_ROLE_KEY` | ya la tienes | Ya está |
⚠️ El Client ID/planes tienen que ser del MISMO entorno que `PAYPAL_ENV` (los de Live no funcionan en Sandbox ni al revés). Para probar sin gastar dinero: crea en **Sandbox** una app, 3 planes de prueba, un webhook y cuentas de prueba, y pon `PAYPAL_ENV=sandbox` con SUS valores.
La Service Role Key y el Secret solo los usa el servidor (`app/api/paypal/*`); nunca llegan al navegador.

## 4) Subir el código
`git add .` → `git commit -m "v1.7.0 circulo lunar"` → `git push`. Sin `npm install` (no hay librerías nuevas).

## 5) Primera revisión (2 minutos)
1. Entra a `/apoyar`. Debes ver las 3 tarjetas. Si el botón dice «Unirme a …» el modo automático está listo. Si dice «Los pagos automáticos todavía no están listos», falta una variable o un plan no coincide (abre `https://daiwaplace.vercel.app/api/paypal/config`: te dice `mode` y qué planes reconoció).
2. Centro de Mando → **Supporters**: deben salir las cifras en cero.
3. Para que alguien más (no Admin Supremo) use esa pestaña: Taller de Roles → permiso «Administrar Supporters».

---------------------------------------------------------------------
## 6) Pruebas que debes hacer (en SANDBOX primero)
**Tres niveles**: con una cuenta de prueba suscríbete a Creciente, luego a Llena, luego a Eclipse (cancela entre una y otra o usa cuentas distintas). Comprueba en «Mi membresía»: nivel, fecha de renovación, bono de la semana ya recibido (Misiones → saldo → historial de Lunas: «supporter_weekly»), historias por día (4/5/7 en el editor de historias), descuento en la Tienda (precio tachado) y lunita en el perfil y en publicaciones.
**Pago aún procesándose**: si tras aprobar sale «estamos confirmando», espera: el webhook la activa.
**Cancelación**: «Cancelar mi suscripción» → estado «Cancelada · activa hasta…» y sigue con ventajas hasta esa fecha.
**Renovación**: en el simulador de webhooks de PayPal (o esperando el cobro) llega `PAYMENT.SALE.COMPLETED`: «Próxima renovación» avanza y el pago aparece en el historial.
**Pago fallido**: evento `BILLING.SUBSCRIPTION.PAYMENT.FAILED` → estado «Pago pendiente»; conserva lo ya pagado.
**Avisos duplicados**: reenvía el mismo evento desde PayPal (Webhooks → Event logs → Resend): Centro de Mando → Supporters → Historial → «Avisos de PayPal» muestra 1 solo; no hay doble bono ni doble pago.
**Reembolso**: `PAYMENT.SALE.REFUNDED` → la membresía se corta al instante.
**Seguridad/RLS**: el SQL de pruebas ya verifica que el navegador no puede leer las tablas ni activar membresías. Además: el webhook responde 400 si la firma no es de PayPal (prueba con `curl -X POST https://daiwaplace.vercel.app/api/paypal/webhook -d '{"id":"x","event_type":"y"}'` → debe dar 400).

## 7) Cómo funciona la seguridad de los pagos
- El navegador **no activa nada**. Tras aprobar, la página avisa al servidor y **el servidor le pregunta a PayPal** (estado, plan, precio y dueño de la suscripción, vía `custom_id`). Si PayPal aún no la marca ACTIVA, no se activa: lo hace el webhook.
- El webhook **verifica la firma con PayPal** y guarda el `event_id` (único) para no procesar el mismo aviso dos veces. Si algo falla responde 500 y PayPal reintenta.
- `paid_until` sale del **próximo cobro que dice PayPal** (+1 día de margen), así confirmar por las dos vías da el mismo resultado: nunca suma de más.
- Un pago (`transaction id`) es único. Un ID de PayPal.Me no se puede usar dos veces.
- Todas las tablas tienen RLS sin permisos directos; las funciones que activan membresías solo las puede ejecutar el servidor (`service_role`).
- Si PayPal **reembolsa o revierte**, se corta la membresía; los bonos ya entregados no se descuentan.
- **Bono semanal**: una vez por semana (lunes, hora de Colombia): al activarse, al abrir «Mi membresía» y por un cron de Supabase (lunes 00:05 Colombia; si `pg_cron` no está activo, basta lo demás). Si alguien sube de nivel a mitad de semana, el bono de esa semana ya entregado no se repite; desde el lunes siguiente recibe el del nivel nuevo.

## 8) Pago manual (PayPal.Me)
Solo como alternativa: la persona paga en `paypal.me/juanfe280206`, copia el ID de transacción y lo envía en `/apoyar` (sección plegable). Tú lo ves en Centro de Mando → Supporters → Solicitudes: compruebas en TU PayPal que existe ese pago por el monto del nivel y pulsas Aprobar (da 30 días + el bono de la semana). No se renueva solo. Todo queda en el registro.

## 9) Colombia
PayPal no permite pagos entre dos cuentas de residentes en Colombia. `/apoyar` muestra un aviso con tu Discord (**@juanfegg28**); si el dispositivo está en la zona horaria de Colombia, el aviso se destaca y los botones de PayPal se ocultan (con un enlace «¿No estás en Colombia?» para mostrarlos). No se guarda ninguna ubicación. A esas personas puedes darles la membresía a mano: Centro de Mando → Supporters → «Ajuste manual» (con motivo).

## 10) Cosméticos exclusivos (para la próxima actualización)
Ya existen los espacios en `supporter_perks` (Halo Naciente, Órbita de Plata, Corona de Totalidad, tarjetas Marea de Plata y Umbra, efecto Eclipse Total, efecto de nombre y los 3 títulos), todos con `available = false`: en «Mi membresía» salen como «Pronto» y **no hay botón de reclamar activo**. Para activar uno cuando exista el diseño: crea el cosmético con `obtainable = 'supporter'` (no sale en la tienda pública; solo lo ve quien ya lo tiene), y actualiza su fila: `update supporter_perks set item_id = '<id del cosmético>', available = true where code = '...';`. `supporter_claim_perk` ya valida nivel y que no se pueda reclamar por otra persona. Lo reclamado se conserva aunque se cancele. Revisa en esa actualización que `my_inventory` / `cosmetic_save_look` dejen equipar un ítem con `obtainable='supporter'` al dueño (no se pudo probar sin diseños).

## 11) Dinero: comisiones
PayPal cobra comisión por cada pago (un porcentaje + una tarifa fija en dólares). En pagos de $1 la tarifa fija se come una parte grande. Revisa las tarifas actuales de tu cuenta Business en PayPal antes de decidir si dejas el nivel de $1.

## Verificado y NO verificado
Verificado aquí: `tsc` y ESLint sin errores nuevos; el SQL se parseó entero (sintaxis y bloques PL/pgSQL) con el parser de PostgreSQL; las rutas cargan en `next dev`.
NO verificado (no se puede desde aquí): el SQL corriendo en tu Supabase, nada contra los servidores de PayPal (credenciales, planes, firma del webhook, botones), ni el aspecto en un teléfono. Eso se confirma con el Paso 5 y las pruebas del Paso 6; el SQL de pruebas cubre la lógica de base de datos. Si algo falla, mándame el mensaje exacto.
