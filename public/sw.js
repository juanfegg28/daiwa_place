/* DaiwaPlace · service worker (v1.5.11)
 * Hace dos cosas, nada más:
 *   1) Guarda lo que NO cambia (código con hash, fuentes, íconos) para que la app abra más rápido.
 *   2) Si no hay internet, muestra una pantalla de «sin conexión» en vez del error del navegador.
 * NO guarda páginas, publicaciones, mensajes ni nada que venga de Supabase: lo tuyo siempre se pide al servidor, así que
 * nunca verás datos viejos ni de otra persona. */
const VERSION = 'v1.5.11'
const CACHE = `daiwa-static-${VERSION}`
const PRECACHE = ['/offline.html', '/icons/icon-192.png', '/brand-moon.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('daiwa-static-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // Supabase, fuentes de Google, etc.: no se tocan
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.well-known/') || url.pathname.endsWith('.apk') || url.pathname === '/sw.js') return

  // Páginas: siempre de internet; sin conexión, la pantalla de «sin conexión»
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/offline.html')))
    return
  }

  // Código con hash, fuentes e íconos (no cambian): primero lo guardado
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/fonts/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(CACHE).then((c) => c.put(req, copy))
            }
            return res
          }),
      ),
    )
  }
})
