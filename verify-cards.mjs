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
//   menu        the page without ?cards or ?stack opens on the menu:
//               "crash: menu stack X Y cards X Y" (no CONTINUE on a fresh
//               origin); a tap at CARDS' center -> "crash: menu chose cards"
//               and the card table's boot line
//   boot        with ?cards: "crash: cards seed S moves 0 draw 1" and the first legal
//               move's centers, "crash: cards first SX SY DX DY"
//   render      the table region is drawn: many lit pixels in several bins
//   draw        a tap on the stock, at the center the "crash: cards stock X Y"
//               boot line gives -> "crash: cards drew 1"
//   two-tap     a tap at the first move's source -> "crash: cards select ...",
//               a tap at its destination -> "crash: cards moved 2"
//   undo        a tap on the UNDO control -> "crash: cards undo 1"
//   keys        the same move by keys, from the deal (Backspace first undoes
//               the draw, whose waste card had shifted the tags): in TAGS the
//               two tags the boot line "crash: cards tags TS TD" gives, typed
//               -> "crash: cards moved 1"; Backspace undoes; Tab -> "crash:
//               cards model piles"; then the two letters "crash: cards keys
//               KS KD" gives -> "moved 1" again (gate leg 7 on the web build)
//   traced      UNDOS pairs of a tap on the stock and a tap on UNDO (each
//               undo costs UNDO-COST 10; 20 of them reach TRACE-AT 200) ->
//               "crash: cards trace 200 twist counter 0 none" and, within
//               ICE-FIRST + 5 s, "crash: cards ice NAME" with NAME one of the
//               table's members (the phase machine on the card table)
//   reload      the page is reloaded and the deal comes back from
//               localStorage: "crash: cards restored moves 1" (the keys
//               sub-arm's last move)
//   won         a save with every card on a foundation but the king of spades,
//               face up on pile 0, is written to localStorage and the page
//               reloaded: the deal restores, auto-complete arms at once
//               ("crash: cards auto"), the king goes up ("crash: cards won
//               moves 1"), and the cascade moves: two canvas samples 400 ms
//               apart differ in the board region (gate leg 4 on the web build,
//               and the cascade's presence)
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
const planned = ["menu", "boot", "render", "draw", "two-tap", "undo", "keys", "traced", "reload", "won", "console"];
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
  // Chrome can still be flushing its profile when "exit" fires (ENOTEMPTY
  // on the rmdir, seen 2026-09-17); the directory is scratch, so a failed
  // removal must not turn a green arm's exit code red (verify.mjs guards
  // the same way).
  chrome.on("exit", () => { try { fs.rmSync(udd, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (e) { console.log(`note: profile dir left behind: ${udd} (${e.code})`); } process.exit(code); });
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

// ---- menu -------------------------------------------------------------------
await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace` });
const menu = await waitLine(/^crash: menu (.+)$/, 0, 20000);
if (!menu) { fail("menu", "no \"crash: menu\" line within 20 s"); timedOut("menu"); await new Promise(() => {}); }
{
  const parts = menu.m[1].split(" ");
  const entries = {};
  for (let i = 0; i + 2 < parts.length; i += 3) entries[parts[i]] = [parts[i + 1], parts[i + 2]];
  const ids = Object.keys(entries).join(",");
  if (!entries.cards || !entries.stack) fail("menu", `expected stack and cards entries, got ${ids}`);
  else if (entries.continue) fail("menu", `a fresh origin has nothing to CONTINUE, got ${ids}`);
  else {
    await sleep(800);
    // By keys first (David, 2026-09-17: Enter on CARDS threw on a build in
    // progress): ArrowDown moves the highlight from STACK to CARDS, Enter
    // picks it; the table must boot and draw a frame with no error.
    async function menuKey(k) {
      await evalJS(`document.dispatchEvent(new KeyboardEvent("keydown", { key: ${JSON.stringify(k)}, bubbles: true, cancelable: true }))`);
      await sleep(40);
      await evalJS(`document.dispatchEvent(new KeyboardEvent("keyup", { key: ${JSON.stringify(k)}, bubbles: true, cancelable: true }))`);
      await sleep(150);
    }
    let m0 = consoleLines.length;
    await menuKey("ArrowDown"); await menuKey("Enter");
    const choseK = await waitLine(/^crash: menu chose (\w+)$/, m0, 3000);
    const bootedK = choseK && await waitLine(/^crash: cards seed /, m0, 5000);
    await sleep(600);
    const errorsAfterKeys = consoleErrors.length + consoleLines.slice(m0).filter((l) => /^Error:/.test(l)).length;
    if (!choseK) fail("menu", "no \"crash: menu chose\" line after ArrowDown, Enter");
    else if (choseK.m[1] !== "cards") fail("menu", `keys: expected chose cards, got ${choseK.m[0]}`);
    else if (!bootedK) fail("menu", "keys chose cards but no card-table boot line followed");
    else if (errorsAfterKeys > 0) fail("menu", `keys booted the table with ${errorsAfterKeys} error line(s) in the console`);
    else {
      // then by tap, from the menu again (?fresh so the CONTINUE entry does not shift CARDS)
      await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace` });
      const menu2 = await waitLine(/^crash: menu (.+)$/, consoleLines.length, 20000);
      const parts2 = menu2 ? menu2.m[1].split(" ") : [];
      const entries2 = {};
      for (let i = 0; i + 2 < parts2.length; i += 3) entries2[parts2[i]] = [parts2[i + 1], parts2[i + 2]];
      await sleep(800);
      m0 = consoleLines.length;
      if (!entries2.cards) fail("menu", "no CARDS entry on the second menu");
      else {
        await tap(entries2.cards[0], entries2.cards[1]);
        const chose = await waitLine(/^crash: menu chose (\w+)$/, m0, 3000);
        const booted = chose && await waitLine(/^crash: cards seed /, m0, 5000);
        if (!chose) fail("menu", "no \"crash: menu chose\" line after a tap on CARDS");
        else if (chose.m[1] !== "cards") fail("menu", `expected chose cards, got ${chose.m[0]}`);
        else if (!booted) fail("menu", "chose cards but no card-table boot line followed");
        else pass("menu", `entries ${ids}; ArrowDown+Enter -> ${choseK.m[0]} (no errors); tap on CARDS -> ${chose.m[0]}, table booted`);
      }
    }
  }
}

// ---- boot -------------------------------------------------------------------
const URL = `http://127.0.0.1:${PORT}/index.html?trace&cards&fresh&seed=${SEED}`;
const bootMark = consoleLines.length;
await send("Page.navigate", { url: URL });
const BOOT_RE = /^crash: cards seed (\d+) moves (\d+) draw (\d+)$/;
const boot = await waitLine(BOOT_RE, bootMark, 20000);
if (!boot) { fail("boot", "no card-table boot line within 20 s"); timedOut("boot"); await new Promise(() => {}); }
const first = await waitLine(/^crash: cards first (?:(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+)|none)$/, bootMark, 3000);
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
const stock = await waitLine(/^crash: cards stock (-?[\d.]+) (-?[\d.]+)$/, bootMark, 2000);
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
const ctl = await waitLine(/^crash: control undo (-?[\d.]+) (-?[\d.]+)$/, bootMark, 2000);
if (!ctl) fail("undo", "no \"crash: control undo\" boot line");
else {
  mark = consoleLines.length;
  await tap(ctl.m[1], ctl.m[2]);
  const undo = await waitLine(/^crash: cards undo (\d+)$/, mark, 3000);
  if (!undo) fail("undo", "no \"crash: cards undo\" line after a tap on UNDO");
  else if (undo.m[1] !== "1") fail("undo", `expected undo back to move 1, got "${undo.m[0]}"`);
  else pass("undo", undo.m[0]);
}

// ---- keys ------------------------------------------------------------------------------
async function key(type, k) {
  await evalJS(`document.dispatchEvent(new KeyboardEvent(${JSON.stringify(type)}, { key: ${JSON.stringify(k)}, bubbles: true, cancelable: true }))`);
}
async function press(k) { await key("keydown", k); await sleep(40); await key("keyup", k); await sleep(120); }
async function type(tag) { for (const ch of tag) await press(ch); }
{
  const tags = await waitLine(/^crash: cards tags (\S+) (\S+)$/, bootMark, 2000);
  if (!tags) fail("keys", "no \"crash: cards tags\" boot line");
  else if (tags.m[1] === "-" || tags.m[2] === "-") fail("keys", `a place of the first move has no tag: ${tags.m[0]}`);
  else {
    // The tags were assigned at the deal; the draw put a card on the waste
    // and every tag after it shifted. Undo the draw first (Backspace with
    // nothing typed), back to the deal and its tags.
    mark = consoleLines.length;
    await press("Backspace");
    const back = await waitLine(/^crash: cards undo 0$/, mark, 3000);
    if (!back) fail("keys", "Backspace did not undo the draw back to move 0");
    mark = consoleLines.length;
    await type(tags.m[1]); await type(tags.m[2]);
    const moved = back && await waitLine(/^crash: cards moved (\d+)$/, mark, 3000);
    if (!back) { /* reported */ }
    else if (!moved) fail("keys", `typed ${tags.m[1]} ${tags.m[2]} in TAGS, no "crash: cards moved" line`);
    else {
      mark = consoleLines.length;
      await press("Backspace");
      const undo = await waitLine(/^crash: cards undo (\d+)$/, mark, 3000);
      mark = consoleLines.length;
      await press("Tab");
      const model = await waitLine(/^crash: cards model (\w+)$/, mark, 3000);
      if (!undo) fail("keys", "Backspace produced no undo line");
      else if (!model || model.m[1] !== "piles") fail("keys", `Tab did not switch to PILES: ${model ? model.m[0] : "no model line"}`);
      else {
        const keys = await waitLine(/^crash: cards keys (\S+) (\S+)$/, bootMark, 2000);
        const srcKey = keys ? keys.m[1] : "-", dstKey = keys ? keys.m[2] : "-";
        mark = consoleLines.length;
        await press(srcKey); await press(dstKey);
        const moved2 = await waitLine(/^crash: cards moved (\d+)$/, mark, 3000);
        if (!moved2) fail("keys", `PILES ${srcKey} ${dstKey}: no "crash: cards moved" line`);
        else pass("keys", `TAGS ${tags.m[1]} ${tags.m[2]} -> ${moved.m[0]}; undo; PILES ${srcKey} ${dstKey} -> ${moved2.m[0]}`);
      }
    }
  }
}

// ---- traced --------------------------------------------------------------------------------
{
  const UNDOS = 20;
  const stock2 = await waitLine(/^crash: cards stock (-?[\d.]+) (-?[\d.]+)$/, bootMark, 2000);
  const ctl2 = await waitLine(/^crash: control undo (-?[\d.]+) (-?[\d.]+)$/, bootMark, 2000);
  if (!stock2 || !ctl2) fail("traced", "no stock or UNDO control line to tap");
  else {
    mark = consoleLines.length;
    let ok = true;
    for (let i = 0; i < UNDOS && ok; i++) {
      const m0 = consoleLines.length;
      await tap(stock2.m[1], stock2.m[2]);
      const drew = await waitLine(/^crash: cards drew (\d+)$/, m0, 3000);
      const m1 = consoleLines.length;
      if (drew) await tap(ctl2.m[1], ctl2.m[2]);
      const undo = drew && await waitLine(/^crash: cards undo (\d+)$/, m1, 3000);
      if (!undo) { ok = false; fail("traced", `pair ${i + 1}: ${drew ? "no undo line" : "no drew line"}`); }
    }
    if (ok) {
      const traced = await waitLine(/^crash: cards trace (\d+) twist counter 0 none$/, mark, 5000);
      if (!traced) fail("traced", `20 undos did not complete the trace (no "crash: cards trace N twist counter 0 none")`);
      else {
        const ice = await waitLine(/^crash: cards ice (\w+)$/, traced.index, 15000);
        if (!ice) fail("traced", `${traced.m[0]}, but no counter-hack within 15 s`);
        else if (!["encrypt", "corrupt", "churn", "nothing"].includes(ice.m[1])) fail("traced", `unknown counter-hack ${ice.m[0]}`);
        else pass("traced", `${traced.m[0]}; ${ice.m[0]}`);
      }
    }
  }
}

// ---- reload --------------------------------------------------------------------------
mark = consoleLines.length;
await send("Page.navigate", { url: URL.replace("&fresh", "") });
const restored = await waitLine(/^crash: cards restored moves (\d+)$/, mark, 20000);
if (!restored) fail("reload", "no \"crash: cards restored\" line within 20 s of a reload");
else if (restored.m[1] !== "1") fail("reload", `expected the saved deal at move 1 (the keys sub-arm's last move), got "${restored.m[0]}"`);
else pass("reload", restored.m[0]);

// ---- won -----------------------------------------------------------------------------------
{
  // (crash cards save)'s datum, as (write) prints it: cards are 0..51 by
  // suit (S H D C) then rank; foundations top first.
  const found = (suit) => Array.from({ length: 13 }, (_, k) => suit * 13 + 12 - k);
  const spades = found(0).slice(1); // without the king (12), which sits on pile 0
  const datum = `(crash-cards 1 (seed . 1) (draw . 1) (passes . 0) (moves . 0) (tableau ((12 . #t)) () () () () () ()) (foundations (${spades.join(" ")}) (${found(1).join(" ")}) (${found(2).join(" ")}) (${found(3).join(" ")})) (stock) (waste) (selected . #f) (rng . 1) (score vegas -47 0) (scrambles . 1) (corrupt . #f) (trace twist trace 0 0 0 0 0 0 #f #f 0) (settings tags #t))`;
  await evalJS(`localStorage.setItem("cards", ${JSON.stringify(datum)})`);
  mark = consoleLines.length;
  await send("Page.navigate", { url: URL.replace("&fresh", "") });
  const restored = await waitLine(/^crash: cards restored moves 0$/, mark, 20000);
  const armed = restored && await waitLine(/^crash: cards auto$/, mark, 5000);
  const won = armed && await waitLine(/^crash: cards won moves (\d+)$/, mark, 5000);
  if (!restored) fail("won", "the near-won save did not restore (no \"crash: cards restored moves 0\")");
  else if (!armed) fail("won", "restored but auto-complete did not arm");
  else if (!won) fail("won", "armed but no \"crash: cards won\" line within 5 s");
  else {
    const sample = () => evalJS(`new Promise((resolve) => requestAnimationFrame(() => {
      const c = document.getElementById("stage");
      const off = document.createElement("canvas"); off.width = c.width; off.height = c.height;
      const g = off.getContext("2d"); g.drawImage(c, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let h = 0;
      for (let y = Math.floor(c.height * 0.3); y < Math.floor(c.height * 0.8); y += 3)
        for (let x = 0; x < c.width; x += 3) { const i = (y * c.width + x) * 4; h = (h * 31 + d[i] + d[i + 1] + d[i + 2]) | 0; }
      resolve(h);
    }))`);
    const a = await sample(); await sleep(400); const b = await sample();
    if (SHOT) {
      await sleep(600);
      const shot = await send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(SHOT.replace(/\.png$/, "") + "-won.png", Buffer.from(shot.data, "base64"));
    }
    if (a === b) fail("won", `${won.m[0]}, but the board region did not change over 400 ms (no cascade)`);
    else pass("won", `${won.m[0]}; the cascade moves (board hash ${a} -> ${b})`);
  }
}

// ---- console ---------------------------------------------------------------------------
// The runtime prints its own errors ("Error: ...", "Scheme error in
// frame: ...") through the WASI shim as plain console lines, not
// console.error, so they count here too (2026-09-17: a per-frame "=:
// expected number" left this sub-arm reading "0 errors").
const runtimeErrors = consoleLines.filter((l) => /^(Error:|Scheme error)/.test(l));
if (consoleErrors.length === 0 && runtimeErrors.length === 0) pass("console", `${consoleLines.length} console lines, 0 errors`);
else fail("console", consoleErrors.concat(runtimeErrors.slice(0, 5).map((l) => "runtime: " + l)).join(" | "));

const failed = results.filter((r) => r[1] === "FAIL").length;
console.log(`RESULT: ${results.length - failed} passed, ${failed} failed`);
if (failed) dump();
shutdown(failed ? 1 : 0);
