'use client'

// v1.5.8 · Misiones en el Inicio.
// PC grande (≥ 1280 px): columna a la derecha del feed con las misiones DIARIAS y SEMANALES en dos bloques que se pueden
// minimizar, y se reclaman ahí mismo. Pantallas más chicas: una tarjeta plegable (cerrada de entrada) encima de la caja de publicar.
// Un solo hook (useMissionsPanel) pide los datos; las dos vistas solo los pintan.
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { countdown, effectiveReward, refreshWallet, subscribeWallet, type DayMissions, type Mission, type WeekMissions } from '../../lib/economy'
import { MISSIONS_CHANGED, MISSION_CLAIMED } from './MissionNotifier'
import { CheckIcon, GiftIcon, MoonCoinIcon, TargetIcon } from '../icons'
import { ClaimDot } from './ClaimDot'
import MoonRain from './MoonRain'
import Toast from './Toast'

type Collapsed = { day: boolean; week: boolean; card: boolean }
const STORE_KEY = 'daiwa_home_missions_v1'
const CACHE_KEY = 'daiwa_home_missions_cache_v1'
type Cached = { uid: string; day: DayMissions; week: WeekMissions; at: number }
let memCache: Cached | null = null
// De entrada: en PC los dos bloques abiertos; la tarjeta de pantallas chicas, cerrada
const DEFAULTS: Collapsed = { day: false, week: false, card: true }

export type MissionsPanelState = {
  ready: boolean
  failed: boolean
  day: DayMissions | null
  week: WeekMissions | null
  busy: boolean
  loadedAt: number
  collapsed: Collapsed
  toggle: (k: keyof Collapsed) => void
  claim: (m: Mission) => void
  openChest: () => void
  dayClaimable: number
  weekClaimable: number
  anyClaimable: boolean
}

export function useMissionsPanel(userId: string | null | undefined): { state: MissionsPanelState; overlay: ReactNode } {
  const [day, setDay] = useState<DayMissions | null>(null)
  const [week, setWeek] = useState<WeekMissions | null>(null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loadedAt, setLoadedAt] = useState(0)
  const [rain, setRain] = useState(false)
  const [toast, setToast] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null)
  const [collapsed, setCollapsed] = useState<Collapsed>(DEFAULTS)
  const [, tick] = useState(0)
  const inflight = useRef(false)
  const again = useRef(false)
  const claimLock = useRef(false)

  // recuerda qué dejaste abierto o cerrado
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORE_KEY)
        if (raw) setCollapsed({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Collapsed>) })
      } catch {
        /* sin almacenamiento */
      }
    }, 0)
    return () => window.clearTimeout(t)
  }, [])
  const toggle = useCallback((k: keyof Collapsed) => {
    setCollapsed((c) => {
      const next = { ...c, [k]: !c[k] }
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(next))
      } catch {
        /* sin almacenamiento */
      }
      return next
    })
  }, [])

  const load = useCallback(async () => {
    // v1.5.9 · si piden recargar mientras ya hay una recarga en curso, se repite al terminar (antes se descartaba y la lista se quedaba
    // mostrando «Reclamar» en una misión ya reclamada)
    if (inflight.current) {
      again.current = true
      return
    }
    inflight.current = true
    try {
      const [d, w] = await Promise.all([supabase.rpc('missions_today'), supabase.rpc('missions_week')])
      if (d.error || w.error) {
        setFailed(true)
        return
      }
      setFailed(false)
      const at = Date.now()
      setLoadedAt(at)
      setDay(d.data as DayMissions)
      setWeek(w.data as WeekMissions)
      if (userId) {
        memCache = { uid: userId, day: d.data as DayMissions, week: w.data as WeekMissions, at }
        try {
          window.localStorage.setItem(CACHE_KEY, JSON.stringify(memCache))
        } catch {
          /* sin almacenamiento */
        }
      }
    } finally {
      inflight.current = false
      if (again.current) {
        again.current = false
        void load()
      }
    }
  }, [userId])

  // v1.5.9 · Al renovar el feed, las misiones salen AL INSTANTE con lo último que se vio (y se actualizan solas en segundo plano)
  useEffect(() => {
    if (!userId) return
    let c = memCache
    if (!c) {
      try {
        const raw = window.localStorage.getItem(CACHE_KEY)
        if (raw) c = JSON.parse(raw) as Cached
      } catch {
        /* sin almacenamiento */
      }
    }
    if (!c || c.uid !== userId) return
    const t = window.setTimeout(() => {
      setDay(c.day)
      setWeek(c.week)
      setLoadedAt(c.at)
    }, 0)
    return () => window.clearTimeout(t)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    // v1.5.9 · el primer pedido espera un poquito para que el feed cargue primero (antes competían y todo tardaba)
    const first = window.setTimeout(() => void load(), 700)
    const onFocus = () => void load()
    const iv = window.setInterval(() => document.visibilityState === 'visible' && void load(), 90000)
    const clock = window.setInterval(() => tick((n) => n + 1), 60000)
    // si algo cambia el resumen del saldo (una misión se completó o se reclamó en otra pantalla), se vuelve a leer
    let lastClaimable = -1
    const unsub = subscribeWallet((w) => {
      const c = w?.claimable ?? 0
      if (lastClaimable !== -1 && c !== lastClaimable) void load()
      lastClaimable = c
    })
    window.addEventListener('focus', onFocus)
    window.addEventListener(MISSIONS_CHANGED, onFocus)
    return () => {
      window.removeEventListener(MISSIONS_CHANGED, onFocus)
      window.clearTimeout(first)
      window.clearInterval(iv)
      window.clearInterval(clock)
      window.removeEventListener('focus', onFocus)
      unsub()
    }
  }, [userId, load])

  const say = (text: string, tone: 'ok' | 'error' = 'ok') => setToast({ text, tone })

  // v1.5.9 · Reclamar sin problemas: candado inmediato (varios toques seguidos = UN solo reclamo), la misión se marca como reclamada
  // al instante y, si algo falla, vuelve a su estado real.
  const markClaimed = (id: string, claimed: boolean) => {
    const f = (list: Mission[]) => list.map((x) => (x.id === id ? { ...x, claimed, claimable: !claimed } : x))
    setDay((d) => (d ? { ...d, missions: f(d.missions) } : d))
    setWeek((w) => (w ? { ...w, missions: f(w.missions) } : w))
  }
  const claim = useCallback(
    async (m: Mission) => {
      if (claimLock.current) return
      claimLock.current = true
      setBusy(true)
      markClaimed(m.id, true)
      const { data, error } = await supabase.rpc('mission_claim', { p_id: m.id })
      claimLock.current = false
      setBusy(false)
      if (error) {
        // «Ya reclamaste…» no es un fallo real: la misión ya estaba cobrada
        if (!/ya reclamaste/i.test(error.message)) {
          markClaimed(m.id, false)
          say(error.message, 'error')
        }
        void refreshWallet(true)
        void load()
        return
      }
      const r = data as { reward: number; bonus: number }
      window.dispatchEvent(new Event(MISSION_CLAIMED)) // v1.5.10: el aviso flotante sobra si ya reclamaste desde aquí
      setRain(true)
      say(r.bonus > 0 ? `¡+${r.reward} ☾ y bono de +${r.bonus} ☾ por las 3 del día!` : `¡Misión lista! +${r.reward} ☾`)
      void refreshWallet(true)
      void load()
    },
    [load]
  )

  const openChest = useCallback(async () => {
    if (claimLock.current) return
    claimLock.current = true
    setBusy(true)
    const { data, error } = await supabase.rpc('chest_claim')
    claimLock.current = false
    setBusy(false)
    if (error) {
      say(error.message, 'error')
      return
    }
    setRain(true)
    say(`¡Cofre semanal! +${(data as { reward: number }).reward} ☾`)
    void refreshWallet(true)
    void load()
  }, [load])

  const dayClaimable = day?.missions.filter((m) => m.claimable).length ?? 0
  const weekClaimable = (week?.missions.filter((m) => m.claimable).length ?? 0) + (week?.chest_ready && !week.chest_paid ? 1 : 0)

  return {
    state: {
      ready: !!day && !!week,
      failed,
      day,
      week,
      busy,
      loadedAt,
      collapsed,
      toggle,
      claim: (m) => void claim(m),
      openChest: () => void openChest(),
      dayClaimable,
      weekClaimable,
      anyClaimable: dayClaimable + weekClaimable > 0,
    },
    overlay: (
      <>
        <MoonRain show={rain} onDone={() => setRain(false)} />
        <Toast message={toast?.text ?? null} tone={toast?.tone} onClose={() => setToast(null)} />
      </>
    ),
  }
}

const Chevron = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 24 24" className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
)

function Row({ m, mult, busy, onClaim }: { m: Mission; mult: number; busy: boolean; onClaim: (m: Mission) => void }) {
  const pct = Math.min(100, Math.round((m.progress / m.target) * 100))
  return (
    <li className={`rounded-xl border px-3 py-2.5 ${m.claimed ? 'border-ink-800 bg-ink-900/30 opacity-65' : m.claimable ? 'border-amber-500/45 bg-amber-500/8' : 'border-ink-700 bg-ink-900/50'}`}>
      <div className="flex items-start gap-2">
        <p className="flex-1 min-w-0 text-[13px] leading-snug text-neutral-100">{m.text}</p>
        <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-semibold px-2 py-0.5 tabular-nums">
          <MoonCoinIcon className="w-3 h-3" />+{effectiveReward(m, mult)}{mult !== 1 && m.period !== 'achievement' ? <span className="ml-0.5 text-[10px] opacity-80">×{mult}</span> : null}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-ink-800 overflow-hidden" role="progressbar" aria-valuenow={m.progress} aria-valuemin={0} aria-valuemax={m.target} aria-label="Progreso de la misión">
          <div className={`h-full rounded-full transition-all ${m.claimed ? 'bg-emerald-500' : 'bg-garnet-500'}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[11px] text-neutral-400 tabular-nums">{m.progress}/{m.target}</span>
        {m.claimed ? (
          <span className="inline-flex items-center gap-0.5 text-[11.5px] text-emerald-400 font-medium"><CheckIcon className="w-3.5 h-3.5" /> Lista</span>
        ) : m.claimable ? (
          <button type="button" onClick={() => onClaim(m)} disabled={busy} className="press rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-ink-950 text-[12px] font-bold px-3 py-1 transition touch-manipulation">
            Reclamar
          </button>
        ) : m.go_href ? (
          <Link href={m.go_href} className="rounded-full border border-ink-600 text-neutral-200 text-[11.5px] px-2.5 py-0.5 hover:bg-ink-800 transition">Ir</Link>
        ) : null}
      </div>
    </li>
  )
}

function Block({ title, sub, open, onToggle, dot, children }: { title: string; sub: string; open: boolean; onToggle: () => void; dot: boolean; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-ink-700 bg-ink-900/60">
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full flex items-center gap-2 px-3.5 py-3 text-left touch-manipulation">
        <span className="relative">
          <span className="font-display text-[15px] font-semibold text-neutral-50">{title}</span>
          {dot && <ClaimDot className="-top-0.5 -right-3 w-2.5 h-2.5" label={`${title}: tienes premios por reclamar`} />}
        </span>
        <span className="ml-auto text-[11.5px] text-neutral-500 tabular-nums">{sub}</span>
        <span className="text-neutral-400"><Chevron open={open} /></span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </section>
  )
}

function Blocks({ s }: { s: MissionsPanelState }) {
  const { day, week } = s
  if (!day || !week) return null
  const done = day.missions.filter((m) => m.claimed).length
  const weekDone = week.missions.filter((m) => m.claimed).length
  return (
    <div className="space-y-2.5">
      <Block title="Diarias" sub={`${done}/${day.missions.length} · ${countdown(day.ends_at, day.server_now, s.loadedAt)}`} open={!s.collapsed.day} onToggle={() => s.toggle('day')} dot={s.dayClaimable > 0}>
        <ul className="space-y-2">
          {day.missions.map((m) => <Row key={m.id} m={m} mult={day.multiplier} busy={s.busy} onClaim={s.claim} />)}
        </ul>
        <p className="mt-2 text-[11px] text-neutral-500">
          Bono por las {day.missions.length}: +{day.bonus_amount} ☾{day.bonus_paid ? ' ✓' : ''}
          {day.multiplier !== 1 && <span className="text-amber-300"> · ¡Lunas x{day.multiplier}!</span>}
        </p>
      </Block>
      <Block title="Semanales" sub={`${weekDone}/${week.missions.length} · ${countdown(week.ends_at, week.server_now, s.loadedAt)}`} open={!s.collapsed.week} onToggle={() => s.toggle('week')} dot={s.weekClaimable > 0}>
        <ul className="space-y-2">
          {week.missions.map((m) => <Row key={m.id} m={m} mult={week.multiplier} busy={s.busy} onClaim={s.claim} />)}
        </ul>
        <div className="mt-2.5 flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
          <GiftIcon className="w-6 h-6 text-amber-300 shrink-0" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[13px] font-semibold text-neutral-50">Cofre semanal</p>
            <p className="text-[11px] text-neutral-400">+{week.chest_amount} ☾ al reclamar las {week.missions.length}</p>
          </div>
          {week.chest_paid ? (
            <span className="text-[12px] text-emerald-400 font-medium">Abierto ✓</span>
          ) : (
            <button type="button" onClick={s.openChest} disabled={s.busy || !week.chest_ready} className="press rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-ink-950 text-[12px] font-bold px-3.5 py-1.5 transition touch-manipulation">
              Abrir
            </button>
          )}
        </div>
      </Block>
      <Link href="/misiones" className="block text-center text-[12.5px] text-amber-300 hover:text-amber-200 py-1">Ver todas las misiones, logros y racha →</Link>
    </div>
  )
}

/** PC (desde 1024 px): columna al lado del feed */
export function MissionsSide({ state }: { state: MissionsPanelState }) {
  if (state.failed) return null
  if (!state.ready) {
    return (
      <aside aria-hidden="true" className="hidden lg:block w-[268px] xl:w-[300px] shrink-0 sticky top-6 space-y-2.5">
        <div className="h-6 w-28 rounded-lg bg-ink-800/70 animate-pulse" />
        <div className="h-14 rounded-2xl bg-ink-900/60 border border-ink-800 animate-pulse" />
        <div className="h-14 rounded-2xl bg-ink-900/60 border border-ink-800 animate-pulse" />
      </aside>
    )
  }
  return (
    <aside aria-label="Misiones" className="hidden lg:block w-[268px] xl:w-[300px] shrink-0 sticky top-6 max-h-[calc(100dvh-3rem)] overflow-y-auto overscroll-contain pr-0.5 story-scroll-hide">
      <div className="flex items-center gap-2 px-1 mb-2.5">
        <TargetIcon className="w-5 h-5 text-garnet-400" />
        <h2 className="font-display text-lg font-semibold text-neutral-50">Misiones</h2>
        {state.anyClaimable && <span className="ml-auto text-[10.5px] font-semibold uppercase tracking-wide text-amber-300">¡Hay premios!</span>}
      </div>
      <Blocks s={state} />
    </aside>
  )
}

/** Pantallas más chicas: tarjeta plegable encima de la caja de publicar */
export function MissionsInline({ state }: { state: MissionsPanelState }) {
  if (state.failed || !state.ready) return null
  const open = !state.collapsed.card
  return (
    <section aria-label="Misiones" className="lg:hidden mb-4 sm:mb-5">
      <button
        type="button"
        onClick={() => state.toggle('card')}
        aria-expanded={open}
        className={`w-full flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-left transition touch-manipulation ${state.anyClaimable ? 'border-amber-400/50 bg-gradient-to-r from-amber-400/12 to-transparent' : 'border-ink-700 bg-ink-900/60'}`}
      >
        <span className="relative">
          <TargetIcon className="w-5 h-5 text-garnet-400" />
          {state.anyClaimable && <ClaimDot className="-top-1 -right-1 w-2.5 h-2.5" label="Tienes premios por reclamar" />}
        </span>
        <span className="font-display text-[15px] font-semibold text-neutral-50">Misiones</span>
        <span className="text-[12px] text-neutral-400 truncate">
          {state.anyClaimable ? <b className="text-amber-300 font-semibold">¡Tienes premios por reclamar!</b> : 'Diarias y semanales'}
        </span>
        <span className="ml-auto text-neutral-400"><Chevron open={open} /></span>
      </button>
      {open && <div className="mt-2.5"><Blocks s={state} /></div>}
    </section>
  )
}
