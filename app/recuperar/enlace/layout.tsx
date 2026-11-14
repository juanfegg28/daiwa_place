import type { Metadata } from 'next'

// Página privada (el enlace de recuperación lleva un secreto en el fragmento #): no se indexa y no manda «referrer» a otros sitios.
export const metadata: Metadata = {
  title: 'Recuperar acceso · DaiwaPlace',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
