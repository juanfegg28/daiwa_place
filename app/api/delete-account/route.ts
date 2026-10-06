import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const SUPREME_ADMIN_USERNAMES = ['renshsh', 'are_you_rena']

// Elimina una cuenta para siempre: perfil, publicaciones, comentarios, likes,
// follows, bloqueos, reportes, notificaciones, mensajes directos, notas, roles asignados y archivos guardados (avatar,
// banner, fotos de publicaciones), y por último el usuario de autenticación.
//
// Sin "targetUserId" en el body: la persona borra SU PROPIA cuenta (Configuración).
// Con "targetUserId": es la Eliminación Maestra del Centro de Mando — solo
// funciona si quien llama es Admin Supremo, verificado contra su propia sesión.
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '').trim()
  const body = await request.json().catch(() => ({}))
  const requestedTargetId: string | undefined = body?.targetUserId

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
  const callerId = userData.user.id

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let userId = callerId

  if (requestedTargetId && requestedTargetId !== callerId) {
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('id', callerId)
      .maybeSingle()
    const isSupreme = !!callerProfile?.username && SUPREME_ADMIN_USERNAMES.includes(callerProfile.username.toLowerCase())
    if (!isSupreme) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar cuentas de otras personas' }, { status: 403 })
    }
    userId = requestedTargetId
  }

  await supabaseAdmin.from('notifications').delete().or(`recipient_id.eq.${userId},actor_id.eq.${userId}`)
  // mensajes directos: al borrar la conversación se van sus mensajes, reacciones y apodos; también notas y sus likes
  // Muro de los Susurros: se borran sus confesiones (con sus comentarios y votos) y sus comentarios
  const { data: myWhispers } = await supabaseAdmin.from('whisper_authors').select('whisper_id').eq('user_id', userId)
  const whisperIds = (myWhispers ?? []).map((r: { whisper_id: string }) => r.whisper_id)
  if (whisperIds.length > 0) await supabaseAdmin.from('whispers').delete().in('id', whisperIds)
  const { data: myComments } = await supabaseAdmin.from('whisper_comment_authors').select('comment_id').eq('user_id', userId)
  const commentIds = (myComments ?? []).map((r: { comment_id: string }) => r.comment_id)
  if (commentIds.length > 0) await supabaseAdmin.from('whisper_comments').delete().in('id', commentIds)
  await supabaseAdmin.from('whisper_votes').delete().eq('user_id', userId)
  await supabaseAdmin.from('whisper_reports').delete().eq('reporter_id', userId)
  await supabaseAdmin.from('note_likes').delete().eq('user_id', userId)
  await supabaseAdmin.from('notes').delete().eq('user_id', userId)
  await supabaseAdmin.from('message_reactions').delete().eq('user_id', userId)
  await supabaseAdmin.from('conversations').delete().or(`user_a.eq.${userId},user_b.eq.${userId}`)
  await supabaseAdmin.from('user_roles').delete().or(`user_id.eq.${userId}`)
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
