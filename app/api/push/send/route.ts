import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { adminClient, messagePreview, notificationText, pushConfigured, sendToUser } from '../../../lib/pushServer'

// v1.6.1 · La llama la BASE DE DATOS (un trigger con pg_net) cada vez que nace un aviso o un mensaje.
// Cabecera obligatoria:  x-push-secret: <PUSH_WEBHOOK_SECRET>   ·   body: { kind: 'notification' | 'message', id: '<uuid>' }
// Respeta lo que cada persona ajustó en Configuración → Notificaciones. Nunca devuelve datos de nadie.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const same = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}
const UUID = /^[0-9a-f-]{36}$/i

export async function POST(request: Request) {
  const secret = process.env.PUSH_WEBHOOK_SECRET
  const given = request.headers.get('x-push-secret') || ''
  if (!secret || !same(given, secret)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!pushConfigured()) return NextResponse.json({ error: 'Faltan las claves VAPID en Vercel' }, { status: 500 })

  const body = (await request.json().catch(() => ({}))) as { kind?: string; id?: string }
  if (!body.id || !UUID.test(body.id)) return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 })

  const admin = adminClient()

  // ───── un aviso (likes, comentarios, seguidores, clubes, Muro…) ─────
  if (body.kind === 'notification') {
    const { data: n } = await admin.from('notifications').select('id, type, recipient_id, actor_id, post_id, comment_id, story_id, whisper_id, whisper_comment_id, club_request_id, club_id').eq('id', body.id).maybeSingle()
    if (!n) return NextResponse.json({ ok: true, skipped: 'sin aviso' })
    const { data: me } = await admin.from('profiles').select('username, notif_prefs').eq('id', n.recipient_id).maybeSingle()
    if ((me?.notif_prefs as Record<string, unknown> | null)?.push === false) return NextResponse.json({ ok: true, skipped: 'apagó el celular' })
    let actorName = ''
    let actorUsername: string | null = null
    if (n.actor_id) {
      const { data: a } = await admin.from('profiles').select('id_student, username').eq('id', n.actor_id).maybeSingle()
      actorName = a?.id_student || a?.username || ''
      actorUsername = a?.username ?? null
    }
    let clubSlug: string | null = null
    if (n.club_id) {
      const { data: c } = await admin.from('clubs').select('slug').eq('id', n.club_id).maybeSingle()
      clubSlug = c?.slug ?? null
    }
    // v1.9.0 · los avisos de eventos traen el título del evento (se pide aparte: así esta ruta sigue funcionando aunque falte el SQL nuevo)
    const enriched: typeof n & { event_id?: string | null; event_title?: string | null } = { ...n }
    if (n.type === 'event_new' || n.type === 'event_reminder') {
      const { data: link } = await admin.from('notifications').select('event_id').eq('id', n.id).maybeSingle()
      enriched.event_id = (link as { event_id?: string | null } | null)?.event_id ?? null
      if (enriched.event_id) {
        const { data: ev } = await admin.from('events').select('title').eq('id', enriched.event_id).maybeSingle()
        enriched.event_title = (ev as { title?: string } | null)?.title ?? null
      }
    }
    const t = notificationText(enriched, actorName, me?.username ?? null, clubSlug, actorUsername)
    const r = await sendToUser(admin, n.recipient_id, { kind: 'notification', ...t })
    return NextResponse.json({ ok: true, ...r })
  }

  // ───── un mensaje directo (como WhatsApp) ─────
  if (body.kind === 'message') {
    const { data: m } = await admin.from('messages').select('id, conversation_id, sender_id, content, image_path, deleted_at').eq('id', body.id).maybeSingle()
    if (!m || m.deleted_at) return NextResponse.json({ ok: true, skipped: 'sin mensaje' })
    const { data: c } = await admin.from('conversations').select('user_a, user_b, status').eq('id', m.conversation_id).maybeSingle()
    if (!c || c.status === 'declined') return NextResponse.json({ ok: true, skipped: 'conversación no válida' })
    const to = c.user_a === m.sender_id ? c.user_b : c.user_a
    const { data: blocked } = await admin.from('blocks').select('blocker_id').or(`and(blocker_id.eq.${to},blocked_id.eq.${m.sender_id}),and(blocker_id.eq.${m.sender_id},blocked_id.eq.${to})`).limit(1)
    if (blocked && blocked.length) return NextResponse.json({ ok: true, skipped: 'bloqueo' })
    const { data: me } = await admin.from('profiles').select('notif_prefs').eq('id', to).maybeSingle()
    const prefs = (me?.notif_prefs as Record<string, unknown> | null) ?? {}
    if (prefs.push === false || prefs.dm === false) return NextResponse.json({ ok: true, skipped: 'apagó los mensajes' })
    const { data: s } = await admin.from('profiles').select('id_student, username').eq('id', m.sender_id).maybeSingle()
    const name = s?.id_student || s?.username || 'DaiwaPlace'
    const pending = c.status === 'pending'
    const r = await sendToUser(admin, to, {
      kind: 'message',
      title: name,
      body: pending ? 'Quiere enviarte un mensaje' : messagePreview(m, prefs.push_preview !== false),
      url: `/mensajes/${m.conversation_id}`,
      tag: `dm-${m.conversation_id}`,
    })
    return NextResponse.json({ ok: true, ...r })
  }

  return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 })
}
