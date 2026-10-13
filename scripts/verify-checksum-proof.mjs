// Runner gate: source tests/sabotages and an independent 256-seed proof.
// node scripts/verify-checksum-proof.mjs [build/web] [--out DIR]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const at = args.indexOf('--out');
const out = path.resolve(at < 0 ? 'build/checksum-proof' : args[at + 1]);
fs.mkdirSync(out, { recursive: true });
const sigil = process.env.PATH.split(path.delimiter).map(dir => path.join(dir, 'sigil'))
  .find(file => fs.existsSync(file));
if (!sigil) throw new Error('SETUP-FAILED: pinned Sigil not on PATH');
const testSource = path.resolve('.sigil/deps/sigil-test/src');
const substraticSource = path.resolve('.sigil/deps/substratic/src');
for (const source of [testSource, substraticSource])
  if (!fs.existsSync(source)) throw new Error(`SETUP-FAILED: missing ${source}`);

function run(name, command, argv, timeout = 180_000) {
  const result = spawnSync(command, argv, { cwd: process.cwd(), encoding: 'utf8',
    env: { ...process.env, PULSE_SINK: 'worker-null', PIPEWIRE_NODE: 'worker-null' },
    timeout, maxBuffer: 10 * 1024 * 1024 });
  fs.writeFileSync(path.join(out, name), (result.stdout || '') + (name === 'deals.scm' ? '' : result.stderr || ''));
  if (name === 'deals.scm') fs.writeFileSync(path.join(out, 'runtime-metrics.scm'), result.stderr || '');
  if (result.error || result.status !== 0)
    throw new Error(`${name} failed: rc=${result.status}, ${result.error || ''}\n${result.stdout}${result.stderr}`);
  return result.stdout;
}
const version = run('version.log', sigil, ['--version']);
if (!/\b0\.22\.10\b/.test(version)) throw new Error(`Wrong Sigil version: ${version}`);
console.log(run('sabotage.log', 'node', ['scripts/checksum-rule-sabotage.mjs', sigil, testSource, substraticSource], 7_200_000).trim());
console.log(run('controls.log', 'node', ['test/test-checksum-solver.mjs']).trim());
const deals = run('deals.scm', sigil, ['-L', 'src', 'eval', '-q', '-f', 'bench/checksum-deals.sgl'], 7_200_000);
if (!deals.includes('(deal 256 ')) throw new Error('Incomplete deal export');
console.log(run('proof.log', 'node', ['scripts/checksum-solve.mjs', path.join(out, 'deals.scm')], 600_000).trim());
console.log(run('runtime-metrics.log', 'node', ['scripts/checksum-runtime-metrics.mjs',
  path.join(out, 'deals.scm'), path.join(out, 'runtime-metrics.scm'), path.join(out, 'runtime-metrics.json')]).trim());
const sha = run('source-sha.txt', 'git', ['rev-parse', 'HEAD']).trim();
fs.writeFileSync(path.join(out, 'complete'), `CHECKSUM-PROOF-COMPLETE ${sha}\n`);
console.log(`PASS checksum proof: source ${sha}; artifacts ${out}`);
