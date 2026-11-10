'use client'

// v1.9.0 · Cajón «Looks» del clóset: temas del Círculo Lunar listos para ponerte + tus combinaciones guardadas.
// Aplicar un look/tema solo cambia la vista previa; no se ve en tu perfil hasta que pulses «Guardar».
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { palettesOf } from '../components/cosmetics/kit'
import type { CatalogItem } from '../lib/cosmetics'
import { THEMES, deleteLookById, listLooks, lookFromConfig, saveLookAs, themeToPatch, type LookLike, type LookTheme, type SavedLook } from '../lib/looks'

const TIER_LABEL = { creciente: 'Luna Creciente', llena: 'Luna Llena', eclipse: 'Eclipse' } as const
const TIER_CLS = { creciente: 'bg-sky-400/15 text-sky-200', llena: 'bg-violet-400/15 text-violet-200', eclipse: 'bg-rose-400/15 text-rose-200' } as const

function dotsOf(l: Partial<LookLike>): string[] {
  const out: string[] = []
  const add = (type: string, e?: { id: string; palette?: string } | null) => {
    if (!e) return
    const pal = palettesOf(type, e.id).find((x) => x.id === e.palette) ?? palettesOf(type, e.id)[0]
    if (pal?.c[0]) out.push(pal.c[0])
  }
  add('avatar_decoration', l.avatar_deco)
  add('profile_card', l.card)
  add('name_effect', l.effect)
  add('entry_effect', l.entry)
  return out.slice(0, 4)
}

function Dots({ colors }: { colors: string[] }) {
  return (
    <span className="flex -space-x-1" aria-hidden>
      {colors.map((c, i) => (
        <span key={i} className="w-3.5 h-3.5 rounded-full border border-ink-900" style={{ background: c }} />
      ))}
    </span>
  )
}

export default function LooksPanel({ look, items, onApply }: { look: LookLike; items: CatalogItem[]; onApply: (patch: Partial<LookLike>) => void }) {
  const [saved, setSaved] = useState<SavedLook[] | null>(null)
  const [max, setMax] = useState(2)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const ownedSlugs = useMemo(() => new Set(items.filter((i) => i.owned).map((i) => `${i.type}:${i.slug}`)), [items])
  const empty = !look.avatar_deco && !look.effect && !look.font && !look.title && !look.card && !look.entry && !look.bg

  const load = useCallback(async (force = false) => {
    const r = await listLooks(force)
    if (!r) {
      setSaved([])
      setError('No se pudieron cargar tus looks. ¿Ya corriste el SQL de la 1.9.0?')
      return
    }
    setSaved(r.looks)
    setMax(r.max)
  }, [])
  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(t)
  }, [load])

  const save = async () => {
    if (busy || !name.trim()) return
    setBusy(true)
    setError('')
    setNote('')
    const err = await saveLookAs(name, look)
    setBusy(false)
    if (err) return setError(err)
    setName('')
    setNote('Look guardado.')
    await load(true)
  }
  const remove = async (l: SavedLook) => {
    setBusy(true)
    const err = await deleteLookById(l.id)
    setBusy(false)
    if (err) return setError(err)
    setNote('Look borrado.')
    await load(true)
  }
  const applyTheme = (t: LookTheme) => {
    const { patch, missing } = themeToPatch(t, ownedSlugs)
    if (Object.keys(patch).length === 0) return setError(`Todavía no tienes ninguna pieza de «${t.name}». Se desbloquea con ${TIER_LABEL[t.tier]}.`)
    onApply(patch)
    setError('')
    setNote(missing > 0 ? `Probando «${t.name}» (faltan ${missing} ${missing === 1 ? 'pieza' : 'piezas'} de niveles más altos). Pulsa Guardar para ponértelo.` : `Probando «${t.name}». Pulsa Guardar para ponértelo.`)
  }
  const applySaved = (l: SavedLook) => {
    onApply(lookFromConfig(l.config))
    setError('')
    setNote(`Probando «${l.name}». Pulsa Guardar para ponértelo.`)
  }

  const full = (saved?.length ?? 0) >= max

  return (
    <div className="space-y-5">
      {(note || error) && (
        <p className={`rounded-xl px-3 py-2 text-xs ${error ? 'bg-garnet-500/10 text-garnet-300 border border-garnet-500/30' : 'bg-emerald-400/10 text-emerald-200 border border-emerald-400/20'}`} role={error ? 'alert' : 'status'}>
          {error || note}
        </p>
      )}

      <section>
        <div className="flex items-baseline justify-between mb-1.5">
          <h3 className="text-sm font-semibold text-neutral-100">Mis looks</h3>
          <span className="text-[11px] text-neutral-500 tabular-nums">{saved?.length ?? 0}/{max}</span>
        </div>
        <div className="flex gap-1.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 30))}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder={empty ? 'Ponte algo para guardarlo' : 'Nombre del look (p. ej. «Noche de concierto»)'}
            disabled={empty || full || busy}
            className="flex-1 min-w-0 rounded-lg bg-ink-700 border border-ink-600 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-garnet-500 disabled:opacity-50"
          />
          <button type="button" onClick={save} disabled={empty || full || busy || !name.trim()} className="rounded-lg bg-garnet-600 hover:bg-garnet-500 px-3.5 py-2 text-sm font-medium text-white disabled:opacity-50 transition">
            Guardar
          </button>
        </div>
        {full && (
          <p className="mt-1.5 text-[11px] text-neutral-500">
            Llegaste al tope de looks. <Link href="/apoyar" className="text-amber-300 hover:text-amber-200">El Círculo Lunar</Link> deja guardar hasta 20.
          </p>
        )}
        <ul className="mt-2 space-y-1.5">
          {saved === null ? (
            <li className="text-xs text-neutral-500 py-2">Cargando...</li>
          ) : saved.length === 0 ? (
            <li className="text-xs text-neutral-500 py-2">Todavía no guardaste ningún look. Combina piezas arriba y guárdalas con un nombre.</li>
          ) : (
            saved.map((l) => (
              <li key={l.id} className="flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-800/60 px-3 py-2">
                <Dots colors={dotsOf(lookFromConfig(l.config))} />
                <span className="flex-1 min-w-0 truncate text-sm text-neutral-100">{l.name}</span>
                <button type="button" onClick={() => applySaved(l)} className="rounded-full border border-ink-600 px-3 py-1 text-xs text-neutral-200 hover:border-garnet-500 hover:text-garnet-300 transition">Probar</button>
                <button type="button" onClick={() => remove(l)} disabled={busy} className="text-xs text-neutral-500 hover:text-garnet-400 transition" aria-label={`Borrar el look ${l.name}`}>Borrar</button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-neutral-100 mb-0.5">Temas del Círculo Lunar</h3>
        <p className="text-[11px] text-neutral-500 mb-2">Combinaciones listas con decoración, tarjeta, nombre, título y entrada. Se prueban en la vista previa; las piezas que aún no tienes se omiten.</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {THEMES.map((t) => {
            const { patch, missing } = themeToPatch(t, ownedSlugs)
            const have = Object.keys(patch).length
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => applyTheme(t)}
                  className={`w-full text-left rounded-xl border p-3 transition ${have === 0 ? 'border-ink-700 bg-ink-800/40 opacity-70 hover:opacity-100' : 'border-ink-600 bg-ink-800/70 hover:border-garnet-500'}`}
                >
                  <span className="flex items-center gap-2">
                    <Dots colors={dotsOf(patch)} />
                    <span className="flex-1 min-w-0 truncate text-sm font-medium text-neutral-100">{t.name}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${TIER_CLS[t.tier]}`}>{TIER_LABEL[t.tier]}</span>
                  </span>
                  <span className="block mt-1 text-[11px] text-neutral-500">{t.blurb}</span>
                  <span className="block mt-1 text-[11px] text-neutral-400">{have === 0 ? '🔒 Aún no desbloqueado' : missing > 0 ? `${have}/${t.pieces.length} piezas tuyas` : 'Completo · listo para probar'}</span>
                </button>
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-[11px] text-neutral-500">
          ¿Quieres ver todo lo que trae cada nivel? <Link href="/apoyar/estilos" className="text-amber-300 hover:text-amber-200">Galería de estilos →</Link>
        </p>
      </section>
    </div>
  )
}
