'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import { useAppSession } from '../components/AppShell'
import { hasAny } from '../lib/permissions'
import { inboxTime } from '../lib/dm'
import { reasonLabel } from '../lib/whispers'
import { MessageIcon } from '../components/icons'

type SnapshotMessage = { id: string; from: 'reporter' | 'reported'; content: string; at: string; flagged?: boolean }

type DmReportRow = {
  id: string
  reason: string
  details: string | null
  status: 'pending' | 'resolved' | 'dismissed'
  created_at: string
  message_id: string | null
  resolution: string | null
  snapshot: unknown
  reporter: { username: string; id_student: string | null } | null
  reported: { username: string; id_student: string | null } | null
}

const SELECT =
  'id, reason, details, status, created_at, message_id, resolution, snapshot, reporter:profiles!dm_reports_reporter_id_fkey(username, id_student), reported:profiles!dm_reports_reported_id_fkey(username, id_student)'

const STATUS_LABEL = { pending: 'Pendiente', resolved: 'Resuelto', dismissed: 'Descartado' } as const

function snapshotOf(row: DmReportRow): SnapshotMessage[] {
  return Array.isArray(row.snapshot) ? (row.snapshot as SnapshotMessage[]) : []
}

/** Reportes de mensajes directos. Moderación solo ve una copia de los últimos mensajes, nunca la conversación completa. */
export default function MensajesTab() {
  const { permissions, isSupreme } = useAppSession()
  const allowed = isSupreme || hasAny(permissions, ['view_evidence'])

  const [rows, setRows] = useState<DmReportRow[]>([])
  const [filter, setFilter] = useState<'pending' | 'done'>('pending')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [noteFor, setNoteFor] = useState<{ id: string; status: 'resolved' | 'dismissed' } | null>(null)
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false)
      return
    }
    let q = supabase.from('dm_reports').select(SELECT).order('created_at', { ascending: false }).limit(100)
    q = filter === 'pending' ? q.eq('status', 'pending') : q.neq('status', 'pending')
    const { data, error } = await q
    if (error) {
      setMessage(
        /Could not find the table|does not exist|permission denied/.test(error.message)
          ? 'Falta correr el SQL de la v0.13.5 en Supabase.'
          : `No se pudieron cargar los reportes: ${error.message}`
      )
    }
    setRows((data as unknown as DmReportRow[]) ?? [])
    setLoading(false)
  }, [allowed, filter])

  useEffect(() => {
    function run() {
      load()
    }
    run()
  }, [load])

  const resolve = async () => {
    if (!noteFor) return
    setBusyId(noteFor.id)
    const { error } = await supabase.rpc('admin_dm_report_resolve', {
      p_report: noteFor.id,
      p_status: noteFor.status,
      p_note: note.trim() || null,
    })
    setBusyId(null)
    if (error) {
      setMessage(error.message)
      return
    }
    setNoteFor(null)
    setNote('')
    setMessage(noteFor.status === 'resolved' ? 'Reporte marcado como resuelto.' : 'Reporte descartado.')
    load()
  }

  if (!allowed) return <p className="text-sm text-neutral-500">No tienes permisos para esta sección.</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-50">
          <MessageIcon className="w-4 h-4 text-garnet-400" />
          Mensajes reportados
        </h2>
        <div className="flex gap-1.5">
          {(
            [
              { id: 'pending', label: 'Pendientes' },
              { id: 'done', label: 'Resueltos' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`text-xs rounded-full px-3 py-1.5 transition ${
                filter === f.id ? 'bg-garnet-600 text-white' : 'border border-ink-600 text-neutral-400 hover:bg-ink-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-neutral-500 leading-relaxed">
        Por privacidad solo ves una copia de los últimos mensajes de la conversación en el momento del reporte (sin los
        eliminados). No hay forma de leer el resto del chat.
      </p>

      {message && (
        <div className="flex items-start gap-2 rounded-xl bg-ink-800 border border-ink-600 px-3.5 py-2.5">
          <p className="text-xs text-neutral-300 flex-1">{message}</p>
          <button type="button" onClick={() => setMessage('')} className="text-xs text-neutral-500 hover:text-neutral-100">
            Cerrar
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Cargando...</p>
      ) : rows.length === 0 ? (
        <div className="surface-card rounded-2xl p-8 text-center">
          <p className="text-sm text-neutral-300 font-medium">
            {filter === 'pending' ? 'No hay reportes de mensajes pendientes' : 'Todavía no hay reportes resueltos'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const snap = snapshotOf(r)
            const reporterName = r.reporter?.id_student || r.reporter?.username || 'Alguien'
            const reportedName = r.reported?.id_student || r.reported?.username || 'Alguien'
            return (
              <li key={r.id} className="surface-card rounded-2xl p-4">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-xs font-semibold text-garnet-300">{reasonLabel(r.reason)}</span>
                  <span
                    className={`text-[11px] rounded-full px-2 py-0.5 ${
                      r.status === 'pending' ? 'bg-amber-500/15 text-amber-300' : 'bg-ink-700 text-neutral-400'
                    }`}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                  <span className="ml-auto text-[11px] text-neutral-600">{inboxTime(r.created_at)}</span>
                </div>

                <p className="text-sm text-neutral-300 mb-2">
                  <b className="text-neutral-100">{reporterName}</b> reportó a{' '}
                  {r.reported ? (
                    <Link href={`/perfil/${r.reported.username}`} className="font-semibold text-garnet-300 hover:text-garnet-200">
                      {reportedName} (@{r.reported.username})
                    </Link>
                  ) : (
                    <b>{reportedName}</b>
                  )}
                </p>
                {r.details && <p className="text-xs text-neutral-400 mb-2">Detalle del reporte: “{r.details}”</p>}

                <div className="rounded-xl bg-ink-900 border border-ink-700 p-3 space-y-1.5 max-h-72 overflow-y-auto">
                  {snap.length === 0 ? (
                    <p className="text-xs text-neutral-600">No quedaron mensajes en la copia.</p>
                  ) : (
                    snap.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.from === 'reported' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl px-3 py-1.5 text-sm break-words whitespace-pre-wrap ${
                            m.from === 'reported' ? 'bg-ink-700 text-neutral-100' : 'bg-ink-800 text-neutral-300'
                          } ${m.flagged ? 'ring-2 ring-garnet-500' : ''}`}
                        >
                          <span className="block text-[10px] text-neutral-500 mb-0.5">
                            {m.from === 'reported' ? reportedName : reporterName} · {inboxTime(m.at)}
                            {m.flagged ? ' · mensaje reportado' : ''}
                          </span>
                          {m.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {r.resolution && <p className="mt-2 text-xs text-neutral-500">Nota: {r.resolution}</p>}

                {r.status === 'pending' && (
                  <div className="mt-3">
                    {noteFor?.id === r.id ? (
                      <div className="space-y-2">
                        <input
                          autoFocus
                          value={note}
                          onChange={(e) => setNote(e.target.value.slice(0, 200))}
                          placeholder="Nota (opcional): qué se hizo"
                          className="w-full bg-ink-900 border border-ink-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setNoteFor(null)
                              setNote('')
                            }}
                            className="flex-1 border border-ink-600 text-neutral-300 rounded-full py-1.5 text-xs hover:bg-ink-800 transition"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={resolve}
                            disabled={busyId === r.id}
                            className="flex-1 bg-garnet-600 hover:bg-garnet-500 text-white rounded-full py-1.5 text-xs font-medium transition disabled:opacity-60"
                          >
                            Confirmar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setNoteFor({ id: r.id, status: 'resolved' })}
                          className="text-xs bg-garnet-600 hover:bg-garnet-500 text-white rounded-full px-3 py-1.5 transition"
                        >
                          Marcar resuelto
                        </button>
                        <button
                          type="button"
                          onClick={() => setNoteFor({ id: r.id, status: 'dismissed' })}
                          className="text-xs border border-ink-600 text-neutral-300 rounded-full px-3 py-1.5 hover:bg-ink-800 transition"
                        >
                          Descartar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
