'use client'

// v1.6.1 · Notificaciones push (lado del celular/navegador).
import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { detectPlatformPublic, isStandalonePublic } from './pwa'

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'

export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/** iPhone/iPad solo permiten notificaciones si DaiwaPlace está instalada en la pantalla de inicio */
export function needsInstallForPush(): boolean {
  return detectPlatformPublic() === 'ios' && !isStandalonePublic()
}

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

async function token(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function readyRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null
  try {
    return await Promise.race([navigator.serviceWorker.ready, new Promise<null>((r) => window.setTimeout(() => r(null), 6000))])
  } catch {
    return null
  }
}

async function postSubscription(sub: PushSubscription, tk: string): Promise<boolean> {
  const j = sub.toJSON()
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
    body: JSON.stringify({ endpoint: j.endpoint, keys: j.keys, userAgent: navigator.userAgent }),
  })
  return res.ok
}

export type EnableResult = 'ok' | 'denied' | 'unsupported' | 'needs-install' | 'no-key' | 'no-sw' | 'error'

/** Pide permiso y registra ESTE dispositivo. Hay que llamarla desde un toque del usuario. */
export async function enablePush(): Promise<EnableResult> {
  if (!pushSupported()) return needsInstallForPush() ? 'needs-install' : 'unsupported'
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!key) return 'no-key'
  const tk = await token()
  if (!tk) return 'error'
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return 'denied'
  const reg = await readyRegistration()
  if (!reg) return 'no-sw'
  try {
    let sub = await reg.pushManager.getSubscription()
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) })
    return (await postSubscription(sub, tk)) ? 'ok' : 'error'
  } catch {
    return 'error'
  }
}

/** Deja de recibir avisos en ESTE dispositivo */
export async function disablePush(): Promise<void> {
  const tk = await token()
  const reg = await readyRegistration()
  const sub = reg ? await reg.pushManager.getSubscription() : null
  if (tk && sub) {
    await fetch('/api/push/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {})
  }
  if (sub) await sub.unsubscribe().catch(() => {})
}

/** Al cerrar sesión: este celular deja de recibir los avisos de esa cuenta (el permiso del navegador se conserva) */
export async function unlinkPushDevice(): Promise<void> {
  try {
    if (!pushSupported()) return
    const tk = await token()
    const reg = await Promise.race([navigator.serviceWorker.getRegistration(), new Promise<undefined>((r) => window.setTimeout(() => r(undefined), 2000))])
    const sub = reg ? await reg.pushManager.getSubscription() : null
    if (tk && sub) await fetch('/api/push/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` }, body: JSON.stringify({ endpoint: sub.endpoint }) })
  } catch {
    /* si falla, el servidor lo limpia solo cuando el aviso no llegue */
  }
}

/** Al abrir la app con sesión: si ya diste permiso, este dispositivo queda ligado a la cuenta que está abierta */
export async function syncPush(): Promise<void> {
  try {
    if (!pushSupported() || Notification.permission !== 'granted') return
    if (sessionStorage.getItem('daiwa_push_synced') === '1') return
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const tk = await token()
    if (!key || !tk) return
    const reg = await readyRegistration()
    if (!reg) return
    let sub = await reg.pushManager.getSubscription()
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) })
    if (await postSubscription(sub, tk)) sessionStorage.setItem('daiwa_push_synced', '1')
  } catch {
    /* sin push no pasa nada: la página funciona igual */
  }
}

export async function sendTestPush(): Promise<'ok' | 'sin-dispositivos' | 'no-llego' | 'config' | 'error'> {
  const tk = await token()
  if (!tk) return 'error'
  try {
    const res = await fetch('/api/push/test', { method: 'POST', headers: { Authorization: `Bearer ${tk}` } })
    const j = (await res.json()) as { ok?: boolean; reason?: string }
    if (j.ok) return 'ok'
    return (j.reason as 'sin-dispositivos' | 'no-llego' | 'config') ?? 'error'
  } catch {
    return 'error'
  }
}

export type PushUiState = { ready: boolean; supported: boolean; needsInstall: boolean; permission: PushPermission; subscribed: boolean }

/** Estado de las notificaciones de ESTE dispositivo (para la pantalla de Configuración y el aviso del Inicio) */
export function usePushState(): PushUiState & { refresh: () => void } {
  const [s, setS] = useState<PushUiState>({ ready: false, supported: false, needsInstall: false, permission: 'default', subscribed: false })
  const refresh = useCallback(() => {
    void (async () => {
      const supported = pushSupported()
      const needsInstall = needsInstallForPush()
      let subscribed = false
      if (supported) {
        const reg = await Promise.race([navigator.serviceWorker.getRegistration(), new Promise<undefined>((r) => window.setTimeout(() => r(undefined), 1500))])
        subscribed = !!(reg && (await reg.pushManager.getSubscription()))
      }
      setS({ ready: true, supported, needsInstall, permission: supported ? (Notification.permission as PushPermission) : 'unsupported', subscribed })
    })()
  }, [])
  useEffect(() => {
    const t = window.setTimeout(refresh, 0)
    return () => window.clearTimeout(t)
  }, [refresh])
  return { ...s, refresh }
}
