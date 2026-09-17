// verify-cards.mjs - gate leg 8 (P2), the browser arm for the card table.
//
//   node verify-cards.mjs [build/web] [--port N] [--cdp N] [--phone] [--seed N]
//                         [--shot PATH]
//
// The same harness as verify.mjs (loopback server, headless Chrome on
// SwiftShader, the DevTools Protocol, taps as PointerEvents in CSS pixels
// computed from virtual coordinates through the letterbox), opened with
// ?cards so the web shell boots the Klondike table, and these sub-arms:
//
//   boot        "crash: cards seed S moves 0 draw 1" and the first legal
//               move's centers, "crash: cards first SX SY DX DY"
//   render      the table region is drawn: many lit pixels in several bins
//   draw        a tap on the stock, at the center the "crash: cards stock X Y"
//               boot line gives -> "crash: cards drew 1"
//   two-tap     a tap at the first move's source -> "crash: cards select ...",
//               a tap at its destination -> "crash: cards moved 2"
//   undo        a tap on the UNDO control -> "crash: cards undo 1"
//   reload      the page is reloaded and the deal comes back from
//               localStorage: "crash: cards restored moves 1"
//   console     zero error-level console entries and zero exceptions
//
// Every sub-arm anchors on a line the passing path of the OTHER arm cannot
// produce ("crash: cards ..." is printed only by the card table). A wait
// that runs out prints TIMED-OUT with everything collected and exits 2.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const VALUED = ["--shot", "--port", "--cdp", "--seed"];
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && VALUED.includes(args[i - 1])));
const ROOT = path.resolve(positional[0] || "build/web");
const SHOT = opt("--shot", null);
const PORT = parseInt(opt("--port", "8097"), 10);
const CDP = parseInt(opt("--cdp", "9237"), 10);
const SEED = opt("--seed", "1");
const PHONE = flag("--phone");

const VW = 640, VH = 400;
const TYPES = { ".html": "text/html;charset=utf-8", ".js": "text/javascript;charset=utf-8",
  ".wasm": "application/wasm", ".json": "application/json;charset=utf-8",
  ".css": "text/css;charset=utf-8", ".png": "image/png", ".webmanifest": "application/manifest+json" };

const results = [];
const planned = ["boot", "render", "draw", "two-tap", "undo", "reload", "console"];
function pass(name, detail) { results.push([name, "PASS"]); console.log(`PASS ${name}${detail ? ": " + detail : ""}`); }
function fail(name, detail) { results.push([name, "FAIL"]); console.log(`FAIL ${name}: ${detail}`); }
function notRun() { const done = new Set(results.map((r) => r[0])); return planned.filter((p) => !done.has(p)); }

if (!fs.existsSync(path.join(ROOT, "index.html"))) { console.log(`SETUP-FAILED: ${ROOT}/index.html missing`); process.exit(2); }

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

const udd = fs.mkdtempSync("/tmp/crash-verify-cards-chrome-");
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--enable-webgl", "--ignore-gpu-blocklist",
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${udd}`,
  PHONE ? "--window-size=390,844" : "--window-size=1000,760", "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let exiting = false;
function shutdown(code) {
  if (exiting) return; exiting = true;
  server.close();
  chrome.on("exit", () => { fs.rmSync(udd, { recursive: true, force: true }); process.exit(code); });
  chrome.kill("SIGTERM");
  setTimeout(() => { chrome.kill("SIGKILL"); }, 3000).unref();
}
process.on("SIGINT", () => shutdown(130));

let pageWs = null;
for (let i = 0; i < 50 && !pageWs; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json();
    const page = list.find((t) => t.type === "page");
    if (page) pageWs = page.webSocketDebuggerUrl;
  } catch { /* chrome not up yet */ }
  if (!pageWs) await sleep(200);
}
if (!pageWs) { console.log("SETUP-FAILED: no DevTools page target within 10 s"); shutdown(2); await new Promise(() => {}); }

const ws = new WebSocket(pageWs);
let msgId = 0; const pending = new Map();
const consoleLines = [];
const consoleErrors = [];
function send(method, params = {}) {
  return new Promise((res, rej) => { const id = ++msgId; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
}
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); return; }
  if (msg.method === "Runtime.consoleAPICalled") {
    const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ");
    consoleLines.push(text);
    if (msg.params.type === "error") consoleErrors.push("console.error: " + text);
  }
  if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") consoleErrors.push("log: " + msg.params.entry.text);
  if (msg.method === "Runtime.exceptionThrown") consoleErrors.push("exception: " + (msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text));
});
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable");
if (PHONE) await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
else await send("Emulation.setDeviceMetricsOverride", { width: 1000, height: 760, deviceScaleFactor: 2, mobile: false });

async function evalJS(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
async function waitLine(re, from, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    for (let i = from; i < consoleLines.length; i++) { const m = consoleLines[i].match(re); if (m) return { m, index: i }; }
    await sleep(50);
  }
  return null;
}
function dump() {
  console.log("--- console lines ---"); consoleLines.forEach((l) => console.log("  " + l));
  console.log("--- console errors ---"); consoleErrors.forEach((l) => console.log("  " + l));
}
function timedOut(name) {
  console.log(`TIMED-OUT ${name}; did not run: ${notRun().filter((n) => n !== name).join(" ")}`);
  dump(); shutdown(2);
}
async function tap(vx, vy) {
  return evalJS(`(() => {
    const c = document.getElementById("stage"); const r = c.getBoundingClientRect();
    const scale = Math.min(c.width / ${VW}, c.height / ${VH});
    const ox = (c.width - ${VW} * scale) / 2, oy = (c.height - ${VH} * scale) / 2;
    const bx = ox + ${vx} * scale, by = oy + ${vy} * scale;
    const cx = r.left + bx * r.width / c.width, cy = r.top + by * r.height / c.height;
    c.dispatchEvent(new PointerEvent("pointerdown", { clientX: cx, clientY: cy, bubbles: true, cancelable: true, pointerType: "touch", isPrimary: true }));
    return { cx, cy };
  })()`);
}

// ---- boot -------------------------------------------------------------------
const URL = `http://127.0.0.1:${PORT}/index.html?trace&cards&seed=${SEED}`;
await send("Page.navigate", { url: URL });
const BOOT_RE = /^crash: cards seed (\d+) moves (\d+) draw (\d+)$/;
const boot = await waitLine(BOOT_RE, 0, 20000);
if (!boot) { fail("boot", "no card-table boot line within 20 s"); timedOut("boot"); await new Promise(() => {}); }
const first = await waitLine(/^crash: cards first (?:(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+)|none)$/, 0, 3000);
if (boot.m[2] !== "0") fail("boot", `expected a fresh deal (moves 0), got moves ${boot.m[2]}`);
else if (!first) fail("boot", "no \"crash: cards first\" line");
else if (!first.m[1]) fail("boot", `seed ${SEED} deals no legal move; pick another --seed`);
else pass("boot", `seed ${boot.m[1]} moves 0 draw ${boot.m[3]}; first move (${first.m[1]},${first.m[2]}) -> (${first.m[3]},${first.m[4]})`);
await sleep(1500);

// ---- render -------------------------------------------------------------------
const px = await evalJS(`new Promise((resolve) => requestAnimationFrame(() => {
  const c = document.getElementById("stage");
  const off = document.createElement("canvas"); off.width = c.width; off.height = c.height;
  const g = off.getContext("2d"); g.drawImage(c, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  const x0 = Math.floor(c.width * 0.1), x1 = Math.floor(c.width * 0.9);
  const y0 = Math.floor(c.height * 0.1), y1 = Math.floor(c.height * 0.8);
  let lit = 0, total = 0; const colors = new Set();
  for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
    const i = (y * c.width + x) * 4; const r = d[i], gg = d[i + 1], b = d[i + 2]; total++;
    if (r + gg + b > 120) { lit++; colors.add(((r >> 5) << 6) | ((gg >> 5) << 3) | (b >> 5)); }
  }
  resolve({ lit, total, colors: colors.size, w: c.width, h: c.height });
}))`);
if (px.lit > px.total * 0.15 && px.colors >= 5) pass("render", `${px.lit}/${px.total} sampled pixels lit, ${px.colors} color bins, buffer ${px.w}x${px.h}`);
else fail("render", `lit ${px.lit}/${px.total}, color bins ${px.colors}, buffer ${px.w}x${px.h}`);
if (SHOT) {
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(SHOT, Buffer.from(shot.data, "base64"));
}

// ---- draw ---------------------------------------------------------------------
let mark = consoleLines.length;
const stock = await waitLine(/^crash: cards stock (-?[\d.]+) (-?[\d.]+)$/, 0, 2000);
let drew = null;
if (!stock) fail("draw", "no \"crash: cards stock\" boot line");
else { await tap(stock.m[1], stock.m[2]); drew = await waitLine(/^crash: cards drew (\d+)$/, mark, 3000); }
if (!stock) { /* reported */ }
else if (!drew) fail("draw", "no \"crash: cards drew\" line within 3 s of a tap on the stock");
else if (drew.m[1] !== "1") fail("draw", `expected drew 1 under draw one, got "${drew.m[0]}"`);
else pass("draw", drew.m[0]);

// ---- two-tap -------------------------------------------------------------------
// The first legal move at the deal is still legal after one draw (a draw
// changes only the stock and the waste; the move named at boot came from a
// pile or the waste, and a waste source would now be under the drawn card,
// so the shell names pile sources first).
if (first && first.m[1]) {
  mark = consoleLines.length;
  await tap(first.m[1], first.m[2]);
  const sel = await waitLine(/^crash: cards select (.+)$/, mark, 3000);
  if (!sel) fail("two-tap", "no \"crash: cards select\" line after the first tap");
  else {
    mark = consoleLines.length;
    await tap(first.m[3], first.m[4]);
    const moved = await waitLine(/^crash: cards moved (\d+)$/, mark, 3000);
    if (!moved) fail("two-tap", `selected ${sel.m[1]}, then no "crash: cards moved" line after the second tap`);
    else if (moved.m[1] !== "2") fail("two-tap", `expected moved 2 (the draw was move 1), got "${moved.m[0]}"`);
    else pass("two-tap", `select ${sel.m[1]}; ${moved.m[0]}`);
  }
} else fail("two-tap", "no first move to play");

// ---- undo ------------------------------------------------------------------------
const ctl = await waitLine(/^crash: control undo (-?[\d.]+) (-?[\d.]+)$/, 0, 2000);
if (!ctl) fail("undo", "no \"crash: control undo\" boot line");
else {
  mark = consoleLines.length;
  await tap(ctl.m[1], ctl.m[2]);
  const undo = await waitLine(/^crash: cards undo (\d+)$/, mark, 3000);
  if (!undo) fail("undo", "no \"crash: cards undo\" line after a tap on UNDO");
  else if (undo.m[1] !== "1") fail("undo", `expected undo back to move 1, got "${undo.m[0]}"`);
  else pass("undo", undo.m[0]);
}

// ---- reload --------------------------------------------------------------------------
mark = consoleLines.length;
await send("Page.navigate", { url: URL });
const restored = await waitLine(/^crash: cards restored moves (\d+)$/, mark, 20000);
if (!restored) fail("reload", "no \"crash: cards restored\" line within 20 s of a reload");
else if (restored.m[1] !== "1") fail("reload", `expected the saved deal at move 1, got "${restored.m[0]}"`);
else pass("reload", restored.m[0]);

// ---- console ---------------------------------------------------------------------------
if (consoleErrors.length === 0) pass("console", `${consoleLines.length} console lines, 0 errors`);
else fail("console", consoleErrors.join(" | "));

const failed = results.filter((r) => r[1] === "FAIL").length;
console.log(`RESULT: ${results.length - failed} passed, ${failed} failed`);
if (failed) dump();
shutdown(failed ? 1 : 0);
