'use client'

import { useCallback, useEffect, useState } from 'react'
import { BRAKE_MAX_FAILS, clearBrake, readBrake, registerFailure, secondsLeft, type BrakeState } from '../../lib/loginBrake'

/** Estado del freno anti-spam del login, con cuenta regresiva en vivo. */
export function useLoginBrake() {
  const [state, setState] = useState<BrakeState>({ fails: 0, lockUntil: 0 })
  const [now, setNow] = useState(() => Date.now())

  // Al abrir la página se recupera lo guardado (por si recargó en plena pausa)
  useEffect(() => {
    function run() {
      const t = Date.now()
      setState(readBrake(t))
      setNow(t)
    }
    run()
  }, [])

  const left = secondsLeft(state, now)
  const locked = left > 0

  // Mientras dura la pausa, el reloj avanza cada medio segundo
  useEffect(() => {
    if (state.lockUntil <= 0) return
    const timer = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= state.lockUntil) setState(readBrake(t))
    }, 500)
    return () => window.clearInterval(timer)
  }, [state.lockUntil])

  const failure = useCallback(() => {
    const t = Date.now()
    setState(registerFailure(t))
    setNow(t)
  }, [])

  const success = useCallback(() => {
    setState(clearBrake())
  }, [])

  return {
    locked,
    secondsLeft: left,
    /** Intentos que quedan antes de la pausa */
    attemptsLeft: Math.max(0, BRAKE_MAX_FAILS - state.fails),
    registerFailure: failure,
    registerSuccess: success,
  }
}
