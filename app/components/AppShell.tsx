'use client'

import WalletChip from './WalletChip'
import MissionNotifier from './economy/MissionNotifier'
import { ClaimDot, useClaimable, useWalletRefreshOnNavigate } from './economy/ClaimDot'
import NewTag from './NewTag'
import { syncPush, unlinkPushDevice } from '../lib/push'
import { forgetAccount, rememberSession } from '../lib/accounts'
import AccountSwitcherSheet from './AccountSwitcherSheet'
import { ECO, onWake, startPoll } from '../lib/eco'
import { markWhispersSeen, useShopNoveltyFlag, useWhisperNovelty } from '../lib/novelty'
import Avatar from './cosmetics/Avatar'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import { hubChannel, hubClose, hubCloseAll, hubJoined, hubOpen } from '../lib/liveHub'
import { loadBootstrap } from '../lib/shellBootstrap'
import { applyTheme, type ThemeMode } from '../lib/theme'
import Logo from './Logo'
import { APP_VERSION } from '../lib/version'
import { lockBodyScroll, releaseStaleScrollLocks } from '../lib/scrollLock'
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
  CrescentMoonIcon,
  CloseIcon,
  CalendarIcon,
  BookmarkIcon,
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
  /** Puntito dorado (algo por reclamar, p. ej. una misión completada) */
  dot?: boolean
  /** v1.5.10 · texto brillante de novedad («Nueva confesión», «Novedad»); se quita al entrar a la sección */
  fresh?: string
}

function formatBadge(n: number) {
  return n > 99 ? '99+' : String(n)
}

function MaintenanceScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-ink-950 text-neutral-100 px-4">
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

// v1.8.0 · Cada página monta su propio AppShell, así que antes CADA cambio de página repetía 3-4 consultas (perfil, roles, modo
// mantenimiento) aunque nada hubiera cambiado: eran decenas de miles de peticiones al mes (egress y logs de Supabase). Ahora el
// resultado se recuerda 5 min entre páginas; `refresh()` (por ejemplo al guardar tu perfil) lo fuerza.
type ShellCache = {
  uid: string
  at: number
  username: string | null
  avatarUrl: string | null
  idStudent: string | null
  permissions: Permissions
  hasAnyRole: boolean
  showOnline: boolean
  showReadReceipts: boolean
  theme: ThemeMode
  accent: string | null
}
const SHELL_TTL_MS = 5 * 60_000
let shellCache: ShellCache | null = null
let maintAtGlobal = 0
let maintValueGlobal = false
// v1.9.0 · contadores recientes (avisos y chats sin leer): al cambiar de página se reutilizan 30 s en vez de pedirlos otra vez
let notifCountCache: { uid: string; at: number; n: number } | null = null
let dmCountCache: { uid: string; at: number; unread: number; req: number } | null = null
const COUNT_TTL_MS = 30_000

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
  // v1.5.8 · barra lateral de PC: se puede minimizar (3 rayitas). De entrada SIEMPRE abierta; lo que elijas se recuerda en este navegador.
  const [railCollapsed, setRailCollapsed] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        if (window.localStorage.getItem('daiwa_sidebar_collapsed') === '1') setRailCollapsed(true)
      } catch {
        /* sin almacenamiento */
      }
    }, 0)
    return () => window.clearTimeout(t)
  }, [])
  // v1.5.10 · en el Clóset la barra arranca minimizada (más espacio para ver las prendas) sin tocar lo que elegiste para el resto de la app
  const pathname = usePathname()
  const compactHere = pathname.startsWith('/personalizar')
  const [railOverride, setRailOverride] = useState<boolean | null>(null)
  useEffect(() => {
    const t = window.setTimeout(() => setRailOverride(null), 0)
    return () => window.clearTimeout(t)
  }, [compactHere])
  const collapsedNow = railOverride ?? (compactHere ? true : railCollapsed)
  const toggleRail = () => {
    if (compactHere) {
      setRailOverride(!collapsedNow)
      return
    }
    setRailCollapsed((v) => {
      const next = !v
      try {
        window.localStorage.setItem('daiwa_sidebar_collapsed', next ? '1' : '0')
      } catch {
        /* sin almacenamiento */
      }
      return next
    })
  }
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())
  const presenceRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  // v1.5.9 · Red de seguridad contra «la pantalla se queda pegada»: al cambiar de página, si quedó algún bloqueo de scroll huérfano
  // (visor de historias, chat con teclado…) se limpia solo, sin tener que recargar.
  useEffect(() => {
    const t = window.setTimeout(() => releaseStaleScrollLocks(pathname.startsWith('/mensajes') || pathname.startsWith('/historias')), 350)
    return () => window.clearTimeout(t)
  }, [pathname])
  const router = useRouter()

  const [switcherOpen, setSwitcherOpen] = useState(false)
  const loadedRef = useRef<{ id: string | null; at: number }>({ id: null, at: 0 })
  const userIdRef = useRef<string | null>(null)
  useEffect(() => {
    userIdRef.current = userId
  }, [userId])
  const dmSig = useRef('')
  const countDm = async (): Promise<boolean> => {
    const { data } = await supabase.rpc('dm_unread_summary')
    const row = (Array.isArray(data) ? data[0] : data) as
      | { unread_conversations?: number; pending_requests?: number }
      | null
      | undefined
    setUnreadMessages(row?.unread_conversations ?? 0)
    setMessageRequests(row?.pending_requests ?? 0)
    if (userIdRef.current) dmCountCache = { uid: userIdRef.current, at: Date.now(), unread: row?.unread_conversations ?? 0, req: row?.pending_requests ?? 0 }
    const sig = `${row?.unread_conversations ?? 0}:${row?.pending_requests ?? 0}`
    const changed = sig !== dmSig.current
    dmSig.current = sig
    return changed
  }

  const countUnread = async (id: string) => {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', id)
      .eq('read', false)
    setUnreadCount(count ?? 0)
    notifCountCache = { uid: id, at: Date.now(), n: count ?? 0 }
  }

  // v1.9.0 · contadores iniciales: si son recientes (<30 s) se reutilizan; si no, se piden (avisos y chats a la vez)
  const seedCounts = (uid: string) => {
    const n = notifCountCache
    if (n && n.uid === uid && Date.now() - n.at < COUNT_TTL_MS) setUnreadCount(n.n)
    else void countUnread(uid)
    const d = dmCountCache
    if (d && d.uid === uid && Date.now() - d.at < COUNT_TTL_MS) {
      setUnreadMessages(d.unread)
      setMessageRequests(d.req)
    } else void countDm()
  }

  const load = async (force = false) => {
    // v1.6.3 · sesión local (sin ir al servidor de Auth en cada carga): la seguridad real la sigue poniendo RLS
    const { data: authData } = await supabase.auth.getSession()
    const user = authData.session?.user ?? null
    // v1.6.3 · el modo mantenimiento se mira como mucho una vez cada 2 min (antes, en cada carga); v1.8.0: y se comparte entre páginas
    // v1.9.0 · con sesión iniciada llega dentro del paquete de arranque (shell_bootstrap): no hace falta pedirlo aparte
    const checkMaintenance = async () => {
      if (Date.now() - maintAtGlobal > 120_000) {
        maintAtGlobal = Date.now()
        const { data: settingsRow } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'maintenance_mode')
          .maybeSingle()
        maintValueGlobal = settingsRow?.value === true
      }
      setMaintenanceOn(maintValueGlobal)
    }
    if (!user) {
      await checkMaintenance()
      shellCache = null
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
    loadedRef.current = { id: user.id, at: Date.now() }
    // v1.8.0 · misma persona y datos recientes: se reutilizan (cambiar de página ya no repite 3-4 consultas)
    const hit = shellCache
    if (!force && hit && hit.uid === user.id && Date.now() - hit.at < SHELL_TTL_MS) {
      setUsername(hit.username)
      setAvatarUrl(hit.avatarUrl)
      setIdStudent(hit.idStudent)
      setPermissions(hit.permissions)
      setHasAnyRole(hit.hasAnyRole)
      setShowOnline(hit.showOnline)
      setShowReadReceipts(hit.showReadReceipts)
      applyTheme(hit.theme, hit.accent)
      rememberSession(authData.session, { username: hit.username, name: hit.idStudent, avatar: hit.avatarUrl })
      setLoading(false)
      await checkMaintenance()
      seedCounts(user.id)
      return
    }
    // v1.9.0 · arranque en frío: UNA sola petición trae perfil, permisos, mantenimiento y contadores (antes eran 5)
    const boot = await loadBootstrap()
    if (boot && boot.profile) {
      const pr = boot.profile
      maintAtGlobal = Date.now()
      maintValueGlobal = boot.maintenance
      setMaintenanceOn(boot.maintenance)
      setShowOnline(pr.show_online_status !== false)
      setShowReadReceipts(pr.show_read_receipts !== false)
      setUsername(pr.username ?? null)
      setAvatarUrl(pr.avatar_url ?? null)
      setIdStudent(pr.id_student ?? null)
      applyTheme((pr.theme as ThemeMode) ?? 'dark', pr.accent_color ?? null)
      const mergedBoot = mergePermissions((boot.roles as Permissions[]).filter((p) => p && typeof p === 'object').map((p) => ({ permissions: p })))
      setPermissions(mergedBoot)
      setHasAnyRole(boot.roles.length > 0)
      notifCountCache = { uid: user.id, at: Date.now(), n: boot.unreadNotifications }
      dmCountCache = { uid: user.id, at: Date.now(), unread: boot.dmUnread, req: boot.dmRequests }
      setUnreadCount(boot.unreadNotifications)
      setUnreadMessages(boot.dmUnread)
      setMessageRequests(boot.dmRequests)
      dmSig.current = `${boot.dmUnread}:${boot.dmRequests}`
      shellCache = {
        uid: user.id,
        at: Date.now(),
        username: pr.username ?? null,
        avatarUrl: pr.avatar_url ?? null,
        idStudent: pr.id_student ?? null,
        permissions: mergedBoot,
        hasAnyRole: boot.roles.length > 0,
        showOnline: pr.show_online_status !== false,
        showReadReceipts: pr.show_read_receipts !== false,
        theme: (pr.theme as ThemeMode) ?? 'dark',
        accent: pr.accent_color ?? null,
      }
      rememberSession(authData.session, { username: pr.username ?? null, name: pr.id_student ?? null, avatar: pr.avatar_url ?? null })
      setLoading(false)
      return
    }
    await checkMaintenance()
    // v1.6.3 · UNA sola consulta de perfil (antes eran 3). Si falta alguna columna de SQL viejos, se usa el camino de siempre.
    let profile: { username?: string | null; avatar_url?: string | null; id_student?: string | null; theme?: string | null; accent_color?: string | null; show_online_status?: boolean | null; show_read_receipts?: boolean | null } | null = null
    const full = await supabase
      .from('profiles')
      .select('username, avatar_url, id_student, theme, accent_color, show_online_status, show_read_receipts')
      .eq('id', user.id)
      .maybeSingle()
    if (!full.error) {
      profile = full.data
      setShowOnline(profile?.show_online_status !== false)
      setShowReadReceipts(profile?.show_read_receipts !== false)
    } else {
      const base = await supabase.from('profiles').select('username, avatar_url, id_student, theme, accent_color').eq('id', user.id).maybeSingle()
      profile = base.data
      const { data: onlineRow } = await supabase.from('profiles').select('show_online_status').eq('id', user.id).maybeSingle()
      setShowOnline(onlineRow?.show_online_status !== false)
      const { data: receiptsRow } = await supabase.from('profiles').select('show_read_receipts').eq('id', user.id).maybeSingle()
      setShowReadReceipts(receiptsRow?.show_read_receipts !== false)
    }
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

    shellCache = {
      uid: user.id,
      at: Date.now(),
      username: profile?.username ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      idStudent: profile?.id_student ?? null,
      permissions: merged,
      hasAnyRole: (roleRows ?? []).length > 0,
      showOnline: profile?.show_online_status !== false,
      showReadReceipts: profile?.show_read_receipts !== false,
      theme: (profile?.theme as ThemeMode) ?? 'dark',
      accent: profile?.accent_color ?? null,
    }
    // v1.8.0 · esta cuenta queda guardada en este dispositivo para el cambio rápido de cuentas
    rememberSession(authData.session, { username: profile?.username ?? null, name: profile?.id_student ?? null, avatar: profile?.avatar_url ?? null })

    setLoading(false)
    seedCounts(user.id)
  }

  useEffect(() => {
    function run() {
      load()
    }
    run()
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // v1.6.3 · renovar el token (cada hora) o volver a la pestaña NO vuelve a cargar todo el perfil
      if (event === 'TOKEN_REFRESHED') {
        rememberSession(session) // v1.8.0 · el cambio rápido de cuentas necesita siempre el token más nuevo
        return
      }
      if (event === 'SIGNED_OUT') {
        shellCache = null
        notifCountCache = null
        dmCountCache = null
        hubCloseAll()
      }
      if (event === 'SIGNED_IN' && session?.user?.id && session.user.id === loadedRef.current.id && Date.now() - loadedRef.current.at < 10 * 60_000) return
      load()
    })
    return () => sub.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    // v1.5.8 · varios eventos seguidos (ráfaga de likes, etc.) se juntan en UNA sola recarga
    let timer: number | undefined
    function bump() {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        countUnread(id)
        setNotificationsVersion((v) => v + 1)
      }, 350)
    }
    // v1.9.0 · el conteo inicial lo hace load() (con caché de 30 s); aquí solo se escucha. El canal NO se cierra al cambiar de página.
    const key = `notifications-${id}`
    const off = hubOpen(
      key,
      (emit) =>
        supabase
          .channel(key)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${id}` }, () => emit())
          .subscribe(),
      bump
    )
    // v1.6.3 · respaldo cada 5 min (solo si estás mirando la pestaña y activo) y al volver a ella
    const stop = startPoll(recount, ECO.notifRecountMs, () => hubJoined(key))
    const offWake = onWake(bump)
    return () => {
      window.clearTimeout(timer)
      stop()
      offWake()
      off()
    }
  }, [userId])

  const refreshDm = () => {
    countDm()
    setDmVersion((v) => v + 1)
  }

  // Mensajes en vivo (Realtime) + respaldo por si se corta la conexión.
  // v1.6.3 · Antes se escuchaban TODAS las filas de messages, conversations, message_reactions, notes y note_likes de TODA la app
  // (cada mensaje de cualquiera se revisaba contra cada persona conectada: muchísimo CPU). Ahora solo se escuchan TUS conversaciones:
  // cada mensaje nuevo actualiza `conversations.last_message_at` por un disparador, así que basta con eso.
  useEffect(() => {
    if (!userId) return
    const id = userId
    // varios eventos seguidos (mensaje, lectura…) se juntan en UNA sola recarga
    let timer: number | undefined
    function bump() {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        void countDm()
        setDmVersion((v) => v + 1)
      }, 350)
    }
    // respaldo: solo recarga la bandeja si los contadores cambiaron
    async function soft() {
      if (await countDm()) setDmVersion((v) => v + 1)
    }
    const key = `dm-live-${id}`
    const off = hubOpen(
      key,
      (emit) =>
        supabase
          .channel(key)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `user_a=eq.${id}` }, () => emit())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `user_b=eq.${id}` }, () => emit())
          .subscribe(),
      bump
    )
    const stop = startPoll(soft, ECO.dmRecountMs, () => hubJoined(key))
    return () => {
      window.clearTimeout(timer)
      stop()
      off()
    }
  }, [userId])

  // Estado "conectado": Realtime Presence. Entra al abrir la página y sale al cerrarla o perder la conexión.
  useEffect(() => {
    if (!userId || !showOnline) {
      function clear() {
        setOnlineIds(new Set())
      }
      clear()
      if (userIdRef.current) hubClose(`presence-${userIdRef.current}`) // apagaste «conectado»: sales YA, sin esperar
      return
    }
    // v1.9.0 · el canal de presencia dura mientras navegas (antes se cerraba y se abría en cada página, avisando a TODAS las personas
    // conectadas cada vez). Quien llega a una página nueva recibe enseguida la última lista de conectados.
    const id = userId
    const key = `presence-${id}`
    const off = hubOpen(
      key,
      (emit) => {
        const ch = supabase.channel('daiwa-presence', { config: { presence: { key: id } } })
        ch.on('presence', { event: 'sync' }, () => emit(Object.keys(ch.presenceState()))).subscribe(async (status) => {
          if (status === 'SUBSCRIBED') await ch.track({ online_at: new Date().toISOString() })
        })
        return ch
      },
      (list) => setOnlineIds(new Set((list as string[] | undefined) ?? [])),
      { replay: true }
    )
    presenceRef.current = hubChannel(key)
    const leave = () => {
      hubChannel(key)?.untrack()
    }
    let lastTrack = Date.now()
    const onVisible = () => {
      // solo si pasó más de 1 minuto: cada «track» avisa a todos los conectados
      if (document.visibilityState === 'visible' && Date.now() - lastTrack > 60_000) {
        lastTrack = Date.now()
        void hubChannel(key)?.track({ online_at: new Date().toISOString() })
      }
    }
    window.addEventListener('pagehide', leave)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('pagehide', leave)
      document.removeEventListener('visibilitychange', onVisible)
      presenceRef.current = null
      off()
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

  // v1.6.1 · si ya diste permiso de notificaciones, este celular queda ligado a la cuenta que está abierta
  useEffect(() => {
    if (!userId) return
    const t = window.setTimeout(() => void syncPush(), 4000)
    return () => window.clearTimeout(t)
  }, [userId])

  const handleLogout = async () => {
    await unlinkPushDevice() // este celular deja de recibir los avisos de esta cuenta
    try {
      window.sessionStorage.removeItem('daiwa_push_synced')
    } catch {
      /* sin almacenamiento */
    }
    if (userId) forgetAccount(userId) // v1.8.0 · cerrar sesión la quita de la lista del cambio rápido
    shellCache = null
    await supabase.auth.signOut()
    applyTheme('dark', null)
    router.push('/login')
  }

  // puntito dorado en todos los iconos de Misiones mientras haya algo por reclamar (v1.4.0)
  const { dot: missionDot } = useClaimable(userId)
  // v1.5.10 · brillito de novedad: confesión nueva (Susurros) y colección/descuento nuevo (Tienda). Entrar a la sección lo apaga.
  const whisperFlag = useWhisperNovelty(userId)
  const shopFlag = useShopNoveltyFlag(userId)
  const inWhispers = pathname.startsWith('/susurros')
  const inShop = pathname.startsWith('/tienda') || pathname.startsWith('/personalizar')
  useEffect(() => {
    if (userId && inWhispers) void markWhispersSeen(userId)
  }, [userId, inWhispers])
  const whisperFresh = whisperFlag && !inWhispers ? 'Nueva confesión' : undefined
  const shopFresh = shopFlag && !inShop ? 'Novedad' : undefined
  const anyFresh = !!(whisperFresh || shopFresh)
  useWalletRefreshOnNavigate(userId, pathname)
  const isSupreme = isSupremeAdmin(username)
  const canSeeAdmin = isSupreme || hasAnyRole

  // v1.5.8 · El valor del contexto se arma UNA vez por cambio real (antes era un objeto nuevo en cada render y repintaba a todos los que lo leen).
  const loadRef = useRef(load)
  const refreshNotifRef = useRef(refreshNotifications)
  const refreshDmRef = useRef(refreshDm)
  useEffect(() => {
    loadRef.current = load
    refreshNotifRef.current = refreshNotifications
    refreshDmRef.current = refreshDm
  })
  const stableRefresh = useCallback(() => loadRef.current(true), [])
  const stableRefreshNotifications = useCallback(() => refreshNotifRef.current(), [])
  const stableRefreshDm = useCallback(() => refreshDmRef.current(), [])
  const sessionValue = useMemo<SessionState>(
    () => ({
      loading,
      userId,
      username,
      avatarUrl,
      displayName: idStudent,
      permissions,
      isSupreme,
      hasAnyRole,
      refresh: stableRefresh,
      unreadNotifications: userId ? unreadCount : 0,
      notificationsVersion,
      refreshNotifications: stableRefreshNotifications,
      unreadMessages: userId ? unreadMessages : 0,
      messageRequests: userId ? messageRequests : 0,
      dmVersion,
      refreshDm: stableRefreshDm,
      onlineIds,
      showOnline,
      showReadReceipts,
    }),
    [loading, userId, username, avatarUrl, idStudent, permissions, isSupreme, hasAnyRole, stableRefresh, unreadCount, notificationsVersion, stableRefreshNotifications, unreadMessages, messageRequests, dmVersion, stableRefreshDm, onlineIds, showOnline, showReadReceipts]
  )

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
            dot: missionDot,
          },
          {
            href: '/tienda',
            label: 'Tienda',
            icon: StoreIcon,
            match: (p: string) => p.startsWith('/tienda') || p.startsWith('/personalizar'),
            fresh: shopFresh,
          },
          {
            href: '/apoyar',
            label: 'Círculo Lunar',
            icon: CrescentMoonIcon,
            match: (p: string) => p.startsWith('/apoyar'),
          },
          {
            href: '/susurros',
            label: 'Susurros',
            icon: GhostNavIcon,
            match: (p: string) => p.startsWith('/susurros'),
            fresh: whisperFresh,
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
        // v1.9.0 · accesos rápidos (ya no van en la lista larga de abajo)
        {
          href: '/eventos',
          label: 'Eventos',
          icon: CalendarIcon,
          match: (p: string) => p.startsWith('/eventos'),
        },
        {
          href: '/guardados',
          label: 'Guardados',
          icon: BookmarkIcon,
          match: (p: string) => p.startsWith('/guardados'),
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
    const unlock = lockBodyScroll()
    return () => {
      document.removeEventListener('keydown', onKey)
      unlock()
    }
  }, [drawerOpen])

  // Deslizar el panel hacia la izquierda lo cierra
  const swipeStart = useRef<{ x: number; y: number } | null>(null)

  // El mantenimiento solo bloquea a estudiantes normales (sin ningún rol ni Admin Supremo)
  if (!loading && userId && maintenanceOn && !canSeeAdmin) {
    return <MaintenanceScreen onLogout={handleLogout} />
  }

  const displayLabel = idStudent || username

  // v1.9.0 · la lista del menú se ordena en secciones (Comunidad · Tu espacio · Equipo) para que no se vea apretada
  const NAV_GROUP_LABEL = { main: 'Comunidad', you: 'Tu espacio', admin: 'Equipo' } as const
  const navGroupOf = (href: string): keyof typeof NAV_GROUP_LABEL =>
    href === '/' || href === '/explorar' || href.startsWith('/clubes') || href.startsWith('/susurros') ? 'main' : href === '/admin' ? 'admin' : 'you'
  const groupedNav = (['main', 'you', 'admin'] as const)
    .map((g) => ({ id: g, items: navItems.filter((it) => navGroupOf(it.href) === g) }))
    .filter((g) => g.items.length > 0)

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
        <span className="relative">
          <Icon filled={active} className="w-5 h-5" />
          {item.dot && <ClaimDot className="-top-1 -right-1 w-2.5 h-2.5" label={`${item.label}: tienes premios por reclamar`} />}
        </span>
        {item.label}
        {item.dot && <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-amber-300">Reclamar</span>}
        {item.fresh && !item.dot && <NewTag className="ml-auto">{item.fresh}</NewTag>}
      </Link>
    )
  }

  const renderNavGroups = (variant: 'desktop' | 'drawer') =>
    groupedNav.map((g, gi) => (
      <div key={g.id} className={gi > 0 ? 'mt-3' : ''}>
        {groupedNav.length > 1 && <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600">{NAV_GROUP_LABEL[g.id]}</p>}
        <div className="space-y-1">{g.items.map((item) => renderNavLink(item, variant))}</div>
      </div>
    ))

  return (
    <AppSessionContext.Provider value={sessionValue}>
      <div className="min-h-dvh bg-ink-950 text-neutral-100 md:flex">
        <MissionNotifier userId={userId} />
        {/* Sidebar de escritorio (v1.5.8: se puede minimizar con las 3 rayitas; abierta de entrada) */}
        <aside
          aria-label="Menú principal"
          className={`hidden md:flex md:flex-col md:shrink-0 md:h-screen md:sticky md:top-0 border-r border-ink-800 bg-ink-900/60 overflow-y-auto overflow-x-hidden transition-[width] duration-200 ease-out ${
            collapsedNow ? 'md:w-[76px] px-2.5 py-4 items-center' : 'md:w-64 lg:w-72 px-4 py-6'
          }`}
        >
          {collapsedNow ? (
            <>
              {/* Minimizada: solo íconos. La hamburguesa lleva un puntito rojo si hay avisos/mensajes y uno dorado si hay misiones por reclamar */}
              <button
                type="button"
                onClick={toggleRail}
                aria-label={menuBadge > 0 ? `Abrir la barra lateral (${menuBadge} sin leer)` : 'Abrir la barra lateral'}
                title="Abrir la barra lateral"
                className="press relative w-11 h-11 mb-3 rounded-xl flex items-center justify-center text-neutral-200 hover:bg-ink-800 transition"
              >
                <MenuIcon className="w-6 h-6" />
                {menuBadge > 0 ? (
                  <span aria-hidden="true" className="absolute top-1 right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-ink-900" />
                ) : (
                  missionDot ? <ClaimDot className="top-1 right-1 w-3 h-3" label="Tienes misiones por reclamar" /> : anyFresh && <NewTag variant="dot" className="top-1 right-1">Hay novedades</NewTag>
                )}
              </button>

              {quickItems.map((item) => {
                const active = item.match(pathname)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    title={item.label}
                    className={`relative mb-1 w-11 h-11 rounded-xl flex items-center justify-center transition border ${
                      active ? 'bg-garnet-600/90 text-white border-garnet-400/40' : 'bg-ink-800/70 border-ink-700 text-neutral-200 hover:bg-ink-700'
                    }`}
                  >
                    <Icon filled={active} className="w-5 h-5" />
                    {!!item.badge && item.badge > 0 && <CountBubble small count={item.badge} className="absolute -top-1.5 -right-1.5" />}
                  </Link>
                )
              })}

              {userId && (
                <div className="my-2 w-full">
                  <WalletChip userId={userId} rail />
                </div>
              )}

              <nav className="flex-1 mt-1 flex flex-col items-center gap-1">
                {groupedNav.flatMap((g, gi) => (gi > 0 ? [{ divider: g.id } as const, ...g.items] : g.items)).map((item) => {
                  if ('divider' in item) return <span key={`d-${item.divider}`} className="w-6 h-px bg-ink-700 my-1" aria-hidden />
                  const active = item.match(pathname)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-label={item.label}
                      title={item.label}
                      className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition ${
                        active ? 'bg-garnet-600/90 text-white shadow-[0_8px_24px_-8px] shadow-garnet-600/70' : 'text-neutral-300 hover:bg-ink-800'
                      }`}
                    >
                      <Icon filled={active} className="w-5 h-5" />
                      {item.dot && <ClaimDot className="top-1 right-1 w-2.5 h-2.5" label={`${item.label}: tienes premios por reclamar`} />}
                      {item.fresh && !item.dot && <NewTag variant="dot" className="top-1 right-1">{item.fresh}</NewTag>}
                    </Link>
                  )
                })}
              </nav>

              {username && (
                <Link
                  href="/configuracion"
                  aria-label="Configuración"
                  title="Configuración"
                  className={`mt-2 w-11 h-11 rounded-xl flex items-center justify-center transition ${
                    pathname === '/configuracion' ? 'bg-ink-800 text-neutral-100' : 'text-neutral-300 hover:bg-ink-800'
                  }`}
                >
                  <SettingsIcon className="w-5 h-5" />
                </Link>
              )}
              <Link
                href="/novedades"
                target="_blank"
                rel="noopener noreferrer"
                title={`v${APP_VERSION} · Novedades`}
                aria-label={`Versión ${APP_VERSION}: ver novedades`}
                className="my-2 text-[10px] text-neutral-500 hover:text-garnet-400 transition inline-flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-garnet-500" />v{APP_VERSION}
              </Link>

              <div className="pt-3 border-t border-ink-800 w-full flex flex-col items-center gap-2">
                {loading ? null : userId ? (
                  <>
                    <Link href={`/perfil/${username}`} aria-label="Mi perfil" title={displayLabel ?? 'Mi perfil'}>
                      <Avatar username={username ?? '?'} avatarUrl={avatarUrl} size="w-9 h-9" textSize="text-sm" sizes="48px" />
                    </Link>
                    <button onClick={() => setSwitcherOpen(true)} aria-label="Cambiar de cuenta" title="Cambiar de cuenta" className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 hover:text-garnet-400 hover:bg-ink-800 transition text-base">
                      ⇄
                    </button>
                    <button onClick={handleLogout} aria-label="Cerrar sesión" title="Cerrar sesión" className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 hover:text-garnet-400 hover:bg-ink-800 transition">
                      <LogoutIcon className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <Link href="/login" aria-label="Iniciar sesión" title="Iniciar sesión" className="w-11 h-11 rounded-xl bg-garnet-600 hover:bg-garnet-500 text-white flex items-center justify-center transition">
                    <LoginIcon className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <Link href="/" className="px-2 inline-block">
                  <Logo size="md" />
                </Link>
                <button
                  type="button"
                  onClick={toggleRail}
                  aria-label="Minimizar la barra lateral"
                  title="Minimizar la barra lateral"
                  className="press relative w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-ink-800 transition"
                >
                  <MenuIcon className="w-5 h-5" />
                </button>
              </div>

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

              <nav className="flex-1">{renderNavGroups('desktop')}</nav>

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
              {username && (
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false)
                    setSwitcherOpen(true)
                  }}
                  className="mt-1 w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] text-neutral-300 hover:bg-ink-800 transition text-left"
                >
                  <span className="w-5 text-center text-lg leading-none" aria-hidden="true">⇄</span>
                  Cambiar de cuenta
                </button>
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
              <Link href="/descargar" className="mb-3 -mt-1 inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full text-[11px] text-neutral-500 hover:text-garnet-400 hover:bg-ink-800 transition">
                📲 Descargar app
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
                      onClick={() => setSwitcherOpen(true)}
                      className="w-full flex items-center gap-1.5 px-2 text-xs text-neutral-500 hover:text-garnet-400 transition"
                    >
                      <span className="w-3.5 text-center" aria-hidden="true">⇄</span>
                      Cambiar de cuenta
                    </button>
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
            </>
          )}
        </aside>

        {/* Barra superior móvil: las 3 rayitas (con la burbuja roja), el logo y listo. Ya no hay barra de abajo. */}
        <header className={`${hideMobileChrome ? 'hidden' : 'md:hidden'} sticky top-0 z-30 grid grid-cols-[1fr_auto_1fr] items-center border-b border-ink-800 bg-ink-950/95 px-3 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top,0px))]`}>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={menuBadge > 0 ? `Abrir menú (${menuBadge} sin leer)` : 'Abrir menú'}
            aria-expanded={drawerOpen}
            className="press relative justify-self-start w-10 h-10 rounded-full flex items-center justify-center text-neutral-200 hover:bg-ink-800 active:bg-ink-800 transition"
          >
            <MenuIcon className="w-6 h-6" />
            <CountBubble count={menuBadge} className="absolute top-0.5 right-0" />
            {missionDot && menuBadge === 0 && <ClaimDot className="top-1 right-1 w-3 h-3" label="Tienes misiones por reclamar" />}
            {anyFresh && menuBadge === 0 && !missionDot && <NewTag variant="dot" className="top-1 right-1">Hay novedades</NewTag>}
          </button>
          <Link href="/" aria-label="Inicio">
            <Logo size="sm" />
          </Link>
          {/* Espacio del mismo ancho que el botón de la izquierda para que el logo quede centrado */}
          {!loading && !userId ? (
            <Link href="/login" className="justify-self-end text-xs font-medium text-garnet-400 px-2 text-right">
              Entrar
            </Link>
          ) : userId ? (
            <span className="justify-self-end flex items-center gap-1">
              <Link href="/eventos" aria-label="Eventos" className="press w-9 h-9 rounded-full flex items-center justify-center text-neutral-300 hover:bg-ink-800 active:bg-ink-800 transition">
                <CalendarIcon className="w-5 h-5" />
              </Link>
              <WalletChip userId={userId} compact />
            </span>
          ) : (
            <span className="w-10 justify-self-end" aria-hidden="true" />
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
            className={`absolute inset-0 bg-black/65 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
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

              <nav>{renderNavGroups('drawer')}</nav>

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
              <Link href="/descargar" className="text-[11.5px] text-neutral-500 hover:text-garnet-400 transition">📲 Descargar app</Link>
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
      <AccountSwitcherSheet open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </AppSessionContext.Provider>
  )
}
