// Focused light source checks. Plants run only in hash-verified scratch copies.
// Usage: nice -n19 node scripts/checksum-pool-sabotage.mjs SIGIL SIGIL_TEST_SOURCE [--check-anchors]
// --remote skips the desktop load threshold on an authorized worker only.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const [binary, testSource] = process.argv.slice(2);
assert.ok(binary && testSource, 'need pinned binary and test library source');
const sigil = path.resolve(binary), library = path.resolve(testSource);
const remote = process.argv.includes('--remote');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'checksum-pool-sabotage-'));
const source = path.join(scratch, 'src');
fs.mkdirSync(source);
fs.cpSync('src/crash', path.join(source, 'crash'), { recursive: true });
const file = path.join(source, 'crash/checksum/pool.sgl');
const original = fs.readFileSync(file, 'utf8');
const tests = fs.readFileSync('test/test-checksum-pool.sgl', 'utf8');
const hash = value => createHash('sha256').update(value).digest('hex');
const cases = [
  ['(+ 1 (vector-ref (cycle-bag c) (cycle-next c)))', '1',
    'two complete cycles each contain every pool seed exactly once'],
  ['(consume! c at)\n                (find', '(when (not seed) (consume! c at))\n                (find',
    'explicit starts and retries do not consume or repeat another pending board'],
  ['(cycle rng: (prng-seed entropy))', '(cycle rng: 1)',
    'cycle entropy reproduces its own order and changes other orders'],
  ['pyramid: (board (cboard-pyramid b) rng: actual)',
    'pyramid: (board (cboard-pyramid b) faces: (vector-ref data 1) rng: actual)',
    'a pool board owns its packets and starts with untouched player state'],
  ["'(3 4 5 6 7)", "'(4 4 5 6 7)",
    'pool difficulty records keep the runtime acceptance filter'],
];
function run(target) {
  if (!remote) assert.ok(os.loadavg()[0] < 8, 'local source checks require load1<8');
  assert.equal(os.getPriority(), 19, 'evaluator inherits nice19 from the harness');
  const predicate = target
    ? `(lambda (td) (string=? (test-descriptor-name td) ${JSON.stringify(target)}))`
    : '(lambda (td) #t)';
  const entry = path.join(scratch, 'run.sgl');
  fs.writeFileSync(entry, `${tests}\n
(let ((s (run-tests-filtered ${predicate})))
  (for-each (lambda (r)
              (unless (test-result-passed? r)
                (display "TEST-FAIL: ") (display (test-result-name r))
                (display " | ") (display (test-result-message r)) (newline)))
            (test-summary-results s))
  (display "TEST-COUNT: ") (display (test-summary-total s)) (newline)
  (when (> (test-summary-failed s) 0) (exit 1)))\n`);
  return spawnSync(sigil, ['-L', source, '-L', library, 'eval', '-f', entry], {
    cwd: scratch, encoding: 'utf8', timeout: 60_000,
    env: { ...process.env, XDG_CACHE_HOME: path.join(scratch, 'cache') },
  });
}
function green(result) {
  assert.equal(result.error, undefined, 'source evaluator launched and completed');
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.ok(result.stdout.includes('TEST-COUNT: 5'), 'exact five focused tests ran');
}
try {
  for (const [anchor, , target] of cases)
    assert.equal(original.split(anchor).length, 2, `unique anchor: ${target}`);
  if (process.argv.includes('--check-anchors')) {
    console.log('ANCHORS: 5/5 unique; no evaluator or plant ran');
  } else {
    green(run()); console.log('CLEAN: 5/5');
    for (const [anchor, plant, target] of cases) {
      const changed = original.replace(anchor, plant);
      fs.writeFileSync(file, changed);
      assert.equal(hash(fs.readFileSync(file)), hash(changed), 'exact planted source hash');
      assert.notEqual(hash(changed), hash(original), 'plant changes source');
      const red = run(target);
      fs.writeFileSync(file, original);
      assert.equal(hash(fs.readFileSync(file)), hash(original), 'exact restored source hash');
      assert.equal(red.error, undefined, 'planted evaluator launched and completed');
      assert.equal(red.status, 1, red.stdout + red.stderr);
      assert.ok(red.stdout.includes(`TEST-FAIL: ${target}`), red.stdout + red.stderr);
      assert.ok(red.stdout.includes('TEST-COUNT: 1'), 'one intended test ran');
      assert.ok(!red.stdout.includes('| error:') && !red.stderr.includes('Error ('),
        'syntax/import/runtime errors never count as behavioral reds');
      console.log(`RED: ${target}`);
    }
    green(run()); console.log('RESTORED: 5/5; 5 verified behavioral plants');
  }
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
