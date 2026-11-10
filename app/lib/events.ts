// v1.9.0 · Calendario de eventos (oficiales y de club). Las reglas (quién puede crear, asistencia) viven en Supabase.
import { supabase } from './supabaseClient'

export type EventStatus = 'going' | 'maybe' | null
export type EventRow = {
  id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string | null
  location: string | null
  link_url: string | null
  kind: 'oficial' | 'club'
  club_id: string | null
  club_name: string | null
  club_slug: string | null
  club_color: string | null
  created_by: string | null
  going_count: number
  maybe_count: number
  my_status: EventStatus
  cancelled: boolean
  can_manage: boolean
}

export type EventInput = {
  id?: string | null
  title: string
  description: string
  startsAt: string // ISO
  endsAt: string | null // ISO
  location: string
  link: string
  kind: 'oficial' | 'club'
  clubId: string | null
}

export async function listEvents(opts: { from?: Date | null; to?: Date | null; club?: string | null; limit?: number } = {}): Promise<{ events: EventRow[]; error: string }> {
  const { data, error } = await supabase.rpc('events_list', {
    p_from: opts.from ? opts.from.toISOString() : null,
    p_to: opts.to ? opts.to.toISOString() : null,
    p_club: opts.club ?? null,
    p_limit: opts.limit ?? 60,
  })
  if (error) return { events: [], error: error.message }
  return { events: (data as EventRow[] | null) ?? [], error: '' }
}

export async function saveEvent(i: EventInput): Promise<{ id: string | null; error: string }> {
  const { data, error } = await supabase.rpc('event_save', {
    p_id: i.id ?? null,
    p_title: i.title,
    p_description: i.description,
    p_starts: i.startsAt,
    p_ends: i.endsAt,
    p_location: i.location,
    p_link: i.link,
    p_kind: i.kind,
    p_club: i.kind === 'club' ? i.clubId : null,
  })
  if (error) return { id: null, error: error.message }
  return { id: (data as string | null) ?? null, error: '' }
}

export async function rsvpEvent(id: string, status: 'going' | 'maybe' | 'none'): Promise<{ result: { my_status: EventStatus; going: number; maybe: number } | null; error: string }> {
  const { data, error } = await supabase.rpc('event_rsvp', { p_event: id, p_status: status })
  if (error) return { result: null, error: error.message }
  return { result: data as { my_status: EventStatus; going: number; maybe: number }, error: '' }
}

export async function cancelEvent(id: string, cancel: boolean): Promise<string> {
  const { error } = await supabase.rpc('event_cancel', { p_id: id, p_cancel: cancel })
  return error ? error.message : ''
}

export async function deleteEvent(id: string): Promise<string> {
  const { error } = await supabase.rpc('event_delete', { p_id: id })
  return error ? error.message : ''
}

/* ───────── fechas (siempre en la hora del dispositivo) ───────── */

const fmtDay = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' })
const fmtDayShort = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' })
const fmtTime = new Intl.DateTimeFormat('es', { hour: 'numeric', minute: '2-digit' })
const fmtMonth = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' })

export const pad2 = (n: number) => String(n).padStart(2, '0')
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
export const monthLabel = (d: Date) => fmtMonth.format(d)
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const sameDay = (a: Date, b: Date) => dayKey(a) === dayKey(b)

/** Fin efectivo: si no se puso hora de fin, se cuentan 2 horas */
export const eventEnd = (e: Pick<EventRow, 'starts_at' | 'ends_at'>) => (e.ends_at ? new Date(e.ends_at) : new Date(new Date(e.starts_at).getTime() + 2 * 3600_000))
export const isEventOver = (e: Pick<EventRow, 'starts_at' | 'ends_at'>) => eventEnd(e).getTime() < Date.now()
export const isEventLive = (e: Pick<EventRow, 'starts_at' | 'ends_at'>) => new Date(e.starts_at).getTime() <= Date.now() && !isEventOver(e)

export function dayHeading(d: Date): string {
  const today = startOfDay(new Date())
  const diff = Math.round((startOfDay(d).getTime() - today.getTime()) / 86400000)
  const base = fmtDay.format(d)
  const cap = base.charAt(0).toUpperCase() + base.slice(1)
  if (diff === 0) return `Hoy · ${cap}`
  if (diff === 1) return `Mañana · ${cap}`
  return cap
}

export function eventWhen(e: Pick<EventRow, 'starts_at' | 'ends_at'>): string {
  const s = new Date(e.starts_at)
  const t = fmtTime.format(s)
  if (!e.ends_at) return `${fmtDayShort.format(s)} · ${t}`
  const en = new Date(e.ends_at)
  return sameDay(s, en) ? `${fmtDayShort.format(s)} · ${t} – ${fmtTime.format(en)}` : `${fmtDayShort.format(s)} ${t} → ${fmtDayShort.format(en)} ${fmtTime.format(en)}`
}

export function eventCountdown(e: Pick<EventRow, 'starts_at' | 'ends_at'>): string {
  if (isEventOver(e)) return 'Terminó'
  if (isEventLive(e)) return 'En curso ahora'
  const min = Math.round((new Date(e.starts_at).getTime() - Date.now()) / 60000)
  if (min < 60) return `Empieza en ${Math.max(1, min)} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Empieza en ${h} h`
  const d = Math.floor(h / 24)
  return d === 1 ? 'Empieza mañana' : `Faltan ${d} días`
}

/** <input type="datetime-local"> ⇄ ISO */
export function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}
export function fromLocalInput(v: string): string | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** Enlace para añadirlo al Google Calendar de la persona (sin pedir nada a nadie) */
export function googleCalendarUrl(e: EventRow): string {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${f(new Date(e.starts_at))}/${f(eventEnd(e))}`,
    details: [e.description ?? '', e.link_url ?? ''].filter(Boolean).join('\n\n'),
    location: e.location ?? '',
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

/** Celdas del mes (semana desde el lunes). Devuelve fechas locales; las de relleno traen `inMonth: false`. */
export function monthCells(anchor: Date): { date: Date; inMonth: boolean }[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset)
  const cells: { date: Date; inMonth: boolean }[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    cells.push({ date: d, inMonth: d.getMonth() === anchor.getMonth() })
  }
  return cells
}
