/* Namma Bharat Vault – service-worker.js
 * Caches the app files so the site opens with no internet.
 *
 * HOW TO RUN LOCALLY (service workers need http://localhost, not file://):
 *   Open a terminal in this folder and run:  python -m http.server 8000
 *   Then open http://localhost:8000 in Chrome.
 *
 * HOW TO TEST OFFLINE:
 *   1. Load the page once while online (this caches the files).
 *   2. Chrome DevTools (F12) -> Network tab -> tick "Offline" (or stop the server / turn off Wi-Fi).
 *   3. Refresh the page – it should still load and the scanner should still work.
 */
const CACHE = "nbv-cache-v17";
const FILES = ["./", "./index.html", "./style.css", "./languages.js", "./voice-content.js", "./script.js", "./manifest.webmanifest", "./app-icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
});
// Cache-first: use saved copy, fall back to network
self.addEventListener("fetch", e => {
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
