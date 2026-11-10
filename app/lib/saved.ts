// v1.9.0 · Publicaciones guardadas y colecciones personales (RLS: solo tú ves y cambias lo tuyo)
import { supabase } from './supabaseClient'

export type SavedCollection = { id: string; name: string; count: number }
export type SavedOverview = { total: number; unfiled: number; collections: SavedCollection[] }

let overviewCache: { at: number; data: SavedOverview } | null = null
const OVERVIEW_TTL = 60_000

export function invalidateSavedOverview() {
  overviewCache = null
}

async function myId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? null
}

export async function getSavedOverview(force = false): Promise<SavedOverview | null> {
  if (!force && overviewCache && Date.now() - overviewCache.at < OVERVIEW_TTL) return overviewCache.data
  const { data, error } = await supabase.rpc('saved_overview')
  if (error || !data) return overviewCache?.data ?? null
  const d = data as SavedOverview
  const clean: SavedOverview = {
    total: Number(d.total) || 0,
    unfiled: Number(d.unfiled) || 0,
    collections: Array.isArray(d.collections) ? d.collections.map((c) => ({ id: c.id, name: c.name, count: Number(c.count) || 0 })) : [],
  }
  overviewCache = { at: Date.now(), data: clean }
  return clean
}

/** Guarda (o mueve) una publicación; collectionId null = «sin colección». Devuelve el texto del error o ''. */
export async function savePost(postId: string, collectionId: string | null): Promise<string> {
  const uid = await myId()
  if (!uid) return 'Inicia sesión para guardar'
  const { error } = await supabase.from('saved_posts').upsert({ user_id: uid, post_id: postId, collection_id: collectionId }, { onConflict: 'user_id,post_id' })
  invalidateSavedOverview()
  return error ? error.message : ''
}

export async function unsavePost(postId: string): Promise<string> {
  const uid = await myId()
  if (!uid) return 'Inicia sesión primero'
  const { error } = await supabase.from('saved_posts').delete().eq('user_id', uid).eq('post_id', postId)
  invalidateSavedOverview()
  return error ? error.message : ''
}

export async function createCollection(name: string): Promise<{ collection: SavedCollection | null; error: string }> {
  const uid = await myId()
  const clean = name.replace(/\s+/g, ' ').trim()
  if (!uid) return { collection: null, error: 'Inicia sesión primero' }
  if (clean.length < 1 || clean.length > 30) return { collection: null, error: 'El nombre debe tener entre 1 y 30 caracteres' }
  const { data, error } = await supabase.from('saved_collections').insert({ user_id: uid, name: clean }).select('id, name').single()
  invalidateSavedOverview()
  if (error) return { collection: null, error: /duplicate|unique/i.test(error.message) ? 'Ya tienes una colección con ese nombre' : error.message }
  return { collection: { id: (data as { id: string }).id, name: (data as { name: string }).name, count: 0 }, error: '' }
}

export async function renameCollection(id: string, name: string): Promise<string> {
  const clean = name.replace(/\s+/g, ' ').trim()
  if (clean.length < 1 || clean.length > 30) return 'El nombre debe tener entre 1 y 30 caracteres'
  const { error } = await supabase.from('saved_collections').update({ name: clean }).eq('id', id)
  invalidateSavedOverview()
  if (error) return /duplicate|unique/i.test(error.message) ? 'Ya tienes una colección con ese nombre' : error.message
  return ''
}

/** Borra la colección; lo que había dentro NO se borra: pasa a «sin colección». */
export async function deleteCollection(id: string): Promise<string> {
  const { error } = await supabase.from('saved_collections').delete().eq('id', id)
  invalidateSavedOverview()
  return error ? error.message : ''
}

export async function listSavedIds(opts: { collection?: string | null; unfiled?: boolean; before?: string | null; limit?: number }) {
  const { data, error } = await supabase.rpc('saved_list', {
    p_collection: opts.collection ?? null,
    p_unfiled: !!opts.unfiled,
    p_limit: opts.limit ?? 12,
    p_before: opts.before ?? null,
  })
  if (error) return { rows: [] as { post_id: string; collection_id: string | null; saved_at: string }[], error: error.message }
  return { rows: (data as { post_id: string; collection_id: string | null; saved_at: string }[] | null) ?? [], error: '' }
}
