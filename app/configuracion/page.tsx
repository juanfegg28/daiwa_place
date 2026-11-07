'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell, { useAppSession } from '../components/AppShell'
import { isSupremeAdmin } from '../lib/permissions'
import { supabase } from '../lib/supabaseClient'
import { UserIcon, ShieldIcon, EyeIcon, SparklesIcon, BellIcon, BlockIcon, RepostIcon } from '../components/icons'
import type { ConfigProfile } from './types'
import CuentaTab from './CuentaTab'
import PrivacidadTab from './PrivacidadTab'
import AparienciaTab from './AparienciaTab'
import NotificacionesTab from './NotificacionesTab'
import BloqueadosTab from './BloqueadosTab'
import FeedTab from './FeedTab'
import AccountsPanel from '../components/AccountsPanel'

const TABS = [
  { id: 'cuenta', label: 'Cuenta y Seguridad', icon: ShieldIcon },
  { id: 'cuentas', label: 'Mis cuentas', icon: UserIcon },
  { id: 'privacidad', label: 'Privacidad', icon: EyeIcon },
  { id: 'apariencia', label: 'Apariencia', icon: SparklesIcon },
  { id: 'feed', label: 'Feed', icon: RepostIcon },
  { id: 'notificaciones', label: 'Notificaciones', icon: BellIcon },
  { id: 'bloqueados', label: 'Cuentas Bloqueadas', icon: BlockIcon },
] as const

type TabId = (typeof TABS)[number]['id']

const DEFAULT_NOTIF_PREFS = { comments: true, mentions: true, likes: true, follows: true, note_likes: true, whispers: true, tags: true, reposts: true, story_likes: true, dm: true, push_preview: true }

export default function ConfiguracionPage() {
  return (
    <AppShell>
      <ConfiguracionContent />
    </AppShell>
  )
}

function ConfiguracionContent() {
  const { userId, username, loading: sessionLoading, hasAnyRole } = useAppSession()
  const router = useRouter()
  const [profile, setProfile] = useState<ConfigProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabId>('cuenta')

  const load = async (id: string) => {
    // v1.8.0 · UNA consulta (antes eran 5 seguidas cada vez que abrías Configuración). Si falta alguna columna de SQL viejos,
    // se usa el camino de siempre.
    type Row = {
      id: string
      username: string
      is_frozen: boolean | null
      posts_visibility: string | null
      ghost_mode: boolean | null
      theme: string | null
      accent_color: string | null
      badge_color: string | null
      notif_prefs: Record<string, boolean> | null
      show_online_status?: boolean | null
      show_read_receipts?: boolean | null
      feed_pref?: string | null
      story_default_audience?: string | null
      story_replies?: string | null
    }
    let row: Row | null = null
    const full = await supabase
      .from('profiles')
      .select('id, username, is_frozen, posts_visibility, ghost_mode, theme, accent_color, badge_color, notif_prefs, show_online_status, show_read_receipts, feed_pref, story_default_audience, story_replies')
      .eq('id', id)
      .maybeSingle()
    if (!full.error) {
      row = full.data as unknown as Row | null
    } else {
      const base = await supabase.from('profiles').select('id, username, is_frozen, posts_visibility, ghost_mode, theme, accent_color, badge_color, notif_prefs').eq('id', id).maybeSingle()
      row = base.data as unknown as Row | null
      if (row) {
        const { data: a } = await supabase.from('profiles').select('show_online_status').eq('id', id).maybeSingle()
        const { data: b } = await supabase.from('profiles').select('show_read_receipts').eq('id', id).maybeSingle()
        const { data: c } = await supabase.from('profiles').select('feed_pref').eq('id', id).maybeSingle()
        const { data: d } = await supabase.from('profiles').select('story_default_audience, story_replies').eq('id', id).maybeSingle()
        row = { ...row, ...(a ?? {}), ...(b ?? {}), ...(c ?? {}), ...(d ?? {}) } as Row
      }
    }
    if (row) {
      setProfile({
        id: row.id,
        username: row.username,
        is_frozen: row.is_frozen ?? false,
        posts_visibility: (row.posts_visibility as 'public' | 'followers') ?? 'public',
        ghost_mode: row.ghost_mode ?? false,
        theme: (row.theme as 'dark' | 'light') ?? 'dark',
        accent_color: row.accent_color ?? null,
        badge_color: row.badge_color ?? null,
        show_online_status: row.show_online_status !== false,
        show_read_receipts: row.show_read_receipts !== false,
        feed_pref: (row.feed_pref as 'all' | 'following' | 'mutuals') ?? 'all',
        story_default_audience: (row.story_default_audience as 'followers' | 'friends') ?? 'followers',
        story_replies: (row.story_replies as 'all' | 'friends' | 'off') ?? 'all',
        notif_prefs: { ...DEFAULT_NOTIF_PREFS, ...(row.notif_prefs ?? {}) },
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    if (sessionLoading) return
    if (!userId) {
      router.push('/login')
      return
    }
    const id = userId
    function run() {
      load(id)
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, userId])

  if (sessionLoading || loading || !profile || !username) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-display font-semibold text-neutral-50 mb-1">Configuración</h1>
      <p className="text-neutral-500 text-sm mb-6">
        Todo lo de tu cuenta en un solo lugar — cada opción trae una explicación de para qué sirve.
      </p>

      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap text-sm rounded-full px-3.5 py-2 transition ${
                active ? 'bg-garnet-600 text-white' : 'bg-ink-800 text-neutral-300 hover:bg-ink-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'cuenta' && (
        <CuentaTab
          userId={profile.id}
          username={username}
          isFrozen={profile.is_frozen}
          onFrozenChange={(frozen) => setProfile({ ...profile, is_frozen: frozen })}
        />
      )}
      {tab === 'cuentas' && (
        <section className="surface-card rounded-2xl p-4 sm:p-5">
          <h2 className="text-base font-semibold text-neutral-100">Mis cuentas</h2>
          <p className="text-sm text-neutral-400 mt-0.5 mb-4">
            ¿Tienes personajes secundarios? Guarda varias cuentas en este dispositivo y cambia entre ellas con un toque, sin escribir la contraseña cada vez.
          </p>
          <AccountsPanel />
        </section>
      )}
      {tab === 'privacidad' && <PrivacidadTab profile={profile} onUpdate={setProfile} />}
      {tab === 'apariencia' && (
        <AparienciaTab
          profile={profile}
          onUpdate={setProfile}
          showVipBadge={hasAnyRole || isSupremeAdmin(username)}
        />
      )}
      {tab === 'feed' && <FeedTab profile={profile} onUpdate={setProfile} />}
      {tab === 'notificaciones' && <NotificacionesTab profile={profile} onUpdate={setProfile} />}
      {tab === 'bloqueados' && <BloqueadosTab currentUserId={profile.id} />}
    </div>
  )
}
