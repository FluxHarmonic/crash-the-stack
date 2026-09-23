// shot-web.mjs - one 640x400 PNG of the web build's canvas, for David's phone.
//
//   node scripts/shot-web.mjs build/web OUT.png [--query "stack&seed=3"]
//                             [--do ACTION ...] [--port N] [--cdp N]
//
// Serves the build dir on loopback, opens headless Chrome (SwiftShader,
// a phone viewport with touch and ?trace on), boots the page with the
// query, runs the actions in order, then reads the canvas in the same
// animation frame the game draws (preserveDrawingBuffer is off) and
// writes it at 640x400, nearest-neighbor. Actions:
//   wait:MS            sleep
//   line:REGEX         wait up to 30 s for a "crash:" console line, printed
//   tap:NAME           tap a HUD control at the center the game printed
//                      ("crash: control NAME X Y")
//   menu:ID            tap a menu row on the screen shown ("crash: menu SCREEN ID X Y ...")
//   tool:NAME          fire a tool through the stack (the corner button, then the entry)
//   at:VX,VY           tap a virtual point
//   key:K              a keydown/keyup pair (DOM key name)
// The standing instruction (leader, 2026-09-18): every hosted slice with
// new visuals ships one such PNG per candidate under docs/p3/.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const positional = [];
const actions = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--do") { actions.push(args[++i]); continue; }
  if (["--query", "--port", "--cdp"].includes(args[i])) { i++; continue; }
  if (!args[i].startsWith("--")) positional.push(args[i]);
}
const ROOT = path.resolve(positional[0] || "build/web");
const OUT = positional[1] || "/tmp/crash-shot.png";
const QUERY = opt("--query", "stack");
const PORT = parseInt(opt("--port", "8098"), 10);
const CDP = parseInt(opt("--cdp", "9238"), 10);
const VW = 640, VH = 400;
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

const udd = fs.mkdtempSync("/tmp/crash-shot-chrome-");
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
  try { server.close(); } catch { /* not listening */ }
  killChromeGroup("SIGTERM");
  setTimeout(() => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } process.exit(code); }, 800).unref();
}
process.on("exit", () => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } });
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, () => shutdown(130));
setTimeout(() => { console.log("TIMED-OUT after 180 s"); shutdown(2); }, 180000).unref();

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
  if (msg.method === "Runtime.consoleAPICalled") lines.push((msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" "));
  if (msg.method === "Runtime.exceptionThrown") lines.push("exception: " + (msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text));   // P5: a page exception shows in the console list
  if (msg.method === "Log.entryAdded") lines.push("log: " + msg.params.entry?.level + " " + msg.params.entry?.text);
});
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable");   // P5: browser log entries too
// a landscape phone: the canvas fills the height, dpr 3, touch
await send("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 3, mobile: true });
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Emulation.setEmulatedMedia", { features: [{ name: "pointer", value: "coarse" }, { name: "hover", value: "none" }] });

async function evalJS(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
async function waitLine(re, from, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    for (let i = from; i < lines.length; i++) { const m = lines[i].match(re); if (m) return { m, index: i }; }
    await sleep(50);
  }
  return null;
}
async function tap(vx, vy) {
  return evalJS(`(() => {
    const c = document.getElementById("stage"); const r = c.getBoundingClientRect();
    const scale = Math.min(c.width / ${VW}, c.height / ${VH});
    const ox = (c.width - ${VW} * scale) / 2, oy = (c.height - ${VH} * scale) / 2;
    const bx = ox + ${vx} * scale, by = oy + ${vy} * scale;
    const cx = r.left + bx * r.width / c.width, cy = r.top + by * r.height / c.height;
    c.dispatchEvent(new PointerEvent("pointerdown", { clientX: cx, clientY: cy, bubbles: true, cancelable: true, pointerType: "touch", isPrimary: true }));
    return [cx, cy];
  })()`);
}
async function key(k) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code: k.length === 1 ? "Key" + k.toUpperCase() : k });
  await sleep(40);
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: k.length === 1 ? "Key" + k.toUpperCase() : k });
  await sleep(120);
}

await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&${QUERY}` });
const boot = await waitLine(/^crash: (seed|cards seed|menu|hub open)/, 0, 30000);   // P5: a ?hub= boot opens on the hub
if (!boot) { console.log("SETUP-FAILED: no boot line in 30 s; console: " + JSON.stringify(lines.slice(0, 14))); shutdown(2); }
await sleep(600);

let lineFrom = 0;
for (const action of actions) {
  const [kind, rest] = [action.slice(0, action.indexOf(":")), action.slice(action.indexOf(":") + 1)];
  if (kind === "wait") await sleep(parseInt(rest, 10));
  else if (kind === "eval") {   // P5: is the page alive? evaluate an expression, with a bound
    const r = await Promise.race([evalJS(rest), sleep(5000).then(() => "EVAL-TIMEOUT (the main thread is busy)")]);
    console.log(`eval: ${rest} -> ${JSON.stringify(r)}`);
  }
  else if (kind === "line") {
    // from the last matched line on, so a repeated line (a second shuffle) waits for a new one
    const l = await waitLine(new RegExp(rest), lineFrom, 150000);
    if (!l) { console.log(`SETUP-FAILED: no line matching ${rest}`); shutdown(2); await new Promise(() => {}); }
    lineFrom = l.index + 1;
    console.log(`line: ${l.m[0]}`);
  }
  else if (kind === "tap") {
    const ctl = await waitLine(new RegExp(`^crash: control ${rest} (-?[\\d.]+) (-?[\\d.]+)$`), 0, 3000);
    if (!ctl) { console.log(`SETUP-FAILED: no control ${rest}`); shutdown(2); }
    await tap(ctl.m[1], ctl.m[2]); await sleep(400);
  } else if (kind === "tool") {
    // a tool through the stack (ruling D33): the corner button, then the
    // named entry once the stack has printed it and slid up
    const btn = await waitLine(/^crash: control tool (-?[\d.]+) (-?[\d.]+)$/, 0, 3000);
    if (!btn) { console.log("SETUP-FAILED: no control tool"); shutdown(2); }
    const from = lines.length;
    await tap(btn.m[1], btn.m[2]);
    const entry = await waitLine(new RegExp(`^crash: tool ${rest} (-?[\\d.]+) (-?[\\d.]+) on$`), from, 3000);
    if (!entry) { console.log(`SETUP-FAILED: no enabled tool ${rest}`); shutdown(2); }
    await sleep(350);
    await tap(entry.m[1], entry.m[2]); await sleep(400);
  } else if (kind === "menu") {
    // the newest menu line (one per screen shown: "crash: menu SCREEN ID X Y ...",
    // a value row as ID=VALUE), the named row tapped
    let menu = null;
    for (let i = lines.length - 1; i >= 0 && !menu; i--) { const m = lines[i].match(/^crash: menu (\w+) (.+)$/); if (m) menu = m; }
    if (!menu) menu = await waitLine(/^crash: menu (\w+) (.+)$/, 0, 3000);
    if (!menu) { console.log("SETUP-FAILED: no menu line"); shutdown(2); }
    const parts = menu.m[2].split(" "); let found = null;
    for (let i = 0; i + 2 < parts.length; i += 3) if (parts[i].split("=")[0] === rest) found = [parts[i + 1], parts[i + 2]];
    if (!found) { console.log(`SETUP-FAILED: no menu row ${rest} on screen ${menu.m[1]}: ${menu.m[2]}`); shutdown(2); }
    await tap(found[0], found[1]); await sleep(600);
  } else if (kind === "at") { const [x, y] = rest.split(",").map(Number); await tap(x, y); await sleep(400); }
  else if (kind === "key") { await key(rest); }
  else { console.log(`SETUP-FAILED: unknown action ${action}`); shutdown(2); }
}
await sleep(300);
// read the canvas in the frame the game draws it (preserveDrawingBuffer is off)
const data = await evalJS(`new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => {
  const c = document.getElementById("stage"); resolve(c.toDataURL("image/png"));
})))`);
const raw = OUT + ".raw.png";
fs.writeFileSync(raw, Buffer.from(data.split(",")[1], "base64"));
// the buffer is the phone's, letterboxed; crop the 640x400 viewport out of it
// at its integer scale, then bring it to 640x400 with nearest-neighbor
const dims = await evalJS(`(() => { const c = document.getElementById("stage"); return [c.width, c.height]; })()`);
const scale = Math.min(dims[0] / VW, dims[1] / VH);
const ox = Math.floor((dims[0] - VW * scale) / 2), oy = Math.floor((dims[1] - VH * scale) / 2);
execFileSync("convert", [raw, "-crop", `${Math.round(VW * scale)}x${Math.round(VH * scale)}+${ox}+${oy}`, "+repage", "-filter", "point", "-resize", `${VW}x${VH}!`, "PNG24:" + OUT]);
fs.rmSync(raw);
console.log(`shot -> ${OUT} (canvas ${dims[0]}x${dims[1]}, scale ${scale.toFixed(2)}, ${lines.length} console lines)`);
// the first error, if the game threw one, so a black frame explains itself
const firstError = lines.findIndex((l) => /error|unbound|expected|trap|panic/i.test(l));
if (firstError >= 0) console.log("console error: " + lines.slice(Math.max(0, firstError - 2), firstError + 3).join(" | "));
shutdown(0);
