'use client'

import { useEffect, useState } from 'react'
import { enablePush, usePushState } from '../lib/push'
import { usePwa } from '../lib/pwa'

const KEY = 'daiwa_push_prompt_dismissed'
const DAYS = 14

/** v1.6.1 · Invitación chiquita a activar las notificaciones (solo celular; se esconde 14 días con «Ahora no»). */
export default function PushPrompt() {
  const push = usePushState()
  const pwa = usePwa()
  const [hidden, setHidden] = useState(true)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
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
  // si todavía se está ofreciendo «Instalar», primero eso (no mostramos dos invitaciones a la vez)
  const installOfferVisible = pwa.ready && !pwa.standalone && pwa.canPrompt
  if (hidden || !push.ready || !push.supported || push.needsInstall || push.subscribed || push.permission !== 'default' || installOfferVisible) return null
  const dismiss = () => {
    setHidden(true)
    try {
      window.localStorage.setItem(KEY, String(Date.now()))
    } catch {
      /* sin almacenamiento */
    }
  }
  const go = async () => {
    setBusy(true)
    const r = await enablePush()
    setBusy(false)
    push.refresh()
    if (r === 'denied') setNote('No diste permiso. Puedes activarlo después en Configuración → Notificaciones.')
    else if (r !== 'ok') setNote('No se pudo activar ahora. Prueba desde Configuración → Notificaciones.')
  }
  return (
    <div className="md:hidden surface-card rounded-2xl p-3.5 mb-4">
      <div className="flex items-center gap-3">
        <span className="text-xl" aria-hidden="true">🔔</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-100 leading-tight">Activa las notificaciones</p>
          <p className="text-xs text-neutral-500 leading-snug">Entérate de tus mensajes y avisos aunque tengas la app cerrada.</p>
        </div>
        <button type="button" onClick={go} disabled={busy} className="press shrink-0 rounded-full bg-garnet-600 text-white text-xs font-semibold px-3.5 py-2 disabled:opacity-60">{busy ? '…' : 'Activar'}</button>
        <button type="button" onClick={dismiss} aria-label="Ahora no" className="shrink-0 text-neutral-500 hover:text-neutral-200 text-lg leading-none px-1">×</button>
      </div>
      {note && <p className="mt-2 text-xs text-neutral-400">{note}</p>}
    </div>
  )
}
