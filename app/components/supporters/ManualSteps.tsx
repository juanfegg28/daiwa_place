'use client'

import Link from 'next/link'
import { useState } from 'react'
import { KOFI_URL, PAY_METHOD_LABEL, TIERS, paypalMeUrl, submitManualRequest, type PayMethod, type TierKey } from '../../lib/supporters'
import { clearKofiCode, loadKofiCode } from '../../lib/kofiCode'

const INPUT = 'w-full rounded-xl bg-ink-900 border border-ink-600 px-3 py-2.5 text-[16px] focus:outline-none focus:border-garnet-600'

/**
 * Apoyo manual, en pasos dentro de la tarjeta del nivel. Dos métodos (los dos los comprueba una persona del equipo):
 *  · PayPal.Me: 1) pagar  2) pegar el ID de transacción.
 *  · Ko-fi:     1) copiar tu código  2) dar la propina con el código en el mensaje  3) avisar.
 * v1.7.2: se añadió Ko-fi. En PayPal.Me no cambió nada.
 */
export default function ManualSteps({ tier, userId }: { tier: TierKey; userId: string }) {
  const t = TIERS[tier]
  const [method, setMethod] = useState<PayMethod>('paypalme')
  const [months, setMonths] = useState(1)
  const [ref, setRef] = useState('') // ID de transacción de PayPal
  const [note, setNote] = useState('')
  // Ko-fi: el código se genera una vez (y se recuerda en este dispositivo hasta enviar la solicitud)
  const [code, setCode] = useState(() => loadKofiCode(userId))
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const total = t.priceUsd * months
  const isKofi = method === 'kofi'
  const canSend = isKofi ? code.length > 0 : ref.trim().length >= 6

  const pick = (m: PayMethod) => {
    setMethod(m)
    setMsg(null)
    setNote('')
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* sin portapapeles: la persona lo copia a mano (el código se puede seleccionar) */
    }
  }

  const send = async () => {
    if (busy || !canSend) return
    setBusy(true)
    setMsg(null)
    const err = await submitManualRequest(tier, isKofi ? code : ref.trim(), note.trim(), months, method)
    setBusy(false)
    if (err) {
      // Si el código ya se usó o no sirve, se genera otro para que la persona no se quede trabada.
      if (isKofi && /ya fue enviado|código de Ko-fi no es válido/i.test(err)) {
        clearKofiCode()
        setCode(loadKofiCode(userId))
        setMsg({ ok: false, text: 'Ese código ya no sirve. Generamos uno nuevo: úsalo en tu próxima propina.' })
      } else setMsg({ ok: false, text: err })
    } else {
      if (isKofi) clearKofiCode()
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
        <p className="text-[12px] text-neutral-400 mb-1.5">¿Cómo quieres pagar?</p>
        <div className="flex gap-1.5">
          {(['paypalme', 'kofi'] as const).map((m) => (
            <button key={m} type="button" onClick={() => pick(m)} aria-pressed={method === m}
              className={`flex-1 rounded-full px-3 py-1.5 text-[12.5px] border transition ${method === m ? 'bg-white text-black border-white' : 'border-white/20 text-neutral-200 hover:bg-white/10'}`}>
              {PAY_METHOD_LABEL[m]}
            </button>
          ))}
        </div>
      </div>

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

      {!isKofi ? (
        <>
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
              aria-label="ID de transacción de PayPal" className={INPUT} />
            <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} placeholder="Nombre o correo con el que pagaste (opcional)"
              aria-label="Nombre o correo con el que pagaste" className={INPUT} />
            <button type="button" onClick={send} disabled={busy || !canSend}
              className="w-full rounded-full py-2.5 text-sm font-semibold text-black disabled:opacity-50" style={{ background: t.accent }}>
              {busy ? 'Enviando…' : 'Enviar para revisión'}
            </button>
            {msg && !msg.ok && <p className="text-xs text-garnet-400">{msg.text}</p>}
          </div>
        </>
      ) : (
        <>
          <div className="rounded-xl bg-black/25 p-3">
            <p className="text-neutral-200"><b>Paso 1.</b> Este es <b>tu código</b>. Cópialo: lo vas a pegar en el mensaje de la propina.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-ink-900/70 border border-white/10 px-3 py-1.5 font-mono text-[14px] tracking-wide text-neutral-50 select-all">{code}</span>
              <button type="button" onClick={copyCode} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-neutral-200 hover:bg-white/10">
                {copied ? '¡Copiado!' : 'Copiar código'}
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-black/25 p-3">
            <p className="text-neutral-200"><b>Paso 2.</b> Da una propina de <b>${total} USD</b> en Ko-fi:</p>
            <a href={KOFI_URL} target="_blank" rel="noopener noreferrer"
              className="mt-2 inline-flex rounded-full bg-[#FF5E5B] text-white font-semibold px-4 py-2 text-sm hover:brightness-95">
              Dar propina en Ko-fi ↗
            </a>
            <p className="mt-2 text-[11.5px] text-neutral-500">
              Escribe el monto exacto (<b>${total} USD</b>) y <b>pega tu código en el mensaje</b>; puede ser un mensaje privado. Sin el código no podemos encontrar tu pago.
            </p>
          </div>

          <div className="rounded-xl bg-black/25 p-3 space-y-2">
            <p className="text-neutral-200"><b>Paso 3.</b> Cuando termines, avísanos:</p>
            <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} placeholder="Nombre o correo que usaste en Ko-fi (opcional)"
              aria-label="Nombre o correo que usaste en Ko-fi" className={INPUT} />
            <button type="button" onClick={send} disabled={busy || !canSend}
              className="w-full rounded-full py-2.5 text-sm font-semibold text-black disabled:opacity-50" style={{ background: t.accent }}>
              {busy ? 'Enviando…' : 'Ya di la propina · enviar para revisión'}
            </button>
            {msg && !msg.ok && <p className="text-xs text-garnet-400">{msg.text}</p>}
          </div>
        </>
      )}
    </div>
  )
}
