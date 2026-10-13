// Freno anti-spam del login (solo en el navegador).
// 4 contraseñas incorrectas seguidas → pausa de 60 segundos. Se guarda en el dispositivo, así que
// recargar la página no lo reinicia. Es una ayuda amable; la protección fuerte del servidor sigue ahí.

export const BRAKE_MAX_FAILS = 4
export const BRAKE_SECONDS = 60
const KEY = 'daiwa_login_brake'

export type BrakeState = { fails: number; lockUntil: number }

export type BrakeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const EMPTY: BrakeState = { fails: 0, lockUntil: 0 }

function defaultStorage(): BrakeStorage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

function save(state: BrakeState, storage: BrakeStorage | null) {
  try {
    if (!storage) return
    if (state.fails === 0 && state.lockUntil === 0) storage.removeItem(KEY)
    else storage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* sin almacenamiento: el freno vive solo mientras la página esté abierta */
  }
}

/** Lee el estado guardado. Si la pausa ya terminó, empieza de cero. */
export function readBrake(now: number = Date.now(), storage: BrakeStorage | null = defaultStorage()): BrakeState {
  try {
    const raw = storage?.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<BrakeState>
    const state: BrakeState = {
      fails: Number.isFinite(parsed.fails) ? Math.max(0, Math.floor(parsed.fails as number)) : 0,
      lockUntil: Number.isFinite(parsed.lockUntil) ? (parsed.lockUntil as number) : 0,
    }
    if (state.lockUntil > 0 && now >= state.lockUntil) {
      save(EMPTY, storage)
      return EMPTY
    }
    return state
  } catch {
    return EMPTY
  }
}

export function secondsLeft(state: BrakeState, now: number = Date.now()): number {
  return state.lockUntil > now ? Math.ceil((state.lockUntil - now) / 1000) : 0
}

/** Anota una contraseña incorrecta. Al llegar al máximo, empieza la pausa. */
export function registerFailure(now: number = Date.now(), storage: BrakeStorage | null = defaultStorage()): BrakeState {
  const current = readBrake(now, storage)
  const fails = current.fails + 1
  const next: BrakeState =
    fails >= BRAKE_MAX_FAILS ? { fails, lockUntil: now + BRAKE_SECONDS * 1000 } : { fails, lockUntil: 0 }
  save(next, storage)
  return next
}

export function clearBrake(storage: BrakeStorage | null = defaultStorage()): BrakeState {
  save(EMPTY, storage)
  return EMPTY
}
