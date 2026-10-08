'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import AppShell from '../components/AppShell'
import { SearchIcon, FireIcon, StarIcon, SparklesIcon } from '../components/icons'

type SearchResult = {
  id: string
  username: string
  id_student: string | null
  avatar_url: string | null
  grado: string | null
}

type TrendingTag = { tag: string; uses: number }

type RankedProfile = {
  id: string
  username: string
  id_student: string | null
  avatar_url: string | null
  followers_count?: number
  created_at?: string
}

function MiniProfileRow({
  profile,
  meta,
}: {
  profile: RankedProfile | SearchResult
  meta?: string | null
}) {
  return (
    <Link
      href={`/perfil/${profile.username}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink-700/60 transition"
    >
      <div className="w-10 h-10 rounded-full overflow-hidden bg-ink-700 flex items-center justify-center shrink-0">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img loading="lazy" decoding="async" src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-semibold text-garnet-400">{profile.username.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-100 truncate">{profile.id_student || profile.username}</p>
        <p className="text-xs text-neutral-600 truncate">@{profile.username}</p>
      </div>
      {meta && <span className="text-xs text-neutral-500 shrink-0 ml-2">{meta}</span>}
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
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [trending, setTrending] = useState<TrendingTag[]>([])
  const [topFollowed, setTopFollowed] = useState<RankedProfile[]>([])
  const [newMembers, setNewMembers] = useState<RankedProfile[]>([])
  const [loadingDiscover, setLoadingDiscover] = useState(true)

  useEffect(() => {
    async function loadDiscover() {
      const [{ data: tags }, { data: top }, { data: fresh }] = await Promise.all([
        supabase.rpc('get_trending_hashtags', { limit_count: 5 }),
        supabase.rpc('get_top_followed', { limit_count: 5 }),
        supabase.rpc('get_new_members', { limit_count: 5 }),
      ])
      setTrending((tags as TrendingTag[]) ?? [])
      setTopFollowed((top as RankedProfile[]) ?? [])
      setNewMembers((fresh as RankedProfile[]) ?? [])
      setLoadingDiscover(false)
    }
    loadDiscover()
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      function clear() {
        setResults([])
        setSearching(false)
      }
      clear()
      return
    }
    function startSearching() {
      setSearching(true)
    }
    startSearching()
    const timer = window.setTimeout(async () => {
      // Se quitan %, comas y paréntesis: en el filtro de Supabase rompían la búsqueda
      const safe = q.replace(/[%,()]/g, '')
      if (!safe) {
        setResults([])
        setSearching(false)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('id, username, id_student, avatar_url, grado')
        .eq('ghost_mode', false)
        .or(`id_student.ilike.%${safe}%,username.ilike.%${safe}%,grado.ilike.%${safe}%`)
        .limit(20)

      // No se muestran personas bloqueadas (ni quienes te bloquearon)
      const { data: auth } = await supabase.auth.getUser()
      const me = auth.user?.id
      const blockedIds = new Set<string>()
      if (me) {
        const { data: bl } = await supabase
          .from('blocks')
          .select('blocker_id, blocked_id')
          .or(`blocker_id.eq.${me},blocked_id.eq.${me}`)
        for (const b of (bl ?? []) as { blocker_id: string; blocked_id: string }[]) {
          blockedIds.add(b.blocker_id === me ? b.blocked_id : b.blocker_id)
        }
      }
      setResults(((data as SearchResult[]) ?? []).filter((r) => !blockedIds.has(r.id)))
      setSearching(false)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [query])

  const showingSearch = query.trim().length > 0

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <h1 className="text-xl font-display font-semibold text-neutral-50 mb-1">Explorar</h1>
      <p className="text-neutral-500 text-sm mb-5">
        Busca a otros estudiantes o descubre lo que está pasando en Daiwa.
      </p>

      <div className="relative mb-6">
        <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca por nombre de personaje, @usuario o grado..."
          className="w-full bg-ink-900 border border-ink-700 rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-garnet-600"
        />
      </div>

      {showingSearch ? (
        <div className="surface-card rounded-2xl overflow-hidden">
          {searching ? (
            <p className="text-neutral-500 text-sm text-center py-8">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="text-neutral-500 text-sm text-center py-8">
              No encontramos a nadie con &quot;{query}&quot;.
            </p>
          ) : (
            <div className="divide-y divide-ink-700/70 p-1.5">
              {results.map((r) => (
                <MiniProfileRow key={r.id} profile={r} meta={r.grado} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-300 mb-2">
              <FireIcon className="w-4 h-4 text-garnet-400" />
              Tendencias
            </h2>
            {loadingDiscover ? (
              <p className="text-neutral-500 text-sm">Cargando...</p>
            ) : trending.length === 0 ? (
              <p className="text-neutral-500 text-sm">
                Todavía no hay hashtags en tendencia. Usa #palabra en una publicación para empezar una.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {trending.map((t) => (
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

          <section className="surface-card rounded-2xl p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-300 mb-2">
              <StarIcon className="w-4 h-4 text-garnet-400" />
              Top 5 Estudiantes Populares
            </h2>
            {loadingDiscover ? (
              <p className="text-neutral-500 text-sm py-2">Cargando...</p>
            ) : topFollowed.length === 0 || topFollowed.every((p) => !p.followers_count) ? (
              <p className="text-neutral-500 text-sm py-2">
                Todavía no hay suficientes seguidores para armar el ranking.
              </p>
            ) : (
              <div className="-mx-1.5">
                {topFollowed.map((p, i) => (
                  <MiniProfileRow key={p.id} profile={p} meta={`#${i + 1} · ${p.followers_count ?? 0} seguidores`} />
                ))}
              </div>
            )}
          </section>

          <section className="surface-card rounded-2xl p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-300 mb-2">
              <SparklesIcon className="w-4 h-4 text-garnet-400" />
              Nuevos Ingresos
            </h2>
            <p className="text-xs text-neutral-500 mb-2">Salúdalos, acaban de llegar a Daiwa.</p>
            {loadingDiscover ? (
              <p className="text-neutral-500 text-sm py-2">Cargando...</p>
            ) : newMembers.length === 0 ? (
              <p className="text-neutral-500 text-sm py-2">Todavía no hay cuentas nuevas.</p>
            ) : (
              <div className="-mx-1.5">
                {newMembers.map((p) => (
                  <MiniProfileRow key={p.id} profile={p} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
