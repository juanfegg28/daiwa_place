'use client'
/**
 * Adaptador React del kit de cosméticos (v1.4.0). Basado en adapter/cosmetics.tsx del kit, con estas diferencias:
 *   · Todo pasa por ./kit.ts (guardia de versiones: lo de la 1.5.0 no se dibuja hasta lanzarse).
 *   · Respeta prefers-reduced-motion, ahorro de datos y los ajustes «Animaciones» y «Efectos de nombre» de la persona.
 *   · Solo se anima lo que se ve en pantalla (IntersectionObserver).
 *   · Estilos de nombres y títulos se inyectan UNA vez por diseño (no una etiqueta <style> por cada nombre).
 *   · El banner del perfil es del usuario: las tarjetas no dibujan sobre él (ver kit.ts).
 * dangerouslySetInnerHTML se usa SOLO en este archivo: el texto sale de nuestro propio código y lo del usuario se escapa en el kit.
 */
import { useContext, useEffect, useInsertionEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import {
  backgroundBySlug, backgroundOut, badgeOut, decoLayers, drawEntryStill, entryBySlug, nameFx, skinPartsFor, startEntryFx, titleOut,
} from './kit'
import { prefersReducedMotion, saveDataOn, useCosmeticPrefs, type Equip, type NameFxPref } from '../../lib/cosmetics'
import { useAnimSlot } from '../../lib/animBudget'
import { PlayCtx } from './usePlay'

export { UPCOMING_CSS, RELEASED_CSS } from './kit'

// ───────── utilidades ─────────

const injected = new Set<string>()
/** Inyecta un bloque de CSS una sola vez (por identificador) en <head> */
function useStyle(id: string | null, css: string | null | undefined) {
  useInsertionEffect(() => {
    if (!id || !css || injected.has(id) || typeof document === 'undefined') return
    injected.add(id)
    const el = document.createElement('style')
    el.setAttribute('data-cos', id)
    el.textContent = css
    document.head.appendChild(el)
  }, [id, css])
}

/** ¿Está visible en pantalla? (las animaciones fuera de pantalla se pausan) */
function useVisible<T extends Element>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [vis, setVis] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((e) => setVis(e[0]?.isIntersecting ?? true), { rootMargin: '120px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, vis]
}

/** Tamaño real (px) de una caja: la decoración solo se dibuja si el avatar es lo bastante grande */
export function useBoxPx(ref: React.RefObject<Element | null>, enabled: boolean): number {
  const [px, setPx] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!enabled || !el) return
    // offsetWidth ignora transform: scale() (las vistas previas se escalan para caber y el avatar no debe «encogerse» de golpe)
    const read = () => setPx((el as HTMLElement).offsetWidth)
    read()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, enabled])
  return px
}

/** ¿Se puede animar aquí? Combina el sistema (reducir movimiento / ahorro de datos) y el ajuste de la persona. */
const noopSubscribe = () => () => {}
const systemAllowsMotion = () => !prefersReducedMotion() && !saveDataOn()
export function useAnimateAllowed(context: 'feed' | 'profile' = 'feed'): boolean {
  const prefs = useCosmeticPrefs()
  // Lee «reducir movimiento» y ahorro de datos del sistema (en el servidor se asume que sí se puede)
  const sys = useSyncExternalStore(noopSubscribe, systemAllowsMotion, () => true)
  if (!sys || prefs.anim === 'ninguna') return false
  if (prefs.anim === 'perfiles' && context === 'feed') return false
  return true
}

// ───────── Decoración de avatar (una capa: «back» detrás de la foto, «front» delante) ─────────
// Caja de la decoración = 1.2973 × el avatar (288/222), centrada: left/top = -14.865 %.
export function DecoLayer({ deco, part, px, context = 'feed', slotKey }: { deco: Equip; part: 'back' | 'front'; px: number; context?: 'feed' | 'profile'; slotKey?: string }) {
  const L = useMemo(() => decoLayers(deco.id, deco.palette, deco.hue ?? 0), [deco.id, deco.palette, deco.hue])
  const allowed = useAnimateAllowed(context)
  const gate = useContext(PlayCtx) // null = no es una miniatura; false = miniatura en reposo; true = miniatura con el cursor encima
  const [ref, vis] = useVisible<HTMLSpanElement>()
  const wants = allowed && gate !== false && vis && px >= 40
  // tope de animaciones simultáneas (las miniaturas «activas» van primero: solo hay una a la vez)
  const slot = useAnimSlot(slotKey ?? `${deco.id}-${part}`, wants, gate === true ? -1 : context === 'profile' ? 0 : 1)
  if (!L || px < L.min) return null // por debajo del tamaño mínimo se ve solo la foto
  const html = part === 'back' ? L.back : L.front
  if (!html) return null
  return (
    <span
      ref={ref}
      className="dpw pointer-events-none absolute"
      data-live={vis ? '1' : '0'}
      data-static={slot ? '0' : '1'}
      aria-hidden="true"
      style={{ left: '-14.865%', top: '-14.865%', width: '129.73%', height: '129.73%', zIndex: part === 'back' ? 0 : 3 }}
    >
      <span className={`dpl dpl-${part} block w-full h-full`} dangerouslySetInnerHTML={{ __html: html }} />
    </span>
  )
}

// ───────── Nombre con efecto ─────────
export function NameFx({ effect, text, density, fontFamily, className = '' }: { effect: Equip; text: string; density?: NameFxPref; fontFamily?: string; className?: string }) {
  const prefs = useCosmeticPrefs()
  const gate = useContext(PlayCtx)
  const animate = useAnimateAllowed('profile') && gate !== false
  // la persona manda: «Efectos de nombre» completa / ligera / plana; sin movimiento → ligera
  let mode: NameFxPref = density ?? 'full'
  if (prefs.nameFx === 'plain') mode = 'plain'
  else if (prefs.nameFx === 'lite' && mode === 'full') mode = 'lite'
  if (!animate && mode === 'full') mode = 'lite'
  const out = useMemo(() => nameFx(effect.id, text, { palette: effect.palette, hue: effect.hue ?? 0, mode }), [effect.id, effect.palette, effect.hue, text, mode])
  useStyle(out ? `ne-${effect.id}-${effect.palette ?? ''}-${effect.hue ?? 0}-${mode}` : null, out?.css)
  if (!out) return <span className={className} style={fontFamily ? { fontFamily } : undefined}>{text}</span>
  return <span className={className} style={fontFamily ? { fontFamily } : undefined} dangerouslySetInnerHTML={{ __html: out.html }} />
}

// ───────── Título (pastilla bajo el nombre) ─────────
export function TitlePill({ title }: { title: Equip }) {
  const out = useMemo(() => titleOut(title.id, { palette: title.palette, hue: title.hue ?? 0 }), [title.id, title.palette, title.hue])
  useStyle(out?.css ? `tt-${title.id}-${title.palette ?? ''}-${title.hue ?? 0}` : null, out?.css)
  if (!out) return null
  return <span className="inline-flex align-middle" dangerouslySetInnerHTML={{ __html: out.html }} />
}

// ───────── Insignia de colección ─────────
export function CollectionBadge({ collection, size = 24, title }: { collection: string; size?: number; title?: string }) {
  const html = useMemo(() => badgeOut(collection, size), [collection, size])
  if (!html) return null
  return <span title={title} className="inline-flex shrink-0" aria-label={title} role={title ? 'img' : undefined} dangerouslySetInnerHTML={{ __html: html }} />
}

/** v1.4.5: mientras la pantalla se desplaza, las animaciones pesadas del perfil (fondo y tarjeta) se pausan y siguen al soltar.
 *  El navegador usa todo su esfuerzo en deslizar con fluidez; al detenerte, vuelven solas (≈0,15 s). */
let scrollUsers = 0
let scrollTimer: ReturnType<typeof setTimeout> | undefined
function onScrollPause() {
  const root = document.documentElement
  root.dataset.scrolling = '1'
  clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => { delete root.dataset.scrolling }, 160)
}
export function usePauseWhileScrolling(on: boolean) {
  useEffect(() => {
    if (!on || typeof window === 'undefined') return
    if (scrollUsers++ === 0) window.addEventListener('scroll', onScrollPause, { passive: true, capture: true })
    return () => {
      if (--scrollUsers === 0) {
        window.removeEventListener('scroll', onScrollPause, { capture: true } as EventListenerOptions)
        clearTimeout(scrollTimer)
        delete document.documentElement.dataset.scrolling
      }
    }
  }, [on])
}

// ───────── Fondo de perfil ─────────
/** Va dentro de un contenedor «relative». Se queda fijo en la pantalla mientras se desplaza el perfil (sticky) y
 *  lleva encima un velo oscuro para que las publicaciones siempre se lean. */
export function ProfileBackground({ background, veil = 0.58 }: { background: Equip; veil?: number }) {
  const b = backgroundBySlug(background.id)
  const html = useMemo(() => (b ? backgroundOut(background.id, { palette: background.palette, hue: background.hue ?? 0 }) : ''), [b, background.id, background.palette, background.hue])
  const animate = useAnimateAllowed('profile')
  const [ref, vis] = useVisible<HTMLDivElement>()
  usePauseWhileScrolling(!!b && animate)
  if (!b) return null
  return (
    <div ref={ref} aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="dpw absolute inset-0" data-live={vis ? '1' : '0'} data-static={animate ? '0' : '1'} dangerouslySetInnerHTML={{ __html: html }} />
        <div className="absolute inset-0 bg-ink-950" style={{ opacity: veil }} />
      </div>
    </div>
  )
}

// ───────── Efecto de entrada (una vez por visita) ─────────
export function EntryEffect({ effect, loop = false, still = false, className = '' }: { effect: Equip; loop?: boolean; /** un solo fotograma, sin animar (miniaturas en reposo) */ still?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const animate = useAnimateAllowed('profile')
  useEffect(() => {
    const fx = entryBySlug(effect.id)
    const cv = ref.current
    if (!fx || !cv) return
    if (still) {
      // el contenedor puede no tener medida todavía (primer pintado): se dibuja cuando la tenga
      let ro: ResizeObserver | undefined
      const draw = () => { if (cv.clientWidth > 0) drawEntryStill(fx, cv, { paletteId: effect.palette, hue: effect.hue ?? 0 }) }
      draw()
      if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(draw); ro.observe(cv) }
      return () => ro?.disconnect()
    }
    const h = startEntryFx(fx, cv, { paletteId: effect.palette, hue: effect.hue ?? 0, loop, reduced: !animate })
    return () => h.stop()
  }, [effect.id, effect.palette, effect.hue, loop, animate, still])
  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none ${className}`} style={{ width: '100%', height: '100%' }} />
}

// ───────── Tarjeta de perfil v2: superficie fluida que envuelve los bloques reales del perfil ─────────
/**
 *   <banner del usuario: FUERA, arriba>
 *   <SkinCard card=… seam="attached">   ← .sk-bg (arte) → .sk-in (tus bloques) → .sk-fg (marco; no captura toques)
 *     …avatar (sube sobre el banner), nombre, bio, canción, identidad, chips, contadores…
 *   </SkinCard>
 * Es fluida (360 → 935 px). Los bloques se integran con los tokens --sk-ink / --sk-mute / --sk-panel / --sk-line / --sk-chip / --sk-accent
 * (ver estilos «.sk-in …» en globals.css). Sin tarjeta equipada el llamador no usa este componente.
 * No poner overflow:hidden en ningún contenedor del perfil ni en .sk: el avatar sube sobre el banner.
 */
export function SkinCard({ card, seam = 'attached', anim, children, className = '' }: { card: Equip; seam?: 'attached' | 'float'; anim?: boolean; children: React.ReactNode; className?: string }) {
  const parts = useMemo(() => skinPartsFor(card.id, card.palette, card.hue ?? 0), [card.id, card.palette, card.hue])
  const allowed = useAnimateAllowed('profile')
  const gate = useContext(PlayCtx)
  const [ref, vis] = useVisible<HTMLDivElement>()
  usePauseWhileScrolling(gate === null && !!parts && allowed)
  const wants = (anim ?? true) && allowed && gate !== false && vis
  const slot = useAnimSlot(`skin-${card.id}-${card.palette ?? ''}`, wants, gate === true ? -1 : 0)
  if (!parts) return <>{children}</>
  const on = wants && slot
  return (
    <div
      ref={ref}
      className={`sk sk-${parts.slug} sk-themed ${className}`}
      data-skin={parts.slug}
      data-tone={parts.tone}
      data-seam={seam}
      data-anim={on ? undefined : 'off'}
      style={parts.vars as React.CSSProperties}
    >
      <div className="sk-bg" aria-hidden="true" dangerouslySetInnerHTML={{ __html: parts.bg }} />
      <div className="sk-in">{children}</div>
      <div className="sk-fg" aria-hidden="true" dangerouslySetInnerHTML={{ __html: parts.fg }} />
    </div>
  )
}

/** Miniatura de una tarjeta para la tienda, el inventario y el estudio: la tarjeta suelta (4 esquinas) con un perfil de muestra */
export function SkinThumb({ card, name, photoUrl, width = 230, anim }: { card: Equip; name: string; photoUrl?: string | null; width?: number; anim?: boolean }) {
  return (
    <div style={{ width, maxWidth: '100%', margin: '0 auto' }}>
      <SkinCard card={card} seam="float" anim={anim}>
        <div style={{ ['--av' as string]: 'clamp(40px,16cqw,56px)', paddingTop: 'clamp(14px,6cqw,22px)', paddingBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 'var(--av)', height: 'var(--av)', borderRadius: '50%', overflow: 'hidden', flex: 'none', background: 'var(--sk-panel-2)', display: 'block' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {photoUrl ? <img src={photoUrl} alt="" width={56} height={56} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
            </span>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 'clamp(12px,5cqw,15px)', color: 'var(--sk-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
              <p style={{ margin: 0, fontSize: 'clamp(10px,4cqw,12px)', color: 'var(--sk-mute)' }}>@usuario</p>
            </div>
          </div>
          <div style={{ marginTop: 8, border: '1px solid var(--sk-line)', background: 'var(--sk-panel)', borderRadius: 14, padding: '8px 10px', fontSize: 'clamp(10px,4cqw,12px)', color: 'var(--sk-ink)' }}>
            Así se ve tu biografía.
            <span style={{ display: 'inline-block', marginLeft: 6, padding: '1px 8px', borderRadius: 99, border: '1px solid var(--sk-line)', background: 'var(--sk-chip)', fontSize: '0.9em' }}>3er año</span>
          </div>
        </div>
      </SkinCard>
    </div>
  )
}
