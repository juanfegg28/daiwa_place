'use client'

import { useEffect } from 'react'
import { wirePwaEvents } from '../lib/pwa'

/** v1.5.11 · Registra el service worker (solo en la página real, no en pruebas locales) y se queda escuchando «instalar». */
export default function PwaRegister() {
  useEffect(() => {
    wirePwaEvents()
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    // v1.6.2 · en el APK la app casi nunca se «recarga»: cada vez que vuelves a ella (máx. 1 vez cada 30 min) busca una versión nueva
    let lastCheck = 0
    const checkUpdate = () => {
      if (document.visibilityState !== 'visible' || Date.now() - lastCheck < 30 * 60 * 1000) return
      lastCheck = Date.now()
      void navigator.serviceWorker.getRegistration().then((r) => r?.update()).catch(() => {})
    }
    document.addEventListener('visibilitychange', checkUpdate)
    const reg = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        /* si falla, la página funciona igual */
      })
    }
    if (document.readyState === 'complete') reg()
    else window.addEventListener('load', reg, { once: true })
    return () => document.removeEventListener('visibilitychange', checkUpdate)
  }, [])
  return null
}
