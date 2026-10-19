'use client'

import { TIME_STYLES, TEXT_COLORS, type StoryTime } from '../../../lib/stories'
import TimeSticker from '../elements/TimeSticker'
import ColorStrip from './ColorPicker'

function toLocalInput(iso: string, tz: string): { date: string; time: string } {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: tz }).formatToParts(new Date(iso))
    const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
    return { date: `${g('year')}-${g('month')}-${g('day')}`, time: `${g('hour')}:${g('minute')}` }
  } catch {
    return { date: '', time: '' }
  }
}

/** Hora personalizable: «Ahora» o a mano, 12/24 h, AM/PM, fecha, zona, color y 8 estilos con vista previa en vivo */
export default function TimeEditor({ el, onChange }: { el: StoryTime; onChange: (patch: Partial<StoryTime>) => void }) {
  const local = toLocalInput(el.iso, el.tz)

  const setManual = (date: string, time: string) => {
    if (!date || !time) return
    // la hora escrita es la del lugar donde está quien publica (la zona del dispositivo)
    const d = new Date(`${date}T${time}`)
    if (!Number.isNaN(d.getTime())) onChange({ iso: d.toISOString() })
  }

  const gradientColors = el.style === 'lock' || el.style === 'neon'

  return (
    <div className="space-y-4">
      <div className="flex justify-center items-center rounded-2xl bg-[linear-gradient(160deg,#3a3a40,#1b1b1f)] py-4" style={{ minHeight: 150 }}>
        <div style={{ containerType: 'size', width: '300px', height: '140px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%) scale(.8)' }}>
            <TimeSticker el={el} animate={false} />
          </div>
        </div>
      </div>

      <div>
        <p className="text-[12px] text-neutral-400 mb-1.5">Hora y fecha</p>
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => onChange({ iso: new Date().toISOString() })} className="rounded-full bg-white/10 hover:bg-white/15 px-3.5 py-2 text-[13px]">Ahora</button>
          <input type="time" value={local.time} onChange={(e) => setManual(local.date, e.target.value)} aria-label="Hora" className="rounded-lg bg-white/8 border border-white/10 px-2.5 py-1.5 text-sm [color-scheme:dark]" />
          <input type="date" value={local.date} onChange={(e) => setManual(e.target.value, local.time)} aria-label="Fecha" className="rounded-lg bg-white/8 border border-white/10 px-2.5 py-1.5 text-sm [color-scheme:dark]" />
        </div>
        <p className="mt-1 text-[11.5px] text-neutral-500">Es una hora fija: no se mueve una vez publicada.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onChange({ hour12: !el.hour12 })} className="rounded-xl border border-white/20 py-2 text-[13px]">{el.hour12 ? 'Formato 12 h' : 'Formato 24 h'}</button>
        <button type="button" disabled={!el.hour12} onClick={() => onChange({ showPeriod: !el.showPeriod })} className="rounded-xl border border-white/20 py-2 text-[13px] disabled:opacity-40">{el.showPeriod ? 'AM/PM visible' : 'AM/PM oculto'}</button>
        <button type="button" onClick={() => onChange({ showDate: el.showDate === 'none' ? 'short' : el.showDate === 'short' ? 'long' : 'none' })} className="rounded-xl border border-white/20 py-2 text-[13px]">
          Fecha: {el.showDate === 'none' ? 'ninguna' : el.showDate === 'short' ? 'corta' : 'larga'}
        </button>
        <button type="button" onClick={() => onChange({ showZone: !el.showZone })} className="rounded-xl border border-white/20 py-2 text-[13px]">{el.showZone ? 'Zona visible' : 'Zona oculta'}</button>
      </div>

      <div>
        <p className="text-[12px] text-neutral-400 mb-1.5">{gradientColors ? 'Color (y de su degradado)' : 'Color'}</p>
        <ColorStrip value={el.color || TEXT_COLORS[0]} onPick={(c) => onChange({ color: c })} />
      </div>

      <div>
        <p className="text-[12px] text-neutral-400 mb-1.5">Estilo</p>
        <div className="grid grid-cols-4 gap-1.5">
          {TIME_STYLES.map((s) => (
            <button key={s.id} type="button" onClick={() => onChange({ style: s.id })} aria-pressed={el.style === s.id} className={`rounded-xl py-2 text-[12px] border ${el.style === s.id ? 'bg-white text-black border-white' : 'border-white/20'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
