'use client'

// v1.9.0 · Pestañas del Círculo Lunar: Planes · Estilos (galería por nivel) · Mi membresía
import Link from 'next/link'

type Tab = 'planes' | 'estilos' | 'membresia'

export default function SupporterTabs({ active, signedIn }: { active: Tab; signedIn: boolean }) {
  const tabs: { id: Tab; href: string; label: string; show: boolean }[] = [
    { id: 'planes', href: '/apoyar', label: 'Planes', show: true },
    { id: 'estilos', href: '/apoyar/estilos', label: 'Estilos', show: true },
    { id: 'membresia', href: '/apoyar/mi-membresia', label: 'Mi membresía', show: signedIn },
  ]
  return (
    <nav aria-label="Círculo Lunar" className="mb-6 flex justify-center">
      <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <Link
              key={t.id}
              href={t.href}
              aria-current={active === t.id ? 'page' : undefined}
              className={`rounded-full px-4 sm:px-5 py-1.5 text-sm transition ${active === t.id ? 'bg-white text-black font-semibold' : 'text-neutral-300 hover:text-white'}`}
            >
              {t.label}
            </Link>
          ))}
      </div>
    </nav>
  )
}
