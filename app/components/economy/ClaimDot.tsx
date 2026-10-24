'use client'

import { useEffect, useState } from 'react'
import { refreshWallet, subscribeWallet } from '../../lib/economy'

/** ¿Hay misiones (o premios) listos para reclamar? Lo lee del mismo resumen que el chip de saldo. */
export function useClaimable(userId: string | null | undefined): { count: number; dot: boolean } {
  const [count, setCount] = useState(0)
  const [founder, setFounder] = useState(false)
  useEffect(() => {
    if (!userId) return
    return subscribeWallet((w) => {
      setCount(w?.claimable ?? 0)
      setFounder(!!w?.founder_available)
    })
  }, [userId])
  return { count, dot: count > 0 || founder }
}

/** Puntito dorado que parpadea suave mientras haya algo por reclamar (se quita solo al reclamarlo todo). */
export function ClaimDot({ className = '', label = 'Tienes premios por reclamar' }: { className?: string; label?: string }) {
  return (
    <span className={`claim-dot pointer-events-none absolute ${className}`} role="img" aria-label={label}>
      <span className="absolute inset-0 rounded-full bg-amber-400/60 animate-ping motion-reduce:animate-none" />
      <span className="relative block w-full h-full rounded-full bg-amber-400 border-2 border-ink-950" />
    </span>
  )
}

/** Mantiene el resumen al día al cambiar de pantalla (para que el puntito aparezca justo al completar una misión) */
export function useWalletRefreshOnNavigate(userId: string | null | undefined, pathname: string) {
  useEffect(() => {
    if (userId) refreshWallet()
  }, [userId, pathname])
}
