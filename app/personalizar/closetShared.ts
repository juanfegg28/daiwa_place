// v1.10.0 · Tipos y constantes que comparten la página de Personalizar y el Closet, en un módulo SIN el kit de cosméticos:
// así la página puede cargar el Closet (que sí lo usa, ≈650 KB) bajo demanda en vez de descargarlo al abrir /personalizar.
import type { CardMode } from '../lib/color'
import type { CosmeticType, Equip } from '../lib/cosmetics'

export type Tab = 'color' | 'nombre' | 'avatar' | 'tarjeta' | 'entrada' | 'fondo' | 'titulo' | 'looks'
export type Draft = { profile_color: string | null; name_color: string | null; card_color: string | null; card_mode: CardMode }
export type Look = { avatar_deco: Equip | null; font: string | null; effect: Equip | null; title: Equip | null; card: Equip | null; entry: Equip | null; bg: Equip | null }
export const EMPTY_LOOK: Look = { avatar_deco: null, font: null, effect: null, title: null, card: null, entry: null, bg: null }
export type ClosetInfo = { id_student: string | null; avatar_url: string | null; bio: string | null; grado: string | null; banner_url: string | null; created_at: string }

/** pestaña → tipo de cosmético y pieza del look */
export const SLOT: Record<Exclude<Tab, 'color' | 'looks'>, { type: CosmeticType; key: keyof Look }> = {
  nombre: { type: 'name_effect', key: 'effect' },
  avatar: { type: 'avatar_decoration', key: 'avatar_deco' },
  tarjeta: { type: 'profile_card', key: 'card' },
  entrada: { type: 'entry_effect', key: 'entry' },
  fondo: { type: 'background', key: 'bg' },
  titulo: { type: 'title', key: 'title' },
}

