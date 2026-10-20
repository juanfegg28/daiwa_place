'use client'

import WalletChip from './WalletChip'
import Avatar from './cosmetics/Avatar'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
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
  GhostNavIcon,
  BellIcon,
  SearchIcon,
  SettingsIcon,
  ShieldAdminIcon,
  WrenchIcon,
  LogoutIcon,
  LoginIcon,
  MenuIcon,
  ClubsIcon,
  TargetIcon,
  StoreIcon,
  CloseIcon,
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
  /** Nombre del personaje (el que se ve en grande); si no tiene, null */
  displayName: string | null
  /** Sube cada vez que llega o cambia una notificación; la página de Notificaciones lo usa para recargarse sola */
  notificationsVersion: number
  /** Vuelve a contar las no leídas (se llama después de leer o borrar notificaciones) */
  refreshNotifications: () => void
  /** Chats (aceptados) con mensajes sin leer: es el numerito del ícono de Mensajes. Las solicitudes NO suman aquí. */
  unreadMessages: number
  /** Solicitudes de mensaje sin leer (solo se muestran dentro de Mensajes → Solicitudes) */
  messageRequests: number
  /** Sube cuando llega algo nuevo de mensajes/notas; las pantallas de Mensajes lo usan para recargarse */
  dmVersion: number
  refreshDm: () => void
  /** Ids de las personas conectadas ahora mismo (vacío si tú tienes apagado el estado "conectado") */
  onlineIds: Set<string>
  /** Si tú muestras (y ves) el estado "conectado" */
  showOnline: boolean
  /** Si tú muestras (y ves) el "Visto" de los mensajes */
  showReadReceipts: boolean
}

const AppSessionContext = createContext<SessionState>({
  loading: true,
  userId: null,
  username: null,
  avatarUrl: null,
  displayName: null,
  permissions: {},
  isSupreme: false,
  hasAnyRole: false,
  refresh: () => {},
  unreadNotifications: 0,
  notificationsVersion: 0,
  refreshNotifications: () => {},
  unreadMessages: 0,
  messageRequests: 0,
  dmVersion: 0,
  refreshDm: () => {},
  onlineIds: new Set<string>(),
  showOnline: true,
  showReadReceipts: true,
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

/** Burbuja roja con número. Hace un «pop» cada vez que el número SUBE (llegó algo nuevo). */
function CountBubble({ count, className = '', small = false }: { count: number; className?: string; small?: boolean }) {
  const prev = useRef(count)
  const [pop, setPop] = useState(0)
  useEffect(() => {
    if (count > prev.current) {
      function bump() {
        setPop((v) => v + 1)
      }
      bump()
    }
    prev.current = count
  }, [count])
  if (count <= 0) return null
  return (
    <span
      key={pop}
      aria-label={`${count} sin leer`}
      className={`${pop > 0 ? 'badge-pop' : ''} ${small ? 'min-w-[16px] h-[16px] px-[3px] text-[10px]' : 'min-w-[18px] h-[18px] px-1 text-[10.5px]'} rounded-full bg-red-500 text-white font-bold leading-none flex items-center justify-center shadow-[0_0_0_2px_var(--color-ink-950)] ${className}`}
    >
      {formatBadge(count)}
    </span>
  )
}

export default function AppShell({
  children,
  hideMobileChrome = false,
}: {
  children: ReactNode
  /** En celular esconde la barra de arriba y la de abajo (se usa dentro de un chat, como en Instagram) */
  hideMobileChrome?: boolean
}) {
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
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [messageRequests, setMessageRequests] = useState(0)
  const [dmVersion, setDmVersion] = useState(0)
  const [showOnline, setShowOnline] = useState(true)
  const [showReadReceipts, setShowReadReceipts] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())
  const presenceRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
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

    // Se pide aparte: si todavía no se corrió el SQL de la v0.12.0, esto no tumba el resto de la sesión
    const { data: onlineRow } = await supabase
      .from('profiles')
      .select('show_online_status')
      .eq('id', user.id)
      .maybeSingle()
    setShowOnline(onlineRow?.show_online_status !== false)

    // Igual: aparte, para que falte o no el SQL de la v0.13.5 no se rompa nada
    const { data: receiptsRow } = await supabase
      .from('profiles')
      .select('show_read_receipts')
      .eq('id', user.id)
      .maybeSingle()
    setShowReadReceipts(receiptsRow?.show_read_receipts !== false)

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

  const countDm = async () => {
    const { data } = await supabase.rpc('dm_unread_summary')
    const row = (Array.isArray(data) ? data[0] : data) as
      | { unread_conversations?: number; pending_requests?: number }
      | null
      | undefined
    setUnreadMessages(row?.unread_conversations ?? 0)
    setMessageRequests(row?.pending_requests ?? 0)
  }

  const refreshDm = () => {
    countDm()
    setDmVersion((v) => v + 1)
  }

  // Mensajes y notas en vivo (Realtime) + respaldo por si se corta la conexión
  useEffect(() => {
    if (!userId) return
    function recount() {
      countDm()
    }
    function bump() {
      countDm()
      setDmVersion((v) => v + 1)
    }
    recount()
    const channel = supabase
      .channel(`dm-live-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'note_likes' }, bump)
      .subscribe()
    const interval = window.setInterval(bump, 45000)
    window.addEventListener('focus', bump)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', bump)
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Estado "conectado": Realtime Presence. Entra al abrir la página y sale al cerrarla o perder la conexión.
  useEffect(() => {
    if (!userId || !showOnline) {
      function clear() {
        setOnlineIds(new Set())
      }
      clear()
      return
    }
    const id = userId
    const channel = supabase.channel('daiwa-presence', { config: { presence: { key: id } } })
    presenceRef.current = channel
    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineIds(new Set(Object.keys(channel.presenceState())))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() })
      })
    const leave = () => {
      channel.untrack()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') channel.track({ online_at: new Date().toISOString() })
    }
    window.addEventListener('pagehide', leave)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('pagehide', leave)
      document.removeEventListener('visibilitychange', onVisible)
      presenceRef.current = null
      supabase.removeChannel(channel)
    }
  }, [userId, showOnline])

  // Contador en la pestaña del navegador: "(3) DaiwaPlace" (avisos + chats sin leer)
  useEffect(() => {
    const total = (userId ? unreadCount : 0) + (userId ? unreadMessages : 0)
    const base = document.title.replace(/^\(\d+\+?\)\s*/, '')
    document.title = total > 0 ? `(${total > 99 ? '99+' : total}) ${base}` : base
    return () => {
      document.title = document.title.replace(/^\(\d+\+?\)\s*/, '')
    }
  }, [unreadCount, unreadMessages, userId, pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    applyTheme('dark', null)
    router.push('/login')
  }

  const isSupreme = isSupremeAdmin(username)
  const canSeeAdmin = isSupreme || hasAnyRole

  // Entradas principales del menú (los Avisos y los Mensajes van aparte, más destacados)
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
            href: '/clubes',
            label: 'Clubes y Pandillas',
            icon: ClubsIcon,
            match: (p: string) => p.startsWith('/clubes'),
          },
          {
            href: '/misiones',
            label: 'Misiones',
            icon: TargetIcon,
            match: (p: string) => p.startsWith('/misiones') || p.startsWith('/monedas'),
          },
          {
            href: '/tienda',
            label: 'Tienda',
            icon: StoreIcon,
            match: (p: string) => p.startsWith('/tienda') || p.startsWith('/personalizar'),
          },
          {
            href: '/susurros',
            label: 'Susurros',
            icon: GhostNavIcon,
            match: (p: string) => p.startsWith('/susurros'),
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

  const quickItems: NavItem[] = username
    ? [
        {
          href: '/notificaciones',
          label: 'Notificaciones',
          shortLabel: 'Avisos',
          icon: BellIcon,
          match: (p: string) => p === '/notificaciones',
          badge: unreadCount,
        },
        {
          href: '/mensajes',
          label: 'Mensajes',
          icon: MessageIcon,
          match: (p: string) => p.startsWith('/mensajes'),
          badge: unreadMessages,
        },
      ]
    : []

  // Lo que ve el numerito de las 3 rayitas: avisos + chats sin leer
  const menuBadge = userId ? unreadCount + unreadMessages : 0

  // El panel lateral se cierra solo al cambiar de página, con Escape, y no deja mover el fondo mientras está abierto
  useEffect(() => {
    function close() {
      setDrawerOpen(false)
    }
    close()
  }, [pathname])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [drawerOpen])

  // Deslizar el panel hacia la izquierda lo cierra
  const swipeStart = useRef<{ x: number; y: number } | null>(null)

  // El mantenimiento solo bloquea a estudiantes normales (sin ningún rol ni Admin Supremo)
  if (!loading && userId && maintenanceOn && !canSeeAdmin) {
    return <MaintenanceScreen onLogout={handleLogout} />
  }

  const displayLabel = idStudent || username

  const renderNavLink = (item: NavItem, variant: 'desktop' | 'drawer') => {
    const active = item.match(pathname)
    const Icon = item.icon
    const size = variant === 'drawer' ? 'py-3 text-[15px]' : 'py-2.5 text-sm'
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 px-3 ${size} rounded-xl transition ${
          active
            ? 'bg-garnet-600/90 text-white shadow-[0_8px_24px_-8px] shadow-garnet-600/70'
            : 'text-neutral-300 hover:bg-ink-800'
        }`}
      >
        <Icon filled={active} className="w-5 h-5" />
        {item.label}
      </Link>
    )
  }

  return (
    <AppSessionContext.Provider
      value={{
        loading,
        userId,
        username,
        avatarUrl,
        displayName: idStudent,
        permissions,
        isSupreme,
        hasAnyRole,
        refresh: load,
        unreadNotifications: userId ? unreadCount : 0,
        notificationsVersion,
        refreshNotifications,
        unreadMessages: userId ? unreadMessages : 0,
        messageRequests: userId ? messageRequests : 0,
        dmVersion,
        refreshDm,
        onlineIds,
        showOnline,
        showReadReceipts,
      }}
    >
      <div className="min-h-screen bg-ink-950 text-neutral-100 md:flex">
        {/* Sidebar de escritorio */}
        <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 md:shrink-0 md:h-screen md:sticky md:top-0 border-r border-ink-800 bg-ink-900/60 px-4 py-6 overflow-y-auto">
          <Link href="/" className="px-2 mb-6 inline-block">
            <Logo size="md" />
          </Link>

          {/* Avisos y Mensajes: aparte de las demás opciones, en píldoras compactas con su numerito */}
          {quickItems.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-1.5 pb-4 border-b border-ink-800">
              {quickItems.map((item) => {
                const active = item.match(pathname)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    className={`flex items-center justify-center gap-2 rounded-xl px-2.5 py-2 text-[12.5px] font-medium transition border ${
                      active
                        ? 'bg-garnet-600/90 text-white border-garnet-400/40 shadow-sm'
                        : 'bg-ink-800/70 border-ink-700 text-neutral-200 hover:bg-ink-700'
                    }`}
                  >
                    <span className="relative">
                      <Icon filled={active} className="w-[18px] h-[18px]" />
                      {!!item.badge && item.badge > 0 && <CountBubble small count={item.badge} className="absolute -top-1.5 -right-2" />}
                    </span>
                    <span>{item.shortLabel ?? item.label}</span>
                  </Link>
                )
              })}
            </div>
          )}

          {userId && (
            <div className="mb-4">
              <WalletChip userId={userId} />
            </div>
          )}

          <nav className="flex-1 space-y-1">{navItems.map((item) => renderNavLink(item, 'desktop'))}</nav>

          {username && (
            <Link
              href="/configuracion"
              className={`mb-1 mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
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
                  <Avatar username={username ?? '?'} avatarUrl={avatarUrl} size="w-9 h-9" textSize="text-sm" sizes="48px" />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="text-sm font-bold text-neutral-100 truncate group-hover:text-garnet-400 transition">
                      {displayLabel}
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

        {/* Barra superior móvil: las 3 rayitas (con la burbuja roja), el logo y listo. Ya no hay barra de abajo. */}
        <header className={`${hideMobileChrome ? 'hidden' : 'md:hidden'} sticky top-0 z-30 flex items-center justify-between border-b border-ink-800 bg-ink-950/75 backdrop-blur-xl px-3 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top,0px))]`}>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={menuBadge > 0 ? `Abrir menú (${menuBadge} sin leer)` : 'Abrir menú'}
            aria-expanded={drawerOpen}
            className="press relative w-10 h-10 rounded-full flex items-center justify-center text-neutral-200 hover:bg-ink-800 active:bg-ink-800 transition"
          >
            <MenuIcon className="w-6 h-6" />
            <CountBubble count={menuBadge} className="absolute top-0.5 right-0" />
          </button>
          <Link href="/" aria-label="Inicio">
            <Logo size="sm" />
          </Link>
          {/* Espacio del mismo ancho que el botón de la izquierda para que el logo quede centrado */}
          {!loading && !userId ? (
            <Link href="/login" className="text-xs font-medium text-garnet-400 px-2 w-10 text-right">
              Entrar
            </Link>
          ) : userId ? (
            <span className="min-w-10 flex justify-end">
              <WalletChip userId={userId} compact />
            </span>
          ) : (
            <span className="w-10" aria-hidden="true" />
          )}
        </header>

        <main className="flex-1 min-w-0 pb-[env(safe-area-inset-bottom,0px)] md:pb-0">{children}</main>

        {/* Panel lateral del celular (off-canvas) */}
        <div
          className={`md:hidden fixed inset-0 z-50 ${drawerOpen ? '' : 'pointer-events-none'}`}
          aria-hidden={!drawerOpen}
        >
          <div
            onClick={() => setDrawerOpen(false)}
            className={`absolute inset-0 bg-black/65 backdrop-blur-[2px] transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            onTouchStart={(e) => {
              swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
            }}
            onTouchEnd={(e) => {
              const start = swipeStart.current
              swipeStart.current = null
              if (!start) return
              const dx = e.changedTouches[0].clientX - start.x
              const dy = Math.abs(e.changedTouches[0].clientY - start.y)
              if (dx < -60 && dy < 50) setDrawerOpen(false)
            }}
            className={`absolute inset-y-0 left-0 w-[84vw] max-w-[22rem] flex flex-col bg-ink-900 border-r border-ink-800 shadow-[0_0_60px_rgba(0,0,0,0.7)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] ${
              drawerOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <Link href="/" onClick={() => setDrawerOpen(false)}>
                <Logo size="sm" />
              </Link>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Cerrar menú"
                className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-ink-800 transition"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3">
              {userId && (
                <Link
                  href={`/perfil/${username}`}
                  className="flex items-center gap-3 px-2 py-2.5 mb-3 rounded-2xl bg-ink-800 hover:bg-ink-700 transition"
                >
                  <Avatar username={username ?? '?'} avatarUrl={avatarUrl} size="w-11 h-11" textSize="text-base" sizes="48px" />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="text-[15px] font-bold text-neutral-50 truncate">{displayLabel}</p>
                    <p className="text-xs text-neutral-500 truncate">@{username} · Ver mi perfil</p>
                  </div>
                </Link>
              )}

              {/* Avisos y Mensajes, compactos y separados del resto */}
              {quickItems.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pb-3 mb-3 border-b border-ink-800">
                  {quickItems.map((item) => {
                    const active = item.match(pathname)
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`relative flex items-center gap-2 rounded-xl px-3 py-2 border transition ${
                          active
                            ? 'bg-garnet-600/90 text-white border-garnet-400/40'
                            : 'bg-ink-800/70 border-ink-700 text-neutral-100 hover:bg-ink-700'
                        }`}
                      >
                        <Icon filled={active} className="w-[18px] h-[18px] shrink-0" />
                        <span className="text-[13px] font-medium truncate">{item.shortLabel ?? item.label}</span>
                        {!!item.badge && item.badge > 0 && <CountBubble small count={item.badge} className="ml-auto" />}
                      </Link>
                    )
                  })}
                </div>
              )}

              <nav className="space-y-1">{navItems.map((item) => renderNavLink(item, 'drawer'))}</nav>

              {username && (
                <Link
                  href="/configuracion"
                  className={`mt-3 flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] transition ${
                    pathname === '/configuracion' ? 'bg-ink-800 text-neutral-100' : 'text-neutral-300 hover:bg-ink-800'
                  }`}
                >
                  <SettingsIcon className="w-5 h-5" />
                  Configuración
                </Link>
              )}
            </div>

            <div className="px-4 py-3 border-t border-ink-800 flex items-center justify-between gap-3">
              <Link
                href="/novedades"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[11.5px] text-neutral-500 hover:text-garnet-400 transition"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-garnet-500" />v{APP_VERSION} · Novedades
              </Link>
              {userId ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-garnet-400 transition"
                >
                  <LogoutIcon className="w-4 h-4" />
                  Cerrar sesión
                </button>
              ) : (
                !loading && (
                  <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-medium text-garnet-400">
                    <LoginIcon className="w-4 h-4" />
                    Iniciar sesión
                  </Link>
                )
              )}
            </div>
          </aside>
        </div>
      </div>
    </AppSessionContext.Provider>
  )
}
