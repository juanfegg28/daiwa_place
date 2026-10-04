import { NextResponse } from 'next/server'

// Buscador de canciones (primeros pasos de la integración con Deezer).
// El navegador no puede hablar directo con la API de Deezer (bloqueo CORS), por eso pasa por aquí.
// La búsqueda pública de Deezer no necesita llave. Solo responde a personas con sesión iniciada
// para que nadie use el servidor de DaiwaPlace como puente gratis.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return NextResponse.json({ error: 'Inicia sesión' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim().slice(0, 80)
  if (q.length < 2) return NextResponse.json({ tracks: [] })

  try {
    const res = await fetch(`https://api.deezer.com/search?limit=10&q=${encodeURIComponent(q)}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return NextResponse.json({ tracks: [] })
    const json = (await res.json()) as {
      data?: {
        id: number
        title: string
        link?: string
        preview?: string
        artist?: { name?: string }
        album?: { cover_small?: string }
      }[]
    }
    const tracks = (json.data ?? []).map((t) => ({
      provider: 'deezer',
      id: t.id,
      title: t.title,
      artist: t.artist?.name ?? '',
      cover: t.album?.cover_small ?? null,
      preview: t.preview ?? null,
      link: t.link ?? null,
    }))
    return NextResponse.json({ tracks })
  } catch {
    return NextResponse.json({ tracks: [] })
  }
}
