'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAppSession } from '../components/AppShell'
import { hasAny } from '../lib/permissions'
import StoryCanvas from '../components/stories/StoryCanvas'
import { friendlyStoryError, normalizeStoryEvidence, signedStoryUrls, type StoryEvidence } from '../lib/stories'
import { normalizeTrack } from '../lib/music'

type Row = {
  id: string
  reason: string
  details: string | null
  status: 'pending' | 'resolved' | 'dismissed'
  created_at: string
  resolved_at: string | null
  resolution: string | null
  snapshot: StoryEvidence
  reporter: { username: string } | null
  reported: { username: string; id_student: string | null } | null
}

const REASON: Record<string, string> = {
  ofensivo: 'Contenido ofensivo',
  acoso: 'Acoso o bullying',
  datos_personales: 'Datos personales',
  odio: 'Odio o discriminación',
  ubicacion: 'Ubicación peligrosa',
  spam: 'Spam',
  otro: 'Otro motivo',
}

/** Reportes de historias (v1.2.0): quién reporta, a quién, motivo y la copia (imagen, capas y canción).
 *  Mientras un reporte esté pendiente el cron NO borra esa historia. */
export default function HistoriasReportes() {
  const { permissions, isSupreme } = useAppSession()
  const canView = isSupreme || hasAny(permissions, ['view_reports'])
  const canEvidence = isSupreme || hasAny(permissions, ['view_evidence'])
  const canDelete = isSupreme || hasAny(permissions, ['delete_content'])
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [open, setOpen] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('story_reports')
      .select('id, reason, details, status, created_at, resolved_at, resolution, snapshot, reporter:profiles!story_reports_reporter_id_fkey(username), reported:profiles!story_reports_reported_id_fkey(username, id_student)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) {
      setMissing(/does not exist|Could not find/.test(error.message))
      setRows([])
    } else setRows((data as unknown as Row[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    function run() {
      void load()
    }
    run()
  }, [load])

  const openEvidence = async (r: Row) => {
    setOpen(open === r.id ? null : r.id)
    setUrl(null)
    const path = r.snapshot?.media_path
    if (open !== r.id && canEvidence && path) {
      const m = await signedStoryUrls([path])
      setUrl(m[path] ?? null)
    }
  }

  const act = async (r: Row, action: 'dismiss' | 'delete') => {
    setBusy(r.id)
    setMsg('')
    const { error } = await supabase.rpc('story_report_resolve', { p_report: r.id, p_action: action, p_note: null })
    setBusy(null)
    if (error) setMsg(friendlyStoryError(error.message))
    else await load()
  }

  if (!canView) return null
  if (missing) return null
  const list = rows.filter((r) => (filter === 'pending' ? r.status === 'pending' : true))

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-neutral-50">Reportes de historias</h2>
        <div className="flex gap-1.5">
          {(['pending', 'all'] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={`text-xs rounded-full px-3 py-1 ${filter === f ? 'bg-garnet-600 text-white' : 'border border-ink-600 text-neutral-400'}`}>
              {f === 'pending' ? 'Pendientes' : 'Todos'}
            </button>
          ))}
        </div>
      </div>
      {msg && <p className="text-xs text-garnet-400">{msg}</p>}
      {loading ? (
        <p className="text-sm text-neutral-500">Cargando…</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-neutral-500 surface-card rounded-2xl p-6 text-center">No hay reportes de historias {filter === 'pending' ? 'pendientes' : ''}.</p>
      ) : (
        list.map((r) => {
          const ev = normalizeStoryEvidence(r.snapshot)
          return (
            <div key={r.id} className="surface-card rounded-2xl p-4 space-y-2">
              <p className="text-sm text-neutral-200">
                <b>@{r.reporter?.username ?? '?'}</b> reportó una historia de <b>{r.reported?.id_student || r.reported?.username || '?'}</b>{' '}
                <span className="text-neutral-500">@{r.reported?.username}</span>
              </p>
              <p className="text-xs text-neutral-400">
                {REASON[r.reason] ?? r.reason}
                {r.details ? ` · «${r.details}»` : ''} · {new Date(r.created_at).toLocaleString('es')}
              </p>
              {r.status !== 'pending' && <p className="text-xs text-emerald-400">{r.status === 'dismissed' ? 'Descartado' : 'Resuelto'}{r.resolution ? `: ${r.resolution}` : ''}</p>}
              {canEvidence && (
                <button type="button" onClick={() => void openEvidence(r)} className="text-xs border border-ink-600 text-neutral-300 rounded-full px-3 py-1.5 hover:bg-ink-800">
                  {open === r.id ? 'Ocultar evidencia' : 'Ver evidencia'}
                </button>
              )}
              {open === r.id && ev && (
                <div className="w-[200px] rounded-xl overflow-hidden">
                  <StoryCanvas bg={ev.bg} mediaUrl={url} elements={ev.elements} track={normalizeTrack(ev.music)} animate={false} />
                </div>
              )}
              {r.status === 'pending' && (
                <div className="flex gap-2 flex-wrap">
                  <button type="button" disabled={busy === r.id} onClick={() => void act(r, 'dismiss')} className="text-xs bg-ink-700 hover:bg-ink-600 text-neutral-200 rounded-full px-3 py-1.5 disabled:opacity-60">Descartar reporte</button>
                  {canDelete && (
                    <button type="button" disabled={busy === r.id} onClick={() => void act(r, 'delete')} className="text-xs border border-garnet-600 text-garnet-400 hover:bg-garnet-600 hover:text-white rounded-full px-3 py-1.5 disabled:opacity-60">Eliminar historia</button>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}
    </section>
  )
}
