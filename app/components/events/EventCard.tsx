'use client'

// v1.9.0 · Tarjeta de un evento: fecha, lugar, enlace de participación y asistencia (Voy / Quizá).
import { memo, useState } from 'react'
import Link from 'next/link'
import KebabMenu, { type MenuItem } from '../KebabMenu'
import { CalendarIcon, CheckIcon, ClockIcon, LinkIcon, MapPinIcon, SparklesIcon } from '../icons'
import { eventCountdown, eventWhen, googleCalendarUrl, isEventLive, isEventOver, type EventRow } from '../../lib/events'

type Props = {
  event: EventRow
  signedIn: boolean
  highlight?: boolean
  onRsvp: (e: EventRow, status: 'going' | 'maybe' | 'none') => void
  onEdit?: (e: EventRow) => void
  onCancel?: (e: EventRow) => void
  onDelete?: (e: EventRow) => void
  /** dentro de la página de un club no hace falta repetir el club */
  hideClub?: boolean
}

function EventCard({ event: e, signedIn, highlight = false, onRsvp, onEdit, onCancel, onDelete, hideClub = false }: Props) {
  const [more, setMore] = useState(false)
  const over = isEventOver(e)
  const live = !over && isEventLive(e)
  const closed = over || e.cancelled
  const accent = e.kind === 'oficial' ? '#e0b24a' : e.club_color || '#7c8cff'
  const long = (e.description?.length ?? 0) > 160

  const items: MenuItem[] = []
  if (e.can_manage) {
    if (onEdit) items.push({ label: 'Editar evento', onClick: () => onEdit(e) })
    if (onCancel) items.push({ label: e.cancelled ? 'Reactivar evento' : 'Cancelar evento', onClick: () => onCancel(e) })
    if (onDelete) items.push({ label: 'Eliminar evento', onClick: () => onDelete(e), danger: true })
  }

  return (
    <article
      id={`ev-${e.id}`}
      className={`relative overflow-hidden rounded-2xl border bg-ink-800/80 p-4 pl-5 transition ${highlight ? 'border-garnet-500 ring-1 ring-garnet-500/40' : 'border-ink-700'} ${closed ? 'opacity-70' : ''}`}
    >
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: accent }} aria-hidden />
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {e.kind === 'oficial' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 text-amber-300 px-2 py-0.5 text-[11px] font-medium">
                <SparklesIcon className="w-3 h-3" /> Oficial
              </span>
            ) : (
              !hideClub &&
              e.club_slug && (
                <Link href={`/clubes/${e.club_slug}`} className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium hover:opacity-80 transition" style={{ background: `${accent}26`, color: accent }}>
                  {e.club_name}
                </Link>
              )
            )}
            {e.cancelled ? (
              <span className="rounded-full bg-garnet-500/15 text-garnet-400 px-2 py-0.5 text-[11px] font-medium">Cancelado</span>
            ) : (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${live ? 'bg-emerald-400/15 text-emerald-300' : 'bg-ink-700 text-neutral-400'}`}>
                {live && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden />}
                {eventCountdown(e)}
              </span>
            )}
          </div>
          <h3 className={`text-base font-semibold text-neutral-50 break-words ${e.cancelled ? 'line-through decoration-neutral-500' : ''}`}>{e.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-300">
            <ClockIcon className="w-4 h-4 shrink-0 text-neutral-500" /> <span className="min-w-0">{eventWhen(e)}</span>
          </p>
          {e.location && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-neutral-400">
              <MapPinIcon className="w-4 h-4 shrink-0 text-neutral-500" /> <span className="min-w-0 break-words">{e.location}</span>
            </p>
          )}
        </div>
        {items.length > 0 && <KebabMenu items={items} label="Opciones del evento" small />}
      </div>

      {e.description && (
        <div className="mt-2.5">
          <p className={`text-sm text-neutral-300 whitespace-pre-wrap break-words ${more ? '' : 'line-clamp-3'}`}>{e.description}</p>
          {long && (
            <button type="button" onClick={() => setMore((v) => !v)} className="mt-0.5 text-xs text-garnet-400 hover:text-garnet-300 transition">
              {more ? 'Ver menos' : 'Ver más'}
            </button>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!closed && signedIn && (
          <>
            <button
              type="button"
              onClick={() => onRsvp(e, e.my_status === 'going' ? 'none' : 'going')}
              aria-pressed={e.my_status === 'going'}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${e.my_status === 'going' ? 'border-garnet-500 bg-garnet-600 text-white' : 'border-ink-600 text-neutral-200 hover:border-garnet-500'}`}
            >
              {e.my_status === 'going' && <CheckIcon className="w-4 h-4" />} Voy
            </button>
            <button
              type="button"
              onClick={() => onRsvp(e, e.my_status === 'maybe' ? 'none' : 'maybe')}
              aria-pressed={e.my_status === 'maybe'}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${e.my_status === 'maybe' ? 'border-amber-400 bg-amber-400/15 text-amber-200' : 'border-ink-600 text-neutral-300 hover:border-neutral-500'}`}
            >
              {e.my_status === 'maybe' && <CheckIcon className="w-4 h-4" />} Quizá
            </button>
          </>
        )}
        {e.link_url && !closed && (
          <a
            href={e.link_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-600 px-3.5 py-1.5 text-sm text-neutral-200 hover:border-garnet-500 hover:text-garnet-300 transition"
          >
            <LinkIcon className="w-4 h-4" /> Unirme
          </a>
        )}
        {!closed && (
          <a href={googleCalendarUrl(e)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-garnet-400 transition ml-auto" title="Añadir a mi Google Calendar">
            <CalendarIcon className="w-4 h-4" /> Añadir al calendario
          </a>
        )}
      </div>
      {(e.going_count > 0 || e.maybe_count > 0) && (
        <p className="mt-2 text-xs text-neutral-500 tabular-nums">
          {e.going_count} {e.going_count === 1 ? 'va' : 'van'}
          {e.maybe_count > 0 ? ` · ${e.maybe_count} ${e.maybe_count === 1 ? 'quizá' : 'quizá'}` : ''}
        </p>
      )}
    </article>
  )
}

export default memo(EventCard)
