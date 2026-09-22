#!/usr/bin/env node
// Host a build directory over HTTPS on the WireGuard address, for the phone.
//
//   node scripts/serve-web-tls.mjs DIR PORT [--isolate]
//
// A phone's Chrome allows AudioWorklet (and a service worker) only on a
// secure context, and the plain-http wg0 host is not one, so a read there
// measures the ScriptProcessor path whatever the bridge can do (David's
// phone, 2026-09-22). This serves the same directory over TLS with a
// self-signed certificate for the wg0 address (build/tls/{key,cert}.pem,
// made with openssl: req -x509 -newkey rsa:2048 -nodes -subj /CN=ADDR
// -addext subjectAltName=IP:ADDR; the phone taps through the warning
// once). Without --isolate the page gets the bridge's worklet-msg mode
// (a worklet, no SharedArrayBuffer): the path a non-isolated https host
// gets; with --isolate it sends COOP/COEP and gets worklet-sab, the
// published site's path. Binds to wg0 only, as scripts/serve-web does
// (decision D10); the address is read from the interface at run time.
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const [dir, portArg, ...flags] = process.argv.slice(2);
if (!dir || !portArg) { console.error("usage: serve-web-tls.mjs DIR PORT [--isolate]"); process.exit(2); }
const port = Number(portArg);
const isolate = flags.includes("--isolate");
const root = path.resolve(dir);
if (!fs.existsSync(path.join(root, "index.html"))) { console.error(`serve-web-tls: ${root}/index.html missing`); process.exit(1); }

let host = "";
try { host = execSync("ip -4 -o addr show dev wg0", { encoding: "utf8" }).match(/inet (\d+\.\d+\.\d+\.\d+)/)?.[1] || ""; } catch { host = ""; }
if (!host || host === "0.0.0.0") { console.error("serve-web-tls: no wg0 address; refusing to bind elsewhere"); process.exit(1); }

const key = fs.readFileSync("build/tls/key.pem"), cert = fs.readFileSync("build/tls/cert.pem");
const MIME = { html: "text/html; charset=utf-8", js: "text/javascript", mjs: "text/javascript", wasm: "application/wasm", json: "application/json",
  css: "text/css", cts: "text/plain; charset=utf-8", png: "image/png", svg: "image/svg+xml", webmanifest: "application/manifest+json", txt: "text/plain; charset=utf-8", md: "text/plain; charset=utf-8" };
const server = https.createServer({ key, cert }, (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, "https://x").pathname);
  let fp = path.normalize(path.join(root, urlPath));
  if (!fp.startsWith(root)) { res.writeHead(403); res.end(); return; }
  try { if (fs.statSync(fp).isDirectory()) fp = path.join(fp, "index.html"); } catch { /* falls to the read */ }
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404); res.end(); return; }
    const headers = { "content-type": MIME[path.extname(fp).slice(1)] || "application/octet-stream", "cache-control": "no-cache" };
    if (isolate) { headers["cross-origin-opener-policy"] = "same-origin"; headers["cross-origin-embedder-policy"] = "require-corp"; }
    res.writeHead(200, headers);
    res.end(buf);
  });
});
server.listen(port, host, () => {
  console.log(`serve-web-tls: https://${host}:${port}/ serving ${root}${isolate ? " (COOP/COEP: isolated)" : " (not isolated)"}`);
});
