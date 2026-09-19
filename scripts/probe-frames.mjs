// scripts/probe-frames.mjs - the ?ms pump line across a board -> menu return.
//
//   node scripts/probe-frames.mjs build/web [--phone] [--windows N] [--port P] [--cdp C]
//
// Boots the web build in a headless Chrome (SwiftShader, as verify.mjs
// does) on ?trace&stack&ms&seed=1&fresh, lets N frame-ms windows (120
// frames each) go by on the board, presses Escape, lets N go by on the
// menu, and prints every "crash: frame-ms" and "crash: worst-frame" line
// with the box's load average beside it. A measurement, not a gate: the
// menu-return leg of verify.mjs asserts one window each side; this shows
// the shape (David, 2026-09-20: "going back to the menu screen from a
// game causes the music to slow down"). The first window's gc columns
// are zero by construction (the window's start is its own baseline).
//
// Silent: launch it with PULSE_SINK=worker-null in the environment
// (procedures/headless-native-drive-with-xvfb, "Arms and drives are silent").
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const ROOT = path.resolve(args.find((a) => !a.startsWith("--") && fs.existsSync(path.join(a, "index.html"))) || "build/web");
const PHONE = flag("--phone");
const WINDOWS = parseInt(opt("--windows", "3"), 10);
const PORT = parseInt(opt("--port", "8197"), 10);
const CDP = parseInt(opt("--cdp", "9337"), 10);
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".wasm": "application/wasm", ".json": "application/json", ".png": "image/png", ".pcm": "application/octet-stream", ".webmanifest": "application/manifest+json" };

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const fp = path.join(ROOT, urlPath === "/" ? "/index.html" : urlPath);
  if (fp !== ROOT && !fp.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404).end("not found"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(fp)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(buf);
  });
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const udd = fs.mkdtempSync("/tmp/crash-probe-chrome-");
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--autoplay-policy=no-user-gesture-required", "--enable-webgl", "--ignore-gpu-blocklist",
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${udd}`,
  PHONE ? "--window-size=390,844" : "--window-size=1000,760", "about:blank",
], { stdio: "ignore", detached: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stop = (code) => { try { process.kill(-chrome.pid, "SIGKILL"); } catch {} try { fs.rmSync(udd, { recursive: true, force: true }); } catch {} try { server.close(); } catch {} process.exit(code); };
process.on("SIGINT", () => stop(130));
process.on("exit", () => { try { process.kill(-chrome.pid, "SIGKILL"); } catch {} try { fs.rmSync(udd, { recursive: true, force: true }); } catch {} });

let pageWs = null;
for (let i = 0; i < 80 && !pageWs; i++) {
  try { const ts = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); const p = ts.find((t) => t.type === "page"); if (p && p.webSocketDebuggerUrl) pageWs = p.webSocketDebuggerUrl; } catch {}
  await sleep(250);
}
if (!pageWs) { console.log("no chrome page target"); stop(2); }
const ws = new WebSocket(pageWs);
let msgId = 0; const pending = new Map(); const lines = [];
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++msgId; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); return; }
  if (msg.method === "Runtime.consoleAPICalled") {
    const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ");
    lines.push(text); if (process.env.PROBE_ALL) console.log("  > " + text.slice(0, 200));
    if (msg.params.type === "error" || /rror/.test(text)) console.log(`  ! ${text.slice(0, 300)}`);
    if (/^crash: (frame-ms|menu-ms|worst-frame|ambient|boot done|menu continue)/.test(text)) console.log(`${new Date().toISOString().slice(11, 19)} load ${os.loadavg()[0].toFixed(1)}  ${text}`);
  }
});
await new Promise((r) => ws.addEventListener("open", r));
await send("Runtime.enable");
ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.method === "Runtime.exceptionThrown") console.log("  ! exception " + JSON.stringify(m.params.exceptionDetails).slice(0, 400)); });
const evalJS = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
const waitLine = async (re, from, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { for (let i = from; i < lines.length; i++) { const m = lines[i].match(re); if (m) return { m, index: i }; } await sleep(50); } return null; };
const press = async (k) => { for (const type of ["keydown", "keyup"]) { await evalJS(`document.dispatchEvent(new KeyboardEvent(${JSON.stringify(type)}, { key: ${JSON.stringify(k)}, bubbles: true, cancelable: true }))`); await sleep(40); } };
const windows = async (n, from) => { let at = from; for (let i = 0; i < n; i++) { const l = await waitLine(/^crash: frame-ms /, at, 90000); if (!l) { console.log("no frame-ms line within 90 s"); return at; } at = l.index + 1; } return at; };

console.log(`probe: ${ROOT} ${PHONE ? "phone" : "desktop"} viewport, ${WINDOWS} windows a side, load ${os.loadavg().map((x) => x.toFixed(1)).join(" ")}`);
await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?${process.env.PROBE_QUERY || "trace&stack&ms&seed=1&fresh"}` });
if (!(await waitLine(/^crash: boot done /, 0, 60000))) { console.log("no boot done"); stop(1); }
console.log("--- the board");
let at = await windows(WINDOWS, 0);
console.log("--- Escape");
await press("Escape");
if (!(await waitLine(/^crash: menu continue /, at, 5000))) { console.log("no menu"); stop(1); }
console.log("--- the menu");
at = await windows(WINDOWS, at);
console.log("--- Enter (CONTINUE)");
await press("Enter");
console.log("--- the board again");
await windows(WINDOWS, at);
stop(0);
