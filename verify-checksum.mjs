// Real CDP mouse/touch/keyboard checks against a runner-built CHECKSUM.
// node verify-checksum.mjs build/web [--phone|--portrait] [--visible] [--shot PATH] [--url URL]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { parseDeals, solve } from './scripts/checksum-solve.mjs';
import { BrowserBoard, packetCenter } from './scripts/checksum-browser-model.mjs';
import { requireHealthyDealAudio } from './scripts/checksum-audio-gate.mjs';
import { createProcessStopGuard } from './scripts/process-stop-guard.mjs';

const stopGuard = createProcessStopGuard();

const args = process.argv.slice(2);
const opt = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const ROOT = path.resolve(args[0] || 'build/web');
const PORTRAIT = args.includes('--portrait');
const PHONE = args.includes('--phone') || PORTRAIT;
const VISIBLE = args.includes('--visible');
const PLAYABLE_LIMIT_MS = 2000;
const THROTTLE = Number(opt('--throttle', '4'));
const knownFlags = new Set(['--phone', '--portrait', '--visible', '--shot', '--url',
  '--throttle', '--port', '--cdp', '--deals', '--audio-negative']);
for (const arg of args.slice(1))
  if (arg.startsWith('--')) assert.ok(knownFlags.has(arg), `unknown verifier option: ${arg}`);
const PORT = Number(opt('--port', '8115'));
const CDP = Number(opt('--cdp', '9335'));
const SHOT = opt('--shot', null);
const DEALS = opt('--deals', 'bench/checksum-reference/deals.scm');
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
const lines = [], receivedAt = [], errors = [], results = [];
let chrome, profile, server, ws;
let currentThrottle = 1;
function cleanup() {
  if (chrome?.pid) stopGuard.stopGroup(chrome.pid, 'SIGKILL');
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
}, 600_000);
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
  chrome = spawn('google-chrome', [...(VISIBLE ? ['--new-window'] : ['--headless=new',
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']),
    '--no-sandbox', '--disable-dev-shm-usage', '--mute-audio',
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
      if (!target && attempt > 2) {
        const page = await (await fetch(`http://127.0.0.1:${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
        target = page.webSocketDebuggerUrl;
      }
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
      lines.push(text); receivedAt.push(performance.now());
      if (message.params.type === 'error') errors.push(text);
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
  await send('Page.bringToFront');
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
    return packetCenter(place);
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
  async function measureLayout() {
    // Hand-derived screen positions, independent of the game's hit helper.
    // Read one DOM snapshot. CSS-to-backing ratios can differ by axis;
    // integer backing dimensions must not be mistaken for a tiny target.
    const snapshot = await js(`(() => {
      const c=document.getElementById('stage'), r=c.getBoundingClientRect();
      const s=Math.min(c.width/640,c.height/400);
      const ox=(c.width-640*s)/2, oy=(c.height-400*s)/2;
      const p=(x,y)=>({x:r.left+(ox+x*s)*r.width/c.width,
        y:r.top+(oy+y*s)*r.height/c.height});
      const x=256;
      return {viewport:{width:innerWidth,height:innerHeight},
        canvas:{width:c.width,height:c.height,cssWidth:r.width,cssHeight:r.height},
        scaleX:s*r.width/c.width,scaleY:s*r.height/c.height,
        base:p(100,254),pile:p(x,280),pileBottom:p(x+56,356),
        target:p(x,356),fieldBottom:p(0,400)};
    })()`);
    const { viewport, canvas, scaleX, scaleY, base, pile, pileBottom, target, fieldBottom } = snapshot;
    const evidence = { viewport, canvas, layout: 'center', scale: scaleY, scaleX, scaleY,
      pyramidToPilesCss: pile.y - base.y,
      pilesToPlayfieldEdgeCss: fieldBottom.y - pileBottom.y,
      pilesToScreenEdgeCss: viewport.height - pileBottom.y,
      targetCss: { width: pileBottom.x - target.x, height: target.y - pile.y },
      exposedIndexCss: 26 * scaleY, meterCss: { width: 200 * scaleX, height: 18 * scaleY },
      meterPlacement: 'under the piles; shared 640x400 stage preserves positions on rotation' };
    console.log('LAYOUT-DIAGNOSTIC:', JSON.stringify(evidence));
    if (SHOT) fs.writeFileSync(SHOT.replace(/\.png$/, '') + '-layout.json', JSON.stringify(evidence, null, 2));
    assert.ok(evidence.pyramidToPilesCss >= 24 * scaleY - 0.01, 'clear lower pyramid gap');
    assert.ok(evidence.pilesToPlayfieldEdgeCss >= 40 * scaleY - 0.01, 'bottom meter lane');
    assert.ok(evidence.pilesToScreenEdgeCss >= evidence.pilesToPlayfieldEdgeCss - 0.01);
    assert.ok(Math.abs(evidence.targetCss.width - 56 * scaleX) < 0.01);
    assert.ok(Math.abs(evidence.targetCss.height - 76 * scaleY) < 0.01);
  }
  const dealPattern = /^crash: checksum deal (\d+) (\([\d\s]+\)) (\([\d\s]+\))$/;
  const readyPattern = /^crash: checksum ready (\d+) ms ([\d.eE+-]+)$/;
  const poolPattern = /^crash: checksum pool size (\d+) draws (\d+) needed (\d+) failed (\d+)$/;
  function checkedDeal(row) {
    const deal = parseDeals(`(deal ${row.match[1]} ${row.match[2]} ${row.match[3]})`)[0];
    const expected = expectedDeals.find(entry => entry.seed === deal.seed);
    assert.ok(expected, 'independent proof contains the selected pool seed');
    assert.deepEqual(deal.pyramid, expected.pyramid, 'wasm pyramid matches the proved pool deal');
    assert.deepEqual(deal.stock, expected.stock, 'wasm feed matches the proved pool deal');
    return deal;
  }
  async function playable(mark, started) {
    let row;
    try { row = await wait(readyPattern, mark, Math.max(1, PLAYABLE_LIMIT_MS - (performance.now() - started))); }
    catch (error) {
      if (!error.message.startsWith('No ')) throw error;
      assert.fail('first playable frame missing within 2000 ms');
    }
    assert.ok(receivedAt[row.index] - started <= PLAYABLE_LIMIT_MS,
      `first playable frame took ${(receivedAt[row.index] - started).toFixed(1)} ms, limit 2000 ms`);
    assert.ok(Number(row.match[2]) <= PLAYABLE_LIMIT_MS, 'first playable frame exceeded the engine start budget');
    // The marker is emitted after draw submission. Require the browser to
    // advance again, so a stopped/occluded frame loop cannot pass on logs alone.
    const frameAdvanced = await js(`new Promise(resolve => {
      const timer = setTimeout(() => resolve(false), ${Math.max(1, PLAYABLE_LIMIT_MS - (performance.now() - started))});
      requestAnimationFrame(() => { clearTimeout(timer); resolve(true); });
    })`);
    assert.equal(frameAdvanced, true, 'first playable frame requires a live browser frame loop within 2000 ms');
    assert.ok(performance.now() - started <= PLAYABLE_LIMIT_MS, 'first playable frame did not reach the browser within 2000 ms');
    const dealRow = await wait(dealPattern, mark, 1);
    const deal = checkedDeal(dealRow);
    assert.equal(Number(row.match[1]), deal.seed, 'ready belongs to this actual deal');
    const pool = await wait(poolPattern, mark, 1);
    assert.equal(Number(pool.match[1]), expectedDeals.length, 'bundled pool count matches the proven corpus');
    assert.ok(Number(pool.match[2]) >= 8 && Number(pool.match[4]) >= 20);
    assert.ok(100 * Number(pool.match[3]) <= 55 * Number(pool.match[2]), 'pool retains difficulty filter');
    console.log('PLAYABLE-DIAGNOSTIC:', JSON.stringify({ seed: deal.seed,
      observedMs: performance.now() - started, engineMs: Number(row.match[2]),
      limitMs: PLAYABLE_LIMIT_MS, visible: VISIBLE, throttle: currentThrottle,
      poolSize: Number(pool.match[1]) }));
    return deal;
  }
  async function startArchive(action) {
    const mark = lines.length, started = performance.now();
    await action();
    return playable(mark, started);
  }
  async function open(seed, mode = 'classic') {
    const mark = lines.length;
    await send('Page.navigate', { url: `${BASE}?trace&checksum=${mode}&seed=${seed}&fresh&bg=off` });
    // Fetch/instantiate precedes a shortcut start; measure the logged start,
    // plus the engine's own clock, rather than counting network boot as play.
    const opened = await wait(new RegExp(`^crash: checksum open ${mode === 'classic' ? 'clean' : 'twist'} (\\d+)$`), mark, 40_000);
    const deal = await playable(mark, receivedAt[opened.index]);
    assert.equal(deal.seed, seed); return deal;
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
  // This cosmetic animation shares the boot allowance. Actual archive
  // starts still require <=2000 ms, including the trusted delay control.
  await wait(/^crash: title settled /, mark, 40_000);
  mark = lines.length; await key('ArrowDown'); await key('Enter');
  const free = await wait(/^crash: menu free (.+)$/, mark);
  const ids = free.match[1].split(' ').filter((_, index) => index % 3 === 0).map(id => id.split('=')[0]);
  assert.deepEqual(ids, ['stack', 'cards', 'scan', 'intercept', 'decrypt', 'checksum', 'code', 'scores', 'back']);
  for (let index = 0; index < 5; index++) await key('ArrowRight');
  await sleep(600); await shot('menu');
  mark = lines.length; await key('Enter');
  await wait(/^crash: menu free-checksum /, mark);
  await startArchive(() => key('Enter'));
  passed('menu', 'FREE PLAY -> CHECKSUM -> NEW BOARD, CLASSIC default, playable within 2s');

  // Real behavioral sabotage: block the next trusted start key before the
  // game handles it. A fast engine marker alone must not hide that delay.
  await key('Escape'); await key('ArrowDown'); await key('ArrowDown');
  await js(`(() => {
    window.__checksumStartDelay = event => {
      if (event.key !== 'Enter') return;
      window.removeEventListener('keydown', window.__checksumStartDelay, true);
      const began = performance.now();
      while (performance.now() - began < 3000) {}
      window.__checksumDelayEvidence = { trusted: event.isTrusted, elapsed: performance.now() - began };
    };
    window.addEventListener('keydown', window.__checksumStartDelay, true);
  })()`);
  mark = lines.length;
  await assert.rejects(() => startArchive(() => key('Enter')),
    { name: 'AssertionError', message: /first playable frame/ });
  const delay = await js('window.__checksumDelayEvidence');
  assert.ok(delay?.trusted && delay.elapsed >= 3000, 'real start event hit the delay plant');
  await wait(readyPattern, mark);
  await js("window.removeEventListener('keydown', window.__checksumStartDelay, true)");
  await key('Escape'); await key('ArrowDown'); await key('ArrowDown');
  await startArchive(() => key('Enter'));
  passed('latency-control', '3s trusted start-key stall rejected; removing plant restores <=2s NEW ARCHIVE');

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
    for (const arrow of model.cursorRoute(start, target)) await key(arrow);
  }
  await shot('play');
  await measureLayout();
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
  // The next instant archive runs while real music is already playing.
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
  currentThrottle = THROTTLE;
  mark = lines.length;
  const fresh = await startArchive(() => key('Enter'));
  assert.notEqual(fresh.seed, deal.seed, 'win default starts another seed');
  const audio = await wait(/^crash: checksum deal-audio underruns (\d+) source (\d+)$/, mark, 15_000);
  // Tune-open stall protection pre-rolls the cue ring beyond its ordinary
  // pump target. An instant board can precede that queue draining. Keep the
  // full health trace running and require a bounded, sustained return to
  // normal depths; the separate first-playable limit remains 2000 ms.
  const queueSettle = await js(`(async () => {
    const trace = window.__checksumAudioTrace;
    const started = performance.now(), deadline = started + 2000;
    let normalSince = null;
    while (performance.now() < deadline) {
      trace.record();
      const normal = trace.finalSinks.length > 0 && trace.finalSinks.every(s =>
        s.depth <= (s.capacity === 65536 ? 12288 : 16384));
      const now = performance.now();
      if (!normal) normalSince = null;
      else if (normalSince === null) normalSince = now;
      if (normalSince !== null && now - normalSince >= 300)
        return { settled: true, elapsedMs: now - started, stableMs: now - normalSince };
      await new Promise(resolve => setTimeout(resolve, 75));
    }
    return { settled: false, elapsedMs: performance.now() - started, stableMs: 0 };
  })()`);
  const audioTrace = await js(`(() => {
    const trace = window.__checksumAudioTrace;
    clearInterval(trace.timer); trace.observer.disconnect();
    trace.record();
    return { isolated: crossOriginIsolated, baseline: trace.baseline, maxima: Object.values(trace.maxima),
      finalSinks: trace.finalSinks, samples: trace.samples, longTasks: trace.longTasks,
      worstLongTask: trace.worstLongTask };
  })()`);
  console.log('AUDIO-DIAGNOSTIC:', JSON.stringify(audioTrace));
  console.log('AUDIO-SETTLE-DIAGNOSTIC:', JSON.stringify(queueSettle));
  await send('Emulation.setCPUThrottlingRate', { rate: 1 });
  currentThrottle = 1;
  const health = requireHealthyDealAudio(audioTrace);
  assert.equal(queueSettle.settled, true,
    'audio queues must return to ordinary depths for 300 ms within the 2000 ms settle window');
  for (const sink of audioTrace.finalSinks)
    assert.ok(sink.depth <= (sink.capacity === 65536 ? 12288 : 16384),
      `normal audio targets stay in force: ${JSON.stringify(sink)}`);
  await wait(/^crash: music playing /, mark, 1000);
  passed('audio', `${THROTTLE}x instant start: sounding starvation ${health.sounding}, music dry ${health.music}; raw counters retained: ${audio.match[0]}`);
  passed('win-default', 'Enter on the win panel starts NEW ARCHIVE');
  mark = lines.length; await key('Escape');
  await key('ArrowDown'); await key('ArrowDown'); await key('ArrowDown'); await key('Enter');
  await wait(/^crash: menu top /, mark);
  passed('jack-out', 'shared pause panel returns to the menu after the next deal');
  await open(2, 'hacker');
  await shot('trace');
  const raced = errors.filter(error => /image fetch failed/i.test(error));
  const unexpected = errors.filter(error => !/image fetch failed/i.test(error));
  assert.equal(unexpected.length, 0, unexpected.join('\n'));
  assert.equal(lines.filter(line => /crash: texture missing|boot-error|FATAL/.test(line)).length, 0);
  if (raced.length) console.log(`NOTE: ${raced.length} loader image fetch races; no missing textures after retry`);
  passed('console', 'no game exception, missing texture or unexpected console error');
  const required = ['menu', 'latency-control', 'keyboard', 'undo', 'pair', 'root',
    'clear', 'audio', 'win-default', 'jack-out', 'console'];
  assert.deepEqual([...results].sort(), [...required].sort(), 'every browser arm reached its required checks');
  console.log(`VERDICT: ${results.length}/${required.length} passed (${PORTRAIT ? 'portrait phone' : PHONE ? 'phone' : 'desktop'}, center, ${VISIBLE ? 'visible' : 'headless'})`);
} catch (error) {
  console.error('FAIL CHECKSUM:', error.stack);
  console.error(lines.slice(-40).join('\n')); console.error(errors.join('\n'));
  process.exitCode = 1;
} finally {
  clearTimeout(watchdog); cleanup();
}
