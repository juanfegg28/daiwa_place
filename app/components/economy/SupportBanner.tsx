'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchMyPerks, FREE_PERKS, type MyPerks } from '../../lib/perks'
import { TIERS } from '../../lib/supporters'

const HIDE_KEY = 'daiwa_support_banner_hidden_until'

/**
 * v1.8.0 · Anuncio «Apoya a DaiwaPlace» debajo de las Misiones (columna derecha en PC, tarjeta en celular).
 * Lleva al Círculo Lunar (/apoyar). Quien ya apoya ve un agradecimiento corto con sus ventajas; se puede ocultar 7 días.
 */
export default function SupportBanner({ className = '' }: { className?: string }) {
  const [perks, setPerks] = useState<MyPerks>(FREE_PERKS)
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    let alive = true
    const t = window.setTimeout(() => {
      try {
        const until = Number(window.localStorage.getItem(HIDE_KEY) ?? 0)
        if (alive) setHidden(Date.now() < until)
      } catch {
        if (alive) setHidden(false)
      }
    }, 0)
    void fetchMyPerks().then((p) => alive && setPerks(p))
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [])

  if (hidden) return null
  const supporter = perks.rank > 0
  const tier = perks.tier ? TIERS[perks.tier] : null

  const hide = () => {
    setHidden(true)
    try {
      window.localStorage.setItem(HIDE_KEY, String(Date.now() + 7 * 24 * 3600 * 1000))
    } catch {
      /* sin almacenamiento */
    }
  }

  return (
    <section
      aria-label="Apoya a DaiwaPlace"
      className={`relative overflow-hidden rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/15 via-ink-900/80 to-amber-400/10 p-3.5 ${className}`}
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-300/20 blur-2xl" />
      <button type="button" onClick={hide} aria-label="Ocultar por 7 días" title="Ocultar por 7 días" className="absolute right-1.5 top-1.5 h-6 w-6 rounded-full text-neutral-500 hover:text-neutral-200 hover:bg-ink-800 text-sm leading-none">
        ×
      </button>
      <p className="text-[10.5px] font-bold uppercase tracking-widest text-violet-300">☾ Círculo Lunar</p>
      {supporter ? (
        <>
          <h3 className="mt-1 font-display text-[15px] font-semibold text-neutral-50 leading-snug">Gracias por sostener DaiwaPlace{tier ? ` · ${tier.short}` : ''}</h3>
          <p className="mt-1 text-[12px] leading-relaxed text-neutral-300">
            Ganas +{perks.mission_bonus_pct} % de Lunas extra en cada misión y cofre, tu bono diario va ×{perks.daily_mult} y tu escudo de racha se recarga cada {perks.shield_days} días.
          </p>
          <Link href="/apoyar/mi-membresia" className="mt-2.5 inline-block rounded-full border border-violet-400/50 px-3.5 py-1.5 text-[12px] font-semibold text-violet-200 hover:bg-violet-500/15 transition">
            Ver mi membresía
          </Link>
        </>
      ) : (
        <>
          <h3 className="mt-1 font-display text-[15px] font-semibold text-neutral-50 leading-snug">¿Quieres apoyar a DaiwaPlace?</h3>
          <p className="mt-1 text-[12px] leading-relaxed text-neutral-300">
            DaiwaPlace es gratis y lo mantiene una sola persona. Desde 1 USD al mes recibes Lunas cada semana, insignia, más historias, +15 % o más de Lunas extra en cada misión, bono diario ×1,25 o más y escudo de racha.
          </p>
          <Link href="/apoyar" className="mt-2.5 inline-block rounded-full bg-violet-500 hover:bg-violet-400 px-4 py-1.5 text-[12.5px] font-bold text-white transition shadow-[0_8px_22px_-10px_rgba(139,92,246,.9)]">
            Apoyar en el Círculo Lunar →
          </Link>
        </>
      )}
    </section>
  )
}
