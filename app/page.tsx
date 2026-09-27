'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './lib/supabaseClient'
import AppShell, { useAppSession } from './components/AppShell'
import PostCard from './components/PostCard'
import type { Post } from './lib/types'

const POST_SELECT =
  'id, content, created_at, profiles!posts_user_id_fkey(username, avatar_url), likes(user_id), comments(id, content, created_at, parent_comment_id, profiles!comments_user_id_fkey(username, avatar_url), comment_likes(user_id))'

export default function HomePage() {
  return (
    <AppShell>
      <Feed />
    </AppShell>
  )
}

function Feed() {
  const { userId, username, avatarUrl } = useAppSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const router = useRouter()

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .order('created_at', { ascending: false })
    if (error) console.error('Error cargando posts:', error.message)
    setPosts((data as unknown as Post[]) ?? [])
    setLoadingPosts(false)
  }

  useEffect(() => {
    function run() {
      loadPosts()
    }
    run()
  }, [])

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    await supabase.from('posts').insert({
      user_id: user.id,
      content: content.trim(),
    })

    setContent('')
    setLoading(false)
    loadPosts()
  }

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
      {username && (
        <form onSubmit={handlePost} className="surface-card rounded-2xl p-4 mb-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-ink-700 flex items-center justify-center shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-garnet-400">
                  {username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="¿Qué está pasando en Daiwa?"
              className="flex-1 bg-transparent text-sm resize-none focus:outline-none placeholder:text-neutral-500"
              rows={2}
            />
          </div>
          <div className="flex justify-end mt-2 pt-2 border-t border-ink-700">
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="bg-garnet-600 hover:bg-garnet-500 disabled:opacity-50 text-white text-sm font-medium rounded-full px-5 py-2 transition"
            >
              {loading ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {loadingPosts ? (
          <p className="text-neutral-500 text-sm text-center py-10">Cargando publicaciones...</p>
        ) : posts.length === 0 ? (
          <p className="text-neutral-500 text-sm text-center py-10">
            Todavía no hay publicaciones. ¡Sé el primero!
          </p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={userId}
              onToggleLike={handleLike}
              onToggleCommentLike={handleLikeComment}
              onAddComment={handleAddComment}
            />
          ))
        )}
      </div>
    </div>
  )
}
