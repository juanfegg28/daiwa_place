'use client'

import { MENTION_STYLES, type MentionTheme, type StoryMention } from '../../../lib/stories'

const THEMES: { id: MentionTheme; label: string }[] = [
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
  { id: 'accent', label: 'Acento' },
]

/** v1.6.2 · Estilo y color de un sticker de mención ya puesto en la historia */
export default function MentionEditor({ el, onChange }: { el: StoryMention; onChange: (patch: Partial<StoryMention>) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-neutral-400">Mencionas a <b className="text-white">@{el.username}</b>. Al tocar el sticker en la historia se abre su perfil.</p>
      <div>
        <p className="text-[12px] text-neutral-400 mb-1.5">Diseño</p>
        <div className="grid grid-cols-4 gap-1.5">
          {MENTION_STYLES.map((s) => (
            <button key={s.id} type="button" onClick={() => onChange({ style: s.id })} aria-pressed={el.style === s.id} className={`rounded-xl py-2 text-[12.5px] border ${el.style === s.id ? 'bg-white text-black border-white' : 'border-white/20'}`}>{s.label}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[12px] text-neutral-400 mb-1.5">Color</p>
        <div className="grid grid-cols-3 gap-1.5">
          {THEMES.map((t) => (
            <button key={t.id} type="button" onClick={() => onChange({ theme: t.id })} aria-pressed={el.theme === t.id} className={`rounded-xl py-2 text-[12.5px] border ${el.theme === t.id ? 'bg-white text-black border-white' : 'border-white/20'}`}>{t.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
