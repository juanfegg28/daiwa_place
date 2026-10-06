'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell, { useAppSession } from '../components/AppShell'
import { hasAny, type Permissions } from '../lib/permissions'
import { FlagIcon, ShieldAdminIcon, UserCogIcon, MegaphoneIcon, WrenchIcon, WhisperIcon } from '../components/icons'
import ReportesTab from './ReportesTab'
import RolesTab from './RolesTab'
import IdentidadesTab from './IdentidadesTab'
import AnunciosTab from './AnunciosTab'
import SistemaTab from './SistemaTab'
import SusurrosTab from './SusurrosTab'

const TAB_DEFS = [
  {
    id: 'reportes' as const,
    label: 'Reportes',
    icon: FlagIcon,
    check: (p: Permissions, sup: boolean) =>
      sup || hasAny(p, ['view_reports', 'view_evidence', 'delete_content', 'freeze_accounts']),
  },
  {
    id: 'susurros' as const,
    label: 'Susurros',
    icon: WhisperIcon,
    check: (p: Permissions, sup: boolean) => sup || hasAny(p, ['moderate_whispers', 'reveal_whisper_authors']),
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
      <div className="min-h-screen flex items-center justify-center">
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
          {tab === 'susurros' && <SusurrosTab />}
          {tab === 'roles' && <RolesTab />}
          {tab === 'identidades' && <IdentidadesTab />}
          {tab === 'anuncios' && <AnunciosTab />}
          {tab === 'sistema' && <SistemaTab />}
        </>
      )}
    </div>
  )
}
