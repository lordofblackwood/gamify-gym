// Replace only the former Away Strength worker. Keep all workout storage intact.
const migrationCache = "away-strength-move-v1";
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(migrationCache);
    await cache.addAll(["./index.html", "./move.js"]);
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.registration.scope)) return;
  const url = new URL(event.request.url);
  if (event.request.mode === "navigate" || url.pathname.endsWith("/move.js")) {
    event.respondWith((async () => {
      const cache = await caches.open(migrationCache);
      const key = event.request.mode === "navigate" ? "./index.html" : "./move.js";
      return await cache.match(key) || fetch(event.request);
    })());
  }
});
