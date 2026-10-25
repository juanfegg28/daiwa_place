'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell, { useAppSession } from '../components/AppShell'
import { useShopData } from '../components/cosmetics/useShopData'
import { palettesOf } from '../components/cosmetics/kit'
import { supabase } from '../lib/supabaseClient'
import { type CardMode } from '../lib/color'
import { isValidHex } from '../lib/theme'
import { refreshWallet, subscribeWallet, type WalletSummary } from '../lib/economy'
import { setAllowNextKits } from '../lib/cosmeticsRelease'
import { saveLook, shopBuy, type CatalogItem, type CosmeticType, type Equip, type LookConfig } from '../lib/cosmetics'
import ClosetView, { EMPTY_LOOK, SLOT, type ClosetInfo, type Draft, type Look, type Tab } from './Closet'

export default function PersonalizarPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <PersonalizarContent />
      </Suspense>
    </AppShell>
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
  const [info, setInfo] = useState<ClosetInfo | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [rain, setRain] = useState(false)
  const [showEntry, setShowEntry] = useState(0)

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
        const d = data as (Draft & ClosetInfo) | null
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

  // elegir un cosmético: si no es mío, se PRUEBA (borrador) y se puede comprar desde la barra de abajo
  function pick(item: CatalogItem, palette?: string, hue = 0) {
    const pal = palette ?? palettesOf(item.type, item.slug)[0]?.id
    const eq: Equip = { id: item.slug, ...(pal ? { palette: pal } : {}), ...(hue ? { hue } : {}) }
    setLook((l) => {
      if (item.type === 'font') return { ...l, font: item.slug === 'clasica' ? null : item.slug }
      const s = Object.values(SLOT).find((v) => v.type === item.type)
      return s ? { ...l, [s.key]: eq } : l
    })
    if (item.type === 'entry_effect') setShowEntry((n) => n + 1)
  }
  function clear(k: keyof Look) {
    setLook((l) => ({ ...l, [k]: null }))
  }

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
  if (loading || !userId || !draft || !info) return null

  const display = info.id_student || username || 'Tu nombre'

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
    setRain(true); refreshWallet(true)
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

  return (
    <ClosetView
      username={username ?? 'tu_usuario'}
      userId={userId}
      info={info}
      me={shop.me}
      display={display}
      draft={draft}
      onDraft={(patch) => setDraft({ ...draft, ...patch })}
      look={look}
      savedLook={savedLook}
      items={all}
      lockedIds={new Set(upcoming.map((u) => u.id))}
      balance={balance}
      tab={tab}
      onTab={setTab}
      onPick={pick}
      onClear={clear}
      trying={trying}
      tryLocked={tryLocked}
      tryBuy={tryBuy}
      busy={busy}
      msg={msg}
      dirty={dirtyColors || dirtyLook}
      onSave={save}
      onBuy={buyTrying}
      onDiscard={() => { setDraft(saved); setLook(savedLook) }}
      onClearTrial={() => setLook(savedLook)}
      rain={rain}
      onRainDone={() => setRain(false)}
      showEntry={showEntry}
      onReplayEntry={() => setShowEntry((n) => n + 1)}
    />
  )
}
