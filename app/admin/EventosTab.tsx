'use client'

// v1.9.0 · Centro de Mando → Eventos. El equipo con «manage_events» organiza los eventos oficiales y modera los de los clubes.
import { useCallback, useEffect, useState } from 'react'
import { useAppSession } from '../components/AppShell'
import ConfirmDialog from '../components/ConfirmDialog'
import EventCard from '../components/events/EventCard'
import EventForm from '../components/events/EventForm'
import { PlusIcon } from '../components/icons'
import { listEvents, type EventRow } from '../lib/events'
import { useEventActions } from '../lib/useEventActions'

type Scope = 'proximos' | 'pasados'

export default function EventosTab() {
  const { userId } = useAppSession()
  const [scope, setScope] = useState<Scope>('proximos')
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<{ open: boolean; editing: EventRow | null }>({ open: false, editing: null })
  const [toDelete, setToDelete] = useState<EventRow | null>(null)

  const load = useCallback(async () => {
    const now = new Date()
    const { events: list, error: err } =
      scope === 'proximos'
        ? await listEvents({ limit: 100 })
        : await listEvents({ from: new Date(now.getTime() - 60 * 86400000), to: now, limit: 100 })
    setEvents(scope === 'pasados' ? [...list].reverse() : list)
    setError(err ? (/Could not find the function|schema cache/i.test(err) ? 'Falta correr el SQL de la v1.9.0 en Supabase.' : err) : '')
    setLoading(false)
  }, [scope])

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(t)
  }, [load])

  const actions = useEventActions(setEvents, load)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-full border border-ink-600 p-0.5" role="tablist" aria-label="Eventos">
          {([['proximos', 'Próximos'], ['pasados', 'Pasados (60 días)']] as const).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={scope === id} onClick={() => { setLoading(true); setScope(id) }} className={`rounded-full px-3.5 py-1.5 text-sm transition ${scope === id ? 'bg-garnet-600 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setForm({ open: true, editing: null })} className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-garnet-600 hover:bg-garnet-500 px-4 py-2 text-sm font-medium text-white transition">
          <PlusIcon className="w-4 h-4" /> Evento oficial
        </button>
      </div>
      <p className="text-xs text-neutral-500">Un evento oficial avisa a toda la comunidad (quien no apagó los avisos de eventos). Los eventos de club los crean sus líderes; aquí puedes cancelarlos o borrarlos si hace falta.</p>

      {(error || actions.error) && <p className="text-sm text-garnet-400" role="alert">{error || actions.error}</p>}
      {loading ? (
        <p className="text-neutral-500 text-sm text-center py-8">Cargando...</p>
      ) : events.length === 0 ? (
        <p className="text-neutral-500 text-sm text-center py-8">No hay eventos {scope === 'proximos' ? 'próximos' : 'en los últimos 60 días'}.</p>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} signedIn={!!userId} onRsvp={actions.rsvp} onEdit={(x) => setForm({ open: true, editing: x })} onCancel={actions.toggleCancel} onDelete={setToDelete} />
          ))}
        </div>
      )}

      {form.open && (
        <EventForm
          editing={form.editing}
          canOfficial
          clubs={[]}
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
        message={`Se borra «${toDelete?.title ?? ''}» y las confirmaciones de asistencia. No se puede deshacer.`}
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
