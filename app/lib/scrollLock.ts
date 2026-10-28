/**
 * v1.5.9 · Bloqueo del scroll de fondo con CONTADOR.
 * Antes cada pantalla (visor de historias, visor de fotos, menú del celular) guardaba el valor anterior de body.overflow y lo
 * devolvía al cerrarse; si dos se solapaban, el «valor anterior» ya era «hidden» y la página se quedaba sin poder bajar hasta
 * recargar. Ahora todas pasan por aquí: el scroll solo se libera cuando se cierra la ÚLTIMA.
 */
let locks = 0

export function lockBodyScroll(): () => void {
  if (typeof document === 'undefined') return () => {}
  locks += 1
  document.body.style.overflow = 'hidden'
  let released = false
  return () => {
    if (released) return
    released = true
    locks = Math.max(0, locks - 1)
    if (locks === 0) document.body.style.removeProperty('overflow')
  }
}

/** Red de seguridad: si nadie tiene el scroll bloqueado a propósito, se limpia cualquier bloqueo que se haya quedado pegado. */
export function releaseStaleScrollLocks(keepChatLock: boolean) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (locks === 0) document.body.style.removeProperty('overflow')
  if (!keepChatLock) {
    root.classList.remove('chat-lock')
    root.style.removeProperty('--vvh')
    root.style.removeProperty('--vvt')
  }
}
