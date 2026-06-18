import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Précache tous les assets buildés (Workbox injecte la liste ici)
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Network-first pour Supabase (données live)
registerRoute(
  ({ url }) => url.hostname.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'supabase-api',
    networkTimeoutSeconds: 10,
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 300 })],
  })
)

// Cache-first pour Google Fonts
registerRoute(
  ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 31_536_000 })],
  })
)

// ── Push notifications ────────────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return
  const { title, body, url } = event.data.json()
  event.waitUntil(
    self.registration.showNotification(title ?? 'APO', {
      body:      body ?? '',
      icon:      '/icons/icon-192.png',
      badge:     '/icons/icon-192.png',
      tag:       'apo-daily',
      renotify:  true,
      vibrate:   [200, 100, 200],
      data:      { url: url ?? '/' },
    })
  )
})

// Clic sur la notification → ouvre / focus l'app
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        const w = list.find(c => c.url.startsWith(self.location.origin))
        return w ? w.focus() : clients.openWindow(url)
      })
  )
})
