import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { DEEZER_BUSY, getUserIdFromRequest, tooManyRequests } from '../_shared'

// Buscador de canciones. El navegador no puede hablar directo con Deezer (bloqueo CORS), por eso pasa por aquí.
// La búsqueda pública de Deezer no necesita llave. Solo responde a personas con sesión VÁLIDA.
type DeezerTrack = {
  id: number
  title: string
  duration?: number
  link?: string
  preview?: string
  explicit_lyrics?: boolean
  artist?: { name?: string }
  album?: { cover_medium?: string; cover_small?: string }
}

async function explicitAllowed(): Promise<boolean> {
  try {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data } = await admin.from('app_settings').select('value').eq('key', 'music_allow_explicit').maybeSingle()
    return data?.value === true
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Inicia sesión para buscar música.' }, { status: 401 })
  if (tooManyRequests(userId)) {
    return NextResponse.json({ error: 'Estás buscando muy rápido. Espera un momento.' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim().slice(0, 80)
  const index = Math.max(0, Math.min(Number.parseInt(searchParams.get('index') || '0', 10) || 0, 1000))
  if (q.length < 2) return NextResponse.json({ tracks: [], hasMore: false })

  try {
    const res = await fetch(`https://api.deezer.com/search?limit=25&index=${index}&q=${encodeURIComponent(q)}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return NextResponse.json({ error: DEEZER_BUSY }, { status: 503 })
    const json = (await res.json()) as { data?: DeezerTrack[]; next?: string; error?: { code?: number } }
    // Deezer responde 200 aunque haya un error (por ejemplo, cuota superada)
    if (json.error) return NextResponse.json({ error: DEEZER_BUSY }, { status: 429 })

    const allowExplicit = await explicitAllowed()
    // Deezer a veces devuelve la misma canción dos veces: se deja una sola
    const seen = new Set<number>()
    const tracks = (json.data ?? [])
      .filter((t) => allowExplicit || !t.explicit_lyrics)
      .filter((t) => {
        if (seen.has(t.id)) return false
        seen.add(t.id)
        return true
      })
      .map((t) => ({
        provider: 'deezer' as const,
        id: t.id,
        title: t.title,
        artist: t.artist?.name ?? '',
        cover: t.album?.cover_medium ?? t.album?.cover_small ?? null,
        link: t.link ?? null,
        explicit: !!t.explicit_lyrics,
        duration: t.duration ?? 0,
        hasPreview: !!t.preview,
        preview: t.preview ?? null,
      }))
    // nextIndex = por dónde sigue Deezer. No se puede calcular con los resultados mostrados, porque se
    // ocultan explícitas y repetidas: así "Ver más" no repite ni se salta canciones.
    return NextResponse.json({ tracks, hasMore: !!json.next, nextIndex: index + (json.data?.length ?? 0) })
  } catch {
    return NextResponse.json({ error: DEEZER_BUSY }, { status: 503 })
  }
}
