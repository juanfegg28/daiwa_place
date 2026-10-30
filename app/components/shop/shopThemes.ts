// Temas de color de los banners de la tienda (selecciones y ofertas). El admin elige uno por nombre.
// v1.5.10 · cada tema trae su ESCENA ilustrada (`scene`); el id (3–12 letras minúsculas) es lo que se guarda en la base, así que no hace falta SQL para agregar más.
export type ShopScene = 'halloween' | 'muertos' | 'sakura' | 'aurora' | 'neon' | 'otono' | 'invierno' | 'velvet' | 'oceano' | 'bosque' | 'cosmos' | 'atardecer' | 'generic'
export type ShopTheme = { id: string; label: string; a: string; b: string; c: string; accent: string; scene: ShopScene; hint?: string }

export const SHOP_THEMES: ShopTheme[] = [
  { id: 'halloween', label: 'Halloween', a: '#12061f', b: '#43166b', c: '#e8702a', accent: '#fdba74', scene: 'halloween', hint: 'Luna, calabazas y murciélagos' },
  { id: 'muertos', label: 'Día de Muertos', a: '#1a0a14', b: '#6b1d4a', c: '#ff9a1f', accent: '#ffd27a', scene: 'muertos', hint: 'Cempasúchil, papel picado y velas' },
  { id: 'garnet', label: 'Granate', a: '#190509', b: '#6b0f1f', c: '#e11d48', accent: '#fda4af', scene: 'generic', hint: 'Degradado granate con luna' },
  { id: 'moon', label: 'Luna', a: '#060a1c', b: '#1d2a6a', c: '#7c8cf8', accent: '#c7d2fe', scene: 'generic', hint: 'Noche azul con luna' },
  { id: 'rose', label: 'Rosa', a: '#2a0a1f', b: '#9d174d', c: '#f472b6', accent: '#fbcfe8', scene: 'generic', hint: 'Rosa con pétalos' },
  { id: 'ice', label: 'Hielo', a: '#051627', b: '#0e5a86', c: '#67e8f9', accent: '#cffafe', scene: 'generic', hint: 'Azul helado' },
  { id: 'gold', label: 'Oro', a: '#1a1103', b: '#7a4a0a', c: '#fbbf24', accent: '#fde68a', scene: 'generic', hint: 'Rayos dorados' },
  { id: 'emerald', label: 'Esmeralda', a: '#04160f', b: '#0b6b45', c: '#34d399', accent: '#a7f3d0', scene: 'generic', hint: 'Verde con hojas' },
  { id: 'ember', label: 'Brasa', a: '#1d0904', b: '#9a3412', c: '#fb923c', accent: '#fed7aa', scene: 'generic', hint: 'Brasas encendidas' },
  { id: 'sakura', label: 'Sakura', a: '#2b0d1f', b: '#b83a75', c: '#ffb3d1', accent: '#ffe1ee', scene: 'sakura', hint: 'Cerezo en flor' },
  { id: 'aurora', label: 'Aurora', a: '#03121a', b: '#0b5a5a', c: '#7cf5c8', accent: '#d2fff0', scene: 'aurora', hint: 'Aurora boreal' },
  { id: 'neon', label: 'Neón', a: '#0b0420', b: '#4a1294', c: '#ff3fa4', accent: '#7df9ff', scene: 'neon', hint: 'Atardecer synthwave' },
  { id: 'otono', label: 'Otoño', a: '#1c0e05', b: '#7a3b0c', c: '#f59e0b', accent: '#fde68a', scene: 'otono', hint: 'Hojas cayendo' },
  { id: 'invierno', label: 'Invierno', a: '#07121f', b: '#1e4a78', c: '#bfe6ff', accent: '#ffffff', scene: 'invierno', hint: 'Nieve y pinos' },
  { id: 'velvet', label: 'Terciopelo', a: '#1a0308', b: '#7a0f24', c: '#e8b34b', accent: '#ffe3a1', scene: 'velvet', hint: 'Telón de teatro' },
  { id: 'oceano', label: 'Océano', a: '#021423', b: '#0a4d7a', c: '#38bdf8', accent: '#bae6fd', scene: 'oceano', hint: 'Olas y burbujas' },
  { id: 'bosque', label: 'Bosque Fae', a: '#04130c', b: '#14532d', c: '#a3e635', accent: '#ecfccb', scene: 'bosque', hint: 'Luciérnagas entre árboles' },
  { id: 'cosmos', label: 'Cosmos', a: '#05030f', b: '#2b1a6b', c: '#a78bfa', accent: '#e9d5ff', scene: 'cosmos', hint: 'Nebulosa y planeta' },
  { id: 'atardecer', label: 'Atardecer', a: '#1b0b1f', b: '#a23b5c', c: '#ffb454', accent: '#ffe0b0', scene: 'atardecer', hint: 'Sol bajo el horizonte' },
]
export const themeOf = (id: string | null | undefined): ShopTheme => SHOP_THEMES.find((t) => t.id === id) ?? SHOP_THEMES.find((t) => t.id === 'garnet')!
