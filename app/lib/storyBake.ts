// «Hornear» imágenes en el navegador (v1.2.0): la foto de la historia sale a 1080×1920 exactos, sin metadatos
// EXIF, y las portadas de las destacadas a 400×400. Sin librerías nuevas.
import { STORY_H, STORY_W } from './stories'

export const MAX_INPUT_BYTES = 25 * 1024 * 1024
export const MAX_OUTPUT_BYTES = 3 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

export type PhotoSource = { img: HTMLImageElement; url: string; w: number; h: number; aspect: number }

/** Cuánto se mueve y se acerca la foto dentro del marco (fracciones del marco, igual en la vista previa y al hornear) */
export type PhotoFit = { mode: 'fill' | 'fit'; zoom: number; ox: number; oy: number }

export function checkImageFile(file: File): string | null {
  if (!ALLOWED.includes(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) return 'Ese archivo no es una imagen que podamos usar.'
  if (file.size > MAX_INPUT_BYTES) return 'La imagen pesa más de 25 MB. Prueba con otra.'
  if (file.name.length > 200) return 'El nombre del archivo es demasiado largo.'
  return null
}

export function loadPhoto(file: File): Promise<PhotoSource> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      if (!w || !h) {
        URL.revokeObjectURL(url)
        reject(new Error('No se pudo leer la foto.'))
        return
      }
      resolve({ img, url, w, h, aspect: w / h })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la foto. Prueba con otra.'))
    }
    img.src = url
  })
}

/** Ancho de la foto como fracción del ancho del marco, según el modo (Llenar cubre, Ajustar muestra completa) */
export function photoWidthFraction(aspect: number, frameAspect: number, fit: PhotoFit): number {
  const coverW = aspect >= frameAspect ? aspect / frameAspect : 1
  const containW = aspect >= frameAspect ? 1 : aspect / frameAspect
  return (fit.mode === 'fill' ? coverW : containW) * fit.zoom
}

export function defaultFit(aspect: number): PhotoFit {
  // horizontal o cuadrada → Ajustar; ya vertical → Llenar
  return { mode: aspect > 0.7 ? 'fit' : 'fill', zoom: 1, ox: 0, oy: 0 }
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('Tu navegador no pudo procesar la foto.')
  return { c, ctx }
}

function toBlob(c: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => c.toBlob(resolve, 'image/jpeg', quality))
}

/** Fondo desenfocado sin ctx.filter (no existe en Safari antiguos): se reduce muy pequeño y se vuelve a escalar */
function drawBlurredBackground(ctx: CanvasRenderingContext2D, src: PhotoSource, w: number, h: number) {
  const smallW = Math.max(8, Math.round(w / 24))
  const smallH = Math.max(8, Math.round(h / 24))
  const tiny = canvas(smallW, smallH)
  const frameAspect = w / h
  const coverW = src.aspect >= frameAspect ? (src.aspect / frameAspect) * smallW : smallW
  const dw = coverW
  const dh = dw / src.aspect
  tiny.ctx.imageSmoothingEnabled = true
  tiny.ctx.imageSmoothingQuality = 'high'
  tiny.ctx.drawImage(src.img, (smallW - dw) / 2, (smallH - dh) / 2, dw, dh)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(tiny.c, 0, 0, w, h)
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(0, 0, w, h)
}

/** Hornea la foto de la historia: JPEG 1080×1920, calidad 0.82 (baja hasta 0.6 si pasa de 600 KB; tope 3 MB) */
export async function bakeStoryPhoto(src: PhotoSource, fit: PhotoFit): Promise<{ blob: Blob; w: number; h: number }> {
  const { c, ctx } = canvas(STORY_W, STORY_H)
  ctx.fillStyle = '#0c0c0f'
  ctx.fillRect(0, 0, STORY_W, STORY_H)
  if (fit.mode === 'fit') drawBlurredBackground(ctx, src, STORY_W, STORY_H)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  const wFrac = photoWidthFraction(src.aspect, STORY_W / STORY_H, fit)
  const dw = wFrac * STORY_W
  const dh = dw / src.aspect
  ctx.drawImage(src.img, (0.5 + fit.ox) * STORY_W - dw / 2, (0.5 + fit.oy) * STORY_H - dh / 2, dw, dh)

  let quality = 0.82
  let blob = await toBlob(c, quality)
  while (blob && blob.size > 600 * 1024 && quality > 0.6) {
    quality = Math.max(0.6, quality - 0.07)
    blob = await toBlob(c, quality)
  }
  if (!blob) throw new Error('No se pudo procesar la foto. Prueba con otra.')
  if (blob.size > MAX_OUTPUT_BYTES) throw new Error('La foto pesa demasiado. Prueba con otra.')
  return { blob, w: STORY_W, h: STORY_H }
}

/** Portada de destacada: JPEG 400×400. La foto se encuadra en un cuadrado con zoom 1×–3× */
export async function bakeCover(src: PhotoSource, fit: { zoom: number; ox: number; oy: number }): Promise<Blob> {
  const S = 400
  const { c, ctx } = canvas(S, S)
  ctx.fillStyle = '#131317'
  ctx.fillRect(0, 0, S, S)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  const wFrac = (src.aspect >= 1 ? src.aspect : 1) * fit.zoom
  const dw = wFrac * S
  const dh = dw / src.aspect
  ctx.drawImage(src.img, (0.5 + fit.ox) * S - dw / 2, (0.5 + fit.oy) * S - dh / 2, dw, dh)
  const blob = await toBlob(c, 0.85)
  if (!blob) throw new Error('No se pudo procesar la portada.')
  return blob
}

/** Portada hecha con un estilo (sin foto): círculo de color + icono, a 400×400 */
export async function bakeStyleCover(colors: string[], icon: string, iconColor: string): Promise<Blob> {
  const S = 400
  const { c, ctx } = canvas(S, S)
  const g = ctx.createLinearGradient(0, 0, S * 0.45, S)
  colors.forEach((col, i) => g.addColorStop(colors.length === 1 ? 0 : i / (colors.length - 1), col))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  ctx.fillStyle = iconColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '190px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
  ctx.fillText(icon, S / 2, S / 2 + 10)
  const blob = await toBlob(c, 0.88)
  if (!blob) throw new Error('No se pudo crear la portada.')
  return blob
}

/** Dos colores tomados de una carátula (muestreo en canvas 8×8). null si el navegador no deja leer los píxeles (CORS). */
export async function coverColors(url: string | null): Promise<string[] | null> {
  if (!url) return null
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.crossOrigin = 'anonymous'
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('cors'))
      i.src = url
    })
    const { c, ctx } = canvas(8, 8)
    ctx.drawImage(img, 0, 0, 8, 8)
    const data = ctx.getImageData(0, 0, 8, 8).data // si el servidor de imágenes no manda CORS, esto lanza
    let r = 0, g = 0, b = 0, n = 0
    let br = 0, bg = 0, bb = 0, best = -1
    for (let i = 0; i < data.length; i += 4) {
      const R = data[i], G = data[i + 1], B = data[i + 2]
      r += R; g += G; b += B; n++
      const sat = Math.max(R, G, B) - Math.min(R, G, B)
      if (sat > best) { best = sat; br = R; bg = G; bb = B }
    }
    void c
    const hex = (R: number, G: number, B: number) => '#' + [R, G, B].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
    const avg = [r / n, g / n, b / n]
    const top = hex(br, bg, bb)
    const bottom = hex(avg[0] * 0.35, avg[1] * 0.35, avg[2] * 0.35)
    return [top, bottom]
  } catch {
    return null
  }
}

export function fileToBlobName(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
