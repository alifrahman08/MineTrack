// MineTrack Service Worker (PWA Offline Support)
const CACHE_NAME = "minetrack-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/login",
  "/manifest.json",
  "/favicon.ico"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests and skip API / Auth endpoints from disk caching
  if (event.request.method !== "GET" || event.request.url.includes("/api/auth/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for navigation and static assets
        if (response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If HTML page request, return login/fallback
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/login");
          }
          return new Response("Offline: Koneksi jaringan terputus. Data akan disinkronkan saat terhubung kembali.", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({ "Content-Type": "text/plain; charset=utf-8" })
          });
        });
      })
  );
});
