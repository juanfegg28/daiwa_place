'use client'

// v1.9.0 · Círculo Lunar → Estilos: TODOS los cosméticos exclusivos por nivel y cómo se verían en TU perfil.
// Optimizado: nada se pide a Supabase salvo tu nivel (1 consulta guardada 1 min); las miniaturas se dibujan solo al acercarse
// a la pantalla (lazy), quedan quietas y solo se animan la que señalas y la vista previa.
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import AppShell, { useAppSession } from '../../components/AppShell'
import Logo from '../../components/Logo'
import ItemPreview, { type PreviewSubject } from '../../components/cosmetics/ItemPreview'
import ProfileMock, { EMPTY_COMBO, type Combo } from '../../components/supporters/ProfileMock'
import SupporterTabs from '../../components/supporters/SupporterTabs'
import { palettesOf } from '../../components/cosmetics/kit'
import { CloseIcon } from '../../components/icons'
import { supabase } from '../../lib/supabaseClient'
import { cached } from '../../lib/netCache'
import {
  MEMBER_ITEMS,
  MEMBER_TIERS,
  MEMBER_TYPE_LABEL,
  MEMBER_TYPE_ORDER,
  tierRank,
  type MemberItem,
  type MemberTier,
  type MemberType,
} from '../../lib/memberCatalog'

const SLOT: Record<MemberType, keyof Combo> = { avatar_decoration: 'deco', profile_card: 'card', name_effect: 'name', title: 'title', entry_effect: 'entry' }
const SLOT_LABEL: Record<keyof Combo, string> = { deco: 'Decoración', card: 'Tarjeta', name: 'Nombre', title: 'Título', entry: 'Entrada' }
const keyOf = (i: Pick<MemberItem, 'type' | 'slug'>) => `${i.type}:${i.slug}`

export default function EstilosPage() {
  const [auth, setAuth] = useState<'loading' | 'in' | 'out'>('loading')
  useEffect(() => {
    let alive = true
    void supabase.auth.getSession().then(({ data }) => alive && setAuth(data.session ? 'in' : 'out'))
    return () => {
      alive = false
    }
  }, [])
  if (auth === 'loading') return <div className="min-h-dvh lunar-bg" />
  if (auth === 'in')
    return (
      <AppShell>
        <InShell />
      </AppShell>
    )
  return (
    <div className="min-h-dvh lunar-bg">
      <header className="max-w-5xl mx-auto px-4 pt-5 flex items-center justify-between">
        <Link href="/login" className="flex items-center gap-2 text-neutral-50"><Logo /></Link>
        <Link href="/login" className="rounded-full border border-white/20 px-4 py-2 text-sm text-neutral-100 hover:bg-white/10">Iniciar sesión</Link>
      </header>
      <Gallery me={{ username: 'tu_usuario', name: 'Tu nombre', avatarUrl: null }} signedIn={false} />
    </div>
  )
}

function InShell() {
  const { username, displayName, avatarUrl } = useAppSession()
  return (
    <div className="lunar-bg min-h-dvh">
      <Gallery me={{ username: username ?? 'tu_usuario', name: displayName || username || 'Tu nombre', avatarUrl: avatarUrl ?? null }} signedIn />
    </div>
  )
}

async function loadMyRank(): Promise<number> {
  const { data, error } = await supabase.rpc('supporter_me')
  if (error || !data) return 0
  const m = (data as { membership?: { tier?: string; active?: boolean } | null }).membership
  return m?.active && (m.tier === 'creciente' || m.tier === 'llena' || m.tier === 'eclipse') ? tierRank(m.tier) : 0
}

function Gallery({ me, signedIn }: { me: PreviewSubject & { name: string }; signedIn: boolean }) {
  const [tier, setTier] = useState<MemberTier>('creciente')
  const [type, setType] = useState<MemberType | 'all'>('all')
  const [myRank, setMyRank] = useState(0)
  const [hover, setHover] = useState<string | null>(null)
  const [combo, setCombo] = useState<Combo>(EMPTY_COMBO)
  const [last, setLast] = useState<MemberItem | null>(null)
  const [entryKey, setEntryKey] = useState(0)
  const [sheet, setSheet] = useState(false)

  useEffect(() => {
    if (!signedIn) return
    let alive = true
    void cached('supporter:rank', 60_000, loadMyRank).then((r) => {
      if (!alive) return
      setMyRank(r)
      if (r > 0) setTier(MEMBER_TIERS[r - 1].id) // se abre en TU nivel
    })
    return () => {
      alive = false
    }
  }, [signedIn])

  const items = useMemo(() => MEMBER_ITEMS.filter((i) => tierRank(i.tier) <= tierRank(tier) && (type === 'all' || i.type === type)), [tier, type])
  const grouped = useMemo(
    () =>
      MEMBER_TYPE_ORDER.map((t) => ({ t, list: items.filter((i) => i.type === t).sort((a, b) => tierRank(a.tier) - tierRank(b.tier)) })).filter((g) => g.list.length > 0),
    [items]
  )
  const newCount = MEMBER_ITEMS.filter((i) => i.tier === tier).length
  const tierInfo = MEMBER_TIERS.find((t) => t.id === tier)!

  const pick = (item: MemberItem) => {
    const slot = SLOT[item.type]
    const cur = combo[slot]
    const palette = palettesOf(item.type, item.slug)[0]?.id
    setLast(item)
    setCombo((c) => ({ ...c, [slot]: cur?.id === item.slug ? null : { id: item.slug, palette } }))
    if (item.type === 'entry_effect') setEntryKey((k) => k + 1)
    setSheet(true)
  }
  const setPalette = (item: MemberItem, palette: string) => {
    const slot = SLOT[item.type]
    setCombo((c) => (c[slot]?.id === item.slug ? { ...c, [slot]: { ...c[slot]!, palette } } : c))
  }
  const lastPalette = last ? combo[SLOT[last.type]]?.palette : undefined
  const lastLocked = last ? tierRank(last.tier) > myRank : false
  const nameOf = (slot: keyof Combo) => MEMBER_ITEMS.find((i) => SLOT[i.type] === slot && i.slug === combo[slot]?.id)?.name

  const panel = (
    <div className="space-y-3">
      <ProfileMock me={me} combo={combo} entryKey={entryKey} />
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(SLOT_LABEL) as (keyof Combo)[]).map((slot) => (
          <button
            key={slot}
            type="button"
            disabled={!combo[slot]}
            onClick={() => setCombo((c) => ({ ...c, [slot]: null }))}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition ${combo[slot] ? 'border-violet-300/50 bg-violet-300/10 text-violet-100 hover:border-garnet-400' : 'border-white/10 text-neutral-500'}`}
            title={combo[slot] ? 'Quitar de la combinación' : undefined}
          >
            <span className="text-neutral-400">{SLOT_LABEL[slot]}:</span> {nameOf(slot) ?? '—'}
            {combo[slot] && <CloseIcon className="w-3 h-3" />}
          </button>
        ))}
      </div>
      {last && combo[SLOT[last.type]] && (
        <div>
          <p className="text-xs text-neutral-400 mb-1.5">Paleta de «{last.name}» <span className="text-neutral-600">(+ color libre en tu clóset)</span></p>
          <div className="flex flex-wrap gap-1.5">
            {palettesOf(last.type, last.slug).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPalette(last, p.id)}
                aria-label={p.name}
                aria-pressed={lastPalette === p.id}
                title={p.name}
                className={`w-7 h-7 rounded-full border-2 transition ${lastPalette === p.id ? 'border-white scale-110' : 'border-white/20 hover:border-white/60'}`}
                style={{ background: `linear-gradient(135deg, ${p.c[0]}, ${p.c[1] ?? p.c[0]})` }}
              />
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        {combo.entry && (
          <button type="button" onClick={() => setEntryKey((k) => k + 1)} className="rounded-full border border-white/20 px-3.5 py-1.5 text-sm text-neutral-100 hover:bg-white/10 transition">Reproducir entrada</button>
        )}
        {signedIn && myRank > 0 && last && !lastLocked ? (
          <Link href={`/personalizar?probar=${last.type}:${last.slug}:${lastPalette ?? ''}`} className="rounded-full bg-white text-black px-4 py-1.5 text-sm font-semibold hover:bg-neutral-200 transition">Ponérmelo en el clóset</Link>
        ) : (
          <Link href="/apoyar" className="rounded-full bg-white text-black px-4 py-1.5 text-sm font-semibold hover:bg-neutral-200 transition">{myRank > 0 ? 'Sube de nivel' : 'Unirme al Círculo'}</Link>
        )}
        {combo.deco || combo.card || combo.name || combo.title || combo.entry ? (
          <button type="button" onClick={() => setCombo(EMPTY_COMBO)} className="rounded-full px-3 py-1.5 text-sm text-neutral-400 hover:text-white transition">Limpiar</button>
        ) : null}
      </div>
      {last && lastLocked && <p className="text-xs text-amber-200/90">«{last.name}» se desbloquea con {MEMBER_TIERS[tierRank(last.tier) - 1].name}.</p>}
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      <SupporterTabs active="estilos" signedIn={signedIn} />
      <section className="text-center max-w-2xl mx-auto mb-6">
        <p className="text-[12px] tracking-[0.25em] uppercase text-violet-300/80">Círculo Lunar</p>
        <h1 className="font-display text-3xl sm:text-5xl font-semibold mt-1 bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent">Estilos</h1>
        <p className="mt-3 text-neutral-300 text-sm sm:text-base leading-relaxed">
          {MEMBER_ITEMS.length} cosméticos míticos exclusivos, cada uno con 10 paletas y color libre. Elige un nivel y toca una pieza para ver cómo quedaría en <strong className="text-white">tu perfil</strong>; puedes combinar varias.
          {myRank > 0 ? ' Los de tu nivel ya los recibiste solos: no tienes que reclamar nada.' : ''}
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3 mb-5" role="tablist" aria-label="Nivel">
        {MEMBER_TIERS.map((t) => {
          const count = MEMBER_ITEMS.filter((i) => tierRank(i.tier) <= t.rank).length
          const mine = myRank >= t.rank
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tier === t.id}
              onClick={() => setTier(t.id)}
              className={`text-left rounded-2xl border p-4 transition ${tier === t.id ? 'border-violet-300/70 bg-violet-300/10 shadow-[0_0_30px_-10px] shadow-violet-400/60' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
            >
              <span className="flex items-center gap-2">
                <span className="text-base font-semibold text-neutral-50">{t.name}</span>
                {mine && <span className="rounded-full bg-emerald-400/15 text-emerald-300 text-[10px] px-2 py-0.5">Tuyo</span>}
                <span className="ml-auto text-xs text-neutral-400">{t.price}/mes</span>
              </span>
              <span className="block mt-1 text-xs text-neutral-400 leading-snug">{t.blurb}</span>
              <span className="block mt-2 text-[11px] text-violet-200/80 tabular-nums">{count} cosméticos en total</span>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-neutral-400 mb-3 text-center">
        {tier === 'creciente' ? `${newCount} cosméticos en este nivel.` : `Incluye todo lo de los niveles de abajo + ${newCount} nuevos en ${tierInfo.name}.`}
      </p>

      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1 justify-start sm:justify-center [scrollbar-width:none]">
        {(['all', ...MEMBER_TYPE_ORDER] as const).map((t) => (
          <button key={t} type="button" onClick={() => setType(t)} aria-pressed={type === t} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition ${type === t ? 'border-white bg-white text-black font-medium' : 'border-white/15 text-neutral-300 hover:border-white/40'}`}>
            {t === 'all' ? 'Todo' : MEMBER_TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8 items-start">
        <div className="space-y-8">
          {grouped.map((g) => (
            <section key={g.t} aria-label={MEMBER_TYPE_LABEL[g.t]}>
              <h2 className="text-sm font-semibold text-neutral-200 mb-2.5">{MEMBER_TYPE_LABEL[g.t]} <span className="text-neutral-500 font-normal">· {g.list.length}</span></h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {g.list.map((item) => {
                  const k = keyOf(item)
                  const selected = combo[SLOT[item.type]]?.id === item.slug
                  const locked = tierRank(item.tier) > myRank
                  const isNew = item.tier === tier
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => pick(item)}
                      onMouseEnter={() => setHover(k)}
                      onMouseLeave={() => setHover((h) => (h === k ? null : h))}
                      onFocus={() => setHover(k)}
                      onBlur={() => setHover((h) => (h === k ? null : h))}
                      aria-pressed={selected}
                      className={`group text-left rounded-2xl border p-2 transition ${selected ? 'border-violet-300 bg-violet-300/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
                    >
                      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-ink-950/70">
                        <ItemPreview type={item.type} slug={item.slug} me={me} compact lazy playing={hover === k || selected} />
                        {signedIn && locked && <span className="absolute top-1.5 right-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-amber-200">🔒</span>}
                      </div>
                      <p className="mt-1.5 text-[13px] font-medium text-neutral-100 truncate">{item.name}</p>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {isNew ? <span className="text-violet-300">Nuevo en {tierInfo.name}</span> : `De ${MEMBER_TIERS[tierRank(item.tier) - 1].name}`}
                      </p>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
        {/* escritorio: la vista previa te acompaña al bajar */}
        <aside className="hidden lg:block sticky top-6" aria-label="Vista previa en tu perfil">
          <h2 className="text-sm font-semibold text-neutral-200 mb-2.5">Tu perfil con estos estilos</h2>
          {panel}
        </aside>
      </div>

      {/* celular: la vista previa se abre desde abajo al tocar una pieza */}
      {sheet && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end bg-black/70" role="dialog" aria-modal="true" aria-label="Vista previa en tu perfil" onMouseDown={(e) => e.target === e.currentTarget && setSheet(false)}>
          <div className="w-full max-h-[88dvh] overflow-y-auto rounded-t-3xl border border-white/10 bg-ink-900 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-neutral-50">Tu perfil con estos estilos</h2>
              <button type="button" onClick={() => setSheet(false)} aria-label="Cerrar" className="rounded-full p-1.5 text-neutral-400 hover:text-white hover:bg-white/10"><CloseIcon className="w-5 h-5" /></button>
            </div>
            {panel}
          </div>
        </div>
      )}
    </div>
  )
}
