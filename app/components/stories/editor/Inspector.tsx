'use client'

import type { StoryElement, StoryEmoji, StoryLocation, StoryMusicEl, StoryText, StoryTime } from '../../../lib/stories'
import { MUSIC_STYLES, MUSIC_THEMES } from '../../../lib/stories'
import { TrashIcon } from '../../icons'
import TextControls from './TextControls'
import LocationEditor from './LocationEditor'
import TimeEditor from './TimeEditor'

/** Ajustes del elemento seleccionado: capa, duplicar, borrar y lo propio de cada tipo */
export default function Inspector({
  el,
  places,
  coverThemeOk,
  hasTrack,
  onChange,
  onDelete,
  onLayer,
  onDuplicate,
  onEditText,
  onChangeSong,
  onPickClip,
}: {
  el: StoryElement
  places: string[]
  coverThemeOk: boolean
  hasTrack: boolean
  onChange: (patch: Partial<StoryElement>) => void
  onDelete: () => void
  onLayer: (dir: 1 | -1) => void
  onDuplicate: () => void
  onEditText: () => void
  onChangeSong: () => void
  onPickClip: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button type="button" onClick={() => onLayer(1)} className="rounded-full bg-white/10 px-3 py-1.5 text-[12.5px]">Subir capa</button>
        <button type="button" onClick={() => onLayer(-1)} className="rounded-full bg-white/10 px-3 py-1.5 text-[12.5px]">Bajar capa</button>
        <button type="button" onClick={onDuplicate} className="rounded-full bg-white/10 px-3 py-1.5 text-[12.5px]">Duplicar</button>
        <button type="button" onClick={onDelete} aria-label="Borrar elemento" className="ml-auto rounded-full bg-garnet-600/80 px-3 py-1.5 text-[12.5px] flex items-center gap-1"><TrashIcon className="w-3.5 h-3.5" /> Borrar</button>
      </div>

      {el.type === 'text' && (
        <div className="space-y-3">
          <button type="button" onClick={onEditText} className="w-full rounded-xl border border-white/20 py-2 text-[13px]">Editar texto</button>
          <TextControls el={el as StoryText} onChange={(p) => onChange(p)} />
        </div>
      )}

      {el.type === 'emoji' && (
        <label className="flex items-center gap-3 text-[13px] text-neutral-300">
          Tamaño
          <input type="range" min={6} max={40} value={(el as StoryEmoji).size} onChange={(e) => onChange({ size: Number(e.target.value) } as Partial<StoryEmoji>)} className="flex-1 accent-[var(--color-garnet-500)]" />
        </label>
      )}

      {el.type === 'music' && (
        <div className="space-y-3">
          <div>
            <p className="text-[12px] text-neutral-400 mb-1.5">Diseño <span className="text-neutral-600">(un toque sobre el sticker lo cambia)</span></p>
            <div className="grid grid-cols-3 gap-1.5">
              {MUSIC_STYLES.map((s) => (
                <button key={s.id} type="button" onClick={() => onChange({ style: s.id } as Partial<StoryMusicEl>)} aria-pressed={(el as StoryMusicEl).style === s.id} className={`rounded-xl py-2 text-[12.5px] border ${(el as StoryMusicEl).style === s.id ? 'bg-white text-black border-white' : 'border-white/20'}`}>{s.label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[12px] text-neutral-400 mb-1.5">Color</p>
            <div className="grid grid-cols-4 gap-1.5">
              {MUSIC_THEMES.filter((t) => t.id !== 'cover' || coverThemeOk).map((t) => (
                <button key={t.id} type="button" onClick={() => onChange({ theme: t.id } as Partial<StoryMusicEl>)} aria-pressed={(el as StoryMusicEl).theme === t.id} className={`rounded-xl py-2 text-[12.5px] border ${(el as StoryMusicEl).theme === t.id ? 'bg-white text-black border-white' : 'border-white/20'}`}>{t.label}</button>
              ))}
            </div>
          </div>
          {hasTrack && (
            <div className="flex gap-2">
              <button type="button" onClick={onChangeSong} className="flex-1 rounded-xl border border-white/20 py-2 text-[13px]">Cambiar canción</button>
              <button type="button" onClick={onPickClip} className="flex-1 rounded-xl border border-white/20 py-2 text-[13px]">Elegir momento</button>
            </div>
          )}
        </div>
      )}

      {el.type === 'location' && <LocationEditor el={el as StoryLocation} places={places} onChange={(p) => onChange(p)} />}
      {el.type === 'time' && <TimeEditor el={el as StoryTime} onChange={(p) => onChange(p)} />}
    </div>
  )
}
