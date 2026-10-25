'use client'
/**
 * v1.4.5 · «Mi clóset» — el estudio de personalización rediseñado.
 *   · Vista previa del perfil (la MISMA estructura del perfil real) + el clóset con sus «cajones» (Color, Nombre, Avatar…).
 *   · PC: dos columnas (vista previa a la izquierda, clóset fijo a la derecha).
 *   · Celular: la vista previa arriba y el clóset como cajón fijo abajo que se abre y se cierra (la barra de guardar siempre a la vista).
 *   · Las prendas están quietas y se animan con el cursor encima (PC) o al elegirlas (celular): nada de 200 animaciones a la vez.
 * Este archivo es PURO (recibe todo por props): lo usan el estudio real (app/personalizar/page.tsx) y la galería de pruebas (/dev/closet).
 */
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import Avatar from '../components/cosmetics/Avatar'
import NameText from '../components/cosmetics/NameText'
import ProfileCard from '../components/cosmetics/ProfileCard'
import ItemPreview, { type PreviewSubject } from '../components/cosmetics/ItemPreview'
import ProfileHero from '../perfil/[username]/ProfileHero'
import SampleBlocks from '../components/cosmetics/SampleBlocks'
import { useHoverPlay } from '../components/cosmetics/usePlay'
import { palettesOf, DECO_COLLECTIONS } from '../components/cosmetics/kit'
import { CustomColorPicker } from '../components/ColorPicker'
import MoonRain from '../components/economy/MoonRain'
import { CARD_MODES, PROFILE_PALETTE, profileThemeVars, type CardMode } from '../lib/color'
import { HeartIcon } from '../components/icons'
import { formatNumber } from '../lib/economy'
import { RARITY_LABEL, RARITY_STYLE, useCosmeticFont, type CatalogItem, type CosmeticType, type Equip } from '../lib/cosmetics'

const NameFx = dynamic(() => import('../components/cosmetics/cosmetics').then((m) => m.NameFx), { ssr: false })
const TitlePill = dynamic(() => import('../components/cosmetics/cosmetics').then((m) => m.TitlePill), { ssr: false })
const EntryEffect = dynamic(() => import('../components/cosmetics/cosmetics').then((m) => m.EntryEffect), { ssr: false })

// ───────── Tipos compartidos con la página ─────────
export type Tab = 'color' | 'nombre' | 'avatar' | 'tarjeta' | 'entrada' | 'fondo' | 'titulo'
export type Draft = { profile_color: string | null; name_color: string | null; card_color: string | null; card_mode: CardMode }
export type Look = { avatar_deco: Equip | null; font: string | null; effect: Equip | null; title: Equip | null; card: Equip | null; entry: Equip | null; bg: Equip | null }
export const EMPTY_LOOK: Look = { avatar_deco: null, font: null, effect: null, title: null, card: null, entry: null, bg: null }
export type ClosetInfo = { id_student: string | null; avatar_url: string | null; bio: string | null; grado: string | null; banner_url: string | null; created_at: string }

/** pestaña → tipo de cosmético y pieza del look */
export const SLOT: Record<Exclude<Tab, 'color'>, { type: CosmeticType; key: keyof Look }> = {
  nombre: { type: 'name_effect', key: 'effect' },
  avatar: { type: 'avatar_decoration', key: 'avatar_deco' },
  tarjeta: { type: 'profile_card', key: 'card' },
  entrada: { type: 'entry_effect', key: 'entry' },
  fondo: { type: 'background', key: 'bg' },
  titulo: { type: 'title', key: 'title' },
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'color', label: 'Color', icon: '🎨' },
  { id: 'nombre', label: 'Nombre', icon: 'Aa' },
  { id: 'avatar', label: 'Avatar', icon: '👤' },
  { id: 'tarjeta', label: 'Tarjeta', icon: '🪪' },
  { id: 'entrada', label: 'Entrada', icon: '✨' },
  { id: 'fondo', label: 'Fondo', icon: '🌌' },
  { id: 'titulo', label: 'Título', icon: '🏷️' },
]

const COLL_NAME = new Map<string, string>((DECO_COLLECTIONS as { id: string; name: string }[]).map((c) => [c.id, c.name]))

export type ClosetViewProps = {
  username: string
  userId: string
  info: ClosetInfo
  me: PreviewSubject
  display: string
  draft: Draft
  onDraft: (patch: Partial<Draft>) => void
  look: Look
  savedLook: Look
  items: CatalogItem[]
  lockedIds: Set<string>
  balance: number
  tab: Tab
  onTab: (t: Tab) => void
  onPick: (item: CatalogItem, palette?: string, hue?: number) => void
  onClear: (key: keyof Look) => void
  /** piezas del borrador que todavía no son mías */
  trying: CatalogItem[]
  tryLocked: CatalogItem | undefined
  tryBuy: CatalogItem | undefined
  busy: boolean
  msg: string | null
  dirty: boolean
  onSave: () => void
  onBuy: (item: CatalogItem) => void
  onDiscard: () => void
  onClearTrial: () => void
  rain: boolean
  onRainDone: () => void
  showEntry: number
  onReplayEntry: () => void
  /** enlaces de la cabecera (en la galería de pruebas no hay) */
  links?: boolean
}

// ───────── utilidades ─────────
function useIsDesktop(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(min-width: 1024px)')
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia('(min-width: 1024px)').matches,
    () => true
  )
}

/** Altura real de un elemento fijo (para dejar ese espacio libre al final de la página) */
function useHeight(ref: React.RefObject<HTMLElement | null>): number {
  const [h, setH] = useState(120)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => setH(el.offsetHeight)
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return h
}

// ───────── Colores (circulitos, no píldoras) ─────────
function Swatches({ value, onPick, noneLabel }: { value: string | null; onPick: (hex: string | null) => void; noneLabel: string }) {
  const [custom, setCustom] = useState(false)
  return (
    <div>
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 mb-2">
        <button type="button" onClick={() => onPick(null)} aria-label={noneLabel} title={noneLabel} aria-pressed={value === null}
          className={`aspect-square rounded-full border-2 flex items-center justify-center text-neutral-400 text-lg bg-ink-800 transition ${value === null ? 'border-white scale-105' : 'border-ink-600 hover:border-ink-500'}`}>
          ⌀
        </button>
        {PROFILE_PALETTE.map((c) => {
          const on = value?.toLowerCase() === c.hex.toLowerCase()
          return (
            <button key={c.hex} type="button" onClick={() => onPick(c.hex)} aria-label={c.name} title={c.name} aria-pressed={on}
              className={`aspect-square rounded-full border-2 transition ${on ? 'border-white scale-110 shadow-[0_0_0_3px] shadow-white/20' : 'border-transparent hover:scale-105'}`}
              style={{ background: c.hex }} />
          )
        })}
      </div>
      <button type="button" className="text-sm text-garnet-400 hover:text-garnet-300" onClick={() => setCustom((v) => !v)}>
        {custom ? 'Ocultar selector libre' : 'Elegir otro color…'}
      </button>
      {custom && <div className="mt-2"><CustomColorPicker themed value={value ?? '#C81B3E'} onChange={(hex) => onPick(hex)} /></div>}
    </div>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-ink-700/80 bg-ink-950/40 p-3.5 mb-3">
      <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
      {hint && <p className="text-xs text-neutral-500 mt-0.5 mb-3">{hint}</p>}
      {!hint && <div className="h-2" />}
      {children}
    </section>
  )
}

function ColorBody({ draft, onDraft, cardMode }: { draft: Draft; onDraft: (p: Partial<Draft>) => void; cardMode: boolean }) {
  return (
    <div>
      <Section title="Color de tu perfil" hint="Lo ven todas las personas al entrar a tu perfil (botones, enlaces, íconos). No cambia el color de tu propia app: eso está en Configuración → Apariencia.">
        <Swatches value={draft.profile_color} onPick={(hex) => onDraft({ profile_color: hex })} noneLabel="Color de la app" />
      </Section>
      <Section title="Color de tu nombre" hint="Se ve en publicaciones, comentarios y mensajes. Se ajusta solo para que siempre se pueda leer. Tu @usuario va siempre en texto normal.">
        <Swatches value={draft.name_color} onPick={(hex) => onDraft({ name_color: hex })} noneLabel="Sin color" />
      </Section>
      {cardMode ? (
        <p className="text-xs text-neutral-500 px-1">Llevas una tarjeta de la tienda: ese estilo manda sobre el color de la tarjeta.</p>
      ) : (
        <Section title="Color de tu tarjeta" hint="Gratis. Elige cómo se pinta la tarjeta que envuelve tu biografía.">
          <div className="grid grid-cols-3 gap-2 mb-3">
            {CARD_MODES.map((m) => (
              <button key={m.id} type="button" onClick={() => onDraft({ card_mode: m.id })} aria-pressed={draft.card_mode === m.id}
                className={`rounded-xl border px-2 py-2 text-center transition ${draft.card_mode === m.id ? 'border-garnet-400 bg-garnet-600/15 text-neutral-50' : 'border-ink-700 text-neutral-400 hover:border-ink-500'}`}>
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-[10.5px] text-neutral-500 leading-tight">{m.hint}</p>
              </button>
            ))}
          </div>
          <Swatches value={draft.card_color} onPick={(hex) => onDraft({ card_color: hex })} noneLabel="Sin color" />
        </Section>
      )}
    </div>
  )
}

// ───────── Una prenda del clóset ─────────
function Tile({ i, on, worn, me, balance, locked, onPick }: { i: CatalogItem; on: boolean; worn: boolean; me: PreviewSubject; balance: number; locked: boolean; onPick: (i: CatalogItem) => void }) {
  // quieta; con el cursor encima se anima (PC). En celular se anima la prenda elegida (una sola a la vez).
  const { playing, bind } = useHoverPlay(on)
  const rar = RARITY_STYLE[i.rarity].split(' ')[0]
  return (
    <button type="button" onClick={() => onPick(i)} aria-pressed={on} aria-label={`${i.name}${i.owned ? ', tuyo' : ''}${worn ? ', puesto' : ''}`} {...bind}
      className={`group relative rounded-2xl border text-left overflow-hidden bg-ink-900/70 transition ${on ? 'border-garnet-400 ring-2 ring-garnet-400/50' : `${rar} hover:brightness-125`}`}>
      <div className="relative min-h-[112px] bg-ink-950/60 flex items-center justify-center overflow-hidden">
        <ItemPreview type={i.type} slug={i.slug} me={me} compact lazy playing={playing} />
        {worn && <span className="absolute top-1.5 left-1.5 rounded-full bg-emerald-500/90 text-ink-950 text-[9px] font-bold px-1.5 py-0.5">Puesto</span>}
        {on && <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-garnet-500 text-white text-[11px] font-bold flex items-center justify-center" aria-hidden="true">✓</span>}
      </div>
      <div className="px-2 pt-1.5 pb-2">
        <p className="text-[11.5px] leading-tight text-neutral-100 font-medium truncate">{i.name}</p>
        <p className="text-[10px] mt-0.5 tabular-nums truncate">
          {locked ? <span className="text-fuchsia-300">Lo que viene</span>
            : i.owned ? <span className="text-emerald-400">Tuyo</span>
            : i.price > 0 ? <span className={i.price <= balance ? 'text-amber-300' : 'text-neutral-500'}>{formatNumber(i.price)} ☾</span>
            : <span className="text-neutral-500">{RARITY_LABEL[i.rarity]}</span>}
        </p>
      </div>
    </button>
  )
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-full border border-ink-700 bg-ink-950/60 p-0.5 text-xs" role="tablist">
      {options.map((o) => (
        <button key={o.id} type="button" role="tab" aria-selected={value === o.id} onClick={() => onChange(o.id)}
          className={`px-3 py-1 rounded-full transition whitespace-nowrap ${value === o.id ? 'bg-ink-600 text-white' : 'text-neutral-400 hover:text-neutral-100'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ───────── El cajón abierto: lo que llevas, paleta y prendas ─────────
function ClosetBody({ tab, items, look, savedLook, me, balance, lockedIds, onPick, onClear }: {
  tab: Exclude<Tab, 'color'>
  items: CatalogItem[]
  look: Look
  savedLook: Look
  me: PreviewSubject
  balance: number
  lockedIds: Set<string>
  onPick: (item: CatalogItem, palette?: string, hue?: number) => void
  onClear: (key: keyof Look) => void
}) {
  const slot = SLOT[tab]
  const [sub, setSub] = useState<'efecto' | 'fuente'>('efecto')
  const [view, setView] = useState<'mio' | 'probar'>('mio')
  const [coll, setColl] = useState('')
  const type: CosmeticType = tab === 'nombre' && sub === 'fuente' ? 'font' : slot.type

  const list = useMemo(
    () => items.filter((i) => i.type === type && !(i.type === 'title' && i.obtainable !== 'tienda' && !i.owned) && !(i.obtainable === 'fundador' && !i.owned && i.type !== 'avatar_decoration')),
    [items, type]
  )
  const mine = useMemo(() => list.filter((i) => i.owned), [list])
  const rest = useMemo(() => list.filter((i) => !i.owned), [list])
  // si no tengo nada en este cajón, se abre directo en «Para probar»
  const effView: 'mio' | 'probar' = view === 'mio' && mine.length === 0 && rest.length > 0 ? 'probar' : view
  const base = effView === 'mio' ? mine : rest
  const colls = useMemo(() => [...new Set(base.map((i) => i.collection).filter(Boolean))], [base])
  const shown = useMemo(() => (coll ? base.filter((i) => i.collection === coll) : base), [base, coll])

  const curSlug = type === 'font' ? (look.font ?? 'clasica') : (look[slot.key] as Equip | null)?.id
  const curEq = type === 'font' ? null : (look[slot.key] as Equip | null)
  const curItem = list.find((i) => i.slug === curSlug) ?? null
  const savedSlug = type === 'font' ? (savedLook.font ?? 'clasica') : (savedLook[slot.key] as Equip | null)?.id
  const pals = curItem && type !== 'font' ? palettesOf(curItem.type, curItem.slug) : []
  const wearing = type === 'font' ? look.font : curEq?.id

  return (
    <div>
      {tab === 'nombre' && (
        <div className="mb-3"><Segmented value={sub} onChange={(v) => { setSub(v); setColl(''); setView('mio') }} options={[{ id: 'efecto', label: 'Efectos' }, { id: 'fuente', label: 'Fuentes' }]} /></div>
      )}

      {/* Lo que llevas puesto en este cajón */}
      <div className="flex items-center gap-3 rounded-2xl border border-ink-700/80 bg-ink-950/50 px-3 py-2.5 mb-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Llevas puesto</p>
          <p className="text-sm text-neutral-100 font-medium truncate">{wearing ? (curItem?.name ?? wearing) : type === 'font' ? 'Fuente clásica' : 'Nada todavía'}</p>
        </div>
        {wearing && (
          <button type="button" onClick={() => onClear(type === 'font' ? 'font' : slot.key)} className="press shrink-0 rounded-full border border-ink-600 px-3 py-1.5 text-xs text-neutral-300 hover:bg-ink-800 transition">
            Quitar
          </button>
        )}
      </div>

      {/* Paleta del ítem elegido */}
      {pals.length > 1 && curItem && (
        <div className="rounded-2xl border border-ink-700/80 bg-ink-950/50 px-3 py-2.5 mb-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500 mb-2">Paleta de «{curItem.name}»</p>
          <div className="flex flex-wrap gap-2.5">
            {pals.map((p) => (
              <button key={p.id} type="button" aria-label={`Paleta ${p.name}`} title={p.name} aria-pressed={curEq?.palette === p.id} onClick={() => onPick(curItem, p.id, curEq?.hue ?? 0)}
                className={`h-9 w-9 rounded-full border-2 transition ${curEq?.palette === p.id ? 'border-white scale-110' : 'border-ink-600 hover:border-ink-500'}`}
                style={{ background: `linear-gradient(135deg, ${p.c[0]} 50%, ${p.c[2]} 50%)` }} />
            ))}
          </div>
          {curItem.custom_hue && (
            <label className="block mt-3">
              <span className="text-xs text-neutral-500">Color libre</span>
              <input type="range" min={0} max={355} step={5} value={curEq?.hue ?? 0} aria-label="Color libre" onChange={(e) => onPick(curItem, curEq?.palette, Number(e.target.value))} className="w-full accent-amber-400" />
            </label>
          )}
        </div>
      )}

      {/* Mío / Para probar + colección */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Segmented value={effView} onChange={(v) => { setView(v); setColl('') }}
          options={[{ id: 'mio', label: `Lo mío (${mine.length})` }, { id: 'probar', label: `Para probar (${rest.length})` }]} />
        {colls.length > 1 && (
          <select value={coll} onChange={(e) => setColl(e.target.value)} aria-label="Colección" className="rounded-full bg-ink-800 border border-ink-700 text-neutral-200 text-xs px-3 py-1.5 max-w-[10.5rem]">
            <option value="">Todas las colecciones</option>
            {colls.map((c) => <option key={c} value={c}>{COLL_NAME.get(c) ?? c}</option>)}
          </select>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-neutral-500 py-6 text-center">{list.length === 0 ? 'Todavía no hay nada de esto.' : effView === 'mio' ? 'Aquí todavía no tienes nada. Mira «Para probar» o pásate por la tienda.' : 'No hay nada con ese filtro.'}</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {shown.map((i) => (
            <Tile key={i.id} i={i} on={curSlug === i.slug} worn={savedSlug === i.slug && !!savedSlug && savedSlug !== 'clasica'} me={me} balance={balance} locked={lockedIds.has(i.id)} onPick={(it) => onPick(it)} />
          ))}
        </div>
      )}
      {effView === 'probar' && <p className="text-[11px] text-neutral-600 mt-3">Tocar algo que no es tuyo lo prueba sin gastar nada.</p>}
    </div>
  )
}

// ───────── Cajones (categorías) ─────────
function Drawers({ tab, onTab, look, draft, trying }: { tab: Tab; onTab: (t: Tab) => void; look: Look; draft: Draft; trying: CatalogItem[] }) {
  const worn = (t: Tab): boolean => {
    if (t === 'color') return !!(draft.profile_color || draft.name_color || draft.card_color)
    if (t === 'nombre') return !!(look.effect || look.font)
    return !!look[SLOT[t].key]
  }
  const probing = (t: Tab): boolean => {
    if (t === 'color') return false
    const types: CosmeticType[] = t === 'nombre' ? ['name_effect', 'font'] : [SLOT[t].type]
    return trying.some((i) => types.includes(i.type))
  }
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // el cajón elegido siempre queda a la vista en la fila deslizable del celular
    ref.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [tab])
  return (
    <div ref={ref} role="tablist" aria-label="Cajones del clóset" className="flex lg:grid lg:grid-cols-7 gap-1.5 overflow-x-auto lg:overflow-visible pb-1 -mx-1 px-1 snap-x [scrollbar-width:none]">
      {TABS.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => onTab(t.id)}
          className={`relative snap-center shrink-0 lg:shrink min-w-[60px] flex flex-col items-center gap-0.5 rounded-xl border px-2 py-1.5 transition ${tab === t.id ? 'bg-garnet-600 border-garnet-400 text-white' : 'bg-ink-800/70 border-ink-700 text-neutral-300 hover:bg-ink-700'}`}>
          <span className={`leading-none ${t.icon === 'Aa' ? 'text-[15px] font-bold font-display h-[18px]' : 'text-[17px] h-[18px]'}`} aria-hidden="true">{t.icon}</span>
          <span className="text-[10.5px] leading-tight">{t.label}</span>
          {probing(t.id) ? <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-fuchsia-400" title="Probando" />
            : worn(t.id) ? <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-300" title="Llevas algo" /> : null}
        </button>
      ))}
    </div>
  )
}

// ───────── Vista previa (la misma estructura del perfil real) ─────────
function Stage({ props: p }: { props: ClosetViewProps }) {
  const { look, draft, info, username, userId, display } = p
  const cardMode = !!look.card
  const fontFam = useCosmeticFont(look.font)
  const themeVars = profileThemeVars(draft.profile_color)
  const nameFxNode = look.effect ? <NameFx effect={look.effect} text={display} density="full" fontFamily={fontFam} /> : <NameText name={display} color={draft.name_color} nameStyle={{ font: look.font }} density="full" />
  return (
    <div className={`relative isolate min-w-0 rounded-2xl border border-ink-700 bg-ink-950 overflow-hidden ${themeVars ? 'profile-theme' : ''}`} style={themeVars}>
      {look.bg && (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0"><ItemPreview type="background" slug={look.bg.id} palette={look.bg.palette} hue={look.bg.hue} me={p.me} /></div>
          <div className="absolute inset-0 bg-ink-950/55" />
        </div>
      )}
      {look.entry && p.showEntry > 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-64 overflow-hidden"><EntryEffect key={p.showEntry} effect={look.entry} className="w-full h-full" /></div>
      )}
      <div className="relative z-10">
        {cardMode ? (
          // La MISMA estructura del perfil real: banner arriba (tuyo) + tarjeta que envuelve avatar, nombre, bio, chips y contadores
          <ProfileHero
            profile={{ id: userId, username, id_student: info.id_student, bio: info.bio, avatar_url: info.avatar_url, banner_url: info.banner_url, badge_color: null, is_frozen: false, created_at: info.created_at, name_color: draft.name_color }}
            cos={{ deco: look.avatar_deco, nameStyle: { font: look.font, effect: look.effect }, title: look.title, card: look.card }}
            isMyProfile roles={[]} clubTags={[]} ringStatus={undefined} userId={userId}
            isFollowing={false} followsMe={false} iBlockedThem={false} onFollowChange={() => {}} onBlockChange={() => {}} badges={[]}
          >
            <SampleBlocks bio={info.bio} grado={info.grado ?? undefined} />
          </ProfileHero>
        ) : (
          <>
            <div className="h-24 bg-gradient-to-br from-garnet-700/50 to-ink-900" style={info.banner_url ? { backgroundImage: `url(${info.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} />
            <div className="px-4">
              <div className="flex items-end justify-between -mt-10 mb-3">
                <Avatar username={username} avatarUrl={info.avatar_url} size="w-20 h-20" sizes="96px" textSize="text-2xl" photoClassName="border-4 border-ink-950 shadow-[0_0_0_2px] shadow-garnet-500/45" deco={look.avatar_deco} decoContext="profile" />
                <span className="rounded-full bg-garnet-600 text-white text-sm font-semibold px-4 py-1.5">Seguir</span>
              </div>
              <h2 className="font-display text-xl font-semibold text-neutral-50 leading-tight break-words">{nameFxNode}</h2>
              <p className="text-sm text-neutral-500 mb-1">@{username}</p>
              {look.title && <div className="mb-2"><TitlePill title={look.title} /></div>}
            </div>
          </>
        )}
        <div className="px-4 pb-4 mt-3">
          {!cardMode && (
            <ProfileCard color={draft.card_color} mode={draft.card_mode} solid={!!look.bg}>
              <p className="text-sm text-neutral-200 mb-3 leading-relaxed">{info.bio || 'Así se verá tu biografía dentro de la tarjeta.'}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {info.grado && <span className="bg-ink-800/70 border border-ink-700 text-neutral-300 text-xs px-3 py-1.5 rounded-full">{info.grado}</span>}
                <span className="inline-flex items-center gap-1.5 bg-ink-800/70 border border-ink-700 text-neutral-300 text-xs px-3 py-1.5 rounded-full"><HeartIcon className="w-3.5 h-3.5 text-garnet-400" />Estado</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm"><span><b className="text-neutral-100">12</b> <span className="text-neutral-500">publicaciones</span></span><span className="text-garnet-400">enlaces y botones</span></div>
            </ProfileCard>
          )}
          <div className="rounded-xl border border-ink-800 bg-ink-950/70 p-3 flex items-center gap-2.5 min-w-0">
            <Avatar username={username} avatarUrl={info.avatar_url} size="w-10 h-10" sizes="48px" textSize="text-sm" deco={look.avatar_deco} decoContext="profile" />
            <div className="min-w-0"><NameText name={display} color={draft.name_color} nameStyle={{ font: look.font, effect: look.effect }} density="lite" className="text-[15px] font-bold text-neutral-50" /><p className="text-xs text-neutral-500">así se ve tu nombre en publicaciones</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3">
            {['w-7 h-7', 'w-10 h-10', 'w-[52px] h-[52px]', 'w-20 h-20'].map((s) => <Avatar key={s} username={username} avatarUrl={info.avatar_url} size={s} sizes="96px" textSize="text-xs" deco={look.avatar_deco} decoContext="profile" />)}
            <span className="text-xs text-neutral-600">tamaños del avatar</span>
          </div>
          {look.entry && <button type="button" onClick={p.onReplayEntry} className="mt-3 text-sm text-garnet-400 hover:text-garnet-300">▶ Ver el efecto de entrada</button>}
        </div>
      </div>
    </div>
  )
}

// ───────── Barra de abajo: probador y guardar ─────────
function ActionBar({ p }: { p: ClosetViewProps }) {
  const { trying, tryBuy, tryLocked, balance, busy, dirty } = p
  return (
    <div className="px-3 sm:px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-x-3 gap-y-2">
        {trying.length > 0 ? (
          <>
            <p className="text-sm text-neutral-200 flex-1 min-w-[10rem]">
              Probando <b>«{trying.map((t) => t.name).join('», «')}»</b>
              {tryLocked && <span className="block text-xs text-fuchsia-300">Es de lo que viene: todavía no se puede guardar.</span>}
              {tryBuy && balance < tryBuy.price && <span className="block text-xs text-amber-300">Te faltan {formatNumber(tryBuy.price - balance)} ☾ — <Link href="/misiones" className="underline">mira tus misiones</Link></span>}
            </p>
            {tryBuy && (
              <button type="button" disabled={busy || balance < tryBuy.price} onClick={() => p.onBuy(tryBuy)} className="press rounded-xl bg-amber-400 hover:bg-amber-300 disabled:bg-ink-700 disabled:text-neutral-500 text-ink-950 font-bold px-4 py-2.5 text-sm">
                Comprar por {formatNumber(tryBuy.price)} ☾
              </button>
            )}
            <button type="button" onClick={p.onClearTrial} className="text-sm text-neutral-400 hover:text-neutral-100 px-1">Quitar prueba</button>
          </>
        ) : (
          <>
            <button type="button" onClick={p.onSave} disabled={!dirty || busy} className="press rounded-xl bg-garnet-600 hover:bg-garnet-500 disabled:opacity-40 text-white font-semibold px-5 py-2.5 transition">{busy ? 'Guardando…' : 'Guardar cambios'}</button>
            {dirty && <button type="button" onClick={p.onDiscard} className="text-sm text-neutral-400 hover:text-neutral-100 px-1">Descartar</button>}
            <span className="ml-auto inline-flex items-center gap-1 text-sm text-amber-200 tabular-nums rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1">☾ {formatNumber(balance)}</span>
          </>
        )}
        {p.msg && <p className="basis-full text-sm text-neutral-300" role="status">{p.msg}</p>}
      </div>
    </div>
  )
}

// ───────── Todo junto ─────────
export default function ClosetView(p: ClosetViewProps) {
  const desktop = useIsDesktop()
  const [open, setOpen] = useState(true)
  const dockRef = useRef<HTMLDivElement>(null)
  const dockH = useHeight(dockRef)
  const cardMode = !!p.look.card

  const selectTab = (t: Tab) => {
    p.onTab(t)
    setOpen(true)
  }
  const body = p.tab === 'color'
    ? <ColorBody draft={p.draft} onDraft={p.onDraft} cardMode={cardMode} />
    : <ClosetBody key={p.tab} tab={p.tab} items={p.items} look={p.look} savedLook={p.savedLook} me={p.me} balance={p.balance} lockedIds={p.lockedIds} onPick={p.onPick} onClear={p.onClear} />

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 pt-5" style={{ paddingBottom: desktop ? 112 : dockH + 20 }}>
      <MoonRain show={p.rain} onDone={p.onRainDone} />
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-neutral-50 leading-tight">Mi clóset</h1>
          <p className="text-xs text-neutral-500">Elige, pruébate y guarda. Lo guardado lo ve todo el mundo en tu perfil.</p>
        </div>
        {p.links !== false && (
          <div className="flex items-center gap-4 text-sm shrink-0">
            <Link href="/tienda" className="text-amber-300 hover:text-amber-200">Tienda</Link>
            <Link href={`/perfil/${p.username}`} className="text-neutral-400 hover:text-neutral-100 hidden sm:inline">Ver mi perfil →</Link>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_400px] gap-5 items-start">
        <Stage props={p} />

        {/* PC: el clóset es una columna fija a la derecha */}
        {desktop && (
          <aside className="min-w-0 rounded-2xl border border-ink-700 bg-ink-900/50 p-3.5 lg:sticky lg:top-4 flex flex-col max-h-[calc(100dvh-8.5rem)]" aria-label="Clóset">
            <Drawers tab={p.tab} onTab={p.onTab} look={p.look} draft={p.draft} trying={p.trying} />
            <div className="mt-3 overflow-y-auto pr-1 -mr-1 min-h-0">{body}</div>
          </aside>
        )}
      </div>

      {/* Fijo abajo: en celular lleva el cajón del clóset; en todos, probador y guardar */}
      <div ref={dockRef} className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-700 bg-ink-950/95 backdrop-blur">
        {!desktop && (
          <div aria-label="Clóset">
            <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? 'Cerrar el clóset' : 'Abrir el clóset'} className="w-full flex items-center justify-center pt-1.5 pb-0.5">
              <span className="block w-10 h-1 rounded-full bg-ink-600" />
              <span className="sr-only">{open ? 'Cerrar el clóset' : 'Abrir el clóset'}</span>
            </button>
            <div className="px-3 pb-2"><Drawers tab={p.tab} onTab={selectTab} look={p.look} draft={p.draft} trying={p.trying} /></div>
            {open && <div className="px-3 pb-3 overflow-y-auto overscroll-contain h-[min(42dvh,400px)] border-t border-ink-800 pt-3">{body}</div>}
          </div>
        )}
        <div className="border-t border-ink-800"><ActionBar p={p} /></div>
      </div>
    </div>
  )
}
