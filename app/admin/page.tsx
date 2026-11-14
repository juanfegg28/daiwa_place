'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell, { useAppSession } from '../components/AppShell'
import { hasAny, type Permissions } from '../lib/permissions'
import { KeyIcon, CalendarIcon, FlagIcon, ShieldAdminIcon, UserCogIcon, MegaphoneIcon, WrenchIcon, WhisperIcon, MessageIcon, SparklesIcon, ClubsIcon, MoonCoinIcon, StoreIcon, CrescentMoonIcon } from '../components/icons'
import dynamic from 'next/dynamic'

// v1.10.0 · Cada pestaña del Centro de Mando es su propio paquete de JavaScript: al entrar solo se descarga la que estás viendo
// (antes se descargaban las 13 juntas, ≈1,1 MB sin comprimir, incluido el kit de cosméticos de la tienda). Al pasar el cursor / enfocar
// una pestaña se precarga su código, así que al hacer clic ya suele estar listo.
function TabLoading() {
  return (
    <div className="space-y-3" role="status" aria-busy="true" aria-label="Cargando herramienta">
      <div className="h-20 rounded-2xl bg-ink-800/60 animate-pulse" />
      <div className="h-32 rounded-2xl bg-ink-800/40 animate-pulse" />
    </div>
  )
}
const ReportesTab = dynamic(() => import('./ReportesTab'), { loading: TabLoading })
const RolesTab = dynamic(() => import('./RolesTab'), { loading: TabLoading })
const IdentidadesTab = dynamic(() => import('./IdentidadesTab'), { loading: TabLoading })
const AnunciosTab = dynamic(() => import('./AnunciosTab'), { loading: TabLoading })
const PreguntaTab = dynamic(() => import('./PreguntaTab'), { loading: TabLoading })
const SistemaTab = dynamic(() => import('./SistemaTab'), { loading: TabLoading })
const RecuperacionTab = dynamic(() => import('./RecuperacionTab'), { loading: TabLoading })
const SusurrosTab = dynamic(() => import('./SusurrosTab'), { loading: TabLoading })
const MensajesTab = dynamic(() => import('./MensajesTab'), { loading: TabLoading })
const ClubesTab = dynamic(() => import('./ClubesTab'), { loading: TabLoading })
const TiendaLunasTab = dynamic(() => import('./TiendaLunasTab'), { loading: TabLoading })
const TiendaCatalogoTab = dynamic(() => import('./TiendaCatalogoTab'), { loading: TabLoading })
const SupportersTab = dynamic(() => import('./SupportersTab'), { loading: TabLoading })
const EventosTab = dynamic(() => import('./EventosTab'), { loading: TabLoading })

/** Precarga el código de una pestaña (sin dibujarla) */
const PRELOAD: Record<string, () => Promise<unknown>> = {
  reportes: () => import('./ReportesTab'),
  mensajes: () => import('./MensajesTab'),
  susurros: () => import('./SusurrosTab'),
  clubes: () => import('./ClubesTab'),
  roles: () => import('./RolesTab'),
  identidades: () => import('./IdentidadesTab'),
  anuncios: () => import('./AnunciosTab'),
  pregunta: () => import('./PreguntaTab'),
  tienda: () => import('./TiendaLunasTab'),
  catalogo: () => import('./TiendaCatalogoTab'),
  supporters: () => import('./SupportersTab'),
  eventos: () => import('./EventosTab'),
  sistema: () => import('./SistemaTab'),
  recuperacion: () => import('./RecuperacionTab'),
}

const TAB_DEFS = [
  {
    id: 'reportes' as const,
    label: 'Reportes',
    icon: FlagIcon,
    check: (p: Permissions, sup: boolean) =>
      sup || hasAny(p, ['view_reports', 'view_evidence', 'delete_content', 'freeze_accounts']),
  },
  {
    id: 'mensajes' as const,
    label: 'Mensajes',
    icon: MessageIcon,
    check: (p: Permissions, sup: boolean) => sup || hasAny(p, ['view_evidence']),
  },
  {
    id: 'susurros' as const,
    label: 'Susurros',
    icon: WhisperIcon,
    check: (p: Permissions, sup: boolean) => sup || hasAny(p, ['moderate_whispers', 'reveal_whisper_authors']),
  },
  {
    id: 'clubes' as const,
    label: 'Clubes',
    icon: ClubsIcon,
    check: (p: Permissions, sup: boolean) => sup || hasAny(p, ['manage_clubs']),
  },
  {
    id: 'roles' as const,
    label: 'Taller de Roles',
    icon: ShieldAdminIcon,
    check: (p: Permissions, sup: boolean) => sup || hasAny(p, ['assign_badges']),
  },
  {
    id: 'identidades' as const,
    label: 'Identidades',
    icon: UserCogIcon,
    check: (p: Permissions, sup: boolean) => sup || hasAny(p, ['override_identity']),
  },
  {
    id: 'anuncios' as const,
    label: 'Anuncios',
    icon: MegaphoneIcon,
    check: (p: Permissions, sup: boolean) => sup || hasAny(p, ['global_announcements']),
  },
  {
    id: 'pregunta' as const,
    label: 'Pregunta del día',
    icon: SparklesIcon,
    check: (p: Permissions, sup: boolean) => sup || hasAny(p, ['global_announcements']),
  },
  {
    id: 'tienda' as const,
    label: 'Tienda y Lunas',
    icon: MoonCoinIcon,
    check: (p: Permissions, sup: boolean) => sup || hasAny(p, ['manage_shop', 'manage_codes', 'adjust_coins']),
  },
  {
    id: 'catalogo' as const,
    label: 'Catálogo y ofertas',
    icon: StoreIcon,
    check: (p: Permissions, sup: boolean) => sup || hasAny(p, ['manage_shop']),
  },
  {
    id: 'eventos' as const,
    label: 'Eventos',
    icon: CalendarIcon,
    check: (p: Permissions, sup: boolean) => sup || hasAny(p, ['manage_events']),
  },
  {
    id: 'supporters' as const,
    label: 'Supporters',
    icon: CrescentMoonIcon,
    check: (p: Permissions, sup: boolean) => sup || hasAny(p, ['manage_supporters']),
  },
  {
    // v1.10.0 · solo el Admin Supremo o un rol con el permiso «recover_accounts» (nunca cualquier miembro del staff)
    id: 'recuperacion' as const,
    label: 'Recuperación de cuentas',
    icon: KeyIcon,
    check: (p: Permissions, sup: boolean) => sup || hasAny(p, ['recover_accounts']),
  },
  {
    id: 'sistema' as const,
    label: 'Sistema',
    icon: WrenchIcon,
    check: (_p: Permissions, sup: boolean) => sup,
  },
]

type TabId = (typeof TAB_DEFS)[number]['id']

export default function AdminPage() {
  return (
    <AppShell>
      <AdminContent />
    </AppShell>
  )
}

function AdminContent() {
  const { loading, userId, isSupreme, hasAnyRole, permissions } = useAppSession()
  const router = useRouter()
  const [tab, setTab] = useState<TabId | null>(null)

  const canSeeAdmin = isSupreme || hasAnyRole
  const availableTabs = TAB_DEFS.filter((t) => t.check(permissions, isSupreme))

  useEffect(() => {
    if (loading) return
    if (!userId || !canSeeAdmin) {
      router.push('/')
      return
    }
    if (!tab && availableTabs.length > 0) {
      function pickFirst() {
        setTab(availableTabs[0].id)
      }
      pickFirst()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, userId, canSeeAdmin])

  if (loading || !userId || !canSeeAdmin) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-display font-semibold text-neutral-50 mb-1">Centro de Mando</h1>
      <p className="text-neutral-500 text-sm mb-6">
        Solo ves las herramientas que tu rol te permite usar
        {isSupreme ? ' — tienes acceso total como Admin Supremo.' : '.'}
      </p>

      {availableTabs.length === 0 ? (
        <p className="text-neutral-500 text-sm">Todavía no tienes ningún permiso activo en tus roles.</p>
      ) : (
        <>
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
            {availableTabs.map((t) => {
              const Icon = t.icon
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  onPointerEnter={() => void PRELOAD[t.id]?.()}
                  onFocus={() => void PRELOAD[t.id]?.()}
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

          {tab === 'reportes' && <ReportesTab />}
          {tab === 'mensajes' && <MensajesTab />}
          {tab === 'susurros' && <SusurrosTab />}
          {tab === 'clubes' && <ClubesTab />}
          {tab === 'roles' && <RolesTab />}
          {tab === 'identidades' && <IdentidadesTab />}
          {tab === 'anuncios' && <AnunciosTab />}
          {tab === 'pregunta' && <PreguntaTab />}
          {tab === 'tienda' && <TiendaLunasTab />}
          {tab === 'catalogo' && <TiendaCatalogoTab />}
          {tab === 'supporters' && <SupportersTab />}
          {tab === 'eventos' && <EventosTab />}
          {tab === 'recuperacion' && <RecuperacionTab />}
          {tab === 'sistema' && <SistemaTab />}
        </>
      )}
    </div>
  )
}
