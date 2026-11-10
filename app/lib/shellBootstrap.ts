// v1.9.0 · Paquete de arranque: perfil, permisos, modo mantenimiento y contadores en UNA sola petición (RPC shell_bootstrap).
// Si todavía no se corrió el SQL de la 1.9.0, devuelve null y AppShell usa el camino de siempre.
import { supabase } from './supabaseClient'

export type BootProfile = {
  username: string | null
  avatar_url: string | null
  id_student: string | null
  theme: string | null
  accent_color: string | null
  show_online_status: boolean | null
  show_read_receipts: boolean | null
}
export type Boot = {
  maintenance: boolean
  profile: BootProfile | null
  roles: unknown[]
  unreadNotifications: number
  dmUnread: number
  dmRequests: number
}

let missing = false // el SQL todavía no está: no se vuelve a intentar en esta sesión
let inflight: Promise<Boot | null> | null = null

export async function loadBootstrap(): Promise<Boot | null> {
  if (missing) return null
  if (inflight) return inflight
  inflight = (async () => {
    const { data, error } = await supabase.rpc('shell_bootstrap')
    if (error) {
      if (/shell_bootstrap|schema cache|Could not find the function|does not exist/i.test(error.message)) missing = true
      return null
    }
    const d = data as Record<string, unknown> | null
    if (!d || typeof d !== 'object') return null
    return {
      maintenance: d.maintenance === true,
      profile: (d.profile as BootProfile | null) ?? null,
      roles: Array.isArray(d.roles) ? (d.roles as unknown[]) : [],
      unreadNotifications: Number(d.unread_notifications) || 0,
      dmUnread: Number(d.dm_unread) || 0,
      dmRequests: Number(d.dm_requests) || 0,
    } satisfies Boot
  })().finally(() => {
    inflight = null
  })
  return inflight
}
