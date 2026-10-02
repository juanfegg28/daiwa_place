'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import { useAppSession } from '../components/AppShell'
import { hasAny } from '../lib/permissions'
import { TrashIcon, SnowflakeIcon } from '../components/icons'
import type { ReportRow } from './types'

const REPORT_SELECT =
  'id, reporter_id, reported_user_id, post_id, comment_id, target_type, reason, status, created_at, reporter:profiles!reports_reporter_id_fkey(username), reported:profiles!reports_reported_user_id_fkey(username, id_student, is_frozen), post:posts!reports_post_id_fkey(id, content)'

const TARGET_LABEL: Record<string, string> = {
  post: 'Publicación reportada',
  comment: 'Comentario reportado',
  profile: 'Perfil reportado',
}

export default function ReportesTab() {
  const { permissions, isSupreme } = useAppSession()
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'resolved' | 'all'>('pending')
  const [busyId, setBusyId] = useState<string | null>(null)

  const canDelete = isSupreme || hasAny(permissions, ['delete_content'])
  const canFreeze = isSupreme || hasAny(permissions, ['freeze_accounts'])
  const canResolve = isSupreme || hasAny(permissions, ['view_reports'])

  const load = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(REPORT_SELECT)
      .order('created_at', { ascending: false })
    if (error) console.error('Error cargando reportes:', error.message)
    setReports((data as unknown as ReportRow[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    function run() {
      load()
    }
    run()
  }, [])

  const toggleStatus = async (r: ReportRow) => {
    setBusyId(r.id)
    const next = r.status === 'resolved' ? 'pending' : 'resolved'
    await supabase.from('reports').update({ status: next }).eq('id', r.id)
    setBusyId(null)
    load()
  }

  const deleteContent = async (r: ReportRow) => {
    if (!r.post_id) return
    if (!window.confirm('¿Eliminar esta publicación? No se puede deshacer.')) return
    setBusyId(r.id)
    await supabase.from('posts').delete().eq('id', r.post_id)
    setBusyId(null)
    load()
  }

  const toggleFreeze = async (r: ReportRow) => {
    if (!r.reported) return
    setBusyId(r.id)
    await supabase.from('profiles').update({ is_frozen: !r.reported.is_frozen }).eq('id', r.reported_user_id)
    setBusyId(null)
    load()
  }

  const visible = reports.filter((r) =>
    filter === 'all' ? true : filter === 'resolved' ? r.status === 'resolved' : r.status !== 'resolved'
  )

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        {(['pending', 'resolved', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`text-xs rounded-full px-3 py-1.5 transition ${
              filter === f ? 'bg-garnet-600 text-white' : 'bg-ink-800 text-neutral-300 hover:bg-ink-700'
            }`}
          >
            {f === 'pending' ? 'Pendientes' : f === 'resolved' ? 'Resueltos' : 'Todos'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-neutral-500 text-sm py-6 text-center">Cargando...</p>
      ) : visible.length === 0 ? (
        <p className="text-neutral-500 text-sm py-6 text-center">
          No hay reportes {filter === 'pending' ? 'pendientes' : filter === 'resolved' ? 'resueltos' : ''}.
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <div key={r.id} className="surface-card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-medium text-neutral-100">
                    {TARGET_LABEL[r.target_type] ?? 'Reporte'}{' '}
                    <span className="text-neutral-500 font-normal">· de @{r.reported?.username ?? '—'}</span>
                  </p>
                  <p className="text-xs text-neutral-600">
                    Reportado por @{r.reporter?.username ?? '—'} ·{' '}
                    {new Date(r.created_at).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 shrink-0 ${
                    r.status === 'resolved' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-garnet-600/20 text-garnet-400'
                  }`}
                >
                  {r.status === 'resolved' ? 'Resuelto' : 'Pendiente'}
                </span>
              </div>

              {r.reason && <p className="text-sm text-neutral-300 mb-2 whitespace-pre-wrap">&quot;{r.reason}&quot;</p>}

              {r.post && (
                <p className="text-xs text-neutral-500 bg-ink-900 rounded-lg px-3 py-2 mb-3 line-clamp-2">
                  {r.post.content || '(publicación sin texto, solo fotos)'}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={r.target_type === 'post' && r.post_id ? `/post/${r.post_id}` : `/perfil/${r.reported?.username ?? ''}`}
                  className="text-xs border border-ink-600 text-neutral-300 rounded-full px-3 py-1.5 hover:bg-ink-800 transition"
                >
                  Ver evidencia
                </Link>
                {canDelete && r.post_id && (
                  <button
                    type="button"
                    onClick={() => deleteContent(r)}
                    disabled={busyId === r.id}
                    className="flex items-center gap-1 text-xs border border-garnet-700 text-garnet-400 rounded-full px-3 py-1.5 hover:bg-garnet-600 hover:text-white transition disabled:opacity-60"
                  >
                    <TrashIcon className="w-3.5 h-3.5" /> Eliminar publicación
                  </button>
                )}
                {canFreeze && r.reported && (
                  <button
                    type="button"
                    onClick={() => toggleFreeze(r)}
                    disabled={busyId === r.id}
                    className="flex items-center gap-1 text-xs border border-ink-600 text-neutral-300 rounded-full px-3 py-1.5 hover:bg-ink-800 transition disabled:opacity-60"
                  >
                    <SnowflakeIcon className="w-3.5 h-3.5" /> {r.reported.is_frozen ? 'Descongelar cuenta' : 'Congelar cuenta'}
                  </button>
                )}
                {canResolve && (
                  <button
                    type="button"
                    onClick={() => toggleStatus(r)}
                    disabled={busyId === r.id}
                    className="text-xs bg-ink-700 hover:bg-ink-600 text-neutral-200 rounded-full px-3 py-1.5 transition disabled:opacity-60"
                  >
                    {r.status === 'resolved' ? 'Marcar pendiente' : 'Marcar resuelto'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
