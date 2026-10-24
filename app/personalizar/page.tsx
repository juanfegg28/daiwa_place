'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell, { useAppSession } from '../components/AppShell'
import Avatar from '../components/cosmetics/Avatar'
import NameText from '../components/cosmetics/NameText'
import ProfileCard from '../components/cosmetics/ProfileCard'
import ItemPreview from '../components/cosmetics/ItemPreview'
import ProfileHero from '../perfil/[username]/ProfileHero'
import SampleBlocks from '../components/cosmetics/SampleBlocks'
import { useShopData } from '../components/cosmetics/useShopData'
import { palettesOf } from '../components/cosmetics/kit'
import { CustomColorPicker } from '../components/ColorPicker'
import MoonRain from '../components/economy/MoonRain'
import { supabase } from '../lib/supabaseClient'
import { CARD_MODES, PROFILE_PALETTE, profileThemeVars, type CardMode } from '../lib/color'
import { isValidHex } from '../lib/theme'
import { HeartIcon } from '../components/icons'
import { refreshWallet, subscribeWallet, formatNumber, type WalletSummary } from '../lib/economy'
import { setAllowNextKits } from '../lib/cosmeticsRelease'
import { RARITY_LABEL, RARITY_STYLE, saveLook, shopBuy, useCosmeticFont, type CatalogItem, type CosmeticType, type Equip, type LookConfig } from '../lib/cosmetics'

const NameFx = dynamic(() => import('../components/cosmetics/cosmetics').then((m) => m.NameFx), { ssr: false })
const TitlePill = dynamic(() => import('../components/cosmetics/cosmetics').then((m) => m.TitlePill), { ssr: false })
const EntryEffect = dynamic(() => import('../components/cosmetics/cosmetics').then((m) => m.EntryEffect), { ssr: false })

type Tab = 'color' | 'nombre' | 'avatar' | 'tarjeta' | 'entrada' | 'fondo' | 'titulo'
type Draft = { profile_color: string | null; name_color: string | null; card_color: string | null; card_mode: CardMode }
type Look = { avatar_deco: Equip | null; font: string | null; effect: Equip | null; title: Equip | null; card: Equip | null; entry: Equip | null; bg: Equip | null }
const EMPTY_LOOK: Look = { avatar_deco: null, font: null, effect: null, title: null, card: null, entry: null, bg: null }

/** pestaña → tipo de cosmético y pieza del look */
const SLOT: Record<Exclude<Tab, 'color'>, { type: CosmeticType; key: keyof Look }> = {
  nombre: { type: 'name_effect', key: 'effect' },
  avatar: { type: 'avatar_decoration', key: 'avatar_deco' },
  tarjeta: { type: 'profile_card', key: 'card' },
  entrada: { type: 'entry_effect', key: 'entry' },
  fondo: { type: 'background', key: 'bg' },
  titulo: { type: 'title', key: 'title' },
}

export default function PersonalizarPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <PersonalizarContent />
      </Suspense>
    </AppShell>
  )
}

function Swatches({ value, onPick, allowNone }: { value: string | null; onPick: (hex: string | null) => void; allowNone?: string }) {
  const [custom, setCustom] = useState(false)
  return (
    <div>
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mb-3">
        {allowNone && (
          <button type="button" onClick={() => onPick(null)} aria-label={allowNone} title={allowNone}
            className={`h-9 rounded-full border-2 text-[10px] text-neutral-400 ${value === null ? 'border-garnet-400' : 'border-ink-600'} bg-ink-800`}>
            Ninguno
          </button>
        )}
        {PROFILE_PALETTE.map((c) => (
          <button key={c.hex} type="button" onClick={() => onPick(c.hex)} aria-label={c.name} title={c.name}
            className={`h-9 rounded-full border-2 transition ${value?.toLowerCase() === c.hex.toLowerCase() ? 'border-white scale-110' : 'border-transparent'}`}
            style={{ background: c.hex }} />
        ))}
      </div>
      <button type="button" className="text-sm text-garnet-400 hover:text-garnet-300 mb-3" onClick={() => setCustom((v) => !v)}>
        {custom ? 'Ocultar selector libre' : 'Elegir otro color…'}
      </button>
      {custom && <CustomColorPicker themed value={value ?? '#C81B3E'} onChange={(hex) => onPick(hex)} />}
    </div>
  )
}


function PersonalizarContent() {
  const { userId, username, loading, refresh } = useAppSession()
  const router = useRouter()
  const params = useSearchParams()
  const shop = useShopData({ preview: true })
  const [w, setW] = useState<WalletSummary | null>(null)
  const [tab, setTab] = useState<Tab>('color')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saved, setSaved] = useState<Draft | null>(null)
  const [look, setLook] = useState<Look>(EMPTY_LOOK)
  const [savedLook, setSavedLook] = useState<Look>(EMPTY_LOOK)
  const [info, setInfo] = useState<{ id_student: string | null; avatar_url: string | null; bio: string | null; grado: string | null; banner_url: string | null; created_at: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [rain, setRain] = useState(false)
  const [showEntry, setShowEntry] = useState(0)
  const [, setPending] = useState<string | null>(null) // ítem que se está probando (id)

  useEffect(() => {
    if (!loading && !userId) router.replace('/login')
  }, [loading, userId, router])
  useEffect(() => {
    if (!userId) return
    return subscribeWallet(setW)
  }, [userId])

  // La cuenta del equipo con acceso total ve también lo que viene (solo para probar, nunca se guarda)
  const upcoming = shop.upcoming
  useEffect(() => {
    setAllowNextKits(upcoming.length > 0)
    return () => setAllowNextKits(false)
  }, [upcoming.length])

  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('id_student, avatar_url, bio, grado, banner_url, created_at, profile_color, name_color, card_color, card_mode')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        const d = data as (Draft & { id_student: string | null; avatar_url: string | null; bio: string | null; grado: string | null; banner_url: string | null; created_at: string }) | null
        if (!d) return
        const base: Draft = { profile_color: d.profile_color, name_color: d.name_color, card_color: d.card_color, card_mode: (d.card_mode as CardMode) || 'suave' }
        setDraft(base)
        setSaved(base)
        setInfo({ id_student: d.id_student, avatar_url: d.avatar_url, bio: d.bio, grado: d.grado, banner_url: d.banner_url, created_at: d.created_at })
      })
  }, [userId])

  // lo que llevo puesto hoy (de la base) → borrador inicial (se recalcula solo cuando cambia lo guardado)
  const [wornKey, setWornKey] = useState('')
  const key = JSON.stringify(shop.worn)
  if (key !== wornKey) {
    const wn = shop.worn
    const l: Look = { avatar_deco: wn.avatar_deco, font: wn.name_style?.font ?? null, effect: wn.name_style?.effect ?? null, title: wn.title_style, card: wn.card_style, entry: wn.entry_effect, bg: wn.profile_bg }
    setWornKey(key)
    setSavedLook(l)
    setLook(l)
  }

  const all: CatalogItem[] = useMemo(() => [...shop.catalog, ...upcoming], [shop.catalog, upcoming])
  const bySlug = (type: CosmeticType, slug: string | null | undefined) => (slug ? all.find((i) => i.type === type && i.slug === slug) ?? null : null)

  // ?probar=tipo:slug:paleta:hue (viene de «Probar en mi perfil» en la tienda): se aplica una sola vez
  const probar = params.get('probar')
  const [probed, setProbed] = useState('')
  if (probar && all.length > 0 && probed !== probar) {
    setProbed(probar)
    const [type, slug, palette, hue] = probar.split(':')
    const item = all.find((i) => i.type === type && i.slug === slug)
    if (item) {
      const tabFor = (Object.entries(SLOT).find(([, v]) => v.type === item.type)?.[0] as Tab | undefined) ?? (item.type === 'font' ? 'nombre' : undefined)
      if (tabFor) setTab(tabFor)
      pick(item, palette || undefined, hue ? Number(hue) : 0)
    }
  }

  const dirtyColors = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved])
  const dirtyLook = useMemo(() => JSON.stringify(look) !== JSON.stringify(savedLook), [look, savedLook])
  const fontFam = useCosmeticFont(look.font)
  if (loading || !userId || !draft || !info) return null

  const themeVars = profileThemeVars(draft.profile_color)
  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch })
  const display = info.id_student || username || 'Tu nombre'

  // elegir un cosmético: si no es mío, se PRUEBA (borrador) y se puede comprar desde la barra de abajo
  function pick(item: CatalogItem, palette?: string, hue = 0) {
    const eq: Equip = { id: item.slug, ...(palette ?? palettesOf(item.type, item.slug)[0]?.id ? { palette: palette ?? palettesOf(item.type, item.slug)[0]?.id } : {}), ...(hue ? { hue } : {}) }
    setLook((l) => {
      if (item.type === 'font') return { ...l, font: item.slug === 'clasica' ? null : item.slug }
      const s = Object.values(SLOT).find((v) => v.type === item.type)
      return s ? { ...l, [s.key]: eq } : l
    })
    setPending(item.owned ? null : item.id)
    if (item.type === 'entry_effect') setShowEntry((n) => n + 1)
  }
  function clear(key: keyof Look) {
    setLook((l) => ({ ...l, [key]: null }))
    setPending(null)
  }

  // piezas del borrador que NO son mías (se están probando)
  const trying: CatalogItem[] = ([
    bySlug('avatar_decoration', look.avatar_deco?.id), bySlug('name_effect', look.effect?.id), bySlug('title', look.title?.id),
    bySlug('profile_card', look.card?.id), bySlug('entry_effect', look.entry?.id), bySlug('background', look.bg?.id), bySlug('font', look.font),
  ].filter(Boolean) as CatalogItem[]).filter((i) => !i.owned)
  const tryLocked = trying.find((i) => !shop.catalog.some((c) => c.id === i.id)) // viene de «lo que viene»: no se puede guardar
  const tryBuy = trying.find((i) => i.obtainable === 'tienda' && i.price > 0 && !tryLocked)
  const balance = w?.balance ?? 0

  async function buyTrying(item: CatalogItem) {
    setBusy(true); setMsg(null)
    const { error } = await shopBuy(item.id, item.price)
    setBusy(false)
    if (error) return setMsg(error)
    setRain(true); refreshWallet(true); setPending(null)
    await shop.reload()
    setMsg(`¡${item.name} es tuyo! Ya puedes guardarlo.`)
  }

  async function save() {
    if (!draft) return
    for (const k of ['profile_color', 'name_color', 'card_color'] as const) {
      const v = draft[k]
      if (v && !isValidHex(v)) return setMsg('Hay un color con formato incorrecto')
    }
    if (trying.length > 0) return setMsg('Hay cosas que todavía no son tuyas: cómpralas o quítalas para guardar.')
    setBusy(true); setMsg(null)
    if (dirtyLook) {
      const cfg: LookConfig = {}
      if (JSON.stringify(look.avatar_deco) !== JSON.stringify(savedLook.avatar_deco)) cfg.avatar_deco = look.avatar_deco
      if (look.font !== savedLook.font) cfg.name_font = look.font
      if (JSON.stringify(look.effect) !== JSON.stringify(savedLook.effect)) cfg.name_effect = look.effect
      if (JSON.stringify(look.title) !== JSON.stringify(savedLook.title)) cfg.title = look.title
      if (JSON.stringify(look.card) !== JSON.stringify(savedLook.card)) cfg.card = look.card
      if (JSON.stringify(look.entry) !== JSON.stringify(savedLook.entry)) cfg.entry = look.entry
      if (JSON.stringify(look.bg) !== JSON.stringify(savedLook.bg)) cfg.background = look.bg
      const { error } = await saveLook(cfg)
      if (error) { setBusy(false); return setMsg(error) }
      setSavedLook(look)
    }
    if (dirtyColors) {
      const { error } = await supabase.from('profiles').update(draft).eq('id', userId)
      if (error) { setBusy(false); return setMsg('No se pudo guardar: ' + error.message) }
      setSaved(draft)
    }
    setBusy(false)
    setMsg('¡Guardado! Ya lo ven todos en tu perfil.')
    refresh()
    shop.reload()
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'color', label: 'Color' }, { id: 'nombre', label: 'Nombre' }, { id: 'avatar', label: 'Avatar' }, { id: 'tarjeta', label: 'Tarjeta' },
    { id: 'entrada', label: 'Entrada' }, { id: 'fondo', label: 'Fondo' }, { id: 'titulo', label: 'Título' },
  ]
  const cardMode = !!look.card
  const dirty = dirtyColors || dirtyLook
  const nameFxNode = look.effect ? <NameFx effect={look.effect} text={display} density="full" fontFamily={fontFam} /> : <NameText name={display} color={draft.name_color} nameStyle={{ font: look.font }} density="full" />

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28">
      <MoonRain show={rain} onDone={() => setRain(false)} />
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-semibold text-neutral-50">Personalizar</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/tienda" className="text-amber-300 hover:text-amber-200">Tienda</Link>
          <Link href={`/perfil/${username ?? ''}`} className="text-neutral-400 hover:text-neutral-100">Ver mi perfil →</Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Vista previa en vivo: la MISMA estructura del perfil real */}
        <div className={`relative isolate rounded-2xl border border-ink-700 bg-ink-950 overflow-hidden ${themeVars ? 'profile-theme' : ''}`} style={themeVars}>
          {look.bg && <div className="absolute inset-0 z-0"><div className="absolute inset-0"><ItemPreview type="background" slug={look.bg.id} palette={look.bg.palette} hue={look.bg.hue} me={shop.me} /></div><div className="absolute inset-0 bg-ink-950/55" /></div>}
          {look.entry && showEntry > 0 && <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-64 overflow-hidden"><EntryEffect key={showEntry} effect={look.entry} className="w-full h-full" /></div>}
          <div className="relative z-10">
            {cardMode ? (
              // La MISMA estructura del perfil real: banner arriba (tuyo) + tarjeta que envuelve avatar, nombre, bio, chips y contadores
              <ProfileHero
                profile={{ id: userId, username: username ?? 'tu_usuario', id_student: info.id_student, bio: info.bio, avatar_url: info.avatar_url, banner_url: info.banner_url, badge_color: null, is_frozen: false, created_at: info.created_at, name_color: draft.name_color }}
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
                    <Avatar username={username ?? '?'} avatarUrl={info.avatar_url} size="w-20 h-20" sizes="96px" textSize="text-2xl" photoClassName="border-4 border-ink-950 shadow-[0_0_0_2px] shadow-garnet-500/45" deco={look.avatar_deco} decoContext="profile" />
                    <span className="rounded-full bg-garnet-600 text-white text-sm font-semibold px-4 py-1.5">Seguir</span>
                  </div>
                  <h2 className="font-display text-xl font-semibold text-neutral-50 leading-tight">{nameFxNode}</h2>
                  <p className="text-sm text-neutral-500 mb-1">@{username}</p>
                  {look.title && <div className="mb-2"><TitlePill title={look.title} /></div>}
                </div>
              </>
            )}
            <div className="px-4 pb-4 mt-3">
              {!cardMode && <ProfileCard color={draft.card_color} mode={draft.card_mode} solid={!!look.bg}>
                {!cardMode && <p className="text-sm text-neutral-200 mb-3 leading-relaxed">{info.bio || 'Así se verá tu biografía dentro de la tarjeta.'}</p>}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {info.grado && <span className="bg-ink-800/70 border border-ink-700 text-neutral-300 text-xs px-3 py-1.5 rounded-full">{info.grado}</span>}
                  <span className="inline-flex items-center gap-1.5 bg-ink-800/70 border border-ink-700 text-neutral-300 text-xs px-3 py-1.5 rounded-full"><HeartIcon className="w-3.5 h-3.5 text-garnet-400" />Estado</span>
                </div>
                <div className="flex gap-4 text-sm"><span><b className="text-neutral-100">12</b> <span className="text-neutral-500">publicaciones</span></span><span className="text-garnet-400">enlaces y botones</span></div>
              </ProfileCard>}
              <div className="rounded-xl border border-ink-800 bg-ink-950/70 p-3 flex items-center gap-2.5">
                <Avatar username={username ?? '?'} avatarUrl={info.avatar_url} size="w-10 h-10" sizes="48px" textSize="text-sm" deco={look.avatar_deco} decoContext="profile" />
                <div className="min-w-0"><NameText name={display} color={draft.name_color} nameStyle={{ font: look.font, effect: look.effect }} density="lite" className="text-[15px] font-bold text-neutral-50" /><p className="text-xs text-neutral-500">así se ve tu nombre en publicaciones</p></div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                {['w-7 h-7', 'w-10 h-10', 'w-[52px] h-[52px]', 'w-20 h-20'].map((s) => <Avatar key={s} username={username ?? '?'} avatarUrl={info.avatar_url} size={s} sizes="96px" textSize="text-xs" deco={look.avatar_deco} decoContext="profile" />)}
                <span className="text-xs text-neutral-600">tamaños del avatar</span>
              </div>
              {look.entry && <button type="button" onClick={() => setShowEntry((n) => n + 1)} className="mt-3 text-sm text-garnet-400 hover:text-garnet-300">▶ Ver el efecto de entrada</button>}
            </div>
          </div>
        </div>

        {/* Panel */}
        <div className="rounded-2xl border border-ink-700 bg-ink-900/50 p-4 h-fit lg:sticky lg:top-4">
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1" role="tablist">
            {tabs.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`px-3.5 py-1.5 rounded-full text-sm border whitespace-nowrap transition ${tab === t.id ? 'bg-garnet-600 text-white border-garnet-500' : 'bg-ink-800/70 border-ink-700 text-neutral-300 hover:bg-ink-700'}`}>{t.label}</button>
            ))}
          </div>

          {tab === 'color' && (
            <>
              <p className="text-xs text-neutral-500 mb-3">Este color lo ven <b>todas las personas</b> al entrar a tu perfil (botones, enlaces, íconos). No cambia el color de tu propia aplicación: eso sigue en Configuración → Apariencia.</p>
              <Swatches value={draft.profile_color} onPick={(hex) => set({ profile_color: hex })} allowNone="Color de la app" />
              <p className="text-sm font-medium text-neutral-200 mt-4 mb-1">Color del nombre</p>
              <p className="text-xs text-neutral-500 mb-3">Se ve en publicaciones, comentarios y mensajes. Se ajusta solo para que siempre se pueda leer. Tu @usuario siempre va en texto normal.</p>
              <Swatches value={draft.name_color} onPick={(hex) => set({ name_color: hex })} allowNone="Sin color" />
              {!cardMode && (
                <>
                  <p className="text-sm font-medium text-neutral-200 mt-4 mb-1">Color de la tarjeta (gratis)</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {CARD_MODES.map((m) => (
                      <button key={m.id} onClick={() => set({ card_mode: m.id })} className={`rounded-xl border px-2 py-2 text-center transition ${draft.card_mode === m.id ? 'border-garnet-400 bg-garnet-600/15 text-neutral-50' : 'border-ink-700 text-neutral-400'}`}>
                        <p className="text-sm font-medium">{m.label}</p><p className="text-[10.5px] text-neutral-500">{m.hint}</p>
                      </button>
                    ))}
                  </div>
                  <Swatches value={draft.card_color} onPick={(hex) => set({ card_color: hex })} allowNone="Sin color" />
                </>
              )}
              {cardMode && <p className="text-xs text-neutral-500 mt-4">Llevas una tarjeta de la tienda: ese estilo manda sobre el color de la tarjeta.</p>}
            </>
          )}

          {tab !== 'color' && <CosmeticPicker tab={tab} items={all} look={look} me={shop.me} balance={balance} lockedIds={new Set(upcoming.map((u) => u.id))}
            onPick={pick} onClear={clear} />}

          {msg && <p className="text-sm text-neutral-300 mt-3" role="status">{msg}</p>}
          <p className="text-[11px] text-neutral-600 mt-4">Lo que ven los demás es lo guardado; la vista previa es un borrador. Tocar algo que no es tuyo lo prueba sin gastar nada.</p>
        </div>
      </div>

      {/* Barra fija: probador y guardar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-700 bg-ink-950/95 backdrop-blur px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-3">
          {trying.length > 0 ? (
            <>
              <p className="text-sm text-neutral-200 flex-1 min-w-[12rem]">
                Probando <b>«{trying.map((t) => t.name).join('», «')}»</b>
                {tryLocked && <span className="block text-xs text-fuchsia-300">Es de lo que viene: todavía no se puede guardar.</span>}
                {tryBuy && balance < tryBuy.price && <span className="block text-xs text-amber-300">Te faltan {formatNumber(tryBuy.price - balance)} ☾ — <Link href="/misiones" className="underline">mira tus misiones</Link></span>}
              </p>
              {tryBuy && (
                <button type="button" disabled={busy || balance < tryBuy.price} onClick={() => buyTrying(tryBuy)} className="press rounded-xl bg-amber-400 hover:bg-amber-300 disabled:bg-ink-700 disabled:text-neutral-500 text-ink-950 font-bold px-4 py-2.5">
                  Comprar por {formatNumber(tryBuy.price)} ☾
                </button>
              )}
              <button type="button" onClick={() => { setLook(savedLook); setPending(null) }} className="text-sm text-neutral-400 hover:text-neutral-100">Quitar prueba</button>
            </>
          ) : (
            <>
              <button onClick={save} disabled={!dirty || busy} className="press rounded-xl bg-garnet-600 hover:bg-garnet-500 disabled:opacity-40 text-white font-semibold px-5 py-2.5 transition">{busy ? 'Guardando…' : 'Guardar cambios'}</button>
              {dirty && <button onClick={() => { setDraft(saved); setLook(savedLook) }} className="text-sm text-neutral-400 hover:text-neutral-100">Descartar</button>}
              <span className="ml-auto text-sm text-amber-200 tabular-nums">☾ {formatNumber(balance)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Cuadrícula de cosméticos de una pestaña: primero lo mío, luego lo que se puede probar y comprar */
function CosmeticPicker({ tab, items, look, me, balance, lockedIds, onPick, onClear }: {
  tab: Exclude<Tab, 'color'>
  items: CatalogItem[]
  look: Look
  me: ReturnType<typeof useShopData>['me']
  balance: number
  lockedIds: Set<string>
  onPick: (item: CatalogItem, palette?: string, hue?: number) => void
  onClear: (key: keyof Look) => void
}) {
  const slot = SLOT[tab]
  const [sub, setSub] = useState<'efecto' | 'fuente'>('efecto')
  const type: CosmeticType = tab === 'nombre' && sub === 'fuente' ? 'font' : slot.type
  const list = items.filter((i) => i.type === type && !(i.type === 'title' && i.obtainable !== 'tienda' && !i.owned) && !(i.obtainable === 'fundador' && !i.owned && i.type !== 'avatar_decoration'))
  const mine = list.filter((i) => i.owned)
  const rest = list.filter((i) => !i.owned)
  const cur: Equip | string | null = type === 'font' ? look.font : (look[slot.key] as Equip | null)
  const curSlug = type === 'font' ? (look.font ?? 'clasica') : (look[slot.key] as Equip | null)?.id
  const curItem = list.find((i) => i.slug === curSlug)
  const pals = curItem && type !== 'font' ? palettesOf(curItem.type, curItem.slug) : []
  const curEq = typeof cur === 'object' ? cur : null
  const Tile = ({ i }: { i: CatalogItem }) => {
    const on = curSlug === i.slug
    return (
      <button type="button" onClick={() => onPick(i)} aria-pressed={on}
        className={`rounded-xl border text-left overflow-hidden transition ${on ? 'border-garnet-400 ring-2 ring-garnet-400/40' : RARITY_STYLE[i.rarity].split(' ')[0] + ' hover:brightness-125'}`}>
        <div className="bg-ink-950/60 min-h-[88px] flex items-center justify-center"><ItemPreview type={i.type} slug={i.slug} me={me} compact /></div>
        <p className="px-2 py-1 text-[11px] text-neutral-200 truncate">{i.name}</p>
        <p className="px-2 pb-1.5 text-[10px] text-neutral-500 tabular-nums">
          {lockedIds.has(i.id) ? <span className="text-fuchsia-300">Lo que viene</span> : i.owned ? <span className="text-emerald-400">Tuyo</span> : i.price > 0 ? <span className={i.price <= balance ? 'text-amber-300' : ''}>{formatNumber(i.price)} ☾</span> : RARITY_LABEL[i.rarity]}
        </p>
      </button>
    )
  }
  return (
    <div>
      {tab === 'nombre' && (
        <div className="flex gap-1.5 mb-3">
          {(['efecto', 'fuente'] as const).map((s) => (
            <button key={s} onClick={() => setSub(s)} className={`px-3 py-1 rounded-full text-xs border ${sub === s ? 'bg-ink-700 border-ink-500 text-white' : 'border-ink-700 text-neutral-400'}`}>{s === 'efecto' ? 'Efectos' : 'Fuentes'}</button>
          ))}
        </div>
      )}
      <button type="button" onClick={() => (type === 'font' ? onClear('font') : onClear(slot.key))} className="text-xs text-neutral-400 hover:text-neutral-100 mb-2">Quitar {type === 'font' ? 'fuente' : 'el que llevo'}</button>
      {pals.length > 1 && curItem && (
        <div className="mb-3">
          <p className="text-xs text-neutral-500 mb-1.5">Paleta</p>
          <div className="flex flex-wrap gap-2">
            {pals.map((p) => (
              <button key={p.id} type="button" aria-label={`Paleta ${p.name}`} title={p.name} onClick={() => onPick(curItem, p.id, curEq?.hue ?? 0)}
                className={`h-8 w-8 rounded-full border-2 ${curEq?.palette === p.id ? 'border-white scale-110' : 'border-ink-600'}`} style={{ background: `linear-gradient(135deg, ${p.c[0]} 50%, ${p.c[2]} 50%)` }} />
            ))}
          </div>
          {curItem.custom_hue && (
            <input type="range" min={0} max={355} step={5} value={curEq?.hue ?? 0} aria-label="Color libre" onChange={(e) => onPick(curItem, curEq?.palette, Number(e.target.value))} className="w-full accent-amber-400 mt-2" />
          )}
        </div>
      )}
      {mine.length > 0 && <p className="text-xs font-semibold text-neutral-300 mb-1.5">Lo que ya tienes ({mine.length})</p>}
      <div className="grid grid-cols-3 gap-2 mb-4">{mine.map((i) => <Tile key={i.id} i={i} />)}</div>
      {rest.length > 0 && <p className="text-xs font-semibold text-neutral-300 mb-1.5">Para probar ({rest.length})</p>}
      <div className="grid grid-cols-3 gap-2 max-h-[46vh] overflow-y-auto pr-1">{rest.map((i) => <Tile key={i.id} i={i} />)}</div>
      {list.length === 0 && <p className="text-sm text-neutral-500">Todavía no hay nada de esto.</p>}
    </div>
  )
}
