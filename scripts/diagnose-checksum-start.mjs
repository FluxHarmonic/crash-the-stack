// Bounded isolated-profile start diagnosis; no build, solver or speaker output.
// node scripts/diagnose-checksum-start.mjs --url URL [--out PREFIX] [--cdp PORT]
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const base = option('--url', null);
assert.ok(base && /^https?:\/\//.test(base), 'pass the authorized draft URL with --url');
const out = option('--out', 'build/checksum-start-diagnostic');
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
let phase = 'launch', windowInfo, blankFrames, menuFrames, opened, playableAfterMs = null;
let cpuProfile;
const profile = fs.mkdtempSync('/tmp/checksum-visible-profile-');
const port = Number(option('--cdp', '9339'));
const log = [], errors = [], samples = [];
const flags = ['--headless=new', '--use-gl=angle', '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader', '--enable-webgl', '--ignore-gpu-blocklist',
  '--enable-automation', '--no-sandbox', '--mute-audio', '--ignore-certificate-errors',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--window-size=1000,760', 'about:blank'];
const browserLog = fs.openSync(out + '.browser.log', 'w');
const browser = spawn('google-chrome', flags, { detached: true, stdio: ['ignore', 'ignore', browserLog],
  env: { ...process.env, PULSE_SINK: 'worker-null', PIPEWIRE_NODE: 'worker-null' } });
let ws, completed = false, rc = 1, commandLine;
function cleanup() {
  try { ws?.close(); } catch {}
  try { process.kill(-browser.pid, 'SIGKILL'); } catch {}
}
process.on('exit', cleanup);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const watchdog = setTimeout(() => { cleanup(); process.exit(2); }, 75_000);
process.on('exit', code => {
  if (!completed) fs.writeFileSync(out + '.json', JSON.stringify({ phase, rc: code, flags, profile, windowInfo, blankFrames, menuFrames, commandLine, errors, samples, log }, null, 2));
  fs.writeFileSync(out + '.rc', String(code) + '\n');
});
try {
  let target;
  for (let i = 0; i < 100 && !target; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json())
      .find(p => p.type === 'page')?.webSocketDebuggerUrl; } catch (e) {
      if (i < 3) errors.push(`CDP fetch: ${e.message}; ${e.cause?.code || ''}`);
    }
    if (!target) {
      const r = spawnSync('curl', ['--noproxy', '*', '-fsS', '--max-time', '1',
        `http://127.0.0.1:${port}/json/list`], { encoding: 'utf8' });
      if (r.status === 0) {
        const pages = JSON.parse(r.stdout);
        target = pages.find(p => p.type === 'page')?.webSocketDebuggerUrl;
        if (i < 3 && !target) errors.push(`CDP page types: ${pages.map(p => p.type).join(',')}`);
      } else if (i < 3) errors.push(`CDP curl: ${r.stderr.trim()}`);
    }
    if (!target && i > 2) {
      // This Chrome profile starts extensions without opening a page.
      // Explicitly create our own visible task tab, not an extension target.
      try {
        const page = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
        target = page.webSocketDebuggerUrl;
      } catch (e) { if (i < 5) errors.push(`CDP create page: ${e.message}`); }
    }
    if (!target) await sleep(200);
  }
  assert.ok(target, 'visible Chrome page');
  ws = new WebSocket(target);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve); ws.addEventListener('error', reject);
  });
  const pending = new Map(); let sequence = 0;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(method)); }, 15_000);
      pending.set(id, { resolve, reject, timer }); ws.send(JSON.stringify({ id, method, params }));
    });
  }
  ws.addEventListener('message', event => {
    const m = JSON.parse(event.data);
    if (pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id); clearTimeout(p.timer);
      if (m.error) p.reject(new Error(JSON.stringify(m.error))); else p.resolve(m.result);
    } else if (m.method === 'Runtime.consoleAPICalled') {
      const text = m.params.args.map(v => v.value ?? v.description ?? '').join(' ');
      log.push({ at: Date.now(), text });
      if (m.params.type === 'error') errors.push(text);
    } else if (m.method === 'Runtime.exceptionThrown') {
      errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    } else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(m.params.entry.text);
  });
  for (const method of ['Page.enable', 'Runtime.enable', 'Log.enable']) await send(method);
  async function js(expression) {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  }
  async function wait(pattern, mark, timeout = 20_000) {
    const began = Date.now();
    while (Date.now() - began < timeout) {
      const found = log.slice(mark).find(row => pattern.test(row.text));
      if (found) return found;
      await sleep(100);
    }
    throw new Error('Missing ' + pattern + ' during ' + phase);
  }
  async function key(name) {
    const code = { ArrowUp: 38, ArrowDown: 40, ArrowRight: 39, Enter: 13 }[name];
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code: name, windowsVirtualKeyCode: code });
    await sleep(70);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code: name, windowsVirtualKeyCode: code });
    await sleep(150);
  }
  const counter = `window.__checksumRaf = { count: 0, last: 0 };
    requestAnimationFrame(function probe(at) { window.__checksumRaf.count++; window.__checksumRaf.last = at; requestAnimationFrame(probe); });`;
  try { commandLine = (await send('Browser.getBrowserCommandLine')).arguments; } catch (e) { errors.push('command-line: ' + e.message); }
  windowInfo = await send('Browser.getWindowForTarget');
  await send('Browser.setWindowBounds', { windowId: windowInfo.windowId, bounds: { windowState: 'normal' } });
  await send('Page.bringToFront');
  await js(counter);
  phase = 'blank-frame-loop';
  await sleep(2000);
  blankFrames = await js('({ raf: window.__checksumRaf, visible: document.visibilityState, focused: document.hasFocus() })');
  console.log('BLANK-FRAMES', JSON.stringify({ windowInfo, blankFrames }));
  await sleep(1000);
  const later = await js('window.__checksumRaf.count');
  blankFrames.nextCount = later;
  assert.ok(later > blankFrames.raf.count + 5, 'isolated blank page must keep receiving rAF before any game diagnosis');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: counter });
  phase = 'warm-menu';
  let mark = log.length;
  await send('Page.navigate', { url: base + '?trace&fresh&bg=off&ms' });
  await send('Page.bringToFront');
  await wait(/^crash: menu top /, mark);
  await sleep(1000);
  for (let attempt = 0; attempt < 3 && !log.slice(mark).some(row => /^crash: boot done /.test(row.text)); attempt++) {
    await key('ArrowUp'); await sleep(700);
  }
  await wait(/^crash: boot done /, mark);
  menuFrames = await js('({ raf: window.__checksumRaf, visible: document.visibilityState, focused: document.hasFocus(), stats: window.crashPageStats?.() })');
  assert.ok(menuFrames.raf.count > 1, 'warm menu frame loop advances');
  if (!log.slice(mark).some(row => /^crash: title card done /.test(row.text))) {
    await wait(/^crash: title card tick /, mark, 10_000);
    await key('ArrowUp');
    await wait(/^crash: title card done /, mark, 5000);
  }
  await wait(/^crash: title settled /, mark, 15_000);
  console.log('WARM-MENU', JSON.stringify({ raf: menuFrames.raf, visible: menuFrames.visible }));
  phase = 'menu-start';
  await send('Profiler.enable');
  await send('Profiler.setSamplingInterval', { interval: 10_000 });
  await send('Profiler.start');
  mark = log.length; await key('ArrowDown'); await key('Enter');
  await wait(/^crash: menu free /, mark);
  for (let i = 0; i < 5; i++) await key('ArrowRight');
  mark = log.length; await key('Enter'); await wait(/^crash: menu free-checksum /, mark);
  mark = log.length; await key('Enter');
  opened = await wait(/^crash: checksum open clean /, mark);
  phase = 'checking-seal';
  const until = Date.now() + 30_000;
  while (Date.now() < until) {
    await sleep(2000);
    samples.push({ elapsed: Date.now() - opened.at, ...await js(`({ raf: window.__checksumRaf,
      visible: document.visibilityState, focused: document.hasFocus(), stats: window.crashPageStats?.(),
      webglLost: document.getElementById('stage')?.getContext('webgl2')?.isContextLost() })`) });
    const dealt = log.slice(mark).find(row => /^crash: checksum deal /.test(row.text));
    if (dealt) { playableAfterMs = dealt.at - opened.at; break; }
  }
  cpuProfile = (await send('Profiler.stop')).profile;
  fs.writeFileSync(out + '.cpuprofile', JSON.stringify(cpuProfile));
  const capture = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(out + '.png', Buffer.from(capture.data, 'base64'));
  phase = 'done'; rc = 0;
} catch (e) {
  errors.push(e.stack || String(e)); console.error('PROBE-FAIL', phase, e.message);
} finally {
  fs.writeFileSync(out + '.json', JSON.stringify({ phase, rc, base, headless: true, muted: true, flags, profile, commandLine, windowInfo,
    blankFrames, menuFrames, opened, playableAfterMs, samples, errors, log }, null, 2));
  fs.writeFileSync(out + '.log', log.map(row => row.text).join('\n') + '\n');
  fs.writeFileSync(out + '.rc', String(rc) + '\n');
  completed = true; clearTimeout(watchdog); cleanup(); fs.closeSync(browserLog);
  console.log('RESULT rc=' + rc + ' phase=' + phase + ' headless-new=true muted=true playable-ms=' + playableAfterMs);
  process.exitCode = rc;
}
