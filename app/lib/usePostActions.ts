'use client'

import { useRouter } from 'next/navigation'
import { supabase } from './supabaseClient'
import type { Post } from './types'

/** Likes y comentarios de las publicaciones (los mismos que usa el Inicio), para reusarlos en otras pantallas. */
export function usePostActions(userId: string | null, reload: () => void | Promise<void>) {
  const router = useRouter()

  const toggleLike = async (post: Post) => {
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
    await reload()
  }

  const toggleCommentLike = async (commentId: string, alreadyLiked: boolean) => {
    if (!userId) {
      router.push('/login')
      return
    }
    if (alreadyLiked) {
      await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId)
    } else {
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId })
    }
    await reload()
  }

  const addComment = async (postId: string, text: string, parentCommentId?: string | null) => {
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
    await reload()
  }

  return { toggleLike, toggleCommentLike, addComment }
}
