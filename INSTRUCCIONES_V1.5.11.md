# DaiwaPlace v1.5.11 «App instalable» — paso a paso (en criollo)

Esta versión NO necesita SQL. Es 100 % código: hace que la página se pueda instalar como app en el celular.

---------------------------------------------------------------------
## PARTE 1 · Subir esta versión (5 minutos)
1. Descomprime el zip y reemplaza tu carpeta del proyecto (sin tocar tu `.env.local`).
2. Sube a GitHub como siempre:  `git add .`  →  `git commit -m "v1.5.11 app instalable"`  →  `git push`.
3. Espera a que Vercel termine de desplegar.
4. Abre `daiwaplace.vercel.app` en el celular con **Chrome**. En el Inicio debería aparecer arriba una tarjetita «Instala DaiwaPlace» (si no la instalaste ya). Toca **Instalar** y mira que quede el ícono de la luna en tu pantalla.
5. También puedes ir a la página nueva: `daiwaplace.vercel.app/descargar` (en la barra lateral: «📲 Descargar app»).

## PARTE 2 · Generar el APK para Android (sin programar)
Primero termina la Parte 1: PWABuilder lee la página ya publicada.

1. Entra a **pwabuilder.com**.
2. Pega `https://daiwaplace.vercel.app` y toca **Start**. Espera el análisis.
3. Toca **Package For Stores** → elige **Google Play** (sirve también para el APK suelto).
4. Se abre un formulario: deja casi todo como viene.
   - **Package ID**: déjalo como sale y **apúntalo** (es la identidad permanente de la app).
   - **Signing key**: deja **New** (PWABuilder te crea la llave y la mete en la descarga).
5. Genera y baja el **.zip**.

Importante: la dirección que pegues tiene que ser la misma a la que tu página redirige. Si vas a comprar un dominio propio, hazlo ANTES de generar el APK; si cambias de dirección después, hay que generar otro.

## PARTE 3 · Lo que viene en el .zip de PWABuilder
- `app-release-signed.apk` → **tu app**.
- `signing.keystore` y `signing-key-info.txt` → **tu llave y sus claves**. Guárdalas en 2 lugares (tu PC y tu Drive). Si las pierdes, ya no podrás actualizar esa app.
- `assetlinks.json` → la «verificación» de que la página es tuya.

## PARTE 4 · Poner la verificación (assetlinks.json)
Sin esto, la app muestra la barra de direcciones del navegador arriba (no se ve como app de verdad).
1. Abre el `assetlinks.json` del zip de PWABuilder y copia TODO su contenido.
2. En este proyecto abre `public/.well-known/assetlinks.json` (ahora tiene solo `[]`), borra eso y pega lo que copiaste. (O pásamelo por el chat y yo lo dejo.)
3. Sube a GitHub y espera el despliegue.
4. Comprueba abriendo `https://daiwaplace.vercel.app/.well-known/assetlinks.json`: tiene que mostrar ese texto.

## PARTE 5 · Poner el APK para descargar
1. Copia el `.apk` a la carpeta `public` del proyecto y ponle un nombre sencillo, por ejemplo `daiwaplace.apk`.
2. Abre `app/lib/appConfig.ts` y cambia
   `export const APK_URL = ''`
   por
   `export const APK_URL = '/daiwaplace.apk'`
3. Sube a GitHub. En `/descargar` aparece el botón **Descargar APK** con su guía de 4 pasos.
(Si el APK pesa mucho para GitHub, súbelo a GitHub → Releases y en `APK_URL` pon el enlace completo.)

## PARTE 6 · Probarlo en un Android
1. Abre `/descargar` y toca **Descargar APK**.
2. Si Android dice que no se puede instalar de esa fuente: **Ajustes** → «Permitir de esta fuente».
3. Toca el archivo descargado → **Instalar**. Si sale **Play Protect**: «Más detalles» → «Instalar de todos modos» (es normal con apps que no vienen de la tienda).
4. Abre la app: **no** debe verse barra de direcciones arriba. Si se ve, el problema es el `assetlinks.json` (Parte 4). Si ya habías abierto la página antes en ese cel, borra los datos del navegador para esa página (desinstalar no alcanza).

## iPhone
No existe APK. En **Safari**: Compartir → «Añadir a pantalla de inicio». La guía está en `/descargar`.

---------------------------------------------------------------------
## Qué trae esta versión
- `app/manifest.ts` + íconos en `public/icons/` (192, 512 y «maskable») + `app/apple-icon.png` (iPhone). Los armé con tu luna actual (que mide 265 px). **Si tienes el logo en PNG grande (1024×1024), reemplaza esos archivos** (mismos nombres) y queda más nítido.
- `public/sw.js` (service worker): guarda solo código, fuentes e íconos; nunca páginas ni datos de Supabase. `public/offline.html`: pantalla de «Sin conexión».
- Página `/descargar`, tarjeta «Instala DaiwaPlace» en el Inicio (solo celular, se esconde 14 días con «Ahora no») y enlace «📲 Descargar app» en la barra lateral.
- `public/.well-known/assetlinks.json` (vacío por ahora) y `app/lib/appConfig.ts` (`APK_URL`).

## Verificado y no verificado
Verificado: `tsc` y ESLint limpios, el manifest se genera bien, la página `/descargar` se dibuja, el service worker no tiene errores de sintaxis.
NO verificado (no se puede desde aquí): que Chrome ofrezca «Instalar» en tu celular, el armado del APK en PWABuilder y el comportamiento en iPhone. Pruébalo en tu cel y dime qué ves.
