'use client'

import { useState } from 'react'
import ProfileHero from '../../perfil/[username]/ProfileHero'
import SampleBlocks from '../../components/cosmetics/SampleBlocks'
import { RELEASED } from '../../components/cosmetics/kit'

// Banner oscuro en blanco y negro con murciélagos (el caso difícil que usó el diseñador) y otros para probar choques de color
const bats = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 200' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#6a6a6e'/><stop offset='1' stop-color='#26262a'/></linearGradient></defs><rect width='600' height='200' fill='url(#g)'/><g fill='#0c0c0e'><path d='M90 60l14 8 10-8-4 14 10 6-14 2-6 12-6-12-14-2 10-6z'/><path d='M300 40l12 7 9-7-3 12 9 5-12 2-5 10-5-10-12-2 9-5z'/><path d='M470 90l12 7 9-7-3 12 9 5-12 2-5 10-5-10-12-2 9-5z'/><path d='M420 0h14l6 120h-26z'/><path d='M520 20l10-40 10 40v110h-20z'/></g></svg>`
const BANNERS = [
  { id: 'bn', name: 'B/N murciélagos', url: 'data:image/svg+xml;utf8,' + encodeURIComponent(bats) },
  { id: 'az', name: 'Azul-rosa', url: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 200' preserveAspectRatio='none'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#2d6cdf'/><stop offset='.55' stop-color='#8e44ec'/><stop offset='1' stop-color='#f0509b'/></linearGradient></defs><rect width='600' height='200' fill='url(#g)'/></svg>`) },
  { id: 'cl', name: 'Claro', url: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 200' preserveAspectRatio='none'><rect width='600' height='200' fill='#e6e6ee'/></svg>`) },
  { id: 'none', name: 'Sin banner', url: '' },
]
const WIDTHS = [380, 672]

/** Perfil completo con la integración REAL (mismo componente que la página de perfil) para comparar con la galería a 380 y 672 px */
export default function CardLab({ photo }: { photo: string }) {
  const cards = RELEASED.cards as { slug: string; name: string; palettes: { id: string; name: string }[] }[]
  const [slug, setSlug] = useState(cards[0].slug)
  const [pal, setPal] = useState<string>('')
  const [w, setW] = useState(672)
  const [ban, setBan] = useState('bn')
  const card = cards.find((c) => c.slug === slug) ?? cards[0]
  const palette = card.palettes.find((p) => p.id === pal)?.id ?? card.palettes[0]?.id
  const banner = BANNERS.find((b) => b.id === ban) ?? BANNERS[0]
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
        <select data-testid="card-select" value={slug} onChange={(e) => { setSlug(e.target.value); setPal('') }} className="rounded-full bg-ink-800 border border-ink-700 px-3 py-1.5 text-neutral-200">
          {cards.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <select value={palette} onChange={(e) => setPal(e.target.value)} className="rounded-full bg-ink-800 border border-ink-700 px-3 py-1.5 text-neutral-200">
          {card.palettes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={ban} onChange={(e) => setBan(e.target.value)} className="rounded-full bg-ink-800 border border-ink-700 px-3 py-1.5 text-neutral-200">
          {BANNERS.map((b) => <option key={b.id} value={b.id}>Banner: {b.name}</option>)}
        </select>
        {WIDTHS.map((x) => <button key={x} onClick={() => setW(x)} className={`px-3 py-1 rounded-full border ${w === x ? 'bg-garnet-600 border-garnet-500 text-white' : 'border-ink-600'}`}>{x} px</button>)}
      </div>
      <div data-testid="card-lab" className="mx-auto rounded-2xl border border-ink-700 bg-ink-950 pb-4" style={{ width: w, maxWidth: '100%' }}>
        <ProfileHero
          profile={{ id: 'lab', username: 'renshsh', id_student: 'Ren Shiraishi', bio: '🎸 3年生 · 音楽部 🎧 Rock / Visual Kei / SNSD ☕ 音楽 / 読書 / コーヒー', avatar_url: photo, banner_url: banner.url || null, badge_color: null, is_frozen: false, created_at: '2026-09-02T10:00:00Z', name_color: null }}
          cos={{ deco: { id: 'marco-fundador', palette: 'fundador' }, nameStyle: null, title: null, card: { id: slug, palette } }}
          isMyProfile roles={[]} clubTags={[]} ringStatus={undefined} userId="lab" isFollowing={false} followsMe={false} iBlockedThem={false}
          onFollowChange={() => {}} onBlockChange={() => {}} badges={[]}
        >
          <SampleBlocks bio="🎸 3年生 · 音楽部 🎧 Rock / Visual Kei / SNSD ☕ 音楽 / 読書 / コーヒー 🎸 Guitar 静かな方が好き" />
        </ProfileHero>
      </div>
    </div>
  )
}
