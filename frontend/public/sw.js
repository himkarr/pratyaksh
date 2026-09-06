/**
 * eSAKSHI MPLADS Portal — Progressive Web App Service Worker
 * --------------------------------------------------------
 * Caches static application shell resources for offline resilience.
 * Explicitly excludes backend API requests (/api/, /auth/, /predict/) from persistent caching
 * to ensure sensitive government records are never stored insecurely.
 */

const CACHE_NAME = "esakshi-pwa-shell-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/assets/parliament_hero.png",
  "/assets/parliament_aerial.png"
];

// Install Event: Cache static shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Cleanup stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-first for dynamic API, Cache-first for static shell assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Exclude API requests & sensitive data endpoints from cache
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/auth") || url.port === "8000" || url.port === "8001") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: "Network Unavailable", offline: true }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  // Network-first strategy for HTML pages, cache-first for static media/CSS
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse.status === 200 &&
          event.request.method === "GET" &&
          (url.pathname.endsWith(".js") || url.pathname.endsWith(".css") || url.pathname.endsWith(".png"))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback to offline root page
        return caches.match("/");
      });
    })
  );
});
