import { supabase } from './supabaseClient'

// ---------------------------------------------------------------------------------------------
// Etiquetas (@usuario): detectar que la persona está escribiendo una, y buscar a quién etiquetar.
// ---------------------------------------------------------------------------------------------

export type MentionPerson = {
  id: string
  username: string
  id_student: string | null
  avatar_url: string | null
}

/** Cuántos amigos se muestran apenas se escribe la @ (sin buscar nada todavía) */
export const MENTION_FRIENDS_SHOWN = 5

/** Un @ al inicio o después de un espacio / salto de línea / paréntesis, y lo que se lleva escrito */
const MENTION_TOKEN = /(^|[\s(¿¡"'])@([A-Za-z0-9_.]{0,24})$/

/** ¿El cursor está justo después de un "@algo"? Devuelve dónde empieza la @ y lo escrito después de ella. */
export function findMentionTrigger(text: string, caret: number): { start: number; query: string } | null {
  const before = text.slice(0, caret)
  const m = MENTION_TOKEN.exec(before)
  if (!m) return null
  const query = m[2]
  return { start: before.length - query.length - 1, query }
}

export function displayName(p: { id_student: string | null; username: string }) {
  return p.id_student?.trim() || p.username
}

// --- Amigos (se siguen mutuamente) y bloqueos, con un caché cortito para no repetir consultas ---

type Social = { me: string; at: number; friends: MentionPerson[]; blocked: Set<string> }

const TTL_MS = 60_000
const PERSON_COLS = 'id, username, id_student, avatar_url'
let cache: Social | null = null
let inflight: Promise<Social> | null = null

async function loadSocial(me: string): Promise<Social> {
  if (cache && cache.me === me && Date.now() - cache.at < TTL_MS) return cache
  if (inflight) return inflight

  inflight = (async () => {
    const [{ data: following }, { data: followers }, { data: blockRows }] = await Promise.all([
      supabase.from('follows').select('following_id').eq('follower_id', me),
      supabase.from('follows').select('follower_id').eq('following_id', me),
      supabase.from('blocks').select('blocker_id, blocked_id').or(`blocker_id.eq.${me},blocked_id.eq.${me}`),
    ])

    const blocked = new Set<string>()
    for (const b of (blockRows ?? []) as { blocker_id: string; blocked_id: string }[]) {
      blocked.add(b.blocker_id === me ? b.blocked_id : b.blocker_id)
    }

    const mine = new Set((following ?? []).map((r) => r.following_id as string))
    const mutualIds: string[] = []
    for (const r of followers ?? []) {
      const other = r.follower_id as string
      if (mine.has(other) && !blocked.has(other)) mutualIds.push(other)
    }

    let friends: MentionPerson[] = []
    if (mutualIds.length > 0) {
      const { data } = await supabase.from('profiles').select(PERSON_COLS).in('id', mutualIds.slice(0, 150))
      friends = ((data as MentionPerson[]) ?? []).sort((a, b) => displayName(a).localeCompare(displayName(b), 'es'))
    }

    const fresh: Social = { me, at: Date.now(), friends, blocked }
    cache = fresh
    return fresh
  })()

  try {
    return await inflight
  } finally {
    inflight = null
  }
}

/** Tras seguir / dejar de seguir o bloquear a alguien conviene refrescar la lista de amigos */
export function clearMentionCache() {
  cache = null
}

export type MentionResults = { friends: MentionPerson[]; others: MentionPerson[] }

function rank(p: MentionPerson, q: string) {
  const u = p.username.toLowerCase()
  const n = (p.id_student ?? '').toLowerCase()
  if (u.startsWith(q) || n.startsWith(q)) return 0
  if (u.includes(q) || n.includes(q)) return 1
  return 2
}

/**
 * Sin nada escrito: tus amigos (mutuals). Con texto: primero tus amigos que coinciden y después
 * cualquier otra persona de la página. Nunca salen bloqueados, ni perfiles en Modo Fantasma que no sean tus amigos.
 */
export async function findMentionPeople(me: string, rawQuery: string): Promise<MentionResults> {
  const social = await loadSocial(me)
  const q = rawQuery.trim().toLowerCase()

  if (!q) return { friends: social.friends.slice(0, MENTION_FRIENDS_SHOWN), others: [] }

  const friends = social.friends
    .map((p) => ({ p, r: rank(p, q) }))
    .filter((x) => x.r < 2)
    .sort((a, b) => a.r - b.r)
    .map((x) => x.p)
    .slice(0, 6)

  let others: MentionPerson[] = []
  if (q.length >= 2) {
    const safe = q.replace(/[^a-z0-9_.]/g, '')
    if (safe) {
      const { data } = await supabase
        .from('profiles')
        .select(PERSON_COLS)
        .eq('ghost_mode', false)
        .neq('id', me)
        .or(`username.ilike.${safe}%,id_student.ilike.%${safe}%`)
        .limit(14)
      const friendIds = new Set(social.friends.map((f) => f.id))
      others = ((data as MentionPerson[]) ?? []).filter((p) => !friendIds.has(p.id) && !social.blocked.has(p.id)).slice(0, 6)
    }
  }
  return { friends, others }
}
