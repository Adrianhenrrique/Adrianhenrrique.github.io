/* ZoomERP PWA 0.3 — offline shell somente. Nunca armazenar respostas privadas, RPC ou navegação. */
const CACHE_NAME = "zoomerp-public-v1.1.0";
const PREFIX = "zoomerp-public-";
const PRECACHE = [
  "/offline",
  "/icon.svg",
  "/icons/zoomerp-192.png",
  "/icons/zoomerp-512.png",
  "/icons/zoomerp-apple-180.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith(PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)),
    )).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // A navegação usa apenas rede e mostra fallback offline — sem armazenar HTML.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () =>
      (await caches.match("/offline")) ??
      new Response("Você está offline. Conecte-se à internet para usar o ZoomERP.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })
    ));
    return;
  }

  // Apenas CSS/JS imutáveis do Next e ícones públicos; nunca Auth, API ou dados de clientes.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname === "/icon.svg") {
    event.respondWith(caches.open(CACHE_NAME).then(async (cache) => {
      const hit = await cache.match(request);
      if (hit) return hit;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    }));
  }
});
