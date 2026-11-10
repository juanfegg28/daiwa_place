// v1.9.0 · Encuestas. Los votos se validan en Supabase (RLS + clave primaria): aquí solo se llama y se muestra.
import { supabase } from './supabaseClient'

export type PollOption = { id: string; pos: number; label: string; votes: number }
export type PostPoll = { id: string; question: string | null; endsAt: string; options: PollOption[]; myOption: string | null }
export type PollDraft = { question: string; options: string[]; hours: number }

export const MAX_POLL_OPTIONS = 6
export const MAX_OPTION_LEN = 60
export const MAX_QUESTION_LEN = 140
export const POLL_DURATIONS = [
  { label: '1 hora', hours: 1 },
  { label: '6 horas', hours: 6 },
  { label: '1 día', hours: 24 },
  { label: '3 días', hours: 72 },
  { label: '7 días', hours: 168 },
] as const
export const EMPTY_POLL: PollDraft = { question: '', options: ['', ''], hours: 24 }

/** Convierte lo que devuelve la consulta (objeto, arreglo de 1 o nulo) en una encuesta lista para mostrar. */
export function normalizePoll(raw: unknown): PostPoll | null {
  const r = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown> | null | undefined
  if (!r || typeof r !== 'object' || typeof r.id !== 'string' || typeof r.ends_at !== 'string') return null
  const rawOpts = Array.isArray(r.poll_options) ? (r.poll_options as Record<string, unknown>[]) : []
  const options: PollOption[] = []
  for (const o of rawOpts) {
    if (typeof o?.id === 'string' && typeof o.label === 'string') options.push({ id: o.id, pos: Number(o.pos) || 0, label: o.label, votes: Number(o.votes) || 0 })
  }
  if (options.length < 2) return null
  options.sort((a, b) => a.pos - b.pos)
  const mine = Array.isArray(r.poll_votes) ? (r.poll_votes as { option_id?: unknown }[])[0]?.option_id : null
  return {
    id: r.id,
    question: typeof r.question === 'string' && r.question.trim() ? r.question : null,
    endsAt: r.ends_at,
    options,
    myOption: typeof mine === 'string' ? mine : null,
  }
}

export function isPollOpen(p: { endsAt: string }): boolean {
  return new Date(p.endsAt).getTime() > Date.now()
}

/** «Cierra en 3 h», «Cierra en 25 min», «Encuesta cerrada» */
export function pollTimeLeft(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now()
  if (ms <= 0) return 'Encuesta cerrada'
  const min = Math.ceil(ms / 60000)
  if (min < 60) return `Cierra en ${min} min`
  const h = Math.floor(min / 60)
  if (h < 48) return `Cierra en ${h} h`
  return `Cierra en ${Math.floor(h / 24)} días`
}

/** Porcentajes que siempre suman 100 (método del mayor resto) */
export function pollPercents(votes: number[]): number[] {
  const total = votes.reduce((a, b) => a + b, 0)
  if (total <= 0) return votes.map(() => 0)
  const raw = votes.map((v) => (v * 100) / total)
  const out = raw.map(Math.floor)
  let rest = 100 - out.reduce((a, b) => a + b, 0)
  const order = raw.map((r, i) => ({ i, f: r - Math.floor(r) })).sort((a, b) => b.f - a.f)
  for (let k = 0; rest > 0 && k < order.length; k++, rest--) out[order[k].i]++
  return out
}

export function cleanPollOptions(opts: string[]): string[] {
  return opts.map((o) => o.replace(/\s+/g, ' ').trim()).filter(Boolean)
}

/** Texto del error si la encuesta del borrador no se puede publicar; null si está bien */
export function pollDraftError(d: PollDraft): string | null {
  const opts = cleanPollOptions(d.options)
  if (opts.length < 2) return 'Una encuesta necesita al menos 2 opciones con texto'
  if (new Set(opts.map((o) => o.toLowerCase())).size !== opts.length) return 'Hay opciones repetidas en la encuesta'
  return null
}

export async function votePoll(
  pollId: string,
  optionId: string
): Promise<{ result: { myOption: string; options: { id: string; votes: number }[] } | null; error: string }> {
  const { data, error } = await supabase.rpc('poll_vote', { p_poll: pollId, p_option: optionId })
  if (error) return { result: null, error: error.message }
  const d = data as { my_option?: string; options?: { id: string; votes: number }[] } | null
  return { result: { myOption: d?.my_option ?? optionId, options: d?.options ?? [] }, error: '' }
}

/** Crea la encuesta de una publicación recién publicada. Devuelve el texto del error, o '' si salió bien. */
export async function createPoll(postId: string, d: PollDraft, question: string | null): Promise<string> {
  const { error } = await supabase.rpc('poll_create', {
    p_post: postId,
    p_question: question && question.trim() ? question.trim() : null,
    p_options: cleanPollOptions(d.options),
    p_hours: d.hours,
  })
  return error ? error.message : ''
}
