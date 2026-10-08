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

// ───────── v0.13.5: validación del "nombre de personaje" con ejemplo ─────────
// El campo es para el NOMBRE DE ESTUDIANTE (nombre y apellido), no para un usuario tipo "Kai_panzer".
export const NAME_EXAMPLE = 'Ren Shiraishi'
export const NAME_PLACEHOLDER = `Ej: ${NAME_EXAMPLE}`
export const NAME_HELP = `Escribe tu nombre y apellido de estudiante, como en el ejemplo (${NAME_EXAMPLE}). Tu usuario (@) va en el campo de abajo.`

export type NameCheck = {
  /** Si hay error, no se puede continuar */
  error: string | null
  /** Aviso amable que NO bloquea */
  warning: string | null
}

/** Revisa el nombre de personaje. `username` es opcional: sirve para avisar si ambos son iguales. */
export function checkStudentName(raw: string, username?: string): NameCheck {
  const name = raw.trim().replace(/\s+/g, ' ')
  if (name.length === 0) return { error: null, warning: null } // vacío: lo pide el propio campo (required)

  if (name.includes('_')) {
    return {
      error: `Eso parece un usuario (tiene guion bajo). Aquí va tu nombre de estudiante, por ejemplo: ${NAME_EXAMPLE}.`,
      warning: null,
    }
  }
  if (hasFancyCharacters(name)) return { error: FANCY_NAME_ERROR, warning: null }
  if ((name.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) ?? []).length < 2) {
    return { error: 'El nombre debe tener al menos 2 letras.', warning: null }
  }
  if (name.length > 30) return { error: 'El nombre es muy largo: máximo 30 caracteres.', warning: null }

  if (username && name.toLowerCase().replace(/[ .'-]/g, '') === username.trim().toLowerCase().replace(/[._]/g, '')) {
    return { error: null, warning: `Tu nombre y tu usuario son iguales. Intenta poner tu nombre de estudiante, como ${NAME_EXAMPLE}.` }
  }
  if (/\d/.test(name)) {
    return { error: null, warning: `Tiene números. Si es tu nombre de estudiante, perfecto; si no, usa uno como ${NAME_EXAMPLE}.` }
  }
  if (!name.includes(' ')) {
    return { error: null, warning: `¿Es solo un nombre? Si puedes, agrega tu apellido, como ${NAME_EXAMPLE}.` }
  }
  return { error: null, warning: null }
}
