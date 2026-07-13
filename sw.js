/* Yamanote Line PWA — offline app shell */
// Bump CACHE on every deploy. The fetch handler is cache-first, so the cached
// index.html (which has no query string to bust it) is only refreshed when the
// cache name changes — leave it stale and returning visitors keep loading an
// old app shell that points at outdated JS. Keep the ?v= versions below in
// sync with index.html so the precache stores the assets that shell requests.
const CACHE = "yamanote-v68";
const ASSETS = [
  "index.html",
  "css/styles.css?v=51",
  "js/stations.js?v=33",
  "js/app.js?v=65",
  "js/pwa-install.js?v=3",
  "js/analytics.js?v=2",
  "manifest.webmanifest",
  "icons/icon-192-0.3.png",
  "icons/icon-512-0.3.png",
];

// Separate, user-driven cache for the full station audio files (opus/m4a),
// populated on demand by the "Offline playback" control in the info modal
// (see js/app.js). Keep this name in sync with OFFLINE_CACHE there. It must
// survive app-shell updates, so it's exempt from the CACHE cleanup below.
const OFFLINE_CACHE = "yamanote-audio-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k !== OFFLINE_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  // Cross-origin audio (R2 via the Worker): normally passed straight through
  // untouched — it's range-streamed and opaque under no-cors, so caching it
  // naively would replay a stale partial (e.g. Safari's 2-byte bytes=0-1
  // probe) for every later Range request. R2/Cloudflare already handle Range
  // + caching for those files. The one exception is a file the user has
  // explicitly downloaded into OFFLINE_CACHE (a full, non-Range GET) — for
  // those we serve straight from the cache, slicing Range requests by hand
  // since the Cache API itself ignores Range and would return the wrong bytes.
  if (new URL(req.url).origin !== self.location.origin) {
    e.respondWith(offlineAudioOrNetwork(req));
    return;
  }

  // Belt-and-braces: don't intercept Range requests even same-origin — the Cache
  // API matches by URL and ignores Range, so it would hand back the wrong bytes.
  if (req.headers.has("range")) return;

  // cache-first for the app shell, network fallback (and cache new GETs).
  // Navigations to station deep links (e.g. /jy13-inner) aren't cached under
  // their own URL — online they're rewritten to the shell by Netlify, and
  // offline they fall back to the cached index.html so the client-side router
  // can still position onto the shared station. We don't cache navigation
  // responses (they're all the shell) to avoid 60 duplicate copies piling up.
  const isNav = req.mode === "navigate";
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (!isNav) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit || (isNav ? caches.match("index.html") : undefined));
    })
  );
});

async function offlineAudioOrNetwork(req) {
  const cache = await caches.open(OFFLINE_CACHE);
  const cached = await cache.match(req.url);
  if (!cached) return fetch(req);   // not downloaded — untouched passthrough

  const range = req.headers.get("range");
  if (!range) return cached.clone();

  // Hand-roll a 206 Partial Content from the fully-cached file. <audio>
  // issues real Range requests for seeking (and Safari probes with
  // "bytes=0-1" before anything else), so this has to behave like a real
  // range-serving endpoint, not just hand back the whole body.
  const buf = await cached.clone().arrayBuffer();
  const total = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  if (!m) return cached.clone();

  const start = m[1] === "" ? 0 : parseInt(m[1], 10);
  const end = Math.min(m[2] === "" ? total - 1 : parseInt(m[2], 10), total - 1);
  if (Number.isNaN(start) || start >= total || start > end) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
  }

  const headers = new Headers(cached.headers);
  headers.set("Content-Range", `bytes ${start}-${end}/${total}`);
  headers.set("Content-Length", String(end - start + 1));
  headers.set("Accept-Ranges", "bytes");
  return new Response(buf.slice(start, end + 1), { status: 206, statusText: "Partial Content", headers });
}
