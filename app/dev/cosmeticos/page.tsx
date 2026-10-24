'use client'

/**
 * /dev/cosmeticos — galería de comparación del catálogo de la 1.4.0 (sin base de datos: usa directamente los diseños).
 * Muestra SOLO lo lanzado (1.4.0). Sangre Noir y Emo Abismo (1.5.0) no aparecen: el kit los filtra con la guardia de versiones.
 * Está apagada en producción salvo que se ponga NEXT_PUBLIC_DEV_COSMETICOS=1 (útil en una vista previa de Vercel).
 */
import { useMemo, useState } from 'react'
import { notFound } from 'next/navigation'
import Avatar from '../../components/cosmetics/Avatar'
import { CollectionBadge, NameFx, SkinThumb, TitlePill, EntryEffect } from '../../components/cosmetics/cosmetics'
import CardLab from './CardLab'
import {
  BADGE_IDS, DECO_COLLECTIONS, EXCLUSIVE_TITLE_LIST, RELEASED,
} from '../../components/cosmetics/kit'
import { FONT_META } from '../../lib/cosmeticFonts'
import { fontFamilyOf, loadCosmeticFont, writePrefs, useCosmeticPrefs } from '../../lib/cosmetics'
import { backgroundOut } from '../../components/cosmetics/kit'
import ProfileHeroDemo from './ProfileHeroDemo'

const DEMO_PHOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d36a8a"/><stop offset="1" stop-color="#3b2a6e"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="38" r="17" fill="#f6dfe6"/><path d="M14 100c0-22 16-36 36-36s36 14 36 36z" fill="#f6dfe6"/></svg>`)
const SIZES = [28, 40, 52, 80, 128]

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-xl font-semibold text-neutral-50 mb-3">{title}{count !== undefined && <span className="text-sm text-neutral-500 font-normal ml-2">{count}</span>}</h2>
      {children}
    </section>
  )
}

function Gallery() {
  const prefs = useCosmeticPrefs()
  const [entry, setEntry] = useState<string | null>(null)
  const counts = useMemo(() => ({
    decos: RELEASED.decos.length, cards: RELEASED.cards.length, entries: RELEASED.entries.length, names: RELEASED.names.length,
    backgrounds: RELEASED.backgrounds.length, titles: RELEASED.titles.length, fonts: RELEASED.fonts.length,
  }), [])
  const dec = RELEASED.decos
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-neutral-200">
      <h1 className="font-display text-3xl font-semibold text-neutral-50">Cosméticos · galería de la 1.4.0</h1>
      <p className="text-sm text-neutral-400 mt-1 mb-4">Solo el catálogo lanzado. Compáralo con la galería de referencia del kit.</p>
      <div data-testid="counts" className="flex flex-wrap gap-2 mb-5 text-xs">
        {Object.entries(counts).map(([k, v]) => <span key={k} className="rounded-full border border-ink-600 px-3 py-1">{k}: <b>{v}</b></span>)}
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-8 text-sm">
        <span className="text-neutral-500">Animaciones:</span>
        {(['todas', 'perfiles', 'ninguna'] as const).map((a) => <button key={a} onClick={() => writePrefs({ anim: a })} className={`px-3 py-1 rounded-full border ${prefs.anim === a ? 'bg-garnet-600 border-garnet-500 text-white' : 'border-ink-600'}`}>{a}</button>)}
        <span className="text-neutral-500 ml-3">Efectos de nombre:</span>
        {(['full', 'lite', 'plain'] as const).map((a) => <button key={a} onClick={() => writePrefs({ nameFx: a })} className={`px-3 py-1 rounded-full border ${prefs.nameFx === a ? 'bg-garnet-600 border-garnet-500 text-white' : 'border-ink-600'}`}>{a === 'full' ? 'completa' : a === 'lite' ? 'ligera' : 'plana'}</button>)}
      </div>

      <Section title="Perfiles de ejemplo (estructura real del perfil)"><ProfileHeroDemo photo={DEMO_PHOTO} /></Section>

      <Section title="Decoraciones de avatar" count={dec.length}>
        {DECO_COLLECTIONS.filter((c: { id: string }) => dec.some((d: { coll: string }) => d.coll === c.id)).map((c: { id: string; name: string }) => (
          <div key={c.id} className="mb-5">
            <h3 className="text-sm font-semibold text-neutral-300 mb-2">{c.name}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {dec.filter((d: { coll: string }) => d.coll === c.id).map((d: { slug: string; name: string; rarity: string; price: number; palettes: { id: string }[] }) => (
                <div key={d.slug} data-deco={d.slug} className="rounded-xl border border-ink-700 bg-ink-900/60 p-3">
                  <div className="flex items-end justify-center gap-3 min-h-[110px]">
                    {SIZES.slice(1, 5).map((s) => (
                      <span key={s} style={{ width: s * 0.62, height: s * 0.62, display: 'inline-block' }}>
                        <Avatar username="daiwa" avatarUrl={DEMO_PHOTO} size="w-full h-full" sizes="96px" deco={{ id: d.slug, palette: d.palettes[0]?.id }} decoContext="profile" />
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-neutral-100 truncate">{d.name}</p>
                  <p className="text-[11px] text-neutral-500">{d.rarity} · {d.price} ☾ · {d.palettes.length} paletas</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Tarjetas de perfil v2 (superficie fluida: banner afuera + tarjeta que envuelve los bloques)" count={counts.cards}>
        <CardLab photo={DEMO_PHOTO} />
        <h3 className="text-sm font-semibold text-neutral-300 mt-6 mb-2">Miniaturas (como en la tienda)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {RELEASED.cards.map((c: { slug: string; name: string; palettes: { id: string }[] }) => (
            <div key={c.slug} data-card={c.slug} className="rounded-xl border border-ink-700 bg-ink-950/60 p-3">
              <SkinThumb card={{ id: c.slug, palette: c.palettes[0]?.id }} name="Aiko Daiwa" photoUrl={DEMO_PHOTO} width={200} />
              <p className="text-xs text-neutral-400 mt-2 text-center">{c.name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Efectos de entrada (toca para ver)" count={counts.entries}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {RELEASED.entries.map((e: { slug: string; name: string }) => (
            <button key={e.slug} onClick={() => setEntry(entry === e.slug ? null : e.slug)} className="relative h-28 rounded-xl border border-ink-700 bg-ink-950 overflow-hidden text-left">
              {entry === e.slug && <EntryEffect effect={{ id: e.slug }} loop className="absolute inset-0" />}
              <span className="absolute bottom-1.5 left-2 text-xs text-neutral-300">{e.name}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Efectos de nombre" count={counts.names}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {RELEASED.names.map((n: { slug: string; name: string; palettes: { id: string }[] }) => (
            <div key={n.slug} data-name={n.slug} className="rounded-xl border border-ink-700 bg-ink-900/60 p-3 text-center">
              <NameFx effect={{ id: n.slug, palette: n.palettes[0]?.id }} text="Aiko Daiwa" className="font-display text-xl font-semibold" />
              <p className="text-[11px] text-neutral-500 mt-1">{n.name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Fuentes (prueba de glifos: Ñandú José Ángel ¿¡ü)" count={counts.fonts}>
        <FontGrid />
      </Section>

      <Section title="Fondos de perfil" count={counts.backgrounds}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {RELEASED.backgrounds.map((b: { slug: string; name: string; palettes: { id: string }[] }) => (
            <div key={b.slug} data-bg={b.slug}>
              <div className="dpw relative h-28 rounded-xl overflow-hidden border border-ink-700" data-live="1" data-static="0" dangerouslySetInnerHTML={{ __html: backgroundOut(b.slug, { palette: b.palettes[0]?.id }) }} />
              <p className="text-xs text-neutral-400 mt-1">{b.name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Títulos y títulos exclusivos" count={counts.titles + EXCLUSIVE_TITLE_LIST(false).length}>
        <div className="flex flex-wrap gap-3">
          {RELEASED.titles.map((t: { slug: string }) => <TitlePill key={t.slug} title={{ id: t.slug, palette: 'a' }} />)}
          {EXCLUSIVE_TITLE_LIST(false).map((t: { slug: string }) => <TitlePill key={t.slug} title={{ id: t.slug, palette: 'a' }} />)}
        </div>
      </Section>

      <Section title="Insignias de colección" count={BADGE_IDS.filter((b: string) => b !== 'crimson' && b !== 'emo').length}>
        <div className="flex flex-wrap gap-4">
          {BADGE_IDS.filter((b: string) => b !== 'crimson' && b !== 'emo').map((b: string) => <span key={b} data-badge={b} className="text-center"><CollectionBadge collection={b} size={48} /><p className="text-[10px] text-neutral-500">{b}</p></span>)}
        </div>
      </Section>
    </div>
  )
}

function FontGrid() {
  const list = Object.entries(FONT_META)
  useMemo(() => { list.forEach(([slug, m]) => loadCosmeticFont({ slug, family: m.family, weight: m.weight, italic: m.italic })) }, [list])
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
      {list.map(([slug, m]) => (
        <div key={slug} data-font={slug} className="rounded-lg border border-ink-700 bg-ink-900/60 px-3 py-2">
          <p className="text-lg text-neutral-50 truncate" style={{ fontFamily: fontFamilyOf(slug) }}>Ñandú José Ángel ¿¡ü</p>
          <p className="text-[10px] text-neutral-500">{m.family} · {m.license}{m.free ? ' · gratis' : ''}</p>
        </div>
      ))}
    </div>
  )
}

export default function DevCosmeticosPage() {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_DEV_COSMETICOS !== '1') notFound()
  return <Gallery />
}
