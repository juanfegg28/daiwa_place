'use client'

// v1.9.0 · Guardados: tus publicaciones guardadas (privadas) ordenadas en colecciones.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import AppShell, { useAppSession } from '../components/AppShell'
import PostCard from '../components/PostCard'
import ConfirmDialog from '../components/ConfirmDialog'
import { BookmarkIcon, FolderIcon, PlusIcon } from '../components/icons'
import { fetchPostsByIds } from '../lib/queries'
import type { Post } from '../lib/types'
import {
  createCollection,
  deleteCollection,
  getSavedOverview,
  listSavedIds,
  renameCollection,
  type SavedOverview,
} from '../lib/saved'

type View = { kind: 'all' } | { kind: 'unfiled' } | { kind: 'col'; id: string }
type Row = { post_id: string; collection_id: string | null; saved_at: string }
const PAGE = 10

export default function SavedPage() {
  return (
    <AppShell>
      <SavedContent />
    </AppShell>
  )
}

function SavedContent() {
  const router = useRouter()
  const { userId } = useAppSession()
  const [ov, setOv] = useState<SavedOverview | null>(null)
  const [view, setView] = useState<View>({ kind: 'all' })
  const [rows, setRows] = useState<Row[]>([])
  const [posts, setPosts] = useState<Map<string, Post>>(new Map())
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const [busy, setBusy] = useState(false)
  const seq = useRef(0)

  const viewKey = view.kind === 'col' ? `c:${view.id}` : view.kind
  const currentCol = view.kind === 'col' ? ov?.collections.find((c) => c.id === view.id) ?? null : null

  const load = useCallback(
    async (append: boolean) => {
      const my = ++seq.current
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError('')
      const before = append ? rows[rows.length - 1]?.saved_at ?? null : null
      const { rows: page, error: err } = await listSavedIds({
        collection: view.kind === 'col' ? view.id : null,
        unfiled: view.kind === 'unfiled',
        before,
        limit: PAGE + 1,
      })
      if (my !== seq.current) return
      if (err) {
        setError('No se pudieron cargar tus guardados. ¿Ya corriste el SQL de la 1.9.0?')
        setLoading(false)
        setLoadingMore(false)
        return
      }
      const slice = page.slice(0, PAGE)
      const { posts: fetched } = await fetchPostsByIds(slice.map((r) => r.post_id))
      if (my !== seq.current) return
      setPosts((prev) => {
        const next = append ? new Map(prev) : new Map<string, Post>()
        for (const p of fetched) next.set(p.id, p)
        return next
      })
      setRows((prev) => (append ? [...prev, ...slice] : slice))
      setMore(page.length > PAGE)
      setLoading(false)
      setLoadingMore(false)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewKey, rows.length]
  )

  const refreshOverview = useCallback(async () => setOv(await getSavedOverview(true)), [])
  useEffect(() => {
    const t = window.setTimeout(() => void refreshOverview(), 0)
    return () => window.clearTimeout(t)
  }, [refreshOverview])
  useEffect(() => {
    const t = window.setTimeout(() => void load(false), 0)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewKey])

  // las que ya no existen / ya no puedes ver (autor privado, borradas) simplemente no aparecen
  const visible = useMemo(() => rows.filter((r) => posts.has(r.post_id)), [rows, posts])

  const mutatePost = (id: string, fn: (p: Post) => Post) =>
    setPosts((prev) => {
      const cur = prev.get(id)
      if (!cur) return prev
      const next = new Map(prev)
      next.set(id, fn(cur))
      return next
    })

  const handleLike = async (post: Post) => {
    if (!userId) return router.push('/login')
    const liked = post.likes.some((l) => l.user_id === userId)
    mutatePost(post.id, (p) => ({ ...p, likes: liked ? p.likes.filter((l) => l.user_id !== userId) : [...p.likes, { user_id: userId }] }))
    const { error: e } = liked
      ? await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', userId)
      : await supabase.from('likes').insert({ post_id: post.id, user_id: userId })
    if (e) mutatePost(post.id, () => post)
  }
  const handleLikeComment = async (commentId: string, liked: boolean) => {
    if (!userId) return router.push('/login')
    for (const p of posts.values()) {
      if (!p.comments.some((c) => c.id === commentId)) continue
      mutatePost(p.id, (x) => ({
        ...x,
        comments: x.comments.map((c) =>
          c.id !== commentId ? c : { ...c, comment_likes: liked ? c.comment_likes.filter((l) => l.user_id !== userId) : [...c.comment_likes, { user_id: userId }] }
        ),
      }))
    }
    if (liked) await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId)
    else await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId })
  }
  const reloadOne = async (postId: string) => {
    const { posts: f } = await fetchPostsByIds([postId])
    if (f[0]) mutatePost(postId, () => f[0])
  }
  const handleAddComment = async (postId: string, text: string, parent?: string | null) => {
    if (!userId) return router.push('/login')
    await supabase.from('comments').insert({ post_id: postId, user_id: userId, content: text, parent_comment_id: parent ?? null })
    await reloadOne(postId)
  }

  // guardar / mover / quitar desde la tarjeta
  const onSavedChange = (post: Post, saved: boolean, col: string | null) => {
    void refreshOverview()
    if (!saved || (view.kind === 'col' && col !== view.id) || (view.kind === 'unfiled' && col !== null)) {
      setRows((r) => r.filter((x) => x.post_id !== post.id))
    } else {
      setRows((r) => r.map((x) => (x.post_id === post.id ? { ...x, collection_id: col } : x)))
    }
  }

  const addCollection = async () => {
    if (!newName.trim() || busy) return
    setBusy(true)
    const { collection, error: err } = await createCollection(newName)
    setBusy(false)
    if (err || !collection) return setError(err)
    setNewName('')
    setAdding(false)
    await refreshOverview()
    setView({ kind: 'col', id: collection.id })
  }
  const doRename = async () => {
    if (view.kind !== 'col' || busy) return
    setBusy(true)
    const err = await renameCollection(view.id, renameValue)
    setBusy(false)
    if (err) return setError(err)
    setRenaming(false)
    await refreshOverview()
  }
  const doDelete = async () => {
    if (view.kind !== 'col') return
    setBusy(true)
    const err = await deleteCollection(view.id)
    setBusy(false)
    setConfirmDel(false)
    if (err) return setError(err)
    setView({ kind: 'all' })
    await refreshOverview()
  }

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition ${active ? 'border-garnet-500 bg-garnet-500/15 text-garnet-300' : 'border-ink-600 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200'}`

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      <div className="flex items-center gap-2.5 mb-1">
        <BookmarkIcon filled className="w-6 h-6 text-amber-300" />
        <h1 className="text-2xl font-display font-semibold text-neutral-50">Guardados</h1>
      </div>
      <p className="text-sm text-neutral-500 mb-4">Solo tú ves lo que guardas. Nadie sabe cuántas veces guardaron su publicación.</p>

      <div className="-mx-4 px-4 mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <button type="button" onClick={() => setView({ kind: 'all' })} className={chip(view.kind === 'all')}>
          Todo{ov ? ` · ${ov.total}` : ''}
        </button>
        <button type="button" onClick={() => setView({ kind: 'unfiled' })} className={chip(view.kind === 'unfiled')}>
          Sin colección{ov ? ` · ${ov.unfiled}` : ''}
        </button>
        {ov?.collections.map((c) => (
          <button key={c.id} type="button" onClick={() => setView({ kind: 'col', id: c.id })} className={`${chip(view.kind === 'col' && view.id === c.id)} flex items-center gap-1.5`}>
            <FolderIcon className="w-4 h-4" /> {c.name} · {c.count}
          </button>
        ))}
        <button type="button" onClick={() => setAdding((v) => !v)} className={`${chip(false)} flex items-center gap-1`} aria-label="Nueva colección">
          <PlusIcon className="w-4 h-4" /> Nueva
        </button>
      </div>

      {adding && (
        <div className="mb-4 flex items-center gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value.slice(0, 30))}
            onKeyDown={(e) => e.key === 'Enter' && addCollection()}
            placeholder="Nombre de la colección (máx. 30)"
            className="flex-1 min-w-0 rounded-lg bg-ink-700 border border-ink-600 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-garnet-500"
          />
          <button type="button" onClick={addCollection} disabled={busy || !newName.trim()} className="rounded-lg bg-garnet-600 hover:bg-garnet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition">
            Crear
          </button>
        </div>
      )}

      {currentCol && (
        <div className="mb-4 flex items-center gap-2">
          {renaming ? (
            <>
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value.slice(0, 30))}
                onKeyDown={(e) => e.key === 'Enter' && doRename()}
                className="flex-1 min-w-0 rounded-lg bg-ink-700 border border-ink-600 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-garnet-500"
              />
              <button type="button" onClick={doRename} disabled={busy || !renameValue.trim()} className="rounded-lg bg-garnet-600 px-3 py-2 text-sm text-white disabled:opacity-50">Guardar</button>
              <button type="button" onClick={() => setRenaming(false)} className="rounded-lg px-3 py-2 text-sm text-neutral-400 hover:text-neutral-200">Cancelar</button>
            </>
          ) : (
            <>
              <p className="flex-1 min-w-0 truncate text-sm text-neutral-300">Colección: <span className="font-medium text-neutral-100">{currentCol.name}</span></p>
              <button type="button" onClick={() => { setRenameValue(currentCol.name); setRenaming(true) }} className="text-xs text-neutral-400 hover:text-garnet-400 transition">Renombrar</button>
              <button type="button" onClick={() => setConfirmDel(true)} className="text-xs text-neutral-400 hover:text-garnet-400 transition">Eliminar</button>
            </>
          )}
        </div>
      )}

      {error && <p className="text-sm text-garnet-400 mb-3">{error}</p>}

      <div className="space-y-4">
        {loading ? (
          <p className="text-neutral-500 text-sm text-center py-10">Cargando tus guardados...</p>
        ) : visible.length === 0 ? (
          <div className="text-center py-12 px-4">
            <BookmarkIcon className="w-10 h-10 mx-auto text-neutral-600 mb-3" />
            <p className="text-neutral-300 text-sm mb-1">{view.kind === 'all' ? 'Todavía no guardaste nada' : 'No hay publicaciones aquí'}</p>
            <p className="text-neutral-500 text-xs mb-4">Toca el marcador de cualquier publicación para guardarla y organizarla en colecciones.</p>
            <Link href="/explorar" className="inline-block rounded-full border border-ink-600 px-4 py-2 text-sm text-neutral-300 hover:border-garnet-500 hover:text-garnet-300 transition">Ir a Explorar</Link>
          </div>
        ) : (
          visible.map((r) => {
            const post = posts.get(r.post_id)!
            return (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={userId}
                onToggleLike={handleLike}
                onToggleCommentLike={handleLikeComment}
                onAddComment={handleAddComment}
                onRefresh={() => load(false)}
                onSavedChange={onSavedChange}
              />
            )
          })
        )}
        {!loading && more && (
          <button type="button" onClick={() => load(true)} disabled={loadingMore} className="w-full rounded-xl border border-ink-600 py-2.5 text-sm text-neutral-300 hover:border-garnet-500 hover:text-garnet-300 disabled:opacity-50 transition">
            {loadingMore ? 'Cargando...' : 'Ver más'}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmDel}
        title="¿Eliminar la colección?"
        message={`Se borra la colección «${currentCol?.name ?? ''}». Las publicaciones que tenía NO se borran: pasan a «Sin colección».`}
        confirmLabel="Eliminar colección"
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setConfirmDel(false)}
      />
    </div>
  )
}
