'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePwa } from '../lib/pwa'

const KEY = 'daiwa_install_dismissed'
const DAYS = 14

/** v1.5.11 · Invitación chiquita (solo en celular, solo si todavía no la instalaste). «Ahora no» la esconde 14 días. */
export default function InstallBanner() {
  const pwa = usePwa()
  const [hidden, setHidden] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const at = Number(window.localStorage.getItem(KEY) || 0)
        setHidden(at > 0 && Date.now() - at < DAYS * 86_400_000)
      } catch {
        setHidden(false)
      }
    }, 0)
    return () => window.clearTimeout(t)
  }, [])
  if (!pwa.ready || pwa.standalone || hidden) return null
  if (!(pwa.canPrompt || pwa.platform === 'ios')) return null
  const dismiss = () => {
    setHidden(true)
    try {
      window.localStorage.setItem(KEY, String(Date.now()))
    } catch {
      /* sin almacenamiento */
    }
  }
  return (
    <div className="md:hidden surface-card rounded-2xl p-3.5 mb-4 flex items-center gap-3">
      <span className="text-xl" aria-hidden="true">🌙</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-100 leading-tight">Instala DaiwaPlace</p>
        <p className="text-xs text-neutral-500 leading-snug">Ábrela como app, a pantalla completa.</p>
      </div>
      {pwa.canPrompt ? (
        <button type="button" onClick={() => void pwa.install()} className="press shrink-0 rounded-full bg-garnet-600 text-white text-xs font-semibold px-3.5 py-2">Instalar</button>
      ) : (
        <Link href="/descargar" className="press shrink-0 rounded-full bg-garnet-600 text-white text-xs font-semibold px-3.5 py-2">Cómo</Link>
      )}
      <button type="button" onClick={dismiss} aria-label="Ahora no" className="shrink-0 text-neutral-500 hover:text-neutral-200 text-lg leading-none px-1">×</button>
    </div>
  )
}
