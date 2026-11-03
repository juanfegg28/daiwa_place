import webpush from 'web-push'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// v1.6.1 · Notificaciones push (lado servidor). Solo lo usan las rutas /api/push/*.

export type PushPayload = {
  kind: 'notification' | 'message' | 'test'
  title: string
  body: string
  /** a dónde lleva al tocar la notificación (ruta dentro de la página) */
  url: string
  /** mismo tag = la notificación nueva reemplaza a la anterior (como WhatsApp con un mismo chat) */
  tag?: string
  ts?: number
}

export function adminClient(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

/** Devuelve false si faltan las claves VAPID en Vercel (entonces no se envía nada). */
export function pushConfigured(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return false
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'https://daiwaplace.vercel.app', pub, priv)
  return true
}

type SubRow = { id: string; endpoint: string; p256dh: string; auth: string }

/** Envía el aviso a TODOS los dispositivos de una persona. Borra los dispositivos que ya no existen. */
export async function sendToUser(admin: SupabaseClient, userId: string, payload: PushPayload): Promise<{ sent: number; removed: number; devices: number }> {
  const { data } = await admin.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', userId)
  const subs = (data as SubRow[] | null) ?? []
  const body = JSON.stringify({ ...payload, ts: payload.ts ?? Date.now() })
  const dead: string[] = []
  let sent = 0
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, {
          TTL: 60 * 60 * 24, // si el celular está apagado, el aviso vive 24 h
          urgency: payload.kind === 'message' ? 'high' : 'normal',
        })
        sent++
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) dead.push(s.id) // el dispositivo desinstaló la app o quitó el permiso
      }
    }),
  )
  if (dead.length) await admin.from('push_subscriptions').delete().in('id', dead)
  if (sent) await admin.from('push_subscriptions').update({ last_used_at: new Date().toISOString() }).eq('user_id', userId)
  return { sent, removed: dead.length, devices: subs.length }
}

/** Saca el usuario de una sesión (cabecera Authorization: Bearer <token>) */
export async function userFromRequest(request: Request): Promise<string | null> {
  const token = (request.headers.get('authorization') || '').replace('Bearer ', '').trim()
  if (!token) return null
  const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data, error } = await supa.auth.getUser(token)
  if (error || !data.user) return null
  return data.user.id
}

// ───────── textos (en español, cortos, como WhatsApp) ─────────
const short = (t: string, n = 120) => {
  const s = t.replace(/\s+/g, ' ').trim()
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

type NotifRow = {
  id: string
  type: string
  actor_id: string | null
  post_id: string | null
  comment_id: string | null
  story_id: string | null
  whisper_id: string | null
  whisper_comment_id: string | null
  club_request_id: string | null
  club_id: string | null
}

/** Texto y enlace de un aviso. En el Muro de los Susurros NUNCA se nombra a nadie (puede ser anónimo). */
export function notificationText(n: NotifRow, actorName: string, recipientUsername: string | null, clubSlug: string | null, actorUsername: string | null): { title: string; body: string; url: string; tag: string } {
  const who = actorName || 'Alguien'
  const post = n.post_id ? `/post/${n.post_id}` : '/'
  const withC = n.comment_id ? `${post}?c=${n.comment_id}` : post
  const whisper = n.whisper_id ? `/susurros/${n.whisper_id}${n.whisper_comment_id ? `?c=${n.whisper_comment_id}` : ''}` : '/susurros'
  const tag = `n-${n.type}-${n.post_id || n.comment_id || n.whisper_id || n.story_id || n.actor_id || n.id}`
  switch (n.type) {
    case 'like_post': return { title: who, body: 'le dio like a tu publicación', url: post, tag }
    case 'like_comment': return { title: who, body: 'le dio like a tu comentario', url: withC, tag }
    case 'comment': return { title: who, body: 'comentó tu publicación', url: withC, tag }
    case 'reply': return { title: who, body: 'respondió tu comentario', url: withC, tag }
    case 'follow': return { title: who, body: 'empezó a seguirte', url: actorUsername ? `/perfil/${actorUsername}` : '/', tag }
    case 'like_note': return { title: who, body: 'le dio like a tu nota', url: '/mensajes', tag }
    case 'like_story': return { title: who, body: 'le dio like a tu historia', url: recipientUsername ? `/historias/${recipientUsername}` : '/', tag }
    case 'mention_story': return { title: who, body: 'te mencionó en su historia', url: actorUsername && n.story_id ? `/historias/${actorUsername}?s=${n.story_id}` : '/notificaciones', tag }
    case 'repost': return { title: who, body: 'compartió tu publicación', url: post, tag }
    case 'mention_post': return { title: who, body: 'te etiquetó en una publicación', url: post, tag }
    case 'mention_comment': return { title: who, body: 'te etiquetó en un comentario', url: withC, tag }
    case 'whisper_comment': return { title: 'Muro de los Susurros', body: 'Alguien comentó tu confesión', url: whisper, tag }
    case 'whisper_reply': return { title: 'Muro de los Susurros', body: 'Alguien respondió tu comentario', url: whisper, tag }
    case 'whisper_mention': return { title: 'Muro de los Susurros', body: 'Alguien te etiquetó en una confesión', url: whisper, tag }
    case 'whisper_comment_mention': return { title: 'Muro de los Susurros', body: 'Alguien te etiquetó en un comentario', url: whisper, tag }
    case 'club_approved': return { title: 'DaiwaPlace', body: 'Tu club fue aprobado 🎉 Toca para configurarlo', url: n.club_request_id ? `/clubes/configurar/${n.club_request_id}` : '/clubes', tag }
    case 'club_declined': return { title: 'DaiwaPlace', body: 'Tu solicitud de club no fue aprobada', url: '/clubes', tag }
    case 'club_join_request': return { title: who, body: 'quiere unirse a tu club', url: clubSlug ? `/clubes/${clubSlug}` : '/clubes', tag }
    case 'club_join_accepted': return { title: 'DaiwaPlace', body: 'Te aceptaron en un club 🎉', url: clubSlug ? `/clubes/${clubSlug}` : '/clubes', tag }
    default: return { title: 'DaiwaPlace', body: 'Tienes un aviso nuevo', url: '/notificaciones', tag }
  }
}

export function messagePreview(m: { content: string | null; image_path: string | null }, show: boolean): string {
  if (!show) return 'Te envió un mensaje'
  if (m.image_path) return m.content?.trim() ? `📷 ${short(m.content, 100)}` : '📷 Foto'
  const c = (m.content || '').trim()
  if (!c) return 'Te envió un mensaje'
  return short(c, 140)
}
