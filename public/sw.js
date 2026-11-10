/* DaiwaPlace · service worker (v1.7.2)
 * Hace dos cosas, nada más:
 *   1) Guarda lo que NO cambia (código con hash, fuentes, íconos) para que la app abra más rápido.
 *   2) Si no hay internet, muestra una pantalla de «sin conexión» en vez del error del navegador.
 * NO guarda páginas, publicaciones, mensajes ni nada que venga de Supabase: lo tuyo siempre se pide al servidor, así que
 * nunca verás datos viejos ni de otra persona.
 *   3) (v1.6.1) Muestra las NOTIFICACIONES push (mensajes y avisos) aunque la app esté cerrada, y las abre al tocarlas. */
const VERSION = 'v1.9.0'
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

// ───────── Notificaciones push (v1.6.1) ─────────
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { title: 'DaiwaPlace', body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    (async () => {
      // Como WhatsApp: si estás dentro de la app mirándola, no suena ni aparece (ya lo ves en pantalla)
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      if (data.kind !== 'test' && wins.some((w) => w.visibilityState === 'visible')) return
      await self.registration.showNotification(data.title || 'DaiwaPlace', {
        body: data.body || '',
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-96.png',
        tag: data.tag || undefined,
        renotify: !!data.tag, // un mensaje nuevo en el mismo chat vuelve a sonar
        timestamp: data.ts || Date.now(),
        lang: 'es',
        data: { url: data.url || '/' },
      })
    })(),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href
  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const w of wins) {
        if (new URL(w.url).origin === self.location.origin) {
          try {
            await w.focus()
            if ('navigate' in w) await w.navigate(url)
            return
          } catch (e) {
            /* si no se puede reusar la ventana, se abre una nueva */
          }
        }
      }
      await self.clients.openWindow(url)
    })(),
  )
})
