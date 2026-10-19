import { NextResponse } from 'next/server'
import { getUserIdFromRequest, tooManyRequests } from '../../music/_shared'

// «Usar mi ubicación actual» del sticker de ubicación (v1.2.0).
// Recibe coordenadas, las manda a un geocodificador inverso y devuelve ÚNICAMENTE el nombre del lugar
// (barrio, localidad o ciudad), nunca la calle ni el número. NO se guardan ni se registran coordenadas.
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 })
  if (tooManyRequests(userId, 8)) return NextResponse.json({ error: 'Muchas peticiones. Espera un momento.' }, { status: 429 })

  const sp = new URL(request.url).searchParams
  const lat = Number(sp.get('lat'))
  const lon = Number(sp.get('lon'))
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: 'Ubicación no válida.' }, { status: 400 })
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&addressdetails=1&accept-language=es&lat=${lat.toFixed(3)}&lon=${lon.toFixed(3)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'DaiwaPlace/1.2 (red social escolar)' }, cache: 'no-store' })
    if (!res.ok) return NextResponse.json({ error: 'No se pudo averiguar el lugar. Escríbelo a mano.' }, { status: 503 })
    const json = (await res.json()) as { address?: Record<string, string> }
    const a = json.address ?? {}
    const label = a.suburb || a.neighbourhood || a.city_district || a.quarter || a.city || a.town || a.village || a.municipality || a.county || ''
    if (!label) return NextResponse.json({ error: 'No se pudo averiguar el lugar. Escríbelo a mano.' }, { status: 404 })
    return NextResponse.json({ label: label.slice(0, 40) })
  } catch {
    return NextResponse.json({ error: 'No se pudo averiguar el lugar. Escríbelo a mano.' }, { status: 503 })
  }
}
