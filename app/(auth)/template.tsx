'use client'

import { usePathname } from 'next/navigation'

/**
 * Se vuelve a montar en cada cambio de página: por eso el formulario entra con una animación suave
 * (desde la derecha al ir a Registrarse, desde la izquierda al volver a Iniciar sesión).
 */
export default function AuthTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const cls = pathname?.startsWith('/register') ? 'auth-enter-right' : 'auth-enter-left'
  return <div className={cls}>{children}</div>
}
