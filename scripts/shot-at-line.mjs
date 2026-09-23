// shot-at-line.mjs - one PNG of a moment too short for scripts/shot-web.mjs.
//
//   node scripts/shot-at-line.mjs DIR OUT.png PORT CDP "QUERY" "REGEX" DELAY-MS
//
//   node scripts/shot-at-line.mjs build/hosted /tmp/entry.png 8141 9271 \
//        "trace&fresh&hub=7&bpm=120" "^crash: hub entry$" 250
//
// shot-web.mjs takes its picture after its whole action queue plus a 300 ms
// tail, so anything shorter than that tail is over before the shutter opens:
// the hub's entry transition (the dialer screen, about a second) could not be
// photographed at all, through several attempts, and the frames were only
// known to have RUN, never seen. This shoots a fixed delay after a console
// line the game itself prints, so the trigger is the subject's own event
// rather than the harness finishing. Serves DIR on loopback, boots headless
// Chrome with software WebGL as the arms do, waits for REGEX among the
// console lines, sleeps DELAY-MS, and writes the viewport as a PNG.
//
// The general rule it came from: an arm whose capture is tied to the end of
// its own script cannot photograph anything shorter than its tail.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const [dirIn, out, portIn, cdpIn, query, reIn, delayIn] = process.argv.slice(2);
const ROOT = path.resolve(dirIn), PORT = +portIn, CDP = +cdpIn;
const RE = new RegExp(reIn), DELAY = +delayIn;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".wasm": "application/wasm",
  ".json": "application/json", ".png": "image/png", ".ogg": "audio/ogg", ".css": "text/css", ".cts": "text/plain",
  ".webmanifest": "application/manifest+json", ".txt": "text/plain" };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent((req.url || "/").split("?")[0]);
  const fp = path.join(ROOT, p === "/" ? "/index.html" : p);
  if (fp !== ROOT && !fp.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(fp, (e, buf) => {
    if (e) { res.writeHead(404).end(); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(fp)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(buf);
  });
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const udd = fs.mkdtempSync("/tmp/crash-shotline-");
const chrome = spawn("google-chrome", ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--mute-audio",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-webgl", "--ignore-gpu-blocklist",
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${udd}`, "--window-size=1000,760", "about:blank"],
  { stdio: "ignore", detached: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function done(code) { try { server.close(); } catch {} try { process.kill(-chrome.pid, "SIGKILL"); } catch {} try { fs.rmSync(udd, { recursive: true, force: true }); } catch {} process.exit(code); }
setTimeout(() => { console.log("TIMED-OUT"); done(2); }, 120000).unref();
let ws0 = null;
for (let i = 0; i < 80 && !ws0; i++) {
  try { const ts = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); const p = ts.find((t) => t.type === "page"); if (p) ws0 = p.webSocketDebuggerUrl; } catch {}
  await sleep(250);
}
if (!ws0) { console.log("no target"); done(2); }
const ws = new WebSocket(ws0);
let id = 0; const pending = new Map(); const lines = [];
const send = (m, p = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
let hit = null;
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); return; }
  if (m.method === "Runtime.consoleAPICalled") {
    const t = (m.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ");
    lines.push(t);
    if (!hit && RE.test(t)) hit = Date.now();
  }
});
await new Promise((r, j) => { ws.addEventListener("open", r); ws.addEventListener("error", j); });
await send("Page.enable"); await send("Runtime.enable");
if (process.env.PHONE) {   // PHONE=1: the viewport a phone player has
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "pointer", value: "coarse" }, { name: "hover", value: "none" }] });
}
await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?${query}` });
for (let i = 0; i < 400 && !hit; i++) await sleep(50);
if (!hit) { console.log(`no line matching ${reIn}; saw ${lines.length} lines`); done(1); }
await sleep(DELAY);
const shot = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(out, Buffer.from(shot.data, "base64"));
console.log(`shot ${DELAY} ms after "${reIn}" -> ${out} (${lines.length} console lines)`);
console.log("last lines:", JSON.stringify(lines.slice(-4)));
done(0);
