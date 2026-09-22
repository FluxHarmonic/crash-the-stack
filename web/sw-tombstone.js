// sw-tombstone.js - the worker served at /sw.js after the URL move (P4b).
//
// Until 0.1 the game lived at the root and its service worker (this path,
// scope "/") precached it and answered every navigation with the cached
// game page. The game now lives at /jack-in/ with its own worker under
// that scope, and the root is the site. An installed app or a returning
// browser still holds the old worker, which would keep serving the old
// game at the root from its cache; this file replaces it. Its install
// skips the wait the old worker's update flow would have imposed, its
// activation drops every cache the old worker made, takes the open
// clients, unregisters itself, and reloads each root client from the
// network with the query it had: that is the landing page now, whose
// own script sends a game URL (any query, or the installed app's display
// mode) on to /jack-in/, so a share code or a door survives the move and
// a page with a board in play lands one tap from CONTINUE. After that
// the browser has no worker at the root and the site serves plain.
self.addEventListener("install", function () {
  self.skipWaiting();
});
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf("crash-the-stack-") === 0; })
                             .map(function (k) { return caches.delete(k); }));
    }).then(function () {
      return self.clients.claim();
    }).then(function () {
      return self.registration.unregister();
    }).then(function () {
      return self.clients.matchAll({ type: "window" });
    }).then(function (clients) {
      return Promise.all(clients.map(function (c) {
        var url = new URL(c.url);
        // only the old game's clients (the root page, any query) reload;
        // a client on the site's pages, the game or the tracker stays
        if (url.pathname === "/" || url.pathname === "/index.html") {
          if (c.navigate) return c.navigate("/" + url.search + url.hash).catch(function () {});
        }
        return null;
      }));
    })
  );
});
// no fetch handler: nothing is served from here
