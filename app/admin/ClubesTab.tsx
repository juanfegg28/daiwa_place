'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import { useAppSession } from '../components/AppShell'
import ConfirmDialog from '../components/ConfirmDialog'
import { KindLabel } from '../components/ClubCard'
import { hasAny } from '../lib/permissions'
import { inboxTime } from '../lib/dm'
import { CLUB_SUMMARY_SELECT, friendlyClubError, type ClubKind, type ClubSummary } from '../lib/clubs'

type RequestRow = {
  id: string
  club_name: string
  kind: ClubKind
  details: string | null
  status: 'pending' | 'approved' | 'declined' | 'completed'
  decline_reason: string | null
  created_at: string
  requester: { username: string; id_student: string | null } | null
}

const SELECT =
  'id, club_name, kind, details, status, decline_reason, created_at, requester:profiles!club_requests_requester_id_fkey(username, id_student)'

const STATUS_LABEL: Record<RequestRow['status'], string> = {
  pending: 'Pendiente',
  approved: 'Aprobada (falta crear la página)',
  declined: 'Declinada',
  completed: 'Club creado',
}

/** Admin → Clubes: aceptar o declinar las solicitudes de creación y cerrar clubes que rompan las reglas. */
export default function ClubesTab() {
  const { permissions, isSupreme } = useAppSession()
  const allowed = isSupreme || hasAny(permissions, ['manage_clubs'])

  const [filter, setFilter] = useState<'pending' | 'done' | 'clubs'>('pending')
  const [rows, setRows] = useState<RequestRow[]>([])
  const [clubs, setClubs] = useState<ClubSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [declineFor, setDeclineFor] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ClubSummary | null>(null)

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false)
      return
    }
    if (filter === 'clubs') {
      const { data, error } = await supabase.from('clubs').select(CLUB_SUMMARY_SELECT).order('created_at', { ascending: false }).limit(200)
      if (error) setMessage(friendlyClubError(error.message))
      setClubs((data as ClubSummary[] | null) ?? [])
    } else {
      let q = supabase.from('club_requests').select(SELECT).order('created_at', { ascending: false }).limit(100)
      q = filter === 'pending' ? q.eq('status', 'pending') : q.neq('status', 'pending')
      const { data, error } = await q
      if (error) setMessage(friendlyClubError(error.message))
      setRows((data as unknown as RequestRow[]) ?? [])
    }
    setLoading(false)
  }, [allowed, filter])

  useEffect(() => {
    function run() {
      load()
    }
    run()
  }, [load])

  const decide = async (id: string, action: 'approve' | 'decline') => {
    setBusyId(id)
    setMessage('')
    const { error } = await supabase.rpc('club_request_decide', {
      p_request: id,
      p_action: action,
      p_reason: action === 'decline' ? reason.trim() || null : null,
    })
    setBusyId(null)
    if (error) {
      setMessage(friendlyClubError(error.message))
      return
    }
    setDeclineFor(null)
    setReason('')
    load()
  }

  const closeClub = async () => {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    const { error } = await supabase.rpc('club_admin_delete', { p_club: deleteTarget.id })
    setBusyId(null)
    setDeleteTarget(null)
    if (error) setMessage(friendlyClubError(error.message))
    load()
  }

  if (!allowed) return <p className="text-sm text-neutral-500">No tienes permiso para gestionar clubes.</p>

  return (
    <section className="surface-card rounded-2xl p-5">
      <h2 className="text-base font-semibold text-neutral-50 mb-1">Clubes y Pandillas</h2>
      <p className="text-sm text-neutral-500 mb-4 leading-relaxed max-w-lg">
        Aquí llegan las solicitudes para crear la <b className="text-neutral-300">página web</b> de un club o pandilla. Acepta solo si el grupo ya está
        oficializado en Discord y en el rol de Gakuran y quien pide es su líder.
      </p>

      <div className="flex gap-1.5 mb-4">
        {(
          [
            { id: 'pending', label: 'Pendientes' },
            { id: 'done', label: 'Revisadas' },
            { id: 'clubs', label: 'Clubes creados' },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setLoading(true)
              setFilter(f.id)
            }}
            className={`text-xs rounded-full px-3.5 py-1.5 transition ${filter === f.id ? 'bg-garnet-600 text-white' : 'border border-ink-600 text-neutral-400 hover:bg-ink-800'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {message && <p className="text-xs text-garnet-400 mb-3">{message}</p>}

      {loading ? (
        <p className="text-neutral-500 text-sm">Cargando...</p>
      ) : filter === 'clubs' ? (
        clubs.length === 0 ? (
          <p className="text-neutral-500 text-sm">Todavía no hay clubes creados.</p>
        ) : (
          <ul className="space-y-2">
            {clubs.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-xl bg-ink-700/60 p-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/clubes/${c.slug}`} className="text-sm font-semibold text-neutral-50 hover:text-garnet-300 transition truncate block">{c.name}</Link>
                  <KindLabel kind={c.kind} className="mt-1" />
                </div>
                <button type="button" onClick={() => setDeleteTarget(c)} className="text-xs text-garnet-400 hover:text-garnet-300 border border-garnet-700/50 rounded-full px-3 py-1 transition">
                  Cerrar club
                </button>
              </li>
            ))}
          </ul>
        )
      ) : rows.length === 0 ? (
        <p className="text-neutral-500 text-sm">{filter === 'pending' ? 'No hay solicitudes pendientes. 🎉' : 'Todavía no hay solicitudes revisadas.'}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-ink-600 bg-ink-800 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-50 break-words">{r.club_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <KindLabel kind={r.kind} />
                    <span className="text-[11px] text-neutral-500">{inboxTime(r.created_at)}</span>
                  </div>
                </div>
                {r.status !== 'pending' && <span className="text-[11px] text-neutral-400 border border-ink-600 rounded-full px-2.5 py-0.5 shrink-0">{STATUS_LABEL[r.status]}</span>}
              </div>
              <p className="text-xs text-neutral-400 mt-2">
                Solicita:{' '}
                {r.requester ? (
                  <Link href={`/perfil/${r.requester.username}`} className="text-neutral-200 hover:text-garnet-400 transition">
                    {r.requester.id_student || r.requester.username} <span className="text-neutral-600">@{r.requester.username}</span>
                  </Link>
                ) : (
                  'cuenta eliminada'
                )}
              </p>
              {r.details && <p className="text-xs text-neutral-300 mt-2 border-l-2 border-ink-500 pl-2 whitespace-pre-wrap break-words">{r.details}</p>}
              {r.decline_reason && <p className="text-xs text-neutral-500 mt-2">Motivo: {r.decline_reason}</p>}

              {r.status === 'pending' && (
                <div className="mt-3">
                  {declineFor === r.id ? (
                    <div>
                      <input
                        autoFocus
                        value={reason}
                        onChange={(e) => setReason(e.target.value.slice(0, 300))}
                        placeholder="Motivo (opcional, lo verá quien lo pidió)"
                        className="w-full bg-ink-900 border border-ink-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-garnet-600 mb-2"
                      />
                      <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setDeclineFor(null)} className="text-xs border border-ink-600 text-neutral-300 rounded-full px-3.5 py-1.5 hover:bg-ink-700 transition">Cancelar</button>
                        <button type="button" disabled={busyId === r.id} onClick={() => decide(r.id, 'decline')} className="text-xs bg-garnet-600 hover:bg-garnet-500 text-white rounded-full px-3.5 py-1.5 transition disabled:opacity-60">Declinar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button type="button" disabled={busyId === r.id} onClick={() => decide(r.id, 'approve')} className="flex-1 bg-garnet-600 hover:bg-garnet-500 text-white rounded-full py-2 text-sm font-medium transition disabled:opacity-60">
                        Aceptar
                      </button>
                      <button type="button" disabled={busyId === r.id} onClick={() => { setDeclineFor(r.id); setReason('') }} className="flex-1 border border-ink-500 text-neutral-200 rounded-full py-2 text-sm hover:bg-ink-700 transition disabled:opacity-60">
                        Declinar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={`¿Cerrar «${deleteTarget?.name ?? ''}»?`}
        message="Se elimina la página del club, sus roles y sus miembros dejan de tener la etiqueta. No se puede deshacer."
        confirmLabel="Cerrar club"
        busy={!!busyId}
        onConfirm={closeClub}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  )
}
