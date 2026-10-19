'use client'

import { CheckIcon } from '../../icons'
import type { StoryAudience } from '../../../lib/stories'
import Sheet from '../Sheet'

const OPTIONS: { id: StoryAudience; title: string; desc: string; icon: string }[] = [
  { id: 'followers', title: 'Seguidores', desc: 'Las personas que te siguen', icon: '👥' },
  { id: 'friends', title: 'Solo amigos', desc: 'Solo quienes te siguen y tú también sigues', icon: '💚' },
]

/** Quién puede ver la historia. No se puede cambiar después de publicar. */
export default function AudienceSheet({ open, value, friendsCount, onClose, onPick }: { open: boolean; value: StoryAudience; friendsCount: number | null; onClose: () => void; onPick: (a: StoryAudience) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="¿Quién puede ver tu historia?" z={150}>
      <div className="space-y-2">
        {OPTIONS.map((o) => (
          <button key={o.id} type="button" onClick={() => { onPick(o.id); onClose() }} aria-pressed={value === o.id} className={`w-full flex items-center gap-3 rounded-2xl border p-4 text-left transition ${value === o.id ? 'border-garnet-500 bg-garnet-600/10' : 'border-white/10 hover:bg-white/5'}`}>
            <span className="text-2xl">{o.icon}</span>
            <span className="flex-1">
              <span className="block text-[15px] font-semibold">{o.title}{o.id === 'friends' && friendsCount !== null ? ` · ${friendsCount}` : ''}</span>
              <span className="block text-[12.5px] text-neutral-400">{o.desc}</span>
            </span>
            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${value === o.id ? 'bg-garnet-600 border-garnet-600' : 'border-white/30'}`}>{value === o.id && <CheckIcon className="w-3.5 h-3.5" />}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-neutral-500">No se puede cambiar después. Si te equivocas, borra la historia: dentro de los 2 primeros minutos no gasta cupo.</p>
    </Sheet>
  )
}
