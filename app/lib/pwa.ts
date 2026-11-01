'use client'

// v1.5.11 · DaiwaPlace como app instalable (PWA). Aquí vive todo lo que decide si se puede mostrar «Instalar».
import { useEffect, useState } from 'react'

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
const EVT = 'daiwa:pwa'
let deferred: InstallPromptEvent | null = null
let wired = false

/** Escucha lo que dice el navegador. Se llama una vez al abrir la página (lo hace PwaRegister). */
export function wirePwaEvents() {
  if (wired || typeof window === 'undefined') return
  wired = true
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // guardamos el aviso para mostrarlo con nuestro propio botón
    deferred = e as InstallPromptEvent
    window.dispatchEvent(new Event(EVT))
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    window.dispatchEvent(new Event(EVT))
  })
}

export type Platform = 'ios' | 'android' | 'otro'

function readStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true || document.referrer.startsWith('android-app://')
}
function readPlatform(): Platform {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'otro'
}

export type PwaState = {
  ready: boolean
  /** ya estás dentro de la app instalada */
  standalone: boolean
  /** el navegador permite instalar con un toque */
  canPrompt: boolean
  platform: Platform
}

export function usePwa(): PwaState & { install: () => Promise<'accepted' | 'dismissed' | 'none'> } {
  const [s, setS] = useState<PwaState>({ ready: false, standalone: false, canPrompt: false, platform: 'otro' })
  useEffect(() => {
    const read = () => setS({ ready: true, standalone: readStandalone(), canPrompt: !!deferred, platform: readPlatform() })
    wirePwaEvents()
    const t = window.setTimeout(read, 0)
    window.addEventListener(EVT, read)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener(EVT, read)
    }
  }, [])
  const install = async () => {
    if (!deferred) return 'none' as const
    const ev = deferred
    await ev.prompt()
    const { outcome } = await ev.userChoice
    deferred = null
    window.dispatchEvent(new Event(EVT))
    return outcome
  }
  return { ...s, install }
}
