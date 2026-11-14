'use client'

// v1.5.8 · Misiones en el Inicio.
// PC grande (≥ 1024 px): columna a la derecha del feed. Pantallas más chicas: una tarjeta plegable (cerrada de entrada) encima de la caja de publicar.
// Un solo hook (useMissionsPanel) pide los datos; las dos vistas solo los pintan.
// v1.10.0 · Rediseño MINIMALISTA del panel (mismas funciones, mucho menos espacio): una sola tarjeta con divisores finos; racha pequeña;
// «Por reclamar» (acceso rápido a los premios que están en secciones plegadas); Diarias abiertas en compacto y Semanales/Racha plegables,
// con barras de progreso delgadas; enlace a /misiones y el Círculo Lunar en una línea discreta al pie.
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { ECO, startPoll } from '../../lib/eco'
import { countdown, effectiveReward, refreshWallet, subscribeWallet, type DayMissions, type Mission, type StreakOverview, type WeekMissions } from '../../lib/economy'
import SupportBanner from './SupportBanner'
import { MISSIONS_CHANGED, MISSION_CLAIMED } from './MissionNotifier'
import { CheckIcon, GiftIcon, MoonCoinIcon, TargetIcon } from '../icons'
import { ClaimDot } from './ClaimDot'
import MoonRain from './MoonRain'
import Toast from './Toast'

type Collapsed = { day: boolean; week: boolean; streak: boolean; card: boolean }
// v1.10.0 · clave nueva: así todos estrenan los valores por defecto del panel compacto (la v1 guardaba «todo abierto»)
const STORE_KEY = 'daiwa_home_missions_v2'
const CACHE_KEY = 'daiwa_home_missions_cache_v1'
type Cached = { uid: string; day: DayMissions; week: WeekMissions; at: number }
let memCache: Cached | null = null
// De entrada: solo las Diarias abiertas (compactas); Semanales y Racha plegadas; la tarjeta de pantallas chicas, cerrada
const DEFAULTS: Collapsed = { day: false, week: true, streak: true, card: true }

export type MissionsPanelState = {
  ready: boolean
  failed: boolean
  day: DayMissions | null
  week: WeekMissions | null
  /** v1.8.0 · racha, escudo y bono diario (null si falta el SQL de la 1.8.0) */
  streak: StreakOverview | null
  claimStreak: (day: number) => void
  claimDaily: () => void
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
  const [streak, setStreak] = useState<StreakOverview | null>(null)
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
      const [d, w, st] = await Promise.all([supabase.rpc('missions_today'), supabase.rpc('missions_week'), supabase.rpc('streak_overview')])
      if (!st.error && st.data) setStreak(st.data as StreakOverview) // si falta el SQL de la 1.8.0 simplemente no se muestra
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
    // v1.6.3 · cada 5 min (solo si estás mirando y activo) y al volver a la pestaña
    const stopPoll = startPoll(() => load(), ECO.missionsMs)
    const clock = window.setInterval(() => tick((n) => n + 1), 60000)
    // si algo cambia el resumen del saldo (una misión se completó o se reclamó en otra pantalla), se vuelve a leer
    let lastClaimable = -1
    const unsub = subscribeWallet((w) => {
      const c = w?.claimable ?? 0
      if (lastClaimable !== -1 && c !== lastClaimable) void load()
      lastClaimable = c
    })
    window.addEventListener(MISSIONS_CHANGED, onFocus)
    return () => {
      window.removeEventListener(MISSIONS_CHANGED, onFocus)
      window.clearTimeout(first)
      stopPoll()
      window.clearInterval(clock)
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

  const claimStreak = useCallback(
    async (dayN: number) => {
      if (claimLock.current) return
      claimLock.current = true
      setBusy(true)
      const { data, error } = await supabase.rpc('streak_claim', { p_day: dayN })
      claimLock.current = false
      setBusy(false)
      if (error) {
        say(error.message, 'error')
        void load()
        return
      }
      setRain(true)
      say(`¡Premio de racha de ${dayN} días! +${(data as { reward: number }).reward} ☾`)
      void refreshWallet(true)
      void load()
    },
    [load]
  )

  const claimDaily = useCallback(async () => {
    if (claimLock.current) return
    claimLock.current = true
    setBusy(true)
    const { data, error } = await supabase.rpc('daily_login_claim')
    claimLock.current = false
    setBusy(false)
    if (error) {
      say(error.message, 'error')
      void load()
      return
    }
    setRain(true)
    say(`¡Bono de entrada! +${(data as { reward: number }).reward} ☾`)
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
      streak,
      claimStreak: (n) => void claimStreak(n),
      claimDaily: () => void claimDaily(),
      busy,
      loadedAt,
      collapsed,
      toggle,
      claim: (m) => void claim(m),
      openChest: () => void openChest(),
      dayClaimable,
      weekClaimable,
      anyClaimable: dayClaimable + weekClaimable + (streak && (!streak.daily.claimed || streak.milestones.some((m) => m.reached && !m.claimed)) ? 1 : 0) > 0,
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

/** Barra de progreso delgada y discreta */
function Bar({ pct, className = 'bg-garnet-500', label }: { pct: number; className?: string; label: string }) {
  return (
    <div className="h-1 rounded-full bg-ink-800 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={`h-full rounded-full transition-all ${className}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Avance medio de una lista de misiones (las ya reclamadas cuentan completas) */
const pctOf = (ms: Mission[]) =>
  ms.length ? Math.round((ms.reduce((a, m) => a + (m.claimed ? 1 : Math.min(1, m.progress / Math.max(1, m.target))), 0) / ms.length) * 100) : 0

const CLAIM_BTN = 'press shrink-0 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-ink-950 text-[11.5px] font-bold px-2.5 py-0.5 transition touch-manipulation'

function Row({ m, mult, busy, onClaim }: { m: Mission; mult: number; busy: boolean; onClaim: (m: Mission) => void }) {
  const pct = m.claimed ? 100 : Math.min(100, Math.round((m.progress / m.target) * 100))
  return (
    <li className="py-1.5">
      <div className="flex items-center gap-2">
        <p className={`flex-1 min-w-0 text-[12.5px] leading-snug ${m.claimed ? 'text-neutral-500' : 'text-neutral-100'}`}>{m.text}</p>
        <span className="shrink-0 inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-300 tabular-nums">
          <MoonCoinIcon className="w-3 h-3" />{effectiveReward(m, mult)}{mult !== 1 && m.period !== 'achievement' ? <span className="ml-0.5 text-[10px] opacity-70">×{mult}</span> : null}
        </span>
        {m.claimed ? (
          <CheckIcon className="w-4 h-4 shrink-0 text-emerald-400" aria-label="Reclamada" />
        ) : m.claimable ? (
          <button type="button" onClick={() => onClaim(m)} disabled={busy} className={CLAIM_BTN}>Reclamar</button>
        ) : m.go_href ? (
          <Link href={m.go_href} className="shrink-0 text-[11.5px] text-garnet-400 hover:text-garnet-300 px-1">Ir</Link>
        ) : null}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className="flex-1"><Bar pct={pct} className={m.claimed ? 'bg-emerald-500' : 'bg-garnet-500'} label="Progreso de la misión" /></div>
        <span className="text-[10.5px] text-neutral-500 tabular-nums">{m.progress}/{m.target}</span>
      </div>
    </li>
  )
}

/** Sección plegable: una línea (título · resumen · barra · flecha) y, al abrirla, el detalle */
function Section({ id, title, summary, pct, barClass, open, onToggle, dot, children }: { id: string; title: ReactNode; summary?: string; pct: number; barClass?: string; open: boolean; onToggle: () => void; dot: boolean; children: ReactNode }) {
  return (
    <section className="border-t border-ink-800 first:border-t-0">
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={id} className="w-full flex items-center gap-2 py-2.5 text-left touch-manipulation">
        <span className="relative text-[13px] font-semibold text-neutral-100">
          {title}
          {dot && <ClaimDot className="-top-0.5 -right-3 w-2 h-2" label="Tienes premios por reclamar" />}
        </span>
        {summary && <span className="text-[11px] text-neutral-500 tabular-nums">{summary}</span>}
        <span className="ml-auto w-14"><Bar pct={pct} className={barClass} label="Avance" /></span>
        <span className="text-neutral-500"><Chevron open={open} /></span>
      </button>
      {open && <div id={id} className="pb-2.5">{children}</div>}
    </section>
  )
}

/** «Se apaga en 5 h 12 min» (o «¡Entra hoy!») */
function streakLeft(st: StreakOverview, loadedAt: number): string {
  if (!st.ends_at) return ''
  return countdown(st.ends_at, st.server_now, loadedAt)
}

type Pending = { key: string; text: string; amount: number; action: string; run: () => void; icon?: string }

/** Premios listos que están en secciones plegadas: se pueden reclamar sin abrirlas */
function PendingRewards({ s }: { s: MissionsPanelState }) {
  const { day, week, streak: st } = s
  if (!day || !week) return null
  const items: Pending[] = []
  if (s.collapsed.streak && st) {
    if (!st.daily.claimed) items.push({ key: 'bono', text: 'Bono diario', amount: st.daily.amount, action: 'Reclamar', run: s.claimDaily, icon: '🎁' })
    for (const m of st.milestones) if (m.reached && !m.claimed) items.push({ key: `r${m.day}`, text: `Racha de ${m.day} días`, amount: m.amount, action: 'Reclamar', run: () => s.claimStreak(m.day), icon: '🔥' })
  }
  if (s.collapsed.day) for (const m of day.missions) if (m.claimable) items.push({ key: `d${m.id}`, text: m.text, amount: effectiveReward(m, day.multiplier), action: 'Reclamar', run: () => s.claim(m) })
  if (s.collapsed.week) {
    for (const m of week.missions) if (m.claimable) items.push({ key: `w${m.id}`, text: m.text, amount: effectiveReward(m, week.multiplier), action: 'Reclamar', run: () => s.claim(m) })
    if (week.chest_ready && !week.chest_paid) items.push({ key: 'cofre', text: 'Cofre semanal', amount: week.chest_amount, action: 'Abrir', run: s.openChest, icon: '🎁' })
  }
  if (!items.length) return null
  const shown = items.slice(0, 4)
  return (
    <section aria-label="Premios por reclamar" className="mb-1 rounded-xl bg-amber-500/8 px-2.5 py-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300/90">Por reclamar</p>
      <ul>
        {shown.map((p) => (
          <li key={p.key} className="flex items-center gap-2 py-1">
            <p className="flex-1 min-w-0 truncate text-[12.5px] text-neutral-100">{p.icon ? <span aria-hidden="true">{p.icon} </span> : null}{p.text}</p>
            <span className="shrink-0 inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-300 tabular-nums"><MoonCoinIcon className="w-3 h-3" />{p.amount}</span>
            <button type="button" onClick={p.run} disabled={s.busy} className={CLAIM_BTN}>{p.action}</button>
          </li>
        ))}
      </ul>
      {items.length > shown.length && <p className="pb-0.5 text-[10.5px] text-neutral-400">y {items.length - shown.length} más dentro de las secciones</p>}
    </section>
  )
}

/** v1.8.0 · Racha: días, cuándo se apaga, escudo, bono de entrada y premios por hito (v1.10.0: detalle dentro de una sección plegable) */
function StreakSection({ s }: { s: MissionsPanelState }) {
  const st = s.streak
  if (!st) return null
  const next = st.milestones.find((m) => !m.reached) ?? null
  const claimable = st.milestones.filter((m) => m.reached && !m.claimed)
  const alive = st.current > 0
  const prev = [...st.milestones].reverse().find((m) => m.reached)?.day ?? 0
  const pct = next ? Math.min(100, Math.round(((st.cycle_day - prev) / (next.day - prev)) * 100)) : 100
  const pending = (!st.daily.claimed ? 1 : 0) + claimable.length > 0
  return (
    <Section
      id="misiones-racha"
      title={<><span aria-hidden="true" className={alive ? '' : 'grayscale opacity-60'}>🔥</span> {alive ? `${st.current} ${st.current === 1 ? 'día' : 'días'}` : 'Racha'}</>}
      summary={alive ? (st.today_done ? 'hoy ✓' : '¡entra hoy!') : 'sin racha'}
      pct={pct}
      barClass="bg-orange-400"
      open={!s.collapsed.streak}
      onToggle={() => s.toggle('streak')}
      dot={pending && s.collapsed.streak}
    >
      <p className="text-[11.5px] leading-snug text-neutral-400">
        {alive
          ? st.today_done
            ? `Hoy ya cuenta ✓ · se apaga en ${streakLeft(st, s.loadedAt)} si no entras. Mejor racha: ${st.best}.`
            : `¡Entra hoy para mantenerla! Se apaga en ${streakLeft(st, s.loadedAt)}. Mejor racha: ${st.best}.`
          : 'Entra cada día y empieza una. Se apaga si faltas un día.'}
      </p>
      {st.saved_by_shield && <p className="mt-1.5 text-[11.5px] text-sky-300">🛡️ Tu escudo salvó tu racha: entra hoy y se mantiene.</p>}
      {next && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
            <span>Próximo premio: día {next.day}</span>
            <span className="text-amber-300 font-semibold tabular-nums">+{next.amount} ☾{st.boost_pct > 0 ? <span className="opacity-70"> (+{st.boost_pct} %)</span> : null}</span>
          </div>
          <Bar pct={pct} className="bg-orange-400" label="Avance al próximo premio de racha" />
        </div>
      )}
      <div className="mt-2 flex items-center gap-2">
        <span aria-hidden="true">🎁</span>
        <p className="flex-1 min-w-0 text-[12px] text-neutral-200 leading-tight">
          Bono de entrada <span className="text-neutral-500 whitespace-nowrap">· +{st.daily.amount} ☾</span>
          {st.daily.mult > 1 ? <span className="text-neutral-500"> · ×{st.daily.mult} por apoyar</span> : null}
        </p>
        {st.daily.claimed ? (
          <span className="text-[11.5px] text-emerald-400 font-medium">Cobrado ✓</span>
        ) : (
          <button type="button" onClick={s.claimDaily} disabled={s.busy} className={CLAIM_BTN}>Reclamar</button>
        )}
      </div>
      {claimable.length > 0 && (
        <ul className="mt-1">
          {claimable.map((m) => (
            <li key={m.day} className="flex items-center gap-2 py-1">
              <span className="text-[12px] text-neutral-100 flex-1">Racha de {m.day} días</span>
              <span className="text-[11px] text-amber-300 font-semibold tabular-nums">+{m.amount} ☾</span>
              <button type="button" onClick={() => s.claimStreak(m.day)} disabled={s.busy} className={CLAIM_BTN}>Reclamar</button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[10.5px] text-neutral-500 leading-snug">
        🛡️ Escudo de racha: {st.shield_ready ? 'listo (salva 1 día perdido si tu racha es de 3 o más)' : `recargándose (se renueva cada ${st.shield_days} días)`}.
      </p>
    </Section>
  )
}

function Blocks({ s }: { s: MissionsPanelState }) {
  const { day, week } = s
  if (!day || !week) return null
  const done = day.missions.filter((m) => m.claimed).length
  const weekDone = week.missions.filter((m) => m.claimed).length
  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900/50 px-3 py-1.5">
      <PendingRewards s={s} />
      <StreakSection s={s} />
      <Section id="misiones-diarias" title="Diarias" summary={`${done}/${day.missions.length}`} pct={pctOf(day.missions)} open={!s.collapsed.day} onToggle={() => s.toggle('day')} dot={s.dayClaimable > 0 && s.collapsed.day}>
        <ul className="divide-y divide-ink-800/70">
          {day.missions.map((m) => <Row key={m.id} m={m} mult={day.multiplier} busy={s.busy} onClaim={s.claim} />)}
        </ul>
        <p className="mt-1.5 text-[10.5px] text-neutral-500">
          Se renueva en {countdown(day.ends_at, day.server_now, s.loadedAt)} · Bono por las {day.missions.length}: <span className="whitespace-nowrap">+{day.bonus_amount} ☾{day.bonus_paid ? ' ✓' : ''}</span>
          {day.multiplier !== 1 && <span className="text-amber-300"> · ¡Lunas x{day.multiplier}!</span>}
        </p>
      </Section>
      <Section id="misiones-semanales" title="Semanales" summary={`${weekDone}/${week.missions.length}`} pct={pctOf(week.missions)} open={!s.collapsed.week} onToggle={() => s.toggle('week')} dot={s.weekClaimable > 0 && s.collapsed.week}>
        <ul className="divide-y divide-ink-800/70">
          {week.missions.map((m) => <Row key={m.id} m={m} mult={week.multiplier} busy={s.busy} onClaim={s.claim} />)}
        </ul>
        <div className="mt-1.5 flex items-center gap-2">
          <GiftIcon className="w-5 h-5 text-amber-300 shrink-0" />
          <p className="flex-1 min-w-0 text-[12px] text-neutral-200 leading-tight">
            Cofre semanal <span className="text-neutral-500"><span className="whitespace-nowrap">· +{week.chest_amount} ☾</span> al reclamar las {week.missions.length}</span>
          </p>
          {week.chest_paid ? (
            <span className="text-[11.5px] text-emerald-400 font-medium">Abierto ✓</span>
          ) : (
            <button type="button" onClick={s.openChest} disabled={s.busy || !week.chest_ready} className={`${CLAIM_BTN} disabled:opacity-40`}>Abrir</button>
          )}
        </div>
        <p className="mt-1.5 text-[10.5px] text-neutral-500">Se renuevan en {countdown(week.ends_at, week.server_now, s.loadedAt)}</p>
      </Section>
      <div className="border-t border-ink-800 flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 pb-1">
        <Link href="/misiones" className="text-[12px] text-amber-300 hover:text-amber-200 transition whitespace-nowrap">Todas las misiones →</Link>
        <SupportBanner compact className="ml-auto" />
      </div>
    </div>
  )
}

/** PC (desde 1024 px): columna al lado del feed */
export function MissionsSide({ state }: { state: MissionsPanelState }) {
  if (state.failed) return null
  if (!state.ready) {
    return (
      <aside aria-hidden="true" className="hidden lg:block w-[268px] xl:w-[300px] shrink-0 sticky top-6 space-y-2">
        <div className="h-5 w-24 rounded-lg bg-ink-800/70 animate-pulse" />
        <div className="h-40 rounded-2xl bg-ink-900/60 border border-ink-800 animate-pulse" />
      </aside>
    )
  }
  return (
    <aside aria-label="Misiones" className="hidden lg:block w-[268px] xl:w-[300px] shrink-0 sticky top-6 max-h-[calc(100dvh-3rem)] overflow-y-auto overscroll-contain pr-0.5 story-scroll-hide">
      <div className="flex items-center gap-2 px-1 mb-2">
        <TargetIcon className="w-4 h-4 text-garnet-400" />
        <h2 className="font-display text-base font-semibold text-neutral-50">Misiones</h2>
        {state.anyClaimable && <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-amber-300">¡Hay premios!</span>}
      </div>
      <Blocks s={state} />
    </aside>
  )
}

/** Pantallas más chicas: tarjeta plegable encima de la caja de publicar (cerrada = una línea con el resumen) */
export function MissionsInline({ state }: { state: MissionsPanelState }) {
  if (state.failed || !state.ready || !state.day) return null
  const open = !state.collapsed.card
  const done = state.day.missions.filter((m) => m.claimed).length
  const total = state.day.missions.length
  const alive = (state.streak?.current ?? 0) > 0
  return (
    <section aria-label="Misiones" className="lg:hidden mb-3 sm:mb-4">
      <button
        type="button"
        onClick={() => state.toggle('card')}
        aria-expanded={open}
        aria-controls="misiones-inline"
        className={`w-full flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition touch-manipulation ${state.anyClaimable ? 'border-amber-400/45 bg-amber-400/6' : 'border-ink-700 bg-ink-900/50'}`}
      >
        <span className="relative">
          <TargetIcon className="w-4 h-4 text-garnet-400" />
          {state.anyClaimable && <ClaimDot className="-top-1 -right-1 w-2 h-2" label="Tienes premios por reclamar" />}
        </span>
        <span className="font-display text-[14px] font-semibold text-neutral-50">Misiones</span>
        <span className="text-[11.5px] text-neutral-400 truncate">
          {state.anyClaimable ? <b className="text-amber-300 font-semibold">¡Premios por reclamar!</b> : `${done}/${total} diarias${alive ? ` · 🔥 ${state.streak?.current}` : ''}`}
        </span>
        <span className="ml-auto w-12 shrink-0"><Bar pct={pctOf(state.day.missions)} label="Avance de las misiones diarias" /></span>
        <span className="text-neutral-400"><Chevron open={open} /></span>
      </button>
      {open && <div id="misiones-inline" className="mt-2"><Blocks s={state} /></div>}
    </section>
  )
}
