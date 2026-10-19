'use client'

import { TEXT_FONTS, type StoryText } from '../../../lib/stories'
import { textStyle } from '../elements/TextElement'
import ColorStrip from './ColorPicker'
import ScrollStrip from '../ScrollStrip'

const BG_ORDER: StoryText['bgMode'][] = ['none', 'solid', 'soft', 'outline']
const BG_LABEL: Record<StoryText['bgMode'], string> = { none: 'Sin fondo', solid: 'Sólido', soft: 'Suave', outline: 'Contorno' }
const ALIGN_ORDER: StoryText['align'][] = ['center', 'left', 'right']
const ALIGN_ICON: Record<StoryText['align'], string> = { left: '⬅', center: '↔', right: '➡' }

/** Todo lo de un texto: 8 estilos de letra, alineación, fondo, 14 colores + personalizado y tamaño. Se usa en el editor y en el inspector. */
export default function TextControls({ el, onChange, compact = false }: { el: StoryText; onChange: (patch: Partial<StoryText>) => void; compact?: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange({ align: ALIGN_ORDER[(ALIGN_ORDER.indexOf(el.align) + 1) % 3] })}
          aria-label="Cambiar alineación"
          className="shrink-0 w-9 h-9 rounded-full bg-white/10 text-sm"
        >
          {ALIGN_ICON[el.align]}
        </button>
        <button
          type="button"
          onClick={() => onChange({ bgMode: BG_ORDER[(BG_ORDER.indexOf(el.bgMode) + 1) % 4] })}
          aria-label={`Fondo del texto: ${BG_LABEL[el.bgMode]}`}
          className="shrink-0 h-9 px-3 rounded-full bg-white/10 text-[12.5px] font-semibold flex items-center gap-1.5"
        >
          <span className="w-5 h-5 rounded flex items-center justify-center text-[12px] font-bold" style={el.bgMode === 'solid' ? { background: '#fff', color: '#000' } : el.bgMode === 'soft' ? { background: 'rgba(255,255,255,.45)' } : el.bgMode === 'outline' ? { border: '2px solid #fff' } : {}}>A</span>
          {BG_LABEL[el.bgMode]}
        </button>
        <div className="flex-1 flex items-center gap-2 min-w-[90px]">
          <span className="text-[11px] text-neutral-400">Tamaño</span>
          <input
            type="range"
            min={3}
            max={14}
            step={0.5}
            value={el.size}
            onChange={(e) => onChange({ size: Number(e.target.value) })}
            aria-label="Tamaño del texto"
            className="flex-1 accent-[var(--color-garnet-500)]"
          />
        </div>
      </div>

      <ScrollStrip>
        {TEXT_FONTS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange({ font: f.id, ...(f.id === 'marcador' && el.bgMode === 'none' ? { bgMode: 'solid' as const } : {}) })}
            aria-pressed={el.font === f.id}
            className={`shrink-0 rounded-full px-3.5 py-1.5 border ${el.font === f.id ? 'bg-white text-black border-white' : 'border-white/30 text-white'}`}
          >
            <span style={{ ...textStyle({ font: f.id, color: 'currentColor', bgMode: 'none', align: 'center', size: 4.2 }, 'vw'), fontSize: '15px', textShadow: 'none', lineHeight: 1.2, display: 'inline-block' }}>{f.label}</span>
          </button>
        ))}
      </ScrollStrip>

      {!compact && <p className="text-[11px] text-neutral-500 -mb-1">{el.bgMode === 'solid' || el.bgMode === 'soft' ? 'Color de la caja' : 'Color del texto'}</p>}
      <ColorStrip value={el.color} onPick={(c) => onChange({ color: c, bgColor: undefined })} />
    </div>
  )
}
