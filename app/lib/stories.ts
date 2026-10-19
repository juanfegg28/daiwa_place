// Historias de 24 horas (v1.2.0): tipos, constantes y llamadas a Supabase.
//
// Formato (importante): la foto se «hornea» en el navegador a 1080×1920 y vive en el bucket PRIVADO
// «story-media». Todo lo demás (texto, emojis, música, ubicación y hora) son capas en JSON que se dibujan
// encima. Todo se mide RELATIVO al escenario 9:16: posición en % del ancho/alto (referida al centro del
// elemento) y tamaños en «cqw» (1 cqw = 1 % del ancho del escenario). Así se ve idéntico en cualquier pantalla.
import { supabase } from './supabaseClient'
import { normalizeTrack, type MusicTrack } from './music'

export const STORY_BUCKET = 'story-media'
export const COVER_BUCKET = 'highlight-covers'
export const MAX_ELEMENTS = 20
export const MAX_TEXT_CHARS = 220
export const MAX_LOCATION_CHARS = 40
export const STORY_W = 1080
export const STORY_H = 1920
export const MAX_REPLY_CHARS = 500
export const MAX_HIGHLIGHT_STORIES = 50
export const MAX_HIGHLIGHTS = 20
/** Días que el dueño conserva sus historias vencidas en su archivo privado (lo manda el servidor; esto es solo para los textos) */
export const STORY_ARCHIVE_DAYS = 30

// ───────── Tipos de las capas ─────────

export type StoryBg =
  | { type: 'gradient'; id: string; colors: string[]; angle: number }
  | { type: 'solid'; color: string }

type Base = { id: string; x: number; y: number; scale: number; rotation: number; z: number }

export type TextFont = 'clasica' | 'maquina' | 'elegante' | 'fuerte' | 'manuscrita' | 'cinzel' | 'neon' | 'marcador'
export type TextBgMode = 'none' | 'solid' | 'soft' | 'outline'

export type StoryText = Base & {
  type: 'text'
  text: string
  font: TextFont
  align: 'left' | 'center' | 'right'
  color: string
  bgMode: TextBgMode
  bgColor?: string
  size: number
}
export type StoryEmoji = Base & { type: 'emoji'; emoji: string; size: number }
export type MusicStyle = 'cover-card' | 'pill' | 'vinyl' | 'minimal-text' | 'polaroid' | 'player'
export type MusicTheme = 'light' | 'dark' | 'accent' | 'cover'
export type StoryMusicEl = Base & { type: 'music'; style: MusicStyle; theme: MusicTheme }
export type LocationStyle = 'pill' | 'ribbon' | 'stamp' | 'glass'
export type LocationTheme = 'light' | 'dark' | 'accent' | 'color'
export type StoryLocation = Base & { type: 'location'; label: string; style: LocationStyle; theme: LocationTheme; color?: string }
export type TimeStyle = 'digital' | 'neon' | 'analog' | 'analog-gold' | 'flip' | 'ticket' | 'handwritten' | 'lock'
export type StoryTime = Base & {
  type: 'time'
  style: TimeStyle
  iso: string
  tz: string
  hour12: boolean
  showDate: 'none' | 'short' | 'long'
  showPeriod: boolean
  showZone: boolean
  color: string
}
export type StoryElement = StoryText | StoryEmoji | StoryMusicEl | StoryLocation | StoryTime

export type StoryKind = 'photo' | 'text'
export type StoryAudience = 'followers' | 'friends'

/** Una historia tal como la entrega la base de datos */
export type StoryRow = {
  id: string
  user_id: string
  kind: StoryKind
  media_path: string | null
  media_w: number | null
  media_h: number | null
  bg: StoryBg | null
  elements: StoryElement[]
  music: unknown
  music_start: number
  music_clip: number
  duration_ms: number
  audience: StoryAudience
  created_at: string
  expires_at: string
  is_active: boolean
  seen: boolean
  liked_by_me: boolean
  /** Solo si la historia es mía */
  view_count?: number
  like_count?: number
  in_highlight?: boolean
}

export type TrayEntry = {
  user_id: string
  username: string
  id_student: string | null
  avatar_url: string | null
  story_count: number
  unseen_count: number
  latest_at: string
  is_friend: boolean
  has_friends_only: boolean
  all_friends_only: boolean
  is_muted: boolean
  segments: { seen: boolean; friends: boolean }[]
}

export type Quota = { used: number; max: number; resetsAt: string | null }

export type Viewer = {
  user_id: string
  username: string
  id_student: string | null
  avatar_url: string | null
  viewed_at: string
  liked: boolean
  liked_at: string | null
  is_friend: boolean
}

export type HighlightCover = { type: 'image'; url: string } | { type: 'style'; id: string }
export type HighlightRow = { id: string; title: string; cover: HighlightCover; position: number; visible_count: number }

export type StoryOwner = { user_id: string; username: string; id_student: string | null; avatar_url: string | null; is_friend?: boolean }

// ───────── Paletas ─────────

export const BG_PRESETS: { id: string; name: string; colors: string[] }[] = [
  { id: 'atardecer', name: 'Atardecer', colors: ['#FF9A5A', '#E6435F', '#7A0F24'] },
  { id: 'granate', name: 'Granate', colors: ['#C81B3E', '#3A0712'] },
  { id: 'medianoche', name: 'Medianoche', colors: ['#312E81', '#0F172A'] },
  { id: 'oceano', name: 'Océano', colors: ['#22D3EE', '#3B82F6', '#1E1B4B'] },
  { id: 'bosque', name: 'Bosque', colors: ['#A7F3D0', '#059669', '#064E3B'] },
  { id: 'lavanda', name: 'Lavanda', colors: ['#E9D5FF', '#A78BFA', '#6D28D9'] },
  { id: 'algodon', name: 'Algodón', colors: ['#FBCFE8', '#F9A8D4', '#C4B5FD'] },
  { id: 'durazno', name: 'Durazno', colors: ['#FFE4D6', '#FDBA74', '#FB7185'] },
  { id: 'aurora', name: 'Aurora', colors: ['#34D399', '#38BDF8', '#8B5CF6'] },
  { id: 'neon', name: 'Neón', colors: ['#F0ABFC', '#7C3AED', '#0EA5E9'] },
  { id: 'cielo', name: 'Cielo', colors: ['#BAE6FD', '#E0F2FE', '#FDE68A'] },
  { id: 'ceniza', name: 'Ceniza', colors: ['#E5E7EB', '#6B7280', '#111827'] },
  { id: 'cafe', name: 'Café', colors: ['#D6B79A', '#7C4A2D', '#2B1810'] },
  { id: 'vino', name: 'Vino', colors: ['#7A0F24', '#2B0610'] },
  { id: 'menta', name: 'Menta', colors: ['#D1FAE5', '#6EE7B7'] },
  { id: 'sol', name: 'Sol', colors: ['#FEF08A', '#FB923C', '#E11D48'] },
]

export const SOLID_BGS = ['#FFFFFF', '#0C0C0F', '#A3122E', '#3B82F6', '#059669', '#FDE047', '#F9A8D4', '#6B7280']
export const DEFAULT_BG_ANGLE = 160

export const TEXT_COLORS = [
  '#FFFFFF', '#0C0C0F', '#E6435F', '#F38BA0', '#F59E0B', '#FDE047', '#A3E635',
  '#34D399', '#2DD4BF', '#38BDF8', '#3B82F6', '#8B5CF6', '#D946EF', '#FDBA74',
]

export const TEXT_FONTS: { id: TextFont; label: string }[] = [
  { id: 'clasica', label: 'Clásica' },
  { id: 'maquina', label: 'Máquina' },
  { id: 'elegante', label: 'Elegante' },
  { id: 'fuerte', label: 'Fuerte' },
  { id: 'manuscrita', label: 'Manuscrita' },
  { id: 'cinzel', label: 'Cinzel' },
  { id: 'neon', label: 'Neón' },
  { id: 'marcador', label: 'Marcador' },
]

export const MUSIC_STYLES: { id: MusicStyle; label: string }[] = [
  { id: 'cover-card', label: 'Tarjeta' },
  { id: 'pill', label: 'Píldora' },
  { id: 'vinyl', label: 'Vinilo' },
  { id: 'minimal-text', label: 'Texto' },
  { id: 'polaroid', label: 'Polaroid' },
  { id: 'player', label: 'Reproductor' },
]
export const MUSIC_THEMES: { id: MusicTheme; label: string }[] = [
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
  { id: 'accent', label: 'Acento' },
  { id: 'cover', label: 'Carátula' },
]
export const LOCATION_STYLES: { id: LocationStyle; label: string }[] = [
  { id: 'pill', label: 'Píldora' },
  { id: 'ribbon', label: 'Cinta' },
  { id: 'stamp', label: 'Sello' },
  { id: 'glass', label: 'Vidrio' },
]
export const TIME_STYLES: { id: TimeStyle; label: string }[] = [
  { id: 'digital', label: 'Digital' },
  { id: 'neon', label: 'Neón' },
  { id: 'analog', label: 'Analógico' },
  { id: 'analog-gold', label: 'Dorado' },
  { id: 'flip', label: 'Tarjetas' },
  { id: 'ticket', label: 'Boleto' },
  { id: 'handwritten', label: 'Manuscrito' },
  { id: 'lock', label: 'Bloqueo' },
]

export const COVER_STYLES: { id: string; colors: string[]; icon: string; iconColor: string }[] = [
  { id: 'star', colors: ['#7A0F24', '#2B0610'], icon: '★', iconColor: '#F6C453' },
  { id: 'heart', colors: ['#FBCFE8', '#F9A8D4', '#C4B5FD'], icon: '♡', iconColor: '#FFFFFF' },
  { id: 'moon', colors: ['#312E81', '#0F172A'], icon: '☾', iconColor: '#FDE68A' },
  { id: 'plane', colors: ['#BAE6FD', '#38BDF8'], icon: '✈', iconColor: '#FFFFFF' },
  { id: 'note', colors: ['#C81B3E', '#3A0712'], icon: '♪', iconColor: '#FFFFFF' },
  { id: 'books', colors: ['#D6B79A', '#7C4A2D', '#2B1810'], icon: '📚', iconColor: '#FFFFFF' },
  { id: 'cap', colors: ['#E9D5FF', '#A78BFA', '#6D28D9'], icon: '🎓', iconColor: '#FFFFFF' },
  { id: 'sun', colors: ['#FEF08A', '#FB923C', '#E11D48'], icon: '☀', iconColor: '#FFFFFF' },
  { id: 'leaf', colors: ['#A7F3D0', '#059669', '#064E3B'], icon: '🌿', iconColor: '#FFFFFF' },
  { id: 'spark', colors: ['#34D399', '#38BDF8', '#8B5CF6'], icon: '✦', iconColor: '#FFFFFF' },
  { id: 'cup', colors: ['#FFE4D6', '#FDBA74', '#FB7185'], icon: '☕', iconColor: '#FFFFFF' },
  { id: 'camera', colors: ['#E5E7EB', '#6B7280', '#111827'], icon: '📷', iconColor: '#FFFFFF' },
]

// ───────── Utilidades de pintura ─────────

export function bgToCss(bg: StoryBg | null | undefined): string {
  if (!bg) return '#0C0C0F'
  if (bg.type === 'solid') return bg.color
  const colors = bg.colors?.length ? bg.colors : ['#C81B3E', '#3A0712']
  return `linear-gradient(${bg.angle ?? DEFAULT_BG_ANGLE}deg, ${colors.join(', ')})`
}

export function presetBg(id: string): StoryBg {
  const p = BG_PRESETS.find((x) => x.id === id) ?? BG_PRESETS[1]
  return { type: 'gradient', id: p.id, colors: p.colors, angle: DEFAULT_BG_ANGLE }
}

export function coverStyleCss(id: string): { background: string; icon: string; iconColor: string } {
  const s = COVER_STYLES.find((x) => x.id === id) ?? COVER_STYLES[0]
  return { background: `linear-gradient(160deg, ${s.colors.join(', ')})`, icon: s.icon, iconColor: s.iconColor }
}

/** Luminancia relativa (0 oscuro – 1 claro) de un color hex */
export function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0')
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Blanco o casi negro, el que dé contraste WCAG ≥ 4.5 sobre ese fondo */
export function readableOn(hex: string): string {
  const l = luminance(hex)
  const contrastWhite = 1.05 / (l + 0.05)
  const contrastBlack = (l + 0.05) / (luminance('#0C0C0F') + 0.05)
  return contrastWhite >= contrastBlack ? '#FFFFFF' : '#0C0C0F'
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Duración de una historia (ms): 6 s (+1 s por cada 60 caracteres, máx. 10 s); con música, lo que dura el fragmento */
export function computeDuration(textChars: number, hasMusic: boolean, clip: number): number {
  const base = Math.min(10000, 6000 + Math.floor(textChars / 60) * 1000)
  if (!hasMusic) return base
  return Math.max(clip * 1000, Math.min(15000, base))
}

// ───────── Formato de textos ─────────

/** «hace 3 h» */
export function storyAgo(iso: string, now = Date.now()): string {
  const min = Math.floor((now - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}

export function fullDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')
}

/** «4 h 20 min» hasta una fecha */
export function untilLabel(iso: string, now = Date.now()): string {
  const total = Math.max(1, Math.ceil((new Date(iso).getTime() - now) / 60000))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

export function ownerLabel(o: { id_student: string | null; username: string }): string {
  return o.id_student?.trim() || o.username
}

export function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** Las partes de la hora de una historia, con la zona horaria de QUIEN la publicó (así todos ven la misma hora) */
export function timeParts(el: Pick<StoryTime, 'iso' | 'tz' | 'hour12' | 'showDate' | 'showPeriod' | 'showZone'>) {
  const d = new Date(el.iso)
  const tz = el.tz || 'UTC'
  const safe = <T,>(fn: () => T, fallback: T): T => {
    try {
      return fn()
    } catch {
      return fallback
    }
  }
  const hm = safe(
    () =>
      new Intl.DateTimeFormat('es', { hour: 'numeric', minute: '2-digit', hourCycle: 'h23', timeZone: tz }).formatToParts(d),
    [] as Intl.DateTimeFormatPart[]
  )
  const h24 = Number(hm.find((p) => p.type === 'hour')?.value ?? 0) % 24
  const minute = Number(hm.find((p) => p.type === 'minute')?.value ?? 0)
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  const hourText = el.hour12 ? String(h12) : String(h24).padStart(2, '0')
  const mm = String(minute).padStart(2, '0')
  const period = h24 >= 12 ? 'p. m.' : 'a. m.'
  const dateShort = safe(
    () => new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz }).format(d).replace(/\./g, '').replace(',', ''),
    ''
  )
  const dateLongRaw = safe(
    () => new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz }).format(d),
    ''
  )
  const dateLong = dateLongRaw.charAt(0).toUpperCase() + dateLongRaw.slice(1)
  const zone = safe(
    () => new Intl.DateTimeFormat('es', { timeZoneName: 'shortOffset', timeZone: tz }).formatToParts(d).find((p) => p.type === 'timeZoneName')?.value ?? '',
    ''
  )
  return {
    hourText,
    minuteText: mm,
    time: `${hourText}:${mm}`,
    period: el.hour12 && el.showPeriod ? period : '',
    date: el.showDate === 'short' ? dateShort : el.showDate === 'long' ? dateLong : '',
    dateShort,
    dateLong,
    zone: el.showZone ? zone : '',
    h24,
    minute,
  }
}

// ───────── Errores ─────────

export function friendlyStoryError(message: string | undefined | null): string {
  if (!message) return 'No se pudo completar la acción.'
  if (/Failed to fetch|NetworkError|network/i.test(message)) return 'Parece que no hay internet. Revisa tu conexión e inténtalo de nuevo.'
  if (/Could not find the function|Could not find the table|does not exist/i.test(message)) {
    return 'Falta correr el SQL de la v1.2.0 en Supabase (o recargar el esquema).'
  }
  if (/exceeded the maximum allowed size|too large|413/i.test(message)) return 'La foto pesa demasiado. Prueba con otra.'
  if (/row-level security/i.test(message)) return 'No se pudo completar la acción. Puede que la historia ya no esté disponible.'
  return message
}

// ───────── Enlaces firmados (la foto es privada) ─────────

const urlCache = new Map<string, { url: string; exp: number }>()
const URL_TTL_MS = 50 * 60 * 1000

/** Pide enlaces firmados (1 h) en lote y los guarda ~50 min en memoria. */
export async function signedStoryUrls(paths: string[]): Promise<Record<string, string>> {
  const now = Date.now()
  const out: Record<string, string> = {}
  const need: string[] = []
  for (const p of Array.from(new Set(paths.filter(Boolean)))) {
    const hit = urlCache.get(p)
    if (hit && hit.exp > now) out[p] = hit.url
    else need.push(p)
  }
  if (need.length) {
    const { data } = await supabase.storage.from(STORY_BUCKET).createSignedUrls(need, 3600)
    for (const d of data ?? []) {
      if (d.path && d.signedUrl) {
        urlCache.set(d.path, { url: d.signedUrl, exp: now + URL_TTL_MS })
        out[d.path] = d.signedUrl
      }
    }
  }
  return out
}

export function peekSignedUrl(path: string | null | undefined): string | null {
  if (!path) return null
  const hit = urlCache.get(path)
  return hit && hit.exp > Date.now() ? hit.url : null
}

// ───────── Llamadas ─────────

function normalizeRow(raw: unknown): StoryRow {
  const r = raw as StoryRow
  return { ...r, elements: Array.isArray(r.elements) ? r.elements : [] }
}

export async function fetchQuota(): Promise<{ quota: Quota | null; error: string | null }> {
  const { data, error } = await supabase.rpc('story_quota')
  if (error) return { quota: null, error: friendlyStoryError(error.message) }
  const row = (Array.isArray(data) ? data[0] : data) as { used: number; max_per_day: number; resets_at: string | null } | null
  if (!row) return { quota: null, error: 'No se pudo leer tu cupo de historias.' }
  return { quota: { used: row.used, max: row.max_per_day, resetsAt: row.resets_at }, error: null }
}

export function quotaMessage(q: Quota): string {
  if (q.used >= q.max) {
    return q.resetsAt
      ? `Ya publicaste ${q.max} historias. Podrás publicar otra en ${untilLabel(q.resetsAt)}.`
      : `Ya publicaste ${q.max} historias hoy.`
  }
  const left = q.max - q.used
  return `Te quedan ${left} de ${q.max} historias`
}

export async function fetchTray(): Promise<{ tray: TrayEntry[]; error: string | null }> {
  const { data, error } = await supabase.rpc('stories_tray')
  if (error) return { tray: [], error: friendlyStoryError(error.message) }
  return { tray: ((data as TrayEntry[] | null) ?? []).map((t) => ({ ...t, segments: Array.isArray(t.segments) ? t.segments : [] })), error: null }
}

export async function fetchStoriesOf(userId: string): Promise<{ stories: StoryRow[]; error: string | null }> {
  const { data, error } = await supabase.rpc('stories_of_user', { p_user: userId })
  if (error) return { stories: [], error: friendlyStoryError(error.message) }
  return { stories: ((data as unknown[] | null) ?? []).map(normalizeRow), error: null }
}

export async function markStoryViewed(storyId: string) {
  await supabase.rpc('story_mark_viewed', { p_story: storyId })
}

export async function setStoryLike(storyId: string, userId: string, like: boolean): Promise<string | null> {
  if (like) {
    const { error } = await supabase.from('story_likes').insert({ story_id: storyId, user_id: userId })
    if (error && !/duplicate key/i.test(error.message)) return friendlyStoryError(error.message)
    return null
  }
  const { error } = await supabase.from('story_likes').delete().eq('story_id', storyId).eq('user_id', userId)
  return error ? friendlyStoryError(error.message) : null
}

export async function deleteStory(storyId: string): Promise<string | null> {
  const { error } = await supabase.rpc('story_delete', { p_story: storyId })
  return error ? friendlyStoryError(error.message) : null
}

export async function replyToStory(
  storyId: string,
  content: string
): Promise<{ ok: boolean; isRequest: boolean; error: string | null }> {
  const { data, error } = await supabase.rpc('story_reply', { p_story: storyId, p_content: content })
  if (error) return { ok: false, isRequest: false, error: friendlyStoryError(error.message) }
  const row = (Array.isArray(data) ? data[0] : data) as { is_request?: boolean } | null
  return { ok: true, isRequest: !!row?.is_request, error: null }
}

export async function fetchViewers(storyId: string, limit = 50, offset = 0): Promise<Viewer[]> {
  const { data } = await supabase.rpc('story_viewers', { p_story: storyId, p_limit: limit, p_offset: offset })
  return (data as Viewer[] | null) ?? []
}

export async function fetchActivityCounts(storyId: string): Promise<{ people: number; likes: number }> {
  const { data } = await supabase.rpc('story_activity_counts', { p_story: storyId })
  const row = (Array.isArray(data) ? data[0] : data) as { people?: number; likes?: number } | null
  return { people: row?.people ?? 0, likes: row?.likes ?? 0 }
}

export async function setStoryMute(userId: string, mute: boolean): Promise<string | null> {
  const { error } = await supabase.rpc('story_mute_toggle', { p_user: userId, p_mute: mute })
  return error ? friendlyStoryError(error.message) : null
}

export async function reportStory(storyId: string, reason: string, details: string): Promise<string | null> {
  const { error } = await supabase.rpc('story_report', { p_story: storyId, p_reason: reason, p_details: details || null })
  return error ? friendlyStoryError(error.message) : null
}

export async function fetchArchive(before: string | null = null, limit = 60): Promise<StoryRow[]> {
  const { data } = await supabase.rpc('story_archive', { p_limit: limit, p_before: before })
  return ((data as unknown[] | null) ?? []).map(normalizeRow)
}

export type StorySettings = { limit_per_day: number; archive_days: number; places: string[] }
const DEFAULT_PLACES = ['Biblioteca', 'Cafetería', 'Patio', 'Gimnasio', 'Salón de clases', 'Laboratorio']
export async function fetchStorySettings(): Promise<StorySettings> {
  const { data } = await supabase.rpc('story_settings')
  const d = (data ?? {}) as Partial<StorySettings>
  return {
    limit_per_day: d.limit_per_day ?? 3,
    archive_days: d.archive_days ?? STORY_ARCHIVE_DAYS,
    places: Array.isArray(d.places) && d.places.length ? d.places : DEFAULT_PLACES,
  }
}

// Destacadas
export async function fetchHighlights(userId: string): Promise<HighlightRow[]> {
  const { data } = await supabase.rpc('profile_highlights', { p_user: userId })
  return (data as HighlightRow[] | null) ?? []
}

export async function fetchHighlightStories(highlightId: string): Promise<StoryRow[]> {
  const { data } = await supabase.rpc('highlight_stories', { p_highlight: highlightId })
  return ((data as unknown[] | null) ?? []).map(normalizeRow)
}

export async function saveHighlight(
  id: string | null,
  title: string,
  cover: HighlightCover,
  storyIds: string[]
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('highlight_save', { p_id: id, p_title: title, p_cover: cover, p_story_ids: storyIds })
  if (error) return { id: null, error: friendlyStoryError(error.message) }
  return { id: data as string, error: null }
}

export async function deleteHighlight(id: string): Promise<string | null> {
  const { error } = await supabase.rpc('highlight_delete', { p_id: id })
  return error ? friendlyStoryError(error.message) : null
}

export async function reorderHighlights(ids: string[]): Promise<void> {
  await supabase.rpc('highlight_reorder', { p_ids: ids })
}

export async function toggleHighlightStory(highlightId: string, storyId: string, add: boolean): Promise<string | null> {
  const { error } = await supabase.rpc('highlight_toggle_story', { p_highlight: highlightId, p_story: storyId, p_add: add })
  return error ? friendlyStoryError(error.message) : null
}

/** Qué destacadas mías ya contienen esta historia */
export async function highlightsContaining(storyId: string, mine: HighlightRow[]): Promise<Set<string>> {
  const out = new Set<string>()
  await Promise.all(
    mine.map(async (h) => {
      const list = await fetchHighlightStories(h.id)
      if (list.some((s) => s.id === storyId)) out.add(h.id)
    })
  )
  return out
}

// Anillos en avatares fuera de la bandeja (una sola consulta, con caché de 60 s)
export type RingStatus = { has_story: boolean; has_unseen: boolean; friends_only: boolean }
const ringCache = new Map<string, { at: number; v: RingStatus }>()
const RING_TTL = 60_000

export async function fetchRingStatus(ids: string[]): Promise<Record<string, RingStatus>> {
  const now = Date.now()
  const out: Record<string, RingStatus> = {}
  const need: string[] = []
  for (const id of Array.from(new Set(ids))) {
    const hit = ringCache.get(id)
    if (hit && now - hit.at < RING_TTL) out[id] = hit.v
    else need.push(id)
  }
  for (let i = 0; i < need.length; i += 60) {
    const chunk = need.slice(i, i + 60)
    const { data } = await supabase.rpc('stories_ring_status', { p_users: chunk })
    const rows = (data as ({ user_id: string } & RingStatus)[] | null) ?? []
    const seen = new Set<string>()
    for (const r of rows) {
      const v = { has_story: r.has_story, has_unseen: r.has_unseen, friends_only: r.friends_only }
      ringCache.set(r.user_id, { at: now, v })
      out[r.user_id] = v
      seen.add(r.user_id)
    }
    for (const id of chunk) {
      if (!seen.has(id)) {
        const v = { has_story: false, has_unseen: false, friends_only: false }
        ringCache.set(id, { at: now, v })
        out[id] = v
      }
    }
  }
  return out
}

export function clearRingCache() {
  ringCache.clear()
}

// Mis propias historias vistas (el servidor no registra la vista del dueño; se recuerda en este dispositivo)
const OWN_SEEN_KEY = 'daiwa_story_own_seen'
export function readOwnSeen(): Set<string> {
  try {
    const raw = window.localStorage.getItem(OWN_SEEN_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}
export function addOwnSeen(id: string) {
  try {
    const s = readOwnSeen()
    s.add(id)
    window.localStorage.setItem(OWN_SEEN_KEY, JSON.stringify([...s].slice(-60)))
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

// Pequeñas preferencias en el navegador (siempre con try/catch)
export function lsGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}
export function lsSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* sin almacenamiento */
  }
}

export function trackFromStory(s: Pick<StoryRow, 'music'>): MusicTrack | null {
  return normalizeTrack(s.music)
}

// Eventos para avisar a otras partes de la pantalla que algo cambió con las historias
export const STORIES_CHANGED_EVENT = 'daiwa-stories-changed'
export function emitStoriesChanged() {
  clearRingCache()
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(STORIES_CHANGED_EVENT))
}

// Cola para pedir el anillo de MUCHAS publicaciones/chats con UNA sola consulta (se juntan en 40 ms)
let ringQueue: { id: string; resolve: (v: RingStatus) => void }[] = []
let ringTimer: ReturnType<typeof setTimeout> | null = null

export function queueRingStatus(id: string): Promise<RingStatus> {
  return new Promise((resolve) => {
    ringQueue.push({ id, resolve })
    if (ringTimer) return
    ringTimer = setTimeout(async () => {
      const batch = ringQueue
      ringQueue = []
      ringTimer = null
      const res = await fetchRingStatus(batch.map((b) => b.id))
      for (const b of batch) b.resolve(res[b.id] ?? { has_story: false, has_unseen: false, friends_only: false })
    }, 40)
  })
}

// ───────── Evidencia de reportes (equipo) ─────────
export type StoryEvidence = {
  story_id?: string
  owner_id?: string
  kind?: StoryKind
  media_path?: string | null
  bg?: StoryBg | null
  elements?: StoryElement[]
  music?: unknown
  audience?: StoryAudience
  created_at?: string
}

export function normalizeStoryEvidence(s: StoryEvidence | null | undefined): { bg: StoryBg | null; elements: StoryElement[]; music: unknown } | null {
  if (!s) return null
  return { bg: s.bg ?? null, elements: Array.isArray(s.elements) ? s.elements : [], music: s.music ?? null }
}

/** Ajustes del sistema (Admin Supremo) */
export async function saveStorySettings(limit: number, archive: number, places: string[]): Promise<string | null> {
  const { error } = await supabase.rpc('admin_set_story_settings', { p_limit: limit, p_archive: archive, p_places: places })
  return error ? friendlyStoryError(error.message) : null
}
