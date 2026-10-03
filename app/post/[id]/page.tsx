'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import AppShell, { useAppSession } from '../../components/AppShell'
import PostCard from '../../components/PostCard'
import { POST_SELECT } from '../../lib/queries'
import type { Post } from '../../lib/types'

export default function PostPage() {
  return (
    <AppShell>
      <PostContent />
    </AppShell>
  )
}

function PostContent() {
  const params = useParams()
  const router = useRouter()
  const postId = (params?.id as string) ?? ''
  const { userId } = useAppSession()

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  // Si se llegó desde una notificación, viene el comentario a destacar: /post/ID?c=COMMENT_ID
  const [focusCommentId, setFocusCommentId] = useState<string | null>(null)

  const loadPost = async () => {
    const { data, error } = await supabase.from('posts').select(POST_SELECT).eq('id', postId).maybeSingle()
    if (error || !data) {
      setPost(null)
      setNotFound(true)
    } else {
      setPost(data as unknown as Post)
      setNotFound(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    function run() {
      setFocusCommentId(new URLSearchParams(window.location.search).get('c'))
      loadPost()
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  const handleLike = async (p: Post) => {
    if (!userId) {
      router.push('/login')
      return
    }
    const alreadyLiked = p.likes.some((l) => l.user_id === userId)
    if (alreadyLiked) {
      await supabase.from('likes').delete().eq('post_id', p.id).eq('user_id', userId)
    } else {
      await supabase.from('likes').insert({ post_id: p.id, user_id: userId })
    }
    loadPost()
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
    loadPost()
  }

  const handleAddComment = async (pId: string, text: string, parentCommentId?: string | null) => {
    if (!userId) {
      router.push('/login')
      return
    }
    await supabase.from('comments').insert({
      post_id: pId,
      user_id: userId,
      content: text,
      parent_comment_id: parentCommentId ?? null,
    })
    loadPost()
  }

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      <Link href="/" className="inline-block text-sm text-neutral-400 hover:text-garnet-400 transition mb-4">
        ← Volver al inicio
      </Link>

      {loading ? (
        <p className="text-neutral-500 text-sm text-center py-10">Cargando publicación...</p>
      ) : notFound || !post ? (
        <div className="surface-card rounded-2xl p-8 text-center">
          <p className="text-neutral-100 font-semibold mb-1">Esta publicación no existe</p>
          <p className="text-neutral-500 text-sm">Puede que su autor la haya eliminado.</p>
        </div>
      ) : (
        <PostCard
          post={post}
          currentUserId={userId}
          detail
          defaultExpanded
          onToggleLike={handleLike}
          onToggleCommentLike={handleLikeComment}
          onAddComment={handleAddComment}
          onRefresh={loadPost}
          onPostDeleted={() => router.push('/')}
          focusCommentId={focusCommentId}
        />
      )}
    </div>
  )
}
