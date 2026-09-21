// Browser acceptance for D55's GPU-only candidates. Based on shot-web's CDP plumbing.
// node scripts/verify-field-rules.mjs build/hosted --rule cyclic --seconds 300 --port 18074 --cdp 19474
// Checks held 200/6000-step fields, repeatability, palette/dither,
// five minutes of live motion and console/GL errors. Use measure-ms.mjs for costs.
// Uses a landscape phone viewport at DPR 3 and headless SwiftShader.
import http from "node:http";
import { cyclicAt } from "../docs/codex/field-rules/sweep-cyclic.mjs";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const ruleAt = args.indexOf('--rule');
const RULE = ruleAt < 0 ? 'cyclic' : args[ruleAt + 1];
if (!['cyclic', 'flow', 'signal', 'echo', 'synapse'].includes(RULE)) throw new Error('Expected --rule cyclic|flow|signal|echo|synapse');
const secondsAt = args.indexOf('--seconds');
const SECONDS = secondsAt < 0 ? 300 : Number(args[secondsAt + 1]);
const errors = [];
if (!Number.isFinite(SECONDS) || SECONDS < 0) throw new Error('Invalid --seconds');
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (["--port", "--cdp", "--rule", "--seconds"].includes(args[i])) { i++; continue; }
  if (!args[i].startsWith("--")) positional.push(args[i]);
}
const ROOT = path.resolve(positional[0] || "build/web");
const PORT = parseInt(opt("--port", "18074"), 10);
const CDP = parseInt(opt("--cdp", "19474"), 10);
const TYPES = { ".html": "text/html;charset=utf-8", ".js": "text/javascript;charset=utf-8", ".wasm": "application/wasm", ".json": "application/json", ".css": "text/css;charset=utf-8", ".png": "image/png", ".webmanifest": "application/manifest+json" };

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const fp = path.join(ROOT, urlPath === "/" ? "/index.html" : urlPath);
  if (fp !== ROOT && !fp.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404).end("not found: " + urlPath); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(fp)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(buf);
  });
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const udd = fs.mkdtempSync("/tmp/crash-field-rules-chrome-");
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--mute-audio",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--enable-webgl", "--ignore-gpu-blocklist",
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${udd}`, "--window-size=844,390", "about:blank",
], { stdio: "ignore", detached: true, env: { ...process.env, PULSE_SINK: "worker-null", PIPEWIRE_NODE: "worker-null" } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function killChromeGroup(sig) { try { process.kill(-chrome.pid, sig); } catch { /* gone */ } }
let exiting = false;
function shutdown(code) {
  if (exiting) return; exiting = true;
  process.exitCode = code;
  try { server.close(); } catch { /* not listening */ }
  killChromeGroup("SIGTERM");
  setTimeout(() => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } process.exit(code); }, 800).unref();
}
process.on("exit", () => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } });
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, () => shutdown(130));
setTimeout(() => { console.log(`TIMED-OUT ${RULE}`); shutdown(2); }, (SECONDS + 300) * 1000).unref();

let pageWs = null;
for (let i = 0; i < 80 && !pageWs; i++) {
  try { const ts = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); const p = ts.find((t) => t.type === "page"); if (p && p.webSocketDebuggerUrl) pageWs = p.webSocketDebuggerUrl; } catch { /* not up yet */ }
  await sleep(250);
}
if (!pageWs) { console.log("SETUP-FAILED: no chrome page target"); shutdown(2); }
const ws = new WebSocket(pageWs);
let msgId = 0; const pending = new Map(); const lines = [];
function send(method, params = {}) {
  return new Promise((res, rej) => { const id = ++msgId; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
}
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); return; }
  if (msg.method === 'Runtime.exceptionThrown') errors.push(JSON.stringify(msg.params.exceptionDetails));
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(JSON.stringify(msg.params.args));
  if (msg.method === "Runtime.consoleAPICalled") lines.push((msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" "));
});
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
process.on('uncaughtException', err => { console.error(err); shutdown(1); });
process.on('unhandledRejection', err => { console.error(err); shutdown(1); });
await send("Page.enable"); await send("Runtime.enable");
// a landscape phone: the canvas fills the height, dpr 3, touch
await send("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 3, mobile: true });
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Emulation.setEmulatedMedia", { features: [{ name: "pointer", value: "coarse" }, { name: "hover", value: "none" }] });

async function evalJS(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}

const TONES = [[13,10,26], [23,18,46], [33,23,61], [42,45,58],
               [31,58,77], [46,28,77], [74,90,43], [92,77,140]];
async function waitLine(re, from = 0, ms = 60000) {
  const started = Date.now();
  while (Date.now() - started < ms) {
    if (lines.slice(from).some(line => re.test(line))) return;
    await sleep(100);
  }
  throw new Error('No ' + re + ': ' + lines.slice(-15).join(' | '));
}
async function boot(seed, hold) {
  const from = lines.length;
  await send('Page.navigate', {url: 'http://127.0.0.1:' + PORT + '/?trace&stack&fresh&mute&seed=' + seed +
    '&bg=' + RULE + '&bgonly&copper=off&phosphor=off' + (hold === undefined ? '' : '&bghold=' + hold + (hold === 6000 ? '&bgstride=1' : ''))});
  await waitLine(new RegExp('^crash: bg gpu ' + RULE + '$'), from);
  if (hold !== undefined) await waitLine(new RegExp('^crash: bg held ' + hold + '$'), from, hold === 6000 ? 180000 : 60000);
  return from;
}
async function read() {
  return evalJS(`new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
    const c = document.getElementById('stage');
    const off = document.createElement('canvas'); off.width = c.width; off.height = c.height;
    const g = off.getContext('2d'); g.drawImage(c, 0, 0);
    const data = g.getImageData(0, 0, c.width, c.height).data;
    const scale = Math.min(c.width / 640, c.height / 400);
    const w = Math.floor(640 * scale), h = Math.floor(400 * scale);
    const ox = Math.floor((c.width - w) / 2), oy = Math.floor((c.height - h) / 2);
    const samples = [];
    for (let y = 4; y < 352; y += 8) for (let x = 4; x < 640; x += 8) {
      const i = (Math.floor(oy + y * h / 400) * c.width + Math.floor(ox + x * w / 640)) * 4;
      samples.push([data[i], data[i + 1], data[i + 2]]);
    }
    resolve(samples);
  })))`);
}
function tones(samples) {
  return samples.map(rgb => TONES.findIndex(tone => tone.every((c, i) => Math.abs(c - rgb[i]) <= 2)));
}
function stats(map) {
  const counts = TONES.map((_, i) => map.filter(t => t === i).length);
  return {tones: counts.filter(n => n > 0).length, dominant: Math.max(...counts) / map.length,
          accents: (counts[6] + counts[7]) / map.length,
          outside: map.filter(t => t < 0).length};
}
function check(map) {
  const s = stats(map);
  if (s.outside || s.tones < 4 || s.dominant > 0.9 || s.accents > 0.15) throw new Error('Field not alive/palette-only: ' + JSON.stringify(s));
  // Bottom-left is always the base of the existing ordered dither.
  for (let y = 0; y < 44; y += 2) for (let x = 0; x < 80; x += 2) {
    const b = map[(y + 1) * 80 + x], u = (b + 1) % 8;
    const tl = map[y * 80 + x], tr = map[y * 80 + x + 1], br = map[(y + 1) * 80 + x + 1];
    if (![[b,b,b], [u,b,b], [u,b,u], [u,u,u]].some(p => p[0] === tl && p[1] === tr && p[2] === br))
      throw new Error('Invalid dither at ' + x + ',' + y);
  }
  return s;
}
const changed = (a, b) => a.reduce((n, v, i) => n + (v !== b[i]), 0);
await boot(7, 200);
const initial = tones(await read());
console.log('PASS ' + RULE + ' step 200 ' + JSON.stringify(check(initial)));
if (RULE === 'cyclic') {
  const mismatches = changed(initial, cyclicAt(1, 200).tones);
  if (mismatches) throw new Error(mismatches + ' cyclic half cells differ from the integer oracle');
  console.log('PASS cyclic integer oracle: all 3520 half cells match');
}
await boot(7, 200);
if (changed(initial, tones(await read()))) throw new Error('Field is not repeatable at step 200');
console.log('PASS ' + RULE + ' deterministic replay at step 200');
// 6000 steps equals five minutes at the default 60 Hz / STRIDE=3 schedule.
// A held snapshot supplements the real-time run below.
await boot(7, 6000);
const long = tones(await read());
console.log('PASS ' + RULE + ' step 6000 ' + JSON.stringify(check(long)));
await boot(7);
const started = Date.now();
let previous = null, samples = 0, largest = 0, minChanged = Infinity;
while (Date.now() - started < SECONDS * 1000) {
  await sleep(Math.min(15000, SECONDS * 1000 - (Date.now() - started)));
  const map = tones(await read()); const s = check(map);
  largest = Math.max(largest, s.dominant);
  if (previous) {
    const n = changed(previous, map); minChanged = Math.min(minChanged, n);
    if (!n) throw new Error('Field froze between samples');
  }
  previous = map; samples++;
  console.log(RULE + ' live ' + ((Date.now() - started) / 1000).toFixed(1) + 's ' + JSON.stringify(s));
}
const glErrors = lines.filter(l => /sokol\[level=[01]\]|shader.*(fail|error)/i.test(l));
const runtimeErrors = lines.filter(l => /^(Error: |Scheme error|crash: texture missing)/.test(l));
// Match verify-field.mjs: navigation can abort an image fetch. Only the
// known bridge warning is recoverable, and never when a texture stays missing.
const raced = errors.filter(e => /sigil-wasm-gles3: image fetch failed:/.test(e));
const realErrors = errors.filter(e => !raced.includes(e));
if (raced.length) console.log('note: ' + raced.length + ' image fetch warning(s) during reloads');
if (realErrors.length || runtimeErrors.length || glErrors.length)
  throw new Error(JSON.stringify({errors: realErrors, runtimeErrors, glErrors}));
console.log('PASS ' + RULE + ' ' + SECONDS + 's, samples ' + samples + ', largest tone share ' + largest.toFixed(3) + ', minimum changed half cells ' + minChanged);
shutdown(0);
