'use client'

import { useEffect, useState } from 'react'
import Avatar from '../cosmetics/Avatar'

/** Las 10 paletas de las decoraciones de miembros (mismos ids que el kit): 5 oscuras + 5 rosas/pastel */
export const MEMBER_PALETTES = ['medianoche', 'sangre-lunar', 'obsidiana', 'orquidea', 'abismo', 'rosa-eclipse', 'algodon', 'chicle', 'sakura', 'rosa-oro'] as const

/** Decoraciones de miembros por nivel (mismos slugs que el SQL v1.7.3) */
export const MEMBER_DECOS: Record<'creciente' | 'llena' | 'eclipse', { slug: string; name: string }[]> = {
  creciente: [
    { slug: 'halo-naciente', name: 'Halo Naciente' },
    { slug: 'lazo-de-seda-y-perlas', name: 'Lazo de seda y perlas' },
    { slug: 'jardin-de-luna', name: 'Jardín de luna' },
  ],
  llena: [
    { slug: 'orbita-de-plata', name: 'Órbita de plata' },
    { slug: 'astrolabio-de-selene', name: 'Astrolabio de Selene' },
    { slug: 'polilla-lunar', name: 'Polilla lunar' },
    { slug: 'diadema-de-selene', name: 'Diadema de Selene' },
    { slug: 'medusas-de-medianoche', name: 'Medusas de medianoche' },
  ],
  eclipse: [
    { slug: 'corona-de-la-totalidad', name: 'Corona de la Totalidad' },
    { slug: 'caliz-de-rosas', name: 'Cáliz de rosas' },
    { slug: 'serafin-lunar', name: 'Serafín lunar' },
    { slug: 'reloj-de-selene', name: 'Reloj de Selene' },
    { slug: 'cristales-de-eclipse', name: 'Cristales de eclipse' },
    { slug: 'gatita-celestial', name: 'Gatita celestial' },
  ],
}

/** Cambia de paleta cada pocos segundos para lucir las 10 (se queda quieta si la persona pidió menos movimiento) */
function usePaletteTick(ms = 2600) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => setI((n) => (n + 1) % MEMBER_PALETTES.length), ms)
    return () => window.clearInterval(t)
  }, [ms])
  return i
}

/** Tira horizontal con las decoraciones (vista previa con un avatar de ejemplo) */
export default function DecoStrip({ decos, username = 'luna', avatarUrl = null, offset = 0, claimedSlugs }: {
  decos: { slug: string; name: string }[]
  username?: string
  avatarUrl?: string | null
  offset?: number
  claimedSlugs?: Set<string>
}) {
  const tick = usePaletteTick()
  return (
    <div className="-mx-1 overflow-x-auto pb-1">
      <ul className="flex gap-1 px-1 w-max">
        {decos.map((d, n) => (
          <li key={d.slug} className="w-[132px] shrink-0 flex flex-col items-center text-center">
            <div className="h-[132px] w-full flex items-center justify-center">
              <Avatar username={username} avatarUrl={avatarUrl} size="w-20 h-20" sizes="80px" textSize="text-2xl" deco={{ id: d.slug, palette: MEMBER_PALETTES[(tick + n * 3 + offset) % MEMBER_PALETTES.length] }} decoContext="profile" />
            </div>
            <span className="text-[11.5px] leading-tight text-neutral-300 px-1">{d.name}</span>
            {claimedSlugs?.has(d.slug) && <span className="mt-0.5 text-[10.5px] text-emerald-300">Reclamada ✓</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
