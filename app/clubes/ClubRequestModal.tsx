'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CloseIcon, ClubsIcon, FireIcon } from '../components/icons'
import {
  CLUB_DETAILS_MAX,
  CLUB_NAME_MAX,
  CLUB_NAME_MIN,
  CLUB_REQUEST_RULES,
  friendlyClubError,
  type ClubKind,
} from '../lib/clubs'

/** «Solicitar crear Club/Pandilla»: primero las reglas estrictas, luego el formulario. */
export default function ClubRequestModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [kind, setKind] = useState<ClubKind>('club')
  const [name, setName] = useState('')
  const [details, setDetails] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const cleanName = name.replace(/\s+/g, ' ').trim()
  const nameOk = cleanName.length >= CLUB_NAME_MIN && cleanName.length <= CLUB_NAME_MAX
  const canSend = nameOk && agreed && !sending

  const submit = async () => {
    if (!canSend) return
    setSending(true)
    setError('')
    const { error: err } = await supabase.rpc('club_request_create', {
      p_name: cleanName,
      p_kind: kind,
      p_details: details.trim() || null,
    })
    setSending(false)
    if (err) {
      setError(friendlyClubError(err.message))
      return
    }
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center md:px-4 sheet-backdrop" onClick={() => !sending && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Solicitar crear un Club o Pandilla"
        onClick={(e) => e.stopPropagation()}
        className="surface-raised border border-ink-600 sheet-panel rounded-t-2xl md:rounded-2xl border-b-0 md:border-b p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:pb-5 w-full md:max-w-lg max-h-[92dvh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg font-display font-semibold text-neutral-50">Solicitar crear Club/Pandilla</h2>
            <p className="text-xs text-neutral-500 mt-0.5">El equipo revisa tu solicitud y te avisa por notificación.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-ink-600 transition shrink-0">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 mb-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-300 mb-1">Reglas estrictas</p>
          <p className="text-sm text-neutral-100 leading-relaxed">{CLUB_REQUEST_RULES}</p>
        </div>

        <p className="text-xs font-medium text-neutral-400 mb-1.5">¿Qué es?</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(
            [
              { id: 'club', label: 'Club', Icon: ClubsIcon },
              { id: 'pandilla', label: 'Pandilla', Icon: FireIcon },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setKind(id)}
              className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition ${
                kind === id ? 'border-garnet-500 bg-garnet-600/15 text-garnet-300' : 'border-ink-600 text-neutral-300 hover:bg-ink-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <label className="block text-xs font-medium text-neutral-400 mb-1.5" htmlFor="club-name">
          Nombre oficial (tal cual está en el rol)
        </label>
        <input
          id="club-name"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, CLUB_NAME_MAX))}
          placeholder="Ej: Club de Música"
          className="w-full bg-ink-900 border border-ink-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-garnet-600"
        />
        <p className="text-[11px] text-neutral-600 text-right mt-1 mb-3">{cleanName.length}/{CLUB_NAME_MAX}</p>

        <label className="block text-xs font-medium text-neutral-400 mb-1.5" htmlFor="club-details">
          Datos para verificarlo (opcional)
        </label>
        <textarea
          id="club-details"
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, CLUB_DETAILS_MAX))}
          rows={3}
          placeholder="Ej: nombre del canal de Discord, tu personaje en el rol, quién puede confirmar que eres el líder..."
          className="w-full bg-ink-900 border border-ink-700 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-garnet-600"
        />
        <p className="text-[11px] text-neutral-600 text-right mt-1 mb-3">{details.length}/{CLUB_DETAILS_MAX}</p>

        <label className="flex items-start gap-2.5 mb-4 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[var(--color-garnet-500)]" />
          <span className="text-sm text-neutral-300 leading-snug">
            Confirmo que soy el <b>líder oficial</b> y que el grupo ya está oficializado en el servidor de Discord y en el rol de Gakuran.
          </span>
        </label>

        {error && <p className="text-xs text-garnet-400 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} disabled={sending} className="flex-1 border border-ink-500 text-neutral-300 rounded-full py-2.5 text-sm hover:bg-ink-800 transition disabled:opacity-60">
            Cancelar
          </button>
          <button type="button" onClick={submit} disabled={!canSend} className="flex-1 bg-garnet-600 hover:bg-garnet-500 text-white rounded-full py-2.5 text-sm font-medium transition disabled:opacity-50">
            {sending ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </div>
      </div>
    </div>
  )
}
