'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import AppShell, { useAppSession } from '../components/AppShell'
import { PlusIcon, WhisperIcon } from '../components/icons'
import {
  MY_WHISPER_SELECT,
  WHISPER_CATEGORIES,
  WHISPER_PAGE_SIZE,
  WHISPER_SELECT,
  friendlyWhisperError,
  loadMyReports,
  type WhisperItem,
} from '../lib/whispers'
import WhisperCard from './WhisperCard'
import WhisperComposer from './WhisperComposer'
import ReportDialog, { type ReportTarget } from './ReportDialog'

type Tab = 'recientes' | 'populares' | 'mios'
type Range = 'hoy' | 'semana' | 'siempre'

const TABS: { id: Tab; label: string }[] = [
  { id: 'recientes', label: 'Recientes' },
  { id: 'populares', label: 'Populares' },
  { id: 'mios', label: 'Mis susurros' },
]

const RANGES: { id: Range; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'siempre', label: 'Siempre' },
]

function sinceIso(range: Range): string | null {
  if (range === 'siempre') return null
  const ms = range === 'hoy' ? 24 * 3600 * 1000 : 7 * 24 * 3600 * 1000
  return new Date(Date.now() - ms).toISOString()
}

export default function SusurrosPage() {
  return (
    <AppShell>
      <SusurrosContent />
    </AppShell>
  )
}

function SusurrosContent() {
  const { userId, loading: sessionLoading } = useAppSession()
  const router = useRouter()

  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [tab, setTab] = useState<Tab>('recientes')
  const [range, setRange] = useState<Range>('semana')
  const [category, setCategory] = useState<string>('todas')
  const [items, setItems] = useState<WhisperItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [reportedWhispers, setReportedWhispers] = useState<Set<string>>(new Set())
  const [composerOpen, setComposerOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null)

  useEffect(() => {
    if (!sessionLoading && !userId) router.push('/login')
  }, [sessionLoading, userId, router])

  // ¿Está encendido el Muro? y qué cosas ya reporté
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    async function run() {
      const [{ data: on }, reports] = await Promise.all([supabase.rpc('whispers_enabled'), loadMyReports()])
      if (cancelled) return
      setEnabled(on !== false)
      setReportedWhispers(reports.whispers)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [userId])

  const buildQuery = (from: number) => {
    let q = supabase.from('whispers').select(tab === 'mios' ? MY_WHISPER_SELECT : WHISPER_SELECT)
    if (tab !== 'mios') q = q.eq('status', 'visible')
    if (category !== 'todas') q = q.eq('category', category)
    if (tab === 'populares') {
      const since = sinceIso(range)
      if (since) q = q.gte('created_at', since)
      q = q.order('score', { ascending: false }).order('created_at', { ascending: false })
    } else {
      q = q.order('created_at', { ascending: false })
    }
    return q.range(from, from + WHISPER_PAGE_SIZE - 1)
  }

  // Carga la primera página cada vez que cambia el filtro
  useEffect(() => {
    if (!userId || enabled === false) return
    let cancelled = false
    async function run() {
      setLoading(true)
      const { data, error: err } = await buildQuery(0)
      if (cancelled) return
      if (err) {
        setError(friendlyWhisperError(err.message))
        setItems([])
        setHasMore(false)
      } else {
        setError('')
        const rows = (data as unknown as WhisperItem[]) ?? []
        setItems(rows)
        setHasMore(rows.length === WHISPER_PAGE_SIZE)
      }
      setLoading(false)
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, enabled, tab, range, category, reloadKey])

  const loadMore = async () => {
    if (loadingMore) return
    setLoadingMore(true)
    const { data, error: err } = await buildQuery(items.length)
    setLoadingMore(false)
    if (err) {
      setNotice(friendlyWhisperError(err.message))
      return
    }
    const rows = (data as unknown as WhisperItem[]) ?? []
    setItems((prev) => {
      const seen = new Set(prev.map((w) => w.id))
      return [...prev, ...rows.filter((w) => !seen.has(w.id))]
    })
    setHasMore(rows.length === WHISPER_PAGE_SIZE)
  }

  const update = (w: WhisperItem) => setItems((prev) => prev.map((x) => (x.id === w.id ? w : x)))

  if (sessionLoading || !userId || enabled === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Cargando...</p>
      </div>
    )
  }

  if (enabled === false) {
    return (
      <div className="max-w-xl mx-auto py-16 px-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-full border border-ink-600 flex items-center justify-center text-garnet-400 mb-4">
          <WhisperIcon className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-display font-semibold text-neutral-50 mb-2">El Muro está en pausa</h1>
        <p className="text-sm text-neutral-500">
          La administración pausó el Muro de los Susurros por ahora. Vuelve más tarde.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h1 className="text-2xl font-display font-semibold text-neutral-50">Muro de los Susurros</h1>
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="shrink-0 flex items-center gap-1.5 bg-garnet-600 hover:bg-garnet-500 text-white rounded-full pl-3 pr-4 py-2 text-sm font-medium transition"
        >
          <PlusIcon className="w-4 h-4" />
          Susurrar
        </button>
      </div>
      <p className="text-neutral-500 text-sm mb-5">
        Confiesa lo que no te atreves a decir. Aquí todos son un Chismoso Anónimo.
      </p>

      <div className="flex gap-1.5 mb-3 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap text-sm rounded-full px-4 py-2 transition ${
              tab === t.id ? 'bg-garnet-600 text-white' : 'bg-ink-800 text-neutral-300 hover:bg-ink-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'populares' && (
        <div className="flex gap-1.5 mb-3">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={`text-xs rounded-full px-3 py-1.5 transition ${
                range === r.id ? 'border border-garnet-500 text-garnet-300' : 'border border-ink-600 text-neutral-400 hover:bg-ink-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {[{ id: 'todas', label: 'Todas' }, ...WHISPER_CATEGORIES].map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`whitespace-nowrap text-xs rounded-full px-3 py-1.5 transition ${
              category === c.id ? 'bg-ink-600 text-neutral-50' : 'text-neutral-500 hover:text-neutral-200 hover:bg-ink-800'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {notice && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-ink-800 border border-ink-600 px-3.5 py-2.5">
          <p className="text-xs text-neutral-300 flex-1">{notice}</p>
          <button type="button" onClick={() => setNotice('')} className="text-xs text-neutral-500 hover:text-neutral-100">
            Cerrar
          </button>
        </div>
      )}
      {error && <p className="text-xs text-garnet-400 mb-4">{error}</p>}

      {loading ? (
        <p className="text-neutral-500 text-sm text-center py-10">Cargando...</p>
      ) : items.length === 0 && !error ? (
        <div className="surface-card rounded-2xl p-10 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-ink-700 flex items-center justify-center text-garnet-400">
            <WhisperIcon className="w-6 h-6" />
          </div>
          <p className="text-neutral-200 text-sm font-medium">
            {tab === 'mios' ? 'Todavía no has publicado ningún susurro' : 'Aún no hay susurros por aquí'}
          </p>
          <p className="text-neutral-500 text-xs max-w-xs">
            {tab === 'mios'
              ? 'Tus susurros aparecen aquí con la etiqueta (tú). Nadie más sabe que son tuyos.'
              : 'Sé el primero en soltar algo. Nadie sabrá que fuiste tú.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((w) => (
            <WhisperCard
              key={w.id}
              whisper={w}
              reported={reportedWhispers.has(w.id)}
              onUpdate={update}
              onDeleted={(id) => {
                setItems((prev) => prev.filter((x) => x.id !== id))
                setNotice('Tu confesión se eliminó.')
              }}
              onReport={(id) => setReportTarget({ whisperId: id })}
              onNotice={setNotice}
            />
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center mt-5">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="text-sm border border-ink-600 text-neutral-300 rounded-full px-5 py-2 hover:bg-ink-800 transition disabled:opacity-60"
          >
            {loadingMore ? 'Cargando...' : 'Ver más'}
          </button>
        </div>
      )}

      <WhisperComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onCreated={() => {
          setTab('recientes')
          setCategory('todas')
          setReloadKey((k) => k + 1)
          setNotice('Tu susurro ya está en el Muro. Nadie sabe que fuiste tú.')
        }}
      />

      <ReportDialog
        target={reportTarget}
        onClose={() => setReportTarget(null)}
        onDone={(t) => {
          if (t.whisperId) setReportedWhispers((prev) => new Set(prev).add(t.whisperId as string))
          setReportTarget(null)
          setNotice('Gracias. Recibimos tu reporte y nadie sabrá que fuiste tú.')
        }}
      />
    </div>
  )
}
