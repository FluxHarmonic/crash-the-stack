// Exercise the shipped page code without a renderer: frame accounting and
// chunked PCM delivery must remain correct regardless of machine speed.
// node scripts/test-web-perf.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.template.html', 'utf8');
for (const match of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))
  new vm.Script(match[1]);

let now = 0;
const queued = [];
const context = {
  performance: { now: () => now },
  requestAnimationFrame: cb => queued.push(cb),
  updates: { app: { dispatch() {} } },
  URLSearchParams, location: { search: '?ms' },
  AudioContext: class {
    state = 'running'; sampleRate = 48000;
    createScriptProcessor() {
      return { bufferSize: 2048, addEventListener(name, callback) { this.fire = callback; } };
    }
  },
  AudioWorkletNode: class {},
};
context.window = context;
vm.createContext(context);
const statsStart = html.indexOf('    var pageFrames =');
const statsEnd = html.indexOf('    // The stats summary', statsStart);
vm.runInContext(html.slice(statsStart, statsEnd), context);
function frame(stamp, start, callbacks) {
  for (const cb of callbacks) context.requestAnimationFrame(cb);
  now = start;
  for (const cb of queued.splice(0)) cb(stamp);
}

frame(10, 0, [() => { now += 10; }, () => { now += 5; }]);
frame(26, 16, [() => { now += 2; }]);
assert.match(context.crashPageStats(), /page callback mean 15\.0/);
assert.match(context.crashPageStats(), /page callbacks over 16\.7 ms 0 of 1/);
assert.match(context.crashPageStats(), /raf-interval mean 16\.0/);

frame(42, 32, [() => {
  now += 1300;
  vm.runInContext('resetPageStats()', context);
}, () => { now += 500; }]);
frame(58, 2000, [() => { now += 7; }]);
frame(74, 2016, [() => { now += 3; }]);
assert.match(context.crashPageStats(), /page callback mean 7\.0/);
assert.match(context.crashPageStats(), /raf-interval mean 16\.0/);
assert.match(context.crashPageStats(), /page callbacks over 16\.7 ms 0 of 1/);
console.log('PASS frame accounting: shared callbacks aggregate; reset excludes the old frame and its remaining callbacks');

const outputContext = new context.AudioContext();
const outputNode = outputContext.createScriptProcessor();
now = 3000; outputNode.fire();
now = 3043; outputNode.fire();
assert.match(context.crashPageStats(), /audio node scriptprocessor state running rate 48000 block 2048/);
assert.match(context.crashPageStats(), /audio-callback-gap mean 43.0/);
vm.runInContext('resetPageStats()', context);
now = 6000; outputNode.fire();
assert.match(context.crashPageStats(), /audio-callback-gap \(no samples\)/);
new context.AudioWorkletNode(outputContext, 'test');
assert.match(context.crashPageStats(), /audio node worklet state running/);
console.log('PASS audio output observations: actual node and state, callback gaps, reset excludes the old interval');

const pcm = Float32Array.from({ length: 700001 }, (_, i) => Math.sin(i) * 1.2);
const expected = Buffer.alloc(pcm.length * 2);
for (let i = 0; i < pcm.length; i++) {
  const v = Math.max(-1, Math.min(1, pcm[i]));
  const sample = v < 0 ? v * 32768 : v * 32767;
  const u = sample < 0 ? sample + 65536 : sample;
  expected[2 * i] = u & 255;
  expected[2 * i + 1] = (u >> 8) & 255;
}
function checkDelivery(mode) {
  const chunks = [];
  let reserved = 0, finished = null, settled = null, completions = 0;
  const uploadQueue = [];
  const delivery = {
    pcm, name: 'spy', Uint8Array,
    performance: { now: () => now },
    btoa: s => Buffer.from(s, 'binary').toString('base64'),
    requestAnimationFrame: cb => uploadQueue.push(cb),
    remember: (xs, value) => xs.push(value),
    audioWork: { upload: [], finish: [] },
    settled: failed => { settled = failed; completions++; },
    app: { dispatch(type, payload) {
      if (type === 'audio-size') reserved = Number(payload);
      if (type === 'audio-chunk') {
        chunks.push(Buffer.from(payload, 'base64'));
        now += chunks.length === 1 ? 20 : 2;
      }
      if (type === 'audio-done') finished = Number(payload);
    } },
  };
  let terminated = false, revoked = false, source = '';
  if (mode !== 'unsupported') {
    delivery.Blob = class { constructor(parts) { source = parts.join(''); } };
    delivery.URL = { createObjectURL: () => 'blob:test', revokeObjectURL: () => { revoked = true; } };
    delivery.Worker = class {
      constructor() {
        this.context = { Uint8Array, btoa: delivery.btoa,
          postMessage: data => uploadQueue.push(() => this.onmessage({ data })) };
        vm.createContext(this.context);
        vm.runInContext(source, this.context);
      }
      postMessage(data) {
        uploadQueue.push(() => {
          if (mode === 'failed' || (mode === 'chunk-failed' && !data.pcm)) this.onerror({ preventDefault() {} });
          else this.context.onmessage({ data });
        });
      }
      terminate() { terminated = true; }
    };
  }
  vm.createContext(delivery);
  const deliveryStart = html.indexOf('      function deliver(pcm)');
  const deliveryEnd = html.indexOf('      (function attempt()', deliveryStart);
  const encoderStart = html.indexOf('    function encodePcmChunk(');
  const encoderEnd = html.indexOf('    var TRACKS =', encoderStart);
  vm.runInContext(html.slice(encoderStart, encoderEnd) + html.slice(deliveryStart, deliveryEnd) + '\ndeliver(pcm);', delivery);
  assert.equal(chunks.length, 0, 'conversion and upload must yield before the first batch');
  while (uploadQueue.length) uploadQueue.shift()();
  assert.equal(reserved, expected.length);
  assert.deepEqual(Buffer.concat(chunks), expected);
  assert.equal(finished, chunks.length);
  assert.equal(settled, false);
  assert.equal(completions, 1, 'worker errors must not create a second delivery loop');
  assert.ok(chunks[1].length < chunks[0].length, 'slow work must reduce the next batch');
  assert.ok(chunks.every(chunk => chunk.length <= 256 * 1024));
  if (mode !== 'unsupported') { assert.ok(terminated); assert.ok(revoked); }
  console.log('PASS audio delivery (' + mode + '): exact PCM, adaptive yielded batches, completion and cleanup');
}
for (const mode of ['unsupported', 'worker', 'failed', 'chunk-failed']) checkDelivery(mode);
