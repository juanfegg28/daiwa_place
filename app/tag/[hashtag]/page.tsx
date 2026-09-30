'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import AppShell, { useAppSession } from '../../components/AppShell'
import PostCard from '../../components/PostCard'
import { POST_SELECT } from '../../lib/queries'
import type { Post } from '../../lib/types'

export default function TagPage() {
  return (
    <AppShell>
      <TagContent />
    </AppShell>
  )
}

function TagContent() {
  const params = useParams()
  const router = useRouter()
  const tag = ((params?.hashtag as string) ?? '').toLowerCase()
  const { userId } = useAppSession()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .ilike('content', `%#${tag}%`)
      .order('created_at', { ascending: false })
    if (error) console.error('Error cargando la tendencia:', error.message)
    setPosts((data as unknown as Post[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    function run() {
      loadPosts()
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag])

  const handleLike = async (post: Post) => {
    if (!userId) {
      router.push('/login')
      return
    }
    const alreadyLiked = post.likes.some((l) => l.user_id === userId)
    if (alreadyLiked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', userId)
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: userId })
    }
    loadPosts()
  }

  const handleLikeComment = async (commentId: string, alreadyLiked: boolean) => {
    if (!userId) {
      router.push('/login')
      return
    }
    if (alreadyLiked) {
      await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId)
    } else {
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId })
    }
    loadPosts()
  }

  const handleAddComment = async (postId: string, text: string, parentCommentId?: string | null) => {
    if (!userId) {
      router.push('/login')
      return
    }
    await supabase.from('comments').insert({
      post_id: postId,
      user_id: userId,
      content: text,
      parent_comment_id: parentCommentId ?? null,
    })
    loadPosts()
  }

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      <Link href="/explorar" className="inline-block text-sm text-neutral-400 hover:text-garnet-400 transition mb-4">
        ← Volver a explorar
      </Link>
      <h1 className="text-2xl font-display font-semibold text-neutral-50 mb-1">#{tag}</h1>
      <p className="text-neutral-500 text-sm mb-6">
        {loading ? 'Cargando...' : `${posts.length} ${posts.length === 1 ? 'publicación' : 'publicaciones'}`}
      </p>

      <div className="space-y-4">
        {loading ? (
          <p className="text-neutral-500 text-sm text-center py-10">Cargando publicaciones...</p>
        ) : posts.length === 0 ? (
          <p className="text-neutral-500 text-sm text-center py-10">Todavía no hay publicaciones con #{tag}.</p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={userId}
              onToggleLike={handleLike}
              onToggleCommentLike={handleLikeComment}
              onAddComment={handleAddComment}
              onRefresh={loadPosts}
            />
          ))
        )}
      </div>
    </div>
  )
}
