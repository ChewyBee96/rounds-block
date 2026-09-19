// Savage Rounds — offline-first service worker
// Bump CACHE whenever you edit index.html, or the phone keeps serving the old copy.
const CACHE = "savage-rounds-v1";
const FILES = [
  "./",
  "./index.html"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      // Cache each file on its own so a missing icon never blocks offline mode.
      .then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache first, then quietly refresh in the background.
// The app opens instantly regardless of signal; any update lands on the next launch.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(hit => {
      const fresh = fetch(e.request)
        .then(res => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => null);

      // Serve the cached copy immediately if we have one; otherwise wait on the network.
      return hit || fresh.then(r => r || caches.match("./index.html"));
    })
  );
});
