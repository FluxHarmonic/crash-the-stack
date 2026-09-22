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
//               origin; no LOOK or HUD since the polish row, rulings D32
//               and D34) with the title reveal running (P3d: the first
//               key or tap skips it and reaches no entry, so the arm skips
//               and waits for "crash: title settled" before navigating);
//               a tap on the row under DEPTH (D48's entry, in LOOK's slot)
//               is a tap on nothing: the menu stays, no line; a tap at CARDS' center
//               -> "crash: menu chose cards" and the card table's boot line
//   boot        with ?cards: "crash: cards seed S moves 0 draw 1 scoring vegas" and the first legal
//               move's centers; the bar line's readout box (the score, the
//               bounty row under it) ends left of the ? button (nothing
//               draws under the button, David's laptop read 2026-09-20)
//               move's centers, "crash: cards first SX SY DX DY"
//   render      the table region is drawn: many lit pixels in several bins
//   draw        a tap on the stock, at the center the "crash: cards stock X Y"
//               boot line gives -> "crash: cards drew 1"
//   two-tap     a tap at the first move's source -> "crash: cards select ...",
//               a tap at its destination -> "crash: cards moved 2"
//   undo        a tap on the UNDO control -> "crash: cards undo 1"
//   keys        the same move by keys, from the deal (Backspace first undoes
//               the draw, whose waste card had shifted the tags): the two
//               tags the boot line "crash: cards tags TS TD" gives, typed
//               -> "crash: cards moved 1" (gate leg 7 on the web build; the
//               PILES model and its half of this sub-arm went on 2026-09-18)
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
const planned = ["menu", "boot", "render", "draw", "two-tap", "undo", "keys", "tools", "probe", "traced", "reload", "won", "console"];
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

// ---- no leaked chrome ----------------------------------------------------------
// A headless chrome from an earlier run (its user-data-dir under
// /tmp/crash-verify-*) once outlived the arm by hours with its GPU process
// at several cores (David, 2026-09-18). Refuse to start while a leaked
// one is alive, and kill this run's chrome as a whole process group on EVERY
// way out: normal, a failed assertion, the whole-run timeout, SIGINT,
// SIGTERM (what `timeout` sends), SIGHUP, an uncaught exception.
// A LEAKED chrome is one whose arm is gone (reparented to init) or
// older than any arm run (STALE_S); another arm running right now on
// its own ports beside this one is not a leak and is only noted.
const STALE_S = 600;
function leakedVerifyChromes() {
  const out = [], running = [];
  const hz = 100, uptime = parseFloat(fs.readFileSync("/proc/uptime", "utf8"));
  for (const pid of fs.readdirSync("/proc").filter((n) => /^\d+$/.test(n))) {
    let cmd = "", stat = "";
    try { cmd = fs.readFileSync(`/proc/${pid}/cmdline`, "utf8").split("\0").join(" "); stat = fs.readFileSync(`/proc/${pid}/stat`, "utf8"); } catch { continue; }
    const m = cmd.match(/--user-data-dir=(\/tmp\/crash-verify-[^ ]+)/);
    if (!m || !/chrome/.test(cmd) || /--type=/.test(cmd)) continue;
    const fields = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
    const ppid = Number(fields[1]), ageS = uptime - Number(fields[19]) / hz;
    const entry = { pid: Number(pid), dir: m[1], ppid, ageS: Math.round(ageS) };
    if (ppid === 1 || ageS > STALE_S) out.push(entry); else running.push(entry);
  }
  return { leaked: out, running };
}
{
  const { leaked, running } = leakedVerifyChromes();
  if (leaked.length) {
    console.log(`SETUP-FAILED: a chrome from an earlier run is still alive: ${leaked.map((c) => `pid ${c.pid} (${c.dir}, ${c.ageS} s, parent ${c.ppid})`).join(", ")}; kill it (kill -- -<pid> takes its helpers too) and rerun`);
    process.exit(2);
  }
  if (running.length) console.log(`note: another arm's chrome is running beside this one: ${running.map((c) => `pid ${c.pid} (${c.dir})`).join(", ")}`);
}

const udd = fs.mkdtempSync("/tmp/crash-verify-cards-chrome-");
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--mute-audio",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--enable-webgl", "--ignore-gpu-blocklist",
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${udd}`,
  PHONE ? "--window-size=390,844" : "--window-size=1000,760", "about:blank",
], { stdio: "ignore", detached: true, env: { ...process.env, PULSE_SINK: "worker-null", PIPEWIRE_NODE: "worker-null" } });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// The one way out. chrome was spawned detached, so -chrome.pid is its
// process group: the browser and every helper (GPU, renderers) go
// together, whether or not the browser process is still there.
function killChromeGroup(sig) {
  try { process.kill(-chrome.pid, sig); } catch { /* already gone */ }
}
let exiting = false;
function shutdown(code) {
  if (exiting) return; exiting = true;
  try { server.close(); } catch { /* not listening */ }
  killChromeGroup("SIGTERM");
  let tries = 0;
  const rm = () => {
    try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* still being written */ }
    if (fs.existsSync(udd) && ++tries < 15) { setTimeout(rm, 200); return; }
    if (fs.existsSync(udd)) console.log(`note: profile dir left behind: ${udd}`);
    process.exit(code);
  };
  setTimeout(() => { killChromeGroup("SIGKILL"); rm(); }, 2000).unref();
  const onExit = () => { rm(); };
  if (chrome.exitCode !== null) onExit(); else chrome.once("exit", onExit);
}
// The last line of defense runs synchronously as the process exits, so
// a chrome never outlives the arm whatever path led here.
process.on("exit", () => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } });
process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));
process.on("SIGHUP", () => shutdown(129));
process.on("unhandledRejection", (err) => { console.log("EXCEPTION: " + (err && err.stack || err)); dump(); shutdown(2); });
process.on("uncaughtException", (err) => { console.log("EXCEPTION: " + (err && err.stack || err)); dump(); shutdown(2); });
const WHOLE_RUN_MS = 240000;
setTimeout(() => { console.log(`TIMED-OUT whole run after ${WHOLE_RUN_MS} ms; did not run: ${notRun().join(" ")}`); dump(); shutdown(2); }, WHOLE_RUN_MS).unref();

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
if (PHONE) {
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  // a phone: a coarse pointer that cannot hover, and touch, so the table
  // starts with its tags hidden (David's rule) and the arm shows them
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "pointer", value: "coarse" }, { name: "hover", value: "none" }] });
} else {
  await send("Emulation.setDeviceMetricsOverride", { width: 1000, height: 760, deviceScaleFactor: 2, mobile: false });
  // a desktop with a mouse (headless Chrome otherwise reports hover: none,
  // which the page reads as a touch screen; P1's finding)
  await send("Emulation.setEmulatedMedia", { features: [{ name: "pointer", value: "fine" }, { name: "hover", value: "hover" }] });
}

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

// The service worker's activation races the first page's fetches (P3's
// finding, and D40 starts them at swReady + 750 ms): a loader-side
// "image fetch failed" console.error whose fetch the game then landed is
// the loader's line, not the game's. As verify-field.mjs does (P3c,
// bb6e8b5): the first page waits for the worker to control it before the
// second boot, and in the console leg a raced loader line with no
// "crash: texture missing" after it is a note, not a failure; the page's
// own "crash: tune-unavailable NAME" is a console.log the arm never
// counted, and its retry is asserted by the boot's audio step.
let swWaited = false;
async function waitForWorker() {
  if (swWaited) return; swWaited = true;
  const ok = await evalJS(`(async () => { if (!navigator.serviceWorker) return "none"; const t0 = Date.now(); while (Date.now() - t0 < 15000) { const r = await navigator.serviceWorker.getRegistration(); if (r && r.active && navigator.serviceWorker.controller) return "controlling"; await new Promise((res) => setTimeout(res, 100)); } return "timeout"; })()`);
  console.log(`note: service worker ${ok}`);
}

// ---- menu -------------------------------------------------------------------
// The real menu (P4, D14/D19): the top screen is JACK IN / FREE PLAY /
// SETTINGS / CREDITS (no CONTINUE on a fresh origin); DEFRAG lives under
// FREE PLAY. The menu's line is "crash: menu SCREEN ID X Y ...", once
// per screen shown.
function parseMenu(text) {
  const parts = text.split(" ");
  const entries = {};
  for (let i = 1; i + 2 < parts.length; i += 3) entries[parts[i]] = [parts[i + 1], parts[i + 2]];
  return { screen: parts[0], entries };
}
await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace` });
const menu = await waitLine(/^crash: menu (.+)$/, 0, 20000);
if (!menu) { fail("menu", "no \"crash: menu\" line within 20 s"); timedOut("menu"); await new Promise(() => {}); }
{
  const top = parseMenu(menu.m[1]);
  const entries = top.entries;
  const ids = Object.keys(entries).join(",");
  if (top.screen !== "top") fail("menu", `the first menu line is for screen ${top.screen}, not top`);
  else if (!entries["free-play"] || !entries["jack-in"] || !entries.settings || !entries.credits) fail("menu", `expected jack-in, free-play, settings and credits entries, got ${ids}`);
  else if (entries.continue) fail("menu", `a fresh origin has nothing to CONTINUE, got ${ids}`);
  else if (entries.stack || entries.cards) fail("menu", `the tables are under FREE PLAY, not on the top screen: ${ids}`);
  else {
    await sleep(800);
    // By keys first (David, 2026-09-17: Enter on CARDS threw on a build in
    // progress): ArrowDown to FREE PLAY, Enter opens it, ArrowDown to
    // DEFRAG, Enter picks it; the table must boot and draw a frame with
    // no error.
    async function menuKey(k) {
      await evalJS(`document.dispatchEvent(new KeyboardEvent("keydown", { key: ${JSON.stringify(k)}, bubbles: true, cancelable: true }))`);
      await sleep(40);
      await evalJS(`document.dispatchEvent(new KeyboardEvent("keyup", { key: ${JSON.stringify(k)}, bubbles: true, cancelable: true }))`);
      await sleep(150);
    }
    let m0 = consoleLines.length;
    // the title reveal runs on a menu boot (P3d): the first key skips it
    // and reaches no entry, by design; so skip, wait for the settle, then
    // navigate
    // the gate first (D42): one key opens it, the next skips the reveal
    if (await waitLine(/^crash: title gate /, 0, 20000)) { await menuKey("ArrowUp"); await waitLine(/^crash: title connect$/, 0, 3000); }
    // then the publisher card (D43): a key skips it once its strip is up
    if (await waitLine(/^crash: title card tick /, 0, 20000)) { await menuKey("ArrowUp"); await waitLine(/^crash: title card done /, 0, 3000); }   // D45: the card waits for the boot under the meter
    await menuKey("ArrowUp");
    // and the boot's steps must be done before the menu is live (D40)
    if (!(await waitLine(/^crash: boot done /, 0, 20000))) fail("menu", "no \"crash: boot done\" within 20 s of the boot");
    const settledT = await waitLine(/^crash: title settled /, 0, 5000);
    if (!settledT) fail("menu", "a key during the title reveal did not settle it");
    m0 = consoleLines.length;
    await menuKey("ArrowDown"); await menuKey("Enter");
    const freeK = await waitLine(/^crash: menu free (.+)$/, m0, 3000);
    // D66: DEFRAG opens the game's screen; its first row, NEW BOARD, deals
    await menuKey("ArrowDown"); await menuKey("Enter");
    const gameK = await waitLine(/^crash: menu free-cards (.+)$/, m0, 3000);
    if (gameK) await menuKey("Enter");
    const choseK = await waitLine(/^crash: menu chose (\w+)$/, m0, 3000);
    const bootedK = choseK && await waitLine(/^crash: cards seed /, m0, 5000);
    await sleep(600);
    const errorsAfterKeys = consoleErrors.length + consoleLines.slice(m0).filter((l) => /^Error:/.test(l)).length;
    if (!freeK) fail("menu", "ArrowDown, Enter did not open FREE PLAY (no \"crash: menu free\" line)");
    else if (!gameK) fail("menu", "ArrowDown, Enter on FREE PLAY did not open DEFRAG's screen (no \"crash: menu free-cards\" line)");
    else if (!choseK) fail("menu", "no \"crash: menu chose\" line after Enter on NEW BOARD");
    else if (choseK.m[1] !== "cards") fail("menu", `keys: expected chose cards, got ${choseK.m[0]}`);
    else if (!bootedK) fail("menu", "keys chose cards but no card-table boot line followed");
    else if (errorsAfterKeys > 0) fail("menu", `keys booted the table with ${errorsAfterKeys} error line(s) in the console`);
    else {
      // then by tap, from the menu again (?fresh so the CONTINUE entry does not shift the rows)
      await waitForWorker();
      await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&fresh` });
      const menu2 = await waitLine(/^crash: menu (.+)$/, consoleLines.length, 20000);
      let lookDetail0 = "";
      const top2 = menu2 ? parseMenu(menu2.m[1]) : { screen: "", entries: {} };
      await sleep(800);
      // the reveal again (a fresh process): a key skips it before the taps
      if (await waitLine(/^crash: title gate /, menu2 ? menu2.index : 0, 20000)) { await menuKey("ArrowUp"); await waitLine(/^crash: title connect$/, menu2 ? menu2.index : 0, 3000); }
      if (await waitLine(/^crash: title card tick /, menu2 ? menu2.index : 0, 20000)) { await menuKey("ArrowUp"); await waitLine(/^crash: title card done /, menu2 ? menu2.index : 0, 3000); }
      await menuKey("ArrowUp");
      if (!(await waitLine(/^crash: boot done /, menu2 ? menu2.index : 0, 20000))) lookDetail0 = "no boot done line on the second boot";
      if (!(await waitLine(/^crash: title settled /, menu2 ? menu2.index : 0, 5000))) lookDetail0 = "a key during the second reveal did not settle it";
      m0 = consoleLines.length;
      let lookDetail = lookDetail0;
      const shown = Object.keys(top2.entries);
      let free2 = null;
      if (shown.some((id) => id === "look" || id === "hud" || id === "depth")) lookDetail = `the menu still shows ${shown.join(" ")}`;
      else if (shown.join(" ") !== "jack-in free-play tracker settings credits") lookDetail = `the fresh menu's entries are ${shown.join(" ")}, not jack-in free-play tracker settings credits`;   // TRACKER on the top screen (David, 2026-09-22)
      else {
        // a tap on FREE PLAY opens it: its rows are said once
        await tap(top2.entries["free-play"][0], top2.entries["free-play"][1]);
        const freeLine = await waitLine(/^crash: menu (free .+)$/, m0, 3000);
        if (!freeLine) lookDetail = "a tap on FREE PLAY opened no FREE PLAY screen";
        else {
          free2 = parseMenu(freeLine.m[1]).entries;
          const rows = Object.keys(free2).map((k) => k.split("=")[0]);
          if (rows.join(" ") !== "stack cards code scores back") lookDetail = `FREE PLAY's rows are ${rows.join(" ")}`;   // D66: the games, ENTER CODE, HIGH SCORES
          else {
            // 32 px per row: the row under BACK is empty (above the band)
            await sleep(300);
            m0 = consoleLines.length;
            await tap(free2.back[0], parseFloat(free2.back[1]) + 32);
            await sleep(600);
            const stray = consoleLines.slice(m0).filter((l) => /^crash: (look|depth|menu chose|menu top|cards seed|seed) /.test(l));
            if (stray.length) lookDetail = `a tap on the empty row under BACK did something: ${stray[0]}`;
          }
        }
      }
      m0 = consoleLines.length;
      if (lookDetail) fail("menu", lookDetail);
      else if (!free2.cards) fail("menu", "no DEFRAG row on FREE PLAY");
      else {
        // D66: the tap on DEFRAG opens its screen; the tap on NEW BOARD deals
        await tap(free2.cards[0], free2.cards[1]);
        const gameLine = await waitLine(/^crash: menu (free-cards .+)$/, m0, 3000);
        const game = gameLine ? parseMenu(gameLine.m[1]).entries : {};
        if (game["new-board"]) await tap(game["new-board"][0], game["new-board"][1]);
        const chose = await waitLine(/^crash: menu chose (\w+)$/, m0, 3000);
        const booted = chose && await waitLine(/^crash: cards seed /, m0, 5000);
        if (!chose) fail("menu", "no \"crash: menu chose\" line after a tap on DEFRAG");
        else if (chose.m[1] !== "cards") fail("menu", `expected chose cards, got ${chose.m[0]}`);
        else if (!booted) fail("menu", "chose cards but no card-table boot line followed");
        else pass("menu", `top ${ids}; ArrowDown+Enter twice -> ${choseK.m[0]} (no errors); FREE PLAY's rows as ruled, the row under BACK empty; tap on DEFRAG -> ${chose.m[0]}, the table booted`);
      }
    }
  }
}

// ---- boot -------------------------------------------------------------------
const URL = `http://127.0.0.1:${PORT}/index.html?trace&cards&fresh&seed=${SEED}`;
const bootMark = consoleLines.length;
await send("Page.navigate", { url: URL });
const BOOT_RE = /^crash: cards seed (\d+) moves (\d+) draw (\d+) scoring (\w+)$/;
const boot = await waitLine(BOOT_RE, bootMark, 20000);
if (!boot) { fail("boot", "no card-table boot line within 20 s"); timedOut("boot"); await new Promise(() => {}); }
// from the boot line on, not the navigate: the previous page's "cards first" can land after the navigate
const first = await waitLine(/^crash: cards first (?:(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+)|none)$/, boot.index, 3000);
if (boot.m[2] !== "0") fail("boot", `expected a fresh deal (moves 0), got moves ${boot.m[2]}`);
else if (!first) fail("boot", "no \"crash: cards first\" line");
else if (!first.m[1]) fail("boot", `seed ${SEED} deals no legal move; pick another --seed`);
else {
  // the score readout and the bounty row under it are right-aligned to
  // the bar line's readout box, which must end left of the ? button
  const bar = await waitLine(/^crash: bar meter (-?\d+) (-?\d+) (\d+) (\d+) readout (-?\d+) (-?\d+) (\d+) (\d+)$/, 0, 2000);
  const keys = await waitLine(/^crash: control keys (-?[\d.]+) (-?[\d.]+)$/, 0, 2000);
  if (!bar || !keys) fail("boot", "no \"crash: bar\" or \"crash: control keys\" line on the card table");
  else if (parseInt(bar.m[5], 10) + parseInt(bar.m[7], 10) > Math.round(keys.m[1]) - 12 - 2) fail("boot", `the readout box ends at ${parseInt(bar.m[5], 10) + parseInt(bar.m[7], 10)}, under the ? button (left edge ${Math.round(keys.m[1]) - 12})`);
  else pass("boot", `seed ${boot.m[1]} moves 0 draw ${boot.m[3]}; first move (${first.m[1]},${first.m[2]}) -> (${first.m[3]},${first.m[4]}); the readout box ends at ${parseInt(bar.m[5], 10) + parseInt(bar.m[7], 10)}, left of the ? button`);
}
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
  // On the phone viewport a fresh deal starts with the tags hidden (a
  // touch screen); Space shows them for the second picture, then hides
  // them again so the rest of the arm runs as it would.
  // the tags are hidden on a touch screen at boot: Space shows them for a
  // second picture, then hides them again
  const shownAtBoot = await waitLine(/^crash: cards tagsshown (on|off) /, bootMark, 2000);
  if (shownAtBoot && shownAtBoot.m[1] === "off") {
    const space = async (t) => evalJS(`document.dispatchEvent(new KeyboardEvent(${JSON.stringify(t)}, { key: " ", bubbles: true, cancelable: true }))`);
    await space("keydown"); await sleep(40); await space("keyup"); await sleep(400);
    const tagsShot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(SHOT.replace(/\.png$/, "") + "-tags.png", Buffer.from(tagsShot.data, "base64"));
    await space("keydown"); await sleep(40); await space("keyup"); await sleep(200);
  }
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

// ---- undo: ROLLBACK through the tool stack (ruling D33) --------------------------
// A tool through the pointer path: tap the corner button ("crash: control
// tool X Y"), wait for the stack to open and print its entries, tap the
// named one, wait for the stack to close. Answers "" or what went wrong.
async function tool(name) {
  const btn = await waitLine(/^crash: control tool (-?[\d.]+) (-?[\d.]+)$/, bootMark, 2000);
  if (!btn) return "no \"crash: control tool\" boot line";
  const from = consoleLines.length;
  await tap(btn.m[1], btn.m[2]);
  const open = await waitLine(/^crash: tools open$/, from, 2000);
  if (!open) return "the tool button opened no stack";
  const entry = await waitLine(new RegExp(`^crash: tool ${name} (-?[\\d.]+) (-?[\\d.]+) (on|off)$`), from, 2000);
  if (!entry) return `no "crash: tool ${name}" entry line`;
  if (entry.m[3] !== "on") return `the ${name} tool is disabled`;
  await sleep(350);
  const before = consoleLines.length;
  await tap(entry.m[1], entry.m[2]);
  const closed = await waitLine(/^crash: tools closed$/, before, 2000);
  if (!closed) return `the ${name} entry did not close the stack`;
  return "";
}
{
  mark = consoleLines.length;
  const err = await tool("undo");
  const undo = err ? null : await waitLine(/^crash: cards undo (\d+)$/, mark, 3000);
  if (err) fail("undo", `ROLLBACK through the tool stack: ${err}`);
  else if (!undo) fail("undo", "no \"crash: cards undo\" line after the ROLLBACK tool");
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
    // a touch screen starts every launch with the tags hidden (headless
    // Chrome reads as one whatever the emulated media say; the boot line
    // "crash: cards tagsshown on|off" is the game's own word); Tab shows them
    // (Space is the tool stack's, D33)
    const shown = await waitLine(/^crash: cards tagsshown (on|off) /, bootMark, 2000);
    if (shown && shown.m[1] === "off") await press("Tab");
    mark = consoleLines.length;
    await type(tags.m[1]); await type(tags.m[2]);
    const moved = back && await waitLine(/^crash: cards moved (\d+)$/, mark, 3000);
    if (!back) { /* reported */ }
    else if (!moved) fail("keys", `typed ${tags.m[1]} ${tags.m[2]}, no "crash: cards moved" line`);
    else pass("keys", `tags ${tags.m[1]} ${tags.m[2]} -> ${moved.m[0]}`);
  }
}

// ---- probe ---------------------------------------------------------------------------------
// A tap on PROBE: the table says which move it shows ("crash: cards probe
// hint SRC DST"), or that there is none ("crash: cards probe none"; the
// arm's seed 1 has no known line, so the solver runs to its budget here,
// spread over frames: the time it takes is printed, the wasm build's
// solver speed).
// ---- tools: the stack by keyboard (ruling D33) ----------------------------------------
// Space opens it; a pile key while it is open reaches no pile; P fires
// PULL (the draw count flips, "crash: cards draw 3") and closes it.
{
  let detail = "";
  mark = consoleLines.length;
  await press(" ");
  const open = await waitLine(/^crash: tools open$/, mark, 2000);
  if (!open) detail = "Space opened no stack";
  else {
    const before = consoleLines.length;
    await press("f");
    await sleep(200);
    if (consoleLines.slice(before).some((l) => /^crash: cards (drew|select)/.test(l))) detail = "F pulled with the stack open";
    else if (consoleLines.slice(before).some((l) => l === "crash: tools closed")) detail = "F closed the stack";
    else {
      mark = consoleLines.length;
      await press("p");
      const closed = await waitLine(/^crash: tools closed$/, mark, 2000);
      const draw3 = await waitLine(/^crash: cards draw (\d)$/, mark, 2000);
      if (!closed) detail = "P did not close the stack";
      else if (!draw3 || draw3.m[1] !== "3") detail = `P did not flip the pull to 3 (${draw3 ? draw3.m[0] : "no draw line"})`;
      else {
        // back to pull one, for the probe (it refuses pull three)
        mark = consoleLines.length;
        await press(" "); await sleep(150); await press("p");
        const draw1 = await waitLine(/^crash: cards draw 1$/, mark, 2000);
        if (!draw1) detail = "P again did not flip the pull back to 1";
      }
    }
  }
  if (detail) fail("tools", detail);
  else pass("tools", "Space opens, F is refused while open, P flips PULL and closes");
}

// ---- probe ---------------------------------------------------------------------------------
{
  mark = consoleLines.length;
  const err = await tool("probe");
  if (err) fail("probe", `PROBE through the tool stack: ${err}`);
  else {
    const t0 = Date.now();
    const hint = await waitLine(/^crash: cards probe (.+)$/, mark, 60000);
    if (!hint) fail("probe", "no \"crash: cards probe\" line within 60 s of a PROBE tap");
    else pass("probe", `${hint.m[0]} after ${Date.now() - t0} ms`);
  }
}

// ---- traced --------------------------------------------------------------------------------
{
  const UNDOS = 20;
  const stock2 = await waitLine(/^crash: cards stock (-?[\d.]+) (-?[\d.]+)$/, bootMark, 2000);
  if (!stock2) fail("traced", "no stock line to tap");
  else {
    mark = consoleLines.length;
    let ok = true;
    for (let i = 0; i < UNDOS && ok; i++) {
      const m0 = consoleLines.length;
      await tap(stock2.m[1], stock2.m[2]);
      const drew = await waitLine(/^crash: cards drew (\d+)$/, m0, 3000);
      const m1 = consoleLines.length;
      if (drew) await press("Backspace");
      const undo = drew && await waitLine(/^crash: cards undo (\d+)$/, m1, 3000);
      if (!undo) { ok = false; fail("traced", `pair ${i + 1}: ${drew ? "no undo line" : "no drew line"}`); }
    }
    if (ok) {
      const traced = await waitLine(/^crash: cards trace (\d+) twist counter 0 none$/, mark, 5000);
      if (!traced) fail("traced", `20 undos did not complete the trace (no "crash: cards trace N twist counter 0 none")`);
      else {
        const ice = await waitLine(/^crash: cards ice (\w+)$/, traced.index, 15000);
        if (!ice) fail("traced", `${traced.m[0]}, but no counter-hack within 15 s`);
        else if (!["encrypt", "corrupt", "churn"].includes(ice.m[1])) fail("traced", `expected a member of the card table's set to land, got ${ice.m[0]}`);
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
  const datum = `(crash-cards 2 (seed . 1) (draw . 1) (passes . 0) (moves . 0) (tableau ((12 . #t)) () () () () () ()) (foundations (${spades.join(" ")}) (${found(1).join(" ")}) (${found(2).join(" ")}) (${found(3).join(" ")})) (stock) (waste) (selected . #f) (rng . 1) (score vegas -47 0) (scrambles . 1) (corrupt . #f) (trace twist trace 0 0 0 0 0 0 #f #f 0) (settings #t))`;
  // Written at pagehide, after the running table's last frame: its own
  // save (due on a clock boundary every 5 s) once landed between an
  // immediate write and the navigation, and the page restored the keys
  // sub-arm's deal instead (2026-09-18: "restored moves 1" where "moves
  // 0" was expected).
  await evalJS(`window.addEventListener("pagehide", () => localStorage.setItem("cards", ${JSON.stringify(datum)}))`);
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
{
  // and the browser's own "Failed to load resource: net::ERR_FAILED" for a fetch
  // the page then retried (a tune: a "crash: music landed" line after it)
  const ambientLanded = consoleLines.some((l) => /^crash: music landed /.test(l));
  const raced = consoleErrors.filter((e) => /image fetch failed/.test(e) || (ambientLanded && /Failed to load resource: net::ERR_FAILED/.test(e)));
  const missing = consoleLines.filter((l) => /^crash: texture missing/.test(l));
  if (raced.length && !missing.length) {
    console.log(`note: ${raced.length} loader "image fetch failed" line(s) on the service-worker race; the game's retry landed (no "crash: texture missing")`);
    for (const e of raced) consoleErrors.splice(consoleErrors.indexOf(e), 1);
  }
}
if (consoleErrors.length === 0 && runtimeErrors.length === 0) pass("console", `${consoleLines.length} console lines, 0 errors`);
else fail("console", consoleErrors.concat(runtimeErrors.slice(0, 5).map((l) => "runtime: " + l)).join(" | "));

const failed = results.filter((r) => r[1] === "FAIL").length;
console.log(`RESULT: ${results.length - failed} passed, ${failed} failed`);
if (failed) dump();
shutdown(failed ? 1 : 0);
