'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { TimerIcon, CloseIcon, FlashPhotoIcon } from '../components/icons'
import { DM_IMAGE_BUCKET, isImageGone, remainingLabel, type DmMessage } from '../lib/dm'

/**
 * La foto de un mensaje directo, con su cuenta regresiva. Al cumplirse expires_at desaparece sola y
 * queda un aviso. Se pide con un enlace firmado de corta vida (el bucket es privado).
 */
export default function DmImage({ message, mine }: { message: DmMessage; mine: boolean }) {
  const [now, setNow] = useState(() => Date.now())
  const [url, setUrl] = useState<string | null>(message.localPreview ?? null)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)

  const gone = isImageGone(message, now)

  // reloj: cada 20 s (cada segundo en el último minuto) para que el contador y la desaparición sean exactos
  useEffect(() => {
    if (!message.expires_at) return
    const left = new Date(message.expires_at).getTime() - Date.now()
    if (left <= 0) return
    const timer = window.setInterval(() => setNow(Date.now()), left < 70000 ? 1000 : 20000)
    return () => window.clearInterval(timer)
  }, [message.expires_at, gone])

  // enlace firmado: dura como máximo una hora o lo que le quede de vida a la foto
  useEffect(() => {
    const path = message.image_path
    if (message.localPreview || !path || message.deleted_at) return
    if (message.expires_at && new Date(message.expires_at).getTime() <= Date.now()) return
    let cancelled = false
    async function sign() {
      const left = message.expires_at ? Math.floor((new Date(message.expires_at).getTime() - Date.now()) / 1000) : 3600
      const seconds = Math.max(30, Math.min(3600, left))
      const { data, error } = await supabase.storage.from(DM_IMAGE_BUCKET).createSignedUrl(path as string, seconds)
      if (cancelled) return
      if (error || !data) setFailed(true)
      else setUrl(data.signedUrl)
    }
    sign()
    return () => {
      cancelled = true
    }
  }, [message.image_path, message.expires_at, message.localPreview, message.deleted_at])

  const ratio = message.image_w && message.image_h ? message.image_w / message.image_h : 4 / 3
  // marco con la proporción real de la foto (entre horizontal 16:10 y vertical 3:4) para que el chat no salte al cargar
  const boxRatio = Math.min(1.6, Math.max(0.75, ratio))

  if (gone) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-dashed border-ink-600 px-3.5 py-3 text-neutral-500">
        <FlashPhotoIcon className="w-5 h-5 shrink-0" />
        <span className="text-[13px] italic">La foto se autodestruyó</span>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => url && setOpen(true)}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Ver foto"
        className="relative block w-[min(62vw,260px)] overflow-hidden rounded-2xl bg-ink-800 border border-ink-600 text-left"
        style={{ aspectRatio: String(boxRatio) }}
      >
        {url && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Foto" draggable={false} className="absolute inset-0 w-full h-full object-cover select-none" onError={() => setFailed(true)} />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs text-neutral-500 px-3 text-center">
            {failed ? 'No se pudo cargar la foto' : 'Cargando foto...'}
          </span>
        )}
        {message.expires_at && (
          <span className="absolute left-1.5 bottom-1.5 inline-flex items-center gap-1 rounded-full bg-black/65 text-white text-[10.5px] font-medium px-2 py-0.5 backdrop-blur-sm">
            <TimerIcon className="w-3 h-3" />
            {mine ? 'Se borra en' : 'Desaparece en'} {remainingLabel(message.expires_at, now)}
          </span>
        )}
      </button>

      {open && url && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="Foto">
          <button type="button" aria-label="Cerrar" onClick={() => setOpen(false)} className="absolute top-[calc(1rem+env(safe-area-inset-top,0px))] right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
            <CloseIcon className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Foto" draggable={false} onContextMenu={(e) => e.preventDefault()} className="max-w-full max-h-full object-contain select-none rounded-lg" onClick={(e) => e.stopPropagation()} />
          {message.expires_at && (
            <p className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-black/70 text-white text-xs px-3 py-1.5">
              <TimerIcon className="w-3.5 h-3.5" />
              Desaparece en {remainingLabel(message.expires_at, now)}
            </p>
          )}
        </div>
      )}
    </>
  )
}
