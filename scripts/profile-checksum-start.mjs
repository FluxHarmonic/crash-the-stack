// Diagnostic only: retain every unchanged verifier failure and sample its hot start.
// Runs on Phantom; never qualifies or hosts an artifact.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const web = path.resolve(opt('--web', 'build/web'));
const out = path.resolve(opt('--out', 'build/checksum-start-profile'));
const repetitions = Number(opt('--reps', '10'));
assert.ok(Number.isInteger(repetitions) && repetitions >= 10);
assert.ok(fs.existsSync(path.join(web, 'BUILD-SHA')));
fs.mkdirSync(out, { recursive: true });
let source = fs.readFileSync(path.join(repo, 'verify-checksum.mjs'), 'utf8');
function replace(before, after) {
  assert.equal(source.split(before).length, 2, 'unique diagnostic insertion: ' + before.slice(0, 80));
  source = source.replace(before, after);
}
// Keep the qualification verifier untouched: instrument a scratch copy only.
source = source.replaceAll("from './scripts/", "from '../scripts/");
replace("import http from 'node:http';", "import http from 'node:http';\nimport { createProcessStopGuard } from '../scripts/process-stop-guard.mjs';\nconst stopGuard = createProcessStopGuard();");
replace("if (chrome?.pid) { try { process.kill(-chrome.pid, 'SIGKILL'); } catch {} }",
  "if (chrome?.pid) { stopGuard.stopGroup(chrome.pid, 'SIGKILL'); }");
replace("if (signature !== previous || now - last > 150) {", "if (true) {");
replace("await send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });",
  "await send('Performance.enable');\n  const clockMetrics = await send('Performance.getMetrics');\n  await send('Profiler.enable');\n  await send('Profiler.setSamplingInterval', { interval: 1000 });\n  await send('Profiler.start');\n  await send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });\n  const profileStarted = await js('performance.now()');\n  const profileLineStart = lines.length;");
replace("const audioTrace = await js(`(() => {",
  "const remaining = 2500 - (await js('performance.now()') - profileStarted);\n  if (remaining > 0) await sleep(remaining);\n  const sampledCPU = (await send('Profiler.stop')).profile;\n  const audioTrace = await js(`(() => {");
replace("console.log('AUDIO-SETTLE-DIAGNOSTIC:', JSON.stringify(queueSettle));",
  "console.log('AUDIO-SETTLE-DIAGNOSTIC:', JSON.stringify(queueSettle));\n  fs.writeFileSync(process.env.CHECKSUM_PROFILE_PREFIX + '.cpuprofile', JSON.stringify(sampledCPU));\n  fs.writeFileSync(process.env.CHECKSUM_PROFILE_PREFIX + '.json', JSON.stringify({ diagnosticOnly: true, profileStarted, clockMetrics, queueSettle, audioTrace, console: lines.slice(profileLineStart), capturedAt: performance.now(), load: process.env.CHECKSUM_PROFILE_LOAD }, null, 2));\n  console.log('PROFILE-CAPTURED', process.env.CHECKSUM_PROFILE_PREFIX);");
// The sample is saved before the original health and settle assertions execute.
const scratch = path.join(repo, 'build/checksum-profile-verifier.mjs');
fs.mkdirSync(path.dirname(scratch), { recursive: true });
fs.writeFileSync(scratch, source);
if (args.includes('--prepare-only')) {
  console.log('PROFILE-PREPARED', scratch);
  process.exit(0);
}
const results = [];
const identity = fs.readFileSync(path.join(web, 'BUILD-SHA'), 'utf8').trim();
function save() {
  const arms = Object.fromEntries(['portrait', 'landscape'].map(viewport => {
    const rows = results.filter(row => row.viewport === viewport);
    const times = rows.filter(row => row.capture).map(row => row.capture.queueSettle.elapsedMs).sort((a, b) => a - b);
    const median = times.length ? (times[Math.floor((times.length - 1) / 2)] + times[Math.ceil((times.length - 1) / 2)]) / 2 : null;
    return [viewport, { attempts: rows.length, captured: times.length,
      settled: rows.filter(row => row.capture?.queueSettle.settled).length,
      medianMs: median, worstMs: times.at(-1) ?? null,
      interpretation: 'Failed settle elapsed times are censored at the unchanged 2000ms gate; setup failures have no sample.' }];
  }));
  fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify({ diagnosticOnly: true, identity, repetitions,
    throttle: 4, gateMs: 2000, stableMs: 300, results, arms }, null, 2));
}
for (let repetition = 1; repetition <= repetitions; repetition++) {
  for (const viewport of ['portrait', 'landscape']) {
    const label = `${viewport}-${repetition}`, prefix = path.join(out, label);
    const load = os.loadavg();
    const fd = fs.openSync(prefix + '.log', 'w');
    console.log('PROFILE-START', JSON.stringify({ label, load, identity }));
    const row = await new Promise(resolve => {
      const child = spawn(process.execPath, [scratch, web, viewport === 'portrait' ? '--portrait' : '--phone',
        '--throttle', '4', '--deals', path.join(repo, 'bench/checksum-reference/deals.scm'),
        '--port', '8157', '--cdp', '9377'], { cwd: repo, stdio: ['ignore', fd, fd],
        env: { ...process.env, CHECKSUM_PROFILE_PREFIX: prefix, CHECKSUM_PROFILE_LOAD: JSON.stringify(load),
          PULSE_SINK: 'worker-null', PIPEWIRE_NODE: 'worker-null' } });
      child.once('error', error => resolve({ error: String(error), rc: null }));
      child.once('close', (rc, signal) => resolve({ rc, signal }));
    });
    fs.closeSync(fd);
    const capture = fs.existsSync(prefix + '.json') ? JSON.parse(fs.readFileSync(prefix + '.json', 'utf8')) : null;
    results.push({ label, viewport, repetition, load, ...row, capture });
    save();
    console.log('PROFILE-RESULT', JSON.stringify({ label, ...row, settle: capture?.queueSettle ?? null }));
  }
}
const captured = results.filter(row => row.capture).length;
console.log('PROFILE-DONE', JSON.stringify({ captured, expected: repetitions * 2, output: out }));
// Red browser checks are retained as measurements, never treated as green.
process.exitCode = captured === repetitions * 2 ? 0 : 1;
