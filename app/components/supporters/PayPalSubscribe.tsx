'use client'

import { useEffect, useRef, useState } from 'react'
import { confirmSubscription } from '../../lib/supporters'

// Tipos mínimos del SDK de PayPal (se carga desde paypal.com, no se instala nada)
type PPActions = { subscription: { create: (o: { plan_id: string; custom_id?: string }) => Promise<string> } }
type PPButtons = { render: (el: HTMLElement) => Promise<void>; close?: () => void }
type PPNamespace = {
  Buttons: (o: {
    style?: Record<string, string>
    createSubscription: (data: unknown, actions: PPActions) => Promise<string>
    onApprove: (data: { subscriptionID?: string | null }) => void | Promise<void>
    onError?: (err: unknown) => void
    onCancel?: () => void
  }) => PPButtons
}
declare global {
  interface Window {
    paypal?: PPNamespace
  }
}

let sdk: Promise<void> | null = null
function loadSdk(clientId: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('sin ventana'))
  if (window.paypal?.Buttons) return Promise.resolve()
  if (!sdk) {
    sdk = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&vault=true&intent=subscription&currency=USD`
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => {
        sdk = null
        reject(new Error('No se pudo cargar PayPal'))
      }
      document.head.appendChild(s)
    })
  }
  return sdk
}

/**
 * Botón oficial de suscripción de PayPal. Se carga solo cuando la persona lo pide.
 * `custom_id` = id de la persona: así el servidor sabe de quién es la suscripción (y lo comprueba con PayPal).
 */
export default function PayPalSubscribe({
  clientId,
  planId,
  userId,
  onDone,
}: {
  clientId: string
  planId: string
  userId: string
  onDone: (r: { status: 'active' | 'pending' }) => void
}) {
  const box = useRef<HTMLDivElement | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'confirming' | 'error'>('loading')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let alive = true
    let buttons: PPButtons | null = null
    loadSdk(clientId)
      .then(async () => {
        if (!alive || !box.current || !window.paypal) return
        buttons = window.paypal.Buttons({
          style: { shape: 'pill', color: 'gold', layout: 'vertical', label: 'subscribe' },
          createSubscription: (_d, actions) => actions.subscription.create({ plan_id: planId, custom_id: userId }),
          onApprove: async (data) => {
            if (!data.subscriptionID) return
            setState('confirming')
            const r = await confirmSubscription(data.subscriptionID)
            if (!alive) return
            if (r.ok) onDone({ status: r.status === 'active' ? 'active' : 'pending' })
            else {
              setState('error')
              setMsg(r.message ?? 'No pudimos confirmarlo ahora.')
            }
          },
          onError: () => {
            setState('error')
            setMsg('PayPal tuvo un problema. Inténtalo de nuevo en un momento.')
          },
          onCancel: () => setMsg('Cancelaste el pago. Cuando quieras, vuelve a intentarlo.'),
        })
        await buttons.render(box.current)
        if (alive) setState('ready')
      })
      .catch(() => {
        if (alive) {
          setState('error')
          setMsg('No se pudo cargar PayPal. Revisa tu conexión (o si tu navegador bloquea paypal.com).')
        }
      })
    return () => {
      alive = false
      try {
        buttons?.close?.()
      } catch {
        /* ya estaba cerrado */
      }
    }
  }, [clientId, planId, userId, onDone])

  return (
    <div className="mt-3">
      {state === 'loading' && <p className="text-xs text-neutral-400">Cargando PayPal…</p>}
      {state === 'confirming' && <p className="text-sm text-amber-200">Confirmando tu pago con PayPal… no cierres esta página.</p>}
      <div ref={box} className={state === 'confirming' ? 'hidden' : ''} />
      {msg && <p className="text-xs text-garnet-400 mt-2">{msg}</p>}
    </div>
  )
}
