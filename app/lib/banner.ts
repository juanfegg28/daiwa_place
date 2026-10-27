// Banners de perfil: JPG/PNG/WebP (se recortan 3:1) o GIF animado (se sube tal cual, máx. 25 MB).
export const MAX_BANNER_GIF_BYTES = 25 * 1024 * 1024
export const MAX_BANNER_GIF_LABEL = '25 MB'

export const isGifFile = (f: Pick<File, 'type' | 'name'>) => f.type === 'image/gif' || /\.gif$/i.test(f.name)
/** ¿La URL guardada es de un GIF? (ignora el ?t=… de caché) */
export const isGifUrl = (u: string | null | undefined) => !!u && /\.gif(\?|#|$)/i.test(u)

/** Extensión segura para el nombre del archivo en el bucket */
export function bannerExt(f: Pick<File, 'type' | 'name'>): 'gif' | 'png' | 'webp' | 'jpg' {
  if (isGifFile(f)) return 'gif'
  if (f.type === 'image/png') return 'png'
  if (f.type === 'image/webp') return 'webp'
  return 'jpg'
}
const EXTS = ['gif', 'png', 'webp', 'jpg', 'jpeg']

/**
 * Sube el banner a avatars/<user>/banner.<ext> y borra las otras variantes (si antes tenías un .jpg y ahora subes un .gif,
 * no se queda basura en el almacenamiento). Devuelve la URL pública o el mensaje de error.
 */
export async function uploadBanner(
  supabase: { storage: { from: (b: string) => any } }, // eslint-disable-line @typescript-eslint/no-explicit-any
  userId: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  if (isGifFile(file) && file.size > MAX_BANNER_GIF_BYTES) return { error: `El GIF pesa demasiado (máximo ${MAX_BANNER_GIF_LABEL}).` }
  const ext = bannerExt(file)
  const path = `${userId}/banner.${ext}`
  const bucket = supabase.storage.from('avatars')
  const { error } = await bucket.upload(path, file, { upsert: true, contentType: ext === 'gif' ? 'image/gif' : file.type || 'image/jpeg', cacheControl: '3600' })
  if (error) return { error: String(error.message ?? error) }
  const others = EXTS.filter((e) => e !== ext).map((e) => `${userId}/banner.${e}`)
  bucket.remove(others).catch(() => {}) // mejor esfuerzo
  return { url: `${bucket.getPublicUrl(path).data.publicUrl}?t=${Date.now()}` }
}
