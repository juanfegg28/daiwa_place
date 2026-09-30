// Filtro para el nombre de personaje: bloquea fuentes "aesthetic" (Unicode
// matemático, fullwidth, góticas, etc. — el típico texto que se copia y pega
// de generadores de fuentes). Solo deja letras normales (con tildes/ñ),
// números, espacios y un poco de puntuación básica.
const ALLOWED_NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9 .'-]*$/

export function hasFancyCharacters(text: string): boolean {
  return text.length > 0 && !ALLOWED_NAME_REGEX.test(text)
}

export const FANCY_NAME_ERROR =
  'Por favor, usa letras normales y sin símbolos especiales. Podrás decorar tu perfil más adelante.'
