// Temas de color de los banners de la tienda (selecciones y ofertas). El admin elige uno por nombre.
export type ShopTheme = { id: string; label: string; a: string; b: string; c: string; accent: string }

export const SHOP_THEMES: ShopTheme[] = [
  { id: 'halloween', label: 'Halloween', a: '#12061f', b: '#43166b', c: '#e8702a', accent: '#fdba74' },
  { id: 'garnet', label: 'Granate', a: '#190509', b: '#6b0f1f', c: '#e11d48', accent: '#fda4af' },
  { id: 'moon', label: 'Luna', a: '#060a1c', b: '#1d2a6a', c: '#7c8cf8', accent: '#c7d2fe' },
  { id: 'rose', label: 'Rosa', a: '#2a0a1f', b: '#9d174d', c: '#f472b6', accent: '#fbcfe8' },
  { id: 'ice', label: 'Hielo', a: '#051627', b: '#0e5a86', c: '#67e8f9', accent: '#cffafe' },
  { id: 'gold', label: 'Oro', a: '#1a1103', b: '#7a4a0a', c: '#fbbf24', accent: '#fde68a' },
  { id: 'emerald', label: 'Esmeralda', a: '#04160f', b: '#0b6b45', c: '#34d399', accent: '#a7f3d0' },
  { id: 'ember', label: 'Brasa', a: '#1d0904', b: '#9a3412', c: '#fb923c', accent: '#fed7aa' },
]
export const themeOf = (id: string | null | undefined): ShopTheme => SHOP_THEMES.find((t) => t.id === id) ?? SHOP_THEMES[1]
