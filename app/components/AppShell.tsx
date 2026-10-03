'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import { applyTheme, type ThemeMode } from '../lib/theme'
import Logo from './Logo'
import { APP_VERSION } from '../lib/changelog'
import { isSupremeAdmin, mergePermissions, type Permissions } from '../lib/permissions'
import {
  HomeIcon,
  UserIcon,
  MessageIcon,
  BellIcon,
  SearchIcon,
  SettingsIcon,
  ShieldAdminIcon,
  WrenchIcon,
  LogoutIcon,
  LoginIcon,
  type IconProps,
} from './icons'

type SessionState = {
  loading: boolean
  userId: string | null
  username: string | null
  avatarUrl: string | null
  permissions: Permissions
  isSupreme: boolean
  hasAnyRole: boolean
  refresh: () => void
  /** Notificaciones sin leer de la persona (para el numerito de la campana) */
  unreadNotifications: number
  /** Sube cada vez que llega o cambia una notificación; la página de Notificaciones lo usa para recargarse sola */
  notificationsVersion: number
  /** Vuelve a contar las no leídas (se llama después de leer o borrar notificaciones) */
  refreshNotifications: () => void
}

const AppSessionContext = createContext<SessionState>({
  loading: true,
  userId: null,
  username: null,
  avatarUrl: null,
  permissions: {},
  isSupreme: false,
  hasAnyRole: false,
  refresh: () => {},
  unreadNotifications: 0,
  notificationsVersion: 0,
  refreshNotifications: () => {},
})

export function useAppSession() {
  return useContext(AppSessionContext)
}

type NavItem = {
  href: string
  label: string
  shortLabel?: string
  icon: (props: IconProps) => React.ReactElement
  match: (pathname: string) => boolean
  /** Numerito rojo (ej. notificaciones sin leer). 0 o undefined = no se muestra */
  badge?: number
}

function formatBadge(n: number) {
  return n > 99 ? '99+' : String(n)
}

function DirectMessagesTeaser() {
  const onClick = () =>
    window.alert('Muy pronto vas a poder mandar mensajes directos a otros estudiantes 💬')

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm text-neutral-500 hover:bg-ink-800/60 transition"
    >
      <span className="flex items-center gap-3">
        <MessageIcon className="w-5 h-5" />
        Mensajes directos
      </span>
      <span className="text-[10px] uppercase tracking-wide bg-ink-700 text-neutral-400 rounded-full px-2 py-0.5">
        Pronto
      </span>
    </button>
  )
}

function MaintenanceScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 text-neutral-100 px-4">
      <div className="max-w-sm text-center">
        <div className="w-14 h-14 rounded-full bg-ink-800 flex items-center justify-center text-garnet-400 mx-auto mb-4">
          <WrenchIcon className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-display font-semibold text-neutral-50 mb-2">
          DaiwaPlace está en mantenimiento
        </h1>
        <p className="text-sm text-neutral-500 leading-relaxed mb-6">
          Estamos arreglando algunas cosas por dentro. Vuelve a entrar en un rato — no tardamos.
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="text-xs text-neutral-500 hover:text-garnet-400 transition"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [idStudent, setIdStudent] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<Permissions>({})
  const [hasAnyRole, setHasAnyRole] = useState(false)
  const [maintenanceOn, setMaintenanceOn] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsVersion, setNotificationsVersion] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  const load = async () => {
    const { data: settingsRow } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .maybeSingle()
    setMaintenanceOn(settingsRow?.value === true)

    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) {
      setUserId(null)
      setUsername(null)
      setAvatarUrl(null)
      setIdStudent(null)
      setPermissions({})
      setHasAnyRole(false)
      setLoading(false)
      return
    }
    setUserId(user.id)
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url, id_student, theme, accent_color')
      .eq('id', user.id)
      .maybeSingle()
    setUsername(profile?.username ?? null)
    setAvatarUrl(profile?.avatar_url ?? null)
    setIdStudent(profile?.id_student ?? null)
    applyTheme((profile?.theme as ThemeMode) ?? 'dark', profile?.accent_color ?? null)

    const { data: roleRows } = await supabase
      .from('user_roles')
      .select('roles(permissions)')
      .eq('user_id', user.id)
    const merged = mergePermissions(
      ((roleRows as unknown as { roles: { permissions: Permissions } | null }[]) ?? [])
        .map((r) => r.roles)
        .filter((r): r is { permissions: Permissions } => !!r)
    )
    setPermissions(merged)
    setHasAnyRole((roleRows ?? []).length > 0)

    setLoading(false)
  }

  useEffect(() => {
    function run() {
      load()
    }
    run()
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load()
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const countUnread = async (id: string) => {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', id)
      .eq('read', false)
    setUnreadCount(count ?? 0)
  }

  const refreshNotifications = () => {
    if (userId) countUnread(userId)
    setNotificationsVersion((v) => v + 1)
  }

  // Notificaciones en vivo: se escucha la tabla por Realtime, y además se
  // recuenta cada minuto y al volver a la pestaña (por si Realtime no está
  // activado en Supabase o se cortó la conexión).
  useEffect(() => {
    if (!userId) return
    const id = userId
    function recount() {
      countUnread(id)
    }
    function bump() {
      countUnread(id)
      setNotificationsVersion((v) => v + 1)
    }
    recount()
    const channel = supabase
      .channel(`notifications-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${id}` },
        bump
      )
      .subscribe()
    const interval = window.setInterval(recount, 60000)
    window.addEventListener('focus', bump)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', bump)
      supabase.removeChannel(channel)
    }
  }, [userId])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    applyTheme('dark', null)
    router.push('/login')
  }

  const isSupreme = isSupremeAdmin(username)
  const canSeeAdmin = isSupreme || hasAnyRole

  const navItems: NavItem[] = [
    { href: '/', label: 'Inicio', icon: HomeIcon, match: (p) => p === '/' },
    ...(username
      ? [
          {
            href: `/perfil/${username}`,
            label: 'Mi perfil',
            icon: UserIcon,
            match: (p: string) => p.startsWith('/perfil/'),
          },
          {
            href: '/explorar',
            label: 'Explorar',
            shortLabel: 'Buscar',
            icon: SearchIcon,
            match: (p: string) => p === '/explorar',
          },
          {
            href: '/notificaciones',
            label: 'Notificaciones',
            shortLabel: 'Avisos',
            icon: BellIcon,
            match: (p: string) => p === '/notificaciones',
            badge: unreadCount,
          },
          ...(canSeeAdmin
            ? [
                {
                  href: '/admin',
                  label: 'Centro de Mando',
                  shortLabel: 'Admin',
                  icon: ShieldAdminIcon,
                  match: (p: string) => p === '/admin',
                },
              ]
            : []),
        ]
      : []),
  ]

  // El mantenimiento solo bloquea a estudiantes normales (sin ningún rol ni Admin Supremo)
  if (!loading && userId && maintenanceOn && !canSeeAdmin) {
    return <MaintenanceScreen onLogout={handleLogout} />
  }

  return (
    <AppSessionContext.Provider
      value={{
        loading,
        userId,
        username,
        avatarUrl,
        permissions,
        isSupreme,
        hasAnyRole,
        refresh: load,
        unreadNotifications: userId ? unreadCount : 0,
        notificationsVersion,
        refreshNotifications,
      }}
    >
      <div className="min-h-screen bg-ink-950 text-neutral-100 md:flex">
        {/* Sidebar de escritorio */}
        <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 md:shrink-0 md:h-screen md:sticky md:top-0 border-r border-ink-800 bg-ink-900/60 px-4 py-6">
          <Link href="/" className="px-2 mb-8 inline-block">
            <Logo size="md" />
          </Link>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const active = item.match(pathname)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                    active
                      ? 'bg-garnet-600/90 text-white shadow-[0_8px_24px_-8px] shadow-garnet-600/70'
                      : 'text-neutral-300 hover:bg-ink-800'
                  }`}
                >
                  <Icon filled={active} className="w-5 h-5" />
                  {item.label}
                  {!!item.badge && item.badge > 0 && (
                    <span
                      className={`ml-auto min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center ${
                        active ? 'bg-white text-garnet-600' : 'bg-garnet-600 text-white'
                      }`}
                    >
                      {formatBadge(item.badge)}
                    </span>
                  )}
                </Link>
              )
            })}

            <DirectMessagesTeaser />
          </nav>

          {username && (
            <Link
              href="/configuracion"
              className={`mb-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                pathname === '/configuracion'
                  ? 'bg-ink-800 text-neutral-100'
                  : 'text-neutral-300 hover:bg-ink-800'
              }`}
            >
              <SettingsIcon className="w-5 h-5" />
              Configuración
            </Link>
          )}

          <Link
            href="/novedades"
            target="_blank"
            rel="noopener noreferrer"
            title="Ver las notas de la última actualización"
            className="mb-3 inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full text-[11px] text-neutral-500 hover:text-garnet-400 hover:bg-ink-800 transition"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-garnet-500" />
            v{APP_VERSION} · Novedades
          </Link>

          <div className="pt-4 border-t border-ink-800">
            {loading ? null : userId ? (
              <div className="space-y-1">
                <Link
                  href={`/perfil/${username}`}
                  className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-ink-800 transition group"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-ink-700 flex items-center justify-center shrink-0">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt={username ?? ''} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-garnet-400">
                        {(username ?? '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="text-sm font-bold text-neutral-100 truncate group-hover:text-garnet-400 transition">
                      {idStudent || username}
                    </p>
                    <p className="text-xs text-neutral-600 truncate">@{username}</p>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-1.5 px-2 text-xs text-neutral-500 hover:text-garnet-400 transition"
                >
                  <LogoutIcon className="w-3.5 h-3.5" />
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 justify-center bg-garnet-600 hover:bg-garnet-500 text-white text-sm font-medium rounded-xl py-2.5 transition"
              >
                <LoginIcon className="w-4 h-4" />
                Iniciar sesión
              </Link>
            )}
          </div>
        </aside>

        {/* Barra superior movil */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-center border-b border-ink-800 bg-ink-950/90 backdrop-blur px-4 py-3">
          <Logo size="sm" />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {username && (
              <Link
                href="/configuracion"
                aria-label="Configuración"
                className="p-1.5 rounded-full text-neutral-500 hover:text-garnet-400 hover:bg-ink-800 transition"
              >
                <SettingsIcon className="w-[18px] h-[18px]" />
              </Link>
            )}
            <Link
              href="/novedades"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-neutral-500 hover:text-garnet-400 transition px-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-garnet-500" />v{APP_VERSION}
            </Link>
          </div>
        </header>

        <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>

        {/* Barra inferior movil */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-ink-800 bg-ink-900/95 backdrop-blur px-2 pb-[env(safe-area-inset-bottom,0px)]">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const active = item.match(pathname)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-[10.5px] ${
                    active ? 'text-garnet-400' : 'text-neutral-500'
                  }`}
                >
                  <span className="relative">
                    <Icon filled={active} className="w-5 h-5" />
                    {!!item.badge && item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-garnet-600 text-white text-[9.5px] font-semibold flex items-center justify-center">
                        {formatBadge(item.badge)}
                      </span>
                    )}
                  </span>
                  {item.shortLabel ?? item.label}
                </Link>
              )
            })}
            <button
              type="button"
              onClick={() =>
                window.alert('Muy pronto vas a poder mandar mensajes directos a otros estudiantes 💬')
              }
              className="flex flex-col items-center gap-0.5 px-2.5 py-1 text-[10.5px] text-neutral-600"
            >
              <MessageIcon className="w-5 h-5" />
              Mensajes
            </button>
            {!loading && !userId && (
              <Link
                href="/login"
                className="flex flex-col items-center gap-0.5 px-2.5 py-1 text-[10.5px] text-garnet-400"
              >
                <LoginIcon className="w-5 h-5" />
                Entrar
              </Link>
            )}
          </div>
        </nav>
      </div>
    </AppSessionContext.Provider>
  )
}
