// Service Worker pour Silvenger

const CACHE_NAME = "silvenger-cache-v1"
const OFFLINE_URL = "/offline.html"

// Installation du service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/offline.html",
        "/favicon.ico",
        // Ajoutez ici d'autres ressources statiques importantes
      ])
    }),
  )
})

// Activation et nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME
          })
          .map((cacheName) => {
            return caches.delete(cacheName)
          }),
      )
    }),
  )
})

// Stratégie de mise en cache: Network first, falling back to cache
self.addEventListener("fetch", (event) => {
  // Ignorer les requêtes non GET
  if (event.request.method !== "GET") return

  // Ignorer les requêtes d'API (Supabase)
  if (event.request.url.includes("/rest/v1/") || event.request.url.includes("/auth/v1/")) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache la réponse fraîche
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone)
        })
        return response
      })
      .catch(() => {
        // Si la requête échoue, essayer de servir depuis le cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response
          }
          // Si la ressource n'est pas dans le cache, servir la page hors ligne
          if (event.request.headers.get("Accept").includes("text/html")) {
            return caches.match(OFFLINE_URL)
          }
          // Pour les autres ressources, retourner une erreur
          return new Response("Ressource non disponible hors ligne", {
            status: 503,
            statusText: "Service Unavailable",
          })
        })
      }),
  )
})

// Gestion des notifications push
self.addEventListener("push", (event) => {
  const data = event.data.json()

  const options = {
    body: data.body,
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    data: {
      url: data.url,
    },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Gestion des clics sur les notifications
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url))
  }
})

// Synchronisation en arrière-plan
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-messages") {
    event.waitUntil(syncMessages())
  }
})

// Fonction pour synchroniser les messages
async function syncMessages() {
  // Cette fonction serait implémentée pour synchroniser les messages
  // stockés localement avec le serveur
  console.log("Synchronisation des messages en arrière-plan")
}
