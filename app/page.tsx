'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './lib/supabaseClient'
import AppShell, { useAppSession } from './components/AppShell'
import PostCard from './components/PostCard'
import PostImages from './components/PostImages'
import { ImageIcon } from './components/icons'
import { prepareImage } from './lib/images'
import { POST_SELECT, POST_IMAGES_BUCKET, MAX_POST_IMAGES } from './lib/queries'
import type { Post, PostImage } from './lib/types'

type DraftImage = {
  id: string
  blob: Blob
  w: number
  h: number
  previewUrl: string
}

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
  const [drafts, setDrafts] = useState<DraftImage[]>([])
  const [processingImages, setProcessingImages] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [postError, setPostError] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
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

  const handlePickImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    setPostError('')
    const room = MAX_POST_IMAGES - drafts.length
    if (room <= 0) {
      setPostError(`Solo puedes subir hasta ${MAX_POST_IMAGES} fotos por publicación`)
      return
    }
    if (files.length > room) {
      setPostError(`Solo puedes subir hasta ${MAX_POST_IMAGES} fotos por publicación`)
    }

    setProcessingImages(true)
    const added: DraftImage[] = []
    for (const file of files.slice(0, room)) {
      try {
        const prepared = await prepareImage(file)
        added.push({
          id: crypto.randomUUID(),
          blob: prepared.blob,
          w: prepared.w,
          h: prepared.h,
          previewUrl: prepared.previewUrl,
        })
      } catch (err) {
        setPostError(err instanceof Error ? err.message : 'No se pudo cargar una de las fotos')
      }
    }
    setDrafts((prev) => [...prev, ...added])
    setProcessingImages(false)
  }

  const removeDraft = (index: number) => {
    setDrafts((prev) => {
      const target = prev[index]
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
    setPostError('')
  }

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || processingImages) return
    if (!content.trim() && drafts.length === 0) return
    setLoading(true)
    setPostError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      router.push('/login')
      return
    }

    // 1) Subir las fotos (si hay)
    const uploaded: PostImage[] = []
    if (drafts.length > 0) {
      const results = await Promise.all(
        drafts.map(async (draft) => {
          const path = `${user.id}/${crypto.randomUUID()}.jpg`
          const { error } = await supabase.storage
            .from(POST_IMAGES_BUCKET)
            .upload(path, draft.blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
          if (error) return { error: error.message }
          const { data } = supabase.storage.from(POST_IMAGES_BUCKET).getPublicUrl(path)
          return { image: { url: data.publicUrl, path, w: draft.w, h: draft.h } as PostImage }
        })
      )

      for (const r of results) {
        if ('image' in r && r.image) uploaded.push(r.image)
      }
      const failed = results.find((r) => 'error' in r)
      if (failed && 'error' in failed) {
        if (uploaded.length > 0) {
          await supabase.storage.from(POST_IMAGES_BUCKET).remove(uploaded.map((u) => u.path))
        }
        setPostError(
          'No se pudieron subir las fotos: ' +
            failed.error +
            '. Revisa que el bucket "post-images" exista en Supabase.'
        )
        setLoading(false)
        return
      }
    }

    // 2) Crear la publicación
    const { error: insertError } = await supabase.from('posts').insert({
      user_id: user.id,
      content: content.trim(),
      images: uploaded,
    })

    if (insertError) {
      if (uploaded.length > 0) {
        await supabase.storage.from(POST_IMAGES_BUCKET).remove(uploaded.map((u) => u.path))
      }
      setPostError('No se pudo publicar: ' + insertError.message)
      setLoading(false)
      return
    }

    drafts.forEach((d) => URL.revokeObjectURL(d.previewUrl))
    setDrafts([])
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

  const draftImages: PostImage[] = drafts.map((d) => ({ url: d.previewUrl, path: d.id, w: d.w, h: d.h }))
  const canPublish = (content.trim().length > 0 || drafts.length > 0) && !loading && !processingImages

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

          {drafts.length > 0 && (
            <div className="mt-3">
              <PostImages images={draftImages} onRemove={removeDraft} />
            </div>
          )}

          {postError && <p className="text-xs text-garnet-400 mt-3">{postError}</p>}

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-ink-700">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePickImages}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={drafts.length >= MAX_POST_IMAGES || processingImages || loading}
                className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-garnet-400 disabled:opacity-40 disabled:hover:text-neutral-400 rounded-full px-2.5 py-1.5 hover:bg-ink-700 transition"
                aria-label="Agregar fotos"
              >
                <ImageIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Fotos</span>
              </button>
              {(drafts.length > 0 || processingImages) && (
                <span className="text-xs text-neutral-500">
                  {processingImages ? 'Procesando...' : `${drafts.length}/${MAX_POST_IMAGES}`}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={!canPublish}
              className="bg-garnet-600 hover:bg-garnet-500 disabled:opacity-50 text-white text-sm font-medium rounded-full px-5 py-2 transition"
            >
              {loading ? (drafts.length > 0 ? 'Subiendo...' : 'Publicando...') : 'Publicar'}
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
              onRefresh={loadPosts}
            />
          ))
        )}
      </div>
    </div>
  )
}
