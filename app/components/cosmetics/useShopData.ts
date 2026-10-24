'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAppSession } from '../AppShell'
import { supabase } from '../../lib/supabaseClient'
import {
  myInventory, normalizeEquip, normalizeNameStyle, shopCatalog, shopCollections, staffPreviewItems,
  type CatalogItem, type Equip, type InventoryItem, type NameStyle, type ShopCollection,
} from '../../lib/cosmetics'
import type { PreviewSubject } from './ItemPreview'

export type Worn = { avatar_deco: Equip | null; name_style: NameStyle | null; title_style: Equip | null; card_style: Equip | null; entry_effect: Equip | null; profile_bg: Equip | null }
const EMPTY_WORN: Worn = { avatar_deco: null, name_style: null, title_style: null, card_style: null, entry_effect: null, profile_bg: null }

/** Datos compartidos por tienda, inventario y estudio: catálogo, colecciones, inventario y lo que llevo puesto */
export function useShopData(opts: { collections?: boolean; inventory?: boolean; preview?: boolean } = {}) {
  const { userId, username, avatarUrl, displayName } = useAppSession() as ReturnType<typeof useAppSession> & { displayName?: string }
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [collections, setCollections] = useState<ShopCollection[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [upcoming, setUpcoming] = useState<CatalogItem[]>([])
  const [worn, setWorn] = useState<Worn>(EMPTY_WORN)
  const [bio, setBio] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!userId) return
    const jobs: Promise<unknown>[] = []
    jobs.push(shopCatalog().then((r) => { if (r.error) setError(r.error); else setCatalog(r.data ?? []) }))
    if (opts.collections) jobs.push(shopCollections().then((r) => setCollections(r.data ?? [])))
    if (opts.inventory) jobs.push(myInventory().then((r) => setInventory(r.data ?? [])))
    // Solo devuelve filas para la cuenta del equipo con acceso total (renshsh); para cualquier otra, vacío
    if (opts.preview) jobs.push(staffPreviewItems().then((r) => setUpcoming(r.data ?? [])))
    jobs.push(
      Promise.resolve(
        supabase.from('profiles').select('bio, banner_url, avatar_deco, name_style, title_style, card_style, entry_effect, profile_bg').eq('id', userId).maybeSingle()
      ).then(({ data }) => {
        if (!data) return
        const d = data as Record<string, unknown>
        setBio((d.bio as string) ?? null)
        setBanner((d.banner_url as string) ?? null)
        setWorn({
          avatar_deco: normalizeEquip(d.avatar_deco), name_style: normalizeNameStyle(d.name_style), title_style: normalizeEquip(d.title_style),
          card_style: normalizeEquip(d.card_style), entry_effect: normalizeEquip(d.entry_effect), profile_bg: normalizeEquip(d.profile_bg),
        })
      })
    )
    await Promise.all(jobs)
    setLoading(false)
  }, [userId, opts.collections, opts.inventory, opts.preview])

  useEffect(() => {
    const t = setTimeout(reload, 0)
    return () => clearTimeout(t)
  }, [reload])

  const me: PreviewSubject = { username: username ?? 'tu_usuario', name: displayName || username || 'Tu nombre', avatarUrl: avatarUrl ?? null, bio, bannerUrl: banner }
  return { userId, me, catalog, collections, inventory, upcoming, worn, loading, error, reload }
}
