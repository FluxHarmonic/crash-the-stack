// One runner lease: compiled regressions and browser/audio/captures first;
// then one pure compiled exporter partitioned across cores. Never hosts.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { parseDeals } from './checksum-solve.mjs';

const args = process.argv.slice(2);
const web = path.resolve(args[0] || 'build/web');
const at = args.indexOf('--out');
const out = path.resolve(at < 0 ? '../out/checksum-ordered' : args[at + 1]);
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
    let expired = false, killTimer;
    const timer = setTimeout(() => {
      expired = true;
      try { process.kill(-child.pid, 'SIGTERM'); } catch {}
      killTimer = setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }, 10_000);
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
  if (label.startsWith('population/') && (row.rc !== 0 || row.error || row.expired))
    marker('proof-failed', `${label}-FAILED; TAKE-PROVISIONAL-HOST-DOWN`);
  return row.rc === 0 && !row.error && !row.expired;
}
async function requireRun(...argv) {
  assert.ok(await run(...argv), `required step ${argv[0]}`);
}
const reference = path.resolve('bench/checksum-reference/deals.scm');
assert.equal(createHash('sha256').update(fs.readFileSync(reference)).digest('hex'),
  '8a1914f39f6ed1f888d59252cc0ad618cd487bd64c65d6344be9054b0d0f0da1');
const cohort = parseDeals(fs.readFileSync(reference, 'utf8'));
assert.equal(cohort.length, 254);
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

// All of these precede both native compilation and the long population.
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
for (const viewport of ['portrait', 'desktop']) for (const dock of ['center', 'right']) {
  const label = `${viewport}-${dock}`;
  await run(label, 'node', ['verify-checksum.mjs', web,
    ...(viewport === 'portrait' ? ['--portrait'] : []), '--dock', dock,
    '--deals', reference, '--shot', path.join(out, 'screens', `${label}.png`)], 1_000_000);
}
if (results.every(r => r.rc === 0 && !r.error && !r.expired))
  marker('ready-for-host', 'BROWSER-AUDIO-CAPTURES-REGRESSIONS-PASS; proof running');
else marker('browser-gates-failed', 'DO-NOT-HOST');

let proofPassed = false;
try {
  const packageSource = fs.readFileSync('package.sgl', 'utf8');
  const changed = packageSource.replace("entry: '(crash main)", "entry: '(crash checksum proof temporary)");
  assert.notEqual(changed, packageSource);
  const fixture = path.resolve('src/crash/checksum/proof/temporary.sgl');
  assert.ok(!fs.existsSync(fixture), 'temporary entry absent');
  const nativeSource = fs.readFileSync('bench/checksum-native-export.sgl', 'utf8');
  fs.writeFileSync(path.join(out, 'native-population-source.sgl'), nativeSource);
  fs.mkdirSync(path.dirname(fixture), { recursive: true });
  fs.writeFileSync(fixture, nativeSource);
  const binary = path.join(out, 'checksum-native-export');
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
  await requireRun('population/seed-2', binary, ['2'], 1_800_000, true);
  assert.deepEqual(parseDeals(fs.readFileSync(path.join(out, 'population/seed-2.scm'), 'utf8')), [cohort[1]],
    'compiled command-line dispatch and actual state smoke');
  const workers = Math.min(os.availableParallelism(), 8);
  fs.writeFileSync(path.join(out, 'partition.json'), JSON.stringify({
    workers, runnerCores: os.availableParallelism(), seeds: 256,
    method: 'One compiled pure binary, explicit per-seed invocations; one worker per core up to eight. All seeds 1..256, fresh state, files flushed incrementally.',
  }, null, 2));
  const pending = Array.from({ length: 256 }, (_, i) => i + 1).filter(seed => seed !== 2);
  await Promise.all(Array.from({ length: workers }, async () => {
    while (pending.length) {
      const seed = pending.shift();
      await run(`population/seed-${seed}`, binary, [String(seed)], 1_800_000, true);
    }
  }));
  const fresh = [], metrics = [];
  for (let seed = 1; seed <= 256; seed++) {
    const row = results.find(r => r.label === `population/seed-${seed}`);
    assert.ok(row?.rc === 0 && !row.error && !row.expired, `seed ${seed} completed`);
    const text = fs.readFileSync(path.join(out, `population/seed-${seed}.scm`), 'utf8');
    const dealt = parseDeals(text);
    assert.equal(dealt.length, 1); assert.equal(dealt[0].seed, seed);
    if (seed <= 254) assert.deepEqual(dealt[0], cohort[seed - 1], `fresh reference state ${seed}`);
    fresh.push(text);
    metrics.push(fs.readFileSync(path.join(out, `population/seed-${seed}.metrics.scm`), 'utf8'));
  }
  const deals = path.join(out, 'fresh-deals.scm');
  const diagnostics = path.join(out, 'runtime-metrics.scm');
  fs.writeFileSync(deals, fresh.join(''));
  fs.writeFileSync(diagnostics, metrics.join(''));
  await requireRun('independent-controls', 'node', ['test/test-checksum-solver.mjs']);
  await requireRun('independent-proof', 'node', ['scripts/checksum-solve.mjs', deals], 1_800_000);
  await requireRun('runtime-metrics', 'node', ['scripts/checksum-runtime-metrics.mjs', deals,
    diagnostics, path.join(out, 'runtime-metrics.json'), 'native']);
  marker('population-complete', '256-FRESH-STATES-INDEPENDENTLY-PROVED; negative control passed');
  proofPassed = true;
} catch (error) {
  fs.writeFileSync(path.join(out, 'proof-error.txt'), String(error.stack || error) + '\n');
  marker('proof-failed', 'TAKE-PROVISIONAL-HOST-DOWN');
  console.error(error);
}
const plants = fs.readFileSync('scripts/checksum-rule-sabotage.mjs', 'utf8');
const focused = [...plants.matchAll(/^  \[(?:solvePath|generatePath),[\s\S]*?\n\s+'([^']+)'\]/gm)].map(m => m[1]);
assert.equal(focused.length, 9, 'six runtime plus three generator controls');
const plantPass = await run('affected-plants', 'node', ['scripts/checksum-rule-sabotage.mjs',
  sigil, '.sigil/deps/sigil-test/src', '.sigil/deps/substratic/src', ...focused], 3_600_000);
assert.equal(fs.readFileSync('package.sgl', 'utf8').includes("entry: '(crash main)"), true);
assert.equal(spawnSync('git', ['status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).stdout.trim(), '',
  'proof and sabotage restore all tracked files');
if (proofPassed && plantPass && results.every(r => r.rc === 0 && !r.error && !r.expired))
  marker('complete', 'ALL-GATES-PASS');
else {
  marker('failed', 'INCOMPLETE-OR-FAILED-GATES; DO-NOT-HOST');
  if (!plantPass) marker('proof-failed', 'AFFECTED-PLANTS-FAILED; TAKE-PROVISIONAL-HOST-DOWN');
  process.exitCode = 1;
}
