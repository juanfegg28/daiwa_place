// v1.9.0 · Catálogo de cosméticos EXCLUSIVOS del Círculo Lunar (los mismos 31 que crea el SQL). Solo nombres y nivel:
// el arte vive en components/cosmetics/_kit/members. Sirve para la galería «Estilos» sin pedir nada a Supabase.
export type MemberTier = 'creciente' | 'llena' | 'eclipse'
export type MemberType = 'avatar_decoration' | 'profile_card' | 'entry_effect' | 'name_effect' | 'title'
export type MemberItem = { type: MemberType; slug: string; name: string; tier: MemberTier }

export const MEMBER_ITEMS: MemberItem[] = [
  { type: 'avatar_decoration', slug: 'halo-naciente', name: 'Halo Naciente', tier: 'creciente' },
  { type: 'avatar_decoration', slug: 'lazo-de-seda-y-perlas', name: 'Lazo de seda y perlas', tier: 'creciente' },
  { type: 'avatar_decoration', slug: 'jardin-de-luna', name: 'Jardín de luna', tier: 'creciente' },
  { type: 'avatar_decoration', slug: 'orbita-de-plata', name: 'Órbita de plata', tier: 'llena' },
  { type: 'avatar_decoration', slug: 'astrolabio-de-selene', name: 'Astrolabio de Selene', tier: 'llena' },
  { type: 'avatar_decoration', slug: 'polilla-lunar', name: 'Polilla lunar', tier: 'llena' },
  { type: 'avatar_decoration', slug: 'diadema-de-selene', name: 'Diadema de Selene', tier: 'llena' },
  { type: 'avatar_decoration', slug: 'medusas-de-medianoche', name: 'Medusas de medianoche', tier: 'llena' },
  { type: 'avatar_decoration', slug: 'corona-de-la-totalidad', name: 'Corona de la Totalidad', tier: 'eclipse' },
  { type: 'avatar_decoration', slug: 'caliz-de-rosas', name: 'Cáliz de rosas', tier: 'eclipse' },
  { type: 'avatar_decoration', slug: 'serafin-lunar', name: 'Serafín lunar', tier: 'eclipse' },
  { type: 'avatar_decoration', slug: 'reloj-de-selene', name: 'Reloj de Selene', tier: 'eclipse' },
  { type: 'avatar_decoration', slug: 'cristales-de-eclipse', name: 'Cristales de eclipse', tier: 'eclipse' },
  { type: 'avatar_decoration', slug: 'gatita-celestial', name: 'Gatita celestial', tier: 'eclipse' },
  { type: 'profile_card', slug: 'velo-de-luna', name: 'Velo de Luna', tier: 'creciente' },
  { type: 'profile_card', slug: 'marea-de-plata', name: 'Marea de Plata', tier: 'llena' },
  { type: 'profile_card', slug: 'jardin-de-seda', name: 'Jardín de seda', tier: 'llena' },
  { type: 'profile_card', slug: 'umbra', name: 'Umbra', tier: 'eclipse' },
  { type: 'profile_card', slug: 'salon-de-cristal', name: 'Salón de cristal', tier: 'eclipse' },
  { type: 'entry_effect', slug: 'marea-de-petalos-lunares', name: 'Marea de pétalos lunares', tier: 'creciente' },
  { type: 'entry_effect', slug: 'lluvia-de-estrellas-de-plata', name: 'Lluvia de estrellas de plata', tier: 'llena' },
  { type: 'entry_effect', slug: 'eclipse-total-lunar', name: 'Eclipse Total Lunar', tier: 'eclipse' },
  { type: 'name_effect', slug: 'luz-de-luna', name: 'Luz de luna', tier: 'creciente' },
  { type: 'name_effect', slug: 'seda-y-perlas', name: 'Seda y perlas', tier: 'llena' },
  { type: 'name_effect', slug: 'aura-de-eclipse', name: 'Aura de eclipse', tier: 'eclipse' },
  { type: 'title', slug: 'bajo-la-luna', name: 'Bajo la Luna', tier: 'creciente' },
  { type: 'title', slug: 'sueno-de-plata', name: 'Sueño de plata', tier: 'creciente' },
  { type: 'title', slug: 'heredero-de-selene', name: 'Heredero de Selene', tier: 'llena' },
  { type: 'title', slug: 'reina-de-las-perlas', name: 'Reina de las perlas', tier: 'llena' },
  { type: 'title', slug: 'testigo-de-la-totalidad', name: 'Testigo de la Totalidad', tier: 'eclipse' },
  { type: 'title', slug: 'soberano-del-eclipse', name: 'Soberano del eclipse', tier: 'eclipse' },
]

export const MEMBER_TIERS: { id: MemberTier; name: string; rank: number; price: string; blurb: string }[] = [
  { id: 'creciente', name: 'Luna Creciente', rank: 1, price: '$1', blurb: 'El primer brillo: tus primeras decoraciones, tarjeta, entrada y título.' },
  { id: 'llena', name: 'Luna Llena', rank: 2, price: '$2', blurb: 'Todo lo de Creciente y más: órbitas, astrolabios, polillas lunares y tarjetas de plata.' },
  { id: 'eclipse', name: 'Eclipse', rank: 3, price: '$5', blurb: 'Todo lo anterior y la colección completa: coronas, serafines, relojes y el Eclipse Total.' },
]

export const MEMBER_TYPE_LABEL: Record<MemberType, string> = {
  avatar_decoration: 'Decoraciones',
  profile_card: 'Tarjetas de perfil',
  entry_effect: 'Efectos de entrada',
  name_effect: 'Efectos de nombre',
  title: 'Títulos',
}
export const MEMBER_TYPE_ORDER: MemberType[] = ['avatar_decoration', 'profile_card', 'name_effect', 'title', 'entry_effect']

export const tierRank = (t: MemberTier) => (t === 'creciente' ? 1 : t === 'llena' ? 2 : 3)
/** Lo que se desbloquea en un nivel (incluye lo de los niveles de abajo) */
export const itemsUpToTier = (t: MemberTier) => MEMBER_ITEMS.filter((i) => tierRank(i.tier) <= tierRank(t))
