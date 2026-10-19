import { NextResponse } from 'next/server'
import { DEEZER_BUSY, getUserIdFromRequest, tooManyRequests } from '../_shared'

// Retransmite el fragmento de audio (30 s) de una canción de Deezer desde NUESTRO dominio (v1.2.0).
// Se usa en el visor de historias en iPhone/Safari, donde el volumen solo se puede mover con Web Audio y
// Web Audio exige que el audio venga del mismo dominio (o con CORS). Pide el enlace fresco a Deezer en cada vez.
export const dynamic = 'force-dynamic'

function allowedPreviewHost(url: URL) {
  const h = url.hostname.toLowerCase()
  return url.protocol === 'https:' && (h.endsWith('.dzcdn.net') || h.endsWith('.deezer.com') || h === 'dzcdn.net' || h === 'deezer.com')
}

export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 })
  if (tooManyRequests(userId, 60)) return NextResponse.json({ error: 'Muchas peticiones.' }, { status: 429 })

  const id = new URL(request.url).searchParams.get('id') || ''
  if (!/^[0-9]{1,12}$/.test(id)) return NextResponse.json({ error: 'Canción no válida.' }, { status: 400 })

  try {
    const meta = await fetch(`https://api.deezer.com/track/${id}`, { cache: 'no-store' })
    if (!meta.ok) return NextResponse.json({ error: DEEZER_BUSY }, { status: 503 })
    const json = (await meta.json()) as { preview?: string; error?: unknown }
    if (json.error || !json.preview) return NextResponse.json({ error: 'Esta canción no tiene fragmento de audio.' }, { status: 404 })

    const previewUrl = new URL(json.preview)
    if (!allowedPreviewHost(previewUrl)) return NextResponse.json({ error: 'Audio no válido.' }, { status: 502 })

    const range = request.headers.get('range')
    const upstream = await fetch(previewUrl.toString(), { headers: range ? { Range: range } : undefined, cache: 'no-store' })
    if (!upstream.ok && upstream.status !== 206) return NextResponse.json({ error: DEEZER_BUSY }, { status: 503 })

    const headers = new Headers({
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'private, max-age=300',
      'Accept-Ranges': 'bytes',
    })
    const len = upstream.headers.get('content-length')
    const cr = upstream.headers.get('content-range')
    if (len) headers.set('Content-Length', len)
    if (cr) headers.set('Content-Range', cr)
    return new Response(upstream.body, { status: upstream.status, headers })
  } catch {
    return NextResponse.json({ error: DEEZER_BUSY }, { status: 503 })
  }
}
