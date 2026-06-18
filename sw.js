/* Yamanote Line PWA — offline app shell */
// Bump CACHE on every deploy. The fetch handler is cache-first, so the cached
// index.html (which has no query string to bust it) is only refreshed when the
// cache name changes — leave it stale and returning visitors keep loading an
// old app shell that points at outdated JS. Keep the ?v= versions below in
// sync with index.html so the precache stores the assets that shell requests.
const CACHE = "yamanote-v44";
const ASSETS = [
  "index.html",
  "css/styles.css?v=39",
  "js/stations.js?v=33",
  "js/app.js?v=53",
  "manifest.webmanifest",
  "icons/icon-192-0.3.png",
  "icons/icon-512-0.3.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // cache-first for the app shell, network fallback (and cache new GETs)
  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit)
    )
  );
});
