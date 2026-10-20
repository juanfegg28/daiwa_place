'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { MoonCoinIcon } from '../icons'
import { formatLunas, refreshWallet } from '../../lib/economy'
import MoonRain from './MoonRain'

type Mine = { description: string; lunas: number; redeemed_at: string }

const ERRORS: Record<string, string> = {
  invalid: 'Ese código no es válido o ya venció.',
  already: 'Ya canjeaste este código.',
  too_new: 'Tu cuenta es muy nueva para este código.',
  frozen: 'Tu cuenta está congelada.',
  auth: 'Inicia sesión para canjear códigos.',
}

export default function CodeRedeemCard({ initialCode = '' }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [rain, setRain] = useState(false)
  const [mine, setMine] = useState<Mine[]>([])

  const loadMine = useCallback(async () => {
    const { data } = await supabase.rpc('code_my_redemptions', { p_limit: 20 })
    setMine((data as Mine[]) ?? [])
  }, [])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMine()
  }, [loadMine])

  async function redeem() {
    if (busy || !code.trim()) return
    setBusy(true)
    setMsg(null)
    const { data, error } = await supabase.rpc('code_redeem', { p_code: code })
    setBusy(false)
    if (error || !data) {
      setMsg({ ok: false, text: 'No se pudo canjear. Intenta de nuevo en un momento.' })
      return
    }
    const r = data as { ok: boolean; error?: string; lunas?: number; minutes?: number }
    if (r.ok) {
      setMsg({ ok: true, text: `¡Código canjeado! +${formatLunas(r.lunas ?? 0)}` })
      setCode('')
      setRain(true)
      refreshWallet(true)
      loadMine()
    } else if (r.error === 'rate') {
      setMsg({ ok: false, text: `Demasiados intentos. Prueba de nuevo en ${r.minutes ?? 1} minuto${(r.minutes ?? 1) === 1 ? '' : 's'}.` })
    } else {
      setMsg({ ok: false, text: ERRORS[r.error ?? 'invalid'] ?? ERRORS.invalid })
    }
  }

  return (
    <div className="space-y-6">
      <MoonRain show={rain} onDone={() => setRain(false)} />
      <div className="rounded-2xl border border-ink-700 bg-ink-900/60 p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <MoonCoinIcon className="w-10 h-10" />
          <div>
            <h2 className="font-display text-lg font-semibold text-neutral-50 leading-tight">Canjear código</h2>
            <p className="text-xs text-neutral-500">Los códigos los da el equipo en eventos y anuncios.</p>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            redeem()
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={48}
            aria-label="Código"
            placeholder="XXXX-XXXX-XXXX"
            className="flex-1 min-w-0 rounded-xl bg-ink-950 border border-ink-700 px-4 py-3 text-lg font-mono tracking-wider text-neutral-50 placeholder:text-neutral-700 outline-none focus:border-garnet-500"
          />
          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="press rounded-xl bg-garnet-600 hover:bg-garnet-500 disabled:opacity-50 text-white font-semibold px-6 py-3 transition"
          >
            {busy ? 'Canjeando…' : 'Canjear'}
          </button>
        </form>
        {msg && (
          <p role="status" className={`mt-3 text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
            {msg.text}
          </p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-neutral-300 mb-2">Mis códigos canjeados</h3>
        {mine.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no has canjeado ninguno.</p>
        ) : (
          <ul className="divide-y divide-ink-800 rounded-xl border border-ink-800 overflow-hidden">
            {mine.map((m, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 bg-ink-900/40">
                <div className="min-w-0">
                  <p className="text-sm text-neutral-100 truncate">{m.description}</p>
                  <p className="text-xs text-neutral-500">{new Date(m.redeemed_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <span className="text-sm font-semibold text-amber-300 tabular-nums">+{formatLunas(m.lunas)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
