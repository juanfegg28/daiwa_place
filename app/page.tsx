'use client'

import Avatar from './components/cosmetics/Avatar'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './lib/supabaseClient'
import AppShell, { useAppSession } from './components/AppShell'
import PostCard from './components/PostCard'
import AnnouncementBanner from './components/AnnouncementBanner'
import StoriesTray from './components/stories/StoriesTray'
import InstallBanner from './components/InstallBanner'
import PushPrompt from './components/PushPrompt'
import PostImages from './components/PostImages'
import MentionField, { type MentionFieldHandle } from './components/MentionField'
import { AtIcon, ImageIcon, SmileIcon } from './components/icons'
import StatusCard from './components/StatusCard'
import StatusSheet from './components/StatusSheet'
import FollowSuggestions from './components/FollowSuggestions'
import { STATUS_CHANGED_EVENT, fetchFeedStatuses, fetchStatus, type FeedStatus, type StatusRow } from './lib/status'
import { suggestionsHidden } from './lib/suggestions'
import { ECO, onWake, startPoll } from './lib/eco'
import FormatToolbar from './components/FormatToolbar'
import DailyQuestionCard, { DAILY_TAG } from './components/DailyQuestionCard'
import { MissionsInline, MissionsSide, useMissionsPanel } from './components/economy/MissionsPanel'
import { dayPartFor, firstNameOf, pickGreeting, type DayPart } from './lib/greeting'
import { prepareImage } from './lib/images'
import { POST_SELECT, POST_IMAGES_BUCKET, MAX_POST_IMAGES, MAX_POST_LENGTH, fetchFeedItems } from './lib/queries'
import MusicChip from './components/MusicChip'
import MusicPicker from './components/MusicPicker'
import { MusicIcon } from './components/icons'
import { normalizeTrack, toStoredTrack } from './lib/music'
import type { Post, PostImage, FeedItem } from './lib/types'

const FEED_PAGE = 12 // v1.6.3 · 12 (antes 15): cada publicación trae sus comentarios y likes, así que cada una pesa

type DraftImage = {
  id: string
  blob: Blob
  w: number
  h: number
  previewUrl: string
}

/** Lado de las misiones en PC: 'left' (a la izquierda del feed) o 'right' (a la derecha). Cambia solo esta palabra. */
const MISSIONS_SIDE: 'left' | 'right' = 'right'

export default function HomePage() {
  return (
    <AppShell>
      <Feed />
    </AppShell>
  )
}

function Feed() {
  const { userId, username, avatarUrl, displayName } = useAppSession()
  const { state: missions, overlay: missionsOverlay } = useMissionsPanel(userId)
  const [items, setItems] = useState<FeedItem[]>([])
  const [content, setContent] = useState('')
  const [drafts, setDrafts] = useState<DraftImage[]>([])
  const [processingImages, setProcessingImages] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [postError, setPostError] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const mentionRef = useRef<MentionFieldHandle | null>(null)

  // v1.6.2 · Estado (tarjetitas pequeñas dentro del feed) y sugerencias de seguimiento (de vez en cuando, más abajo)
  const [statuses, setStatuses] = useState<FeedStatus[]>([])
  const [myStatus, setMyStatus] = useState<StatusRow | null>(null)
  const [statusOpen, setStatusOpen] = useState(false)
  // Se decide UNA vez por visita: ~60 % de las veces sale, entre la 4.ª y la 7.ª publicación
  const [suggestPlan] = useState(() => ({ show: Math.random() < 0.6, at: 4 + Math.floor(Math.random() * 4) }))
  const [suggestOk, setSuggestOk] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setSuggestOk(!suggestionsHidden()), 0)
    return () => window.clearTimeout(t)
  }, [])
  const composerRef = useRef<HTMLFormElement | null>(null)

  // Saludo de la caja de publicar según la hora LOCAL de quien abre la página.
  // Se calcula ya en el navegador (no en el servidor) y se revisa cada rato por si cambia la parte del día.
  const [greeting, setGreeting] = useState<{ part: DayPart; text: string } | null>(null)
  const firstName = firstNameOf(displayName, username)
  useEffect(() => {
    if (!username) return
    function refresh() {
      const part = dayPartFor()
      setGreeting((prev) => (prev && prev.part === part && prev.text.includes(firstName) ? prev : { part, text: pickGreeting(part, firstName) }))
    }
    const first = window.setTimeout(refresh, 0)
    const interval = window.setInterval(refresh, 5 * 60 * 1000)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(interval)
    }
  }, [username, firstName])

  // «Responder» en la pregunta del día: la caja queda con «#PreguntaDelDia + pregunta» y un renglón libre abajo
  const answerDailyQuestion = (question: string) => {
    const header = `#${DAILY_TAG} ${question}`
    setContent((prev) => {
      if (prev.includes(`#${DAILY_TAG}`)) return prev
      return (prev.trim() ? `${header}\n${prev}` : `${header}\n`).slice(0, MAX_POST_LENGTH)
    })
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(() => mentionRef.current?.focusEnd(), 60)
  }
  const router = useRouter()

  // El inicio carga de 15 en 15 ("Ver más") en vez de traer TODAS las publicaciones de una vez.
  // Se pide una de más para saber si todavía quedan por mostrar.
  const feedLimit = useRef(FEED_PAGE)
  const newestSeen = useRef<string | null>(null)
  const [hasMoreFeed, setHasMoreFeed] = useState(false)
  const [loadingMoreFeed, setLoadingMoreFeed] = useState(false)
  const [newPostsAvailable, setNewPostsAvailable] = useState(false)
  const [postMusic, setPostMusic] = useState<ReturnType<typeof toStoredTrack> | null>(null)
  const [musicPickerOpen, setMusicPickerOpen] = useState(false)

  // Feed clásico (sin compartidos): solo se usa si todavía no se corrió el SQL de la v1.1.10
  const loadLegacyPosts = async () => {
    const query = (select: string) =>
      supabase
        .from('posts')
        .select(select)
        .order('created_at', { ascending: false })
        .limit(feedLimit.current + 1)
    let res: { data: unknown; error: { message: string } | null } = await query(POST_SELECT)
    // A veces Supabase rechaza la sesión por un instante ("JWT issued at future": relojes desfasados).
    // Es pasajero: se reintenta una vez a los 1.5 s en vez de dejar el inicio vacío.
    if (res.error && /JWT/i.test(res.error.message)) {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      res = await query(POST_SELECT)
    }
    if (res.error && /reposts|posts_visibility|relationship|schema cache/i.test(res.error.message)) {
      res = await query(POST_SELECT.replace(', reposts(user_id)', '').replace('posts_visibility, ', ''))
    }
    if (res.error) console.error('Error cargando posts:', res.error.message)
    return { posts: (res.data as Post[] | null) ?? [], error: res.error?.message ?? '' }
  }

  // El feed lo arma la base de datos (feed_items): publicaciones + compartidos, sin lo que ocultaste y
  // según tu preferencia de Configuración (Todos / Siguiendo / Amigos).
  // v1.6.3 · con `reuse` solo se piden completas las publicaciones que todavía no tienes (publicar, «Ver más»); sin `reuse`, todo se renueva.
  const itemsRef = useRef<FeedItem[]>([])
  useEffect(() => {
    itemsRef.current = items
  }, [items])
  const loadPosts = async (reuse = false) => {
    const known = reuse && itemsRef.current.length > 0 ? new Map<string, Post>(itemsRef.current.map((it): [string, Post] => [it.post.id, it.post])) : undefined
    const res = await fetchFeedItems('home', feedLimit.current, null, loadLegacyPosts, false, known)
    if (res.error) console.error('Error cargando posts:', res.error)
    setHasMoreFeed(res.hasMore)
    setItems(res.items)
    newestSeen.current = res.items[0]?.sortAt ?? null
    setNewPostsAvailable(false)
    setLoadingPosts(false)
  }

  const loadMoreFeed = async () => {
    setLoadingMoreFeed(true)
    feedLimit.current += FEED_PAGE
    await loadPosts(true)
    setLoadingMoreFeed(false)
  }

  const loadStatuses = useCallback(async () => {
    if (!userId) return
    const [list, mine] = await Promise.all([fetchFeedStatuses(20), fetchStatus(userId)])
    setStatuses(list)
    setMyStatus(mine)
  }, [userId])
  useEffect(() => {
    const t = window.setTimeout(() => void loadStatuses(), 0)
    const on = () => void loadStatuses()
    window.addEventListener(STATUS_CHANGED_EVENT, on)
    const offWake = onWake(on, 120_000)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener(STATUS_CHANGED_EVENT, on)
      offWake()
    }
  }, [loadStatuses])

  // Mezcla publicaciones y estados por fecha. Un estado solo entra si es más nuevo que lo último que ya cargaste
  // (así no aparecen estados viejos «sueltos» arriba de publicaciones que todavía no pediste con «Ver más»).
  const feedList = useMemo(() => {
    type Row = { kind: 'post'; at: number; item: FeedItem; idx: number } | { kind: 'status'; at: number; st: FeedStatus }
    const oldest = items.length > 0 && hasMoreFeed ? new Date(items[items.length - 1].sortAt).getTime() : 0
    const rows: Row[] = items.map((item, idx) => ({ kind: 'post', at: new Date(item.sortAt).getTime(), item, idx }))
    for (const st of statuses) {
      const at = new Date(st.updated_at).getTime()
      if (at >= oldest) rows.push({ kind: 'status', at, st })
    }
    return rows.sort((a, b) => b.at - a.at)
  }, [items, statuses, hasMoreFeed])

  useEffect(() => {
    function run() {
      loadPosts()
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Aviso de "hay publicaciones nuevas".
  // v1.6.3 · Primero una mirada BARATA a la fecha de la última publicación/compartido; solo si hay algo más nuevo que lo que ya cargaste
  // se llama a la función pesada feed_items (que respeta ocultos y tu preferencia). Se revisa cada 3 min y solo con la pestaña a la vista.
  const confirmedHead = useRef<string | null>(null)
  useEffect(() => {
    async function check() {
      if (!newestSeen.current) return
      const [p, r] = await Promise.all([
        supabase.from('posts').select('created_at').order('created_at', { ascending: false }).limit(1),
        supabase.from('reposts').select('created_at').order('created_at', { ascending: false }).limit(1),
      ])
      if (p.error) return
      const heads = [p.data?.[0]?.created_at, r.error ? undefined : r.data?.[0]?.created_at].filter((x): x is string => !!x)
      if (heads.length === 0) return
      const head = heads.reduce((a, b) => (new Date(a).getTime() >= new Date(b).getTime() ? a : b))
      if (new Date(head).getTime() <= new Date(newestSeen.current).getTime()) return
      if (confirmedHead.current === head) return // ya se comprobó: es de alguien que tienes oculto o fuera de tu preferencia
      confirmedHead.current = head
      const { data: feedHead, error: feedErr } = await supabase.rpc('feed_items', { p_scope: 'home', p_user: null, p_limit: 1 })
      const latest = feedErr ? head : ((feedHead as { sort_at: string }[] | null)?.[0]?.sort_at as string | undefined)
      if (latest && newestSeen.current && new Date(latest).getTime() > new Date(newestSeen.current).getTime()) {
        setNewPostsAvailable(true)
      }
    }
    return startPoll(check, ECO.feedCheckMs)
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
    if (!content.trim() && drafts.length === 0 && !postMusic) return
    if (content.length > MAX_POST_LENGTH) {
      setPostError(`El texto puede tener máximo ${MAX_POST_LENGTH} caracteres.`)
      return
    }
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
      music: postMusic && normalizeTrack(postMusic) ? postMusic : null,
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
    setPostMusic(null)
    setLoading(false)
    loadPosts(true)
  }

  // v1.5.8 · Manejadores ESTABLES (useCallback + ref a loadPosts) para que las tarjetas del feed no se repinten con cada tecla que
  // escribes en la caja de publicar, y «me gusta» instantáneo: antes cada like volvía a pedir TODO el feed (se sentía lento).
  const loadPostsRef = useRef(loadPosts)
  useEffect(() => {
    loadPostsRef.current = loadPosts
  })
  const reload = useCallback(() => {
    void loadPostsRef.current()
  }, [])

  const handleLike = useCallback(
    async (post: Post) => {
      if (!userId) {
        router.push('/login')
        return
      }
      const alreadyLiked = post.likes.some((l) => l.user_id === userId)
      setItems((prev) =>
        prev.map((it) =>
          it.post.id === post.id
            ? { ...it, post: { ...it.post, likes: alreadyLiked ? it.post.likes.filter((l) => l.user_id !== userId) : [...it.post.likes, { user_id: userId }] } }
            : it
        )
      )
      const res = alreadyLiked
        ? await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', userId)
        : await supabase.from('likes').insert({ post_id: post.id, user_id: userId })
      if (res.error) reload() // no se pudo: se vuelve a lo real
    },
    [userId, router, reload]
  )

  const handleLikeComment = useCallback(
    async (commentId: string, alreadyLiked: boolean) => {
      if (!userId) {
        router.push('/login')
        return
      }
      setItems((prev) =>
        prev.map((it) =>
          it.post.comments.some((c) => c.id === commentId)
            ? {
                ...it,
                post: {
                  ...it.post,
                  comments: it.post.comments.map((c) =>
                    c.id === commentId
                      ? { ...c, comment_likes: alreadyLiked ? c.comment_likes.filter((l) => l.user_id !== userId) : [...c.comment_likes, { user_id: userId }] }
                      : c
                  ),
                },
              }
            : it
        )
      )
      const res = alreadyLiked
        ? await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId)
        : await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId })
      if (res.error) reload()
    },
    [userId, router, reload]
  )

  const handleAddComment = useCallback(
    async (postId: string, text: string, parentCommentId?: string | null) => {
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
      reload()
    },
    [userId, router, reload]
  )

  const draftImages: PostImage[] = drafts.map((d) => ({ url: d.previewUrl, path: d.id, w: d.w, h: d.h }))
  const canPublish =
    (content.trim().length > 0 || drafts.length > 0 || !!postMusic) &&
    content.length <= MAX_POST_LENGTH &&
    !loading &&
    !processingImages

  return (
    <div className={`max-w-[944px] mx-auto py-6 px-4 lg:flex lg:items-start lg:justify-center lg:gap-6 ${MISSIONS_SIDE === 'left' ? 'lg:flex-row-reverse' : ''}`}>
      {missionsOverlay}
      <div className="w-full min-w-0 max-w-xl mx-auto lg:mx-0 lg:flex-1">
      <AnnouncementBanner />
      <InstallBanner />
      {username && <PushPrompt />}

      {/* Historias de 24 h (v1.2.0): solo personas que sigues, amigos primero */}
      <StoriesTray />

      {/* Misiones: en pantallas chicas, tarjeta plegable; en PC grande van en la columna de la derecha */}
      {username && <MissionsInline state={missions} />}

      {username && (
        <form ref={composerRef} onSubmit={handlePost} className="surface-card rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex gap-3">
            <Avatar username={username} avatarUrl={avatarUrl} size="w-10 h-10" textSize="text-sm" sizes="48px" />
            <MentionField
              ref={mentionRef}
              multiline
              value={content}
              onValueChange={(v) => setContent(v.slice(0, MAX_POST_LENGTH))}
              maxLength={MAX_POST_LENGTH}
              formatting
              placeholder={greeting?.text ?? '¿Qué está pasando en Daiwa?'}
              wrapperClassName="flex-1 min-w-0"
              className="w-full bg-transparent text-[15px] leading-relaxed py-1.5 resize-none focus:outline-none placeholder:text-neutral-500 max-h-[min(55vh,26rem)]"
              rows={3}
            />
          </div>
          {content.length > MAX_POST_LENGTH - 250 && (
            <p
              className={`text-[11px] text-right mt-1 tabular-nums ${
                content.length >= MAX_POST_LENGTH ? 'text-garnet-400' : content.length > MAX_POST_LENGTH - 100 ? 'text-amber-300' : 'text-neutral-500'
              }`}
            >
              {content.length}/{MAX_POST_LENGTH}
            </p>
          )}

          {drafts.length > 0 && (
            <div className="mt-3">
              <PostImages images={draftImages} onRemove={removeDraft} />
            </div>
          )}

          {postMusic && (
            <div className="mt-3">
              <MusicChip track={postMusic} variant="compact" onRemove={() => setPostMusic(null)} />
            </div>
          )}

          {postError && <p className="text-xs text-garnet-400 mt-3">{postError}</p>}

          <div className="flex flex-wrap items-center justify-between gap-y-2 mt-2 pt-2 border-t border-ink-700">
            <div className="flex flex-wrap items-center gap-1">
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
              <button
                type="button"
                onClick={() => setMusicPickerOpen(true)}
                disabled={loading}
                className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-garnet-400 disabled:opacity-40 rounded-full px-2.5 py-1.5 hover:bg-ink-700 transition"
                aria-label="Agregar canción"
              >
                <MusicIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Canción</span>
              </button>
              <button
                type="button"
                onClick={() => mentionRef.current?.openPicker()}
                disabled={loading || content.length >= MAX_POST_LENGTH}
                className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-garnet-400 disabled:opacity-40 rounded-full px-2.5 py-1.5 hover:bg-ink-700 transition"
                aria-label="Etiquetar a alguien"
              >
                <AtIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Etiquetar</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusOpen(true)}
                disabled={loading}
                className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-garnet-400 disabled:opacity-40 rounded-full px-2.5 py-1.5 hover:bg-ink-700 transition"
                aria-label={myStatus ? 'Cambiar mi estado' : 'Poner un estado'}
              >
                <SmileIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Estado</span>
              </button>
              <span className="w-px h-5 bg-ink-700 mx-0.5" aria-hidden="true" />
              <FormatToolbar target={mentionRef} disabled={loading} />
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
          <MusicPicker
            open={musicPickerOpen}
            title="Añade una canción a tu publicación"
            onClose={() => setMusicPickerOpen(false)}
            onPick={(t) => {
              setPostMusic(toStoredTrack(t))
              setMusicPickerOpen(false)
            }}
          />
        </form>
      )}

      <StatusSheet open={statusOpen} current={myStatus} onClose={() => setStatusOpen(false)} onSaved={(st) => setMyStatus(st)} />

      {username && <DailyQuestionCard onAnswer={answerDailyQuestion} />}

      <div className="space-y-4">
        {newPostsAvailable && (
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' })
              loadPosts()
            }}
            className="w-full bg-garnet-600/15 border border-garnet-600/40 text-garnet-300 hover:bg-garnet-600/25 rounded-full py-2 text-sm font-medium transition"
          >
            Hay publicaciones nuevas · Ver
          </button>
        )}
        {loadingPosts ? (
          <p className="text-neutral-500 text-sm text-center py-10">Cargando publicaciones...</p>
        ) : items.length === 0 ? (
          <p className="text-neutral-500 text-sm text-center py-10">
            Todavía no hay publicaciones. ¡Sé el primero!
          </p>
        ) : (
          feedList.map((row, i) => (
            <Fragment key={row.kind === 'post' ? row.item.key : `st-${row.st.user_id}`}>
              {row.kind === 'post' ? (
                <PostCard
                  priorityImages={row.idx === 0}
                  post={row.item.post}
                  repostedBy={row.item.repostedBy}
                  onUserHidden={reload}
                  currentUserId={userId}
                  onToggleLike={handleLike}
                  onToggleCommentLike={handleLikeComment}
                  onAddComment={handleAddComment}
                  onRefresh={reload}
                />
              ) : (
                <StatusCard key={`${row.st.user_id}-${row.st.updated_at}`} item={row.st} mine={row.st.user_id === userId} onEdit={() => setStatusOpen(true)} />
              )}
              {/* v1.6.2 · sugerencias de seguimiento: de vez en cuando y más abajo en el feed (o al final si hay pocas publicaciones) */}
              {userId && suggestOk && suggestPlan.show && i === Math.min(suggestPlan.at, feedList.length - 1) && feedList.length >= 3 && <FollowSuggestions userId={userId} />}
            </Fragment>
          ))
        )}
        {hasMoreFeed && !loadingPosts && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={loadMoreFeed}
              disabled={loadingMoreFeed}
              className="text-sm border border-ink-600 text-neutral-300 rounded-full px-5 py-2 hover:bg-ink-800 transition disabled:opacity-60"
            >
              {loadingMoreFeed ? 'Cargando...' : 'Ver más publicaciones'}
            </button>
          </div>
        )}
      </div>
      </div>

      {/* PC grande: misiones a un lado del feed (diarias y semanales, plegables) */}
      {username && <MissionsSide state={missions} />}
    </div>
  )
}
