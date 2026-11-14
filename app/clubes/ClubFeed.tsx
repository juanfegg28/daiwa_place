'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import { useAppSession } from '../components/AppShell'
import PostCard from '../components/PostCard'
import { fetchPostComments, fetchPostsByIds } from '../lib/queries'
import { friendlyClubError } from '../lib/clubs'
import type { Post } from '../lib/types'

const FEED_PAGE = 15

/**
 * v1.8.0 · Feed de clubes renovado:
 *  · Con clubId: las publicaciones «solo del club» de ESE club (las que sus miembros eligen publicar solo para el club).
 *  · Sin clubId (página general de Clubes): únicamente anuncios y publicaciones de los LÍDERES de los clubes.
 */
export default function ClubFeed({ clubId = null, emptyText }: { clubId?: string | null; emptyText?: string }) {
  const { userId } = useAppSession()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [announce, setAnnounce] = useState<Set<string>>(new Set())
  const [clubOf, setClubOf] = useState<Map<string, { name: string; slug: string; color: string }>>(new Map())
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const limit = useRef(FEED_PAGE)

  const loadPosts = async () => {
    // 1) la base de datos dice QUÉ publicaciones (de miembros de clubes), 2) se traen completas
    const { data: ids, error: idsError } = await supabase.rpc('club_feed_ids', { p_club: clubId, p_limit: limit.current + 1 })
    if (idsError) {
      setError(friendlyClubError(idsError.message))
      setLoading(false)
      return
    }
    const idList = (ids as string[] | null) ?? []
    setHasMore(idList.length > limit.current)
    const pageIds = idList.slice(0, limit.current)
    if (pageIds.length === 0) {
      setPosts([])
      setError('')
      setLoading(false)
      return
    }
    // v1.10.0 · tarjetas ligeras (contadores + tu like); los comentarios se piden al abrirlos
    const { posts: found, error: postsError } = await fetchPostsByIds(pageIds, false, 'light')
    if (postsError) setError(friendlyClubError(postsError))
    else setError('')
    // etiquetas pequeñas: ¿es anuncio?, ¿de qué club? (una sola consulta liviana)
    const { data: metaRows } = await supabase.from('posts').select('id, is_announcement, clubs!posts_club_id_fkey(name, slug, color)').in('id', pageIds)
    const ann = new Set<string>()
    const cm = new Map<string, { name: string; slug: string; color: string }>()
    for (const r of (metaRows as unknown as { id: string; is_announcement: boolean; clubs: { name: string; slug: string; color: string } | null }[] | null) ?? []) {
      if (r.is_announcement) ann.add(r.id)
      if (r.clubs) cm.set(r.id, r.clubs)
    }
    setAnnounce(ann)
    setClubOf(cm)
    // anuncios recientes arriba, el resto por fecha
    setPosts([...found].sort((a, b) => Number(ann.has(b.id)) - Number(ann.has(a.id)) || b.created_at.localeCompare(a.created_at)))
    setLoading(false)
  }

  useEffect(() => {
    function run() {
      loadPosts()
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId])

  const loadMore = async () => {
    setLoadingMore(true)
    limit.current += FEED_PAGE
    await loadPosts()
    setLoadingMore(false)
  }

  // v1.10.0 · me gusta y comentarios AL INSTANTE: se cambia solo esa publicación en pantalla (antes cada toque volvía a pedir el feed entero:
  // la lista de ids, todas las publicaciones con sus comentarios y las etiquetas)
  const patchPost = (id: string, fn: (p: Post) => Post) => setPosts((l) => l.map((p) => (p.id === id ? fn(p) : p)))

  const toggleLike = async (post: Post) => {
    if (!userId) {
      router.push('/login')
      return
    }
    const liked = post.likes.some((l) => l.user_id === userId)
    patchPost(post.id, (p) => ({
      ...p,
      likes: liked ? p.likes.filter((l) => l.user_id !== userId) : [...p.likes, { user_id: userId }],
      ...(p.likes_count !== undefined ? { likes_count: Math.max(0, p.likes_count + (liked ? -1 : 1)) } : {}),
    }))
    const { error: e } = liked
      ? await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', userId)
      : await supabase.from('likes').insert({ post_id: post.id, user_id: userId })
    if (e) patchPost(post.id, () => post)
  }

  const toggleCommentLike = async (commentId: string, liked: boolean) => {
    if (!userId) {
      router.push('/login')
      return
    }
    const owner = posts.find((p) => p.comments.some((c) => c.id === commentId))
    if (owner) {
      patchPost(owner.id, (p) => ({
        ...p,
        comments: p.comments.map((c) =>
          c.id !== commentId ? c : { ...c, comment_likes: liked ? c.comment_likes.filter((l) => l.user_id !== userId) : [...c.comment_likes, { user_id: userId }] }
        ),
      }))
    }
    const { error: e } = liked
      ? await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId)
      : await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId })
    if (e && owner) patchPost(owner.id, () => owner)
  }

  // comentarios bajo demanda: solo los de la publicación que abres (o a la que acabas de comentar)
  const loadCommentsFor = async (postId: string) => {
    const { comments, error: e } = await fetchPostComments(postId)
    patchPost(postId, (p) => ({ ...p, comments: e ? p.comments : comments, comments_loaded: true, comments_count: e ? p.comments_count : comments.length }))
  }

  // tras editar o borrar UNA publicación (o un comentario suyo) se renueva solo esa tarjeta
  const reloadOne = async (postId: string) => {
    const { posts: fresh, error: e } = await fetchPostsByIds([postId], false, 'detail')
    if (!e && fresh[0]) patchPost(postId, () => fresh[0])
  }

  const addComment = async (postId: string, text: string, parentCommentId?: string | null) => {
    if (!userId) {
      router.push('/login')
      return
    }
    await supabase.from('comments').insert({ post_id: postId, user_id: userId, content: text, parent_comment_id: parentCommentId ?? null })
    await loadCommentsFor(postId)
  }

  if (loading) return <p className="text-neutral-500 text-sm text-center py-10">Cargando publicaciones...</p>
  if (error) return <p className="text-xs text-garnet-400 text-center py-6">{error}</p>
  if (posts.length === 0) {
    return (
      <p className="text-neutral-500 text-sm text-center py-10">
        {emptyText ?? 'Todavía no hay anuncios ni publicaciones de líderes. Cuando un líder publique «solo para su club» o marque un anuncio, aparecerá aquí.'}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post, i) => {
        const c = clubOf.get(post.id)
        const isAnn = announce.has(post.id)
        return (
          <div key={post.id}>
            {(isAnn || (!clubId && c)) && (
              <div className="flex items-center gap-2 mb-1.5 px-1 text-[11.5px]">
                {isAnn && <span className="rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 font-bold uppercase tracking-wide px-2 py-0.5 text-[10px]">📢 Anuncio</span>}
                {!clubId && c && (
                  <a href={`/clubes/${c.slug}`} className="font-semibold hover:underline truncate" style={{ color: c.color }}>
                    {c.name}
                  </a>
                )}
              </div>
            )}
            <PostCard
              post={post}
              priorityImages={i === 0}
              currentUserId={userId}
              onToggleLike={toggleLike}
              onToggleCommentLike={toggleCommentLike}
              onAddComment={addComment}
              onRefresh={(id) => (id ? reloadOne(id) : loadPosts())}
              onExpandComments={(p) => void loadCommentsFor(p.id)}
            />
          </div>
        )
      })}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="text-sm border border-ink-600 text-neutral-300 rounded-full px-5 py-2 hover:bg-ink-800 transition disabled:opacity-60"
          >
            {loadingMore ? 'Cargando...' : 'Ver más publicaciones'}
          </button>
        </div>
      )}
    </div>
  )
}
