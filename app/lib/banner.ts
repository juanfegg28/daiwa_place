// Banners de perfil: JPG/PNG/WebP (se recortan 3:1) o GIF animado (se sube tal cual, máx. 25 MB).
// v1.8.0 · Un GIF animado se descarga en cada visita al perfil y es lo que más «egress» gasta en Supabase gratis:
// 6 MB para todos y 12 MB con el Círculo Lunar (antes 25 MB para todos).
export const MAX_BANNER_GIF_BYTES = 6 * 1024 * 1024
export const MAX_BANNER_GIF_LABEL = '6 MB'

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
  file: File,
  /** tope de GIF en MB según tu plan (6 gratis · 12 con el Círculo Lunar); lo decide my_perks() */
  maxGifMb = 6
): Promise<{ url: string } | { error: string }> {
  if (isGifFile(file) && file.size > maxGifMb * 1024 * 1024) return { error: `El GIF pesa demasiado (máximo ${maxGifMb} MB${maxGifMb < 12 ? '; con el Círculo Lunar puedes subir hasta 12 MB' : ''}).` }
  const ext = bannerExt(file)
  const path = `${userId}/banner.${ext}`
  const bucket = supabase.storage.from('avatars')
  const { error } = await bucket.upload(path, file, { upsert: true, contentType: ext === 'gif' ? 'image/gif' : file.type || 'image/jpeg', cacheControl: '31536000' })  // la URL lleva ?t=… , así que se puede guardar un año
  if (error) return { error: String(error.message ?? error) }
  const others = EXTS.filter((e) => e !== ext).map((e) => `${userId}/banner.${e}`)
  bucket.remove(others).catch(() => {}) // mejor esfuerzo
  return { url: `${bucket.getPublicUrl(path).data.publicUrl}?t=${Date.now()}` }
}
