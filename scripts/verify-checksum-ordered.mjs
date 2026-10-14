// One runner lease: browser/audio/captures and compiled regressions, then
// independent proof of actual bundled player states. Never hosts.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { parseDeals } from './checksum-solve.mjs';
import { createProcessStopGuard } from './process-stop-guard.mjs';

const stopGuard = createProcessStopGuard();

const args = process.argv.slice(2);
const web = path.resolve(args[0] || 'build/web');
const at = args.indexOf('--out');
const out = path.resolve(at < 0 ? '../out/checksum-proof/ordered' : args[at + 1]);
fs.mkdirSync(out, { recursive: true });
const sha = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
assert.match(sha, /^[a-f0-9]{40}$/);
assert.equal(fs.readFileSync(path.join(web, 'index.html'), 'utf8').match(/version: "([^"]+)"/)?.[1], sha.slice(0, 12));
assert.equal(createHash('sha256').update(fs.readFileSync('sigil.lock')).digest('hex'),
  '22369be17e274d0951e2194bed157917940317ee659d29c6142d3eed753d6636');
const env = { ...process.env, OPTIMIZE: '2', PULSE_SINK: 'worker-null', PIPEWIRE_NODE: 'worker-null' };
const results = [];
function save() {
  fs.writeFileSync(path.join(out, 'results.json.tmp'), JSON.stringify({ sha, results }, null, 2));
  fs.renameSync(path.join(out, 'results.json.tmp'), path.join(out, 'results.json'));
}
function marker(file, detail) {
  fs.writeFileSync(path.join(out, file), `${detail} ${sha}\n`);
  console.log(`CHECKSUM-ORDERED ${file} ${detail} ${sha}`);
}
function fatal(error) {
  fs.writeFileSync(path.join(out, 'fatal-error.txt'), String(error.stack || error) + '\n');
  marker('proof-failed', 'UNHANDLED-GATE-FAILURE; TAKE-PROVISIONAL-HOST-DOWN');
  console.error(error);
  process.exit(1);
}
process.on('uncaughtException', fatal);
process.on('unhandledRejection', fatal);
async function run(label, command, argv, timeout = 1_800_000, separate = false) {
  const stdout = path.join(out, `${label}.${separate ? 'scm' : 'log'}`);
  const stderr = separate ? path.join(out, `${label}.metrics.scm`) : stdout;
  fs.mkdirSync(path.dirname(stdout), { recursive: true });
  const fd = fs.openSync(stdout, 'w');
  const errorFd = separate ? fs.openSync(stderr, 'w') : fd;
  const started = Date.now();
  console.log(`CHECKSUM-ORDERED START ${label}`);
  const row = await new Promise(resolve => {
    const child = spawn(command, argv, { env, stdio: ['ignore', fd, errorFd], detached: true });
    stopGuard.admit();
    let expired = false, killTimer;
    const timer = setTimeout(() => {
      expired = true;
      stopGuard.stopGroup(child.pid, 'SIGTERM');
      killTimer = setTimeout(() => stopGuard.stopGroup(child.pid, 'SIGKILL'), 10_000);
    }, timeout);
    let error = '';
    child.on('error', e => { error = String(e); });
    child.on('close', (rc, signal) => {
      clearTimeout(timer); clearTimeout(killTimer);
      resolve({ label, rc, signal, error, expired, seconds: (Date.now() - started) / 1000 });
    });
  });
  fs.closeSync(fd); if (separate) fs.closeSync(errorFd);
  results.push(row); save();
  console.log(`CHECKSUM-ORDERED RESULT ${JSON.stringify(row)}`);
  return row.rc === 0 && !row.error && !row.expired;
}
async function requireRun(...argv) {
  assert.ok(await run(...argv), `required step ${argv[0]}`);
}
const reference = path.resolve('bench/checksum-reference/deals.scm');
assert.equal(createHash('sha256').update(fs.readFileSync(reference)).digest('hex'),
  '8a1914f39f6ed1f888d59252cc0ad618cd487bd64c65d6344be9054b0d0f0da1');
const cohort = parseDeals(fs.readFileSync(reference, 'utf8'));
const manifestFile = 'bench/checksum-reference/pool-manifest.json';
const metricsFile = 'bench/checksum-reference/runtime-metrics.scm';
const dataFile = 'src/crash/checksum/pool/data.sgl';
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
assert.equal(cohort.length, manifest.count);
assert.ok(cohort.length >= 200, '200+ bundled, independently provable states');
assert.equal(hash(reference), manifest.dealsSha256);
assert.equal(hash(metricsFile), manifest.metricsSha256);
assert.equal(hash(dataFile), manifest.dataSha256);
for (const file of [reference, metricsFile, manifestFile, dataFile])
  fs.copyFileSync(file, path.join(out, path.basename(file)));
const sigil = process.env.PATH.split(path.delimiter).map(dir => path.join(dir, 'sigil'))
  .find(file => fs.existsSync(file));
assert.ok(sigil, 'pinned Sigil available');
await requireRun('version', sigil, ['--version']);
assert.match(fs.readFileSync(path.join(out, 'version.log'), 'utf8'), /\b0\.22\.10\b/);
fs.cpSync(web, path.join(out, 'web'), { recursive: true,
  filter: file => !['native', 'bin', '.sigil-package-cache'].includes(path.basename(file)) });
fs.writeFileSync(path.join(out, 'web/BUILD-SHA'), sha + '\n');
fs.writeFileSync(path.join(out, 'wasm.sha256'),
  createHash('sha256').update(fs.readFileSync(path.join(web, 'crash-the-stack.wasm'))).digest('hex') + '\n');

// Check player-facing behavior before compiling the separate pure pool exporter.
for (const viewport of ['portrait', 'landscape', 'desktop']) for (const repetition of [1, 2, 3]) {
  const label = `${viewport}-${repetition}`;
  const ok = await run(label, 'node', ['verify-checksum.mjs', web,
    ...(viewport === 'portrait' ? ['--portrait'] : viewport === 'landscape' ? ['--phone'] : []),
    '--throttle', '4', '--deals', reference, '--shot', path.join(out, 'screens', `${label}.png`)], 610_000);
  if (!ok) {
    marker('browser-gates-failed', 'CENTER-REPETITION-FAILED; STOP; DO-NOT-HOST');
    process.exit(1);
  }
}
for (const [label, script] of [['stack', 'verify.mjs'], ['defrag', 'verify-cards.mjs'],
  ['scan', 'verify-scan.mjs'], ['intercept', 'verify-intercept.mjs'], ['decrypt', 'verify-decrypt.mjs']])
  await run(label, 'node', [script, web, '--phone']);
for (const [label, file, filter] of [
  ['jack-out', 'test/test-trace.sgl', "the severed board's panel rows:"],
  ['severed-tools', 'test/test-hud.sgl', 'under SEVERED every tool but NEXT is disabled'],
]) {
  const report = path.join(out, `${label}.json`);
  if (await run(label, 'scripts/dev', ['sigil', 'test', '--filter', filter, '--report', report, file])) {
    const r = JSON.parse(fs.readFileSync(report, 'utf8'));
    assert.equal(r.summary.total, 1); assert.equal(r.summary.passed, 1);
  }
}

// The opening fix is shared by the soundtrack: exercise its real player,
// fresh/resume, cancellation, changed-text refusal and adaptive reopen paths.
const musicReport = path.join(out, 'music-live.json');
await requireRun('music-live', 'scripts/dev', ['sigil', 'test', '--report', musicReport,
  'test/test-music-live.sgl']);
const musicResult = JSON.parse(fs.readFileSync(musicReport, 'utf8'));
assert.ok(musicResult.summary.total > 0);
assert.equal(musicResult.summary.passed, musicResult.summary.total);
assert.equal(musicResult.summary.failed, 0);
assert.equal(musicResult.summary.skipped, 0);
if (results.every(r => r.rc === 0 && !r.error && !r.expired))
  marker('browser-complete', 'BROWSER-AUDIO-CAPTURES-REGRESSIONS-PASS; pool proof pending');
else marker('browser-gates-failed', 'DO-NOT-HOST');

let proofPassed = false;
try {
  const packageSource = fs.readFileSync('package.sgl', 'utf8');
  const changed = packageSource.replace("entry: '(crash main)", "entry: '(crash checksum proof temporary)");
  assert.notEqual(changed, packageSource);
  const fixture = path.resolve('src/crash/checksum/proof/temporary.sgl');
  assert.ok(!fs.existsSync(fixture), 'temporary entry absent');
  const nativeSource = fs.readFileSync('bench/checksum-pool-export.sgl', 'utf8');
  fs.writeFileSync(path.join(out, 'native-pool-source.sgl'), nativeSource);
  fs.mkdirSync(path.dirname(fixture), { recursive: true });
  fs.writeFileSync(fixture, nativeSource);
  const binary = path.join(out, 'checksum-pool-export');
  try {
    fs.writeFileSync('package.sgl', changed);
    await requireRun('native-build', 'scripts/dev', ['sigil', 'build', '--config', 'release'], 3_600_000);
    fs.copyFileSync('build/release/bin/crash-the-stack', binary);
    fs.chmodSync(binary, 0o755);
  } finally {
    fs.writeFileSync('package.sgl', packageSource);
    fs.rmSync(fixture, { force: true });
  }
  fs.writeFileSync(path.join(out, 'native-binary.sha256'),
    createHash('sha256').update(fs.readFileSync(binary)).digest('hex') + '\n');
  await requireRun('pool-export', binary, cohort.map(deal => String(deal.seed)), 30_000, true);
  const deals = path.join(out, 'pool-export.scm');
  const emitted = parseDeals(fs.readFileSync(deals, 'utf8'));
  assert.deepEqual(emitted, cohort, 'compiled player packets exactly match every bundled reference');
  const metadata = fs.readFileSync(path.join(out, 'pool-export.metrics.scm'), 'utf8');
  const pattern = /\(pool-entry (\d+) (\d+) (\d+) (\d+) (\d+) (\d+)\)/g;
  const rows = [...metadata.matchAll(pattern)].map(row => row.slice(1).map(Number));
  assert.equal(metadata.replace(pattern, '').trim(), '', 'only recognized compiled pool metadata');
  assert.deepEqual(rows, manifest.entries.map(r => [r.seed, r.draws, r.needed, r.failed, r.attempts, r.totalNodes]),
    'compiled difficulty metadata matches the archived acceptance ledger');
  await requireRun('pool-repackage', 'node', ['scripts/checksum-pool-data.mjs',
    '--deals', reference, '--metrics', metricsFile, '--expect', String(cohort.length),
    '--producer', manifest.producer, '--backend', manifest.backend,
    '--data', path.join(out, 'repacked-data.sgl'), '--manifest', path.join(out, 'repacked-manifest.json')]);
  assert.equal(hash(path.join(out, 'repacked-data.sgl')), manifest.dataSha256, 'metadata repack reproduces committed data bytes');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(out, 'repacked-manifest.json'), 'utf8')), manifest);
  await requireRun('independent-controls', 'node', ['test/test-checksum-solver.mjs']);
  await requireRun('independent-proof', 'node', ['scripts/checksum-solve.mjs', deals], 600_000);
  await requireRun('difficulty-ledger', 'node', ['scripts/checksum-runtime-metrics.mjs', deals,
    metricsFile, path.join(out, 'runtime-metrics.json'), manifest.backend]);
  marker('population-complete', `${cohort.length}-ACTUAL-BUNDLED-STATES-INDEPENDENTLY-PROVED; negative control passed`);
  proofPassed = true;
} catch (error) {
  fs.writeFileSync(path.join(out, 'proof-error.txt'), String(error.stack || error) + '\n');
  marker('proof-failed', 'TAKE-PROVISIONAL-HOST-DOWN');
  console.error(error);
}
const plants = fs.readFileSync('scripts/checksum-rule-sabotage.mjs', 'utf8');
const offlineFocused = [...plants.matchAll(/^  \[(?:solvePath|generatePath),[\s\S]*?\n\s+'([^']+)'\]/gm)].map(m => m[1]);
assert.equal(offlineFocused.length, 9, 'six runtime plus three generator controls');
const focused = offlineFocused.concat([
  'center packets stay below the base and real taps draw then select',
  'opening an archive provides a playable board immediately and clocks advance on play',
  'CHECKSUM tile opens its own screen and NEW BOARD selects CHECKSUM',
  "CHECKSUM's version stays independent and Back returns to its kept tile",
]);
for (const [label, file, total] of [
  ['compiled-table', 'test/test-checksum-table.sgl', 17],
  ['compiled-pool', 'test/test-checksum-pool.sgl', 5],
]) {
  const report = path.join(out, `${label}.json`);
  await requireRun(label, 'scripts/dev', ['sigil', 'test', '--report', report, file]);
  const summary = JSON.parse(fs.readFileSync(report, 'utf8')).summary;
  assert.equal(summary.total, total); assert.equal(summary.passed, total);
  assert.equal(summary.failed, 0); assert.equal(summary.skipped, 0);
}
await requireRun('pool-plants', 'nice', ['-n19', 'node', 'scripts/checksum-pool-sabotage.mjs',
  sigil, '.sigil/deps/sigil-test/src', '--remote']);
const plantPass = await run('affected-plants', 'node', ['scripts/checksum-rule-sabotage.mjs',
  sigil, '.sigil/deps/sigil-test/src', '.sigil/deps/substratic/src', ...focused], 3_600_000);
assert.equal(fs.readFileSync('package.sgl', 'utf8').includes("entry: '(crash main)"), true);
assert.equal(spawnSync('git', ['status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).stdout.trim(), '',
  'proof and sabotage restore all tracked files');
if (proofPassed && plantPass && results.every(r => r.rc === 0 && !r.error && !r.expired)) {
  marker('ready-for-host', 'ALL-BROWSER-AUDIO-REGRESSION-POOL-PROOF-PLANT-GATES-PASS');
  marker('complete', 'ALL-GATES-PASS');
}
else {
  marker('failed', 'INCOMPLETE-OR-FAILED-GATES; DO-NOT-HOST');
  if (!plantPass) marker('proof-failed', 'AFFECTED-PLANTS-FAILED; TAKE-PROVISIONAL-HOST-DOWN');
  process.exitCode = 1;
}
