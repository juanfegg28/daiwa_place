'use client'

import { useState } from 'react'
import { DISCORD_CONTACT } from '../../lib/supporters'

/** ¿Parece que la persona está en Colombia? (zona horaria del dispositivo; no se pide ni se guarda ninguna ubicación) */
export function looksColombian(): boolean {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone === 'America/Bogota'
  } catch {
    return false
  }
}

/**
 * PayPal no permite pagos entre dos cuentas de residentes en Colombia. Por eso, si alguien es de Colombia,
 * no usa PayPal.Me ni Ko-fi: habla directamente con el creador por Discord para apoyar por otra vía (v1.7.2: igual para Ko-fi).
 */
export default function ColombiaNotice({ emphasized }: { emphasized: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(DISCORD_CONTACT)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* sin portapapeles: el usuario lo copia a mano */
    }
  }
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 text-sm ${emphasized ? 'border-amber-400/50 bg-amber-400/10' : 'border-white/10 bg-white/5'}`}>
      <p className="font-semibold text-neutral-50">🇨🇴 ¿Eres de Colombia?</p>
      <p className="text-neutral-300 mt-1 leading-relaxed">
        PayPal no permite pagos entre dos cuentas de personas residentes en Colombia, así que para ti ni PayPal.Me ni Ko-fi son la vía.
        No te preocupes: <b className="text-neutral-50">escríbeme por Discord</b> y lo resolvemos por otra vía.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ink-900/70 border border-white/10 px-3 py-1.5 font-mono text-[13px] text-neutral-50">{DISCORD_CONTACT}</span>
        <button type="button" onClick={copy} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-neutral-200 hover:bg-white/10">
          {copied ? '¡Copiado!' : 'Copiar usuario'}
        </button>
      </div>
    </div>
  )
}
