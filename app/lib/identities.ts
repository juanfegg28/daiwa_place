// Identidades (v1.1.10): la lista va en este orden exacto. Cada identidad especial desbloquea UN campo extra.

export const IDENTITIES = [
  'Hombre', 'Mujer', 'No binario', 'Género fluido', 'Agénero', 'Andrógino', 'Ángel', 'Demonio', 'Bruja',
  'Hombre lobo', 'Hada', 'Ángel caído', 'Entidad', 'Alien', 'Doll', 'Estrella', 'Diva', 'NPC', 'Supernova',
  'Batman', 'Fantasma', 'Vampiro/a',
] as const

export type Identity = (typeof IDENTITIES)[number]

// Identidades «comunes»: se muestran como un chip más (solo el nombre). Las demás son especiales y llevan tarjeta + sello.
export const COMMON_IDENTITIES: readonly string[] = ['Hombre', 'Mujer', 'No binario', 'Género fluido', 'Agénero', 'Andrógino']

export function isCommonIdentity(identity: string | null | undefined): boolean {
  return !!identity && COMMON_IDENTITIES.includes(identity)
}

export type IdentityVisibility = 'todos' | 'seguidores' | 'nadie'
export const IDENTITY_VISIBILITY_OPTIONS: { id: IdentityVisibility; label: string }[] = [
  { id: 'todos', label: 'Todas las personas' },
  { id: 'seguidores', label: 'Solo mis seguidores' },
  { id: 'nadie', label: 'Nadie (solo yo)' },
]

export type IdentityField = {
  label: string
  type: 'text' | 'number' | 'date' | 'select'
  placeholder?: string
  options?: string[]
  max?: number
}

export const IDENTITY_FIELDS: Partial<Record<Identity, IdentityField>> = {
  'Vampiro/a': { label: 'Año de conversión', type: 'number', placeholder: 'Ej: 1897', max: 6 },
  Batman: { label: 'Ciudad protegida', type: 'text', placeholder: 'Ej: Ciudad Gótica', max: 60 },
  'Ángel caído': { label: 'Motivo de la caída', type: 'text', placeholder: 'Ej: Amó demasiado', max: 80 },
  Alien: { label: 'Planeta natal', type: 'text', placeholder: 'Ej: Kepler-442b', max: 60 },
  Doll: { label: 'Tipo de muñeca', type: 'text', placeholder: 'Ej: Porcelana', max: 60 },
  Estrella: { label: 'Constelación de origen', type: 'text', placeholder: 'Ej: Orión', max: 60 },
  Entidad: { label: 'Nivel de clasificación', type: 'select', options: ['Clase I', 'Clase II', 'Clase III', 'Clase IV', 'Clase V'] },
  'Hombre lobo': {
    label: 'Fase lunar favorita',
    type: 'select',
    options: ['Luna nueva', 'Luna creciente', 'Cuarto creciente', 'Gibosa creciente', 'Luna llena', 'Gibosa menguante', 'Cuarto menguante', 'Luna menguante'],
  },
  Fantasma: { label: 'Año de fallecimiento', type: 'number', placeholder: 'Ej: 1920', max: 6 },
  Diva: { label: 'Nivel de divismo', type: 'select', options: ['Principiante', 'Profesional', 'Icónica', 'Legendaria'] },
  NPC: { label: 'Diálogo predeterminado', type: 'text', placeholder: 'Ej: Bienvenido a la aldea', max: 80 },
  Supernova: { label: 'Fecha de explosión', type: 'date' },
}

export function identityField(identity: string | null | undefined): IdentityField | null {
  if (!identity) return null
  return IDENTITY_FIELDS[identity as Identity] ?? null
}

/** Cómo se muestra el valor del campo especial (las fechas se escriben en español) */
export function formatIdentityDetail(identity: string | null | undefined, detail: string | null | undefined): string {
  if (!detail) return ''
  if (identityField(identity)?.type === 'date') {
    const d = new Date(`${detail}T12:00:00`)
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  return detail
}
