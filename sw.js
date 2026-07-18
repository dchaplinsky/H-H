/* Service worker: precache the whole app so it runs fully offline once visited.
   Bump CACHE_VERSION whenever any file changes; add new modules to FILES. */

const CACHE_VERSION = "hh-v5";

const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./shared/hh.css",
  "./shared/hh.js",
  "./modules/01-voltage-current-resistance.html",
  "./modules/02-dividers-thevenin.html",
  "./modules/03-capacitors-rc.html",
  "./modules/04-inductors-transformers.html",
  "./modules/05-impedance-filters.html",
  "./modules/06-diodes.html",
  "./modules/07-reading-schematics.html",
  "./modules/08-bjt-switch.html",
  "./modules/09-followers-current-sources.html",
  "./modules/10-common-emitter.html",
  "./modules/11-diffpairs-mirrors.html",
  "./modules/12-fets.html",
  "./modules/13-fet-switches.html",
  "./modules/14-opamp-golden-rules.html",
  "./modules/15-opamp-toolbox.html",
  "./modules/16-comparators-schmitt.html",
  "./modules/17-active-filters.html",
  "./modules/18-opamp-imperfections.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Cache-first for precached app files; network with cache fallback otherwise.
   Successful same-origin fetches are cached opportunistically, so an updated
   deployment refreshes stale entries next time the network is available. */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((hit) => {
      const refresh = fetch(event.request)
        .then((resp) => {
          if (resp.ok && new URL(event.request.url).origin === self.location.origin) {
            const copy = resp.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          }
          return resp;
        })
        .catch(() => hit);
      return hit || refresh;
    })
  );
});
