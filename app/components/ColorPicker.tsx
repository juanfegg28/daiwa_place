'use client'

import { useState } from 'react'
import { useRef } from 'react'

export function hexToHsv(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0')
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let hue = 0
  if (d) {
    if (max === r) hue = ((g - b) / d) % 6
    else if (max === g) hue = (b - r) / d + 2
    else hue = (r - g) / d + 4
  }
  hue = Math.round((hue * 60 + 360) % 360)
  return [hue, max === 0 ? 0 : d / max, max]
}
export function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return '#' + [f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
}

/** Selector libre: matiz + saturación/brillo + campo hex (+ cuentagotas si el navegador lo trae).
 *  Compartido por las historias y por la personalización de perfiles. */
export function CustomColorPicker({
  value,
  onChange,
  onCommit,
  themed = false,
}: {
  value: string
  onChange: (hex: string) => void
  onCommit?: (hex: string) => void
  /** true = usa los colores del tema (perfil); false = estilo «sobre fondo oscuro» de las historias */
  themed?: boolean
}) {
  const [[h, s, v], setHsv] = useState<[number, number, number]>(() => hexToHsv(value))
  const [hexText, setHexText] = useState(value.toUpperCase())
  const area = useRef<HTMLDivElement | null>(null)
  const dragging = useRef(false)

  const emit = (nh: number, ns: number, nv: number, commit = false) => {
    setHsv([nh, ns, nv])
    const hex = hsvToHex(nh, ns, nv)
    setHexText(hex)
    onChange(hex)
    if (commit) onCommit?.(hex)
  }
  const fromPointer = (e: React.PointerEvent, commit = false) => {
    const r = area.current?.getBoundingClientRect()
    if (!r) return
    const ns = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    const nv = 1 - Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
    emit(h, ns, nv, commit)
  }
  const hasEye = typeof window !== 'undefined' && 'EyeDropper' in window
  const field = themed ? 'bg-ink-900 border border-ink-700 text-neutral-100' : 'bg-white/8 border border-white/10'
  const btn = themed ? 'bg-ink-700 text-neutral-200' : 'bg-white/10'

  return (
    <div className="space-y-3 w-full max-w-[280px]">
      <div
        ref={area}
        className="relative h-32 rounded-xl touch-none cursor-crosshair"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${h} 100% 50%))` }}
        onPointerDown={(e) => {
          dragging.current = true
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
          fromPointer(e)
        }}
        onPointerMove={(e) => dragging.current && fromPointer(e)}
        onPointerUp={(e) => {
          dragging.current = false
          fromPointer(e, true)
        }}
      >
        <span className="absolute w-4 h-4 rounded-full border-2 border-white shadow -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%`, background: hsvToHex(h, s, v) }} />
      </div>
      <input
        type="range"
        min={0}
        max={359}
        value={h}
        aria-label="Matiz"
        onChange={(e) => emit(Number(e.target.value), s, v)}
        onPointerUp={() => onCommit?.(hsvToHex(h, s, v))}
        className="w-full h-3 rounded-full appearance-none cursor-pointer"
        style={{ background: 'linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' }}
      />
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-full border border-white/30" style={{ background: hsvToHex(h, s, v) }} />
        <input
          value={hexText}
          maxLength={7}
          aria-label="Color en hexadecimal"
          onChange={(e) => {
            const t = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`
            setHexText(t.toUpperCase())
            if (/^#[0-9A-Fa-f]{6}$/.test(t)) {
              setHsv(hexToHsv(t))
              onChange(t.toUpperCase())
              onCommit?.(t.toUpperCase())
            }
          }}
          className={`flex-1 min-w-0 rounded-lg px-3 py-1.5 text-sm font-mono outline-none focus:border-garnet-500 ${field}`}
        />
        {hasEye && (
          <button
            type="button"
            className={`rounded-lg px-2.5 py-1.5 text-xs ${btn}`}
            onClick={async () => {
              try {
                const dropper = new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper()
                const r = await dropper.open()
                const hex = r.sRGBHex.toUpperCase()
                setHsv(hexToHsv(hex))
                setHexText(hex)
                onChange(hex)
                onCommit?.(hex)
              } catch {
                /* cancelado */
              }
            }}
          >
            Cuentagotas
          </button>
        )}
      </div>
    </div>
  )
}
