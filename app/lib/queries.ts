// Consultas compartidas de Supabase (feed, perfil y vista individual de publicación)
import { supabase } from './supabaseClient'
import type { Comment, FeedItem, Post } from './types'
import { COSMETIC_MINI_COLS, normalizeEquip, normalizeNameStyle } from './cosmetics'

const COMMENTS_SELECT =
  'comments(id, user_id, content, created_at, edited_at, parent_comment_id, profiles!comments_user_id_fkey(username, avatar_url, id_student, name_color), comment_likes(user_id))'

// Feed general y vista individual: incluye al autor de la publicación
// (id_student e is_frozen se usan para la jerarquía de nombres y para
// desactivar los botones si la cuenta del autor está congelada; user_roles
// trae sus insignias para mostrarlas junto al nombre)
// club_members trae las etiquetas de club/pandilla de la persona (v1.1.0)
const CLUB_TAGS_SELECT =
  'club_members!user_id(joined_at, clubs!club_members_club_id_fkey(slug, name, kind, color), club_roles!club_members_role_id_fkey(name, color, is_leader))'

const POST_BASE_CORE = `id, user_id, content, created_at, edited_at, images, music, profiles!posts_user_id_fkey(username, avatar_url, id_student, name_color, is_frozen, badge_color, posts_visibility, user_roles!user_id(roles(name, badge_color)), ${CLUB_TAGS_SELECT}), likes(user_id), ${COMMENTS_SELECT}`

// v1.9.0 · Encuesta de la publicación (con sus opciones y TU voto: RLS solo deja ver el tuyo) y si la tienes guardada (RLS: solo tus filas).
// Va dentro de la misma consulta: no cuesta ninguna petición extra. Si todavía no se corrió el SQL de la 1.9.0, se usa la versión «core».
const PLUS_EXTRAS = ', poll:polls(id, question, ends_at, total_votes, poll_options(id, pos, label, votes), poll_votes(option_id)), saved_posts(user_id)'
const POST_BASE = `${POST_BASE_CORE}${PLUS_EXTRAS}`

// reposts(user_id) trae quiénes compartieron la publicación (v1.1.10)
export const POST_SELECT_CORE = `${POST_BASE_CORE}, reposts(user_id)`
export const POST_SELECT = `${POST_BASE}, reposts(user_id)`

// Perfil: ya sabemos quién es el autor, no hace falta traerlo
const PROFILE_POST_CORE = `id, user_id, content, created_at, edited_at, images, music, likes(user_id), reposts(user_id), ${COMMENTS_SELECT}`
export const PROFILE_POST_SELECT_CORE = PROFILE_POST_CORE
export const PROFILE_POST_SELECT = `${PROFILE_POST_CORE}${PLUS_EXTRAS}`
const PROFILE_POST_BASE = `id, user_id, content, created_at, edited_at, images, music, likes(user_id), ${COMMENTS_SELECT}`

// ───────── v1.10.0 · LISTAS LIGERAS (feed, perfil) ─────────
// Antes cada tarjeta traía TODOS los likes (user_id de cada persona) y TODOS los comentarios con el perfil de cada autor y los likes de cada
// comentario: la mayor parte de lo que se descargaba del feed. Ahora la tarjeta trae solo lo que se ve: contadores (columnas
// tabla post_counters (una fila diminuta por publicación, mantenida por triggers: sql/v1.10.0_1_iris_rendimiento.sql), TU like y TU compartido
// (filtros sobre las relaciones embebidas) y, al abrir los comentarios, se piden aparte. Sin el SQL nuevo, todo sigue como en la 1.9.0.
const AUTHOR_SELECT = `profiles!posts_user_id_fkey(username, avatar_url, id_student, name_color, is_frozen, badge_color, posts_visibility, user_roles!user_id(roles(name, badge_color)), ${CLUB_TAGS_SELECT})`
const LIGHT_COUNTS = 'post_counters(likes_count, comments_count, reposts_count)'
// con la decoración del avatar y el estilo del nombre YA incluidos (así no hace falta una segunda consulta a profiles para pintarlos)
const AUTHOR_SELECT_COS = AUTHOR_SELECT.replace('is_frozen, ', 'is_frozen, avatar_deco, name_style, ')
const LIGHT_CORE = `id, user_id, content, created_at, edited_at, images, music, ${LIGHT_COUNTS}, ${AUTHOR_SELECT}, likes(user_id), reposts(user_id)`
const LIGHT_CORE_COS = `id, user_id, content, created_at, edited_at, images, music, ${LIGHT_COUNTS}, ${AUTHOR_SELECT_COS}, likes(user_id), reposts(user_id)`
const LIGHT_PROFILE_CORE = `id, user_id, content, created_at, edited_at, images, music, ${LIGHT_COUNTS}, likes(user_id), reposts(user_id)`
export const POST_LIGHT_SELECT_COS = `${LIGHT_CORE_COS}${PLUS_EXTRAS}`
export const POST_LIGHT_SELECT = `${LIGHT_CORE}${PLUS_EXTRAS}`
export const POST_LIGHT_SELECT_CORE = LIGHT_CORE
export const PROFILE_LIGHT_SELECT = `${LIGHT_PROFILE_CORE}${PLUS_EXTRAS}`
export const PROFILE_LIGHT_SELECT_CORE = LIGHT_PROFILE_CORE

/** false cuando se comprueba que falta el SQL de la 1.10.0 (tabla de contadores): no se vuelve a intentar en esta sesión */
type PostCounters = { likes_count: number; comments_count: number; reposts_count: number }
let lightAvailable = true
const NIL_UUID = '00000000-0000-0000-0000-000000000000'
let meCache: string | null = null
async function myId(): Promise<string> {
  if (meCache) return meCache
  try {
    const { data } = await supabase.auth.getSession()
    meCache = data.session?.user.id ?? null
  } catch {
    /* sin sesión: se usa un id que no existe y no se marca nada como «tuyo» */
  }
  return meCache ?? NIL_UUID
}
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_event, session) => {
    meCache = session?.user.id ?? null
  })
}

export const POST_IMAGES_BUCKET = 'post-images'
export const MAX_POST_IMAGES = 4
/** Máximo de caracteres en el texto de una publicación (también lo exige la base de datos) */
export const MAX_POST_LENGTH = 1000

// Notificaciones: quién la generó, y un pedacito de la publicación / comentario
// al que se refiere (para mostrar el fragmento en la lista)
export const NOTIFICATION_SELECT_BASE =
  'id, type, read, created_at, post_id, comment_id, club_id, club_request_id, whisper_id, whisper_comment_id, anonymous, actor:profiles!notifications_actor_id_fkey(username, id_student, avatar_url), post:posts!notifications_post_id_fkey(content, images), comment:comments!notifications_comment_id_fkey(content), club:clubs!notifications_club_id_fkey(name, slug, kind, avatar_url), club_request:club_requests!notifications_club_request_id_fkey(club_name, kind, decline_reason), note:notes!notifications_note_id_fkey(content), wcomment:whisper_comments!notifications_whisper_comment_id_fkey(content), whisper:whispers!notifications_whisper_id_fkey(content)'

// Con las historias de la v1.2.0 (si todavía no corriste ese SQL, la página usa la versión de arriba)
export const NOTIFICATION_SELECT =
  'id, type, read, story_id, created_at, post_id, comment_id, club_id, club_request_id, whisper_id, whisper_comment_id, anonymous, actor:profiles!notifications_actor_id_fkey(username, id_student, avatar_url), post:posts!notifications_post_id_fkey(content, images), comment:comments!notifications_comment_id_fkey(content), club:clubs!notifications_club_id_fkey(name, slug, kind, avatar_url), club_request:club_requests!notifications_club_request_id_fkey(club_name, kind, decline_reason), note:notes!notifications_note_id_fkey(content), wcomment:whisper_comments!notifications_whisper_comment_id_fkey(content), whisper:whispers!notifications_whisper_id_fkey(content), story:stories!notifications_story_id_fkey(id, kind, media_path, bg, expires_at, deleted_at), event_id, event:events!notifications_event_id_fkey(title, starts_at, cancelled_at)'

// ───────── Feed con compartidos (v1.1.10) ─────────

/**
 * v1.4.0: añade a los autores (de publicaciones y comentarios) lo que llevan puesto de la tienda: decoración de avatar y
 * fuente/efecto del nombre. Va en UNA consulta aparte y en lote; si todavía no se corrió el SQL de la 1.4.0 (o falla),
 * se ignora en silencio y el feed se ve exactamente como antes.
 */
export async function attachCosmetics(posts: Post[]): Promise<void> {
  const authors: NonNullable<Post['profiles']>[] = []
  for (const p of posts) {
    if (p.profiles) authors.push(p.profiles)
    for (const c of p.comments ?? []) if (c.profiles) authors.push(c.profiles)
  }
  await applyCosmetics(authors)
}

/** v1.10.0 · lo mismo para una lista suelta de comentarios (los que se piden al abrir una publicación) */
export async function attachCosmeticsToComments(comments: Comment[]): Promise<void> {
  await applyCosmetics(comments.map((c) => c.profiles).filter((a): a is NonNullable<Comment['profiles']> => !!a))
}

async function applyCosmetics(authors: NonNullable<Post['profiles']>[]): Promise<void> {
  const names = new Set<string>()
  for (const a of authors) if (a.username) names.add(a.username)
  if (names.size === 0) return
  const { data, error } = await supabase.from('profiles').select(`username, ${COSMETIC_MINI_COLS}`).in('username', Array.from(names).slice(0, 150))
  if (error || !data) return
  const byName = new Map((data as unknown as { username: string; avatar_deco: unknown; name_style: unknown }[]).map((r) => [r.username, r]))
  for (const a of authors) {
    const r = byName.get(a.username)
    if (!r) continue
    a.avatar_deco = normalizeEquip(r.avatar_deco)
    a.name_style = normalizeNameStyle(r.name_style)
  }
}

/**
 * Trae publicaciones por id.
 *  · 'full'  (por defecto): como en la 1.9.0, con TODOS los likes y comentarios (vista individual y pantallas todavía no migradas).
 *  · 'light' (v1.10.0): tarjetas ligeras para listas: contadores + tu like/compartido, sin comentarios (se piden al abrirlos).
 *  · 'detail': ligera + los comentarios de esas publicaciones (para refrescar UNA publicación tras comentar/editar sin recargar el feed).
 * Si falta el SQL nuevo (tabla reposts, 1.9.0 o 1.10.0), reintenta con la consulta anterior para no romper el feed.
 */
export type PostsMode = 'full' | 'light' | 'detail'
export async function fetchPostsByIds(ids: string[], profileView = false, mode: PostsMode = 'full'): Promise<{ posts: Post[]; error: string }> {
  if (ids.length === 0) return { posts: [], error: '' }

  if (mode !== 'full' && lightAvailable) {
    const me = await myId()
    const withComments = mode === 'detail'
    const sel = (base: string) => (withComments ? `${base}, ${COMMENTS_SELECT}` : base)
    const run = (base: string) => supabase.from('posts').select(sel(base)).in('id', ids).eq('likes.user_id', me).eq('reposts.user_id', me)
    // Se prueba de lo más completo a lo más básico: con cosméticos del autor incluidos → sin ellos → sin encuestas/guardadas (SQL 1.9.0 / 1.4.0 pendientes)
    const attempts: { select: string; cos: boolean }[] = profileView
      ? [{ select: PROFILE_LIGHT_SELECT, cos: false }, { select: PROFILE_LIGHT_SELECT_CORE, cos: false }]
      : [{ select: POST_LIGHT_SELECT_COS, cos: true }, { select: POST_LIGHT_SELECT, cos: false }, { select: POST_LIGHT_SELECT_CORE, cos: false }]
    for (const at of attempts) {
      const res = await run(at.select)
      if (!res.error) {
        const posts = (res.data as unknown as Post[]) ?? []
        for (const p of posts) {
          // post_counters llega como objeto (relación 1 a 1) o null si la publicación todavía no tiene likes/comentarios/compartidos
          const raw = p as unknown as { post_counters?: PostCounters | PostCounters[] | null }
          const pc = Array.isArray(raw.post_counters) ? raw.post_counters[0] : raw.post_counters
          p.likes_count = pc?.likes_count ?? 0
          p.comments_count = pc?.comments_count ?? 0
          p.reposts_count = pc?.reposts_count ?? 0
          delete raw.post_counters
          if (withComments) {
            p.comments_loaded = true
            p.comments_count = (p.comments ?? []).length
          } else {
            p.comments = []
            p.comments_loaded = false
          }
          if (at.cos && p.profiles) {
            p.profiles.avatar_deco = normalizeEquip(p.profiles.avatar_deco)
            p.profiles.name_style = normalizeNameStyle(p.profiles.name_style)
          }
        }
        // con los cosméticos del autor ya incluidos solo hacen falta los de quienes comentaron (modo 'detail'); si no, la consulta aparte de siempre
        if (at.cos) await attachCosmeticsToComments(posts.flatMap((p) => p.comments ?? []))
        else await attachCosmetics(posts)
        return { posts, error: '' }
      }
      const msg = res.error.message
      // falta la tabla de contadores (no se corrió el SQL de la 1.10.0): se recuerda y se usa la consulta completa de siempre
      if (/post_counters|likes_count|comments_count|reposts_count|PGRST200/i.test(msg) || (/relationship|schema cache/i.test(msg) && /post_counters/i.test(msg))) {
        lightAvailable = false
        break
      }
      // columnas/tablas que pueden faltar según el SQL corrido: se prueba la versión siguiente
      if (/avatar_deco|name_style|polls|poll_|saved_posts|relationship|schema cache|does not exist|42703/i.test(msg)) continue
      break // cualquier otro fallo: se intenta con la consulta completa, que es la de siempre
    }
  }

  const run = (sel: string) => supabase.from('posts').select(sel).in('id', ids)
  let res = await run(profileView ? PROFILE_POST_SELECT : POST_SELECT)
  // sin el SQL de la 1.9.0 (encuestas/guardadas): la consulta de la 1.8.0
  if (res.error && /polls|poll_|saved_posts|relationship|schema cache|permission denied/i.test(res.error.message)) {
    res = await run(profileView ? PROFILE_POST_SELECT_CORE : POST_SELECT_CORE)
  }
  if (res.error && /reposts|posts_visibility|relationship|schema cache|permission denied/i.test(res.error.message)) {
    res = await run(profileView ? PROFILE_POST_BASE : POST_BASE_CORE.replace('posts_visibility, ', ''))
  }
  const posts = (res.data as unknown as Post[]) ?? []
  await attachCosmetics(posts)
  return { posts, error: res.error?.message ?? '' }
}

// ───────── v1.10.0 · Comentarios bajo demanda ─────────
const COMMENT_ROW = 'id, user_id, content, created_at, edited_at, parent_comment_id, profiles!comments_user_id_fkey(username, avatar_url, id_student, name_color), comment_likes(user_id)'
const commentsInflight = new Map<string, Promise<{ comments: Comment[]; error: string }>>()

/** Comentarios de UNA publicación (con quién los escribió y los likes de cada uno). Dos pedidos a la vez de la misma publicación comparten respuesta. */
export function fetchPostComments(postId: string): Promise<{ comments: Comment[]; error: string }> {
  const hit = commentsInflight.get(postId)
  if (hit) return hit
  const p = (async () => {
    const { data, error } = await supabase.from('comments').select(COMMENT_ROW).eq('post_id', postId).order('created_at', { ascending: true }).limit(1000)
    const comments = (data as unknown as Comment[] | null) ?? []
    if (!error) await attachCosmeticsToComments(comments)
    return { comments, error: error?.message ?? '' }
  })().finally(() => {
    commentsInflight.delete(postId)
  })
  commentsInflight.set(postId, p)
  return p
}

type FeedRow = { kind: 'post' | 'repost'; post_id: string; reposter_id: string | null; sort_at: string }

/**
 * Pide a la base de datos el feed (publicaciones + compartidos, del más nuevo al más viejo) y lo arma completo.
 * scope 'home': respeta a quién tienes oculto y tu preferencia del feed. scope 'profile': todo lo de esa persona.
 * Si todavía no se corrió el SQL de la v1.1.10, usa la consulta de siempre.
 */
export async function fetchFeedItems(
  scope: 'home' | 'profile',
  limit: number,
  userId: string | null,
  fallback: (limit: number) => Promise<{ posts: Post[]; error: string }>,
  profileView = false,
  /** v1.6.3 · publicaciones que ya tienes cargadas: no se vuelven a pedir completas (solo las nuevas), así «Ver más» no repite todo el feed */
  known?: Map<string, Post>,
  /** v1.10.0 · 'light' = tarjetas ligeras (contadores y comentarios bajo demanda) */
  mode: PostsMode = 'full'
): Promise<{ items: FeedItem[]; hasMore: boolean; error: string }> {
  const { data, error } = await supabase.rpc('feed_items', { p_scope: scope, p_user: scope === 'profile' ? userId : null, p_limit: limit + 1 })
  if (error) {
    // sin la función nueva: feed clásico, sin compartidos
    const old = await fallback(limit)
    const posts = old.posts.slice(0, limit)
    return {
      items: posts.map((post) => ({ key: post.id, post, repostedBy: null, sortAt: post.created_at })),
      hasMore: old.posts.length > limit,
      error: old.error,
    }
  }
  const rows = (data as FeedRow[] | null) ?? []
  const hasMore = rows.length > limit
  const page = rows.slice(0, limit)
  const ids = Array.from(new Set(page.map((r) => r.post_id)))
  const reposterIds = Array.from(new Set(page.map((r) => r.reposter_id).filter((x): x is string => !!x)))
  const needIds = known ? ids.filter((id) => !known.has(id)) : ids
  const [{ posts: fetched, error: postsError }, reposters] = await Promise.all([
    fetchPostsByIds(needIds, profileView, mode),
    reposterIds.length
      ? supabase.from('profiles').select('id, username, id_student').in('id', reposterIds)
      : Promise.resolve({ data: [] as { id: string; username: string; id_student: string | null }[] }),
  ])
  const postById = new Map<string, Post>(fetched.map((p): [string, Post] => [p.id, p]))
  if (known) for (const id of ids) if (!postById.has(id) && known.has(id)) postById.set(id, known.get(id)!)
  const reposterById = new Map(((reposters.data as { id: string; username: string; id_student: string | null }[] | null) ?? []).map((r) => [r.id, r]))
  const items: FeedItem[] = []
  for (const r of page) {
    const post = postById.get(r.post_id)
    if (!post) continue // no tenemos permiso de verla (cuenta privada, etc.)
    const who = r.reposter_id ? reposterById.get(r.reposter_id) ?? null : null
    if (r.kind === 'repost' && !who) continue
    items.push({ key: `${r.kind}:${r.post_id}:${r.reposter_id ?? ''}`, post, repostedBy: who, sortAt: r.sort_at })
  }
  return { items, hasMore, error: postsError }
}
