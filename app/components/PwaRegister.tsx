'use client'

import { useEffect } from 'react'
import { wirePwaEvents } from '../lib/pwa'

/** v1.5.11 · Registra el service worker (solo en la página real, no en pruebas locales) y se queda escuchando «instalar». */
export default function PwaRegister() {
  useEffect(() => {
    wirePwaEvents()
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    const reg = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        /* si falla, la página funciona igual */
      })
    }
    if (document.readyState === 'complete') reg()
    else window.addEventListener('load', reg, { once: true })
  }, [])
  return null
}
