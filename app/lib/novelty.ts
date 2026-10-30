'use client'

// v1.5.10 · «Novedades»: el brillito de «nueva confesión» (Susurros) y «NOVEDAD» (Tienda).
// Todo vive en el navegador (nada de SQL): se guarda qué ya viste y, mientras haya algo que no hayas visto, sale el brillito.
// Al entrar a la sección se quita y no vuelve hasta que haya otra novedad.
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { shopCollections, shopFeaturesActive, shopSalesActive, type ShopCollection, type ShopFeature, type ShopSale } from './cosmetics'

const EVT = 'daiwa:novelty'
const FRESH_DAYS = 21 // una oferta o selección solo cuenta como «novedad» durante sus primeras 3 semanas

/** Colecciones que ya existían antes de la v1.5.10: no se marcan como novedad (solo las que vengan después). */
const KNOWN_COLLECTIONS = new Set([
  'base', 'noctis', 'velvet', 'sakura', 'magica', 'neon', 'pixel', 'samurai', 'academia', 'cosmos', 'bosque', 'cielo', 'oro', 'lofi',
  'crimson', 'emo', 'miticas', 'cripta', 'cruces', 'calabaza', 'cuervo', 'barroco', 'creepy', 'vampiro',
])

// ───────── almacenamiento (por persona y por navegador) ─────────
const k = (userId: string, name: string) => `daiwa_nov:${userId}:${name}`
function read<T>(userId: string, name: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(k(userId, name))
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function write(userId: string, name: string, value: unknown) {
  try {
    window.localStorage.setItem(k(userId, name), JSON.stringify(value))
  } catch {
    /* sin almacenamiento: el brillito simplemente no se recuerda */
  }
  window.dispatchEvent(new Event(EVT))
}

/** se vuelve a calcular cuando algo cambia (esta pestaña u otra) o al volver a la ventana */
function useNoveltyTick(): number {
  const [n, setN] = useState(0)
  useEffect(() => {
    const bump = () => setN((v) => v + 1)
    window.addEventListener(EVT, bump)
    window.addEventListener('storage', bump)
    return () => {
      window.removeEventListener(EVT, bump)
      window.removeEventListener('storage', bump)
    }
  }, [])
  return n
}

// ───────── Susurros ─────────
const whisperLatest = { at: 0, value: null as string | null }
async function fetchLatestWhisper(force = false): Promise<string | null> {
  if (!force && Date.now() - whisperLatest.at < 60_000) return whisperLatest.value
  const { data, error } = await supabase.from('whispers').select('created_at').eq('status', 'visible').order('created_at', { ascending: false }).limit(1)
  if (error) return whisperLatest.value
  whisperLatest.at = Date.now()
  whisperLatest.value = (data as { created_at: string }[] | null)?.[0]?.created_at ?? null
  return whisperLatest.value
}

/** Al entrar al Muro: lo último que existe queda como «visto» */
export async function markWhispersSeen(userId: string) {
  const latest = await fetchLatestWhisper(true)
  write(userId, 'whisper_seen', latest ?? new Date().toISOString())
}

/** ¿Hay una confesión nueva desde la última vez que entraste al Muro? (para la barra lateral) */
export function useWhisperNovelty(userId: string | null | undefined): boolean {
  const tick = useNoveltyTick()
  const [latest, setLatest] = useState<string | null>(null)
  useEffect(() => {
    if (!userId) return
    let off = false
    const run = async () => {
      if (document.hidden) return
      const v = await fetchLatestWhisper()
      if (!off) setLatest(v)
    }
    const first = window.setTimeout(run, 2500)
    const iv = window.setInterval(run, 120_000)
    window.addEventListener('focus', run)
    return () => {
      off = true
      window.clearTimeout(first)
      window.clearInterval(iv)
      window.removeEventListener('focus', run)
    }
  }, [userId])
  // primera vez en este navegador: lo que ya hay no cuenta como nuevo
  useEffect(() => {
    if (!userId || !latest) return
    if (read<string | null>(userId, 'whisper_seen', null) === null) write(userId, 'whisper_seen', latest)
  }, [userId, latest])
  void tick
  if (!userId || !latest) return false
  const seen = read<string | null>(userId, 'whisper_seen', null)
  return seen !== null && new Date(latest).getTime() > new Date(seen).getTime()
}

// ───────── Tienda ─────────
export type ShopNoveltyKeys = { features: string[]; sales: string[]; collections: string[] }
const fresh = (iso: string) => Date.now() - new Date(iso).getTime() < FRESH_DAYS * 86_400_000

/** Las «llaves» de lo que hay de nuevo ahora mismo en la tienda */
export function shopKeysFrom(features: ShopFeature[], sales: ShopSale[], collections: ShopCollection[]): ShopNoveltyKeys {
  return {
    features: features.filter((f) => fresh(f.starts_at)).map((f) => `f:${f.id}`),
    sales: sales.filter((s) => fresh(s.starts_at)).map((s) => `s:${s.id}`),
    collections: collections.filter((c) => (c.kind === 'coleccion' || c.kind === 'miticas') && !KNOWN_COLLECTIONS.has(c.id)).map((c) => `c:${c.id}`),
  }
}
const allKeys = (n: ShopNoveltyKeys) => [...n.features, ...n.sales, ...n.collections]

const shopCache = { at: 0, keys: null as ShopNoveltyKeys | null, pending: null as Promise<ShopNoveltyKeys | null> | null }
async function fetchShopKeys(): Promise<ShopNoveltyKeys | null> {
  if (shopCache.keys && Date.now() - shopCache.at < 300_000) return shopCache.keys
  if (shopCache.pending) return shopCache.pending
  shopCache.pending = (async () => {
    const [f, s, c] = await Promise.all([shopFeaturesActive(), shopSalesActive(), shopCollections()])
    if (f.error && s.error && c.error) return shopCache.keys
    shopCache.keys = shopKeysFrom(f.data ?? [], s.data ?? [], c.data ?? [])
    shopCache.at = Date.now()
    return shopCache.keys
  })().finally(() => {
    shopCache.pending = null
  })
  return shopCache.pending
}

/** Barra lateral: ¿hay algo nuevo en la tienda que no has visto al entrar? */
export function useShopNoveltyFlag(userId: string | null | undefined): boolean {
  const tick = useNoveltyTick()
  const [keys, setKeys] = useState<ShopNoveltyKeys | null>(null)
  useEffect(() => {
    if (!userId) return
    let off = false
    const run = async () => {
      if (document.hidden) return
      const v = await fetchShopKeys()
      if (!off) setKeys(v)
    }
    const first = window.setTimeout(run, 3500)
    const iv = window.setInterval(run, 300_000)
    window.addEventListener('focus', run)
    return () => {
      off = true
      window.clearTimeout(first)
      window.clearInterval(iv)
      window.removeEventListener('focus', run)
    }
  }, [userId])
  void tick
  if (!userId || !keys) return false
  const entered = new Set(read<string[]>(userId, 'shop_entered', []))
  return allKeys(keys).some((x) => !entered.has(x))
}

/** Al entrar a la tienda: todo lo que hay queda «visto» para la barra lateral */
export function markShopEntered(userId: string, keys: ShopNoveltyKeys) {
  const cur = new Set(read<string[]>(userId, 'shop_entered', []))
  const add = allKeys(keys).filter((x) => !cur.has(x))
  if (add.length === 0) return
  write(userId, 'shop_entered', [...cur, ...add].slice(-200))
}

/** Pestañas de la tienda: cada una se «lee» cuando entras a ella */
export const allShopKeys = allKeys
export type ShopTab = 'features' | 'sales' | 'collections'
export function markShopTabSeen(userId: string, tab: ShopTab, keys: ShopNoveltyKeys) {
  const cur = new Set(read<string[]>(userId, 'shop_tabs', []))
  const add = keys[tab].filter((x) => !cur.has(x))
  if (add.length === 0) return
  write(userId, 'shop_tabs', [...cur, ...add].slice(-200))
}

/** ¿Qué pestañas de la tienda tienen novedad sin ver? (viva: se apaga al entrar) */
export function useShopTabNovelty(userId: string | null | undefined, keys: ShopNoveltyKeys): Record<ShopTab, boolean> {
  const tick = useNoveltyTick()
  void tick
  if (!userId) return { features: false, sales: false, collections: false }
  const seen = new Set(read<string[]>(userId, 'shop_tabs', []))
  return {
    features: keys.features.some((x) => !seen.has(x)),
    sales: keys.sales.some((x) => !seen.has(x)),
    collections: keys.collections.some((x) => !seen.has(x)),
  }
}

/** Lo que ya viste en las pestañas de la tienda */
export function readSeenTabs(userId: string): Set<string> {
  return new Set(read<string[]>(userId, 'shop_tabs', []))
}
