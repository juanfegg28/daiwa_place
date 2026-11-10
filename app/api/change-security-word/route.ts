import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Cambia la palabra secreta verificando primero la contraseña actual
// (equivalente a /api/recover pero al revés: aquí se confirma con contraseña,
// allá se confirma con la palabra secreta).
// v1.9.0: la palabra nueva nunca queda en texto legible (un disparador de Supabase la convierte en hash al guardarla),
// y la contraseña actual no se puede adivinar probando sin parar (límite de intentos).
const MAX_FAILS_PER_USER = 8 // cada 15 minutos
const MAX_FAILS_PER_IP = 25 // cada hora

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
    return NextResponse.json({ error: 'Solicitud no válida' }, { status: 400 })
  }
  const { username, password, newSecurityWord } = (body ?? {}) as Record<string, unknown>
  if (typeof username !== 'string' || typeof password !== 'string' || typeof newSecurityWord !== 'string') {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const cleanUsername = username.trim().toLowerCase().slice(0, 40)
  const cleanNewWord = newSecurityWord.trim()

  if (!cleanUsername || !password || !cleanNewWord) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }
  if (cleanNewWord.length < 4 || cleanNewWord.length > 100) {
    return NextResponse.json({ error: 'La palabra secreta debe tener entre 4 y 100 caracteres' }, { status: 400 })
  }

  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const marker = `pw:${cleanUsername}` // misma tabla de intentos que la recuperación, con otra marca
  const ip = clientIp(request)
  const now = Date.now()
  const [{ count: userFails }, { count: ipFails }] = await Promise.all([
    supabaseAdmin.from('recovery_attempts').select('id', { count: 'exact', head: true }).eq('username', marker).gte('created_at', new Date(now - 15 * 60 * 1000).toISOString()),
    supabaseAdmin.from('recovery_attempts').select('id', { count: 'exact', head: true }).eq('ip', ip).like('username', 'pw:%').gte('created_at', new Date(now - 60 * 60 * 1000).toISOString()),
  ])
  if ((userFails ?? 0) >= MAX_FAILS_PER_USER || (ipFails ?? 0) >= MAX_FAILS_PER_IP) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera unos 15 minutos antes de volver a intentarlo.' }, { status: 429 })
  }

  const supabaseAnon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const fakeEmail = `${cleanUsername}@gmail.com`
  const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
    email: fakeEmail,
    password,
  })

  if (signInError || !signInData.user) {
    await supabaseAdmin.from('recovery_attempts').insert({ username: marker, ip })
    return NextResponse.json({ error: 'La contraseña actual no es correcta' }, { status: 400 })
  }

  const { error: updateError } = await supabaseAdmin.from('profiles').update({ security_word: cleanNewWord }).eq('id', signInData.user.id)

  if (updateError) {
    return NextResponse.json({ error: 'No se pudo guardar la palabra secreta. Inténtalo de nuevo.' }, { status: 400 })
  }

  await supabaseAdmin.from('recovery_attempts').delete().eq('username', marker)
  return NextResponse.json({ success: true })
}
