import Logo from './Logo'
import { AuthBackground, GlassCard } from './auth/AuthShell'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
  /** Se conserva por compatibilidad; todas las tarjetas de acceso comparten el mismo ancho */
  wide?: boolean
}) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-ink-950 text-neutral-100">
      <AuthBackground />
      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <div className="mb-6">
          <Logo size="lg" />
        </div>
        <GlassCard>{children}</GlassCard>
      </div>
    </div>
  )
}
