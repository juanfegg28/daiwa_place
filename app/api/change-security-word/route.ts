import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Cambia la palabra secreta verificando primero la contraseña actual
// (equivalente a /api/recover pero al revés: aquí se confirma con contraseña,
// allá se confirma con la palabra secreta).
export async function POST(request: Request) {
  const { username, password, newSecurityWord } = await request.json()

  const cleanUsername = (username ?? '').trim().toLowerCase()
  const cleanNewWord = (newSecurityWord ?? '').trim()

  if (!cleanUsername || !password || !cleanNewWord) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fakeEmail = `${cleanUsername}@gmail.com`
  const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
    email: fakeEmail,
    password,
  })

  if (signInError || !signInData.user) {
    return NextResponse.json({ error: 'La contraseña actual no es correcta' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ security_word: cleanNewWord })
    .eq('id', signInData.user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
