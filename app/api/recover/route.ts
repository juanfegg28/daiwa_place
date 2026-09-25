import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { username, securityWord, newPassword } = await request.json()

  const cleanUsername = username.trim().toLowerCase()
  const cleanSecurityWord = securityWord.trim().toLowerCase()

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, security_word')
    .eq('username', cleanUsername)
    .maybeSingle()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 400 })
  }

  if (!profile.security_word || profile.security_word.trim().toLowerCase() !== cleanSecurityWord) {
    return NextResponse.json({ error: 'La palabra secreta no coincide' }, { status: 400 })
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
    password: newPassword,
  })

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}