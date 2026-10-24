'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell, { useAppSession } from '../components/AppShell'
import { MoonCoinIcon } from '../components/icons'
import { supabase } from '../lib/supabaseClient'
import { REASON_LABELS, formatLunas, refreshWallet, subscribeWallet, type LedgerRow, type WalletSummary } from '../lib/economy'
import MoonRain from '../components/economy/MoonRain'
import Toast from '../components/economy/Toast'

export default function MonedasPage() {
  return (
    <AppShell>
      <MonedasContent />
    </AppShell>
  )
}

function MonedasContent() {
  const { userId, loading } = useAppSession()
  const router = useRouter()
  const [w, setW] = useState<WalletSummary | null>(null)
  const [rows, setRows] = useState<LedgerRow[]>([])
  const [more, setMore] = useState(false)
  const [busy, setBusy] = useState(false)
  const [rain, setRain] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [founder, setFounder] = useState<{ eligible: boolean; claimed: boolean; coins: number; coins_claimed?: boolean; items_claimed?: boolean } | null>(null)

  const load = useCallback(async (before?: string) => {
    const { data } = await supabase.rpc('coins_history', { p_limit: 30, p_before: before ?? null })
    const list = (data as LedgerRow[]) ?? []
    setRows((prev) => (before ? [...prev, ...list] : list))
    setMore(list.length === 30)
  }, [])

  useEffect(() => {
    if (!loading && !userId) router.replace('/login')
  }, [loading, userId, router])

  useEffect(() => {
    if (!userId) return
    const unsub = subscribeWallet(setW)
    refreshWallet(true)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
    supabase.rpc('founder_status').then(({ data }) => setFounder(data as typeof founder))
    return unsub
  }, [userId, load])

  async function claimFounder() {
    setBusy(true)
    const { error } = await supabase.rpc('founder_claim')
    setBusy(false)
    if (error) return setToast(error.message)
    setRain(true)
    setFounder((f) => (f ? { ...f, claimed: true } : f))
    refreshWallet(true)
    load()
  }

  if (loading || !userId) return null
  const cur = w?.currency ?? 'Lunas'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <MoonRain show={rain} onDone={() => setRain(false)} />
      <Toast message={toast} onClose={() => setToast(null)} tone="error" />

      <div className="rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-ink-900 to-ink-950 p-6 text-center mb-5">
        <MoonCoinIcon className="w-12 h-12 mx-auto mb-2" />
        <p className="text-xs uppercase tracking-[0.18em] text-amber-300/80">Tu saldo</p>
        <p className="font-display text-4xl font-semibold text-neutral-50 tabular-nums mt-1">{formatLunas(w?.balance ?? 0)}</p>
        <p className="text-xs text-neutral-500 mt-2">Las {cur} no se pueden comprar ni regalar. Se ganan con misiones.</p>
        <div className="mt-4 flex justify-center gap-2 flex-wrap">
          <Link href="/misiones" className="press rounded-full bg-garnet-600 hover:bg-garnet-500 text-white text-sm font-semibold px-5 py-2 transition">Ir a misiones</Link>
          <Link href="/tienda/canjear" className="press rounded-full border border-ink-600 text-neutral-200 text-sm px-5 py-2 hover:bg-ink-800 transition">Canjear código</Link>
        </div>
      </div>

      {founder?.eligible && (
        <div className="rounded-2xl border border-garnet-500/30 bg-garnet-600/10 p-4 mb-5 flex items-center gap-4">
          <div className="flex-1">
            <p className="font-display font-semibold text-neutral-50">Pack Fundador</p>
            <p className="text-sm text-neutral-400">Para las cuentas de la beta, por estar desde el principio. {founder.coins_claimed ? 'Ya cobraste tus Lunas; te falta reclamar tus cosméticos exclusivos: ' : `+${formatLunas(founder.coins)} y `}Marco Fundador, insignia, título «Fundador de Daiwa» y el efecto Oro foil en paleta Fundador.</p>
          </div>
          {founder.claimed ? (
            <span className="text-sm text-emerald-400 font-medium">Reclamado ✓</span>
          ) : (
            <button onClick={claimFounder} disabled={busy} className="press rounded-full bg-garnet-600 hover:bg-garnet-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 transition">
              Reclamar
            </button>
          )}
        </div>
      )}

      <h2 className="text-sm font-semibold text-neutral-300 mb-2">Historial</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">Todavía no hay movimientos.</p>
      ) : (
        <ul className="divide-y divide-ink-800 rounded-xl border border-ink-800 overflow-hidden">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-ink-900/40">
              <div className="min-w-0">
                <p className="text-sm text-neutral-100 truncate">
                  {REASON_LABELS[r.reason] ?? r.reason}
                  {r.reason === 'admin_adjust' && r.ref_id ? <span className="text-neutral-500"> · {r.ref_id}</span> : null}
                </p>
                <p className="text-xs text-neutral-500">{new Date(r.created_at).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-semibold tabular-nums ${r.delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{r.delta > 0 ? '+' : '−'}{formatLunas(Math.abs(r.delta))}</p>
                <p className="text-[11px] text-neutral-600 tabular-nums">saldo {formatLunas(r.balance_after)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {more && (
        <button onClick={() => load(rows[rows.length - 1]?.created_at)} className="mt-3 w-full text-sm text-neutral-400 hover:text-neutral-100 py-2">
          Ver más
        </button>
      )}
    </div>
  )
}
