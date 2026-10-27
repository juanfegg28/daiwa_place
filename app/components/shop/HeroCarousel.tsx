'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons'
import BannerArt from './BannerArt'
import { MiniItem } from './ShopItems'
import { useShop } from './ShopProvider'
import { featureItems, fmtDate, pickHighlights } from './shopUtil'
import { themeOf } from './shopThemes'
import type { CatalogItem } from '../../lib/cosmetics'

const ROTATE_MS = 7000

type Slide = { id: string; eyebrow: string; title: string; subtitle: string; cta: string; href: string; theme: string; count: number; until: string | null; items: CatalogItem[] }

function usePrefersReducedMotion() {
  const [r, setR] = useState(false)
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    const f = () => setR(m.matches)
    const t = setTimeout(f, 0)
    m.addEventListener('change', f)
    return () => { clearTimeout(t); m.removeEventListener('change', f) }
  }, [])
  return r
}

/**
 * Banner principal: las selecciones nuevas (p. ej. «Selección de Halloween») rotan solas cada 7 s.
 * Rendimiento: solo se monta la diapositiva visible; el reloj se detiene con el cursor encima, si la pestaña está oculta,
 * si el banner no se ve en pantalla o si la persona pidió movimiento reducido.
 */
export default function HeroCarousel() {
  const shop = useShop()
  const reduce = usePrefersReducedMotion()
  const [idx, setIdx] = useState(0)
  const [hold, setHold] = useState(false)
  const [inView, setInView] = useState(true)
  const root = useRef<HTMLElement>(null)
  const touchX = useRef<number | null>(null)

  const slides: Slide[] = useMemo(() => {
    const list: Slide[] = shop.features.map((f) => {
      const items = featureItems(f, shop.shelf)
      return { id: f.id, eyebrow: 'Nuevo en la tienda', title: f.title, subtitle: f.subtitle ?? '', cta: f.cta, href: `/tienda/seleccion/${f.slug}`, theme: f.theme, count: items.length, until: f.ends_at, items: pickHighlights(items, 3) }
    }).filter((s) => s.count > 0)
    if (list.length === 0) {
      list.push({ id: 'default', eyebrow: 'Tienda de DaiwaPlace', title: 'Personaliza tu perfil', subtitle: 'Decoraciones de avatar, tarjetas, efectos de entrada, fuentes y más. Se compran con las Lunas que ganas en misiones.', cta: 'Explorar la tienda', href: '/tienda/explorar', theme: 'garnet', count: shop.shelf.length, until: null, items: pickHighlights(shop.shelf, 3) })
    }
    return list
  }, [shop.features, shop.shelf])

  const n = slides.length
  const cur = slides[Math.min(idx, n - 1)]

  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const run = n > 1 && !hold && inView && !reduce
  useEffect(() => {
    if (!run) return
    const t = setTimeout(() => { if (!document.hidden) setIdx((i) => (i + 1) % n); else setIdx((i) => i) }, ROTATE_MS)
    return () => clearTimeout(t)
  }, [run, idx, n])

  const go = (d: number) => setIdx((i) => (i + d + n) % n)
  const theme = themeOf(cur.theme)

  return (
    <section ref={root} aria-roledescription="carrusel" aria-label="Novedades de la tienda" className="relative overflow-hidden rounded-3xl border border-white/10 isolate"
      onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setHold(true) }}
      onTouchEnd={(e) => { const x0 = touchX.current; touchX.current = null; setHold(false); if (x0 != null && n > 1) { const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1) } }}>
      <div key={cur.id} className="shop-fade-in">
        <BannerArt theme={cur.theme} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent sm:via-black/10" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 p-5 sm:p-8 min-h-[400px] sm:min-h-[330px]">
          <div className="max-w-md">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ background: theme.c, color: '#120408' }}>{cur.eyebrow}</span>
            <h2 className="font-display text-3xl sm:text-[2.6rem] leading-[1.05] font-bold text-white mt-3 drop-shadow-[0_2px_12px_rgba(0,0,0,.6)]">{cur.title}</h2>
            {cur.subtitle && <p className="text-sm sm:text-base text-white/85 mt-2 drop-shadow">{cur.subtitle}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href={cur.href} className="press inline-flex items-center gap-2 rounded-xl bg-white text-ink-950 font-semibold px-5 py-2.5 hover:bg-neutral-100 transition shadow-lg">{cur.cta} <ChevronRightIcon className="w-4 h-4" /></Link>
              <span className="text-xs text-white/75">{cur.count} cosméticos{cur.until ? ` · hasta el ${fmtDate(cur.until)}` : ''}</span>
            </div>
          </div>
          <div className="flex gap-3 sm:gap-4 items-end self-start sm:self-center overflow-x-auto sm:overflow-visible max-w-full pb-1" aria-label="Destacados">
            {cur.items.map((it, k) => <div key={it.id} className={k === 1 ? 'sm:-translate-y-3' : ''}><MiniItem item={it} /></div>)}
          </div>
        </div>
      </div>

      {n > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Anterior" className="hidden sm:inline-flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/45 hover:bg-black/70 border border-white/20 items-center justify-center text-white transition"><ChevronLeftIcon className="w-5 h-5" /></button>
          <button type="button" onClick={() => go(1)} aria-label="Siguiente" className="hidden sm:inline-flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/45 hover:bg-black/70 border border-white/20 items-center justify-center text-white transition"><ChevronRightIcon className="w-5 h-5" /></button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2" role="tablist" aria-label="Elegir banner">
            {slides.map((s, k) => (
              <button key={s.id} type="button" role="tab" aria-selected={k === idx} aria-label={`Banner ${k + 1}: ${s.title}`} onClick={() => setIdx(k)}
                className="relative h-1.5 rounded-full bg-white/35 overflow-hidden transition-all" style={{ width: k === idx ? 34 : 10 }}>
                {k === idx && <span key={`${idx}-${run}`} className={`absolute inset-0 bg-white rounded-full ${run ? 'shop-progress' : ''}`} />}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
