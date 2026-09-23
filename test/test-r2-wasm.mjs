// Exercise web/r2-wasm.js against a fake R2, since nothing else runs it until
// the first deploy.
import { serveWasm } from "../web/r2-wasm.js";

const asked = [];
const object = {
  body: "BYTES",
  httpEtag: '"abc"',
  writeHttpMetadata: (h) => h.set("content-type", "application/octet-stream"),
};
const env = { WASM: { get: async (key) => { asked.push(key); return key.includes("deadbeef") ? object : null; } } };
const ctx = (path) => ({ params: { path }, env, request: new Request("https://x/", { headers: new Headers() }) });

let bad = 0;
const check = (name, ok, got) => { console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : ": " + got}`); if (!ok) bad++; };

let r = await serveWasm(ctx(["deadbeefdeadbeef", "crash-the-stack.wasm"]), "jack-in", true);
check("a good path is 200", r.status === 200, r.status);
check("the key is prefixed", asked[0] === "jack-in/w/deadbeefdeadbeef/crash-the-stack.wasm", asked[0]);
check("content-type is wasm", r.headers.get("content-type") === "application/wasm", r.headers.get("content-type"));
check("CORP same-origin", r.headers.get("cross-origin-resource-policy") === "same-origin", r.headers.get("cross-origin-resource-policy"));
check("COEP require-corp", r.headers.get("cross-origin-embedder-policy") === "require-corp", r.headers.get("cross-origin-embedder-policy"));
check("immutable", /immutable/.test(r.headers.get("cache-control") || ""), r.headers.get("cache-control"));
check("etag passed through", r.headers.get("etag") === '"abc"', r.headers.get("etag"));

r = await serveWasm(ctx(["deadbeefdeadbeef", "crash-the-stack.wasm"]), "tracker", true);
check("the prefix decides the key", asked[1] === "tracker/w/deadbeefdeadbeef/crash-the-stack.wasm", asked[1]);

for (const [name, path] of [
  ["traversal", ["..", "..", "etc", "passwd.wasm"]],
  ["not a hash", ["nothex", "crash-the-stack.wasm"]],
  ["short hash", ["deadbeef", "crash-the-stack.wasm"]],
  ["not a wasm", ["deadbeefdeadbeef", "secrets.json"]],
  ["extra depth", ["deadbeefdeadbeef", "x", "crash-the-stack.wasm"]],
  ["empty", [""]],
]) {
  const before = asked.length;
  const res = await serveWasm(ctx(path), "jack-in", true);
  check(`${name} is 404 and asks R2 nothing`, res.status === 404 && asked.length === before, `${res.status}, asked ${asked.length - before}`);
}

const missing = await serveWasm(ctx(["0000000000000000", "crash-the-stack.wasm"]), "jack-in", true);
check("an unknown hash is 404", missing.status === 404, missing.status);

const head = await serveWasm(ctx(["deadbeefdeadbeef", "crash-the-stack.wasm"]), "jack-in", false);
check("HEAD has no body", head.status === 200 && head.body === null, `${head.status}, body ${head.body}`);

const cond = { httpEtag: '"abc"', writeHttpMetadata: (h) => h.set("content-type", "application/wasm") };
const env2 = { WASM: { get: async () => cond } };
const r304 = await serveWasm({ params: { path: ["deadbeefdeadbeef", "crash-the-stack.wasm"] }, env: env2, request: new Request("https://x/", { headers: new Headers() }) }, "jack-in", true);
check("a conditional hit is 304", r304.status === 304, r304.status);

console.log(bad ? `RESULT: ${bad} failed` : "RESULT: all passed");
process.exit(bad ? 1 : 0);
