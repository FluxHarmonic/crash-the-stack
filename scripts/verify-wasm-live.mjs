// What only a real deployment can answer about the wasm: does the Pages
// Function actually serve it, with the headers the isolated page needs?
//
//   node scripts/verify-wasm-live.mjs https://crashthestack.com
//   node scripts/verify-wasm-live.mjs https://<hash>.crashthestack.pages.dev
//
// verify-site.mjs's `wasm` leg checks what is true in both places — the page
// names a content-addressed path, that path answers 200 as application/wasm,
// and the bytes hash to the name they are served under. It cannot check the
// rest, because nothing local runs a Pages Function: scripts/host-site and
// verify-site's own server are static. This checks the rest, against the
// deployment:
//
//   - the Function answers at all (a missing R2 binding is a 500 here and a
//     game that never boots for a player)
//   - cache-control is immutable: the object is content-addressed, so a
//     revalidation on every launch would be 42 MB of waste
//   - CORP is same-origin and COEP require-corp: the page is cross-origin
//     isolated for the AudioWorklet path, and an isolated page refuses a
//     subresource that does not agree to be embedded. Get this wrong and the
//     game either does not boot or drops to the ScriptProcessor path that
//     David hears as hitching
//   - the wire is compressed: 41.9 MB raw is 1.8 MB brotli, and whether
//     Cloudflare compresses a Function's response is a question nobody should
//     answer from memory
//   - a wrong hash is a 404, not somebody else's wasm
//
// Exits 0 when every check passes, 1 otherwise.
const base = (process.argv[2] || "").replace(/\/$/, "");
if (!base) { console.log("usage: verify-wasm-live.mjs https://origin"); process.exit(2); }

const results = [];
const pass = (n, d) => { results.push(true); console.log(`PASS ${n}: ${d}`); };
const fail = (n, d) => { results.push(false); console.log(`FAIL ${n}: ${d}`); };

async function sha16(bytes) {
  const d = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

for (const [page, name] of [["jack-in", "crash-the-stack"], ["tracker", "crash-tracker"]]) {
  const pageUrl = `${base}/${page}/`;
  const pageRes = await fetch(pageUrl);
  if (!pageRes.ok) { fail(page, `${pageUrl} answered ${pageRes.status}`); continue; }
  const html = await pageRes.text();
  // a host that answers a missing path with some other page would otherwise be
  // read as the game's own, and its data-wasm believed
  if (!html.includes("sigil-web-app.js")) { fail(page, `${pageUrl} is not the game's page (no loader script)`); continue; }
  const m = html.match(/data-wasm="([^"]+)"/);
  if (!m) { fail(page, `${pageUrl} has no data-wasm`); continue; }
  const named = m[1];
  if (!/^w\/[0-9a-f]{16}\//.test(named)) { fail(page, `${pageUrl} names ${named}, not a hashed path`); continue; }
  const url = `${base}/${page}/${named}.wasm`;

  const res = await fetch(url, { headers: { "accept-encoding": "br, gzip" } });
  if (res.status !== 200) { fail(page, `${url} answered ${res.status}`); continue; }

  const detail = [];
  const type = res.headers.get("content-type") || "";
  if (!type.startsWith("application/wasm")) detail.push(`content-type ${type || "absent"}`);
  const cache = res.headers.get("cache-control") || "";
  if (!/immutable/.test(cache) || !/max-age=\d{7,}/.test(cache)) detail.push(`cache-control "${cache}"`);
  const corp = res.headers.get("cross-origin-resource-policy");
  if (corp !== "same-origin") detail.push(`CORP ${corp || "absent"}`);
  const coep = res.headers.get("cross-origin-embedder-policy");
  if (coep !== "require-corp") detail.push(`COEP ${coep || "absent"}`);

  // fetch() decodes the body, so the header is what says whether the wire was
  // compressed; content-length, when present, is the compressed size
  const encoding = res.headers.get("content-encoding") || "identity";
  const wire = res.headers.get("content-length");
  const bytes = new Uint8Array(await res.arrayBuffer());
  const got = await sha16(bytes);
  const want = named.split("/")[1];
  if (got !== want) detail.push(`bytes hash to ${got}, not ${want}`);

  if (detail.length) fail(page, `${url}: ${detail.join("; ")}`);
  else pass(page, `${bytes.length} bytes, hash ${want}, ${type}, ${cache}, CORP ${corp}, COEP ${coep}, wire ${encoding}${wire ? ` (${wire} bytes)` : ""}`);

  if (encoding === "identity") {
    fail(`${page}-compression`, `${url} came back uncompressed: ${bytes.length} bytes on the wire. Cloudflare is not compressing the Function's response; store brotli in R2 and set Content-Encoding instead`);
  } else {
    pass(`${page}-compression`, `${encoding}${wire ? `, ${wire} bytes on the wire against ${bytes.length} decoded` : ""}`);
  }

  // a hash nobody published must not resolve to something else's bytes
  const bogus = `${base}/${page}/w/${"0".repeat(16)}/${name}.wasm`;
  const b = await fetch(bogus);
  if (b.status === 404) pass(`${page}-unknown`, "an unpublished hash is 404");
  else fail(`${page}-unknown`, `${bogus} answered ${b.status}, not 404`);
}

const bad = results.filter((r) => !r).length;
console.log(`RESULT: ${results.length - bad} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
