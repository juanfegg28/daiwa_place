'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import { useAppSession } from '../components/AppShell'
import ConfirmDialog from '../components/ConfirmDialog'
import { hasAny } from '../lib/permissions'
import { inboxTime } from '../lib/dm'
import { CloseIcon, EyeIcon, FlagIcon, TrashIcon, WhisperIcon } from '../components/icons'
import { ANON_NAME, friendlyWhisperError, reasonLabel } from '../lib/whispers'

type ReportRow = {
  id: string
  reason: string
  details: string | null
  snapshot: string | null
  status: 'pending' | 'resolved' | 'dismissed'
  created_at: string
  whisper_id: string | null
  comment_id: string | null
  resolution: string | null
  reporter: { username: string } | null
  whisper: { id: string; content: string; status: string } | null
  comment: { id: string; content: string; status: string; whisper_id: string } | null
}

type RevealRow = {
  id: string
  target_kind: 'whisper' | 'comment'
  target_id: string
  author_id: string | null
  reason: string
  created_at: string
  admin: { username: string } | null
}

type Revealed = { author_id: string; username: string; id_student: string | null; avatar_url: string | null }

const REPORT_SELECT =
  'id, reason, details, snapshot, status, created_at, whisper_id, comment_id, resolution, reporter:profiles!whisper_reports_reporter_id_fkey(username), whisper:whispers!whisper_reports_whisper_id_fkey(id, content, status), comment:whisper_comments!whisper_reports_comment_id_fkey(id, content, status, whisper_id)'

const REVEAL_SELECT =
  'id, target_kind, target_id, author_id, reason, created_at, admin:profiles!whisper_reveals_admin_id_fkey(username)'

type ReportGroup = {
  key: string
  /** El reporte que representa al grupo (el pendiente más reciente, o el más reciente) */
  rep: ReportRow
  all: ReportRow[]
  pendingCount: number
  reasons: [string, number][]
}

/** Junta los reportes del mismo contenido: 3 personas reportan lo mismo = 1 tarjeta con "3 reportes". */
function groupReports(rows: ReportRow[]): ReportGroup[] {
  const map = new Map<string, ReportRow[]>()
  for (const r of rows) {
    const key = r.comment_id ? `c:${r.comment_id}` : `w:${r.whisper_id}`
    const list = map.get(key) ?? []
    list.push(r)
    map.set(key, list)
  }
  const groups: ReportGroup[] = []
  for (const [key, all] of map) {
    const pending = all.filter((r) => r.status === 'pending')
    const reasonCount = new Map<string, number>()
    for (const r of all) reasonCount.set(r.reason, (reasonCount.get(r.reason) ?? 0) + 1)
    groups.push({
      key,
      rep: pending[0] ?? all[0],
      all,
      pendingCount: pending.length,
      reasons: [...reasonCount.entries()].sort((a, b) => b[1] - a[1]),
    })
  }
  // lo más reportado y pendiente primero
  return groups.sort(
    (a, b) =>
      Number(b.pendingCount > 0) - Number(a.pendingCount > 0) ||
      b.all.length - a.all.length ||
      new Date(b.rep.created_at).getTime() - new Date(a.rep.created_at).getTime()
  )
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  resolved: 'Eliminado',
  dismissed: 'Descartado',
}

const CONTENT_STATUS_LABEL: Record<string, string> = {
  visible: 'visible',
  hidden: 'oculto por reportes',
  removed: 'eliminado',
}

export default function SusurrosTab() {
  const { permissions, isSupreme } = useAppSession()
  const canModerate = isSupreme || hasAny(permissions, ['moderate_whispers'])
  const canReveal = isSupreme || hasAny(permissions, ['reveal_whisper_authors'])

  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [togglingWall, setTogglingWall] = useState(false)

  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'done' | 'all'>('pending')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const [removeTarget, setRemoveTarget] = useState<ReportRow | null>(null)
  const [silenceTarget, setSilenceTarget] = useState<ReportRow | null>(null)
  const [silenceDays, setSilenceDays] = useState(3)
  const [silenceReason, setSilenceReason] = useState('')
  const [revealTarget, setRevealTarget] = useState<ReportRow | null>(null)
  const [revealReason, setRevealReason] = useState('')
  const [revealed, setRevealed] = useState<{ row: ReportRow; who: Revealed } | null>(null)
  const [revealError, setRevealError] = useState('')

  const [history, setHistory] = useState<(RevealRow & { author: { username: string } | null })[]>([])

  const loadReports = useCallback(async () => {
    if (!canModerate) {
      setLoading(false)
      return
    }
    let q = supabase.from('whisper_reports').select(REPORT_SELECT).order('created_at', { ascending: false }).limit(100)
    if (filter === 'pending') q = q.eq('status', 'pending')
    if (filter === 'done') q = q.neq('status', 'pending')
    const { data, error } = await q
    if (error) setMessage(friendlyWhisperError(error.message))
    setReports((data as unknown as ReportRow[]) ?? [])
    setLoading(false)
  }, [canModerate, filter])

  const loadHistory = useCallback(async () => {
    if (!canReveal) return
    const { data } = await supabase.from('whisper_reveals').select(REVEAL_SELECT).order('created_at', { ascending: false }).limit(50)
    const rows = (data as unknown as RevealRow[]) ?? []
    const ids = [...new Set(rows.map((r) => r.author_id).filter((x): x is string => !!x))]
    const names = new Map<string, string>()
    if (ids.length > 0) {
      const { data: profs } = await supabase.from('profiles').select('id, username').in('id', ids)
      for (const p of (profs ?? []) as { id: string; username: string }[]) names.set(p.id, p.username)
    }
    setHistory(rows.map((r) => ({ ...r, author: r.author_id && names.get(r.author_id) ? { username: names.get(r.author_id) as string } : null })))
  }, [canReveal])

  useEffect(() => {
    function run() {
      loadReports()
    }
    run()
  }, [loadReports])

  useEffect(() => {
    function run() {
      loadHistory()
    }
    run()
  }, [loadHistory])

  useEffect(() => {
    if (!isSupreme) return
    let cancelled = false
    async function run() {
      const { data } = await supabase.rpc('whispers_enabled')
      if (!cancelled) setEnabled(data !== false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [isSupreme])

  const toggleWall = async () => {
    if (enabled === null) return
    setTogglingWall(true)
    const { error } = await supabase.rpc('admin_set_whispers_enabled', { p_enabled: !enabled })
    setTogglingWall(false)
    if (error) {
      setMessage(friendlyWhisperError(error.message))
      return
    }
    setEnabled(!enabled)
  }

  const kindOf = (r: ReportRow): { kind: 'whisper' | 'comment'; id: string } =>
    r.comment_id ? { kind: 'comment', id: r.comment_id } : { kind: 'whisper', id: r.whisper_id as string }

  const act = async (r: ReportRow, action: 'dismiss' | 'remove') => {
    const { kind, id } = kindOf(r)
    setBusyId(r.id)
    const { error } = await supabase.rpc('admin_whisper_action', { p_kind: kind, p_id: id, p_action: action, p_note: null })
    setBusyId(null)
    if (error) {
      setMessage(friendlyWhisperError(error.message))
      return
    }
    setMessage(action === 'remove' ? 'Contenido eliminado. Sus reportes quedaron resueltos.' : 'Reporte descartado: el contenido volvió a verse.')
    loadReports()
  }

  const silence = async () => {
    if (!silenceTarget) return
    const { kind, id } = kindOf(silenceTarget)
    setBusyId(silenceTarget.id)
    const { error } = await supabase.rpc('admin_whisper_silence_author', {
      p_kind: kind,
      p_id: id,
      p_days: silenceDays,
      p_reason: silenceReason.trim() || null,
    })
    setBusyId(null)
    setSilenceTarget(null)
    setSilenceReason('')
    if (error) {
      setMessage(friendlyWhisperError(error.message))
      return
    }
    setMessage(`Autor silenciado ${silenceDays} ${silenceDays === 1 ? 'día' : 'días'}. Tú no sabes quién es: la base de datos lo aplicó por ti.`)
  }

  const reveal = async () => {
    if (!revealTarget) return
    const { kind, id } = kindOf(revealTarget)
    setBusyId(revealTarget.id)
    setRevealError('')
    const { data, error } = await supabase.rpc('admin_whisper_reveal', { p_kind: kind, p_id: id, p_reason: revealReason.trim() })
    setBusyId(null)
    if (error) {
      setRevealError(friendlyWhisperError(error.message))
      return
    }
    const row = (Array.isArray(data) ? data[0] : data) as Revealed | undefined
    if (!row) {
      setRevealError('No se encontró al autor.')
      return
    }
    setRevealed({ row: revealTarget, who: row })
    setRevealTarget(null)
    setRevealReason('')
    loadHistory()
  }

  if (!canModerate && !canReveal && !isSupreme) {
    return <p className="text-sm text-neutral-500">No tienes permisos para esta sección.</p>
  }

  return (
    <div className="space-y-6">
      {isSupreme && (
        <section className="surface-card rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-50 mb-1">
                <WhisperIcon className="w-4 h-4 text-garnet-400" />
                Muro de los Susurros
              </h2>
              <p className="text-sm text-neutral-500 leading-relaxed max-w-md">
                {enabled === false
                  ? 'El Muro está en pausa: nadie puede publicar, votar ni comentar, y quien entra ve un aviso de pausa.'
                  : 'El Muro está encendido. Si pasa algo grave, puedes pausarlo para todos mientras lo resuelves.'}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleWall}
              disabled={togglingWall || enabled === null}
              role="switch"
              aria-checked={enabled !== false}
              aria-label="Encender o pausar el Muro"
              className={`shrink-0 w-12 h-7 rounded-full transition relative disabled:opacity-60 ${enabled !== false ? 'bg-garnet-600' : 'bg-ink-600'}`}
            >
              <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${enabled !== false ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </section>
      )}

      {message && (
        <div className="flex items-start gap-2 rounded-xl bg-ink-800 border border-ink-600 px-3.5 py-2.5">
          <p className="text-xs text-neutral-300 flex-1">{message}</p>
          <button type="button" onClick={() => setMessage('')} aria-label="Cerrar aviso" className="text-neutral-500 hover:text-neutral-100">
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {canModerate && (
        <section>
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-50">
              <FlagIcon className="w-4 h-4 text-garnet-400" />
              Reportes del Muro
            </h2>
            <div className="flex gap-1.5">
              {(
                [
                  { id: 'pending', label: 'Pendientes' },
                  { id: 'done', label: 'Resueltos' },
                  { id: 'all', label: 'Todos' },
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

          <p className="text-xs text-neutral-500 mb-3 leading-relaxed">
            Todo el contenido del Muro es anónimo. Puedes ocultar, restaurar, eliminar y silenciar al autor{' '}
            <b className="text-neutral-300">sin saber quién es</b>.
            {canReveal
              ? ' Tienes permiso para revelar al autor en casos graves: debes escribir un motivo y queda registrado abajo.'
              : ' Si un caso es muy grave y necesitas saber quién fue, pídele a alguien con el permiso de revelar autores.'}
          </p>

          {loading ? (
            <p className="text-sm text-neutral-500">Cargando...</p>
          ) : reports.length === 0 ? (
            <div className="surface-card rounded-2xl p-8 text-center">
              <p className="text-sm text-neutral-300 font-medium">
                {filter === 'pending' ? 'No hay reportes pendientes' : 'No hay reportes para mostrar'}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {groupReports(reports).map((g) => {
                const r = g.rep
                const isComment = !!r.comment_id
                const content = isComment ? r.comment : r.whisper
                const text = content?.content || r.snapshot || '(sin texto)'
                const threadId = isComment ? r.comment?.whisper_id : r.whisper_id
                const pending = g.pendingCount > 0
                return (
                  <li key={g.key} className="surface-card rounded-2xl p-4">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-[11px] uppercase tracking-wide rounded-full bg-ink-700 text-neutral-300 px-2 py-0.5">
                        {isComment ? 'Comentario' : 'Confesión'}
                      </span>
                      <span className="text-xs font-semibold text-garnet-300">
                        {g.all.length} {g.all.length === 1 ? 'reporte' : 'reportes'}
                      </span>
                      {g.reasons.map(([reason, n]) => (
                        <span key={reason} className="text-[11px] rounded-full bg-garnet-600/15 text-garnet-300 px-2 py-0.5">
                          {reasonLabel(reason)}
                          {n > 1 ? ` ×${n}` : ''}
                        </span>
                      ))}
                      <span
                        className={`text-[11px] rounded-full px-2 py-0.5 ${
                          pending ? 'bg-amber-500/15 text-amber-300' : 'bg-ink-700 text-neutral-400'
                        }`}
                      >
                        {pending ? `${g.pendingCount} pendiente${g.pendingCount > 1 ? 's' : ''}` : STATUS_LABEL[r.status]}
                      </span>
                      <span className="ml-auto text-[11px] text-neutral-600">{inboxTime(r.created_at)}</span>
                    </div>

                    <p className="text-sm text-neutral-100 whitespace-pre-wrap break-words rounded-xl bg-ink-900 border border-ink-700 px-3.5 py-3">
                      {text}
                    </p>
                    <p className="mt-1.5 text-[11px] text-neutral-600">
                      Autor: {ANON_NAME} · Estado actual: {content ? CONTENT_STATUS_LABEL[content.status] ?? content.status : 'ya no existe'}
                    </p>
                    <details className="mt-2 group">
                      <summary className="text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer select-none">
                        Ver quién reportó y por qué ({g.all.length})
                      </summary>
                      <ul className="mt-2 space-y-1.5">
                        {g.all.map((x) => (
                          <li key={x.id} className="text-xs text-neutral-400 rounded-lg bg-ink-900 border border-ink-700 px-3 py-2">
                            <span className="text-neutral-200 font-semibold">{x.reporter ? `@${x.reporter.username}` : 'Alguien'}</span>{' '}
                            · {reasonLabel(x.reason)} · {inboxTime(x.created_at)}
                            {x.details && <span className="block text-neutral-500 mt-0.5">“{x.details}”</span>}
                            {x.resolution && <span className="block text-neutral-500 mt-0.5">Nota: {x.resolution}</span>}
                          </li>
                        ))}
                      </ul>
                    </details>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {threadId && (
                        <Link
                          href={`/susurros/${threadId}${isComment ? `?c=${r.comment_id}` : ''}`}
                          className="text-xs border border-ink-600 text-neutral-300 rounded-full px-3 py-1.5 hover:bg-ink-800 transition"
                        >
                          Ver en el Muro
                        </Link>
                      )}
                      {pending && content && content.status !== 'removed' && (
                        <>
                          <button
                            type="button"
                            onClick={() => act(r, 'dismiss')}
                            disabled={busyId === g.rep.id}
                            className="text-xs border border-ink-600 text-neutral-300 rounded-full px-3 py-1.5 hover:bg-ink-800 transition disabled:opacity-60"
                          >
                            Descartar (restaurar)
                          </button>
                          <button
                            type="button"
                            onClick={() => setRemoveTarget(r)}
                            disabled={busyId === g.rep.id}
                            className="flex items-center gap-1 text-xs bg-garnet-600 hover:bg-garnet-500 text-white rounded-full px-3 py-1.5 transition disabled:opacity-60"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setSilenceTarget(r)}
                        disabled={busyId === g.rep.id}
                        className="text-xs border border-ink-600 text-neutral-300 rounded-full px-3 py-1.5 hover:bg-ink-800 transition disabled:opacity-60"
                      >
                        Silenciar al autor
                      </button>
                      {canReveal && (
                        <button
                          type="button"
                          onClick={() => {
                            setRevealError('')
                            setRevealReason('')
                            setRevealTarget(r)
                          }}
                          disabled={busyId === g.rep.id}
                          className="flex items-center gap-1 text-xs border border-amber-500/50 text-amber-300 rounded-full px-3 py-1.5 hover:bg-amber-500/10 transition disabled:opacity-60"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                          Ver autor
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {canReveal && (
        <section>
          <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-50 mb-1">
            <EyeIcon className="w-4 h-4 text-amber-300" />
            Historial de revelaciones
          </h2>
          <p className="text-xs text-neutral-500 mb-3">
            Cada vez que alguien revela un autor queda aquí: quién lo hizo, a quién vio y por qué. No se puede borrar.
          </p>
          {history.length === 0 ? (
            <p className="text-sm text-neutral-600">Nadie ha revelado a ningún autor todavía.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id} className="surface-card rounded-xl px-4 py-3 text-xs text-neutral-400 leading-relaxed">
                  <span className="text-neutral-200 font-semibold">@{h.admin?.username ?? 'admin'}</span> reveló al autor de un{' '}
                  {h.target_kind === 'comment' ? 'comentario' : 'susurro'}
                  {h.author ? (
                    <>
                      {' '}
                      → <span className="text-amber-300 font-semibold">@{h.author.username}</span>
                    </>
                  ) : (
                    ' (la cuenta ya no existe)'
                  )}
                  <span className="text-neutral-600"> · {inboxTime(h.created_at)}</span>
                  <br />
                  Motivo: “{h.reason}”
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title="¿Eliminar este contenido?"
        message="Se retira del Muro para todos y sus reportes quedan resueltos. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        busy={busyId !== null}
        onConfirm={async () => {
          const t = removeTarget
          setRemoveTarget(null)
          if (t) await act(t, 'remove')
        }}
        onCancel={() => setRemoveTarget(null)}
      />

      {silenceTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={() => setSilenceTarget(null)}>
          <div className="surface-raised border border-ink-600 rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2 className="text-base font-semibold text-neutral-50 mb-1">Silenciar al autor</h2>
            <p className="text-sm text-neutral-400 mb-4">
              No podrá publicar ni comentar en el Muro durante ese tiempo. No necesitas saber quién es.
            </p>
            <div className="flex gap-1.5 mb-3">
              {[1, 3, 7, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSilenceDays(d)}
                  className={`flex-1 text-xs rounded-full py-2 transition ${silenceDays === d ? 'bg-garnet-600 text-white' : 'bg-ink-800 text-neutral-300 hover:bg-ink-700'}`}
                >
                  {d} {d === 1 ? 'día' : 'días'}
                </button>
              ))}
            </div>
            <input
              value={silenceReason}
              onChange={(e) => setSilenceReason(e.target.value.slice(0, 200))}
              placeholder="Motivo (opcional)"
              className="w-full bg-ink-900 border border-ink-700 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:border-garnet-600"
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setSilenceTarget(null)} className="flex-1 border border-ink-500 text-neutral-300 rounded-full py-2 text-sm hover:bg-ink-800 transition">
                Cancelar
              </button>
              <button type="button" onClick={silence} className="flex-1 bg-garnet-600 hover:bg-garnet-500 text-white rounded-full py-2 text-sm font-medium transition">
                Silenciar
              </button>
            </div>
          </div>
        </div>
      )}

      {revealTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={() => busyId === null && setRevealTarget(null)}>
          <div className="surface-raised border border-amber-500/40 rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2 className="flex items-center gap-2 text-base font-semibold text-amber-300 mb-1">
              <EyeIcon className="w-4 h-4" />
              Revelar al autor
            </h2>
            <p className="text-sm text-neutral-400 mb-3 leading-relaxed">
              Rompes el anonimato de esta persona. Úsalo solo en casos graves (amenazas, acoso). Quedará registrado
              quién lo hizo, a quién vio y el motivo.
            </p>
            <textarea
              autoFocus
              value={revealReason}
              onChange={(e) => setRevealReason(e.target.value.slice(0, 300))}
              rows={3}
              placeholder="Motivo (mínimo 10 caracteres)"
              className="w-full bg-ink-900 border border-ink-700 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-amber-500"
            />
            {revealError && <p className="text-xs text-garnet-400 mt-2">{revealError}</p>}
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setRevealTarget(null)} disabled={busyId !== null} className="flex-1 border border-ink-500 text-neutral-300 rounded-full py-2 text-sm hover:bg-ink-800 transition disabled:opacity-60">
                Cancelar
              </button>
              <button
                type="button"
                onClick={reveal}
                disabled={busyId !== null || revealReason.trim().length < 10}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black rounded-full py-2 text-sm font-semibold transition disabled:opacity-50"
              >
                {busyId !== null ? 'Revelando...' : 'Revelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {revealed && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={() => setRevealed(null)}>
          <div className="surface-raised border border-amber-500/40 rounded-2xl p-5 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">
              Autor del {revealed.row.comment_id ? 'comentario' : 'susurro'}
            </p>
            <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-ink-700 flex items-center justify-center mb-2">
              {revealed.who.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img loading="lazy" decoding="async" src={revealed.who.avatar_url} alt={revealed.who.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-semibold text-garnet-400">{revealed.who.username.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <p className="text-lg font-semibold text-neutral-50">{revealed.who.id_student || revealed.who.username}</p>
            <Link href={`/perfil/${revealed.who.username}`} className="text-sm text-garnet-400 hover:text-garnet-300">
              @{revealed.who.username}
            </Link>
            <p className="text-xs text-neutral-500 mt-3 mb-4">
              Esta consulta quedó registrada en el historial. Trata esta información con discreción.
            </p>
            <button type="button" onClick={() => setRevealed(null)} className="w-full bg-ink-700 hover:bg-ink-600 text-neutral-100 rounded-full py-2 text-sm transition">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
