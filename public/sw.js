// clxthes service worker
// Strategies:
//   /_next/static/**   → Cache-First  (build-hashed, immutable)
//   Roblox CDN images  → Cache-First  (rarely change, large, expensive to re-fetch)
//   /api/**            → Network-Only (always fresh, POST requests must not be cached)
//   Navigation (HTML)  → Network-First with offline fallback

const CACHE_VERSION = "clxthes-v1";

const ROBLOX_CDN_HOSTS = new Set([
  "thumbnails.roblox.com",
  "tr.rbxcdn.com",
  "t2.rbxcdn.com",
  "t3.rbxcdn.com",
  "t4.rbxcdn.com",
  "t5.rbxcdn.com",
  "t6.rbxcdn.com",
  "t7.rbxcdn.com",
]);

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  // Skip waiting so the new SW activates immediately on first install.
  // On *updates*, the new SW only activates after all old tabs are closed
  // (or the user navigates to a new page).
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // Pre-cache the app shell so the first load is instant offline
      cache.addAll(["/", "/favicon.ico"]).catch(() => {
        // Non-fatal — origin fetch can fail in CI / build environments
      })
    )
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept non-GET requests (API POSTs, etc.)
  if (request.method !== "GET") return;

  // Never intercept /api routes — always go to the network
  if (url.pathname.startsWith("/api/")) return;

  // ── Cache-First: Next.js static assets (build-hashed, effectively immutable) ──
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── Cache-First: Roblox CDN images ──────────────────────────────────────────
  if (ROBLOX_CDN_HOSTS.has(url.hostname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── Network-First: all other same-origin requests (HTML navigation, etc.) ───
  event.respondWith(networkFirst(request));
});

// ─── Strategy helpers ─────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Offline fallback — serve the cached root shell if available
    const shell = await cache.match("/");
    return shell ?? new Response("Offline", { status: 503 });
  }
}
