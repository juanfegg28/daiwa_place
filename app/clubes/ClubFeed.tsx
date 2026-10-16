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
 * Feed de clubes: SOLO publicaciones de personas que pertenecen a algún club o pandilla.
 * Con clubId, solo las de los miembros de ese club (se usa en la página de cada club).
 */
export default function ClubFeed({ clubId = null, emptyText }: { clubId?: string | null; emptyText?: string }) {
  const { userId } = useAppSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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
    setPosts([...found].sort((a, b) => b.created_at.localeCompare(a.created_at)))
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
        {emptyText ?? 'Todavía no hay publicaciones de miembros de clubes o pandillas.'}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post, i) => (
        <PostCard
          key={post.id}
          post={post}
          priorityImages={i === 0}
          currentUserId={userId}
          onToggleLike={toggleLike}
          onToggleCommentLike={toggleCommentLike}
          onAddComment={addComment}
          onRefresh={loadPosts}
        />
      ))}
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
