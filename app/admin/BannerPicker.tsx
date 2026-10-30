'use client'

import BannerArt from '../components/shop/BannerArt'
import { SHOP_THEMES } from '../components/shop/shopThemes'

/** v1.5.10 · Selector de banner con vista previa real de cada escena (antes eran solo chips de color). */
export default function BannerPicker({ value, onChange, label = 'Banner' }: { value: string; onChange: (id: string) => void; label?: string }) {
  return (
    <div>
      <p className="text-xs text-neutral-400 mb-1.5">{label} <span className="text-neutral-500">· toca el que quieras</span></p>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {SHOP_THEMES.map((t) => {
          const on = value === t.id
          return (
            <button key={t.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(t.id)}
              className={`group text-left rounded-xl overflow-hidden border-2 transition ${on ? 'border-white shadow-lg shadow-black/40' : 'border-white/10 hover:border-white/40'}`}>
              <span data-anim="off" className="relative block h-16 sm:h-20 isolate" style={{ contentVisibility: 'auto' }}>
                <BannerArt theme={t.id} />
                {on && <span className="absolute top-1.5 right-1.5 z-10 rounded-full bg-white text-black text-[10px] font-extrabold px-1.5 py-0.5">✓ Elegido</span>}
              </span>
              <span className="block px-2.5 py-1.5 bg-black/50">
                <span className="block text-xs font-semibold text-white leading-tight">{t.label}</span>
                {t.hint && <span className="block text-[10px] text-neutral-400 leading-tight truncate">{t.hint}</span>}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
