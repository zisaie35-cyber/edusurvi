// public/sw.js — Service Worker EduSuivi PWA
const CACHE_NAME = 'edusurvi-v1'
const CACHE_URLS = [
  '/',
  '/login',
  '/dashboard',
  '/parents',
  '/manifest.json',
]

// Installation : mise en cache des ressources statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_URLS)
    })
  )
  self.skipWaiting()
})

// Activation : suppression des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    })
  )
  self.clients.claim()
})

// Fetch : stratégie network-first avec fallback cache
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes API
  if (event.request.url.includes('/api/')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache les réponses valides
        if (response && response.status === 200) {
          const cloned = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned))
        }
        return response
      })
      .catch(() => {
        // Fallback sur le cache si hors ligne
        return caches.match(event.request).then(cached => {
          if (cached) return cached
          // Page hors ligne par défaut
          if (event.request.mode === 'navigate') {
            return caches.match('/')
          }
        })
      })
  )
})

// Notifications Push (pour alertes devoirs)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const title = data.title || 'EduSuivi'
  const options = {
    body: data.body || 'Vous avez une notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: data.url || '/dashboard' },
    actions: [
      { action: 'voir', title: 'Voir', icon: '/icons/icon-72x72.png' },
      { action: 'fermer', title: 'Fermer' }
    ]
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Clic sur notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'voir' || !event.action) {
    const url = event.notification.data?.url || '/'
    event.waitUntil(clients.openWindow(url))
  }
})
