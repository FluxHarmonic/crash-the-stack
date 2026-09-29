// webgl-check.mjs - the page's WebGL 2 check (Phantom Burn's scripts/webgl-check.mjs,
// with --ready started and --line added) in headless Chrome: with WebGL
// off the player gets the message and the wasm never loads; with it on the
// game boots and there is no message.
//
//   node scripts/webgl-check.mjs --url BASE --mode off|webgl1|late|on
//                                [--query Q] [--ready RE|started] [--wait MS]
//                                [--line RE] [--no-sw] [--shot OUT.png]
//
// BASE is the game's page on a server that is already running (e.g.
// verify-site's server on a staged tree: http://127.0.0.1:PORT/jack-in/).
// --ready started waits for SigilWebApp.started instead of a console line.
// --line RE: a console line matching RE must also appear (waited for, up
// to --wait more). Console lines read "TYPE: TEXT" (log, warn, error, ...).
// --no-sw: the page must have no service worker registered at the end.
// Modes:
//   off     Chrome started with --disable-webgl: no "webgl2", no "webgl".
//           Expect: #sub-webgl with data-webgl "none"; the loader's tag
//           switched off (data-substratic-off); no wasm and no bridges
//           requested; no SigilWebApp; no "Failed to start" on the page.
//   webgl1  an init script makes getContext("webgl2") null on every canvas
//           (WebGL 1 still there). Expect the same, with data-webgl "webgl1".
//   late    an init script makes getContext("webgl2") null on the game's
//           canvas (#stage) only, so the page's probe passes, the wasm boots
//           and the game fails to get its context. Expect: #sub-webgl with
//           data-webgl "late" and no "Failed to start" left on the page.
//   on      the positive control. Expect: the game's ready line (--ready, a
//           regex, or "started"; default "started"), the wasm requested, no
//           #sub-webgl, and SigilWebApp started.
// Each check is printed ("ok" or "FAIL" and what it saw); the last line is
// "PASS MODE" (exit 0), "FAIL MODE" (exit 1), or SETUP-FAILED / TIMED-OUT
// (exit 2). The page's state and console go to stdout on a failure.
//
// Headless and silent: --mute-audio and PULSE_SINK=worker-null (the audio
// rule; see shot-web.mjs).
import fs from "node:fs";
import { spawn, execFileSync } from "node:child_process";

const args = process.argv.slice(2);
// the last occurrence wins, so a caller can append an override
const opt = (name, dflt) => { const i = args.lastIndexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const BASE = opt("--url");
const MODE = opt("--mode");
const QUERY = opt("--query", "");
const READY_OPT = opt("--ready", "started");
const READY = READY_OPT === "started" ? null : new RegExp(READY_OPT);
const LINE = opt("--line") ? new RegExp(opt("--line")) : null;
const NO_SW = args.includes("--no-sw");
const WAIT = parseInt(opt("--wait", "4000"), 10);
if (!BASE || !["off", "webgl1", "late", "on"].includes(MODE)) {
  console.log("SETUP-FAILED: usage: webgl-check.mjs --url BASE --mode off|webgl1|late|on [--query Q] [--ready RE] [--wait MS] [--shot OUT.png]");
  process.exit(2);
}

// getContext("webgl2") (and its old alias) answers null: on every canvas for
// webgl1, on #stage alone for late. OffscreenCanvas too, for webgl1.
const INIT = {
  webgl1: `(() => { const no = (k) => /^(webgl2|experimental-webgl2)$/.test(String(k));
    for (const C of [HTMLCanvasElement, self.OffscreenCanvas].filter(Boolean)) {
      const g = C.prototype.getContext;
      C.prototype.getContext = function (k, o) { return no(k) ? null : g.call(this, k, o); };
    } })();`,
  late: `(() => { const g = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (k, o) {
      return this.id === "stage" && /^(webgl2|experimental-webgl2)$/.test(String(k)) ? null : g.call(this, k, o); }; })();`,
}[MODE];

const udd = fs.mkdtempSync("/tmp/webgl-check-chrome-");
try {
  const sinks = execFileSync("pactl", ["list", "short", "sinks"], { encoding: "utf8" });
  if (!/\bworker-null\b/.test(sinks)) execFileSync("pactl", ["load-module", "module-null-sink", "sink_name=worker-null"]);
} catch { /* no pulse here */ }
const gl = MODE === "off"
  ? ["--disable-webgl", "--disable-webgl2"]
  : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"];
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--mute-audio", ...gl,
  "--remote-debugging-port=0", `--user-data-dir=${udd}`, "--window-size=960,540", "about:blank",
], { stdio: "ignore", detached: true, env: { ...process.env, PULSE_SINK: "worker-null" } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function killChromeGroup(sig) { try { process.kill(-chrome.pid, sig); } catch { /* gone */ } }
const lines = [], requests = [];
let exiting = false;
function shutdown(code) {
  if (exiting) return; exiting = true;
  killChromeGroup("SIGTERM");
  setTimeout(() => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } process.exit(code); }, 600);
}
process.on("exit", () => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } });
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, () => shutdown(130));
setTimeout(() => {
  console.log(`TIMED-OUT after 150 s in mode ${MODE}; console: ${JSON.stringify(lines.slice(0, 20))}; requests: ${requests.length}`);
  shutdown(2);
}, 150000).unref();

// Chrome picks its own DevTools port and writes it to DevToolsActivePort in
// its profile, so this Chrome is the one driven, whatever else is running
let pageWs = null, CDP = 0;
for (let i = 0; i < 80 && !pageWs; i++) {
  try { if (!CDP) CDP = parseInt(fs.readFileSync(udd + "/DevToolsActivePort", "utf8").split("\n")[0], 10) || 0; } catch { /* not written yet */ }
  if (CDP) try { const ts = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); const p = ts.find((t) => t.type === "page"); if (p && p.webSocketDebuggerUrl) pageWs = p.webSocketDebuggerUrl; } catch { /* not up yet */ }
  await sleep(250);
}
if (!pageWs) { console.log("SETUP-FAILED: no chrome page target"); shutdown(2); await new Promise(() => {}); }
const ws = new WebSocket(pageWs);
let msgId = 0; const pending = new Map();
function send(method, params = {}) {
  return new Promise((res, rej) => { const id = ++msgId; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
}
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); return; }
  if (msg.method === "Runtime.consoleAPICalled") lines.push(msg.params.type + ": " + (msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" "));
  if (msg.method === "Runtime.exceptionThrown") lines.push("exception: " + (msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text));
  if (msg.method === "Network.requestWillBeSent") requests.push(msg.params.request.url);
});
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
if (INIT) await send("Page.addScriptToEvaluateOnNewDocument", { source: INIT });
async function evalJS(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}

const url = QUERY ? `${BASE}?${QUERY}` : BASE;
await send("Page.navigate", { url });
// wait: for the ready line (on), for the message (the rest), then WAIT more,
// so a late request or a late "Failed to start" has time to show
const t0 = Date.now();
while (Date.now() - t0 < 90000) {
  if (MODE === "on" ? (READY ? lines.some((l) => READY.test(l)) : await evalJS("!!(window.SigilWebApp && window.SigilWebApp.started)").catch(() => false))
      : await evalJS("!!document.getElementById('sub-webgl')").catch(() => false)) break;
  await sleep(100);
}
if (LINE) { const t1 = Date.now(); while (Date.now() - t1 < WAIT && !lines.some((l) => LINE.test(l))) await sleep(200); }
else await sleep(WAIT);
const st = await evalJS(`(() => {
  const box = document.getElementById("sub-webgl");
  const a = box && box.querySelector("a");
  const r = box && box.getBoundingClientRect();
  return {
    panel: box ? box.getAttribute("data-webgl") : null,
    text: box ? box.innerText : "",
    link: a ? a.href : "",
    visible: !!(r && r.width > 100 && r.height > 50 && getComputedStyle(box).visibility !== "hidden" && getComputedStyle(box).display !== "none"),
    loaderOff: document.querySelectorAll('script[data-substratic-off]').length,
    loader: !!globalThis.SigilWebApp,
    started: !!(globalThis.SigilWebApp && globalThis.SigilWebApp.started),
    failedText: /Failed to start|sigil_wasm_start failed/.test(document.body.innerText),
    body: document.body.innerText.slice(0, 400),
  };
})()`).catch((e) => ({ error: String(e) }));
const shot = opt("--shot");
if (shot) {
  const png = await send("Page.captureScreenshot", { format: "png" }).catch(() => null);
  if (png) fs.writeFileSync(shot, Buffer.from(png.data, "base64"));
}

let fails = 0;
const check = (cond, what) => { if (cond) console.log(`  ok   ${what}`); else { fails++; console.log(`  FAIL ${what}`); } };
const wasmReqs = requests.filter((u) => /\.wasm(\?|$)/.test(u));
const bridgeReqs = requests.filter((u) => /sigil-wasm-bridges\.js(\?|$)/.test(u));
if (st.error) { console.log(`SETUP-FAILED: reading the page: ${st.error}`); shutdown(2); await new Promise(() => {}); }
if (!requests.some((u) => u.startsWith(BASE.replace(/\?.*$/, "")))) { console.log(`SETUP-FAILED: the page ${url} was never requested`); shutdown(2); await new Promise(() => {}); }
if (MODE === "off" || MODE === "webgl1") {
  const want = MODE === "off" ? "none" : "webgl1";
  check(st.panel === want, `the message is up with data-webgl "${want}" (got ${JSON.stringify(st.panel)})`);
  check(st.visible, "the message is visible (over 100 x 50 px, not hidden)");
  check(/needs WebGL 2/.test(st.text) && /get\.webgl\.org\/webgl2/.test(st.text), "it says the game needs WebGL 2 and names get.webgl.org/webgl2");
  check(st.link === "https://get.webgl.org/webgl2/", `its link goes to https://get.webgl.org/webgl2/ (got ${st.link || "none"})`);
  check(st.loaderOff === 1, `the loader's tag was switched off (${st.loaderOff} marked)`);
  check(!st.loader, "the loader never ran (no SigilWebApp)");
  check(wasmReqs.length === 0 && bridgeReqs.length === 0, `no wasm and no bridges requested (${wasmReqs.length} wasm, ${bridgeReqs.length} bridges)`);
  check(!st.failedText, "no \"Failed to start\" on the page");
} else if (MODE === "late") {
  check(st.panel === "late", `the message is up with data-webgl "late" (got ${JSON.stringify(st.panel)})`);
  check(st.visible, "the message is visible");
  check(/couldn.t give the \w+ a WebGL 2 context/.test(st.text), "it gives the late reason (a context the game could not get)");
  check(wasmReqs.length >= 1, `the wasm was requested (the probe passed: ${wasmReqs.length})`);
  check(lines.some((l) => /no WebGL2 context/.test(l)), "the game said \"no WebGL2 context\"");
  check(!st.failedText, "no \"Failed to start\" left on the page");
} else {
  if (READY) check(lines.some((l) => READY.test(l)), `the game is ready (${READY})`);
  check(st.panel === null, `no message (got ${JSON.stringify(st.panel)})`);
  check(st.loaderOff === 0, "the loader's tag was left alone");
  check(st.started, "SigilWebApp started");
  check(wasmReqs.length >= 1, `the wasm was requested (${wasmReqs.length})`);
}
if (LINE) check(lines.some((l) => LINE.test(l)), `the console said ${LINE}`);
if (NO_SW) {
  const regs = await evalJS("navigator.serviceWorker ? navigator.serviceWorker.getRegistrations().then((rs) => rs.map((r) => r.scope)) : []").catch((e) => ["(could not read: " + e.message + ")"]);
  check(Array.isArray(regs) && regs.length === 0, `no service worker registered (${JSON.stringify(regs)})`);
}
if (fails) {
  console.log("page: " + JSON.stringify(st));
  console.log("console: " + JSON.stringify(lines.slice(0, 30)));
  console.log("requests: " + JSON.stringify(requests.map((u) => u.replace(/^https?:\/\/[^/]+/, "")).slice(0, 40)));
}
console.log(`${fails ? "FAIL" : "PASS"} ${MODE}`);
shutdown(fails ? 1 : 0);
