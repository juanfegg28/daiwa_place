import { NextResponse } from 'next/server'
import { DEEZER_BUSY, getUserIdFromRequest, tooManyRequests } from '../_shared'

// Devuelve el fragmento de audio (30 s) FRESCO de una canción: los enlaces de Deezer caducan,
// por eso no se guardan en la base de datos y se piden justo al darle play.
export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 })
  if (tooManyRequests(userId, 80)) return NextResponse.json({ error: 'Muchas peticiones.' }, { status: 429 })

  const id = new URL(request.url).searchParams.get('id') || ''
  if (!/^[0-9]{1,12}$/.test(id)) return NextResponse.json({ error: 'Canción no válida.' }, { status: 400 })

  try {
    const res = await fetch(`https://api.deezer.com/track/${id}`, { cache: 'no-store' })
    if (!res.ok) return NextResponse.json({ error: DEEZER_BUSY }, { status: 503 })
    const json = (await res.json()) as { preview?: string; error?: unknown }
    if (json.error) return NextResponse.json({ error: 'Esta canción ya no está disponible.' }, { status: 404 })
    return NextResponse.json({ preview: json.preview || null })
  } catch {
    return NextResponse.json({ error: DEEZER_BUSY }, { status: 503 })
  }
}
