'use client'

import Link from 'next/link'
import { useState } from 'react'
import { TIERS, paypalMeUrl, submitManualRequest, type TierKey } from '../../lib/supporters'

/**
 * v1.7.1 · Pago con PayPal.Me, en dos pasos dentro de la tarjeta del nivel:
 *  1) pagar en PayPal.Me  2) enviar el ID de transacción. Una persona del equipo lo comprueba y lo aprueba.
 */
export default function ManualSteps({ tier }: { tier: TierKey }) {
  const t = TIERS[tier]
  const [months, setMonths] = useState(1)
  const [ref, setRef] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const total = t.priceUsd * months

  const send = async () => {
    if (busy) return
    setBusy(true)
    setMsg(null)
    const err = await submitManualRequest(tier, ref.trim(), note.trim(), months)
    setBusy(false)
    if (err) setMsg({ ok: false, text: err })
    else {
      setMsg({ ok: true, text: '¡Listo! Tu solicitud quedó en revisión. Cuando se compruebe el pago se activa tu membresía.' })
      setRef('')
      setNote('')
    }
  }

  if (msg?.ok) {
    return (
      <div className="mt-3 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm">
        <p className="text-emerald-200 font-medium">{msg.text}</p>
        <Link href="/apoyar/mi-membresia" className="inline-block mt-2 text-[13px] underline underline-offset-2 text-neutral-100">Ver el estado en Mi membresía →</Link>
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-3 text-sm">
      <div>
        <p className="text-[12px] text-neutral-400 mb-1.5">¿Cuántos meses quieres pagar?</p>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 6, 12].map((m) => (
            <button key={m} type="button" onClick={() => setMonths(m)} aria-pressed={months === m}
              className={`rounded-full px-3 py-1.5 text-[12.5px] border transition ${months === m ? 'bg-white text-black border-white' : 'border-white/20 text-neutral-200 hover:bg-white/10'}`}>
              {m} {m === 1 ? 'mes' : 'meses'}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-black/25 p-3">
        <p className="text-neutral-200"><b>Paso 1.</b> Paga <b>${total} USD</b> en PayPal.Me:</p>
        <a href={paypalMeUrl(total)} target="_blank" rel="noopener noreferrer"
          className="mt-2 inline-flex rounded-full bg-[#FFC439] text-black font-semibold px-4 py-2 text-sm hover:brightness-95">
          Pagar ${total} USD ↗
        </a>
        <p className="mt-2 text-[11.5px] text-neutral-500">Paga el monto exacto. Al terminar, PayPal te muestra un <b>ID de transacción</b> (también está en tu actividad de PayPal): cópialo.</p>
      </div>

      <div className="rounded-xl bg-black/25 p-3 space-y-2">
        <p className="text-neutral-200"><b>Paso 2.</b> Pega ese ID aquí:</p>
        <input value={ref} onChange={(e) => setRef(e.target.value.replace(/[^A-Za-z0-9-]/g, '').slice(0, 40))} placeholder="ID de transacción de PayPal"
          aria-label="ID de transacción de PayPal" className="w-full rounded-xl bg-ink-900 border border-ink-600 px-3 py-2.5 text-[16px] focus:outline-none focus:border-garnet-600" />
        <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} placeholder="Nombre o correo con el que pagaste (opcional)"
          aria-label="Nombre o correo con el que pagaste" className="w-full rounded-xl bg-ink-900 border border-ink-600 px-3 py-2.5 text-[16px] focus:outline-none focus:border-garnet-600" />
        <button type="button" onClick={send} disabled={busy || ref.trim().length < 6}
          className="w-full rounded-full py-2.5 text-sm font-semibold text-black disabled:opacity-50" style={{ background: t.accent }}>
          {busy ? 'Enviando…' : 'Enviar para revisión'}
        </button>
        {msg && !msg.ok && <p className="text-xs text-garnet-400">{msg.text}</p>}
      </div>
    </div>
  )
}
