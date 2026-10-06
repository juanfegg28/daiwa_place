// Muro de los Susurros: tipos, textos y utilidades compartidas.
import { supabase } from './supabaseClient'

export const ANON_NAME = 'Chismoso Anónimo'
export const MIN_WHISPER_LENGTH = 5
export const MAX_WHISPER_LENGTH = 1000
export const MAX_COMMENT_LENGTH = 500
export const WHISPER_PAGE_SIZE = 15

export const WHISPER_CATEGORIES = [
  { id: 'confesion', label: 'Confesión' },
  { id: 'crush', label: 'Crush' },
  { id: 'chisme', label: 'Chisme' },
  { id: 'pregunta', label: 'Pregunta' },
  { id: 'otro', label: 'Otro' },
] as const

export type WhisperCategory = (typeof WHISPER_CATEGORIES)[number]['id']

export function categoryLabel(id: string): string {
  return WHISPER_CATEGORIES.find((c) => c.id === id)?.label ?? 'Confesión'
}

export const REPORT_REASONS = [
  { id: 'ofensivo', label: 'Es muy duro u ofensivo' },
  { id: 'acoso', label: 'Acoso o burla hacia alguien' },
  { id: 'datos_personales', label: 'Muestra datos personales o identifica a alguien' },
  { id: 'odio', label: 'Discriminación o discurso de odio' },
  { id: 'spam', label: 'Spam o engaño' },
  { id: 'otro', label: 'Otro motivo' },
] as const

export type ReportReason = (typeof REPORT_REASONS)[number]['id']

export function reasonLabel(id: string): string {
  return REPORT_REASONS.find((r) => r.id === id)?.label ?? id
}

export type WhisperStatus = 'visible' | 'hidden' | 'removed'

export type WhisperItem = {
  id: string
  content: string
  category: string
  created_at: string
  score: number
  comment_count: number
  status: WhisperStatus
  removed_by_author: boolean
  /** Solo trae TU voto (la base de datos no deja ver los de nadie más) */
  whisper_votes: { value: number }[]
  /** Solo trae una fila si la confesión es tuya */
  whisper_authors: { user_id: string }[]
}

export type WhisperComment = {
  id: string
  whisper_id: string
  parent_comment_id: string | null
  content: string
  is_anonymous: boolean
  author_id: string | null
  anon_n: number | null
  is_op: boolean
  status: WhisperStatus
  deleted_at: string | null
  created_at: string
  profiles: { username: string; id_student: string | null; avatar_url: string | null } | null
  /** Solo trae una fila si el comentario es tuyo */
  whisper_comment_authors: { user_id: string }[]
}

export const WHISPER_SELECT =
  'id, content, category, created_at, score, comment_count, status, removed_by_author, whisper_votes(value), whisper_authors(user_id)'

/** Igual que WHISPER_SELECT, pero con inner join: solo devuelve las confesiones que son tuyas */
export const MY_WHISPER_SELECT =
  'id, content, category, created_at, score, comment_count, status, removed_by_author, whisper_votes(value), whisper_authors!inner(user_id)'

export const COMMENT_SELECT =
  'id, whisper_id, parent_comment_id, content, is_anonymous, author_id, anon_n, is_op, status, deleted_at, created_at, profiles!whisper_comments_author_id_fkey(username, id_student, avatar_url), whisper_comment_authors(user_id)'

export function isMineWhisper(w: WhisperItem) {
  return w.whisper_authors.length > 0
}

export function myVoteOf(w: WhisperItem): number {
  return w.whisper_votes[0]?.value ?? 0
}

/** Nombre del comentario: "Chismoso Anónimo #2" (el autor de la confesión no lleva número, lleva insignia) */
export function anonCommentName(c: Pick<WhisperComment, 'anon_n'>): string {
  return c.anon_n ? `${ANON_NAME} #${c.anon_n}` : ANON_NAME
}

export function friendlyWhisperError(message: string | undefined | null): string {
  if (!message) return 'No se pudo completar la acción.'
  if (
    message.includes('Could not find the function') ||
    message.includes('Could not find the table') ||
    /relation ".*" does not exist/.test(message) ||
    message.includes('permission denied for table')
  ) {
    return `Falta correr el SQL de la v0.13.0 en Supabase. Detalle: ${message}`
  }
  if (message.includes('Could not find a relationship') || message.includes('Could not embed')) {
    return `No se pudo leer el Muro. Detalle técnico: ${message}`
  }
  return message
}

export async function sendVote(whisperId: string, value: number): Promise<{ score: number | null; error: string | null }> {
  const { data, error } = await supabase.rpc('whisper_vote', { p_whisper: whisperId, p_value: value })
  if (error) return { score: null, error: friendlyWhisperError(error.message) }
  return { score: typeof data === 'number' ? data : null, error: null }
}

/** Qué cosas ya reporté (confesiones y comentarios), para no dejar reportar dos veces */
export async function loadMyReports(): Promise<{ whispers: Set<string>; comments: Set<string> }> {
  const { data } = await supabase.rpc('whisper_my_reports')
  const whispers = new Set<string>()
  const comments = new Set<string>()
  for (const r of (data ?? []) as { whisper_id: string | null; comment_id: string | null }[]) {
    if (r.whisper_id) whispers.add(r.whisper_id)
    if (r.comment_id) comments.add(r.comment_id)
  }
  return { whispers, comments }
}
