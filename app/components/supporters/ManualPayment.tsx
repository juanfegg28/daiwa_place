'use client'

import { useState } from 'react'
import { TIERS, TIER_KEYS, paypalMeUrl, submitManualRequest, type TierKey } from '../../lib/supporters'

/**
 * Alternativa MANUAL con PayPal.Me. No activa nada por sí sola: la persona avisa con el ID de transacción
 * y una persona del equipo lo comprueba en PayPal antes de aprobar (30 días por cada pago aprobado).
 */
export default function ManualPayment({ signedIn }: { signedIn: boolean }) {
  const [tier, setTier] = useState<TierKey>('llena')
  const [ref, setRef] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const send = async () => {
    if (busy) return
    setBusy(true)
    setMsg(null)
    const err = await submitManualRequest(tier, ref.trim(), note.trim())
    setBusy(false)
    if (err) setMsg({ ok: false, text: err })
    else {
      setMsg({ ok: true, text: '¡Listo! Tu solicitud quedó en revisión. Cuando se compruebe el pago, tu membresía se activará (lo verás en «Mi membresía»).' })
      setRef('')
      setNote('')
    }
  }

  return (
    <details className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 group">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-sm font-semibold text-neutral-100">
        <span>¿Prefieres pagar manualmente con PayPal.Me?</span>
        <span className="text-neutral-500 group-open:rotate-180 transition">⌄</span>
      </summary>
      <div className="mt-3 space-y-3 text-sm text-neutral-300">
        <p className="leading-relaxed">
          Es un pago único de 30 días (no se renueva solo) y <b className="text-neutral-50">lo aprueba una persona del equipo</b> después de comprobarlo en PayPal,
          así que puede tardar. Si puedes, la suscripción automática es más rápida y cómoda.
        </p>
        <ol className="list-decimal pl-5 space-y-1 text-neutral-400">
          <li>Elige el nivel y paga con PayPal.Me.</li>
          <li>En PayPal, copia el <b className="text-neutral-200">ID de transacción</b> del pago.</li>
          <li>Pégalo aquí abajo y envía la solicitud.</li>
        </ol>
        <div className="flex flex-wrap gap-2">
          {TIER_KEYS.map((k) => (
            <button key={k} type="button" onClick={() => setTier(k)} aria-pressed={tier === k}
              className={`rounded-full px-3.5 py-2 text-[13px] border transition ${tier === k ? 'bg-white text-black border-white' : 'border-white/15 text-neutral-200 hover:bg-white/10'}`}>
              {TIERS[k].name} · ${TIERS[k].priceUsd}
            </button>
          ))}
        </div>
        <a href={paypalMeUrl(TIERS[tier].priceUsd)} target="_blank" rel="noopener noreferrer"
          className="inline-flex rounded-full bg-[#FFC439] text-black font-semibold px-4 py-2 text-sm hover:brightness-95">
          Pagar ${TIERS[tier].priceUsd} USD en PayPal.Me ↗
        </a>
        {signedIn ? (
          <div className="space-y-2 pt-1">
            <input value={ref} onChange={(e) => setRef(e.target.value.replace(/[^A-Za-z0-9-]/g, '').slice(0, 40))} placeholder="ID de transacción de PayPal"
              aria-label="ID de transacción de PayPal" className="w-full rounded-xl bg-ink-900 border border-ink-600 px-3 py-2.5 text-[16px] focus:outline-none focus:border-garnet-600" />
            <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} placeholder="Nota (opcional): nombre con el que pagaste"
              aria-label="Nota opcional" className="w-full rounded-xl bg-ink-900 border border-ink-600 px-3 py-2.5 text-[16px] focus:outline-none focus:border-garnet-600" />
            <button type="button" onClick={send} disabled={busy || ref.trim().length < 6}
              className="rounded-full bg-garnet-600 hover:bg-garnet-500 text-white px-5 py-2.5 text-sm font-medium disabled:opacity-50">
              {busy ? 'Enviando…' : 'Enviar solicitud'}
            </button>
            {msg && <p className={`text-xs ${msg.ok ? 'text-emerald-300' : 'text-garnet-400'}`}>{msg.text}</p>}
          </div>
        ) : (
          <p className="text-xs text-neutral-500">Inicia sesión para enviar tu solicitud.</p>
        )}
      </div>
    </details>
  )
}
