// Real CDP mouse/touch/keyboard checks against a runner-built CHECKSUM.
// node verify-checksum.mjs build/web [--phone|--portrait] [--dock center|right] [--shot PATH] [--url URL]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { parseDeals, solve } from './scripts/checksum-solve.mjs';
import { BrowserBoard, packetCenter } from './scripts/checksum-browser-model.mjs';
import { requireHealthyDealAudio } from './scripts/checksum-audio-gate.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const ROOT = path.resolve(args[0] || 'build/web');
const PORTRAIT = args.includes('--portrait');
const PHONE = args.includes('--phone') || PORTRAIT;
const DOCK = opt('--dock', 'center');
const THROTTLE = Number(opt('--throttle', '4'));
assert.ok(['center', 'right'].includes(DOCK), 'recognized horizontal dock');
const PORT = Number(opt('--port', '8115'));
const CDP = Number(opt('--cdp', '9335'));
const SHOT = opt('--shot', null);
const DEALS = opt('--deals', null);
const expectedDeals = DEALS ? parseDeals(fs.readFileSync(DEALS, 'utf8')) : [];
const audioNegative = opt('--audio-negative', null);
if (audioNegative) {
  const captured = fs.readFileSync(audioNegative, 'utf8').split('\n').find(line => line.startsWith('AUDIO-DIAGNOSTIC: '));
  assert.ok(captured, 'actual captured audible failure exists');
  assert.throws(() => requireHealthyDealAudio(JSON.parse(captured.slice('AUDIO-DIAGNOSTIC: '.length))),
    /no stream may lose sounding output frames|active music ring may not run dry/);
  console.log('AUDIO-CONTROL: captured 431365a audible failure still rejected');
}
const BASE = opt('--url', `http://127.0.0.1:${PORT}/`);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const lines = [], errors = [], results = [];
let chrome, profile, server, ws;
function cleanup() {
  if (chrome?.pid) { try { process.kill(-chrome.pid, 'SIGKILL'); } catch {} }
  try { ws?.close(); } catch {}
  try { server?.close(); } catch {}
  if (profile) { try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} }
}
process.on('exit', cleanup);
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'])
  process.on(signal, () => { cleanup(); process.exit(2); });
const watchdog = setTimeout(() => {
  console.error('TIMED-OUT CHECKSUM browser arm');
  console.error(lines.slice(-25).join('\n'));
  cleanup(); process.exit(2);
}, 1_800_000);
watchdog.unref();

try {
  if (!args.includes('--url')) {
    assert.ok(fs.existsSync(path.join(ROOT, 'index.html')), 'served build exists');
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm',
      '.png': 'image/png', '.json': 'application/json', '.css': 'text/css' };
    server = http.createServer((req, res) => {
      const pathname = decodeURIComponent(new URL(req.url, BASE).pathname);
      const file = path.resolve(ROOT, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
      fs.readFile(file, (error, bytes) => {
        if (error) { res.writeHead(404).end(); return; }
        res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream',
          'Cache-Control': 'no-store', 'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp' }).end(bytes);
      });
    });
    await new Promise((resolve, reject) => {
      server.once('error', reject); server.listen(PORT, '127.0.0.1', resolve);
    });
  }
  profile = fs.mkdtempSync('/tmp/crash-verify-checksum-');
  chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
    '--mute-audio', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--enable-webgl', '--ignore-gpu-blocklist', '--ignore-certificate-errors',
    '--autoplay-policy=no-user-gesture-required', `--remote-debugging-port=${CDP}`,
    `--user-data-dir=${profile}`, '--window-size=1000,760', 'about:blank'],
    { detached: true, stdio: 'ignore', env: { ...process.env,
      PULSE_SINK: 'worker-null', PIPEWIRE_NODE: 'worker-null' } });
  let target;
  for (let attempt = 0; attempt < 50 && !target; attempt++) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json();
      target = pages.find(page => page.type === 'page')?.webSocketDebuggerUrl;
    } catch {}
    if (!target) await sleep(200);
  }
  assert.ok(target, 'Chrome DevTools page');
  ws = new WebSocket(target);
  const pending = new Map(); let sequence = 0;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15_000);
      pending.set(id, { resolve, reject, timer }); ws.send(JSON.stringify({ id, method, params }));
    });
  }
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (pending.has(message.id)) {
      const task = pending.get(message.id); pending.delete(message.id); clearTimeout(task.timer);
      if (message.error) task.reject(new Error(JSON.stringify(message.error))); else task.resolve(message.result);
    } else if (message.method === 'Runtime.consoleAPICalled') {
      const text = message.params.args.map(arg => arg.value ?? arg.description ?? '').join(' ');
      lines.push(text); if (message.params.type === 'error') errors.push(text);
    } else if (message.method === 'Runtime.exceptionThrown') {
      errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    } else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      errors.push(message.params.entry.text);
    }
  });
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve); ws.addEventListener('error', reject);
    chrome.once('error', reject);
  });
  for (const method of ['Page.enable', 'Runtime.enable', 'Log.enable']) await send(method);
  await send('Emulation.setDeviceMetricsOverride', { width: PORTRAIT ? 390 : PHONE ? 844 : 1000,
    height: PORTRAIT ? 844 : PHONE ? 390 : 760, deviceScaleFactor: PHONE ? 3 : 2, mobile: PHONE });
  await send('Emulation.setTouchEmulationEnabled', { enabled: PHONE, maxTouchPoints: 5 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'pointer', value: PHONE ? 'coarse' : 'fine' },
    { name: 'hover', value: PHONE ? 'none' : 'hover' }] });
  async function js(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async function wait(pattern, mark, timeout = 15_000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      for (let index = mark; index < lines.length; index++) {
        const match = lines[index].match(pattern); if (match) return { match, index };
      }
      await sleep(40);
    }
    throw new Error(`No ${pattern} after line ${mark}`);
  }
  async function key(name) {
    const codes = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Enter: 13,
      Escape: 27, ' ': 32, p: 80, u: 85 };
    const code = name === ' ' ? 'Space' : name.length === 1 ? `Key${name.toUpperCase()}` : name;
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: name,
      code, text: name.length === 1 ? name : undefined,
      windowsVirtualKeyCode: codes[name], nativeVirtualKeyCode: codes[name] });
    await sleep(70);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: name,
      code, windowsVirtualKeyCode: codes[name], nativeVirtualKeyCode: codes[name] });
    await sleep(100);
  }
  async function point(x, y) {
    return js(`(() => { const c=document.getElementById('stage'), r=c.getBoundingClientRect();
      const s=Math.min(c.width/640,c.height/400), ox=(c.width-640*s)/2, oy=(c.height-400*s)/2;
      return {x:r.left+(ox+${x}*s)*r.width/c.width,y:r.top+(oy+${y}*s)*r.height/c.height}; })()`);
  }
  async function press(x, y) {
    const client = await point(x, y);
    if (PHONE) {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...client, id: 1 }] });
      await sleep(80); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...client });
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...client, button: 'left', buttons: 1, clickCount: 1 });
      await sleep(80);
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...client, button: 'left', buttons: 0, clickCount: 1 });
    }
    await sleep(100);
  }
  function center(place) {
    return packetCenter(place, DOCK);
  }
  const packet = place => press(...center(place));
  function passed(name, detail) { results.push(name); console.log(`PASS ${name}: ${detail}`); }
  async function shot(name) {
    if (!SHOT) return;
    const capture = await send('Page.captureScreenshot', { format: 'png' });
    const file = name ? SHOT.replace(/\.png$/, '') + '-' + name + '.png' : SHOT;
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
    fs.writeFileSync(file, Buffer.from(capture.data, 'base64'));
  }
  const dealPattern = /^crash: checksum deal (\d+) (\([\d\s]+\)) (\([\d\s]+\))$/;
  async function open(seed) {
    const mark = lines.length;
    await send('Page.navigate', { url: `${BASE}?trace&checksum=classic&checksum-dock=${DOCK}&seed=${seed}&fresh&bg=off` });
    const row = await wait(dealPattern, mark, 600_000);
    const deal = parseDeals(`(deal ${row.match[1]} ${row.match[2]} ${row.match[3]})`)[0];
    if (DEALS) {
      const expected = expectedDeals.find(deal => deal.seed === seed);
      assert.ok(expected, 'independent proof contains this seed');
      assert.deepEqual(deal.pyramid, expected.pyramid, 'wasm pyramid matches proved source deal');
      assert.deepEqual(deal.stock, expected.stock, 'wasm feed matches proved source deal');
    }
    assert.equal(deal.seed, seed); await sleep(800); return deal;
  }

  // Warm the service worker before checking the title/menu boot path.
  await open(2);
  await js(`(async()=>{if(!navigator.serviceWorker)return; const until=Date.now()+15000;
    while(Date.now()<until){if(navigator.serviceWorker.controller)return;
      await new Promise(r=>setTimeout(r,100));}})()`);
  let mark = lines.length;
  await send('Page.navigate', { url: `${BASE}?trace&fresh&bg=off` });
  await wait(/^crash: menu top /, mark, 40_000);
  await sleep(800);
  async function maybe(pattern, mark, timeout) {
    try { return await wait(pattern, mark, timeout); } catch { return null; }
  }
  if (await maybe(/^crash: title gate /, mark, 6000)) {
    await key('ArrowUp'); await wait(/^crash: title connect$/, mark);
  }
  if (await maybe(/^crash: title card tick /, mark, 6000)) {
    await key('ArrowUp'); await wait(/^crash: title card done /, mark);
  }
  await key('ArrowUp');
  await wait(/^crash: boot done /, mark, 40_000);
  await wait(/^crash: title settled /, mark, 15_000);
  mark = lines.length; await key('ArrowDown'); await key('Enter');
  const free = await wait(/^crash: menu free (.+)$/, mark);
  const ids = free.match[1].split(' ').filter((_, index) => index % 3 === 0).map(id => id.split('=')[0]);
  assert.deepEqual(ids, ['stack', 'cards', 'scan', 'intercept', 'decrypt', 'checksum', 'code', 'scores', 'back']);
  for (let index = 0; index < 5; index++) await key('ArrowRight');
  await sleep(600); await shot('menu');
  mark = lines.length; await key('Enter');
  await wait(/^crash: menu free-checksum /, mark);
  mark = lines.length; await key('Enter'); await wait(/^crash: checksum open clean /, mark);
  passed('menu', 'FREE PLAY -> CHECKSUM -> NEW BOARD, CLASSIC default');

  let deal, verdict, dealMark;
  for (const seed of [2, 1, 3, 4, 5, 6, 7, 8]) {
    dealMark = lines.length; deal = await open(seed);
    verdict = solve(deal.pyramid, deal.stock, { passLimit: 1 });
    if (!verdict.solvable) verdict = solve(deal.pyramid, deal.stock, { maxNodes: 5_000_000 });
    assert.equal(verdict.solvable, true, 'independent solver found a path');
    const hasPair = verdict.solution.some((m, index) => index < verdict.solution.length - 1
      && Array.isArray(m) && Number.isInteger(m[0]) && Number.isInteger(m[1]));
    const hasRoot = verdict.solution.some(m => Array.isArray(m) && Number.isInteger(m[0]) && m[1] === null);
    if (hasPair && hasRoot) break;
    verdict = null;
  }
  assert.ok(verdict, 'actual independently solved deal exercises a pyramid pair and ROOT');
  const model = new BrowserBoard(deal);
  let removed = 0, pulls = 0, pairSeen = false, rootSeen = false;
  async function cursorTo(target) {
    const state = lines.slice(dealMark).findLast(line => /^crash: checksum state /.test(line));
    const cursor = state ? Number(state.match(/ cursor (\d+|pull|waste) /)[1]) : 21;
    const start = Number.isNaN(cursor) ? state.match(/ cursor (\d+|pull|waste) /)[1] : cursor;
    for (const arrow of model.cursorRoute(start, target, DOCK)) await key(arrow);
  }
  await shot('play');
  for (const move of verdict.solution) {
    mark = lines.length;
    if (move === 'pull' || move === 'rollback') { await packet('pull'); pulls++; }
    else {
      const [a, b] = move;
      if (!pairSeen && model.live.size > 2 && Number.isInteger(a) && Number.isInteger(b)) {
        await cursorTo(a); await key(' ');
        await wait(new RegExp(`^crash: checksum state ${removed} selected ${a} `), mark);
        await cursorTo(b); await key('Enter');
        await wait(new RegExp(`^crash: checksum state ${removed + 2} selected - `), mark);
        passed('keyboard', 'real arrows, Space and Enter remove an independently derived pair');
        mark = lines.length; await key('u');
        await wait(new RegExp(`^crash: checksum state ${removed} selected - `), mark);
        passed('undo', 'U restores that real pair');
        mark = lines.length;
      }
      await packet(a);
      if (b !== null) await packet(b);
      if (Number.isInteger(a)) removed++;
      if (Number.isInteger(b)) removed++;
      if (!pairSeen && Number.isInteger(a) && Number.isInteger(b)) {
        pairSeen = true; passed('pair', PHONE ? 'two real touches' : 'two real mouse clicks');
      }
      if (!rootSeen && Number.isInteger(a) && b === null) {
        rootSeen = true; passed('root', 'one real tap removes an independently free ROOT');
      }
    }
    model.apply(move);
    await wait(new RegExp(`^crash: checksum state ${removed} `), mark);
  }
  assert.equal(model.live.size, 0, 'independent real-input model clears');
  assert.ok(pulls > 0, 'solution exercised the feed');
  await wait(/^crash: checksum over cleared 28$/, mark);
  await sleep(450); await shot('panel');
  passed('clear', `independent solution through real input, ${pulls} feed actions, shared end panel`);
  mark = lines.length; await packet('pull'); await sleep(300);
  assert.equal(lines.slice(mark).filter(line => /^crash: checksum state /.test(line)).length, 0,
    'ended table refuses board input');
  // The next archive proves slicing while real music is already playing.
  assert.ok(lines.slice(dealMark).some(line => /^crash: audio resumed$/.test(line)), 'real gestures resumed audio on this page');
  assert.ok(lines.slice(dealMark).some(line => /^crash: music open /.test(line)), 'music is active on this page for the starvation check');
  await sleep(1500);
  // Read the public bridge counters while checking the real new archive.
  // Retain counter changes and timer gaps, so music-open stalls can be
  // distinguished from search slices without discounting either one.
  await js(`(() => {
    const trace = window.__checksumAudioTrace = { samples: [], longTasks: [], maxima: {} };
    let previous = '', last = performance.now();
    const read = () => {
      const sinks = [];
      for (let id = 1; id <= 32; id++) {
        const capacity = SigilWasmAudio.sinkCapacity(id);
        if (capacity > 0) sinks.push({ id, capacity, mode: SigilWasmAudio.sinkMode(id),
          depth: SigilWasmAudio.sinkDepth(id), underruns: SigilWasmAudio.sinkUnderruns(id),
          sounding: SigilWasmAudio.sinkUnderrunsSounding(id) });
      }
      return sinks;
    };
    trace.baseline = read();
    trace.record = () => {
      const now = performance.now(), sinks = read();
      for (const s of sinks) {
        const old = trace.maxima[s.id];
        trace.maxima[s.id] = { ...s, underruns: Math.max(s.underruns, old?.underruns || 0),
          sounding: Math.max(s.sounding, old?.sounding || 0) };
      }
      trace.finalSinks = sinks;
      const signature = JSON.stringify(sinks.map(s => [s.id, s.underruns, s.sounding]));
      if (signature !== previous || now - last > 150) {
        trace.samples.push({ at: now, gap: now - last, sinks });
        if (trace.samples.length > 200) trace.samples.shift();
        previous = signature;
      }
      last = now;
    };
    trace.record();
    trace.timer = setInterval(trace.record, 100);
    trace.observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const task = { at: entry.startTime, duration: entry.duration };
        trace.longTasks.push(task);
        if (trace.longTasks.length > 200) trace.longTasks.shift();
        if (!trace.worstLongTask || task.duration > trace.worstLongTask.duration)
          trace.worstLongTask = task;
      }
    });
    trace.observer.observe({ entryTypes: ['longtask'] });
  })()`);
  await send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
  mark = lines.length; await key('Enter');
  const fresh = await wait(/^crash: checksum open clean (\d+)$/, mark);
  assert.notEqual(Number(fresh.match[1]), deal.seed, 'win default starts another seed');
  // A fresh untouched deal may reject many capped candidates. The actual
  // desktop-right population exceeded 600s at 4x; keep measuring that work
  // without weakening the gameplay, raw-underrun or music assertions.
  await wait(dealPattern, mark, 1_200_000);
  const generation = await wait(/^crash: checksum generation ms ([\d.eE+-]+) frames (\d+) max-frame-ms ([\d.eE+-]+) candidates (\d+) nodes (\d+) inconclusive (\d+) easy (\d+) unsolvable (\d+) draws (\d+) needed (\d+) failed (\d+)$/, mark);
  const audio = await wait(/^crash: checksum deal-audio underruns (\d+) worst (\d+)$/, generation.index, 15_000);
  const audioTrace = await js(`(() => {
    const trace = window.__checksumAudioTrace;
    clearInterval(trace.timer); trace.observer.disconnect();
    trace.record();
    return { isolated: crossOriginIsolated, baseline: trace.baseline, maxima: Object.values(trace.maxima),
      finalSinks: trace.finalSinks, samples: trace.samples, longTasks: trace.longTasks,
      worstLongTask: trace.worstLongTask };
  })()`);
  console.log('AUDIO-DIAGNOSTIC:', JSON.stringify(audioTrace));
  await send('Emulation.setCPUThrottlingRate', { rate: 1 });
  assert.ok(Number(generation.match[2]) >= 2, 'runtime proof spans frames');
  assert.equal(Number(audio.match[1]), 0, `generation starved audio at ${THROTTLE}x: ${audio.match[0]}`);
  const health = requireHealthyDealAudio(audioTrace);
  assert.ok(lines.slice(mark).includes('crash: checksum audio reserve cue 32768 source 31744'),
    'generation reserves the existing cue and music rings');
  assert.ok(lines.slice(generation.index).includes('crash: checksum audio restored cue 12288 source 16384'),
    'playable board restores the ordinary audio targets');
  for (const sink of audioTrace.finalSinks)
    assert.ok(sink.depth <= (sink.capacity === 65536 ? 12288 : 16384),
      `temporary generation reserve drains before playable-board audio check: ${JSON.stringify(sink)}`);
  await wait(/^crash: music playing /, mark, 1000);
  assert.ok(Number(generation.match[9]) >= 8);
  assert.ok(Number(generation.match[11]) >= 20);
  assert.ok(100 * Number(generation.match[10]) <= 55 * Number(generation.match[9]));
  passed('audio', `${THROTTLE}x: sounding starvation ${health.sounding}, music dry ${health.music}; raw cue counters retained: ${audio.match[0]}; ${generation.match[0]}`);
  passed('win-default', 'Enter on the win panel starts NEW ARCHIVE');
  mark = lines.length; await key('Escape');
  await key('ArrowDown'); await key('ArrowDown'); await key('ArrowDown'); await key('Enter');
  await wait(/^crash: menu top /, mark);
  passed('jack-out', 'shared pause panel returns to the menu after the next deal');
  const raced = errors.filter(error => /image fetch failed/i.test(error));
  const unexpected = errors.filter(error => !/image fetch failed/i.test(error));
  assert.equal(unexpected.length, 0, unexpected.join('\n'));
  assert.equal(lines.filter(line => /crash: texture missing|boot-error|FATAL/.test(line)).length, 0);
  if (raced.length) console.log(`NOTE: ${raced.length} loader image fetch races; no missing textures after retry`);
  passed('console', 'no game exception, missing texture or unexpected console error');
  console.log(`VERDICT: ${results.length}/10 passed (${PORTRAIT ? 'portrait phone' : PHONE ? 'phone' : 'desktop'}, ${DOCK})`);
} catch (error) {
  console.error('FAIL CHECKSUM:', error.stack);
  console.error(lines.slice(-40).join('\n')); console.error(errors.join('\n'));
  process.exitCode = 1;
} finally {
  clearTimeout(watchdog); cleanup();
}
