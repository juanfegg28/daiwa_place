import { RELEASED_CSS } from '../components/cosmetics/kit'

// v1.10.0 · CSS de los cosméticos (keyframes de decoraciones, tarjetas, fondos…) como ARCHIVO propio, ≈102 KB.
// Antes iba en un <style> dentro del HTML de TODAS las páginas (y repetido en los datos de React: ≈226 KB por documento, hasta en /login).
// Ahora es un archivo estático que el navegador guarda un año (la dirección lleva un hash del contenido, ver app/lib/cosmeticsCss.ts):
// se descarga una vez y cada página pesa ≈10 veces menos. Solo incluye lo lanzado, igual que antes.
export const dynamic = 'force-static'

export function GET() {
  return new Response(RELEASED_CSS, {
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
