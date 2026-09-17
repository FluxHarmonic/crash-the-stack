// sw.js - the service worker behind the installed PWA.
//
// Copied into build/web by the build task with __VERSION__ replaced by the
// build's version (the git commit, plus a stamp when the tree was dirty).
// The cache is named after the version, so a new build precaches its own
// files under a new name and the old cache is dropped on activation.
//
// Updates follow ruling D14 (2026-09-17) and Enclave's mechanics: this
// worker never calls skipWaiting on its own. A new version installs and
// then WAITS; the page notices (registration.waiting), prompts at launch,
// shows an indicator during play, and only when the player chooses does it
// send SKIP_WAITING, after which controllerchange reloads the page. A board
// in play is never interrupted by an update. (The browser activates a
// waiting worker by itself once no client of the old one is left, i.e.
// after the app is closed; that launch shows no prompt.)
//
// Fetch: same-origin GET requests are served from this version's cache
// first and the network second (the response is cached for next time);
// navigations (any query string) are the cached page. Anything else goes
// to the network untouched.

var VERSION = "__VERSION__";
var CACHE = "crash-the-stack-" + VERSION;
var SHELL = [
  "./",
  "styles.css",
  "crash-the-stack.wasm",
  "sigil-wasm-bridges.js",
  "sigil-wasm-bridges.json",
  "assets/sigil-web-app.js",
  "assets/sigil-wasm-gles3.js",
  "assets/sigil-browser.js",
  "assets/test-tile.png",
  "assets/manifest.webmanifest",
  "assets/icon-192.png",
  "assets/icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // Bypass the HTTP cache: a new version must fetch its own files.
      return Promise.all(SHELL.map(function (path) {
        return cache.add(new Request(path, { cache: "reload" }));
      }));
    })
  );
  // No skipWaiting here: see the header.
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (name) {
        if (name !== CACHE && name.indexOf("crash-the-stack-") === 0) return caches.delete(name);
        return null;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("message", function (event) {
  var data = event.data || {};
  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (data.type === "VERSION" && event.ports && event.ports[0]) {
    event.ports[0].postMessage({ version: VERSION });
  }
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    event.respondWith(
      caches.open(CACHE).then(function (cache) {
        return cache.match("./").then(function (hit) {
          return hit || fetch(req);
        });
      })
    );
    return;
  }
  event.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req, { ignoreSearch: true }).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          if (res && res.ok && res.type === "basic") cache.put(req, res.clone());
          return res;
        });
      });
    })
  );
});
