/* Minimal pass-through service worker. Required for PWA installability.
 * Intentionally does NOT cache anything, so there is no stale-content risk. */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Pass-through: let the browser handle every request normally.
});

