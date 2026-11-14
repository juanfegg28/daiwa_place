// v1.10.0 · Tono de las tarjetas de perfil SIN cargar el kit de cosméticos (≈650 KB de JavaScript).
// El Perfil solo necesita saber si la tarjeta equipada es CLARA (texto oscuro) o no; antes importaba el kit entero para eso.
// Esta lista debe coincidir con las tarjetas `tone: 'light'` de _kit/cards: kit.ts lo comprueba en desarrollo y avisa en la consola si no coincide.
export const LIGHT_CARD_SLUGS: ReadonlySet<string> = new Set(['cuaderno-kawaii', 'cielo-de-algodon', 'pergamino-y-tinta'])

export const cardTone = (slug: string): 'light' | 'dark' => (LIGHT_CARD_SLUGS.has(slug) ? 'light' : 'dark')
