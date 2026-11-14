'use client'

// Explorar 2.0 (v1.9.0): buscar personas y clubes + descubrir temas, publicaciones populares, clubes y cuentas.
// Todo el descubrimiento sale de UN paquete (explore_hub) guardado 30 min en Supabase y 10 min en el dispositivo:
// abrir Explorar casi nunca cuesta una consulta. Sin algoritmos por persona.
import ScrollCarousel from '../components/ScrollCarousel'
import Avatar from '../components/cosmetics/Avatar'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import AppShell, { useAppSession } from '../components/AppShell'
import ResilientImage from '../components/ResilientImage'
import { ClubAvatar, KindLabel } from '../components/ClubCard'
import { SearchIcon, FireIcon, StarIcon, SparklesIcon, ClubsIcon, HeartIcon, CommentIcon, UsersIcon } from '../components/icons'
import { useBlockedIds } from '../lib/useBlocked'
import { cached } from '../lib/netCache'
import { loadExploreHub, loadPopularPosts, type ExploreClub, type ExploreHub, type ExploreMember, type PopularPost } from '../lib/explore'

type SearchResult = { id: string; username: string; id_student: string | null; avatar_url: string | null; grado: string | null }
type TrendingTag = { tag: string; uses: number }
type RankedProfile = { id: string; username: string; id_student: string | null; avatar_url: string | null; followers_count?: number; created_at?: string }
type ClubHit = Pick<ExploreClub, 'id' | 'slug' | 'name' | 'kind' | 'color' | 'avatar_url'>

function MiniProfileRow({ profile, meta }: { profile: RankedProfile | SearchResult | ExploreMember; meta?: string | null }) {
  return (
    <Link href={`/perfil/${profile.username}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink-700/60 transition">
      <Avatar username={profile.username} avatarUrl={profile.avatar_url} size="w-10 h-10" textSize="text-sm" sizes="48px" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-100 truncate">{profile.id_student || profile.username}</p>
        <p className="text-xs text-neutral-600 truncate">@{profile.username}</p>
      </div>
      {meta && <span className="text-xs text-neutral-500 shrink-0 ml-2">{meta}</span>}
    </Link>
  )
}

function SectionTitle({ icon, children, hint }: { icon: React.ReactNode; children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-300">
        {icon}
        {children}
      </h2>
      {hint && <p className="text-xs text-neutral-500 mt-0.5">{hint}</p>}
    </div>
  )
}

function PopularCard({ p }: { p: PopularPost }) {
  const img = p.images?.[0]?.url
  return (
    <Link href={`/post/${p.id}`} className="surface-card rounded-2xl p-3 flex gap-3 hover:bg-ink-700/50 transition">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Avatar username={p.author?.username ?? '?'} avatarUrl={p.author?.avatar_url} size="w-6 h-6" textSize="text-[10px]" sizes="32px" />
          <span className="text-xs font-semibold text-neutral-200 truncate">{p.author?.id_student || p.author?.username}</span>
        </div>
        <p className="text-sm text-neutral-300 line-clamp-3 break-words">{p.content.trim() || (img ? 'Publicación con foto' : '')}</p>
        <p className="mt-1.5 flex items-center gap-3 text-[11px] text-neutral-500 tabular-nums">
          <span className="inline-flex items-center gap-1"><HeartIcon className="w-3.5 h-3.5" /> {p.likes}</span>
          <span className="inline-flex items-center gap-1"><CommentIcon className="w-3.5 h-3.5" /> {p.comments}</span>
        </p>
      </div>
      {img && (
        <span className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-ink-700 shrink-0">
          <ResilientImage src={img} alt="" fill sizes="80px" className="object-cover" />
        </span>
      )}
    </Link>
  )
}

function ClubTile({ c }: { c: ExploreClub | ClubHit }) {
  const members = 'members' in c ? c.members : null
  return (
    <Link href={`/clubes/${c.slug}`} className="snap-start shrink-0 w-44 surface-card rounded-2xl p-3 flex flex-col gap-2 hover:bg-ink-700/50 transition">
      <ClubAvatar club={c} size="w-12 h-12" />
      <p className="text-sm font-semibold text-neutral-100 truncate">{c.name}</p>
      <div className="flex items-center gap-2">
        <KindLabel kind={c.kind} />
        {members !== null && (
          <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 tabular-nums"><UsersIcon className="w-3 h-3" /> {members}</span>
        )}
      </div>
      {'description' in c && c.description && <p className="text-xs text-neutral-500 line-clamp-2 break-words">{c.description}</p>}
    </Link>
  )
}

export default function ExplorarPage() {
  return (
    <AppShell>
      <ExplorarContent />
    </AppShell>
  )
}

function ExplorarContent() {
  const { userId } = useAppSession()
  const blocked = useBlockedIds(userId)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [clubResults, setClubResults] = useState<ClubHit[]>([])
  const [searching, setSearching] = useState(false)
  const [hub, setHub] = useState<ExploreHub | null>(null)
  const [legacy, setLegacy] = useState<{ tags: TrendingTag[]; fresh: RankedProfile[] } | null>(null)
  const [topFollowed, setTopFollowed] = useState<RankedProfile[]>([])
  const [pop, setPop] = useState<PopularPost[]>([])
  const [showAllPop, setShowAllPop] = useState(false)
  const [loadingDiscover, setLoadingDiscover] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const h = await loadExploreHub()
      if (!alive) return
      if (h) setHub(h)
      else {
        // sin el SQL de la 1.9.0: el Explorar de siempre (tendencias + nuevos ingresos)
        const [{ data: tags }, { data: fresh }] = await Promise.all([
          supabase.rpc('get_trending_hashtags', { limit_count: 5 }),
          supabase.rpc('get_new_members', { limit_count: 5 }),
        ])
        if (!alive) return
        setLegacy({ tags: (tags as TrendingTag[]) ?? [], fresh: (fresh as RankedProfile[]) ?? [] })
      }
      setLoadingDiscover(false)
      const top = await cached<RankedProfile[]>('explore:top5', 10 * 60_000, async () => {
        const { data } = await supabase.rpc('get_top_followed', { limit_count: 5 })
        return (data as RankedProfile[]) ?? []
      }, { persist: true, shouldCache: (l) => l.length > 0 })
      if (alive) setTopFollowed(top)
    })()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!hub || hub.popular_posts.length === 0) return
    let alive = true
    void loadPopularPosts(hub.popular_posts).then((l) => alive && setPop(l))
    return () => {
      alive = false
    }
  }, [hub])

  // búsqueda de personas y clubes (en paralelo). Los bloqueados ya están en memoria: no se pide nada más.
  useEffect(() => {
    const q = query.trim()
    if (!q) return // sin texto no se muestra la búsqueda: no hace falta limpiar nada
    // v1.10.0 · respuestas desactualizadas: si escribes otra letra mientras la búsqueda anterior sigue en camino, su resultado se descarta
    let alive = true
    const flag = window.setTimeout(() => setSearching(true), 0)
    const timer = window.setTimeout(async () => {
      // Se quitan %, comas y paréntesis: en el filtro de Supabase rompían la búsqueda
      const safe = q.replace(/[%,()]/g, '')
      if (!safe) {
        setResults([])
        setClubResults([])
        setSearching(false)
        return
      }
      const [people, clubs] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, id_student, avatar_url, grado')
          .eq('ghost_mode', false)
          .or(`id_student.ilike.%${safe}%,username.ilike.%${safe}%,grado.ilike.%${safe}%`)
          .limit(20),
        supabase.from('clubs').select('id, slug, name, kind, color, avatar_url').ilike('name', `%${safe}%`).limit(6),
      ])
      if (!alive) return
      setResults(((people.data as SearchResult[]) ?? []).filter((r) => !blocked.has(r.id)))
      setClubResults((clubs.data as ClubHit[]) ?? [])
      setSearching(false)
    }, 350)
    return () => {
      alive = false
      window.clearTimeout(flag)
      window.clearTimeout(timer)
    }
  }, [query, blocked])

  const showingSearch = query.trim().length > 0
  const tags: TrendingTag[] = useMemo(() => (hub ? hub.tags.map((t) => ({ tag: t.tag, uses: t.n })) : legacy?.tags ?? []), [hub, legacy])
  const fresh = useMemo(() => (hub ? hub.new_members : legacy?.fresh ?? []).filter((m) => !blocked.has(m.id)), [hub, legacy, blocked])
  const active = useMemo(() => (hub?.active_members ?? []).filter((m) => !blocked.has(m.id)), [hub, blocked])
  const popVisible = useMemo(() => pop.filter((p) => !blocked.has(p.user_id)), [pop, blocked])

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <h1 className="text-xl font-display font-semibold text-neutral-50 mb-1">Explorar</h1>
      <p className="text-neutral-500 text-sm mb-5">Busca personas y clubes, o descubre lo que está pasando en Daiwa.</p>

      <div className="relative mb-6">
        <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca personas, clubes, @usuario o grado..."
          aria-label="Buscar"
          className="w-full bg-ink-900 border border-ink-700 rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-garnet-600"
        />
      </div>

      {showingSearch ? (
        <div className="space-y-4">
          {clubResults.length > 0 && (
            <section>
              <SectionTitle icon={<ClubsIcon className="w-4 h-4 text-garnet-400" />}>Clubes y pandillas</SectionTitle>
              <ScrollCarousel label="Clubes y pandillas encontrados" prevLabel="Ver clubes anteriores" nextLabel="Ver más clubes" className="-mx-4 px-4 flex gap-3 overflow-x-auto snap-x pb-2 [scrollbar-width:none]">
                {clubResults.map((c) => (
                  <ClubTile key={c.id} c={c} />
                ))}
              </ScrollCarousel>
            </section>
          )}
          <div className="surface-card rounded-2xl overflow-hidden">
            {searching ? (
              <p className="text-neutral-500 text-sm text-center py-8">Buscando...</p>
            ) : results.length === 0 ? (
              <p className="text-neutral-500 text-sm text-center py-8">No encontramos a nadie con &quot;{query}&quot;.</p>
            ) : (
              <div className="divide-y divide-ink-700/70 p-1.5">
                {results.map((r) => (
                  <MiniProfileRow key={r.id} profile={r} meta={r.grado} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-7">
          <section>
            <SectionTitle icon={<FireIcon className="w-4 h-4 text-garnet-400" />}>Tendencias</SectionTitle>
            {loadingDiscover ? (
              <p className="text-neutral-500 text-sm">Cargando...</p>
            ) : tags.length === 0 ? (
              <p className="text-neutral-500 text-sm">Todavía no hay hashtags en tendencia. Usa #palabra en una publicación para empezar una.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Link
                    key={t.tag}
                    href={`/tag/${t.tag}`}
                    className="inline-flex items-center gap-1.5 bg-ink-800 border border-ink-700 hover:border-garnet-600 hover:text-garnet-400 text-neutral-200 text-sm font-medium rounded-full px-3.5 py-1.5 transition"
                  >
                    #{t.tag}
                    <span className="text-neutral-500 text-xs">{t.uses}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {popVisible.length > 0 && (
            <section>
              <SectionTitle icon={<SparklesIcon className="w-4 h-4 text-garnet-400" />} hint="Lo más comentado y querido de la última semana en publicaciones abiertas.">
                Publicaciones populares
              </SectionTitle>
              <div className="space-y-2.5">
                {(showAllPop ? popVisible : popVisible.slice(0, 5)).map((p) => (
                  <PopularCard key={p.id} p={p} />
                ))}
              </div>
              {popVisible.length > 5 && !showAllPop && (
                <button type="button" onClick={() => setShowAllPop(true)} className="mt-2.5 w-full rounded-xl border border-ink-600 py-2 text-sm text-neutral-300 hover:border-garnet-500 hover:text-garnet-300 transition">
                  Ver más
                </button>
              )}
            </section>
          )}

          {hub && hub.clubs.length > 0 && (
            <section>
              <SectionTitle icon={<ClubsIcon className="w-4 h-4 text-garnet-400" />} hint="Comunidades con más miembros. Entra a una y únete.">
                Clubes para conocer
              </SectionTitle>
              <ScrollCarousel label="Clubes y pandillas para conocer" prevLabel="Ver clubes anteriores" nextLabel="Ver más clubes" className="-mx-4 px-4 flex gap-3 overflow-x-auto snap-x pb-2 [scrollbar-width:none]">
                {hub.clubs.map((c) => (
                  <ClubTile key={c.id} c={c} />
                ))}
              </ScrollCarousel>
            </section>
          )}

          <section className="surface-card rounded-2xl p-4">
            <SectionTitle icon={<SparklesIcon className="w-4 h-4 text-garnet-400" />} hint="Salúdalos, acaban de llegar a Daiwa.">
              Nuevos Ingresos
            </SectionTitle>
            {loadingDiscover ? (
              <p className="text-neutral-500 text-sm py-2">Cargando...</p>
            ) : fresh.length === 0 ? (
              <p className="text-neutral-500 text-sm py-2">Todavía no hay cuentas nuevas.</p>
            ) : (
              <div className="-mx-1.5">
                {fresh.slice(0, hub ? 6 : 5).map((p) => (
                  <MiniProfileRow key={p.id} profile={p} />
                ))}
              </div>
            )}
          </section>

          {active.length > 0 && (
            <section className="surface-card rounded-2xl p-4">
              <SectionTitle icon={<FireIcon className="w-4 h-4 text-garnet-400" />} hint="Quienes más publicaron esta semana.">
                Cuentas activas
              </SectionTitle>
              <div className="-mx-1.5">
                {active.slice(0, 5).map((p) => (
                  <MiniProfileRow key={p.id} profile={p} meta={p.posts ? `${p.posts} ${p.posts === 1 ? 'publicación' : 'publicaciones'}` : null} />
                ))}
              </div>
            </section>
          )}

          <section className="surface-card rounded-2xl p-4">
            <SectionTitle icon={<StarIcon className="w-4 h-4 text-garnet-400" />}>Top 5 Estudiantes Populares</SectionTitle>
            {loadingDiscover ? (
              <p className="text-neutral-500 text-sm py-2">Cargando...</p>
            ) : topFollowed.length === 0 || topFollowed.every((p) => !p.followers_count) ? (
              <p className="text-neutral-500 text-sm py-2">Todavía no hay suficientes seguidores para armar el ranking.</p>
            ) : (
              <div className="-mx-1.5">
                {topFollowed.map((p, i) => (
                  <MiniProfileRow key={p.id} profile={p} meta={`#${i + 1} · ${p.followers_count ?? 0} seguidores`} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
