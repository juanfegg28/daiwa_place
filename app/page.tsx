'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './lib/supabaseClient'

type Post = {
  id: string
  content: string
  created_at: string
  profiles: { username: string } | null
  likes: { user_id: string }[]
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [content, setContent] = useState('')
  const [username, setUsername] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    loadPosts()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      setUsername(profile?.username ?? null)
    }
  }

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('id, content, created_at, profiles!posts_user_id_fkey(username), likes(user_id)')
      .order('created_at', { ascending: false })
    if (error) console.error('Error cargando posts:', error.message)
    setPosts((data as any) ?? [])
  }

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUsername(null)
    setUserId(null)
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <nav className="border-b border-neutral-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Daiwa Place</h1>
        {username ? (
          <div className="flex items-center gap-4 text-sm">
            <span>@{username}</span>
            <button onClick={handleLogout} className="text-neutral-400 hover:text-white">
              Salir
            </button>
          </div>
        ) : (
          <a href="/login" className="text-sm text-neutral-400 hover:text-white">
            Entrar
          </a>
        )}
      </nav>

      <main className="max-w-xl mx-auto py-6 px-4">
        {username && (
          <form onSubmit={handlePost} className="mb-6">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="¿Qué está pasando en Daiwa?"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-sm resize-none"
              rows={3}
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-white text-black text-sm font-medium rounded-full px-4 py-2"
            >
              {loading ? 'Publicando...' : 'Publicar'}
            </button>
          </form>
        )}

        <div className="space-y-4">
          {posts.map((post) => {
            const likedByMe = userId ? post.likes.some((l) => l.user_id === userId) : false
            return (
              <div key={post.id} className="border border-neutral-800 rounded-lg p-4">
                <div className="text-sm font-semibold mb-1">
                  @{post.profiles?.username ?? 'usuario'}
                </div>
                <p className="text-sm text-neutral-200 mb-3">{post.content}</p>
                <button
                  onClick={() => handleLike(post)}
                  className={`text-sm flex items-center gap-1 ${
                    likedByMe ? 'text-pink-500' : 'text-neutral-400 hover:text-pink-400'
                  }`}
                >
                  {likedByMe ? '♥' : '♡'} {post.likes.length}
                </button>
              </div>
            )
          })}
          {posts.length === 0 && (
            <p className="text-neutral-500 text-sm text-center py-10">
              Todavía no hay publicaciones. ¡Sé el primero!
            </p>
          )}
        </div>
      </main>
    </div>
  )
}