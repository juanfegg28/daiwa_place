import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Recuperar la cuenta con la palabra secreta.
// Protecciones (v0.13.5):
//  · Límite de intentos: la palabra secreta no se puede adivinar probando una y otra vez.
//  · Un solo mensaje de error: no se puede averiguar qué usuarios existen.
//  · Se valida lo que llega (antes, si faltaba un dato la ruta se caía con error 500).
const MAX_FAILS_PER_USER = 5 // por usuario, cada 15 minutos
const MAX_FAILS_PER_IP = 15 // por conexión, cada hora
const GENERIC_ERROR = 'Usuario o palabra secreta incorrectos.'
const TOO_MANY = 'Demasiados intentos. Espera unos 15 minutos antes de volver a intentarlo.'

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip')?.trim() || 'desconocida'
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 })
  }
  const { username, securityWord, newPassword } = (body ?? {}) as Record<string, unknown>
  if (typeof username !== 'string' || typeof securityWord !== 'string' || typeof newPassword !== 'string') {
    return NextResponse.json({ error: 'Completa todos los campos.' }, { status: 400 })
  }
  if (newPassword.length < 6 || newPassword.length > 72) {
    return NextResponse.json({ error: 'La contraseña nueva debe tener entre 6 y 72 caracteres.' }, { status: 400 })
  }

  const cleanUsername = username.trim().toLowerCase().slice(0, 40)
  const cleanSecurityWord = securityWord.trim().toLowerCase()
  if (!cleanUsername || !cleanSecurityWord) {
    return NextResponse.json({ error: 'Completa todos los campos.' }, { status: 400 })
  }

  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const ip = clientIp(request)
  const now = Date.now()
  const since15 = new Date(now - 15 * 60 * 1000).toISOString()
  const since60 = new Date(now - 60 * 60 * 1000).toISOString()

  // ¿Ya se pasó de intentos fallidos? Si la tabla todavía no existe (falta el SQL), se sigue sin límite en vez de romper.
  const [{ count: userFails }, { count: ipFails }] = await Promise.all([
    supabaseAdmin
      .from('recovery_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('username', cleanUsername)
      .gte('created_at', since15),
    supabaseAdmin.from('recovery_attempts').select('id', { count: 'exact', head: true }).eq('ip', ip).gte('created_at', since60),
  ])
  if ((userFails ?? 0) >= MAX_FAILS_PER_USER || (ipFails ?? 0) >= MAX_FAILS_PER_IP) {
    return NextResponse.json({ error: TOO_MANY }, { status: 429 })
  }

  const fail = async () => {
    await supabaseAdmin.from('recovery_attempts').insert({ username: cleanUsername, ip })
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 })
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, security_word')
    .eq('username', cleanUsername)
    .maybeSingle()

  // Mismo mensaje y mismo registro de intento si el usuario no existe o la palabra no coincide
  if (profileError || !profile) return fail()
  if (!profile.security_word || profile.security_word.trim().toLowerCase() !== cleanSecurityWord) return fail()

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, { password: newPassword })
  if (updateError) {
    return NextResponse.json({ error: 'No se pudo cambiar la contraseña. Inténtalo de nuevo.' }, { status: 400 })
  }

  // Acierto: se limpian los intentos fallidos de este usuario
  await supabaseAdmin.from('recovery_attempts').delete().eq('username', cleanUsername)
  return NextResponse.json({ success: true })
}
