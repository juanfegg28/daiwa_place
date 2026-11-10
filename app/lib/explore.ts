// v1.9.0 · Explorar 2.0: un solo paquete guardado 30 min en Supabase (explore_hub) + caché de 10 min en el dispositivo.
import { supabase } from './supabaseClient'
import { cached } from './netCache'

export type ExploreMember = { id: string; username: string; id_student: string | null; avatar_url: string | null; created_at?: string; posts?: number }
export type ExploreClub = { id: string; slug: string; name: string; kind: 'club' | 'pandilla'; color: string; avatar_url: string | null; description: string | null; members: number }
export type ExploreHub = {
  new_members: ExploreMember[]
  active_members: ExploreMember[]
  popular_posts: string[]
  clubs: ExploreClub[]
  tags: { tag: string; n: number }[]
}
export type PopularPost = {
  id: string
  user_id: string
  content: string
  created_at: string
  images: { url: string }[] | null
  author: { username: string; avatar_url: string | null; id_student: string | null } | null
  likes: number
  comments: number
}

const TTL = 10 * 60_000

export function loadExploreHub(): Promise<ExploreHub | null> {
  return cached<ExploreHub | null>(
    'explore:hub',
    TTL,
    async () => {
      const { data, error } = await supabase.rpc('explore_hub')
      if (error || !data) return null
      const d = data as Partial<ExploreHub>
      return {
        new_members: d.new_members ?? [],
        active_members: d.active_members ?? [],
        popular_posts: d.popular_posts ?? [],
        clubs: d.clubs ?? [],
        tags: d.tags ?? [],
      }
    },
    { persist: true, shouldCache: (h) => h !== null }
  )
}

/** Datos mínimos de las publicaciones populares (sin comentarios ni listas de likes: solo los totales) */
export function loadPopularPosts(ids: string[]): Promise<PopularPost[]> {
  if (ids.length === 0) return Promise.resolve([])
  return cached<PopularPost[]>(
    `explore:pop:${ids.join(',')}`,
    TTL,
    async () => {
      const { data } = await supabase
        .from('posts')
        .select('id, user_id, content, created_at, images, profiles!posts_user_id_fkey(username, avatar_url, id_student), likes(count), comments(count)')
        .in('id', ids)
      type Raw = {
        id: string
        user_id: string
        content: string
        created_at: string
        images: { url: string }[] | null
        profiles: PopularPost['author'] | PopularPost['author'][]
        likes: { count: number }[]
        comments: { count: number }[]
      }
      const byId = new Map(((data as unknown as Raw[] | null) ?? []).map((r) => [r.id, r]))
      return ids
        .map((id) => byId.get(id))
        .filter((r): r is Raw => !!r)
        .map((r) => ({
          id: r.id,
          user_id: r.user_id,
          content: r.content,
          created_at: r.created_at,
          images: r.images,
          author: Array.isArray(r.profiles) ? r.profiles[0] ?? null : r.profiles ?? null,
          likes: r.likes?.[0]?.count ?? 0,
          comments: r.comments?.[0]?.count ?? 0,
        }))
    },
    { persist: true, shouldCache: (l) => l.length > 0 }
  )
}
