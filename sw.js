// Bargeld – Offline-Betrieb
// Lädt nur die eigenen App-Dateien. Deine Buchungen gehen nie übers Netz.
// Bei einer neuen App-Version: Zahl hinter "bargeld-v" erhöhen.
const CACHE = "bargeld-v1";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  // Nur alte Bargeld-Caches löschen, andere Apps im selben GitHub-Konto bleiben unberührt
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("bargeld-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // Sofort aus dem Speicher antworten, im Hintergrund still aktualisieren (falls online)
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(req, { ignoreSearch: true }).then(hit => {
        const fresh = fetch(req).then(res => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => hit || (req.mode === "navigate" ? cache.match("./index.html") : Response.error()));
        return hit || fresh;
      })
    )
  );
});
