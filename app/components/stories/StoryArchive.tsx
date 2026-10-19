'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, EyeIcon, HeartIcon, StarIcon, TrashIcon } from '../icons'
import { supabase } from '../../lib/supabaseClient'
import Sheet from './Sheet'
import StoryCanvas from './StoryCanvas'
import StoryThumb from './StoryThumb'
import HighlightPickerSheet from './HighlightPickerSheet'
import { deleteStory, emitStoriesChanged, fetchArchive, fetchStorySettings, signedStoryUrls, trackFromStory, type StoryRow } from '../../lib/stories'

/** Archivo privado (v1.2.0): tus historias activas y las vencidas dentro del plazo, por mes. Solo lectura + ★ Destacar y Eliminar. */
export default function StoryArchive() {
  const router = useRouter()
  const [rows, setRows] = useState<StoryRow[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [me, setMe] = useState<string | null>(null)
  const [open, setOpen] = useState<StoryRow | null>(null)
  const [picker, setPicker] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      router.replace('/login')
      return
    }
    setMe(data.user.id)
    const [list, settings] = await Promise.all([fetchArchive(null, 200), fetchStorySettings()])
    setRows(list)
    setDays(settings.archive_days)
    const paths = list.map((s) => s.media_path).filter((p): p is string => !!p)
    if (paths.length) setUrls(await signedStoryUrls(paths))
    setLoading(false)
  }, [router])

  useEffect(() => {
    function run() {
      void load()
    }
    run()
  }, [load])

  const months = useMemo(() => {
    const m = new Map<string, StoryRow[]>()
    for (const s of rows) {
      const k = new Date(s.created_at).toLocaleDateString('es', { month: 'long', year: 'numeric' })
      m.set(k, [...(m.get(k) ?? []), s])
    }
    return [...m.entries()]
  }, [rows])

  const remove = async () => {
    if (!open) return
    const err = await deleteStory(open.id)
    setConfirm(false)
    if (err) {
      setError(err)
      return
    }
    setRows((r) => r.filter((s) => s.id !== open.id))
    setOpen(null)
    emitStoriesChanged()
  }

  return (
    <div className="min-h-dvh bg-[#0c0c0f] text-neutral-100">
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-[#0c0c0f]/90 backdrop-blur border-b border-white/10" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <button type="button" onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))} aria-label="Volver" className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[16px] font-semibold leading-tight">Archivo de historias</h1>
          <p className="text-[12px] text-neutral-400">{days > 0 ? `Solo tú lo ves. Tus historias vencidas se guardan ${days} días.` : 'Solo tú lo ves.'}</p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-3 py-4">
        {loading ? (
          <p className="py-16 text-center text-sm text-neutral-500">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-neutral-500">Todavía no hay nada en tu archivo.</p>
        ) : (
          months.map(([month, list]) => (
            <section key={month} className="mb-6">
              <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-neutral-400 capitalize">{month}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {list.map((s) => (
                  <button key={s.id} type="button" onClick={() => setOpen(s)} className="relative rounded-xl overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-white">
                    <StoryThumb story={s} url={s.media_path ? urls[s.media_path] : null} />
                    <span className="absolute left-1 bottom-1 rounded bg-black/55 text-[10px] px-1">{new Date(s.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' }).replace('.', '')}</span>
                    {s.is_active && <span className="absolute left-1 top-1 rounded bg-emerald-600 text-[9px] px-1 font-semibold">Activa</span>}
                    {s.in_highlight && <StarIcon className="absolute right-1 top-1 w-4 h-4 text-amber-300" />}
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <Sheet open={!!open && !picker && !confirm} onClose={() => setOpen(null)} tall title={open ? new Date(open.created_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}>
        {open && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-[min(100%,280px)] rounded-2xl overflow-hidden shadow-xl">
              <StoryCanvas bg={open.bg} mediaUrl={open.media_path ? urls[open.media_path] : null} elements={open.elements} track={trackFromStory(open)} animate={false} />
            </div>
            <div className="flex items-center gap-4 text-[13px] text-neutral-300">
              <span className="flex items-center gap-1"><EyeIcon className="w-4 h-4" /> {open.view_count ?? 0}</span>
              <span className="flex items-center gap-1"><HeartIcon filled className="w-4 h-4 text-garnet-500" /> {open.like_count ?? 0}</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPicker(true)} className="flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"><StarIcon className="w-4 h-4 text-amber-300" /> Destacar</button>
              <button type="button" onClick={() => setConfirm(true)} className="flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-sm text-garnet-300 hover:bg-white/10"><TrashIcon className="w-4 h-4" /> Eliminar</button>
            </div>
            {error && <p className="text-xs text-garnet-300">{error}</p>}
          </div>
        )}
      </Sheet>
      {open && me && <HighlightPickerSheet open={picker} onClose={() => setPicker(false)} storyId={open.id} userId={me} />}
      <Sheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="¿Eliminar esta historia?"
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setConfirm(false)} className="flex-1 rounded-full border border-white/20 py-2.5 text-sm">Cancelar</button>
            <button type="button" onClick={remove} className="flex-1 rounded-full bg-garnet-600 py-2.5 text-sm font-medium">Eliminar</button>
          </div>
        }
      >
        <p className="text-sm text-neutral-300">Esta historia se borrará también de tus destacadas.</p>
      </Sheet>
    </div>
  )
}
