'use client'

import { useEffect, useState } from 'react'
import { CustomColorPicker } from '../../ColorPicker'
import { TEXT_COLORS, lsGet, lsSet } from '../../../lib/stories'
import ScrollStrip from '../ScrollStrip'

export { CustomColorPicker }

const RECENT_KEY = 'daiwa_story_recent_colors'
export function readRecentColors(): string[] {
  try {
    return (JSON.parse(lsGet(RECENT_KEY) ?? '[]') as string[]).filter((c) => /^#[0-9A-Fa-f]{6}$/.test(c)).slice(0, 4)
  } catch {
    return []
  }
}
export function pushRecentColor(c: string) {
  const list = [c.toUpperCase(), ...readRecentColors().filter((x) => x.toUpperCase() !== c.toUpperCase())].slice(0, 4)
  lsSet(RECENT_KEY, JSON.stringify(list))
}

/** Tira de 14 muestras + los 4 últimos usados + selector personalizado */
export default function ColorStrip({ value, onPick, className = '' }: { value: string; onPick: (hex: string) => void; className?: string }) {
  const [custom, setCustom] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  useEffect(() => {
    function run() {
      setRecent(readRecentColors())
    }
    run()
  }, [])
  const choose = (c: string) => {
    onPick(c)
    pushRecentColor(c)
    setRecent(readRecentColors())
  }
  return (
    <div className={className}>
      <ScrollStrip>
        {TEXT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => choose(c)}
            aria-label={`Color ${c}`}
            aria-pressed={value.toLowerCase() === c.toLowerCase()}
            className={`shrink-0 w-7 h-7 rounded-full border-2 ${value.toLowerCase() === c.toLowerCase() ? 'border-white scale-110' : 'border-white/30'}`}
            style={{ background: c }}
          />
        ))}
        <button
          type="button"
          onClick={() => setCustom((v) => !v)}
          aria-label="Color personalizado"
          className="shrink-0 w-7 h-7 rounded-full border-2 border-white/60"
          style={{ background: 'conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' }}
        />
      </ScrollStrip>
      {recent.length > 0 && (
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10.5px] text-neutral-500">Recientes</span>
          {recent.map((c) => (
            <button key={c} type="button" onClick={() => onPick(c)} aria-label={`Color reciente ${c}`} className="w-5 h-5 rounded-full border border-white/30" style={{ background: c }} />
          ))}
        </div>
      )}
      {custom && (
        <div className="mt-2">
          <CustomColorPicker value={value} onChange={onPick} onCommit={pushRecentColor} />
        </div>
      )}
    </div>
  )
}
