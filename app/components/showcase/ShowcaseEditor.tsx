'use client'

// v1.9.0 · Editor de la vitrina: activar/desactivar, título, agregar (publicación, frase, canción, recuerdo), ordenar y quitar.
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import MusicChip from '../MusicChip'
import MusicPicker from '../MusicPicker'
import { CloseIcon, MusicIcon, PlusIcon } from '../icons'
import { getShowcase, newItemId, saveShowcase, type Showcase, type ShowcaseItem } from '../../lib/showcase'
import { toStoredTrack, type MusicTrack } from '../../lib/music'

type Props = { userId: string; initial: Showcase | null; onClose: () => void; onSaved: (s: Showcase | null) => void }
type Adding = null | 'post' | 'quote' | 'memory'
type MyPost = { id: string; content: string; created_at: string; images: { url?: string }[] | null }

const inputCls = 'w-full rounded-lg bg-ink-700 border border-ink-600 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-garnet-500'
const TYPE_LABEL: Record<ShowcaseItem['type'], string> = { post: 'Publicación', quote: 'Frase', song: 'Canción', memory: 'Recuerdo' }

function summary(it: ShowcaseItem): string {
  if (it.type === 'post') return it.post?.content?.trim() || (it.post?.image ? 'Publicación con foto' : 'Publicación')
  if (it.type === 'quote') return `“${it.text}”`
  if (it.type === 'song') return 'Canción'
  return it.title
}

export default function ShowcaseEditor({ userId, initial, onClose, onSaved }: Props) {
  const [enabled, setEnabled] = useState(initial?.enabled ?? true)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [items, setItems] = useState<ShowcaseItem[]>(initial?.items ?? [])
  const [limit, setLimit] = useState<number>(initial?.limit ?? 4)
  const [adding, setAdding] = useState<Adding>(null)
  const [pickSong, setPickSong] = useState(false)
  const [myPosts, setMyPosts] = useState<MyPost[] | null>(null)
  const [quote, setQuote] = useState({ text: '', by: '' })
  const [memory, setMemory] = useState({ title: '', text: '', date: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // si se abrió sin datos cargados (p. ej. primera vez), se piden para conocer el tope
  useEffect(() => {
    if (initial) return
    void getShowcase(userId, true).then((s) => {
      if (!s) return
      setEnabled(s.enabled || s.items.length === 0)
      setTitle(s.title ?? '')
      setItems(s.items)
      if (s.limit) setLimit(s.limit)
    })
  }, [initial, userId])

  useEffect(() => {
    if (adding !== 'post' || myPosts) return
    void supabase
      .from('posts')
      .select('id, content, created_at, images')
      .eq('user_id', userId)
      .is('club_id', null)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setMyPosts((data as unknown as MyPost[] | null) ?? []))
  }, [adding, myPosts, userId])

  const full = items.length >= limit
  const usedPostIds = useMemo(() => new Set(items.filter((i) => i.type === 'post').map((i) => (i as { post_id: string }).post_id)), [items])
  const add = (it: ShowcaseItem) => {
    setItems((l) => [...l, it])
    setAdding(null)
    setError('')
  }
  const move = (i: number, d: -1 | 1) =>
    setItems((l) => {
      const j = i + d
      if (j < 0 || j >= l.length) return l
      const n = [...l]
      ;[n[i], n[j]] = [n[j], n[i]]
      return n
    })

  const save = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    const { showcase, error: err } = await saveShowcase(enabled, title, items, userId)
    setBusy(false)
    if (err) return setError(err)
    onSaved(showcase)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Editar vitrina" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-ink-600 bg-ink-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold text-neutral-50">Mi vitrina</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar" className="rounded-full p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-ink-700 transition"><CloseIcon className="w-5 h-5" /></button>
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-ink-600 bg-ink-700/40 px-3.5 py-3 cursor-pointer">
          <span className="flex-1 min-w-0">
            <span className="block text-sm text-neutral-100">Mostrar la vitrina en mi perfil</span>
            <span className="block text-xs text-neutral-500">Puedes apagarla cuando quieras; lo que agregaste se queda guardado.</span>
          </span>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="sr-only peer" />
          <span className="relative w-11 h-6 rounded-full bg-ink-600 peer-checked:bg-garnet-600 transition shrink-0 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5 motion-reduce:after:transition-none" aria-hidden />
        </label>

        <label className="block">
          <span className="text-xs text-neutral-400">Título (opcional)</span>
          <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 30))} placeholder="Vitrina" className={`${inputCls} mt-1`} />
        </label>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Elementos</p>
            <p className="text-xs text-neutral-500 tabular-nums">{items.length}/{limit}</p>
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-neutral-500 py-3">Todavía no agregaste nada.</p>
          ) : (
            <ul className="space-y-1.5">
              {items.map((it, i) => (
                <li key={it.id} className="flex items-center gap-2 rounded-xl border border-ink-600 bg-ink-700/40 px-3 py-2">
                  <span className="shrink-0 rounded-full bg-ink-600 px-2 py-0.5 text-[10px] text-neutral-300">{TYPE_LABEL[it.type]}</span>
                  <span className="flex-1 min-w-0 text-sm text-neutral-200 truncate">{it.type === 'song' ? <MusicChip track={it.track} /> : summary(it)}</span>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir" className="p-1 text-neutral-500 hover:text-neutral-200 disabled:opacity-30">▲</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Bajar" className="p-1 text-neutral-500 hover:text-neutral-200 disabled:opacity-30">▼</button>
                  <button type="button" onClick={() => setItems((l) => l.filter((x) => x.id !== it.id))} aria-label="Quitar" className="p-1 text-neutral-500 hover:text-garnet-400"><CloseIcon className="w-4 h-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!adding && (
          <div>
            <p className="text-xs text-neutral-400 mb-1.5">Agregar</p>
            <div className="grid grid-cols-2 gap-1.5">
              {([['post', 'Publicación'], ['quote', 'Frase'], ['song', 'Canción'], ['memory', 'Recuerdo']] as const).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  disabled={full}
                  onClick={() => (k === 'song' ? setPickSong(true) : setAdding(k))}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-ink-600 py-2 text-sm text-neutral-200 hover:border-garnet-500 hover:text-garnet-300 disabled:opacity-40 transition"
                >
                  {k === 'song' ? <MusicIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />} {label}
                </button>
              ))}
            </div>
            {full && <p className="mt-1.5 text-[11px] text-neutral-500">Llegaste al tope. Con el Círculo Lunar caben más elementos.</p>}
          </div>
        )}

        {adding === 'post' && (
          <div className="rounded-xl border border-ink-600 p-3 space-y-2">
            <p className="text-sm text-neutral-200">Elige una de tus publicaciones</p>
            {!myPosts ? (
              <p className="text-xs text-neutral-500">Cargando...</p>
            ) : myPosts.length === 0 ? (
              <p className="text-xs text-neutral-500">Todavía no tienes publicaciones abiertas (las de club no se pueden destacar).</p>
            ) : (
              <ul className="max-h-56 overflow-y-auto space-y-1">
                {myPosts.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={usedPostIds.has(p.id)}
                      onClick={() => add({ id: newItemId(), type: 'post', post_id: p.id, post: { id: p.id, content: p.content.slice(0, 240), created_at: p.created_at, image: p.images?.[0] ?? null } })}
                      className="w-full text-left rounded-lg px-2.5 py-2 text-sm text-neutral-200 hover:bg-ink-700 disabled:opacity-40 transition"
                    >
                      <span className="line-clamp-2 break-words">{p.content.trim() || 'Publicación con foto'}</span>
                      <span className="text-[11px] text-neutral-500">{new Date(p.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" onClick={() => setAdding(null)} className="text-xs text-neutral-400 hover:text-neutral-200">Cancelar</button>
          </div>
        )}
        {adding === 'quote' && (
          <div className="rounded-xl border border-ink-600 p-3 space-y-2">
            <textarea value={quote.text} onChange={(e) => setQuote({ ...quote, text: e.target.value.slice(0, 280) })} rows={3} placeholder="Una frase que te represente" className={`${inputCls} resize-none`} />
            <input value={quote.by} onChange={(e) => setQuote({ ...quote, by: e.target.value.slice(0, 60) })} placeholder="De quién es (opcional)" className={inputCls} />
            <div className="flex items-center gap-2">
              <button type="button" disabled={!quote.text.trim()} onClick={() => { add({ id: newItemId(), type: 'quote', text: quote.text.trim(), by: quote.by.trim() || undefined }); setQuote({ text: '', by: '' }) }} className="rounded-full bg-garnet-600 px-4 py-1.5 text-sm text-white disabled:opacity-50">Agregar</button>
              <button type="button" onClick={() => setAdding(null)} className="text-xs text-neutral-400 hover:text-neutral-200">Cancelar</button>
              <span className="ml-auto text-[11px] text-neutral-500 tabular-nums">{quote.text.length}/280</span>
            </div>
          </div>
        )}
        {adding === 'memory' && (
          <div className="rounded-xl border border-ink-600 p-3 space-y-2">
            <input value={memory.title} onChange={(e) => setMemory({ ...memory, title: e.target.value.slice(0, 60) })} placeholder="Título del recuerdo" className={inputCls} />
            <input type="date" value={memory.date} onChange={(e) => setMemory({ ...memory, date: e.target.value })} className={inputCls} aria-label="Fecha (opcional)" />
            <textarea value={memory.text} onChange={(e) => setMemory({ ...memory, text: e.target.value.slice(0, 400) })} rows={3} placeholder="Cuéntalo (opcional)" className={`${inputCls} resize-none`} />
            <div className="flex items-center gap-2">
              <button type="button" disabled={!memory.title.trim()} onClick={() => { add({ id: newItemId(), type: 'memory', title: memory.title.trim(), text: memory.text.trim() || undefined, date: memory.date || undefined }); setMemory({ title: '', text: '', date: '' }) }} className="rounded-full bg-garnet-600 px-4 py-1.5 text-sm text-white disabled:opacity-50">Agregar</button>
              <button type="button" onClick={() => setAdding(null)} className="text-xs text-neutral-400 hover:text-neutral-200">Cancelar</button>
              <span className="ml-auto text-[11px] text-neutral-500 tabular-nums">{memory.text.length}/400</span>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-garnet-400" role="alert">{error}</p>}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-full px-4 py-2 text-sm text-neutral-400 hover:text-neutral-100 transition">Cancelar</button>
          <button type="button" onClick={save} disabled={busy} className="rounded-full bg-garnet-600 hover:bg-garnet-500 px-5 py-2 text-sm font-medium text-white disabled:opacity-50 transition">{busy ? 'Guardando...' : 'Guardar vitrina'}</button>
        </div>
      </div>

      <MusicPicker
        open={pickSong}
        onClose={() => setPickSong(false)}
        title="Elige la canción de tu vitrina"
        onPick={(t: MusicTrack) => {
          setPickSong(false)
          add({ id: newItemId(), type: 'song', track: toStoredTrack(t) })
        }}
      />
    </div>
  )
}
