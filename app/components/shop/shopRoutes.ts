import type { CosmeticType } from '../../lib/cosmetics'
/** Categorías de «Explorar»: el enlace (en español) y el tipo que filtran */
export const CATEGORY_SLUGS: { slug: string; type: CosmeticType; label: string }[] = [
  { slug: 'avatares', type: 'avatar_decoration', label: 'Decoraciones de avatar' },
  { slug: 'tarjetas', type: 'profile_card', label: 'Tarjetas de perfil' },
  { slug: 'entradas', type: 'entry_effect', label: 'Efectos de entrada' },
  { slug: 'nombres', type: 'name_effect', label: 'Efectos de nombre' },
  { slug: 'fuentes', type: 'font', label: 'Fuentes' },
  { slug: 'fondos', type: 'background', label: 'Fondos de perfil' },
  { slug: 'titulos', type: 'title', label: 'Títulos' },
]
