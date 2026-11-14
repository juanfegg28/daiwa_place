import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'

// v1.10.0 · Usar un enlace de recuperación generado por el staff (Centro de Mando → Recuperación de cuentas).
//  · El enlace es de UN solo uso y vence a las 4 horas: se consume con un UPDATE atómico en la base de datos (recovery_link_claim).
//  · Solo se guarda su hash; el navegador lo manda en el cuerpo de la petición (viaja en el fragmento # de la URL, que no llega a ningún registro).
//  · Con él la persona define contraseña nueva y palabra secreta nueva (la palabra se guarda como hash, igual que en la v1.9.0).
//    NUNCA se muestra ni se devuelve la contraseña o palabra anterior, y no se toca nada más de la cuenta.
//  · Límite de intentos por conexión (tabla recovery_attempts, marca «rl:link») y mensaje único de error: no revela por qué falló.
//  · Al terminar se cierran las demás sesiones de la cuenta y todo queda en la auditoría.
//  · La palabra secreta tradicional (/api/recover) sigue funcionando igual.
const MAX_BAD_PER_IP = 20 // intentos con enlaces inválidos, por conexión y por hora
const INVALID = 'Este enlace no es válido o ya venció. Pide uno nuevo al staff.'
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip')?.trim() || 'desconocida'
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 })
  }
  const action = body.action === 'check' || body.action === 'use' ? body.action : ''
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  if (!action) return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 })

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
  const ip = clientIp(request)
  const marker = 'rl:link'

  const { count: bad } = await db
    .from('recovery_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('username', marker)
    .eq('ip', ip)
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
  if ((bad ?? 0) >= MAX_BAD_PER_IP) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera un rato antes de volver a intentarlo.' }, { status: 429 })
  }
  const invalid = async () => {
    await db.from('recovery_attempts').insert({ username: marker, ip })
    return NextResponse.json({ error: INVALID }, { status: 400 })
  }
  if (!TOKEN_RE.test(token)) return invalid()
  const hash = createHash('sha256').update(token).digest('hex')

  // ── Comprobar (sin consumir) ────────────────────────────────────────────────────────────────────
  if (action === 'check') {
    const { data, error } = await db.rpc('recovery_link_peek', { p_hash: hash })
    if (error) return NextResponse.json({ error: 'No se pudo comprobar en este momento. Inténtalo de nuevo.' }, { status: 503 })
    const row = (data as { link_id: string; user_id: string; username: string; expires_at: string }[] | null)?.[0]
    if (!row) return invalid()
    await db.rpc('recovery_link_event', { p_action: 'link_opened', p_link: row.link_id, p_target: row.user_id, p_detail: { ip } })
    return NextResponse.json({ valid: true, username: row.username, expires_at: row.expires_at })
  }

  // ── Usar: contraseña nueva + palabra secreta nueva ──────────────────────────────────────────────
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''
  const newWord = typeof body.newSecurityWord === 'string' ? body.newSecurityWord.trim() : ''
  if (newPassword.length < 6 || newPassword.length > 72) return NextResponse.json({ error: 'La contraseña nueva debe tener entre 6 y 72 caracteres.' }, { status: 400 })
  if (newWord.length < 4 || newWord.length > 100) return NextResponse.json({ error: 'La palabra secreta debe tener entre 4 y 100 caracteres.' }, { status: 400 })

  // 1) consumir el enlace (atómico: si dos personas lo usan a la vez, solo una gana)
  const claimed = await db.rpc('recovery_link_claim', { p_hash: hash })
  if (claimed.error) return NextResponse.json({ error: 'No se pudo comprobar en este momento. Inténtalo de nuevo.' }, { status: 503 })
  const c = claimed.data as { link_id: string; user_id: string } | null
  if (!c) return invalid()

  const undo = async (message: string) => {
    await db.rpc('recovery_link_unclaim', { p_link: c.link_id }) // el enlace vuelve a servir (si no venció) para reintentar
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // 2) palabra secreta nueva (un disparador de la base de datos la guarda como hash; nunca queda en texto legible)
  const word = await db.from('profiles').update({ security_word: newWord }).eq('id', c.user_id)
  if (word.error) return undo('No se pudo guardar la palabra secreta. Inténtalo de nuevo.')

  // 3) contraseña nueva
  const pass = await db.auth.admin.updateUserById(c.user_id, { password: newPassword })
  if (pass.error) return undo('No se pudo cambiar la contraseña. Inténtalo de nuevo.')

  // 4) cerrar las demás sesiones, auditar y limpiar intentos
  await db.rpc('auth_revoke_sessions', { p_user: c.user_id })
  await db.rpc('recovery_link_event', { p_action: 'link_used', p_link: c.link_id, p_target: c.user_id, p_detail: { ip } })
  return NextResponse.json({ success: true })
}
