'use client'
import { useEffect } from 'react'

/**
 * v1.4.5 · Chat en celular con el teclado abierto.
 * Antes el chat medía «100dvh» (que NO cambia cuando sale el teclado): el navegador desplazaba toda la página para mostrar el cuadro
 * de texto, la cabecera del chat se iba hacia arriba y, al cerrar el teclado, la página se quedaba desplazada.
 * Ahora el chat mide exactamente lo que el teclado deja libre (visualViewport), la página no se puede desplazar mientras el chat
 * está abierto y, al cerrar el teclado, todo vuelve a su sitio. Publica --vvh (alto visible) y --vvt (desfase) en <html>.
 * Solo actúa en pantallas de celular (< 768 px); en PC no hace nada.
 */
export function useKeyboardFit(active: boolean, onResize?: () => void) {
  useEffect(() => {
    if (!active || typeof window === 'undefined') return
    const root = document.documentElement
    const mq = window.matchMedia('(max-width: 767px)')
    const vv = window.visualViewport
    let raf = 0
    let timer = 0
    let disposed = false
    const apply = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        if (disposed) return
        if (!mq.matches) {
          root.style.removeProperty('--vvh')
          root.style.removeProperty('--vvt')
          root.classList.remove('chat-lock')
          return
        }
        root.classList.add('chat-lock')
        root.style.setProperty('--vvh', `${Math.round(vv?.height ?? window.innerHeight)}px`)
        root.style.setProperty('--vvt', `${Math.round(vv?.offsetTop ?? 0)}px`)
        // el navegador a veces desplaza la página para mostrar el campo enfocado: se devuelve a 0
        if (window.scrollY !== 0 || document.scrollingElement?.scrollTop) window.scrollTo(0, 0)
        onResize?.()
      })
    }
    apply()
    vv?.addEventListener('resize', apply)
    vv?.addEventListener('scroll', apply)
    window.addEventListener('resize', apply)
    window.addEventListener('orientationchange', apply)
    mq.addEventListener?.('change', apply)
    const onFocusOut = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(apply, 120) // al cerrar el teclado
    }
    document.addEventListener('focusout', onFocusOut)
    return () => {
      // v1.5.9 · antes, el temporizador de «al cerrar el teclado» seguía vivo después de salir y volvía a poner el bloqueo de scroll
      // (chat-lock) en la página siguiente: no se podía bajar hasta recargar. Ahora se cancela todo al salir.
      disposed = true
      window.clearTimeout(timer)
      cancelAnimationFrame(raf)
      vv?.removeEventListener('resize', apply)
      vv?.removeEventListener('scroll', apply)
      window.removeEventListener('resize', apply)
      window.removeEventListener('orientationchange', apply)
      mq.removeEventListener?.('change', apply)
      document.removeEventListener('focusout', onFocusOut)
      root.style.removeProperty('--vvh')
      root.style.removeProperty('--vvt')
      root.classList.remove('chat-lock')
    }
    // onResize se lee en cada evento; no hace falta reenganchar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
}
