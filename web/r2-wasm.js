// Serve a content-addressed wasm object from R2, same-origin, for the Pages
// Functions under functions/jack-in/w/ and functions/tracker/w/.
//
// WHY THIS EXISTS. Cloudflare Pages refuses a file over 25 MiB. The game's
// wasm passed it: 25,137,475 bytes at 23b16a7 (the last publish that fit),
// ~33 MB after M1 brought motif's player back, 41,921,264 after P5's hub on
// sigil 0.22.5. The tracker's is 16,698,428 and still fits, but it is at 67%
// of the cap and climbing, so both go through here: one mechanism, not two.
//
// WHY SAME-ORIGIN AND NOT THE BUCKET'S OWN URL. The game's page is cross-origin
// isolated (COOP + COEP require-corp, ruling D12) because the audio bridge
// needs SharedArrayBuffer for the AudioWorklet path. An isolated page may only
// load subresources that agree to be embedded, and r2.dev is a different
// origin. Serving from the page's own origin keeps the isolation, and with it
// the worklet; without it the game falls back to the ScriptProcessor path,
// which David hears as hitching on his phone.
//
// WHY THE HASH IS IN THE PATH. A deploy must never pair a page from one build
// with a wasm from another. The page asks for the hash of the bytes it was
// built against, old objects stay in the bucket, and a stale cached page keeps
// working instead of loading a wasm it does not match. It also makes every
// object immutable, which is what the year-long cache-control rests on.
//
// The headers here are not decoration. _headers does not apply to a Function's
// response, so CORP and COEP must be set on it directly or the isolated page
// refuses the wasm and the game does not boot.
const IMMUTABLE = "public, max-age=31536000, immutable";

function headersFor(object) {
  const h = new Headers();
  object.writeHttpMetadata(h);              // whatever the upload stored
  h.set("content-type", "application/wasm");
  h.set("cache-control", IMMUTABLE);
  h.set("etag", object.httpEtag);
  h.set("cross-origin-resource-policy", "same-origin");
  h.set("cross-origin-embedder-policy", "require-corp");
  h.set("x-content-type-options", "nosniff");
  return h;
}

// prefix: the route's own directory under the bucket ("jack-in" | "tracker"),
// so a key cannot be reached from the wrong route.
export async function serveWasm(context, prefix, withBody) {
  const { params, env, request } = context;
  const parts = Array.isArray(params.path) ? params.path : [params.path];
  const tail = parts.join("/");
  // <sha16>/<name>.wasm and nothing else: no traversal, no general read-through
  if (!/^[0-9a-f]{16}\/[a-z0-9-]+\.wasm$/.test(tail)) {
    return new Response("not found\n", { status: 404 });
  }
  const key = `${prefix}/w/${tail}`;
  const object = await env.WASM.get(key, { onlyIf: request.headers });
  if (!object) return new Response("not found\n", { status: 404 });
  if (!("body" in object)) {
    // a conditional request the object satisfies: metadata, no body
    return new Response(null, { status: 304, headers: headersFor(object) });
  }
  return new Response(withBody ? object.body : null, { headers: headersFor(object) });
}
