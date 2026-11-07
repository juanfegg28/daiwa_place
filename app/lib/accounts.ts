'use client'

// v1.8.0 · Cambio rápido de cuentas (como TikTok / Instagram), pensado para quien tiene personajes secundarios.
//
// Cómo funciona (y por qué es seguro):
//  · Cada cuenta en la que ENTRAS en este dispositivo (con su contraseña) se recuerda AQUÍ, en este navegador/celular.
//    Se guarda lo mismo que Supabase ya guarda al iniciar sesión (los tokens de la sesión), nunca la contraseña.
//  · «Cambiar» = restaurar esa sesión guardada. No pide contraseña porque ESE dispositivo ya la demostró.
//  · Nunca se salta la contraseña por IP, por «cuenta relacionada» ni desde otro dispositivo: en un colegio o en una casa
//    muchas personas comparten IP y cualquiera podría entrar a cuentas ajenas. La relación entre tus cuentas es el dispositivo.
//  · Cerrar sesión en una cuenta la quita de la lista. «Olvidar» la quita sin cerrarla en otros dispositivos.
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import { clearWalletCache } from './economy'
import { unlinkPushDevice } from './push'

const KEY = 'daiwa_accounts_v1'
const EVENT = 'daiwa:accounts'

/** Tope duro del almacenamiento local. El tope real lo da my_perks().account_cap: 2 para todos (en el rol solo hay 2 personajes) y sin límite para @renshsh */
export const ACCOUNTS_HARD_CAP = 30
export const ACCOUNTS_FREE_CAP = 2

export type SavedAccount = {
  id: string
  username: string
  name: string | null
  avatar: string | null
  access_token: string
  refresh_token: string
  savedAt: number
}

export type PublicAccount = Omit<SavedAccount, 'access_token' | 'refresh_token'> & { current: boolean }

function read(): SavedAccount[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as SavedAccount[]
    return Array.isArray(list) ? list.filter((a) => a && a.id && a.refresh_token && a.username) : []
  } catch {
    return []
  }
}

function write(list: SavedAccount[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, ACCOUNTS_HARD_CAP)))
    window.dispatchEvent(new Event(EVENT))
  } catch {
    /* sin almacenamiento: el cambio rápido simplemente no estará disponible */
  }
}

/** El usuario de DaiwaPlace es la parte de antes de la @ del correo interno (usuario@gmail.com) */
export function usernameFromSession(session: Session | null | undefined): string | null {
  const email = session?.user?.email
  if (!email) return null
  return email.split('@')[0] || null
}

/**
 * Guarda (o actualiza) la sesión que está abierta. Se llama al cargar la app y cada vez que Supabase renueva el token,
 * para que lo guardado nunca esté caducado. `info` trae el nombre y la foto cuando ya se conocen.
 */
export function rememberSession(session: Session | null | undefined, info?: { name?: string | null; avatar?: string | null; username?: string | null }) {
  if (typeof window === 'undefined' || !session?.user || !session.refresh_token) return
  const username = info?.username || usernameFromSession(session)
  if (!username) return
  const list = read()
  const i = list.findIndex((a) => a.id === session.user.id)
  const next: SavedAccount = {
    id: session.user.id,
    username,
    name: info?.name ?? (i >= 0 ? list[i].name : null),
    avatar: info && 'avatar' in info ? info.avatar ?? null : i >= 0 ? list[i].avatar : null,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    savedAt: Date.now(),
  }
  if (i >= 0) list[i] = next
  else if (list.length < ACCOUNTS_HARD_CAP) list.push(next)
  else return
  write(list)
}

/** Quita una cuenta de la lista de ESTE dispositivo (no cierra su sesión en otros) */
export function forgetAccount(id: string) {
  if (typeof window === 'undefined') return
  write(read().filter((a) => a.id !== id))
}

export function forgetAllAccounts() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY)
    window.dispatchEvent(new Event(EVENT))
  } catch {
    /* nada */
  }
}

export function listAccounts(currentId: string | null | undefined): PublicAccount[] {
  if (typeof window === 'undefined') return []
  return read()
    .map((a) => ({ id: a.id, username: a.username, name: a.name, avatar: a.avatar, savedAt: a.savedAt, current: a.id === currentId }))
    .sort((a, b) => Number(b.current) - Number(a.current) || b.savedAt - a.savedAt)
}

/** Avisa cuando la lista cambia (en esta pestaña o en otra) */
export function subscribeAccounts(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) fn()
  }
  window.addEventListener(EVENT, fn)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT, fn)
    window.removeEventListener('storage', onStorage)
  }
}

/** Pasa a otra cuenta guardada. Si salió bien, recarga la página entera (para que nada de la cuenta anterior quede en pantalla). */
export async function switchAccount(targetId: string): Promise<{ error?: string }> {
  const list = read()
  const target = list.find((a) => a.id === targetId)
  if (!target) return { error: 'Esa cuenta ya no está guardada en este dispositivo.' }

  // 1) guarda la sesión ACTUAL con sus tokens más recientes, para poder volver a ella
  const cur = await supabase.auth.getSession()
  if (cur.data.session?.user?.id === targetId) return {}
  if (cur.data.session) rememberSession(cur.data.session)

  // 2) este dispositivo deja de recibir los avisos push de la cuenta que se va
  await unlinkPushDevice()

  // 3) restaura la sesión de la otra cuenta
  const { data, error } = await supabase.auth.setSession({ access_token: target.access_token, refresh_token: target.refresh_token })
  if (error || !data.session) {
    // la sesión caducó o se cerró en otro sitio: hay que entrar con contraseña de nuevo
    forgetAccount(targetId)
    if (cur.data.session) await supabase.auth.setSession({ access_token: cur.data.session.access_token, refresh_token: cur.data.session.refresh_token }).catch(() => {})
    return { error: `La sesión de @${target.username} caducó. Vuelve a añadirla con su contraseña.` }
  }
  rememberSession(data.session, { name: target.name, avatar: target.avatar, username: target.username })

  try {
    window.sessionStorage.removeItem('daiwa_push_synced')
  } catch {
    /* sin almacenamiento */
  }
  clearWalletCache()
  window.location.assign('/')
  return {}
}

/** Ir a iniciar sesión en OTRA cuenta (la actual queda guardada para volver) */
export async function startAddAccount(): Promise<void> {
  const cur = await supabase.auth.getSession()
  if (cur.data.session) rememberSession(cur.data.session)
  window.location.assign('/login?add=1')
}
