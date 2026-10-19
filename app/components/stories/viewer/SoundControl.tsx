'use client'

import { useEffect, useRef, useState } from 'react'
import { VolumeIcon } from '../../icons'

function levelFor(muted: boolean, volume: number): 'mute' | 'low' | 'mid' | 'high' {
  if (muted || volume <= 0) return 'mute'
  if (volume < 0.34) return 'low'
  if (volume <= 0.66) return 'mid'
  return 'high'
}

/**
 * Altavoz del visor. Toque = silenciar / activar. PC: al pasar el ratón se despliega un deslizador hacia la
 * izquierda. Celular: mantener pulsado (o tocar el «⌄») abre un popover con el deslizador (se cierra a los 2.5 s).
 */
export default function SoundControl({
  muted,
  volume,
  disabled,
  hasMusic,
  hint,
  onToggle,
  onVolume,
  onDragging,
}: {
  muted: boolean
  volume: number
  disabled: boolean
  hasMusic: boolean
  hint: boolean
  onToggle: () => void
  onVolume: (v: number) => void
  onDragging: (d: boolean) => void
}) {
  const [pop, setPop] = useState(false)
  const [showPct, setShowPct] = useState(false)
  const holdTimer = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)
  const longPressed = useRef(false)

  const armClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setPop(false), 2500)
  }
  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
      if (holdTimer.current) window.clearTimeout(holdTimer.current)
    }
  }, [])

  const level = levelFor(muted, volume)
  const label = disabled ? 'La música está desactivada en Configuración' : muted ? 'Activar sonido' : 'Silenciar'
  const pct = Math.round(volume * 100)

  const slider = (
    <input
      type="range"
      min={0}
      max={100}
      value={pct}
      aria-label="Volumen"
      onChange={(e) => {
        onVolume(Number(e.target.value) / 100)
        if (pop) armClose()
      }}
      onPointerDown={() => {
        onDragging(true)
        setShowPct(true)
      }}
      onPointerUp={() => {
        onDragging(false)
        setShowPct(false)
      }}
      onPointerCancel={() => {
        onDragging(false)
        setShowPct(false)
      }}
      className="story-range w-full"
      style={{ ['--pct' as string]: `${pct}%` }}
    />
  )

  return (
    <div className="relative group flex items-center">
      {/* PC: el deslizador sale hacia la izquierda al pasar el ratón */}
      <div className="hidden md:flex absolute right-full mr-1 items-center h-9 pl-3 pr-2 rounded-full bg-black/50 backdrop-blur w-0 overflow-hidden opacity-0 group-hover:w-[120px] group-hover:opacity-100 group-focus-within:w-[120px] group-focus-within:opacity-100 transition-all duration-200">
        <div className="relative w-[96px]">
          {showPct && <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-white bg-black/70 rounded px-1.5">{pct} %</span>}
          {slider}
        </div>
      </div>

      <button
        type="button"
        aria-label={label}
        title={label}
        disabled={disabled}
        onClick={() => {
          if (longPressed.current) {
            longPressed.current = false
            return
          }
          onToggle()
        }}
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse') return
          longPressed.current = false
          holdTimer.current = window.setTimeout(() => {
            longPressed.current = true
            setPop(true)
            armClose()
          }, 450)
        }}
        onPointerUp={() => holdTimer.current && window.clearTimeout(holdTimer.current)}
        onPointerLeave={() => holdTimer.current && window.clearTimeout(holdTimer.current)}
        className={`relative w-9 h-9 rounded-full flex items-center justify-center bg-black/40 backdrop-blur text-white disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${hint && muted && hasMusic ? 'animate-pulse' : ''}`}
      >
        <VolumeIcon level={level} className="w-[18px] h-[18px]" />
      </button>
      <button
        type="button"
        aria-label="Ajustar volumen"
        onClick={() => {
          setPop((v) => !v)
          armClose()
        }}
        className="md:hidden w-5 h-9 flex items-center justify-center text-white/80"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </button>

      {pop && (
        <div className="md:hidden absolute top-full right-0 mt-2 w-[170px] rounded-2xl bg-black/75 backdrop-blur px-3.5 py-3 z-30" onPointerDown={armClose}>
          <div className="flex items-center justify-between text-[11px] text-white/80 mb-1.5">
            <span>Volumen</span>
            <span className="font-semibold text-white">{pct} %</span>
          </div>
          <div className="w-[140px]">{slider}</div>
        </div>
      )}

      {hint && muted && hasMusic && !disabled && (
        <span className="absolute top-full right-0 mt-2 whitespace-nowrap rounded-full bg-black/70 backdrop-blur text-white text-[11.5px] font-medium px-3 py-1.5 pointer-events-none">
          🔈 Toca para activar el sonido
        </span>
      )}
      {disabled && hasMusic && (
        <span className="absolute top-full right-0 mt-2 w-max max-w-[210px] rounded-xl bg-black/75 text-white text-[11px] px-2.5 py-1.5 opacity-0 group-hover:opacity-100 pointer-events-none">
          La música está desactivada en Configuración
        </span>
      )}
    </div>
  )
}
