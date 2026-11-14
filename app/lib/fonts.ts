// v1.10.0 · Fuentes de toda la página, alojadas en el propio proyecto (app/fonts/*.woff2, licencia OFL: ver app/fonts/LICENCIAS.md).
// Antes se pedían a Google: Geist y Geist Mono con next/font/google (necesita internet al compilar) y Cinzel con un <link> en el <head>
// (dos dominios extra y una hoja de estilos que bloquea el pintado). Con next/font/local el build no depende de la red, no hay
// solicitudes a terceros (importante: muchos usuarios son menores) y Next genera una fuente de respaldo con tamaño ajustado para no mover el texto.
// NO volver a next/font/google: con Turbopack (Next 16) Cinzel rompió el despliegue en Vercel.
import localFont from 'next/font/local'

/** Texto de toda la página. Es la única que se precarga (se ve en la primera pintura de cualquier ruta). */
export const geistSans = localFont({
  src: '../fonts/Geist-latin-wght.woff2',
  variable: '--font-geist-sans',
  weight: '100 900',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
})

/** Código, estilo «máquina de escribir» de las historias y números tabulares. No se precarga: aparece en pocas pantallas. */
export const geistMono = localFont({
  src: '../fonts/GeistMono-latin-wght.woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
})

/** Títulos (`font-display`), historias y stickers. Misma variable CSS (--font-cinzel) que ya usaba todo el código. */
export const cinzel = localFont({
  src: '../fonts/Cinzel-latin-wght.woff2',
  variable: '--font-cinzel',
  weight: '400 900',
  display: 'swap',
  preload: false,
  adjustFontFallback: 'Times New Roman',
  fallback: ['Times New Roman', 'Georgia', 'serif'],
})
