'use client'

// v1.9.0 · Eventos: próximos (lista) y calendario del mes. Oficiales de DaiwaPlace + actividades de los clubes.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell, { useAppSession } from '../components/AppShell'
import ConfirmDialog from '../components/ConfirmDialog'
import EventCard from '../components/events/EventCard'
import EventForm from '../components/events/EventForm'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '../components/icons'
import { dayHeading, dayKey, listEvents, monthCells, monthLabel, sameDay, startOfDay, type EventRow } from '../lib/events'
import { useEventActions } from '../lib/useEventActions'
import { useLedClubs } from '../lib/useLedClubs'

export default function EventsPage() {
  return (
    <AppShell>
      <EventsContent />
    </AppShell>
  )
}

type Mode = 'upcoming' | 'month'

function EventsContent() {
  const router = useRouter()
  const { userId, loading: sessionLoading, isSupreme, permissions } = useAppSession()
  const ledClubs = useLedClubs(userId)
  const canOfficial = isSupreme || !!permissions.manage_events
  const canCreate = canOfficial || ledClubs.length > 0

  const [mode, setMode] = useState<Mode>('upcoming')
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [anchor, setAnchor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [monthEvents, setMonthEvents] = useState<EventRow[]>([])
  const [monthLoading, setMonthLoading] = useState(false)
  const [picked, setPicked] = useState<Date>(() => startOfDay(new Date()))
  const [form, setForm] = useState<{ open: boolean; editing: EventRow | null }>({ open: false, editing: null })
  const [toDelete, setToDelete] = useState<EventRow | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)

  const loadUpcoming = useCallback(async () => {
    const { events: list, error: err } = await listEvents({ limit: 80 })
    setEvents(list)
    setError(err ? 'No se pudieron cargar los eventos. ¿Ya corriste el SQL de la 1.9.0?' : '')
    setLoading(false)
  }, [])
  const loadMonth = useCallback(async (a: Date) => {
    setMonthLoading(true)
    const from = new Date(a.getFullYear(), a.getMonth(), 1)
    const to = new Date(a.getFullYear(), a.getMonth() + 1, 1)
    const { events: list } = await listEvents({ from, to, limit: 120 })
    setMonthEvents(list)
    setMonthLoading(false)
  }, [])

  useEffect(() => {
    if (sessionLoading) return
    if (!userId) return void router.push('/login')
    const t = window.setTimeout(() => {
      void loadUpcoming()
      const e = new URLSearchParams(window.location.search).get('e')
      if (e) setFocusId(e)
    }, 0)
    return () => window.clearTimeout(t)
  }, [sessionLoading, userId, router, loadUpcoming])
  useEffect(() => {
    if (mode !== 'month' || !userId) return
    const t = window.setTimeout(() => void loadMonth(anchor), 0)
    return () => window.clearTimeout(t)
  }, [mode, anchor, userId, loadMonth])
  useEffect(() => {
    if (!focusId || loading) return
    document.getElementById(`ev-${focusId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [focusId, loading, events.length])

  const reloadAll = useCallback(async () => {
    await loadUpcoming()
    if (mode === 'month') await loadMonth(anchor)
  }, [loadUpcoming, loadMonth, mode, anchor])

  const upActions = useEventActions(setEvents, reloadAll)
  const moActions = useEventActions(setMonthEvents, reloadAll)
  const actions = mode === 'upcoming' ? upActions : moActions

  const grouped = useMemo(() => {
    const m = new Map<string, { date: Date; items: EventRow[] }>()
    for (const e of events) {
      const d = new Date(e.starts_at)
      const k = dayKey(d)
      if (!m.has(k)) m.set(k, { date: startOfDay(d), items: [] })
      m.get(k)!.items.push(e)
    }
    return Array.from(m.values())
  }, [events])

  const byDay = useMemo(() => {
    const m = new Map<string, EventRow[]>()
    for (const e of monthEvents) {
      const k = dayKey(new Date(e.starts_at))
      m.set(k, [...(m.get(k) ?? []), e])
    }
    return m
  }, [monthEvents])

  const openForm = (editing: EventRow | null) => setForm({ open: true, editing })
  const cards = (list: EventRow[]) =>
    list.map((e) => (
      <EventCard
        key={e.id}
        event={e}
        signedIn={!!userId}
        highlight={e.id === focusId}
        onRsvp={actions.rsvp}
        onEdit={openForm}
        onCancel={actions.toggleCancel}
        onDelete={setToDelete}
      />
    ))
  const today = startOfDay(new Date())
  const shift = (n: number) => setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + n, 1))

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      <div className="flex items-center gap-2.5 mb-1">
        <CalendarIcon className="w-6 h-6 text-garnet-400" />
        <h1 className="text-2xl font-display font-semibold text-neutral-50 flex-1">Eventos</h1>
        {canCreate && (
          <button type="button" onClick={() => openForm(null)} className="inline-flex items-center gap-1.5 rounded-full bg-garnet-600 hover:bg-garnet-500 px-4 py-2 text-sm font-medium text-white transition">
            <PlusIcon className="w-4 h-4" /> Crear
          </button>
        )}
      </div>
      <p className="text-sm text-neutral-500 mb-4">Actividades oficiales y de los clubes. Confirma si vas y te avisamos poco antes de que empiecen.</p>

      <div className="mb-4 inline-flex rounded-full border border-ink-600 p-0.5" role="tablist" aria-label="Vista">
        {([['upcoming', 'Próximos'], ['month', 'Calendario']] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => setMode(id)} className={`rounded-full px-4 py-1.5 text-sm transition ${mode === id ? 'bg-garnet-600 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {(error || actions.error) && <p className="text-sm text-garnet-400 mb-3" role="alert">{error || actions.error}</p>}

      {mode === 'upcoming' ? (
        loading ? (
          <p className="text-neutral-500 text-sm text-center py-10">Cargando eventos...</p>
        ) : grouped.length === 0 ? (
          <div className="text-center py-12 px-4">
            <CalendarIcon className="w-10 h-10 mx-auto text-neutral-600 mb-3" />
            <p className="text-neutral-300 text-sm mb-1">No hay eventos próximos</p>
            <p className="text-neutral-500 text-xs">Cuando alguien organice algo, aparece aquí y en tus avisos.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((g) => (
              <section key={dayKey(g.date)}>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">{dayHeading(g.date)}</h2>
                <div className="space-y-3">{cards(g.items)}</div>
              </section>
            ))}
          </div>
        )
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => shift(-1)} aria-label="Mes anterior" className="rounded-full p-2 text-neutral-400 hover:text-neutral-100 hover:bg-ink-700 transition"><ChevronLeftIcon className="w-5 h-5" /></button>
            <h2 className="text-base font-semibold text-neutral-100 capitalize">{monthLabel(anchor)}</h2>
            <button type="button" onClick={() => shift(1)} aria-label="Mes siguiente" className="rounded-full p-2 text-neutral-400 hover:text-neutral-100 hover:bg-ink-700 transition"><ChevronRightIcon className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-neutral-500 mb-1" aria-hidden>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthCells(anchor).map(({ date, inMonth }) => {
              const list = byDay.get(dayKey(date)) ?? []
              const isToday = sameDay(date, today)
              const isPicked = sameDay(date, picked)
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => setPicked(startOfDay(date))}
                  aria-label={`${date.getDate()}${list.length ? `, ${list.length} ${list.length === 1 ? 'evento' : 'eventos'}` : ''}`}
                  aria-pressed={isPicked}
                  className={`relative flex flex-col items-center justify-start rounded-lg border py-1.5 min-h-[3.1rem] text-sm transition ${isPicked ? 'border-garnet-500 bg-garnet-500/15' : 'border-transparent hover:bg-ink-700'} ${inMonth ? 'text-neutral-200' : 'text-neutral-600'} ${isToday ? 'font-bold text-garnet-300' : ''}`}
                >
                  {date.getDate()}
                  <span className="mt-1 flex gap-0.5" aria-hidden>
                    {list.slice(0, 3).map((e) => (
                      <span key={e.id} className="w-1.5 h-1.5 rounded-full" style={{ background: e.cancelled ? '#6b7280' : e.kind === 'oficial' ? '#e0b24a' : e.club_color || '#7c8cff' }} />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="mt-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{dayHeading(picked)}</h3>
            {monthLoading ? (
              <p className="text-sm text-neutral-500 py-4 text-center">Cargando...</p>
            ) : (byDay.get(dayKey(picked)) ?? []).length === 0 ? (
              <p className="text-sm text-neutral-500 py-4 text-center">No hay eventos este día.</p>
            ) : (
              cards(byDay.get(dayKey(picked)) ?? [])
            )}
          </div>
        </div>
      )}

      {form.open && (
        <EventForm
          editing={form.editing}
          canOfficial={canOfficial}
          clubs={ledClubs}
          onClose={() => setForm({ open: false, editing: null })}
          onSaved={() => {
            setForm({ open: false, editing: null })
            void reloadAll()
          }}
        />
      )}
      <ConfirmDialog
        open={!!toDelete}
        title="¿Eliminar el evento?"
        message={`Se borra «${toDelete?.title ?? ''}» y las confirmaciones de asistencia. No se puede deshacer. (Si solo no se va a hacer, mejor cancélalo.)`}
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
