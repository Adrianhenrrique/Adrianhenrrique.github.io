/* ZoomERP PWA — o navegador já armazena bundles Next.js imutáveis via HTTP.
   Apenas a tela pública offline é mantida pelo service worker.
   Requisições autenticadas e assets não passam mais pelo cache do SW. */
const CACHE_NAME = "zoomerp-offline-v1.1.1";
const PREFIXES = ["zoomerp-offline-", "zoomerp-public-"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME)
    .then((cache) => cache.add("/offline"))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys
      .filter((key) => PREFIXES.some(prefix => key.startsWith(prefix)) && key !== CACHE_NAME)
      .map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.mode !== "navigate" || request.method !== "GET") return;
  if (new URL(request.url).origin !== self.location.origin) return;

  // Navegação sempre pela rede; fallback estático somente em caso de falha.
  // Nunca colocamos HTML de contas, empresas ou produtos no cache.
  event.respondWith(fetch(request).catch(async () =>
    (await caches.match("/offline")) ??
    new Response("Sem conexão. Reconecte para utilizar o ZoomERP.", {
      status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  ));
});
