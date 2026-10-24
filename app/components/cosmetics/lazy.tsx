'use client'
// Versiones «perezosas» de los componentes del kit: el kit solo se descarga cuando algo se dibuja.
import dynamic from 'next/dynamic'
export const CollectionBadge = dynamic(() => import('./cosmetics').then((m) => m.CollectionBadge), { ssr: false })
export const TitlePill = dynamic(() => import('./cosmetics').then((m) => m.TitlePill), { ssr: false })
export const NameFx = dynamic(() => import('./cosmetics').then((m) => m.NameFx), { ssr: false })
