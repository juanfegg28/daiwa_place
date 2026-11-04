'use client'

// v1.6.3 · «Súper ahorro» — todo lo que decide CUÁNTO le pide la página a Supabase vive aquí.
// Objetivo: que DaiwaPlace quepa en el plan Nano (poco CPU, poca RAM y 5 MB/s de disco).
// Reglas:
//   1) Solo se consulta si la pestaña está VISIBLE y la persona está ACTIVA (movió el mouse, tocó, escribió o hizo scroll hace < 2 min).
//   2) Todo lo que antes se revisaba cada 15–60 s ahora se revisa cada varios minutos; lo urgente llega por Realtime (filtrado).
//   3) Al volver a la pestaña se actualiza UNA vez (con un pequeño desfase al azar para que no salgan 10 pedidos juntos).
// Para ajustar el ahorro, cambia SOLO los números de ECO.

export const ECO = {
  /** si no hay actividad en este tiempo, se pausan los pedidos periódicos */
  idleAfterMs: 120_000,
  /** mínimo entre dos actualizaciones «al volver a la pestaña» */
  wakeGapMs: 30_000,
  notifRecountMs: 300_000, // contador de avisos (respaldo; lo normal llega por Realtime)
  dmRecountMs: 180_000, // contador de mensajes (respaldo)
  feedCheckMs: 180_000, // «hay publicaciones nuevas»
  storiesMs: 180_000, // bandeja de historias
  walletMs: 300_000, // saldo de Lunas
  walletCacheMs: 60_000, // el saldo no se vuelve a pedir al cambiar de página si es más nuevo que esto
  missionsMs: 300_000, // panel de misiones
  chatFallbackMs: 60_000, // chat abierto, solo si Realtime se cayó
  whisperThreadMs: 90_000, // una confesión abierta
  viewersMs: 20_000, // lista de quién vio mi historia
  noveltyWhisperMs: 600_000, // brillito «nueva confesión»
  noveltyShopMs: 900_000, // brillito «novedad» de la tienda
  notesMs: 300_000, // notas de Mensajes
  shopCacheMs: 180_000, // catálogo y colecciones de la tienda
  /** cuánto debe esperar el aviso de «misión completada» entre dos lecturas del saldo */
  actionRefreshMs: 6_000,
} as const

// ───────── actividad de la persona ─────────
let lastActivity = Date.now()
let wasIdle = false
let started = false
const WAKE = 'daiwa:wake'

function idleNow(): boolean {
  return Date.now() - lastActivity > ECO.idleAfterMs
}

/** ¿La pestaña se está viendo y la persona está activa? */
export function isActive(): boolean {
  if (typeof document === 'undefined') return false
  return document.visibilityState === 'visible' && !idleNow()
}

function ensureStarted() {
  if (started || typeof window === 'undefined') return
  started = true
  const touch = () => {
    const was = idleNow()
    lastActivity = Date.now()
    if (was || wasIdle) {
      wasIdle = false
      window.dispatchEvent(new Event(WAKE))
    }
  }
  // un solo temporizador barato: marca que ya pasó a «inactivo» para poder avisar cuando vuelva
  window.setInterval(() => {
    if (idleNow()) wasIdle = true
  }, 15_000)
  const opts = { passive: true } as AddEventListenerOptions
  let lastMove = 0
  window.addEventListener('pointerdown', touch, opts)
  window.addEventListener('keydown', touch, opts)
  window.addEventListener('touchstart', touch, opts)
  window.addEventListener('scroll', touch, { passive: true, capture: true })
  window.addEventListener(
    'pointermove',
    () => {
      const n = Date.now()
      if (n - lastMove > 5_000) {
        lastMove = n
        touch()
      }
    },
    opts
  )
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      lastActivity = Date.now()
      window.dispatchEvent(new Event(WAKE))
    }
  })
  window.addEventListener('focus', () => {
    lastActivity = Date.now()
    window.dispatchEvent(new Event(WAKE))
  })
}

/**
 * Reemplazo de `window.addEventListener('focus', fn)`: llama a `fn` al volver a la pestaña o a la actividad,
 * como mucho una vez cada `gap` ms y con un desfase al azar (0–1,2 s). Devuelve la función para cancelar.
 */
export function onWake(fn: () => void, gap: number = ECO.wakeGapMs): () => void {
  if (typeof window === 'undefined') return () => {}
  ensureStarted()
  let last = Date.now()
  let t: number | undefined
  const handler = () => {
    if (Date.now() - last < gap) return
    window.clearTimeout(t)
    t = window.setTimeout(() => {
      if (document.visibilityState !== 'visible') return
      last = Date.now()
      fn()
    }, Math.random() * 1200)
  }
  window.addEventListener(WAKE, handler)
  return () => {
    window.clearTimeout(t)
    window.removeEventListener(WAKE, handler)
  }
}

/**
 * Pedido periódico «inteligente»: corre cada `ms` (con ±10 % al azar) SOLO si la pestaña se ve y la persona está activa,
 * y además una vez al volver a la pestaña. `skip()` (opcional) permite saltarse los turnos del temporizador
 * (por ejemplo, cuando Realtime está conectado); al volver a la pestaña igual se actualiza.
 */
export function startPoll(fn: () => unknown, ms: number, skip?: () => boolean): () => void {
  if (typeof window === 'undefined') return () => {}
  ensureStarted()
  let stopped = false
  let timer: number | undefined
  const run = () => {
    void fn()
  }
  const schedule = () => {
    timer = window.setTimeout(() => {
      if (stopped) return
      if (isActive() && !(skip && skip())) run()
      schedule()
    }, ms * (0.9 + Math.random() * 0.2))
  }
  schedule()
  const offWake = onWake(run, Math.min(ms, ECO.wakeGapMs))
  return () => {
    stopped = true
    window.clearTimeout(timer)
    offWake()
  }
}
