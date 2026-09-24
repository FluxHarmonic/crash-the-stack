#!/usr/bin/env node
// SCAN's first-click gate on a web build (D81): serve the build on
// loopback, open headless Chrome at ?scanbench=PRESET:N[:collect] under a
// CDP CPU throttle (a slow-phone proxy, not a phone), print the bench's
// lines, and fail when the worst sliced frame reaches --max-frame ms.
//
//   node scripts/scanbench-web.mjs BUILD-DIR [--bench backbone:60:collect]
//        [--throttle 6] [--max-frame 128] [--port 8440] [--cdp 9440]
//
// The limit defaults to 128 ms, half the 256 ms cue ring ((crash audio)'s
// TARGET-DEPTH at 48 kHz; the music's is 341 ms). `collect` stands for the
// shell opening the board through (crash scan open), which runs a minor
// collection before the first click. Exit: 0 pass, 1 the worst frame
// reached the limit, 2 SETUP-FAILED (no page, a refusal, an exception, or
// a timeout), with what was seen. Based on scripts/shot-web.mjs.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
if (!args[0] || args[0].startsWith("--")) { console.log("usage: scanbench-web.mjs BUILD-DIR [--bench P:N[:collect]] [--throttle R] [--max-frame MS]"); process.exit(2); }
const ROOT = path.resolve(args[0]);
const BENCH = opt("--bench", "backbone:60:collect");
const THROTTLE = parseFloat(opt("--throttle", "6"));
const MAX_FRAME = parseFloat(opt("--max-frame", "128"));
const PORT = parseInt(opt("--port", "8440"), 10);
const CDP = parseInt(opt("--cdp", "9440"), 10);
const PRESET = BENCH.split(":")[0];
const TYPES = { ".html": "text/html;charset=utf-8", ".js": "text/javascript;charset=utf-8", ".wasm": "application/wasm", ".json": "application/json", ".css": "text/css;charset=utf-8", ".png": "image/png" };

if (!fs.existsSync(path.join(ROOT, "index.html"))) { console.log(`SETUP-FAILED: no index.html in ${ROOT}`); process.exit(2); }
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const fp = path.join(ROOT, urlPath === "/" ? "/index.html" : urlPath);
  if (fp !== ROOT && !fp.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404).end(); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(fp)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(buf);
  });
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const udd = fs.mkdtempSync("/tmp/crash-scanbench-chrome-");
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--mute-audio",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-webgl", "--ignore-gpu-blocklist",
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${udd}`, "--window-size=844,390", "about:blank",
], { stdio: "ignore", detached: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lines = [];
const kill = () => { try { process.kill(-chrome.pid, "SIGKILL"); } catch { /* gone */ } try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } };
process.on("exit", kill);
const done = (code, why) => { if (why) console.log(why); server.close(); kill(); process.exit(code); };
setTimeout(() => done(2, "SETUP-FAILED: timed out after 1500 s; bench lines so far:\n" + lines.filter((l) => l.includes("scanbench")).join("\n")), 1500000).unref();

let ws = null;
for (let i = 0; i < 80 && !ws; i++) {
  try { const t = (await (await fetch(`http://127.0.0.1:${CDP}/json`)).json()).find((x) => x.type === "page"); if (t) ws = new WebSocket(t.webSocketDebuggerUrl); } catch { /* not up */ }
  await sleep(250);
}
if (!ws) done(2, "SETUP-FAILED: no chrome page target");
// the socket can open while the loop above sleeps: check before waiting
if (ws.readyState !== 1) await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
let id = 0; const pending = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); return; }
  if (m.method === "Runtime.consoleAPICalled") lines.push((m.params.args || []).map((a) => a.value ?? a.description ?? "").join(" "));
  if (m.method === "Runtime.exceptionThrown") lines.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text));
});
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.enable"); await send("Runtime.enable");
if (THROTTLE > 1) await send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
const t0 = Date.now();
await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?fresh&scanbench=${BENCH}` });

// the bench prints its eight measure lines, then one per kind of unit;
// frame-ms is the eighth
const bench = () => lines.filter((l) => l.startsWith(`crash: scanbench ${PRESET} `));
while (!bench().some((l) => / frame-ms /.test(l))) {
  const bad = lines.find((l) => /^exception|scanbench refused/.test(l));
  if (bad) done(2, "SETUP-FAILED: " + bad);
  await sleep(200);
}
await sleep(300);   // the per-kind lines follow at once
console.log(`scanbench-web: ${BENCH} at ${THROTTLE}x CPU throttle, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
for (const l of bench()) console.log(l);
const frame = bench().find((l) => / frame-ms /.test(l)).trim().split(/\s+/).map(Number);
const worst = frame[frame.length - 1];
if (!(worst >= 0)) done(2, "SETUP-FAILED: could not read the worst frame");
if (worst >= MAX_FRAME) done(1, `FAIL: the worst sliced frame is ${worst} ms, at or over ${MAX_FRAME} ms`);
done(0, `PASS: the worst sliced frame is ${worst} ms, under ${MAX_FRAME} ms`);
