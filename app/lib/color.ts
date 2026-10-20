// Utilidades de color para la personalización de perfiles (v1.3.0).
// Los colores que elige la gente se guardan tal cual (#RRGGBB); al PINTARLOS se ajustan para que el
// texto siempre se lea (contraste mínimo 4.5, WCAG) tanto en el tema oscuro como en el claro.
import { hexToHsl, hslToHex, isValidHex } from './theme'

export { isValidHex }

export const DARK_BG = '#0c0c0f'
export const LIGHT_BG = '#f6f4f1'

function channel(v: number) {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16)
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

export function contrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Ajusta la luminosidad del color hasta que se lea (≥ 4.5) sobre el fondo indicado, conservando el tono. */
export function readableOn(hex: string, bg: string, min = 4.5): string {
  if (!isValidHex(hex)) return hex
  if (contrast(hex, bg) >= min) return hex
  const { h, s, l } = hexToHsl(hex)
  const lightBg = luminance(bg) > 0.4
  let lum = l
  for (let i = 0; i < 40; i++) {
    lum += lightBg ? -2.5 : 2.5
    const next = hslToHex(h, s, Math.min(100, Math.max(0, lum)))
    if (contrast(next, bg) >= min || lum <= 0 || lum >= 100) return next
  }
  return lightBg ? '#1d1e21' : '#f2f1ef'
}

/** Texto (blanco o casi negro) para escribir encima de un color de relleno */
export function textOnFill(hex: string): string {
  return contrast(hex, '#ffffff') >= contrast(hex, '#17171a') ? '#ffffff' : '#17171a'
}

/** Variables CSS de un color de NOMBRE: una para el tema oscuro y otra para el claro (así no hace falta saber el tema al pintar). */
export function nameColorVars(hex: string): Record<string, string> {
  return { '--nc-d': readableOn(hex, DARK_BG), '--nc-l': readableOn(hex, LIGHT_BG) }
}

function shades(hex: string, light: boolean) {
  const { h, s } = hexToHsl(hex)
  const sat = Math.min(90, s)
  const bg = light ? LIGHT_BG : DARK_BG
  const c300 = light ? hslToHex(h, sat, 40) : hslToHex(h, sat, 78)
  const c400 = light ? hslToHex(h, sat, 46) : hslToHex(h, sat, 62)
  return {
    300: readableOn(c300, bg, 4.5),
    400: readableOn(c400, bg, 4.5),
    500: hex,
    600: light ? hslToHex(h, Math.min(100, sat > 0 ? sat + 8 : 0), 36) : hslToHex(h, Math.min(100, sat > 0 ? sat + 8 : 0), 36),
    700: hslToHex(h, Math.min(100, sat > 0 ? sat + 8 : 0), 26),
  }
}

/**
 * Variables CSS del COLOR DEL PERFIL (público). Se ponen en el contenedor del perfil con la clase «profile-theme»
 * (ver globals.css): ahí dentro redefinen garnet-300…700, solo para esa página. No tocan el acento personal de nadie.
 */
export function profileThemeVars(hex: string | null | undefined): Record<string, string> | undefined {
  if (!hex || !isValidHex(hex)) return undefined
  const d = shades(hex, false)
  const l = shades(hex, true)
  const out: Record<string, string> = {}
  for (const k of [300, 400, 500, 600, 700] as const) {
    out[`--pf-d-${k}`] = d[k]
    out[`--pf-l-${k}`] = l[k]
  }
  return out
}

/** 24 colores prediseñados (paleta DaiwaPlace) */
export const PROFILE_PALETTE: { name: string; hex: string }[] = [
  { name: 'Granate', hex: '#c81b3e' }, { name: 'Vino', hex: '#8e1b3a' }, { name: 'Carmesí', hex: '#dc143c' }, { name: 'Rosa fuerte', hex: '#e11d74' },
  { name: 'Rosa palo', hex: '#f08aa8' }, { name: 'Fucsia', hex: '#c026d3' }, { name: 'Violeta', hex: '#7c3aed' }, { name: 'Lavanda', hex: '#a78bfa' },
  { name: 'Índigo', hex: '#4f46e5' }, { name: 'Azul noche', hex: '#1e3a8a' }, { name: 'Azul', hex: '#2563eb' }, { name: 'Celeste', hex: '#38bdf8' },
  { name: 'Turquesa', hex: '#14b8a6' }, { name: 'Menta', hex: '#6ee7b7' }, { name: 'Verde bosque', hex: '#166534' }, { name: 'Verde', hex: '#16a34a' },
  { name: 'Lima', hex: '#a3e635' }, { name: 'Dorado', hex: '#d4a017' }, { name: 'Ámbar', hex: '#f59e0b' }, { name: 'Naranja', hex: '#ea580c' },
  { name: 'Terracota', hex: '#b45309' }, { name: 'Blanco hueso', hex: '#ece6da' }, { name: 'Gris humo', hex: '#6b7280' }, { name: 'Negro humo', hex: '#2a2a31' },
]

export const CARD_MODES = [
  { id: 'solida', label: 'Sólida', hint: 'El color suave con borde' },
  { id: 'suave', label: 'Degradado', hint: 'Del color a transparente' },
  { id: 'vidrio', label: 'Vidrio', hint: 'Translúcida con desenfoque' },
] as const
export type CardMode = (typeof CARD_MODES)[number]['id']

/** Estilo (en línea) de la superficie de la tarjeta según el color y el modo elegidos */
export function cardStyle(color: string | null | undefined, mode: string | null | undefined): React.CSSProperties | undefined {
  if (!color || !isValidHex(color)) return undefined
  const m = (mode as CardMode) || 'suave'
  if (m === 'solida') return { backgroundColor: `${color}26`, borderColor: `${color}99` }
  if (m === 'vidrio') return { backgroundColor: `${color}1f`, borderColor: `${color}55`, backdropFilter: 'blur(10px)' }
  return { backgroundImage: `linear-gradient(135deg, ${color}3d 0%, ${color}14 55%, transparent 100%)`, borderColor: `${color}66` }
}
