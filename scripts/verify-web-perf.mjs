// Music startup timings and fresh-window browser acceptance.
// node scripts/verify-web-perf.mjs build/web --port 18081 --cdp 19481 --output /tmp/perf.json
// --rate 4 applies CPU throttling; --profile-only supports the pre-reset baseline build.
// --interact selects a tile repeatedly and removes a pair with the device running.
// --isolated sends COOP/COEP to exercise the worklet path on localhost.
// Service workers are disabled here: this arm isolates audio, and the HTTP VPN
// preview has no service worker. General browser acceptance covers PWA behavior.
// Headless SwiftShader timings are comparative diagnostics, not phone benchmarks.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const VALUED = ["--port", "--cdp", "--rate", "--output"];
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && VALUED.includes(args[i - 1])));
const ROOT = path.resolve(positional[0] && fs.existsSync(path.join(positional[0], "index.html")) ? positional.shift() : "build/web");
const PORT = parseInt(opt("--port", "8100"), 10);
const CDP = parseInt(opt("--cdp", "9240"), 10);
const PROFILE_ONLY = flag("--profile-only");
const ISOLATED = flag("--isolated");
const AUDIO_DIAGNOSTICS = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').includes('page audio node ');
const OUTPUT = opt("--output", null);
const TYPES = { ".html": "text/html;charset=utf-8", ".js": "text/javascript;charset=utf-8",
  ".wasm": "application/wasm", ".json": "application/json;charset=utf-8",
  ".css": "text/css;charset=utf-8", ".png": "image/png", ".webmanifest": "application/manifest+json" };

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const fp = path.join(ROOT, urlPath === "/" ? "/index.html" : urlPath);
  if (fp !== ROOT && !fp.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404).end("not found: " + urlPath); return; }
    if (ISOLATED) { res.setHeader("Cross-Origin-Opener-Policy", "same-origin"); res.setHeader("Cross-Origin-Embedder-Policy", "require-corp"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(fp)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(buf);
  });
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const udd = fs.mkdtempSync("/tmp/crash-verify-ms-chrome-");
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--mute-audio",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--enable-webgl", "--ignore-gpu-blocklist",
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${udd}`,
  "--window-size=390,844", "about:blank",
], { stdio: "ignore", detached: true, env: { ...process.env, PULSE_SINK: "worker-null", PIPEWIRE_NODE: "worker-null" } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function killChromeGroup(sig) { try { process.kill(-chrome.pid, sig); } catch { /* gone */ } }
let exiting = false;
function shutdown(code) {
  if (exiting) return; exiting = true;
  try { server.close(); } catch { /* not listening */ }
  killChromeGroup("SIGTERM");
  setTimeout(() => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } process.exit(code); }, 1500).unref();
}
process.on("exit", () => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } });
process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));
process.on("uncaughtException", (err) => { console.log("EXCEPTION: " + (err && err.stack || err)); shutdown(2); });
process.on("unhandledRejection", (err) => { console.log("EXCEPTION: " + (err && err.stack || err)); shutdown(2); });

let pageWs = null;
for (let i = 0; i < 50 && !pageWs; i++) {
  try { const list = await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json(); const page = list.find((t) => t.type === "page"); if (page) pageWs = page.webSocketDebuggerUrl; } catch { /* not up */ }
  if (!pageWs) await sleep(200);
}
if (!pageWs) { console.log("SETUP-FAILED: no DevTools page target within 10 s"); shutdown(2); await new Promise(() => {}); }
const ws = new WebSocket(pageWs);
let msgId = 0; const pending = new Map();
const consoleLines = [];
const browserErrors = [];
function send(method, params = {}) {
  return new Promise((res, rej) => { const id = ++msgId; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
}
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); return; }
  if (msg.method === "Runtime.exceptionThrown") browserErrors.push(JSON.stringify(msg.params.exceptionDetails));
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") browserErrors.push(JSON.stringify(msg.params.args));
  if (msg.method === "Runtime.consoleAPICalled") consoleLines.push((msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" "));
});
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
await send("Page.enable"); await send("Runtime.enable");

await send('Page.addScriptToEvaluateOnNewDocument', {source: `
delete Navigator.prototype.serviceWorker;
window.audioOutput = {callbacks:[],nodes:[]};
const createProcessor=AudioContext.prototype.createScriptProcessor;
AudioContext.prototype.createScriptProcessor=function(...args) {
 const node=createProcessor.apply(this,args), ctx=this;
 audioOutput.nodes.push({mode:'scriptprocessor',size:node.bufferSize,rate:ctx.sampleRate});
 node.addEventListener('audioprocess',function(e) {
  audioOutput.callbacks.push({at:performance.now(),lead:1000*(e.playbackTime-ctx.currentTime),state:ctx.state});
 });
 return node;
};
if (window.AudioWorkletNode) {
 window.AudioWorkletNode=new Proxy(window.AudioWorkletNode,{construct(Ctor,args) {
  audioOutput.nodes.push({mode:'worklet',rate:args[0].sampleRate});
  return Reflect.construct(Ctor,args);
 }});
}
window.audioProfile = [];
window.glProfile = {};
for (const name of ['compileShader','linkProgram','texImage2D','drawArrays','drawElements']) {
 const fn=WebGL2RenderingContext.prototype[name];
 WebGL2RenderingContext.prototype[name]=function(...args) {
   const start=performance.now(); const result=fn.apply(this,args); const ms=performance.now()-start;
   const row=window.glProfile[name] ||= {count:0,total:0,max:0}; row.count++; row.total+=ms; row.max=Math.max(row.max,ms);
   return result;
 };
}
const profileLog = console.log;
console.log = function(...args) {
  if (/^crash: (track|ambient|worst-frame|boot|atlas|bg)/.test(args[0])) window.audioProfile.push({kind:'log', at:performance.now(), text:args.join(' ')});
  return profileLog.apply(this,args);
};
document.addEventListener('sigil-web-app-ready', function(e) {
  const app=e.detail, dispatch=app.dispatch;
  app.dispatch=function(type,payload) {
    const t=performance.now();
    const result=dispatch.call(this,type,payload);
    if (/^(track|audio-size|audio-chunk|audio-done)$/.test(type)) window.audioProfile.push({kind:type,at:t,ms:performance.now()-t,size:String(payload).length});
    return result;
  };
}, {once:true,capture:true});
new PerformanceObserver(list=>{ for(const e of list.getEntries()) window.audioProfile.push({kind:'longtask',at:e.startTime,ms:e.duration}); }).observe({entryTypes:['longtask']});
`});
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
await send('Emulation.setCPUThrottlingRate',{rate:Number(opt('--rate','1'))});
await send('Page.navigate',{url:'http://127.0.0.1:'+PORT+'/?stack&fresh&seed=7&bg=flow&ms&trace'});
const started=Date.now();
while (Date.now()-started<120000 && !(consoleLines.some(l=>/^crash: track breaker [0-9]+$/.test(l)) && consoleLines.includes('crash: ambient start'))) await sleep(250);
await sleep(2000);

if (!consoleLines.includes('crash: ambient start')) throw new Error('Music never started');
for (const [track, frames] of [['spy',3748608],['groove',3656448],['breaker',3628800]]) {
  if (!consoleLines.includes('crash: track '+track+' '+frames)) throw new Error('Incomplete track '+track);
}
await waitFor(()=>evaluate('!!window.SigilWasmAudio && SigilWasmAudio.contextSampleRate(1)>0'), 'audio context');
const stateBeforeGesture=await evaluate('SigilWasmAudio.contextState(1)');
await send('Runtime.evaluate',{expression:'SigilWebApp.dispatch("gesture", "perf-test")',userGesture:true});
await waitFor(()=>evaluate('SigilWasmAudio.contextState(1)===1'), 'running audio context');
console.log('PASS audio context running (before gesture: '+stateBeforeGesture+')');
await sleep(2000);
async function evaluate(expression) {
  const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function waitFor(predicate, description) {
  const start=Date.now();
  while (Date.now()-start<20000) { if (await predicate()) return; await sleep(50); }
  throw new Error('Timed out: '+description);
}
async function copyStats() {
  const mark=consoleLines.length;
  await evaluate('SigilWebApp.dispatch("stats", "copy")');
  await waitFor(()=>consoleLines.slice(mark).some(l=>l.startsWith('crash: clipboard ')), 'stats copy');
  await waitFor(()=>evaluate('!!document.getElementById("stats-overlay")'), 'stats overlay');
  return consoleLines.slice(mark).find(l=>l.startsWith('crash: clipboard ')).replaceAll('~','\n');
}
let interaction = null;
if (flag('--interact')) {
  const boot=consoleLines.map(l=>l.match(/^crash: seed (\d+) tiles (\d+) pair (\d+) (-?[\d.]+) (-?[\d.]+) (\d+) (-?[\d.]+) (-?[\d.]+)$/)).find(Boolean);
  if (!boot) throw new Error('No initial pair for interaction probe');
  const start=await evaluate('({at:performance.now(),under:SigilWasmAudio.sinkUnderruns(1),callbacks:audioOutput.callbacks.length})');
  const logStart=consoleLines.length;
  async function tap(x,y) {
    await evaluate(`(()=>{const c=document.getElementById('stage'),r=c.getBoundingClientRect();
      const scale=Math.min(c.width/640,c.height/400);
      const cx=r.left+((c.width-640*scale)/2+${x}*scale)*r.width/c.width;
      const cy=r.top+((c.height-400*scale)/2+${y}*scale)*r.height/c.height;
      c.dispatchEvent(new PointerEvent('pointerdown',{clientX:cx,clientY:cy,bubbles:true,cancelable:true,pointerType:'touch',isPrimary:true}));})()`);
    await sleep(350);
  }
  for(let i=0;i<6;i++) await tap(boot[4],boot[5]);
  await tap(boot[4],boot[5]); await tap(boot[7],boot[8]);
  await sleep(1500);
  interaction=await evaluate('({at:performance.now(),under:SigilWasmAudio.sinkUnderruns(1),callbacks:audioOutput.callbacks.slice('+start.callbacks+')})');
  interaction.start=start; interaction.logs=consoleLines.slice(logStart);
  if (!interaction.logs.some(l=>l.startsWith('crash: removed '))) throw new Error('Interaction probe did not remove its pair');
  console.log('PASS interaction probe: repeated selection and pair removal');
}
const data=await evaluate('({events:window.audioProfile,gl:window.glProfile,stats:window.crashPageStats(),audio:window.audioOutput,underruns:SigilWasmAudio.sinkUnderruns(1),isolated:crossOriginIsolated})');
data.audioStateBeforeGesture=stateBeforeGesture;
data.interaction=interaction;
if (ISOLATED && !data.audio.nodes.some(n=>n.mode==='worklet')) throw new Error('Isolated run did not use a worklet');
if (!ISOLATED && (!data.audio.nodes.some(n=>n.mode==='scriptprocessor') || !data.audio.callbacks.length)) throw new Error('Fallback output did not process any audio');
console.log('PASS all three complete music tracks loaded and playback started');
if (!PROFILE_ONLY) {
  const startup=await copyStats();
  if (!startup.includes('window startup')) throw new Error('Missing startup window label');
  await evaluate('[...document.querySelectorAll("#stats-overlay button")].find(b=>b.textContent==="Reset & close").click()');
  await waitFor(()=>consoleLines.includes('crash: stats reset 1'), 'first reset');
  if (await evaluate('!!document.getElementById("stats-overlay")')) throw new Error('Reset did not close overlay');
  await sleep(3500);
  const fresh=await copyStats();
  const page=await evaluate('crashPageStats()');
  const header=fresh.match(/samples (\d+) over ([\d.]+) s/);
  const callbacks=page.match(/page callbacks over 16.7 ms \d+ of (\d+)/);
  if (!fresh.includes('window reset-1') || !header || Number(header[1])===0) throw new Error('Fresh window has no new samples');
  if (Number(header[2])>10) throw new Error('Fresh window retained old elapsed time');
  if (!callbacks || Math.abs(Number(callbacks[1])-Number(header[1]))>3) throw new Error('Page and game sample counts disagree: '+page+' '+header);
  for (const field of ['flush','boot','count']) if (!fresh.includes('\n'+field+' mean ')) throw new Error('Missing '+field+' timing');
  if (!page.includes('music settled 3/3 failed 0 loading none') || !page.includes('audio-upload (no samples)')) throw new Error('Reset lost load status or kept old upload samples');
  if (AUDIO_DIAGNOSTICS) {
    const mode=ISOLATED?'worklet':'scriptprocessor';
    if (!page.includes('audio node '+mode+' state running')) throw new Error('Report did not identify the running output node');
    if (!fresh.match(/audio state running rate \d+ starved-frames \d+/)) throw new Error('Report lacks audio starvation data');
    if (!ISOLATED && page.includes('audio-callback-gap (no samples)')) throw new Error('Fresh output callback samples missing');
  }
  data.startup=startup; data.fresh=fresh; data.freshPage=page;
  data.audioAfterReset=await evaluate('({state:SigilWasmAudio.contextState(1),underruns:SigilWasmAudio.sinkUnderruns(1),callbacks:audioOutput.callbacks.slice(-100)})');
  console.log('PASS reset button: fresh window, no old uploads, aligned page/game counts, new phase timings');
  await evaluate('crashResetStats()');
  await waitFor(()=>consoleLines.includes('crash: stats reset 2'), 'second reset');
  await sleep(500);
  if (!(await copyStats()).includes('window reset-2')) throw new Error('Second reset failed');
  console.log('PASS repeated reset');
}
const runtimeErrors=consoleLines.filter(l=>/^(Error: |Scheme error|crash: texture missing)|sokol\[level=[01]\]/.test(l));
data.errors={browserErrors,runtimeErrors};
if (OUTPUT) fs.writeFileSync(OUTPUT,JSON.stringify(data,null,2)+'\n');
if (browserErrors.length || runtimeErrors.length) throw new Error(JSON.stringify({browserErrors,runtimeErrors}));
for (const kind of ['audio-size','audio-chunk','audio-done']) {
 const samples=data.events.filter(e=>e.kind===kind).map(e=>e.ms);
 if (samples.length) console.log(kind+' count '+samples.length+' mean '+(samples.reduce((a,b)=>a+b,0)/samples.length).toFixed(1)+' max '+Math.max(...samples).toFixed(1));
}
console.log('PASS no runtime or GL errors');
shutdown(0);
