// v1.9.0 · Acciones compartidas de eventos (asistencia al instante, cancelar, borrar) para la página, el panel y los clubes.
import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import { cancelEvent, deleteEvent, rsvpEvent, type EventRow, type EventStatus } from './events'

function applyRsvp(e: EventRow, status: 'going' | 'maybe' | 'none'): EventRow {
  const next: EventStatus = status === 'none' ? null : status
  let going = e.going_count
  let maybe = e.maybe_count
  if (e.my_status === 'going') going--
  if (e.my_status === 'maybe') maybe--
  if (next === 'going') going++
  if (next === 'maybe') maybe++
  return { ...e, my_status: next, going_count: Math.max(0, going), maybe_count: Math.max(0, maybe) }
}

export function useEventActions(setEvents: Dispatch<SetStateAction<EventRow[]>>, reload: () => void | Promise<void>) {
  const [error, setError] = useState('')

  const rsvp = useCallback(
    async (e: EventRow, status: 'going' | 'maybe' | 'none') => {
      setError('')
      setEvents((l) => l.map((x) => (x.id === e.id ? applyRsvp(x, status) : x)))
      const { result, error: err } = await rsvpEvent(e.id, status)
      if (err || !result) {
        setEvents((l) => l.map((x) => (x.id === e.id ? e : x)))
        setError(err || 'No se pudo confirmar')
        return
      }
      setEvents((l) => l.map((x) => (x.id === e.id ? { ...x, my_status: result.my_status, going_count: result.going, maybe_count: result.maybe } : x)))
    },
    [setEvents]
  )

  const toggleCancel = useCallback(
    async (e: EventRow) => {
      const err = await cancelEvent(e.id, !e.cancelled)
      if (err) return setError(err)
      await reload()
    },
    [reload]
  )

  const remove = useCallback(
    async (e: EventRow) => {
      const err = await deleteEvent(e.id)
      if (err) return setError(err)
      setEvents((l) => l.filter((x) => x.id !== e.id))
    },
    [setEvents]
  )

  return { rsvp, toggleCancel, remove, error, clearError: () => setError('') }
}
