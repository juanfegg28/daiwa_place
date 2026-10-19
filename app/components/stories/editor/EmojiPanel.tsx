'use client'

import { useMemo, useState } from 'react'
import { SearchIcon } from '../../icons'
import ScrollStrip from '../ScrollStrip'
import { EMOJI_CATEGORIES, type EmojiEntry } from '../../../lib/emojiData'
import { lsGet, lsSet } from '../../../lib/stories'

const RECENT_KEY = 'daiwa_story_recent_emojis'
const SKIN_KEY = 'daiwa_story_skin'
const TONES = ['', '🏻', '🏼', '🏽', '🏾', '🏿']

function readRecent(): string[] {
  try {
    return (JSON.parse(lsGet(RECENT_KEY) ?? '[]') as string[]).slice(0, 24)
  } catch {
    return []
  }
}

/** Cuadrícula de emojis con categorías, buscador en español, tono de piel recordado y recientes (24) */
export default function EmojiPanel({ onPick }: { onPick: (emoji: string) => void }) {
  const [cat, setCat] = useState('recientes')
  const [q, setQ] = useState('')
  const [tone, setTone] = useState<number>(() => {
    const n = Number(lsGet(SKIN_KEY))
    return Number.isFinite(n) && n >= 0 && n <= 5 ? n : 0
  })
  const [recent, setRecent] = useState<string[]>(() => (typeof window === 'undefined' ? [] : readRecent()))

  const pick = (e: EmojiEntry) => {
    const emoji = e[2] && tone > 0 ? e[2][tone - 1] ?? e[0] : e[0]
    onPick(emoji)
    const next = [emoji, ...recent.filter((x) => x !== emoji)].slice(0, 24)
    setRecent(next)
    lsSet(RECENT_KEY, JSON.stringify(next))
  }

  const all = useMemo(() => EMOJI_CATEGORIES.flatMap((c) => c.items), [])
  const needle = q.trim().toLowerCase()
  const items: EmojiEntry[] = needle
    ? all.filter((e) => e[1].includes(needle)).slice(0, 120)
    : cat === 'recientes'
      ? recent.map((r) => [r, ''] as EmojiEntry)
      : EMOJI_CATEGORIES.find((c) => c.id === cat)?.items ?? []

  const showTones = !needle && (cat === 'gestos' || cat === 'caras')

  return (
    <div>
      <label className="mb-2 flex items-center gap-2 rounded-full bg-white/8 border border-white/10 px-3.5 h-10">
        <SearchIcon className="w-4 h-4 text-neutral-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar emoji (corazón, fuego…)" className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-neutral-500" />
      </label>
      {!needle && (
        <ScrollStrip className="mb-1">
          {[{ id: 'recientes', label: 'Recientes', icon: '🕘' }, ...EMOJI_CATEGORIES].map((c) => (
            <button key={c.id} type="button" onClick={() => setCat(c.id)} aria-label={c.label} title={c.label} className={`shrink-0 w-9 h-9 rounded-full text-lg flex items-center justify-center ${cat === c.id ? 'bg-white/20' : 'hover:bg-white/10'}`}>
              {c.icon}
            </button>
          ))}
        </ScrollStrip>
      )}
      {showTones && (
        <div className="flex items-center gap-1 mb-2">
          <span className="text-[11px] text-neutral-500 mr-1">Tono</span>
          {TONES.map((t, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setTone(i)
                lsSet(SKIN_KEY, String(i))
              }}
              aria-label={`Tono de piel ${i}`}
              className={`w-6 h-6 rounded-full text-sm flex items-center justify-center ${tone === i ? 'ring-2 ring-white' : ''}`}
            >
              {i === 0 ? '✋' : `✋${t}`}
            </button>
          ))}
        </div>
      )}
      {items.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-neutral-500">{needle ? 'No hay emojis con ese nombre' : 'Aquí aparecerán los últimos que uses'}</p>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {items.map((e, i) => {
            const shown = e[2] && tone > 0 ? e[2][tone - 1] ?? e[0] : e[0]
            return (
              <button key={`${e[0]}-${i}`} type="button" onClick={() => pick(e)} aria-label={e[1] || e[0]} className="aspect-square rounded-lg text-[26px] leading-none flex items-center justify-center hover:bg-white/10 active:scale-90 transition">
                {shown}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
