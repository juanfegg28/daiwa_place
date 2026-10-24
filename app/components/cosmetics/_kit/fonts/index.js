// @ts-nocheck
// FUENTES: 40 de pago (la spec dice 38; la tabla enumera 40) + 2 gratis. Nombres según Google Fonts.
// OJO: no pude descargarlas ni verificarlas desde el entorno de diseño (red bloqueada). La galería las carga en vivo desde
// Google Fonts en tu navegador: si alguna no se ve, el nombre/licencia hay que confirmarlo al implementar (como pide la spec).
export const TEST_STRING = 'Ñandú José Ángel ¿¡ü'
const f = (family, name, rarity, price, cat, o = {}) => ({ slug: family.toLowerCase().replace(/[^a-z0-9]+/g, '-'), family, name, rarity, price, cat, italic: !!o.italic, weight: o.weight || 400, license: 'OFL', gothic: cat === 'gotica' })
export const FONT_CATS = [
  { id: 'gotica', name: 'Góticas / oscuras' }, { id: 'elegante', name: 'Elegantes / terciopelo' }, { id: 'script', name: 'Script / femeninas' },
  { id: 'kawaii', name: 'Kawaii / redondas' }, { id: 'japonesa', name: 'Vibra japonesa' }, { id: 'cyber', name: 'Cyber / gamer' }, { id: 'horror', name: 'Horror / máquina' }, { id: 'gratis', name: 'Gratis' },
]
export const FONTS = [
  f('Pirata One', 'Pirata One', 'comun', 450, 'gotica'), f('New Rocker', 'New Rocker', 'comun', 450, 'gotica'), f('MedievalSharp', 'MedievalSharp', 'comun', 400, 'gotica'),
  f('Metal Mania', 'Metal Mania', 'raro', 700, 'gotica'), f('Grenze Gotisch', 'Grenze Gotisch', 'raro', 700, 'gotica', { weight: 600 }), f('Jim Nightshade', 'Jim Nightshade', 'raro', 700, 'gotica'), f('Jacquard 24', 'Jacquard 24', 'raro', 800, 'gotica'),
  f('Playfair Display', 'Playfair Display (cursiva)', 'comun', 400, 'elegante', { italic: true }), f('Cormorant Garamond', 'Cormorant Garamond', 'comun', 400, 'elegante', { weight: 600 }), f('Italiana', 'Italiana', 'comun', 450, 'elegante'),
  f('Cinzel Decorative', 'Cinzel Decorative', 'raro', 700, 'elegante', { weight: 700 }), f('Bodoni Moda', 'Bodoni Moda', 'raro', 700, 'elegante', { weight: 600 }), f('Gloock', 'Gloock', 'raro', 700, 'elegante'),
  f('Dancing Script', 'Dancing Script', 'comun', 400, 'script', { weight: 600 }), f('Pacifico', 'Pacifico', 'comun', 450, 'script'), f('Great Vibes', 'Great Vibes', 'comun', 500, 'script'), f('Parisienne', 'Parisienne', 'comun', 500, 'script'),
  f('Sacramento', 'Sacramento', 'raro', 650, 'script'), f('Allura', 'Allura', 'raro', 650, 'script'),
  f('Fredoka', 'Fredoka', 'comun', 400, 'kawaii', { weight: 600 }), f('Yomogi', 'Yomogi', 'comun', 400, 'kawaii'), f('Chewy', 'Chewy', 'comun', 450, 'kawaii'), f('Mochiy Pop One', 'Mochiy Pop One', 'raro', 700, 'kawaii'), f('Hachi Maru Pop', 'Hachi Maru Pop', 'raro', 750, 'kawaii'),
  f('DotGothic16', 'DotGothic16', 'raro', 700, 'japonesa'), f('Yuji Syuku', 'Yuji Syuku', 'raro', 800, 'japonesa'), f('Zen Antique', 'Zen Antique', 'raro', 800, 'japonesa'), f('Reggae One', 'Reggae One', 'raro', 750, 'japonesa'), f('Dela Gothic One', 'Dela Gothic One', 'raro', 750, 'japonesa'),
  f('Share Tech Mono', 'Share Tech Mono', 'comun', 400, 'cyber'), f('Orbitron', 'Orbitron', 'comun', 450, 'cyber', { weight: 700 }), f('Audiowide', 'Audiowide', 'comun', 450, 'cyber'), f('Silkscreen', 'Silkscreen', 'comun', 500, 'cyber'),
  f('Press Start 2P', 'Press Start 2P', 'raro', 700, 'cyber'), f('Monoton', 'Monoton', 'epico', 1000, 'cyber'), f('Bungee Shade', 'Bungee Shade', 'epico', 1000, 'cyber'), f('Rubik Glitch', 'Rubik Glitch', 'epico', 1100, 'cyber'),
  f('Special Elite', 'Special Elite', 'comun', 450, 'horror'), f('Creepster', 'Creepster', 'raro', 800, 'horror'), f('Eater', 'Eater', 'raro', 800, 'horror'),
  { slug: 'clasica', family: 'Georgia', name: 'Clásica (la de la app)', rarity: 'comun', price: 0, cat: 'gratis', license: 'propia', free: true, gothic: false, italic: false, weight: 400 },
  { slug: 'cinzel', family: 'Cinzel', name: 'Cinzel', rarity: 'comun', price: 0, cat: 'gratis', license: 'OFL', free: true, gothic: false, italic: false, weight: 600 },
]
// URL de Google Fonts para la galería (una sola petición con todas)
export const googleFontsHref = () => 'https://fonts.googleapis.com/css2?' + FONTS.filter((x) => !x.free || x.family === 'Cinzel').filter((x) => x.family !== 'Georgia').map((x) => 'family=' + x.family.replace(/ /g, '+') + (x.italic ? ':ital,wght@1,400' : x.weight !== 400 ? ':wght@' + x.weight : '')).join('&') + '&display=swap'
// CSS que aplica la regla de legibilidad (nunca mayúsculas forzadas en góticas)
export const fontStyle = (x) => `font-family:'${x.family}',serif;font-style:${x.italic ? 'italic' : 'normal'};font-weight:${x.weight};text-transform:none;${x.gothic ? 'letter-spacing:.2px;' : ''}`
