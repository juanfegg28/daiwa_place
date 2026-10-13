'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import Logo from '../Logo'

/** Fondo oscuro con destellos muy sutiles del color de acento. */
export function AuthBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="auth-glow absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-garnet-600/20 blur-[110px]" />
      <div className="auth-glow-slow absolute -bottom-40 -left-24 h-[24rem] w-[24rem] rounded-full bg-garnet-700/15 blur-[110px]" />
      <div className="auth-glow absolute -right-24 top-1/3 h-[20rem] w-[20rem] rounded-full bg-garnet-500/10 blur-[100px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.045),transparent_62%)]" />
    </div>
  )
}

/** Tarjeta de cristal esmerilado. */
export function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative w-full max-w-md rounded-3xl border border-white/10 bg-ink-900/55 p-6 backdrop-blur-2xl sm:p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)] ${className}`}
    >
      {children}
    </div>
  )
}

const COPY = {
  login: { title: 'Qué bueno verte de nuevo', subtitle: 'Entra a DaiwaPlace y sigue donde lo dejaste' },
  register: { title: 'Descubre tu lugar', subtitle: 'Únete a DaiwaPlace' },
} as const

/**
 * Marco compartido de "Iniciar sesión" y "Registrarse". Vive en el layout, así que al cambiar de una a otra
 * el fondo y la tarjeta se quedan quietos y solo el formulario cambia, con una animación suave (sin recargar).
 */
export default function AuthShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const mode: 'login' | 'register' = pathname?.startsWith('/register') ? 'register' : 'login'
  const copy = COPY[mode]

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-ink-950 text-neutral-100">
      <AuthBackground />
      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <div className="mb-6">
          <Logo size="lg" />
        </div>

        <GlassCard>
          {/* Selector Iniciar sesión / Registrarse con indicador que se desliza */}
          <div role="tablist" aria-label="Acceso" className="relative mb-7 grid grid-cols-2 rounded-2xl border border-white/10 bg-ink-950/50 p-1">
            <span
              aria-hidden="true"
              className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-garnet-600 shadow-[0_8px_22px_-8px_rgba(214,40,72,0.8)] transition-transform duration-300 ease-out ${
                mode === 'register' ? 'translate-x-full' : ''
              }`}
            />
            <Link
              href="/login"
              role="tab"
              aria-selected={mode === 'login'}
              className={`press relative z-10 rounded-xl py-2.5 text-center text-sm font-medium transition-colors duration-300 ${
                mode === 'login' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              role="tab"
              aria-selected={mode === 'register'}
              className={`press relative z-10 rounded-xl py-2.5 text-center text-sm font-medium transition-colors duration-300 ${
                mode === 'register' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Registrarse
            </Link>
          </div>

          {/* Mensaje de bienvenida (cambia con un fundido al cambiar de pestaña) */}
          <div key={mode} className="auth-fade-up mb-6 text-center">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-neutral-50">{copy.title}</h1>
            <p className="mt-1 text-sm text-neutral-400">{copy.subtitle}</p>
          </div>

          {children}
        </GlassCard>

        <p className="mt-6 text-center text-xs text-neutral-600">Una comunidad hecha con cariño para ti</p>
      </div>
    </div>
  )
}
