// Fuentes de las historias (v1.2.0). Solo se cargan en las rutas /historias (el layout de esa carpeta las aplica).
import { Anton, Caveat, Orbitron, Playfair_Display } from 'next/font/google'

const anton = Anton({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-anton' })
const caveat = Caveat({ weight: ['700'], subsets: ['latin'], display: 'swap', variable: '--font-caveat' })
const playfair = Playfair_Display({ weight: ['600'], style: ['italic'], subsets: ['latin'], display: 'swap', variable: '--font-playfair' })
const orbitron = Orbitron({ weight: ['600', '800'], subsets: ['latin'], display: 'swap', variable: '--font-orbitron' })

/** Clases que definen las variables CSS de las fuentes (se ponen en el contenedor de las rutas de historias) */
export const STORY_FONT_CLASSES = `${anton.variable} ${caveat.variable} ${playfair.variable} ${orbitron.variable}`
