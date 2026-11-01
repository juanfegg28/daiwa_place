# DaiwaPlace v1.6.0 «APK de Android» — qué hacer

Esta versión NO trae SQL propio. Trae todo lo de la 1.5.10 y la 1.5.11 (no hace falta subirlas aparte).

Nota: los dos SQL de Día de Muertos siguen llamándose `v1.5.10_*` y sus filas llevan `release_version = '1.5.10'` a propósito (así coinciden con lo que ya hay en la base). El orden es el de siempre: catálogo ahora y «lanzar» el 31.

## Subir
1. Reemplaza el proyecto con este zip (sin tocar tu `.env.local`).
2. `git add .` → `git commit -m "v1.6.0 apk android"` → `git push`. Vercel despliega solo.

## Comprobar (después del despliegue)
1. Abre `https://daiwaplace.vercel.app/.well-known/assetlinks.json` → tiene que mostrar el texto con `app.vercel.daiwaplace.twa` y la huella `FC:C5:E0:…:E4:4E`.
2. Abre `https://daiwaplace.vercel.app/descargar` → tiene que aparecer el botón **Descargar APK** (si dice «El APK llega pronto», el despliegue no terminó o no se subió `public/daiwaplace.apk`).
3. En un Android: baja el APK, instálalo (Ajustes → «Permitir de esta fuente»; si sale Play Protect: «Más detalles» → «Instalar de todos modos») y ábrelo. **No** debe verse barra de direcciones arriba. Si se ve: borra los datos del navegador para esa página y vuelve a abrir la app (Android guarda el archivo viejo).

## Qué se puso
- `public/.well-known/assetlinks.json`: el que generó PWABuilder (paquete `app.vercel.daiwaplace.twa`). Su huella coincide con la firma del APK (lo comprobé).
- `public/daiwaplace.apk`: el APK de PWABuilder (1,9 MB).
- `app/lib/appConfig.ts`: `APK_URL = '/daiwaplace.apk'`.
- `.gitignore`: ahora ignora `signing.keystore`, `signing-key-info.txt`, `*.keystore` y `*.aab` para que la llave no se suba a GitHub por accidente.

## MUY IMPORTANTE: la llave de firma
NO está dentro de este zip a propósito. Guarda `signing.keystore` y `signing-key-info.txt` (vienen en el zip de PWABuilder) en 2 lugares seguros (tu PC y tu Drive) y **nunca los subas a GitHub**. Si los pierdes ya no podrás actualizar la app con ese mismo nombre. El archivo `DaiwaPlace.aab` solo sirve si algún día subes la app a Google Play (guárdalo también).

## Qué NO pude verificar desde aquí
Que Android abra la app sin barra de direcciones y que Play Protect no lo bloquee: eso solo se ve en un celular real. La firma y el `assetlinks.json` sí los comparé y coinciden.
