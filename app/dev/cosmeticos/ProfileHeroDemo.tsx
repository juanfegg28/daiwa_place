'use client'

import ProfileHero from '../../perfil/[username]/ProfileHero'
import ProfileCard from '../../components/cosmetics/ProfileCard'
import SampleBlocks from '../../components/cosmetics/SampleBlocks'
import { ProfileBackground } from '../../components/cosmetics/cosmetics'
import { RELEASED } from '../../components/cosmetics/kit'
import type { Equip } from '../../lib/cosmetics'

const BANNER = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a1f3d"/><stop offset=".6" stop-color="#2d2a6e"/><stop offset="1" stop-color="#0f1b3a"/></linearGradient></defs><rect width="900" height="300" fill="url(#b)"/><circle cx="740" cy="90" r="46" fill="#ffe9b8" opacity=".85"/><g fill="#fff" opacity=".7"><circle cx="120" cy="60" r="2"/><circle cx="260" cy="120" r="1.6"/><circle cx="420" cy="50" r="2.2"/><circle cx="560" cy="150" r="1.4"/></g></svg>`)
const eq = (slug: string, palette?: string): Equip => ({ id: slug, palette })
const pal = (list: { slug: string; palettes: { id: string }[] }[], i: number) => eq(list[i % list.length].slug, list[i % list.length].palettes[0]?.id)

type Demo = { key: string; label: string; username: string; id_student: string; bio: string; own: boolean; card?: Equip; deco?: Equip; fx?: Equip; font?: string; title?: Equip; bg?: Equip; badges: string[] }

export default function ProfileHeroDemo({ photo }: { photo: string }) {
  const demos: Demo[] = [
    { key: 'clasico', label: '1 · Sin tarjeta (encabezado clásico) + decoración + efecto + título', username: 'aiko', id_student: 'Aiko Daiwa', bio: 'Colecciono estrellas.', own: true, deco: pal(RELEASED.decos, 3), fx: pal(RELEASED.names, 2), title: eq(RELEASED.titles[0].slug, 'a'), badges: ['noctis'] },
    { key: 'tarjeta', label: '2 · Tarjeta de la tienda + decoración + efecto de nombre (bio corta)', username: 'mei', id_student: 'Mei', bio: 'Escribo en las madrugadas y colecciono cartas.', own: false, card: pal(RELEASED.cards, 1), deco: pal(RELEASED.decos, 12), fx: pal(RELEASED.names, 5), title: eq(RELEASED.titles[3].slug, 'a'), badges: ['noctis', 'sakura'] },
    { key: 'largo', label: '3 · Tarjeta + fondo + bio LARGA + nombre largo (peor caso)', username: 'nombre_muy_largo_de_usuario', id_student: 'Nombre Larguísimo De Prueba Daiwa', bio: 'Esta es una biografía muy larga para probar que la tarjeta no se rompe: escribo historias, dibujo todos los días, toco guitarra en el club de música y colecciono postales de lugares donde nunca he estado.', own: false, card: pal(RELEASED.cards, 8), deco: pal(RELEASED.decos, 30), font: 'pirata-one', fx: pal(RELEASED.names, 9), title: eq(RELEASED.titles[6].slug, 'a'), bg: pal(RELEASED.backgrounds, 2), badges: ['noctis', 'sakura', 'neo', 'pixel'] },
  ]
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {demos.map((d) => (
        <div key={d.key}>
          <p className="text-xs text-neutral-400 mb-2">{d.label}</p>
          <div data-demo={d.key} className="relative isolate rounded-2xl border border-ink-700 bg-ink-950 overflow-hidden pb-6">
            {d.bg && <ProfileBackground background={d.bg} />}
            <div className="relative z-10">
              <ProfileHero
                profile={{ id: d.key, username: d.username, id_student: d.id_student, bio: d.bio, avatar_url: photo, banner_url: BANNER, badge_color: null, is_frozen: false, created_at: '2026-08-02T10:00:00Z', name_color: null }}
                cos={{ deco: d.deco ?? null, nameStyle: { font: d.font ?? null, effect: d.fx ?? null }, title: d.title ?? null, card: d.card ?? null }}
                isMyProfile={d.own} roles={[]} clubTags={[]} ringStatus={undefined} userId="demo" isFollowing={false} followsMe={false} iBlockedThem={false}
                onFollowChange={() => {}} onBlockChange={() => {}}
                badges={d.badges.map((b) => ({ slug: b, name: b }))}
              >
                {d.card ? <SampleBlocks bio={d.bio} /> : null}
              </ProfileHero>
              <div className="max-w-2xl mx-auto px-4 mt-4">
                {!d.card && (
                  <ProfileCard color={null} mode={null} solid={!!d.bg}>
                    <SampleBlocks bio={d.bio} />
                  </ProfileCard>
                )}
                <div className="rounded-xl border border-ink-800 bg-ink-900/80 p-3 text-sm text-neutral-300">Así se vería una publicación debajo del encabezado.</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
