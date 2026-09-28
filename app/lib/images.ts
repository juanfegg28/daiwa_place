export type PreparedImage = {
  blob: Blob
  w: number
  h: number
  previewUrl: string
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo leer la imagen'))
    img.src = src
  })
}

/**
 * Reduce la foto (lado más largo = maxSide) y la convierte a JPEG antes de subirla.
 * Así las fotos pesan poco y devolvemos también su ancho/alto, que se usan para
 * elegir el marco correcto (cuadrado / vertical / horizontal) al mostrar la publicación.
 */
export async function prepareImage(file: File, maxSide = 1600, quality = 0.85): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Uno de los archivos no es una imagen')
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(objectUrl)
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Tu navegador no pudo procesar la imagen')

    // Fondo blanco por si la imagen tiene partes transparentes (PNG)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) throw new Error('No se pudo procesar la imagen')

    return { blob, w, h, previewUrl: URL.createObjectURL(blob) }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
