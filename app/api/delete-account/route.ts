import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Elimina la cuenta para siempre: perfil, publicaciones, comentarios, likes,
// follows, bloqueos, reportes y archivos guardados (avatar, banner, fotos de
// publicaciones), y por último el usuario de autenticación.
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '').trim()

  if (!token) {
    return NextResponse.json({ error: 'No se encontró tu sesión, vuelve a iniciar sesión' }, { status: 401 })
  }

  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token)
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Tu sesión no es válida, vuelve a iniciar sesión' }, { status: 401 })
  }
  const userId = userData.user.id

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabaseAdmin.from('comment_likes').delete().eq('user_id', userId)
  await supabaseAdmin.from('likes').delete().eq('user_id', userId)
  await supabaseAdmin.from('comments').delete().eq('user_id', userId)
  await supabaseAdmin.from('posts').delete().eq('user_id', userId)
  await supabaseAdmin.from('follows').delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`)
  await supabaseAdmin.from('blocks').delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)
  await supabaseAdmin.from('reports').delete().or(`reporter_id.eq.${userId},reported_user_id.eq.${userId}`)

  const { data: avatarFiles } = await supabaseAdmin.storage.from('avatars').list(userId)
  if (avatarFiles && avatarFiles.length > 0) {
    await supabaseAdmin.storage.from('avatars').remove(avatarFiles.map((f) => `${userId}/${f.name}`))
  }
  const { data: postImageFiles } = await supabaseAdmin.storage.from('post-images').list(userId)
  if (postImageFiles && postImageFiles.length > 0) {
    await supabaseAdmin.storage.from('post-images').remove(postImageFiles.map((f) => `${userId}/${f.name}`))
  }

  await supabaseAdmin.from('profiles').delete().eq('id', userId)

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
