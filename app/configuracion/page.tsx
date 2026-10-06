'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell, { useAppSession } from '../components/AppShell'
import { isSupremeAdmin } from '../lib/permissions'
import { supabase } from '../lib/supabaseClient'
import { ShieldIcon, EyeIcon, SparklesIcon, BellIcon, BlockIcon } from '../components/icons'
import type { ConfigProfile } from './types'
import CuentaTab from './CuentaTab'
import PrivacidadTab from './PrivacidadTab'
import AparienciaTab from './AparienciaTab'
import NotificacionesTab from './NotificacionesTab'
import BloqueadosTab from './BloqueadosTab'

const TABS = [
  { id: 'cuenta', label: 'Cuenta y Seguridad', icon: ShieldIcon },
  { id: 'privacidad', label: 'Privacidad', icon: EyeIcon },
  { id: 'apariencia', label: 'Apariencia', icon: SparklesIcon },
  { id: 'notificaciones', label: 'Notificaciones', icon: BellIcon },
  { id: 'bloqueados', label: 'Cuentas Bloqueadas', icon: BlockIcon },
] as const

type TabId = (typeof TABS)[number]['id']

const DEFAULT_NOTIF_PREFS = { comments: true, mentions: true, likes: true, follows: true, note_likes: true, whispers: true }

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
    const { data } = await supabase
      .from('profiles')
      .select('id, username, is_frozen, posts_visibility, ghost_mode, theme, accent_color, badge_color, notif_prefs')
      .eq('id', id)
      .maybeSingle()
    // Se pide aparte para no romper Configuración si todavía no se corrió el SQL de la v0.12.0
    const { data: onlineRow } = await supabase.from('profiles').select('show_online_status').eq('id', id).maybeSingle()
    if (data) {
      setProfile({
        id: data.id,
        username: data.username,
        is_frozen: data.is_frozen ?? false,
        posts_visibility: (data.posts_visibility as 'public' | 'followers') ?? 'public',
        ghost_mode: data.ghost_mode ?? false,
        theme: (data.theme as 'dark' | 'light') ?? 'dark',
        accent_color: data.accent_color ?? null,
        badge_color: data.badge_color ?? null,
        show_online_status: onlineRow?.show_online_status !== false,
        notif_prefs: { ...DEFAULT_NOTIF_PREFS, ...(data.notif_prefs ?? {}) },
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
      <div className="min-h-screen flex items-center justify-center">
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
      {tab === 'privacidad' && <PrivacidadTab profile={profile} onUpdate={setProfile} />}
      {tab === 'apariencia' && (
        <AparienciaTab
          profile={profile}
          onUpdate={setProfile}
          showVipBadge={hasAnyRole || isSupremeAdmin(username)}
        />
      )}
      {tab === 'notificaciones' && <NotificacionesTab profile={profile} onUpdate={setProfile} />}
      {tab === 'bloqueados' && <BloqueadosTab currentUserId={profile.id} />}
    </div>
  )
}
