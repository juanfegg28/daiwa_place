'use client'

import { useRef, useState } from 'react'

const CROPPER_SIZE = 260 // tamaño en pantalla del circulo (px)
const OUTPUT_SIZE = 480 // tamaño final de la imagen guardada (px)

/**
 * Hook que da un editor circular de foto de perfil: arrastrar para mover,
 * una barra para hacer zoom, y "Listo" para confirmar el recorte.
 *
 * Uso:
 *   const { openCropper, cropperElement } = useAvatarCropper((file, previewUrl) => {
 *     setAvatarFile(file)
 *     setAvatarPreview(previewUrl)
 *   })
 *   <input type="file" onChange={(e) => e.target.files?.[0] && openCropper(e.target.files[0])} />
 *   {cropperElement}
 */
export function useAvatarCropper(onConfirm: (file: File, previewUrl: string) => void) {
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
    const minX = CROPPER_SIZE - displayW
    const minY = CROPPER_SIZE - displayH
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
    const base = CROPPER_SIZE / Math.min(naturalWidth, naturalHeight)
    setImgSize({ width: naturalWidth, height: naturalHeight })
    setBaseScale(base)
    const displayW = naturalWidth * base
    const displayH = naturalHeight * base
    setOffset({
      x: (CROPPER_SIZE - displayW) / 2,
      y: (CROPPER_SIZE - displayH) / 2,
    })
  }

  const handleZoomChange = (value: number) => {
    if (!imgSize) {
      setZoom(value)
      return
    }
    const oldScale = baseScale * zoom
    const newScale = baseScale * value
    const center = CROPPER_SIZE / 2
    const imgPointX = (center - offset.x) / oldScale
    const imgPointY = (center - offset.y) / oldScale
    const newOffsetX = center - imgPointX * newScale
    const newOffsetY = center - imgPointY * newScale
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
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scale = baseScale * zoom
    const sourceX = -offset.x / scale
    const sourceY = -offset.y / scale
    const sourceSize = CROPPER_SIZE / scale

    ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
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
          <h2 className="text-center text-sm font-semibold mb-1 text-neutral-100">
            Acomoda tu foto de perfil
          </h2>
          <p className="text-center text-xs text-neutral-500 mb-4">
            Arrastra la imagen para moverla y usa la barra para hacer zoom
          </p>

          <div
            className="relative mx-auto rounded-full overflow-hidden border-4 border-garnet-600 bg-ink-950 cursor-grab active:cursor-grabbing touch-none select-none"
            style={{ width: CROPPER_SIZE, height: CROPPER_SIZE }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <img
              ref={cropImgRef}
              src={cropSrc}
              onLoad={handleImageLoad}
              draggable={false}
              alt="Ajustar foto de perfil"
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
