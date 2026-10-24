'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { MoonCoinIcon } from './icons'
import { ClaimDot } from './economy/ClaimDot'
import { formatNumber, refreshWallet, subscribeWallet, type WalletSummary } from '../lib/economy'

/** Chip de saldo (☾ 1 250). Lleva a la tienda; con puntito si hay misiones por reclamar. */
export default function WalletChip({ userId, compact = false }: { userId: string | null; compact?: boolean }) {
  const [w, setW] = useState<WalletSummary | null>(null)
  const [bump, setBump] = useState(false)
  const last = useRef<number | null>(null)

  useEffect(() => {
    if (!userId) return
    const unsub = subscribeWallet((val) => {
      setW(val)
      if (val && last.current !== null && val.balance !== last.current) {
        setBump(true)
        setTimeout(() => setBump(false), 700)
      }
      if (val) last.current = val.balance
    })
    refreshWallet()
    const onFocus = () => refreshWallet()
    window.addEventListener('focus', onFocus)
    const iv = setInterval(() => document.visibilityState === 'visible' && refreshWallet(true), 60000)
    return () => {
      unsub()
      window.removeEventListener('focus', onFocus)
      clearInterval(iv)
    }
  }, [userId])

  if (!userId || !w) return null
  const dot = w.claimable > 0 || w.founder_available
  const label = `${formatNumber(w.balance)} ${w.currency}${dot ? ' · tienes cosas por reclamar' : ''}`
  if (compact) {
    // Celular (barra de arriba): píldora dorada con brillo, bien visible
    return (
      <Link
        href="/monedas"
        aria-label={`Mi saldo: ${label}`}
        className="press relative inline-flex items-center gap-1.5 rounded-full border border-amber-400/70 bg-gradient-to-b from-amber-400/25 to-amber-600/15 text-amber-100 px-3 py-1.5 text-[14px] shadow-[0_0_14px_-2px] shadow-amber-400/50 hover:from-amber-400/35 transition"
      >
        <MoonCoinIcon className="w-5 h-5" />
        <span className={`font-bold tabular-nums ${bump ? 'bal-bump' : ''}`}>{formatNumber(w.balance)}</span>
        {dot && <ClaimDot className="-top-1 -right-1 w-3 h-3" label="Tienes cosas por reclamar" />}
      </Link>
    )
  }
  // Menú de escritorio: tarjeta con el saldo grande y el rótulo «Mi saldo»
  return (
    <Link
      href="/monedas"
      aria-label={`Mi saldo: ${label}`}
      className="press group relative block w-full rounded-2xl border border-amber-400/60 bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-transparent px-4 py-3 shadow-[0_0_22px_-6px] shadow-amber-400/50 hover:border-amber-300 hover:from-amber-400/30 transition"
    >
      <span className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">
        Mi saldo
        <span className="normal-case tracking-normal text-amber-200/80 group-hover:text-amber-100 transition">Ver →</span>
      </span>
      <span className="mt-0.5 flex items-center gap-2">
        <MoonCoinIcon className="w-7 h-7 text-amber-300" />
        <span className={`font-display text-[26px] leading-none font-bold text-amber-100 tabular-nums ${bump ? 'bal-bump' : ''}`}>{formatNumber(w.balance)}</span>
        <span className="text-xs text-amber-200/70 self-end pb-0.5">{w.currency}</span>
      </span>
      {dot && (
        <span className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-200">
          <span className="relative inline-block w-2.5 h-2.5">
            <ClaimDot className="inset-0 w-2.5 h-2.5" label="Tienes cosas por reclamar" />
          </span>
          Tienes premios por reclamar
        </span>
      )}
    </Link>
  )
}
