'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { MoonCoinIcon } from './icons'
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
    const iv = setInterval(() => document.visibilityState === 'visible' && refreshWallet(true), 120000)
    return () => {
      unsub()
      window.removeEventListener('focus', onFocus)
      clearInterval(iv)
    }
  }, [userId])

  if (!userId || !w) return null
  const dot = w.claimable > 0 || w.founder_available
  return (
    <Link
      href="/tienda"
      aria-label={`${formatNumber(w.balance)} ${w.currency}${dot ? ' · tienes cosas por reclamar' : ''}`}
      className={`press relative inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 transition ${
        compact ? 'px-2.5 py-1.5 text-[13px]' : 'px-3 py-2 text-sm w-full justify-center'
      }`}
    >
      <MoonCoinIcon className="w-[18px] h-[18px]" />
      <span className={`font-semibold tabular-nums ${bump ? 'bal-bump' : ''}`}>{formatNumber(w.balance)}</span>
      {!compact && <span className="text-amber-200/70 text-xs">{w.currency}</span>}
      {dot && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-garnet-500 border-2 border-ink-900" />}
    </Link>
  )
}
