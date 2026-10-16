// Tarjetas de enlace (Open Graph) para Discord y redes (v1.1.10).
// Todo esto corre en el SERVIDOR, con la llave pública, y solo lee lo que las funciones og_post / og_profile /
// og_club dejan ver: cuentas públicas y activas. Si la cuenta es «solo seguidores», está congelada o ya no existe,
// se devuelve la tarjeta genérica del sitio para que Discord no muestre nada privado.
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://daiwaplace.vercel.app'
export const SITE_NAME = 'DaiwaPlace'
export const SITE_DESCRIPTION = 'La red social de Daiwa'
/** Logo de la luna sobre fondo oscuro (1200×630) */
export const DEFAULT_OG_IMAGE = '/og-default.png'

function serverClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

/** Quita el formato de la página (**negrita**, *cursiva*, __subrayado__) y recorta el texto */
function clean(text: string | null | undefined, max = 200): string {
  const t = (text ?? '').replace(/\*\*|__|\*/g, '').replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t
}

type CardInput = { title: string; description: string; image?: string | null; path?: string; type?: 'website' | 'article' | 'profile' }

function card({ title, description, image, path = '/', type = 'website' }: CardInput): Metadata {
  const img = image || DEFAULT_OG_IMAGE
  const isDefault = !image
  return {
    title,
    description,
    openGraph: {
      type,
      siteName: SITE_NAME,
      title,
      description,
      url: path,
      images: [isDefault ? { url: img, width: 1200, height: 630, alt: SITE_NAME } : { url: img, alt: title }],
      locale: 'es_ES',
    },
    twitter: { card: isDefault ? 'summary_large_image' : 'summary_large_image', title, description, images: [img] },
  }
}

/** Tarjeta genérica del sitio (también es la «de respaldo» para todo lo privado o inexistente) */
export function genericCard(path = '/'): Metadata {
  return card({ title: SITE_NAME, description: SITE_DESCRIPTION, path })
}

export async function postCard(id: string): Promise<Metadata> {
  const path = `/post/${id}`
  try {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return genericCard(path)
    const sb = serverClient()
    if (!sb) return genericCard(path)
    const { data } = await sb.rpc('og_post', { p_id: id })
    const row = (data as { author_name: string; author_username: string; content: string; image_url: string | null }[] | null)?.[0]
    if (!row) return genericCard(path)
    return card({
      title: `${row.author_name} en ${SITE_NAME}`,
      description: clean(row.content) || 'Publicación con foto',
      image: row.image_url,
      path,
      type: 'article',
    })
  } catch {
    return genericCard(path)
  }
}

export async function profileCard(username: string): Promise<Metadata> {
  const path = `/perfil/${username}`
  try {
    const sb = serverClient()
    if (!sb) return genericCard(path)
    const { data } = await sb.rpc('og_profile', { p_username: decodeURIComponent(username) })
    const row = (data as { display_name: string; username: string; bio: string | null; avatar_url: string | null }[] | null)?.[0]
    if (!row) return genericCard(path)
    return card({
      title: `${row.display_name} (@${row.username}) · ${SITE_NAME}`,
      description: clean(row.bio) || `Perfil de @${row.username} en ${SITE_NAME}`,
      image: row.avatar_url,
      path,
      type: 'profile',
    })
  } catch {
    return genericCard(path)
  }
}

export async function clubCard(slug: string): Promise<Metadata> {
  const path = `/clubes/${slug}`
  try {
    const sb = serverClient()
    if (!sb) return genericCard(path)
    const { data } = await sb.rpc('og_club', { p_slug: decodeURIComponent(slug) })
    const row = (data as { name: string; kind: 'club' | 'pandilla'; description: string | null; banner_url: string | null; avatar_url: string | null }[] | null)?.[0]
    if (!row) return genericCard(path)
    const kind = row.kind === 'pandilla' ? 'Pandilla' : 'Club'
    return card({
      title: `${row.name} · ${kind} en ${SITE_NAME}`,
      description: `${kind} · ${clean(row.description) || `Mira la página de ${row.name} en ${SITE_NAME}`}`,
      image: row.banner_url || row.avatar_url,
      path,
    })
  } catch {
    return genericCard(path)
  }
}
