// Clubes y Pandillas (v1.1.0): tipos, textos y utilidades compartidas.

export type ClubKind = 'club' | 'pandilla'

export const CLUB_KIND_LABEL: Record<ClubKind, string> = { club: 'Club', pandilla: 'Pandilla' }

export const CLUB_NAME_MIN = 3
export const CLUB_NAME_MAX = 40
export const CLUB_DESC_MAX = 600
export const CLUB_ANNOUNCEMENT_MAX = 400
export const CLUB_ROLE_NAME_MAX = 24
export const CLUB_MAX_ROLES = 12
export const CLUB_DETAILS_MAX = 500

/** Colores para elegir (líder del club y roles internos). Todos legibles sobre fondo oscuro y claro. */
export const CLUB_PALETTE = [
  '#7c8cff', // azul violeta
  '#38bdf8', // celeste
  '#2dd4bf', // turquesa
  '#4ade80', // verde
  '#facc15', // amarillo
  '#fb923c', // naranja
  '#f472b6', // rosa
  '#c084fc', // lila
] as const

export const DEFAULT_CLUB_COLOR = CLUB_PALETTE[0]

/** Las reglas que se muestran (y hay que aceptar) antes de pedir un club o pandilla */
export const CLUB_REQUEST_RULES =
  'Debes ser el líder oficial. El grupo ya debe estar oficializado en el servidor de Discord y en el rol de Gakuran. Esta solicitud es solo para crear la página web del club, no para fundarlo en el rol.'

/** Aviso del botón «Solicitar unirse» */
export const CLUB_JOIN_WARNING =
  'Antes de pedir unirte, tienes que haber coordinado tu ingreso por Discord con el líder del grupo. Si no, tu solicitud será ignorada.'

export type ClubMembershipTag = {
  joined_at?: string
  clubs: { slug: string; name: string; kind: ClubKind; color: string } | null
  club_roles: { name: string; color: string; is_leader: boolean } | null
}

export type ClubSummary = {
  id: string
  slug: string
  name: string
  kind: ClubKind
  description: string | null
  avatar_url: string | null
  banner_url: string | null
  color: string
  leader_id: string
  announcement: string | null
  announcement_updated_at: string | null
  created_at: string
}

export const CLUB_SUMMARY_SELECT =
  'id, slug, name, kind, description, avatar_url, banner_url, color, leader_id, announcement, announcement_updated_at, created_at'

export type ClubRole = { id: string; club_id: string; name: string; color: string; is_leader: boolean }

export type ClubMemberRow = {
  user_id: string
  role_id: string | null
  joined_at: string
  profiles: { username: string; id_student: string | null; avatar_url: string | null } | null
  club_roles: { name: string; color: string; is_leader: boolean } | null
}

export type ClubRequestRow = {
  id: string
  requester_id: string
  club_name: string
  kind: ClubKind
  details: string | null
  status: 'pending' | 'approved' | 'declined' | 'completed'
  decline_reason: string | null
  created_at: string
  club_id: string | null
}

/** Mezcla una lista (Fisher-Yates). Se usa para que el descubrimiento de clubes cambie en cada recarga. */
export function shuffled<T>(list: T[]): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Pasa un color #rrggbb a rgba(...) con la transparencia que pidas (para fondos suaves de las etiquetas) */
export function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!m) return `rgba(124, 140, 255, ${alpha})`
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`
}

export function friendlyClubError(message: string | undefined | null): string {
  if (!message) return 'No se pudo completar la acción.'
  if (message.includes('Could not find the function') || message.includes('Could not find the table') || /relation ".*" does not exist/.test(message)) {
    return `Falta correr el SQL de la v1.1.0 en Supabase. Detalle: ${message}`
  }
  return message
}
