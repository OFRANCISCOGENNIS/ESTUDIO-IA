// =============================================================
// Service Worker do DesignStudio Pro — cache do app shell para
// funcionamento offline básico (PWA). Navegação: network-first com
// fallback ao cache; demais GET do mesmo domínio: cache-first com
// atualização em segundo plano. Como os projetos ficam no
// localStorage, o app abre e edita offline após a primeira visita.
// =============================================================

const CACHE = 'dsp-cache-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const req = evento.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Navegação (HTML): rede primeiro, cache como reserva (offline)
  if (req.mode === 'navigate') {
    evento.respondWith(
      fetch(req)
        .then((resp) => {
          const copia = resp.clone()
          caches.open(CACHE).then((c) => c.put(req, copia))
          return resp
        })
        .catch(() => caches.match(req).then((m) => m || caches.match('/'))),
    )
    return
  }

  // Assets: cache primeiro, buscando na rede e atualizando o cache
  evento.respondWith(
    caches.match(req).then(
      (cacheado) =>
        cacheado ||
        fetch(req).then((resp) => {
          const copia = resp.clone()
          caches.open(CACHE).then((c) => c.put(req, copia))
          return resp
        }),
    ),
  )
})
