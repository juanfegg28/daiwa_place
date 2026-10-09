import { createClient } from '@supabase/supabase-js'

/** Comprueba de verdad que el token sea de una sesión válida (antes solo se miraba que llegara algún token). */
export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) return null
  return data.user.id
}

// Límite sencillo por persona (en memoria del servidor): evita que alguien gaste la cuota de Deezer de todos.
const hits = new Map<string, number[]>()
export function tooManyRequests(userId: string, max = 40, windowMs = 60_000): boolean {
  const now = Date.now()
  const list = (hits.get(userId) ?? []).filter((t) => now - t < windowMs)
  list.push(now)
  hits.set(userId, list)
  return list.length > max
}

export const DEEZER_BUSY = 'Deezer está muy ocupado ahora. Espera unos segundos e inténtalo de nuevo.'
