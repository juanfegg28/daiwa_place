'use client'

// v1.9.0 · Vitrina del perfil: publicaciones, frases, canciones y recuerdos que la persona quiere destacar.
// Es opcional (la activa/desactiva su dueña), se pide SOLO si el perfil la tiene activada y en celular es un carrusel compacto.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import MusicChip from '../MusicChip'
import ResilientImage from '../ResilientImage'
import ShowcaseEditor from './ShowcaseEditor'
import { EditIcon, ShowcaseIcon } from '../icons'
import { getShowcase, SHOWCASE_DEFAULT_TITLE, type Showcase, type ShowcaseItem } from '../../lib/showcase'
import { normalizeTrack } from '../../lib/music'

function fmtDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ItemCard({ item }: { item: ShowcaseItem }) {
  const base = 'snap-start shrink-0 w-[78%] sm:w-64 rounded-2xl border border-ink-700 bg-ink-800/70 p-3.5 flex flex-col gap-2 min-h-[8.5rem] max-h-[15rem] overflow-hidden'
  if (item.type === 'post') {
    const p = item.post
    return (
      <Link href={`/post/${item.post_id}`} className={`${base} hover:border-garnet-500/60 transition`} aria-label="Ver la publicación destacada">
        {p?.image?.url && (
          <span className="relative block w-full h-20 rounded-lg overflow-hidden bg-ink-700 shrink-0">
            <ResilientImage src={p.image.url} alt="" fill sizes="260px" className="object-cover" />
          </span>
        )}
        <p className="text-sm text-neutral-200 line-clamp-4 break-words whitespace-pre-wrap">{p?.content?.trim() || (p?.image ? 'Publicación con foto' : 'Publicación')}</p>
        <span className="mt-auto text-[11px] text-neutral-500">{fmtDate(p?.created_at)}</span>
      </Link>
    )
  }
  if (item.type === 'quote') {
    return (
      <div className={`${base} justify-between`}>
        <p className="text-[15px] leading-snug text-neutral-100 italic break-words line-clamp-6 font-display">“{item.text}”</p>
        {item.by && <span className="text-xs text-neutral-500">— {item.by}</span>}
      </div>
    )
  }
  if (item.type === 'song') {
    const t = normalizeTrack(item.track)
    return (
      <div className={`${base} justify-between`}>
        {t?.cover && (
          <span className="relative block w-14 h-14 rounded-lg overflow-hidden bg-ink-700 shrink-0">
            <ResilientImage src={t.cover} alt="" fill sizes="56px" className="object-cover" />
          </span>
        )}
        <MusicChip track={item.track} variant="card" />
        {item.note && <p className="text-xs text-neutral-400 line-clamp-2 break-words">{item.note}</p>}
      </div>
    )
  }
  return (
    <div className={base}>
      <div className="flex items-start gap-2">
        <p className="flex-1 min-w-0 text-sm font-semibold text-neutral-100 break-words line-clamp-2">{item.title}</p>
        {item.date && <span className="shrink-0 rounded-full bg-ink-700 px-2 py-0.5 text-[10px] text-neutral-400">{fmtDate(item.date)}</span>}
      </div>
      {item.text && <p className="text-sm text-neutral-300 break-words whitespace-pre-wrap line-clamp-5">{item.text}</p>}
    </div>
  )
}

export default function ShowcaseSection({ profileId, isOwn, hasShowcase, userId }: { profileId: string; isOwn: boolean; hasShowcase: boolean; userId: string | null }) {
  const [data, setData] = useState<Showcase | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [flag, setFlag] = useState(hasShowcase)

  // solo se pide si el perfil dice que tiene vitrina activada (o es la tuya y la tienes)
  const [prevHas, setPrevHas] = useState(hasShowcase)
  if (prevHas !== hasShowcase) {
    setPrevHas(hasShowcase)
    setFlag(hasShowcase)
  }
  useEffect(() => {
    let alive = true
    const t = window.setTimeout(() => {
      if (!flag) {
        setLoaded(true)
        return
      }
      void getShowcase(profileId).then((s) => {
        if (!alive) return
        setData(s)
        setLoaded(true)
      })
    }, 0)
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [profileId, flag])

  const items = data?.enabled || isOwn ? data?.items ?? [] : []
  const visible = !!data?.enabled && items.length > 0

  if (!isOwn && !visible) return null

  return (
    <section className="mt-4" aria-label="Vitrina">
      {visible ? (
        <>
          <div className="flex items-center gap-2 mb-2">
            <ShowcaseIcon className="w-5 h-5 text-garnet-400" />
            <h2 className="flex-1 min-w-0 truncate text-sm font-semibold text-neutral-100">{data?.title?.trim() || SHOWCASE_DEFAULT_TITLE}</h2>
            {isOwn && (
              <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-garnet-400 transition">
                <EditIcon className="w-4 h-4" /> Editar
              </button>
            )}
          </div>
          <div className="-mx-4 sm:mx-0 px-4 sm:px-0 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] overscroll-x-contain">
            {items.map((it) => (
              <ItemCard key={it.id} item={it} />
            ))}
          </div>
        </>
      ) : (
        isOwn &&
        loaded && (
          <div className="rounded-2xl border border-dashed border-ink-600 p-3.5 flex items-center gap-3">
            <ShowcaseIcon className="w-6 h-6 text-neutral-500 shrink-0" />
            <p className="flex-1 min-w-0 text-[13px] text-neutral-400 leading-snug">
              {data && !data.enabled && data.items.length > 0 ? 'Tu vitrina está oculta. Actívala para que se vea en tu perfil.' : 'Destaca publicaciones, frases, canciones o recuerdos en una vitrina opcional.'}
            </p>
            <button type="button" onClick={() => setEditing(true)} className="shrink-0 rounded-full border border-ink-600 px-3.5 py-1.5 text-sm text-neutral-200 hover:border-garnet-500 hover:text-garnet-300 transition">
              {data && data.items.length > 0 ? 'Editar' : 'Crear'}
            </button>
          </div>
        )
      )}
      {editing && userId && (
        <ShowcaseEditor
          userId={userId}
          initial={data}
          onClose={() => setEditing(false)}
          onSaved={(s) => {
            setData(s)
            setFlag(!!s?.enabled && (s?.items.length ?? 0) > 0)
            setEditing(false)
          }}
        />
      )}
    </section>
  )
}
