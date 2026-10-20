'use client'

import { useEffect, useState } from 'react'

/** Lluvia de lunas al ganar Lunas (800 ms; se apaga con «reducir movimiento» desde el CSS) */
export default function MoonRain({ show, onDone }: { show: boolean; onDone?: () => void }) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (!show) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOn(true)
    const t = setTimeout(() => {
      setOn(false)
      onDone?.()
    }, 1300)
    return () => clearTimeout(t)
  }, [show, onDone])
  if (!on) return null
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-16 h-48 z-[60] overflow-hidden">
      {Array.from({ length: 16 }).map((_, i) => (
        <span key={i} className="moon-drop text-amber-300 text-lg" style={{ left: `${(i * 6.3 + 3) % 96}%`, animationDelay: `${(i % 6) * 0.09}s` }}>
          ☾
        </span>
      ))}
    </div>
  )
}
