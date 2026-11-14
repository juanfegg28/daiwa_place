// Fuentes de las historias (v1.2.0). Solo se cargan en las rutas /historias (el layout de esa carpeta las aplica).
// v1.10.0 · ahora salen de app/fonts/ con next/font/local (antes next/font/google): sin red al compilar y sin pedirlas a Google.
import localFont from 'next/font/local'

const anton = localFont({ src: '../fonts/Anton-latin-400.woff2', weight: '400', style: 'normal', display: 'swap', variable: '--font-anton', adjustFontFallback: false, fallback: ['Impact', 'Arial Narrow', 'sans-serif'] })
const caveat = localFont({ src: '../fonts/Caveat-latin-700.woff2', weight: '700', style: 'normal', display: 'swap', variable: '--font-caveat', adjustFontFallback: false, fallback: ['Segoe Script', 'Comic Sans MS', 'cursive'] })
const playfair = localFont({ src: '../fonts/PlayfairDisplay-latin-600-italic.woff2', weight: '600', style: 'italic', display: 'swap', variable: '--font-playfair', adjustFontFallback: 'Times New Roman', fallback: ['Georgia', 'Times New Roman', 'serif'] })
const orbitron = localFont({ src: '../fonts/Orbitron-latin-wght.woff2', weight: '400 900', style: 'normal', display: 'swap', variable: '--font-orbitron', adjustFontFallback: false, fallback: ['Eurostile', 'Verdana', 'sans-serif'] })

/** Clases que definen las variables CSS de las fuentes (se ponen en el contenedor de las rutas de historias) */
export const STORY_FONT_CLASSES = `${anton.variable} ${caveat.variable} ${playfair.variable} ${orbitron.variable}`
