import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { randomBytes, createHash } from 'node:crypto'
import { isSupremeAdmin, mergePermissions, type Permissions } from '../../../lib/permissions'
import { SITE_URL } from '../../../lib/og'

// v1.10.0 · Recuperación de cuentas (Centro de Mando): buscar una cuenta y generar un enlace temporal de UN SOLO USO (4 horas).
// Seguridad (todo se comprueba AQUÍ, en el servidor; lo que muestre u oculte el navegador no cuenta):
//  · Solo el Admin Supremo o un rol con el permiso «recover_accounts». Se identifica con el token de sesión (Authorization: Bearer …)
//    validado contra Supabase Auth; el usuario y sus roles se leen de la base de datos, no de lo que diga el cliente.
//  · Quien no es Admin Supremo NO puede recuperar cuentas del staff (con cualquier rol) ni del Admin Supremo (evita escalar privilegios).
//  · No se puede generar un enlace para la propia cuenta. Hay que confirmar que se verificó a la persona y escribir cómo (queda en la auditoría).
//  · El enlace se guarda solo como hash SHA-256 y se muestra UNA vez, aquí. Va en el fragmento (#) de la URL: no llega a ningún registro del servidor.
//  · Límites de frecuencia y auditoría permanente en la base de datos (sql/v1.10.0_2_recuperacion_cuentas.sql).
// No toca perfil, publicaciones, Lunas ni nada de la cuenta: solo permite que su dueño ponga contraseña y palabra secreta nuevas.

type Auth = { ok: true; adminId: string; adminName: string; supreme: boolean } | { ok: false; status: number; error: string }

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function authorize(request: Request, db: ReturnType<typeof admin>): Promise<Auth> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return { ok: false, status: 401, error: 'Inicia sesión de nuevo.' }
  const { data, error } = await db.auth.getUser(token)
  if (error || !data.user) return { ok: false, status: 401, error: 'Tu sesión no es válida. Inicia sesión de nuevo.' }
  const { data: prof } = await db.from('profiles').select('id, username, is_frozen').eq('id', data.user.id).maybeSingle()
  if (!prof) return { ok: false, status: 403, error: 'No tienes permiso para esto.' }
  if (prof.is_frozen) return { ok: false, status: 403, error: 'Tu cuenta está congelada.' }
  const supreme = isSupremeAdmin(prof.username)
  if (supreme) return { ok: true, adminId: prof.id, adminName: prof.username, supreme: true }
  const { data: rows } = await db.from('user_roles').select('roles(permissions)').eq('user_id', prof.id)
  const merged = mergePermissions(
    ((rows as unknown as { roles: { permissions: Permissions } | null }[] | null) ?? [])
      .map((r) => r.roles)
      .filter((r): r is { permissions: Permissions } => !!r && typeof r.permissions === 'object')
  )
  if (!merged.recover_accounts) return { ok: false, status: 403, error: 'No tienes permiso para recuperar cuentas.' }
  return { ok: true, adminId: prof.id, adminName: prof.username, supreme: false }
}

/** ¿La cuenta es del staff (algún rol) o del Admin Supremo? Solo el Admin Supremo puede recuperarlas. */
async function isProtectedAccount(db: ReturnType<typeof admin>, userId: string, username: string): Promise<boolean> {
  if (isSupremeAdmin(username)) return true
  const { count } = await db.from('user_roles').select('role_id', { count: 'exact', head: true }).eq('user_id', userId)
  return (count ?? 0) > 0
}

const cleanQuery = (q: string) => q.normalize('NFKC').replace(/[^\p{L}\p{N}_ .\-]/gu, '').trim().slice(0, 40)

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 })
  }
  const db = admin()
  const auth = await authorize(request, db)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const action = typeof body.action === 'string' ? body.action : ''

  // ── Buscar por nombre de usuario o nombre de estudiante ─────────────────────────────────────────
  if (action === 'search') {
    const q = cleanQuery(typeof body.q === 'string' ? body.q : '')
    if (q.length < 2) return NextResponse.json({ results: [] })
    const like = q.replace(/[%_]/g, (c) => `\\${c}`)
    const run = (cols: string) =>
      db.from('profiles').select(cols).or(`username.ilike.${like}%,id_student.ilike.%${like}%`).order('username').limit(8)
    let { data, error } = await run('id, username, id_student, avatar_url, is_frozen, created_at, security_word_hash')
    // sin el SQL de la 1.9.0 la palabra todavía está en la columna antigua
    if (error && /security_word_hash/i.test(error.message)) {
      const old = await run('id, username, id_student, avatar_url, is_frozen, created_at, security_word')
      data = ((old.data as unknown as { security_word: string | null }[] | null) ?? []).map((r) => ({ ...r, security_word_hash: r.security_word })) as unknown as typeof data
      error = old.error
    }
    if (error) return NextResponse.json({ error: 'No se pudo buscar.' }, { status: 500 })
    const rows = ((data ?? []) as unknown) as { id: string; username: string; id_student: string | null; avatar_url: string | null; is_frozen: boolean | null; created_at: string | null; security_word_hash: string | null }[]
    return NextResponse.json({
      results: rows.map((r) => ({
        id: r.id,
        username: r.username,
        id_student: r.id_student,
        avatar_url: r.avatar_url,
        is_frozen: !!r.is_frozen,
        created_at: r.created_at,
        has_secret_word: !!r.security_word_hash,
      })),
    })
  }

  // ── Estado de una cuenta: enlace activo e historial ─────────────────────────────────────────────
  if (action === 'info') {
    const userId = typeof body.userId === 'string' ? body.userId : ''
    if (!/^[0-9a-f-]{36}$/i.test(userId)) return NextResponse.json({ error: 'Cuenta no válida.' }, { status: 400 })
    const { data: target } = await db.from('profiles').select('id, username').eq('id', userId).maybeSingle()
    if (!target) return NextResponse.json({ error: 'Cuenta no encontrada.' }, { status: 404 })
    const [{ data: links }, { data: history }, protectedAcc] = await Promise.all([
      db.from('account_recovery_links').select('id, created_at, expires_at, used_at, revoked_at, note').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      db.from('account_recovery_audit').select('id, created_at, action, actor_name, detail').eq('target_id', userId).order('created_at', { ascending: false }).limit(10),
      isProtectedAccount(db, userId, target.username),
    ])
    const now = Date.now()
    const active = ((links ?? []) as { id: string; created_at: string; expires_at: string; used_at: string | null; revoked_at: string | null }[]).find(
      (l) => !l.used_at && !l.revoked_at && new Date(l.expires_at).getTime() > now
    )
    return NextResponse.json({ active: active ?? null, history: history ?? [], protected: protectedAcc, canRecover: auth.supreme || !protectedAcc })
  }

  // ── Generar el enlace ────────────────────────────────────────────────────────────────────────────
  if (action === 'create') {
    const userId = typeof body.userId === 'string' ? body.userId : ''
    const note = typeof body.note === 'string' ? body.note.trim() : ''
    if (!/^[0-9a-f-]{36}$/i.test(userId)) return NextResponse.json({ error: 'Cuenta no válida.' }, { status: 400 })
    if (body.confirmed !== true) return NextResponse.json({ error: 'Confirma que verificaste a la persona antes de generar el enlace.' }, { status: 400 })
    if (note.length < 10 || note.length > 400) return NextResponse.json({ error: 'Explica cómo verificaste a la persona (entre 10 y 400 caracteres).' }, { status: 400 })
    if (userId === auth.adminId) return NextResponse.json({ error: 'No puedes generar un enlace para tu propia cuenta.' }, { status: 400 })
    const { data: target } = await db.from('profiles').select('id, username').eq('id', userId).maybeSingle()
    if (!target) return NextResponse.json({ error: 'Cuenta no encontrada.' }, { status: 404 })
    if (!auth.supreme && (await isProtectedAccount(db, userId, target.username))) {
      return NextResponse.json({ error: 'Las cuentas del staff solo las puede recuperar el Admin Supremo.' }, { status: 403 })
    }
    const token = randomBytes(32).toString('base64url') // 43 caracteres, 256 bits
    const hash = createHash('sha256').update(token).digest('hex')
    const { data: expires, error } = await db.rpc('recovery_link_create', { p_user: userId, p_admin: auth.adminId, p_hash: hash, p_note: note, p_hours: 4 })
    if (error) {
      const known = /demasiados|propia cuenta|no encontrada/i.test(error.message)
      if (!known && /recovery_link_create|schema cache|does not exist|Could not find the function/i.test(error.message)) {
        return NextResponse.json({ error: 'Falta correr el SQL de la v1.10.0 (sql/v1.10.0_2_recuperacion_cuentas.sql) en Supabase.' }, { status: 503 })
      }
      return NextResponse.json({ error: known ? error.message : 'No se pudo generar el enlace.' }, { status: known ? 429 : 500 })
    }
    return NextResponse.json({ url: `${SITE_URL}/recuperar/enlace#${token}`, expires_at: expires as string, username: target.username })
  }

  // ── Revocar un enlace activo ─────────────────────────────────────────────────────────────────────
  if (action === 'revoke') {
    const linkId = typeof body.linkId === 'string' ? body.linkId : ''
    if (!/^[0-9a-f-]{36}$/i.test(linkId)) return NextResponse.json({ error: 'Enlace no válido.' }, { status: 400 })
    if (!auth.supreme) {
      // un administrador con el permiso solo puede revocar enlaces de cuentas que él mismo puede recuperar
      const { data: l } = await db.from('account_recovery_links').select('user_id').eq('id', linkId).maybeSingle()
      if (l) {
        const { data: t } = await db.from('profiles').select('username').eq('id', l.user_id).maybeSingle()
        if (t && (await isProtectedAccount(db, l.user_id, t.username))) return NextResponse.json({ error: 'Solo el Admin Supremo puede hacerlo.' }, { status: 403 })
      }
    }
    const { data: ok, error } = await db.rpc('recovery_link_revoke', { p_link: linkId, p_admin: auth.adminId })
    if (error) return NextResponse.json({ error: 'No se pudo revocar.' }, { status: 500 })
    return NextResponse.json({ revoked: ok === true })
  }

  return NextResponse.json({ error: 'Acción no válida.' }, { status: 400 })
}
