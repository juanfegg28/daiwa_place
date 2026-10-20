'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell, { useAppSession } from '../components/AppShell'
import { CheckIcon, FlameIcon, GiftIcon, MoonCoinIcon } from '../components/icons'
import { supabase } from '../lib/supabaseClient'
import {
  CATEGORY_LABELS, DIFFICULTY_LABELS, countdown, refreshWallet,
  type DayMissions, type Mission, type StreakState, type WeekMissions,
} from '../lib/economy'
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
  m, busy, onClaim, onReroll, canReroll, rerollLabel,
}: {
  m: Mission
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
          <MoonCoinIcon className="w-3.5 h-3.5" />+{m.reward}
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

  const loadAll = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    if (!loading && !userId) router.replace('/login')
  }, [loading, userId, router])
  useEffect(() => {
    if (!userId) return
    supabase.rpc('streak_touch').then(() => loadAll())
  }, [userId, loadAll])
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  const say = (text: string, tone: 'ok' | 'error' = 'ok') => setToast({ text, tone })

  async function claim(m: Mission) {
    setBusy(true)
    const { data, error: err } = await supabase.rpc('mission_claim', { p_id: m.id })
    setBusy(false)
    if (err) {
      say(err.message, 'error')
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
        <Link href="/monedas" className="text-sm text-neutral-400 hover:text-neutral-100 transition">Mi saldo →</Link>
      </div>

      {/* Racha */}
      {streak && (
        <div className="rounded-2xl border border-ink-700 bg-ink-900/60 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <FlameIcon className={`w-5 h-5 ${streak.current > 0 ? 'text-orange-400' : 'text-neutral-600'}`} />
            <p className="text-sm text-neutral-100 font-semibold">Racha de {streak.current} {streak.current === 1 ? 'día' : 'días'}</p>
            <span className="text-xs text-neutral-500">· mejor: {streak.best}</span>
          </div>
          <div className="flex items-center gap-1.5 mb-3" aria-label="Últimos 7 días de la racha">
            {Array.from({ length: 7 }).map((_, i) => {
              const filledFrom = streak.current > 0 ? Math.max(0, 7 - Math.min(7, streak.current)) : 7
              const on = i >= filledFrom
              return <span key={i} className={`flex-1 h-2.5 rounded-full ${on ? 'bg-orange-400' : 'bg-ink-700'}`} />
            })}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {streak.milestones.map((ms) => (
              <button
                key={ms.day}
                disabled={busy || !ms.reached || ms.claimed}
                onClick={() => claimStreak(ms.day)}
                className={`rounded-xl border px-2 py-2 text-center transition ${
                  ms.claimed ? 'border-ink-800 text-neutral-600' : ms.reached ? 'border-amber-500/50 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20' : 'border-ink-700 text-neutral-500'
                }`}
              >
                <p className="text-xs font-semibold">Día {ms.day}</p>
                <p className="text-[11px] tabular-nums">{ms.claimed ? '✓' : `+${ms.amount} ☾`}</p>
              </button>
            ))}
          </div>
        </div>
      )}

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
              <MissionCard key={m.id} m={m} busy={busy} onClaim={claim} onReroll={reroll} canReroll rerollLabel={day.rerolls_free_left > 0 ? 'gratis' : `${day.reroll_cost} ☾`} />
            ))}
          </ul>
        </>
      )}

      {tab === 'semana' && week && (
        <>
          <p className="text-xs text-neutral-500 mb-3">Se renuevan en {countdown(week.ends_at, week.server_now, loadedAt)}{week.multiplier !== 1 && <span className="text-amber-300"> · ¡Lunas x{week.multiplier}!</span>}</p>
          <ul className="space-y-3 mb-5">
            {week.missions.map((m) => (
              <MissionCard key={m.id} m={m} busy={busy} onClaim={claim} />
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
