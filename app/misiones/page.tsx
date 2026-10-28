'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell, { useAppSession } from '../components/AppShell'
import { CheckIcon, FlameIcon, GiftIcon, MoonCoinIcon } from '../components/icons'
import { supabase } from '../lib/supabaseClient'
import {
  CATEGORY_LABELS, DIFFICULTY_LABELS, countdown, refreshWallet,
  type DayMissions, type Mission, type StreakState, type WeekMissions,
} from '../lib/economy'
import { effectiveReward } from '../lib/economy'
import { MISSIONS_CHANGED } from '../components/economy/MissionNotifier'
import MoonRain from '../components/economy/MoonRain'
import Toast from '../components/economy/Toast'

type Tab = 'hoy' | 'semana' | 'logros' | 'bienvenida'

export default function MisionesPage() {
  return (
    <AppShell>
      <MisionesContent />
    </AppShell>
  )
}

const CAT_STYLE: Record<Mission['category'], string> = {
  social: 'bg-rose-500/15 text-rose-300',
  creacion: 'bg-violet-500/15 text-violet-300',
  descubrimiento: 'bg-sky-500/15 text-sky-300',
  comunidad: 'bg-emerald-500/15 text-emerald-300',
  personalizacion: 'bg-amber-500/15 text-amber-300',
}

function MissionCard({
  m, mult = 1, busy, onClaim, onReroll, canReroll, rerollLabel,
}: {
  m: Mission
  mult?: number
  busy: boolean
  onClaim: (m: Mission) => void
  onReroll?: (m: Mission) => void
  canReroll?: boolean
  rerollLabel?: string
}) {
  const pct = Math.min(100, Math.round((m.progress / m.target) * 100))
  return (
    <li className={`rounded-2xl border p-4 transition ${m.claimed ? 'border-ink-800 bg-ink-900/30 opacity-70' : m.claimable ? 'border-amber-500/40 bg-amber-500/5' : 'border-ink-700 bg-ink-900/60'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className={`text-[10.5px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${CAT_STYLE[m.category]}`}>{CATEGORY_LABELS[m.category]}</span>
            {m.difficulty && <span className="text-[10.5px] text-neutral-500 uppercase tracking-wide">{DIFFICULTY_LABELS[m.difficulty]}</span>}
            {m.rerolled && <span className="text-[10.5px] text-neutral-600">· cambiada</span>}
          </div>
          <p className="text-[15px] text-neutral-50 leading-snug">{m.text}</p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold px-2.5 py-1 tabular-nums">
          <MoonCoinIcon className="w-3.5 h-3.5" />+{effectiveReward(m, mult)}{mult !== 1 && (m.period === 'daily' || m.period === 'weekly') ? <span className="ml-0.5 text-[10.5px] opacity-80">×{mult}</span> : null}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-ink-800 overflow-hidden" role="progressbar" aria-valuenow={m.progress} aria-valuemin={0} aria-valuemax={m.target}>
          <div className={`h-full rounded-full transition-all ${m.claimed ? 'bg-emerald-500' : 'bg-garnet-500'}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-neutral-400 tabular-nums w-12 text-right">{m.progress} / {m.target}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        {m.claimed ? (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-400 font-medium"><CheckIcon className="w-4 h-4" /> Reclamada</span>
        ) : m.claimable ? (
          <button onClick={() => onClaim(m)} disabled={busy} className="press rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-ink-950 text-sm font-bold px-5 py-1.5 transition">
            ¡Reclamar!
          </button>
        ) : (
          <>
            {m.go_href && <Link href={m.go_href} className="rounded-full border border-ink-600 text-neutral-200 text-sm px-4 py-1.5 hover:bg-ink-800 transition">Ir</Link>}
            {onReroll && canReroll && (
              <button onClick={() => onReroll(m)} disabled={busy} className="text-xs text-neutral-500 hover:text-neutral-200 px-2 py-1.5 transition">
                ↻ Cambiar ({rerollLabel})
              </button>
            )}
          </>
        )}
      </div>
    </li>
  )
}

function MisionesContent() {
  const { userId, loading } = useAppSession()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('hoy')
  const [day, setDay] = useState<DayMissions | null>(null)
  const [week, setWeek] = useState<WeekMissions | null>(null)
  const [ach, setAch] = useState<Mission[]>([])
  const [onb, setOnb] = useState<Mission[]>([])
  const [streak, setStreak] = useState<StreakState | null>(null)
  const [busy, setBusy] = useState(false)
  const [rain, setRain] = useState(false)
  const [toast, setToast] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null)
  const [error, setError] = useState(false)
  const [, tick] = useState(0)
  const [loadedAt, setLoadedAt] = useState(0)
  const [chestOpen, setChestOpen] = useState(false)

  const loadingAll = useRef(false)
  const loadAgain = useRef(false)
  const claimLock = useRef(false)
  const loadAll = useCallback(async () => {
    // v1.5.9 · una recarga pedida mientras otra está en curso se repite al terminar (si no, la lista se quedaba vieja)
    if (loadingAll.current) {
      loadAgain.current = true
      return
    }
    loadingAll.current = true
    try {
      do {
        loadAgain.current = false
        const [d, w, a, o, s] = await Promise.all([
          supabase.rpc('missions_today'),
          supabase.rpc('missions_week'),
          supabase.rpc('achievements_list'),
          supabase.rpc('missions_onboarding'),
          supabase.rpc('streak_state_me'),
        ])
        if (d.error || w.error) {
          setError(true)
          return
        }
        setLoadedAt(Date.now())
        setDay(d.data as DayMissions)
        setWeek(w.data as WeekMissions)
        setAch((a.data as Mission[]) ?? [])
        setOnb((o.data as Mission[]) ?? [])
        setStreak((s.data as StreakState) ?? null)
      } while (loadAgain.current)
    } finally {
      loadingAll.current = false
    }
  }, [])

  useEffect(() => {
    if (!loading && !userId) router.replace('/login')
  }, [loading, userId, router])
  useEffect(() => {
    if (!userId) return
    supabase.rpc('streak_touch').then(() => loadAll())
  }, [userId, loadAll])
  // el aviso de «misión completada» (o reclamar desde el Inicio) refresca esta lista al instante
  useEffect(() => {
    const on = () => void loadAll()
    window.addEventListener(MISSIONS_CHANGED, on)
    return () => window.removeEventListener(MISSIONS_CHANGED, on)
  }, [loadAll])
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  const say = (text: string, tone: 'ok' | 'error' = 'ok') => setToast({ text, tone })

  // v1.5.9 · candado inmediato (varios toques = UN solo reclamo) y la misión se marca como reclamada al instante
  function markClaimed(id: string, claimed: boolean) {
    const f = (list: Mission[]) => list.map((x) => (x.id === id ? { ...x, claimed, claimable: !claimed } : x))
    setDay((d) => (d ? { ...d, missions: f(d.missions) } : d))
    setWeek((w) => (w ? { ...w, missions: f(w.missions) } : w))
    setAch((l) => f(l))
    setOnb((l) => f(l))
  }
  async function claim(m: Mission) {
    if (claimLock.current) return
    claimLock.current = true
    setBusy(true)
    markClaimed(m.id, true)
    const { data, error: err } = await supabase.rpc('mission_claim', { p_id: m.id })
    claimLock.current = false
    setBusy(false)
    if (err) {
      if (!/ya reclamaste/i.test(err.message)) {
        markClaimed(m.id, false)
        say(err.message, 'error')
      }
      refreshWallet(true)
      return loadAll()
    }
    const r = data as { reward: number; bonus: number }
    setRain(true)
    say(r.bonus > 0 ? `¡+${r.reward} ☾ y bono de +${r.bonus} ☾ por las 3 del día!` : `¡Misión lista! +${r.reward} ☾`)
    refreshWallet(true)
    loadAll()
  }

  async function reroll(m: Mission) {
    setBusy(true)
    const { error: err } = await supabase.rpc('mission_reroll', { p_id: m.id })
    setBusy(false)
    if (err) say(err.message, 'error')
    else say('Misión cambiada')
    refreshWallet(true)
    loadAll()
  }

  async function claimStreak(dayN: number) {
    setBusy(true)
    const { data, error: err } = await supabase.rpc('streak_claim', { p_day: dayN })
    setBusy(false)
    if (err) return say(err.message, 'error')
    setRain(true)
    say(`¡Racha de ${dayN} días! +${(data as { reward: number }).reward} ☾`)
    refreshWallet(true)
    loadAll()
  }

  async function openChest() {
    setBusy(true)
    const { data, error: err } = await supabase.rpc('chest_claim')
    setBusy(false)
    if (err) return say(err.message, 'error')
    setChestOpen(true)
    setTimeout(() => setChestOpen(false), 900)
    setRain(true)
    say(`¡Cofre semanal! +${(data as { reward: number }).reward} ☾`)
    refreshWallet(true)
    loadAll()
  }

  if (loading || !userId) return null

  const pendingOnb = onb.filter((m) => !m.claimed).length
  const tabs: { id: Tab; label: string; dot?: boolean }[] = [
    { id: 'hoy', label: 'Hoy', dot: !!day?.missions.some((m) => m.claimable) },
    { id: 'semana', label: 'Semana', dot: !!week?.missions.some((m) => m.claimable) || !!(week?.chest_ready && !week.chest_paid) },
    { id: 'logros', label: 'Logros', dot: ach.some((m) => m.claimable) },
    ...(pendingOnb > 0 ? [{ id: 'bienvenida' as Tab, label: 'Bienvenida', dot: onb.some((m) => m.claimable) }] : []),
  ]
  const claimedToday = day?.missions.filter((m) => m.claimed).length ?? 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <MoonRain show={rain} onDone={() => setRain(false)} />
      <Toast message={toast?.text ?? null} tone={toast?.tone} onClose={() => setToast(null)} />

      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-semibold text-neutral-50">Misiones</h1>
        <Link
          href="/monedas"
          className="inline-flex items-center gap-2 rounded-full border border-amber-400/70 bg-gradient-to-b from-amber-400/25 to-amber-600/15 text-amber-100 pl-3 pr-3.5 py-2 text-sm font-semibold shadow-[0_0_14px_-2px] shadow-amber-400/50 hover:from-amber-400/35 transition"
        >
          <MoonCoinIcon className="w-5 h-5" />
          Ver mi saldo
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* Racha (v1.4.0: más clara) */}
      {streak && <StreakCard streak={streak} busy={busy} onClaim={claimStreak} />}

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative px-4 py-2 rounded-full text-sm font-medium border transition ${
              tab === t.id ? 'bg-garnet-600 text-white border-garnet-500' : 'bg-ink-800/70 border-ink-700 text-neutral-300 hover:bg-ink-700'
            }`}
          >
            {t.label}
            {t.dot && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-ink-950" />}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-neutral-400 rounded-xl border border-ink-700 p-4">
          No pude cargar las misiones. Si acabas de actualizar la app, revisa que el SQL de la v1.3.0 esté aplicado en Supabase.
        </p>
      )}

      {tab === 'hoy' && day && (
        <>
          <p className="text-xs text-neutral-500 mb-3">
            Se renueva en {countdown(day.ends_at, day.server_now, loadedAt)} · {claimedToday}/3 hechas · bono por las 3: +{day.bonus_amount} ☾{day.bonus_paid ? ' ✓' : ''}
            {day.multiplier !== 1 && <span className="text-amber-300"> · ¡Lunas x{day.multiplier}!</span>}
          </p>
          <ul className="space-y-3">
            {day.missions.map((m) => (
              <MissionCard key={m.id} m={m} mult={day.multiplier} busy={busy} onClaim={claim} onReroll={reroll} canReroll rerollLabel={day.rerolls_free_left > 0 ? 'gratis' : `${day.reroll_cost} ☾`} />
            ))}
          </ul>
        </>
      )}

      {tab === 'semana' && week && (
        <>
          <p className="text-xs text-neutral-500 mb-3">Se renuevan en {countdown(week.ends_at, week.server_now, loadedAt)}{week.multiplier !== 1 && <span className="text-amber-300"> · ¡Lunas x{week.multiplier}!</span>}</p>
          <ul className="space-y-3 mb-5">
            {week.missions.map((m) => (
              <MissionCard key={m.id} m={m} mult={week?.multiplier ?? 1} busy={busy} onClaim={claim} />
            ))}
          </ul>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center gap-4">
            <GiftIcon className={`w-10 h-10 text-amber-300 ${chestOpen ? 'chest-pop' : ''}`} />
            <div className="flex-1">
              <p className="font-display font-semibold text-neutral-50">Cofre semanal</p>
              <p className="text-xs text-neutral-400">Completa y reclama las 4 misiones de la semana: +{week.chest_amount} ☾ fijos.</p>
            </div>
            {week.chest_paid ? (
              <span className="text-sm text-emerald-400 font-medium">Abierto ✓</span>
            ) : (
              <button onClick={openChest} disabled={busy || !week.chest_ready} className="press rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-ink-950 text-sm font-bold px-5 py-2 transition">
                Abrir
              </button>
            )}
          </div>
        </>
      )}

      {tab === 'logros' && (
        <ul className="space-y-3">
          {ach.map((m) => (
            <MissionCard key={m.id} m={m} busy={busy} onClaim={claim} />
          ))}
          {ach.length === 0 && <p className="text-sm text-neutral-500">Aún no hay logros.</p>}
        </ul>
      )}

      {tab === 'bienvenida' && (
        <ul className="space-y-3">
          {onb.map((m) => (
            <MissionCard key={m.id} m={m} busy={busy} onClaim={claim} />
          ))}
        </ul>
      )}

      {!day && !error && <p className="text-sm text-neutral-500">Cargando misiones…</p>}
      <p className="text-xs text-neutral-600 text-center mt-6">Las misiones se cuentan solas con lo que haces en DaiwaPlace. Nada se puede completar a mano.</p>
    </div>
  )
}


/** Racha: días seguidos, la semana en orden de calendario (Dom → Sáb) y cuánto falta para el siguiente premio. */
function StreakCard({ streak, busy, onClaim }: { streak: StreakState; busy: boolean; onClaim: (day: number) => void }) {
  const cur = streak.current
  const todayDone = streak.today_done !== false
  const next = streak.milestones.find((m) => !m.reached)
  const prevDay = [...streak.milestones].reverse().find((m) => m.reached)?.day ?? 0
  const readyNow = streak.milestones.filter((m) => m.reached && !m.claimed)
  const span = next ? Math.max(1, next.day - prevDay) : 1
  const pct = next ? Math.max(4, Math.min(100, Math.round(((streak.cycle_day - prevDay) / span) * 100))) : 100
  const left = next ? Math.max(1, next.day - streak.cycle_day) : 0

  // Semana de calendario en orden: domingo, lunes, martes, miércoles, jueves, viernes, sábado
  const NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const now = new Date()
  const todayIdx = now.getDay() // 0 = domingo
  const week = NAMES.map((name, idx) => {
    const offset = idx - todayIdx // negativo = ya pasó esta semana, 0 = hoy, positivo = falta
    const date = new Date(now)
    date.setDate(now.getDate() + offset)
    // un día cuenta si cae dentro de la racha (que termina hoy si hoy ya cuenta, o ayer si no)
    const daysAgo = -offset
    const done = offset === 0 ? todayDone : offset < 0 && (todayDone ? daysAgo < cur : daysAgo <= cur)
    return { name, day: date.getDate(), done, isToday: offset === 0, future: offset > 0 }
  })

  return (
    <section className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-ink-900/70 to-ink-900/60 p-4 sm:p-5 mb-4" aria-label="Tu racha">
      <div className="flex items-center gap-3">
        <span className={`flex items-center justify-center w-14 h-14 rounded-2xl shrink-0 ${cur > 0 ? 'bg-gradient-to-b from-orange-400 to-red-500 shadow-[0_0_20px_-4px] shadow-orange-500/70' : 'bg-ink-800'}`}>
          <FlameIcon className={`w-8 h-8 ${cur > 0 ? 'text-white' : 'text-neutral-600'}`} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-300/90">Tu racha</p>
          <p className="font-display text-2xl font-bold text-neutral-50 leading-tight">{cur} {cur === 1 ? 'día seguido' : 'días seguidos'}</p>
          <p className="text-xs text-neutral-400">Tu mejor racha: {streak.best} {streak.best === 1 ? 'día' : 'días'}</p>
        </div>
      </div>

      <p className="text-sm text-neutral-300 mt-3">
        Entra a DaiwaPlace <b className="text-neutral-100">cada día</b> para sumar. Si te saltas un día, empiezas de nuevo.
        {!todayDone && <b className="text-orange-300"> Hoy todavía no cuenta.</b>}
      </p>

      {/* La semana, en orden: Dom Lun Mar Mié Jue Vie Sáb */}
      <div className="grid grid-cols-7 gap-1.5 mt-4" aria-label="Esta semana">
        {week.map((d) => (
          <div key={d.name} className="flex flex-col items-center gap-1">
            <span className={`text-[11px] font-semibold ${d.isToday ? 'text-orange-300' : 'text-neutral-500'}`}>{d.name}</span>
            <span
              className={`w-full max-w-[44px] aspect-square rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                d.done ? 'bg-orange-400 border-orange-300 text-ink-950' : d.isToday ? 'border-dashed border-orange-400 text-orange-300' : d.future ? 'border-ink-800 text-neutral-700' : 'border-ink-700 text-neutral-500'
              }`}
              aria-label={`${d.name} ${d.day}: ${d.done ? 'sumó a la racha' : d.future ? 'todavía no llega' : d.isToday ? 'hoy, aún no cuenta' : 'no sumó'}`}
            >
              {d.done ? <CheckIcon className="w-5 h-5" /> : d.day}
            </span>
            <span className="text-[10px] text-neutral-600 h-3">{d.isToday ? 'hoy' : ''}</span>
          </div>
        ))}
      </div>

      {/* Siguiente premio */}
      <div className="mt-3 rounded-xl border border-ink-700 bg-ink-950/50 p-3">
        {readyNow.length > 0 ? (
          <p className="text-sm text-amber-200 font-semibold">🎉 ¡Tienes {readyNow.length === 1 ? 'un premio de racha listo' : `${readyNow.length} premios de racha listos`}! Reclámalo abajo.</p>
        ) : next ? (
          <>
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <p className="text-sm text-neutral-200">Siguiente premio: <b className="text-amber-300">día {next.day} · +{next.amount} ☾</b></p>
              <p className="text-xs text-neutral-400 tabular-nums">te {left === 1 ? 'falta' : 'faltan'} {left} {left === 1 ? 'día' : 'días'}</p>
            </div>
            <div className="h-2.5 rounded-full bg-ink-700 overflow-hidden" role="progressbar" aria-valuenow={streak.cycle_day} aria-valuemin={prevDay} aria-valuemax={next.day} aria-label="Progreso al siguiente premio">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-300" style={{ width: `${pct}%` }} />
            </div>
          </>
        ) : (
          <p className="text-sm text-neutral-200">¡Completaste todo el ciclo de 30 días! 🔥 Sigue entrando: el ciclo vuelve a empezar.</p>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3">
        {streak.milestones.map((ms) => {
          const ready = ms.reached && !ms.claimed
          return (
            <button
              key={ms.day}
              disabled={busy || !ready}
              onClick={() => onClaim(ms.day)}
              aria-label={ms.claimed ? `Premio del día ${ms.day} reclamado` : ready ? `Reclamar premio del día ${ms.day}: ${ms.amount} Lunas` : `Premio del día ${ms.day}: ${ms.amount} Lunas, todavía no`}
              className={`rounded-xl border px-1.5 py-2 text-center transition ${
                ms.claimed ? 'border-emerald-700/40 bg-emerald-500/5 text-emerald-400/80' : ready ? 'border-amber-400 bg-amber-400/15 text-amber-100 shadow-[0_0_14px_-3px] shadow-amber-400/60 hover:bg-amber-400/25' : 'border-ink-700 text-neutral-500'
              }`}
            >
              <p className="text-xs font-semibold">Día {ms.day}</p>
              <p className="text-[11px] tabular-nums font-medium">{ms.claimed ? '✓ Reclamado' : ready ? `¡Reclamar +${ms.amount}!` : `+${ms.amount} ☾`}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
