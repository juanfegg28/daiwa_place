'use client'

// v1.9.0 · Crear / editar un evento (oficial o de un club). Se valida aquí y otra vez en Supabase.
import { useMemo, useState } from 'react'
import { CloseIcon } from '../icons'
import { fromLocalInput, saveEvent, toLocalInput, type EventRow } from '../../lib/events'

export type ClubChoice = { id: string; name: string }
type Props = {
  /** evento a editar (null = nuevo) */
  editing: EventRow | null
  /** puede crear eventos oficiales (equipo con «manage_events») */
  canOfficial: boolean
  /** clubes que lidera */
  clubs: ClubChoice[]
  /** fija el club (desde la página de un club) */
  lockClubId?: string | null
  onClose: () => void
  onSaved: () => void
}

const inputCls = 'w-full rounded-lg bg-ink-700 border border-ink-600 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-garnet-500'

export default function EventForm({ editing, canOfficial, clubs, lockClubId = null, onClose, onSaved }: Props) {
  const firstKind: 'oficial' | 'club' = editing ? editing.kind : lockClubId ? 'club' : canOfficial ? 'oficial' : 'club'
  const [kind, setKind] = useState<'oficial' | 'club'>(firstKind)
  const [clubId, setClubId] = useState<string>(editing?.club_id ?? lockClubId ?? clubs[0]?.id ?? '')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [starts, setStarts] = useState(toLocalInput(editing?.starts_at ?? null))
  const [ends, setEnds] = useState(toLocalInput(editing?.ends_at ?? null))
  const [location, setLocation] = useState(editing?.location ?? '')
  const [link, setLink] = useState(editing?.link_url ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const minStart = useMemo(() => toLocalInput(new Date().toISOString()), [])

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (busy) return
    const t = title.trim()
    if (t.length < 3) return setError('El título necesita al menos 3 letras')
    const s = fromLocalInput(starts)
    if (!s) return setError('Elige la fecha y hora de inicio')
    const en = fromLocalInput(ends)
    if (en && new Date(en) <= new Date(s)) return setError('La hora de fin debe ser después del inicio')
    if (link.trim() && !/^https:\/\/\S+$/i.test(link.trim())) return setError('El enlace debe empezar por https://')
    if (kind === 'club' && !clubId) return setError('Elige el club del evento')
    setBusy(true)
    setError('')
    const { error: err } = await saveEvent({ id: editing?.id ?? null, title: t, description: description.trim(), startsAt: s, endsAt: en, location: location.trim(), link: link.trim(), kind, clubId: kind === 'club' ? clubId : null })
    setBusy(false)
    if (err) return setError(err)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={editing ? 'Editar evento' : 'Crear evento'} onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form onSubmit={submit} className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-ink-600 bg-ink-800 p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold text-neutral-50">{editing ? 'Editar evento' : 'Nuevo evento'}</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar" className="rounded-full p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-ink-700 transition">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {!editing && !lockClubId && (canOfficial || clubs.length > 1) && (
          <div>
            <p className="text-xs text-neutral-400 mb-1.5">¿De quién es?</p>
            <div className="flex flex-wrap gap-1.5">
              {canOfficial && (
                <button type="button" onClick={() => setKind('oficial')} aria-pressed={kind === 'oficial'} className={`rounded-full border px-3 py-1.5 text-sm transition ${kind === 'oficial' ? 'border-amber-400 bg-amber-400/15 text-amber-200' : 'border-ink-600 text-neutral-400'}`}>
                  Oficial de DaiwaPlace
                </button>
              )}
              {clubs.length > 0 && (
                <button type="button" onClick={() => setKind('club')} aria-pressed={kind === 'club'} className={`rounded-full border px-3 py-1.5 text-sm transition ${kind === 'club' ? 'border-garnet-500 bg-garnet-500/15 text-garnet-300' : 'border-ink-600 text-neutral-400'}`}>
                  De un club
                </button>
              )}
            </div>
          </div>
        )}
        {kind === 'club' && !editing && !lockClubId && clubs.length > 0 && (
          <select value={clubId} onChange={(e) => setClubId(e.target.value)} className={inputCls} aria-label="Club">
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        <label className="block">
          <span className="text-xs text-neutral-400">Título</span>
          <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} placeholder="Ej.: Concierto del Club de Música" maxLength={80} className={`${inputCls} mt-1`} />
        </label>
        <label className="block">
          <span className="text-xs text-neutral-400">Descripción (opcional)</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 1000))} rows={4} placeholder="De qué trata, qué hay que llevar, reglas…" className={`${inputCls} mt-1 resize-y`} />
          <span className="block text-right text-[11px] text-neutral-500 tabular-nums">{description.length}/1000</span>
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-neutral-400">Empieza</span>
            <input type="datetime-local" value={starts} min={editing ? undefined : minStart} onChange={(e) => setStarts(e.target.value)} className={`${inputCls} mt-1`} />
          </label>
          <label className="block">
            <span className="text-xs text-neutral-400">Termina (opcional)</span>
            <input type="datetime-local" value={ends} min={starts || undefined} onChange={(e) => setEnds(e.target.value)} className={`${inputCls} mt-1`} />
          </label>
        </div>
        <label className="block">
          <span className="text-xs text-neutral-400">Lugar (opcional)</span>
          <input value={location} onChange={(e) => setLocation(e.target.value.slice(0, 80))} placeholder="Ej.: Servidor de Roblox · Discord" className={`${inputCls} mt-1`} />
        </label>
        <label className="block">
          <span className="text-xs text-neutral-400">Enlace para participar (opcional, https://)</span>
          <input type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value.slice(0, 300))} placeholder="https://…" className={`${inputCls} mt-1`} />
        </label>

        {error && <p className="text-sm text-garnet-400" role="alert">{error}</p>}
        {!editing && <p className="text-[11px] text-neutral-500">Al crearlo se avisa a {kind === 'oficial' ? 'toda la comunidad' : 'los miembros del club'}.</p>}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-full px-4 py-2 text-sm text-neutral-400 hover:text-neutral-100 transition">Cancelar</button>
          <button type="submit" disabled={busy} className="rounded-full bg-garnet-600 hover:bg-garnet-500 px-5 py-2 text-sm font-medium text-white disabled:opacity-50 transition">
            {busy ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear evento'}
          </button>
        </div>
      </form>
    </div>
  )
}
