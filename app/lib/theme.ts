// Modo claro/oscuro y color de acento personalizado.
// Los colores "garnet-*" del proyecto están definidos como variables CSS
// (ver globals.css), así que para cambiar el acento solo hace falta
// sobreescribir esas variables en tiempo de ejecución — ningún componente
// necesita cambiar.

export type ThemeMode = 'dark' | 'light'

export const ACCENT_PRESETS: { name: string; hex: string }[] = [
  { name: 'Granate', hex: '#c81b3e' },
  { name: 'Azul', hex: '#2563eb' },
  { name: 'Morado', hex: '#7c3aed' },
  { name: 'Verde', hex: '#16a34a' },
  { name: 'Naranja', hex: '#ea580c' },
]

export const DEFAULT_ACCENT = ACCENT_PRESETS[0].hex

const THEME_STORAGE_KEY = 'daiwa-theme'
const ACCENT_STORAGE_KEY = 'daiwa-accent'

export function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex)
}

function hexToHsl(hex: string) {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const bigint = parseInt(full, 16)
  const r = ((bigint >> 16) & 255) / 255
  const g = ((bigint >> 8) & 255) / 255
  const b = (bigint & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h /= 6
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

function hslToHex(h: number, s: number, l: number): string {
  const S = Math.min(100, Math.max(0, s)) / 100
  const L = Math.min(100, Math.max(0, l)) / 100
  const c = (1 - Math.abs(2 * L - 1)) * S
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = L - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) {
    r = c
    g = x
  } else if (h < 120) {
    r = x
    g = c
  } else if (h < 180) {
    g = c
    b = x
  } else if (h < 240) {
    g = x
    b = c
  } else if (h < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * A partir de UN color, genera la rampa 300-700 que usan los botones y acentos.
 * OJO: antes esto forzaba un mínimo de 35% de saturación — para un negro, blanco
 * o gris (saturación real 0%), el matiz queda indefinido y JS lo calcula como 0°
 * (rojo), así que ese mínimo forzado convertía cualquier gris/negro/blanco en un
 * rojo visible. Ahora se respeta la saturación real del color elegido: si es 0
 * (gris puro), la rampa sale en grises, no en rojo.
 */
export function hexToAccentShades(hex: string) {
  const { h, s } = hexToHsl(hex)
  const sat = Math.min(90, s)
  return {
    300: hslToHex(h, sat, 78),
    400: hslToHex(h, sat, 62),
    500: hex,
    600: hslToHex(h, Math.min(100, sat > 0 ? sat + 8 : 0), 36),
    700: hslToHex(h, Math.min(100, sat > 0 ? sat + 8 : 0), 26),
  }
}

/** Aplica el tema (modo + acento) al documento y lo cachea en localStorage. */
export function applyTheme(mode: ThemeMode, accentHex?: string | null) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.theme = mode
  root.style.colorScheme = mode

  const clean = accentHex && isValidHex(accentHex) ? accentHex : null
  const shades = clean ? hexToAccentShades(clean) : null

  const entries: [string, string | null][] = [
    ['--color-garnet-300', shades ? shades[300] : null],
    ['--color-garnet-400', shades ? shades[400] : null],
    ['--color-garnet-500', shades ? shades[500] : null],
    ['--color-garnet-600', shades ? shades[600] : null],
    ['--color-garnet-700', shades ? shades[700] : null],
  ]
  for (const [prop, value] of entries) {
    if (value) root.style.setProperty(prop, value)
    else root.style.removeProperty(prop)
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
    if (clean) localStorage.setItem(ACCENT_STORAGE_KEY, clean)
    else localStorage.removeItem(ACCENT_STORAGE_KEY)
  } catch {
    // localStorage puede fallar (modo privado); simplemente no se cachea
  }
}

/** Script para <head>: aplica el tema guardado ANTES de pintar, para evitar el parpadeo. */
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem('${THEME_STORAGE_KEY}');var a=localStorage.getItem('${ACCENT_STORAGE_KEY}');var r=document.documentElement;if(m==='light'){r.dataset.theme='light';r.style.colorScheme='light';}if(a){r.style.setProperty('--color-garnet-500',a);}}catch(e){}})();`
