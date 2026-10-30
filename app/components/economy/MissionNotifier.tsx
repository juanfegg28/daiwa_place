'use client'

// v1.5.9 · Aviso INSTANTÁNEO de misión completada.
// Cada vez que haces algo que puede sumar a una misión (la base avisa con el evento «daiwa:action»), se vuelve a leer el resumen
// del saldo; si hay una misión nueva lista, sale este aviso en cualquier pantalla, con botón para reclamarla ahí mismo.
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { effectiveReward, refreshWallet, subscribeWallet, type DayMissions, type Mission, type WeekMissions } from '../../lib/economy'
import { CloseIcon, MoonCoinIcon } from '../icons'

type Notice = { id: string; text: string; reward: number; more: number; state: 'ready' | 'claiming' | 'done' | 'error'; msg?: string }

export const MISSIONS_CHANGED = 'daiwa:missions-changed'
/** v1.5.10 · se emite cuando una misión se reclama desde el panel del Inicio o desde /misiones */
export const MISSION_CLAIMED = 'daiwa:mission-claimed'

export default function MissionNotifier({ userId }: { userId: string | null | undefined }) {
  const [notice, setNotice] = useState<Notice | null>(null)
  const baseline = useRef<number | null>(null)
  const notified = useRef(new Set<string>())
  const claiming = useRef(false)
  const hideTimer = useRef<number | undefined>(undefined)
  const checkTimer = useRef<number | undefined>(undefined)
  const lastCheck = useRef(0)

  const autoHide = useCallback((ms: number) => {
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setNotice(null), ms)
  }, [])

  // ¿qué misión se acaba de completar? (para poner su nombre en el aviso)
  const announce = useCallback(async () => {
    const [d, w] = await Promise.all([supabase.rpc('missions_today'), supabase.rpc('missions_week')])
    const day = d.data as DayMissions | null
    const week = w.data as WeekMissions | null
    const fresh: { m: Mission; mult: number }[] = []
    for (const m of day?.missions ?? []) if (m.claimable && !notified.current.has(m.id)) fresh.push({ m, mult: day?.multiplier ?? 1 })
    for (const m of week?.missions ?? []) if (m.claimable && !notified.current.has(m.id)) fresh.push({ m, mult: week?.multiplier ?? 1 })
    window.dispatchEvent(new Event(MISSIONS_CHANGED))
    const first = fresh[0]
    fresh.forEach((f) => notified.current.add(f.m.id))
    setNotice(
      first
        ? { id: first.m.id, text: first.m.text, reward: effectiveReward(first.m, first.mult), more: fresh.length - 1, state: 'ready' }
        : { id: '', text: 'Tienes un premio listo para reclamar', reward: 0, more: 0, state: 'ready' }
    )
    autoHide(9000)
  }, [autoHide])

  // si el resumen del saldo dice que hay MÁS misiones listas que antes, se avisa
  useEffect(() => {
    if (!userId) return
    baseline.current = null
    return subscribeWallet((wl) => {
      if (!wl) return
      const prev = baseline.current
      baseline.current = wl.claimable
      if (prev !== null && wl.claimable > prev) void announce()
    })
  }, [userId, announce])

  // v1.5.10 · si la misión se reclama desde el panel o la página de Misiones, este aviso sobra (antes salían los dos a la vez)
  useEffect(() => {
    const onClaimed = () => {
      window.clearTimeout(hideTimer.current)
      setNotice(null)
    }
    window.addEventListener(MISSION_CLAIMED, onClaimed)
    return () => window.removeEventListener(MISSION_CLAIMED, onClaimed)
  }, [])

  // al hacer algo: se vuelve a leer el resumen (con un pequeño margen para juntar varias acciones seguidas)
  useEffect(() => {
    if (!userId) return
    const run = () => {
      const wait = Math.max(500, 2500 - (Date.now() - lastCheck.current))
      window.clearTimeout(checkTimer.current)
      checkTimer.current = window.setTimeout(() => {
        lastCheck.current = Date.now()
        void refreshWallet(true)
      }, wait)
    }
    window.addEventListener('daiwa:action', run)
    return () => {
      window.removeEventListener('daiwa:action', run)
      window.clearTimeout(checkTimer.current)
      window.clearTimeout(hideTimer.current)
    }
  }, [userId])

  const claim = async () => {
    if (!notice || !notice.id || claiming.current) return
    claiming.current = true
    window.clearTimeout(hideTimer.current)
    setNotice({ ...notice, state: 'claiming' })
    const { data, error } = await supabase.rpc('mission_claim', { p_id: notice.id })
    claiming.current = false
    if (error) {
      setNotice({ ...notice, state: 'error', msg: error.message })
      autoHide(5000)
      void refreshWallet(true)
      window.dispatchEvent(new Event(MISSIONS_CHANGED))
      return
    }
    const r = data as { reward: number; bonus: number }
    setNotice({ ...notice, state: 'done', msg: r.bonus > 0 ? `¡+${r.reward} ☾ y bono de +${r.bonus} ☾ por las 3 del día!` : `¡Reclamada! +${r.reward} ☾` })
    autoHide(3500)
    void refreshWallet(true)
    window.dispatchEvent(new Event(MISSIONS_CHANGED))
  }

  if (!userId || !notice) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed z-[130] inset-x-0 mx-auto w-[min(92vw,380px)] rounded-2xl border border-amber-400/50 bg-ink-900 shadow-2xl shadow-black/60 p-3.5 mission-notice-in"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      onMouseEnter={() => window.clearTimeout(hideTimer.current)}
      onMouseLeave={() => notice.state === 'ready' && autoHide(5000)}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none mt-0.5" aria-hidden="true">🎯</span>
        <div className="min-w-0 flex-1">
          {notice.state === 'done' || notice.state === 'error' ? (
            <p className={`text-[14px] font-semibold ${notice.state === 'done' ? 'text-amber-200' : 'text-red-300'}`}>{notice.msg}</p>
          ) : (
            <>
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-300">¡Misión completada!</p>
              <p className="text-[14px] text-neutral-50 leading-snug mt-0.5">{notice.text}</p>
              {notice.more > 0 && <p className="text-[11.5px] text-neutral-400 mt-0.5">y {notice.more} más por reclamar</p>}
            </>
          )}
        </div>
        <button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso" className="shrink-0 -mr-1 -mt-1 w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-white hover:bg-ink-800">
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
      {(notice.state === 'ready' || notice.state === 'claiming') && (
        <div className="mt-3 flex items-center gap-2">
          {notice.id ? (
            <button type="button" onClick={claim} disabled={notice.state === 'claiming'} className="press flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-ink-950 text-[13px] font-bold py-2 transition touch-manipulation">
              {notice.state === 'claiming' ? 'Reclamando…' : <>Reclamar <MoonCoinIcon className="w-3.5 h-3.5" />+{notice.reward}</>}
            </button>
          ) : null}
          <Link href="/misiones" onClick={() => setNotice(null)} className="rounded-full border border-ink-600 text-neutral-200 text-[13px] px-4 py-2 hover:bg-ink-800 transition">Ver misiones</Link>
        </div>
      )}
    </div>
  )
}
