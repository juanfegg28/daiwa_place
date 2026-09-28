'use client'

import { useRef, useState } from 'react'

export type CropperOptions = {
  /** ancho / alto del recorte (1 = cuadrado, 3 = banner 3:1) */
  aspect?: number
  /** forma del marco: círculo (foto de perfil) o rectángulo (banner) */
  shape?: 'circle' | 'rect'
  /** ancho en píxeles de la imagen final guardada */
  outputWidth?: number
  title?: string
  fileName?: string
}

/** Recorte 3:1 para el banner del perfil */
export const BANNER_CROP: CropperOptions = {
  aspect: 3,
  shape: 'rect',
  outputWidth: 1500,
  title: 'Acomoda tu banner',
  fileName: 'banner.jpg',
}

const CIRCLE_FRAME_W = 260 // ancho en pantalla del marco circular (px)
const RECT_FRAME_W = 320 // ancho en pantalla del marco rectangular (px)

/**
 * Hook que da un editor de recorte: arrastrar para mover, una barra para hacer zoom
 * y "Listo" para confirmar. Sirve para la foto de perfil (círculo, por defecto)
 * y para el banner (rectángulo 3:1, pasando BANNER_CROP).
 *
 * Uso:
 *   const { openCropper, cropperElement } = useAvatarCropper((file, previewUrl) => { ... })
 *   const banner = useAvatarCropper((file, previewUrl) => { ... }, BANNER_CROP)
 *   <input type="file" onChange={(e) => e.target.files?.[0] && openCropper(e.target.files[0])} />
 *   {cropperElement}
 */
export function useAvatarCropper(
  onConfirm: (file: File, previewUrl: string) => void,
  options: CropperOptions = {}
) {
  const aspect = options.aspect ?? 1
  const shape = options.shape ?? 'circle'
  const outputWidth = options.outputWidth ?? 480
  const title = options.title ?? 'Acomoda tu foto de perfil'
  const fileName = options.fileName ?? 'avatar.jpg'

  const FRAME_W = shape === 'circle' ? CIRCLE_FRAME_W : RECT_FRAME_W
  const FRAME_H = FRAME_W / aspect
  const OUTPUT_W = outputWidth
  const OUTPUT_H = Math.round(outputWidth / aspect)

  const [showCropper, setShowCropper] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null)
  const [baseScale, setBaseScale] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const cropImgRef = useRef<HTMLImageElement | null>(null)
  const dragState = useRef<{
    startX: number
    startY: number
    startOffsetX: number
    startOffsetY: number
  } | null>(null)

  const clampOffset = (x: number, y: number, scale: number) => {
    if (!imgSize) return { x, y }
    const displayW = imgSize.width * scale
    const displayH = imgSize.height * scale
    const minX = FRAME_W - displayW
    const minY = FRAME_H - displayH
    return {
      x: Math.min(0, Math.max(minX, x)),
      y: Math.min(0, Math.max(minY, y)),
    }
  }

  const openCropper = (file: File) => {
    const url = URL.createObjectURL(file)
    setCropSrc(url)
    setImgSize(null)
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    setShowCropper(true)
  }

  const handleImageLoad = () => {
    const img = cropImgRef.current
    if (!img) return
    const { naturalWidth, naturalHeight } = img
    // La imagen siempre cubre todo el marco (sin bordes vacíos)
    const base = Math.max(FRAME_W / naturalWidth, FRAME_H / naturalHeight)
    setImgSize({ width: naturalWidth, height: naturalHeight })
    setBaseScale(base)
    const displayW = naturalWidth * base
    const displayH = naturalHeight * base
    setOffset({
      x: (FRAME_W - displayW) / 2,
      y: (FRAME_H - displayH) / 2,
    })
  }

  const handleZoomChange = (value: number) => {
    if (!imgSize) {
      setZoom(value)
      return
    }
    const oldScale = baseScale * zoom
    const newScale = baseScale * value
    const centerX = FRAME_W / 2
    const centerY = FRAME_H / 2
    const imgPointX = (centerX - offset.x) / oldScale
    const imgPointY = (centerY - offset.y) / oldScale
    const newOffsetX = centerX - imgPointX * newScale
    const newOffsetY = centerY - imgPointY * newScale
    setZoom(value)
    setOffset(clampOffset(newOffsetX, newOffsetY, newScale))
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current || !imgSize) return
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    const scale = baseScale * zoom
    setOffset(
      clampOffset(dragState.current.startOffsetX + dx, dragState.current.startOffsetY + dy, scale)
    )
  }

  const handlePointerUp = () => {
    dragState.current = null
  }

  const close = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setShowCropper(false)
    setCropSrc(null)
    setImgSize(null)
  }

  const confirm = () => {
    const img = cropImgRef.current
    if (!img || !imgSize) return

    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_W
    canvas.height = OUTPUT_H
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scale = baseScale * zoom
    const sourceX = -offset.x / scale
    const sourceY = -offset.y / scale
    const sourceW = FRAME_W / scale
    const sourceH = FRAME_H / scale

    ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, OUTPUT_W, OUTPUT_H)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], fileName, { type: 'image/jpeg' })
        const url = URL.createObjectURL(blob)
        onConfirm(file, url)
        close()
      },
      'image/jpeg',
      0.92
    )
  }

  const cropperElement =
    showCropper && cropSrc ? (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4">
        <div className="surface-raised border border-ink-700 rounded-2xl p-5 w-full max-w-sm">
          <h2 className="text-center text-sm font-semibold mb-1 text-neutral-100">{title}</h2>
          <p className="text-center text-xs text-neutral-500 mb-4">
            Arrastra la imagen para moverla y usa la barra para hacer zoom
          </p>

          <div
            className={`relative mx-auto overflow-hidden border-4 border-garnet-600 bg-ink-950 cursor-grab active:cursor-grabbing touch-none select-none ${
              shape === 'circle' ? 'rounded-full' : 'rounded-lg'
            }`}
            style={{ width: FRAME_W, height: FRAME_H, boxSizing: 'content-box' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={cropImgRef}
              src={cropSrc}
              onLoad={handleImageLoad}
              draggable={false}
              alt="Ajustar imagen"
              style={{
                position: 'absolute',
                left: offset.x,
                top: offset.y,
                width: imgSize ? imgSize.width * baseScale * zoom : undefined,
                height: imgSize ? imgSize.height * baseScale * zoom : undefined,
                maxWidth: 'none',
              }}
            />
          </div>

          <div className="flex items-center gap-3 mt-5">
            <span className="text-xs text-neutral-500">−</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => handleZoomChange(Number(e.target.value))}
              className="flex-1 accent-garnet-500"
            />
            <span className="text-xs text-neutral-500">+</span>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={close}
              className="flex-1 border border-ink-600 text-neutral-300 rounded-full py-2 text-sm hover:bg-ink-800 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirm}
              className="flex-1 bg-garnet-600 hover:bg-garnet-500 text-white rounded-full py-2 text-sm font-medium transition"
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    ) : null

  return { openCropper, cropperElement }
}
