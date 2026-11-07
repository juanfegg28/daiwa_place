'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAppSession } from '../components/AppShell'
import PostCard from '../components/PostCard'
import { fetchPostsByIds } from '../lib/queries'
import { usePostActions } from '../lib/usePostActions'
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
    const { posts: found, error: postsError } = await fetchPostsByIds(pageIds)
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

  const { toggleLike, toggleCommentLike, addComment } = usePostActions(userId, loadPosts)

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
              onRefresh={loadPosts}
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
