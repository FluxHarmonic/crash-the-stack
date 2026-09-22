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
// navigations (any query string) are the cached game page. Anything else
// goes to the network untouched. The worker's scope is the game's own
// directory (/jack-in/ on crashthestack.com since P4b; the site and the
// tracker sit outside it).

var VERSION = "__VERSION__";
// P4b: the game's caches are "crash-jack-in-<version>"; the old root-scoped
// worker's were "crash-the-stack-<version>", which the root tombstone
// (web/sw-tombstone.js) deletes by that prefix without touching these.
var CACHE = "crash-jack-in-" + VERSION;
var SHELL = [
  "./",
  "styles.css",
  "crash-the-stack.wasm",
  "sigil-wasm-bridges.js",
  "sigil-wasm-bridges.json",
  "assets/sigil-web-app.js",
  "assets/sigil-wasm-gles3.js",
  "assets/sigil-browser.js",
  "assets/packets/portraits.png",
  // the soundtrack (M1, D59): every tune, so the music plays offline (1.4 MB in all,
  // against the 3.2 MB of OGG they replace; the tracker's bundled demos among them;
  // the page fetches one on the game's "crash: tune-fetch NAME" line)
  "assets/tunes/basement-circuit.cts",
  "assets/tunes/black-glass-title.cts",
  "assets/tunes/black-glass.cts",
  "assets/tunes/blind-spot.cts",
  "assets/tunes/breach-vector.cts",
  "assets/tunes/breaker.cts",
  "assets/tunes/clock-edge.cts",
  "assets/tunes/closed-loop.cts",
  "assets/tunes/cold-boot.cts",
  "assets/tunes/dead-sector.cts",
  "assets/tunes/demo-columns.cts",
  "assets/tunes/dirty-cache.cts",
  "assets/tunes/glass-current.cts",
  "assets/tunes/groove.cts",
  "assets/tunes/obsidian-index.cts",
  "assets/tunes/quiet-array.cts",
  "assets/tunes/relay-ghost.cts",
  "assets/tunes/sector-drift.cts",
  "assets/tunes/shadow-protocol.cts",
  "assets/tunes/spy.cts",
  "assets/manifest.webmanifest",
  "assets/icon-192.png",
  "assets/icon-512.png"
  // P4b (the URL move): the game is /jack-in/ and this worker's scope is
  // that directory; the tracker at /tracker/ is outside it, its own page,
  // and no longer precached or routed here.
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
        if (name !== CACHE && (name.indexOf("crash-jack-in-") === 0 || name.indexOf("crash-the-stack-") === 0)) return caches.delete(name);
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

// Cross-origin isolation (P3, the coi-serviceworker technique folded into
// this worker rather than a second one on the same scope): the page's
// navigation response gains Cross-Origin-Opener-Policy: same-origin and
// Cross-Origin-Embedder-Policy: require-corp, and every same-origin
// resource Cross-Origin-Resource-Policy: same-origin, so from the second
// visit on the page is crossOriginIsolated and the audio bridge takes its
// AudioWorklet path (SharedArrayBuffer); the first visit, before this
// worker controls the page, gets the ScriptProcessorNode fallback, which
// is why the first load is not reloaded here (a reload mid-boot would
// cost more than one visit's fallback). The public site adds the same
// headers at the edge (_headers) and is isolated from the first load.
// Every resource the page loads is same-origin, so require-corp blocks nothing.
function isolated(res) {
  if (!res || res.status === 0) return res;
  var headers = new Headers(res.headers);
  headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: headers });
}

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Stream the standalone album without the game cache or navigation fallback.
  if (/^\/soundtrack(?:\/|$)/.test(url.pathname)) return;
  if (req.mode === "navigate") {
    event.respondWith(
      caches.open(CACHE).then(function (cache) {
        // every navigation in scope is the game's page (P4b: the scope is
        // /jack-in/; the tracker at /tracker/ is outside it)
        return cache.match("./").then(function (hit) {
          return hit || fetch(req);
        });
      }).then(isolated)
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
    }).then(isolated)
  );
});
