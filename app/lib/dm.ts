// Tipos y utilidades de los mensajes directos y las notas.
import { supabase } from './supabaseClient'

export const REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'] as const
export const MAX_MESSAGE_LENGTH = 2000
export const MAX_NICKNAME_LENGTH = 30
export const MAX_NOTE_LENGTH = 60
export const PENDING_LIMIT = 3
export const PAGE_SIZE = 40

export type ConversationStatus = 'pending' | 'accepted' | 'declined'

export type InboxItem = {
  conversation_id: string
  status: ConversationStatus
  initiator_id: string
  other_id: string
  other_username: string
  other_id_student: string | null
  other_avatar_url: string | null
  nickname: string | null
  last_message_at: string
  last_content: string | null
  last_sender_id: string | null
  last_deleted: boolean
  unread_count: number
}

export type ChatInfo = {
  conversation_id: string
  status: ConversationStatus
  initiator_id: string
  other_id: string
  other_username: string
  other_id_student: string | null
  other_avatar_url: string | null
  nickname: string | null
  hidden_at: string | null
  other_read_at: string | null
  i_blocked: boolean
  blocked: boolean
  other_frozen: boolean
}

export type DmReaction = { user_id: string; emoji: string }

export type DmMessage = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  reply_to_id: string | null
  created_at: string
  edited_at: string | null
  deleted_at: string | null
  message_reactions: DmReaction[]
  reply: { id: string; content: string; sender_id: string; deleted_at: string | null; image_path?: string | null } | null
  /** Foto que se autodestruye (v1.1.0): ruta dentro del bucket privado «dm-images» */
  image_path?: string | null
  image_w?: number | null
  image_h?: number | null
  /** Duración elegida: 1, 4, 8, 12 o 24 horas */
  image_hours?: number | null
  /** Cuándo desaparece la foto (la calcula la base de datos al enviar) */
  expires_at?: string | null
  /** Cuándo el cron job borró de verdad el archivo del Storage */
  image_purged_at?: string | null
  /** Solo en el navegador: mensaje que todavía se está enviando o falló */
  pending?: 'sending' | 'failed'
  /** Solo en el navegador: vista previa local de la foto mientras se sube */
  localPreview?: string
}

export type NoteItem = {
  id: string
  user_id: string
  content: string
  music: unknown
  created_at: string
  expires_at: string
  profiles: { username: string; id_student: string | null; avatar_url: string | null } | null
  note_likes: { user_id: string }[]
}

export const MESSAGE_SELECT =
  'id, conversation_id, sender_id, content, reply_to_id, created_at, edited_at, deleted_at, image_path, image_w, image_h, image_hours, expires_at, image_purged_at, message_reactions(user_id, emoji), reply:reply_to_id(id, content, sender_id, deleted_at, image_path)'

// ───────── Fotos que se autodestruyen (v1.1.0) ─────────
// Las fotos viven en el bucket PRIVADO «dm-images» (ruta: <conversación>/<quien la manda>/<archivo>.jpg) y la
// pantalla las pide con enlaces firmados de corta vida. Cada mensaje con foto guarda `expires_at`; cuando llega
// esa hora el chat deja de mostrarla y la base de datos deja de entregarla.
// NOTA: el borrado REAL del archivo en Supabase Storage lo hace un cron job de Supabase que lee `expires_at`
// y llama a /api/cron/dm-purge (ver el SQL de la v1.1.0, sección 2.6). Aquí en el navegador solo se oculta.
export const DM_IMAGE_BUCKET = 'dm-images'
export const DM_IMAGE_DURATIONS = [1, 4, 8, 12, 24] as const
export type DmImageHours = (typeof DM_IMAGE_DURATIONS)[number]

export function imageDurationLabel(hours: number) {
  return hours === 1 ? '1 hora' : `${hours} horas`
}

/** ¿La foto de este mensaje ya se autodestruyó? */
export function isImageGone(m: Pick<DmMessage, 'image_path' | 'expires_at' | 'image_purged_at'>, now = Date.now()) {
  if (!m.image_path) return false
  if (m.image_purged_at) return true
  return !!m.expires_at && new Date(m.expires_at).getTime() <= now
}

/** «3 h 12 min», «45 min», «menos de 1 min» */
export function remainingLabel(expiresAt: string, now = Date.now()) {
  const ms = new Date(expiresAt).getTime() - now
  if (ms <= 0) return 'ahora'
  const totalMin = Math.ceil(ms / 60000)
  if (totalMin < 2) return 'menos de 1 min'
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

/** Texto corto de un mensaje para respuestas y avisos: si es solo una foto, «📷 Foto» */
export function messageSnippet(m: { content: string; image_path?: string | null }, max = 60) {
  const text = previewText(m.content, max)
  if (m.image_path && !text) return '📷 Foto'
  return m.image_path ? `📷 ${text}` : text
}

export const NOTE_SELECT =
  'id, user_id, content, music, created_at, expires_at, profiles!notes_user_id_fkey(username, id_student, avatar_url), note_likes(user_id)'

/** Nombre que se muestra: el apodo que tú le pusiste, o su nombre de personaje, o su @usuario. */
export function displayName(p: { nickname?: string | null; id_student?: string | null; username: string }) {
  return p.nickname?.trim() || p.id_student?.trim() || p.username
}

export function previewText(text: string | null | undefined, max = 60) {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean
}

export function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function dayLabel(iso: string) {
  const d = new Date(iso)
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000)
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return d.toLocaleDateString('es-ES', { weekday: 'long' })
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' })
}

export function sameDay(a: string, b: string) {
  return startOfDay(new Date(a)) === startOfDay(new Date(b))
}

export function inboxTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} d`
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

/** Traduce los errores de Supabase a algo que se entienda. */
export function friendlyDmError(message: string | undefined | null): string {
  if (!message) return 'No se pudo completar la acción.'
  if (message.includes('row-level security')) {
    return `No se pudo enviar. Si es una solicitud de mensaje, solo puedes mandar ${PENDING_LIMIT} mensajes hasta que la otra persona la acepte. También puede que haya un bloqueo de por medio.`
  }
  // Solo se culpa al SQL cuando de verdad falta una función o una tabla
  if (message.includes('Could not find the function') || message.includes('Could not find the table') || /relation ".*" does not exist/.test(message)) {
    return `Falta correr el SQL de la v0.12.0 en Supabase (o recargar el esquema). Detalle: ${message}`
  }
  return `No se pudo completar la acción. Detalle técnico: ${message}`
}

/** Abre (o crea) el chat con alguien. Devuelve el id de la conversación o un mensaje de error. */
export async function startConversation(otherId: string): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('dm_start', { p_other: otherId })
  if (error || !data) return { id: null, error: friendlyDmError(error?.message) }
  return { id: data as string, error: null }
}

/** Junta lo que hay en dos listas para que no se repita nada (gana la versión nueva). */
export function mergeById<T extends { id: string }>(current: T[], incoming: T[], sortKey: (x: T) => number): T[] {
  const map = new Map(current.map((x) => [x.id, x]))
  for (const x of incoming) map.set(x.id, x)
  return [...map.values()].sort((a, b) => sortKey(a) - sortKey(b))
}
