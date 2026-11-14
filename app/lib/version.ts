// v1.10.0 · Número de versión de la app, en un archivo diminuto y sin dependencias.
// Antes vivía al final de lib/changelog.ts, y como el AppShell (barra lateral) lo importaba, TODAS las páginas descargaban
// las notas de versión completas (≈57 KB de JavaScript) solo para mostrar «v1.9.0». Ahora esas notas solo se cargan en /novedades.
// Para subir de versión: cambia el número aquí y agrega la entrada nueva al principio de CHANGELOG (lib/changelog.ts).
export const APP_VERSION = '1.10.0'
