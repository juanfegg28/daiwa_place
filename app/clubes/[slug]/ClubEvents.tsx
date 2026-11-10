'use client'

// v1.9.0 · Pestaña «Eventos» de un club: las actividades que organiza su líder.
import { useCallback, useEffect, useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog'
import EventCard from '../../components/events/EventCard'
import EventForm from '../../components/events/EventForm'
import { CalendarIcon, PlusIcon } from '../../components/icons'
import { listEvents, type EventRow } from '../../lib/events'
import { useEventActions } from '../../lib/useEventActions'

export default function ClubEvents({ clubId, clubName, isLeader, signedIn }: { clubId: string; clubName: string; isLeader: boolean; signedIn: boolean }) {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<{ open: boolean; editing: EventRow | null }>({ open: false, editing: null })
  const [toDelete, setToDelete] = useState<EventRow | null>(null)

  const load = useCallback(async () => {
    const { events: list, error: err } = await listEvents({ club: clubId, limit: 30 })
    setEvents(list)
    setError(err ? 'No se pudieron cargar los eventos del club.' : '')
    setLoading(false)
  }, [clubId])
  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(t)
  }, [load])
  const actions = useEventActions(setEvents, load)

  return (
    <div className="space-y-3">
      {isLeader && (
        <div className="surface-card rounded-2xl p-3.5 flex items-center gap-3">
          <p className="flex-1 text-[13px] text-neutral-300 leading-snug">Organiza una actividad: se avisa a los miembros del club y pueden confirmar si van.</p>
          <button type="button" onClick={() => setForm({ open: true, editing: null })} className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-garnet-600 hover:bg-garnet-500 px-4 py-2 text-sm font-medium text-white transition">
            <PlusIcon className="w-4 h-4" /> Crear evento
          </button>
        </div>
      )}
      {(error || actions.error) && <p className="text-sm text-garnet-400" role="alert">{error || actions.error}</p>}
      {loading ? (
        <p className="text-neutral-500 text-sm text-center py-8">Cargando eventos...</p>
      ) : events.length === 0 ? (
        <div className="text-center py-10 px-4">
          <CalendarIcon className="w-9 h-9 mx-auto text-neutral-600 mb-2" />
          <p className="text-neutral-400 text-sm">Este club todavía no tiene eventos próximos.</p>
        </div>
      ) : (
        events.map((e) => (
          <EventCard key={e.id} event={e} signedIn={signedIn} hideClub onRsvp={actions.rsvp} onEdit={(x) => setForm({ open: true, editing: x })} onCancel={actions.toggleCancel} onDelete={setToDelete} />
        ))
      )}
      {form.open && (
        <EventForm
          editing={form.editing}
          canOfficial={false}
          clubs={[{ id: clubId, name: clubName }]}
          lockClubId={clubId}
          onClose={() => setForm({ open: false, editing: null })}
          onSaved={() => {
            setForm({ open: false, editing: null })
            void load()
          }}
        />
      )}
      <ConfirmDialog
        open={!!toDelete}
        title="¿Eliminar el evento?"
        message={`Se borra «${toDelete?.title ?? ''}» y las confirmaciones. Si solo no se va a hacer, mejor cancélalo.`}
        confirmLabel="Eliminar evento"
        onConfirm={async () => {
          if (toDelete) await actions.remove(toDelete)
          setToDelete(null)
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
