// Consultas compartidas de Supabase (feed, perfil y vista individual de publicación)
import { supabase } from './supabaseClient'
import type { FeedItem, Post } from './types'

const COMMENTS_SELECT =
  'comments(id, user_id, content, created_at, edited_at, parent_comment_id, profiles!comments_user_id_fkey(username, avatar_url, id_student, name_color), comment_likes(user_id))'

// Feed general y vista individual: incluye al autor de la publicación
// (id_student e is_frozen se usan para la jerarquía de nombres y para
// desactivar los botones si la cuenta del autor está congelada; user_roles
// trae sus insignias para mostrarlas junto al nombre)
// club_members trae las etiquetas de club/pandilla de la persona (v1.1.0)
const CLUB_TAGS_SELECT =
  'club_members!user_id(joined_at, clubs!club_members_club_id_fkey(slug, name, kind, color), club_roles!club_members_role_id_fkey(name, color, is_leader))'

const POST_BASE = `id, user_id, content, created_at, edited_at, images, music, profiles!posts_user_id_fkey(username, avatar_url, id_student, name_color, is_frozen, badge_color, posts_visibility, user_roles!user_id(roles(name, badge_color)), ${CLUB_TAGS_SELECT}), likes(user_id), ${COMMENTS_SELECT}`

// reposts(user_id) trae quiénes compartieron la publicación (v1.1.10)
export const POST_SELECT = `${POST_BASE}, reposts(user_id)`

// Perfil: ya sabemos quién es el autor, no hace falta traerlo
export const PROFILE_POST_SELECT = `id, user_id, content, created_at, edited_at, images, music, likes(user_id), reposts(user_id), ${COMMENTS_SELECT}`
const PROFILE_POST_BASE = `id, user_id, content, created_at, edited_at, images, music, likes(user_id), ${COMMENTS_SELECT}`

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
  'id, type, read, story_id, created_at, post_id, comment_id, club_id, club_request_id, whisper_id, whisper_comment_id, anonymous, actor:profiles!notifications_actor_id_fkey(username, id_student, avatar_url), post:posts!notifications_post_id_fkey(content, images), comment:comments!notifications_comment_id_fkey(content), club:clubs!notifications_club_id_fkey(name, slug, kind, avatar_url), club_request:club_requests!notifications_club_request_id_fkey(club_name, kind, decline_reason), note:notes!notifications_note_id_fkey(content), wcomment:whisper_comments!notifications_whisper_comment_id_fkey(content), whisper:whispers!notifications_whisper_id_fkey(content), story:stories!notifications_story_id_fkey(id, kind, media_path, bg, expires_at, deleted_at)'

// ───────── Feed con compartidos (v1.1.10) ─────────

/** Trae publicaciones completas por id. Si falta el SQL nuevo (tabla reposts), reintenta sin ella para no romper el feed. */
export async function fetchPostsByIds(ids: string[], profileView = false): Promise<{ posts: Post[]; error: string }> {
  if (ids.length === 0) return { posts: [], error: '' }
  const run = (sel: string) => supabase.from('posts').select(sel).in('id', ids)
  let res = await run(profileView ? PROFILE_POST_SELECT : POST_SELECT)
  if (res.error && /reposts|posts_visibility|relationship|schema cache|permission denied/i.test(res.error.message)) {
    res = await run(profileView ? PROFILE_POST_BASE : POST_BASE.replace('posts_visibility, ', ''))
  }
  return { posts: (res.data as unknown as Post[]) ?? [], error: res.error?.message ?? '' }
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
  profileView = false
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
  const [{ posts, error: postsError }, reposters] = await Promise.all([
    fetchPostsByIds(ids, profileView),
    reposterIds.length
      ? supabase.from('profiles').select('id, username, id_student').in('id', reposterIds)
      : Promise.resolve({ data: [] as { id: string; username: string; id_student: string | null }[] }),
  ])
  const postById = new Map(posts.map((p) => [p.id, p]))
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
