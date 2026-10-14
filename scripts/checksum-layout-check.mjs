// Focused source checks and one behavioral spacing plant, in a scratch copy.
// Run with nice19 on a worker; no project cold build or full suite.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const [binary, testLibrary, substraticLibrary] = process.argv.slice(2).map(p => path.resolve(p));
assert.equal(os.getPriority(), 19, 'source checks inherit nice19');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'checksum-layout-'));
const source = path.join(scratch, 'src');
fs.mkdirSync(source);
fs.cpSync('src/crash', path.join(source, 'crash'), { recursive: true });
const table = path.join(source, 'crash/checksum/table.sgl');
const original = fs.readFileSync(table, 'utf8');
const tests = fs.readFileSync('test/test-checksum-table.sgl', 'utf8');
const target = 'both horizontal docks keep packet-sized targets below the base and real taps draw then select';
const hash = text => createHash('sha256').update(text).digest('hex');
function run(filtered) {
  const entry = path.join(scratch, 'run.sgl');
  const predicate = filtered
    ? `(lambda (td) (string=? (test-descriptor-name td) ${JSON.stringify(target)}))`
    : '(lambda (td) #t)';
  fs.writeFileSync(entry, `${tests}\n
(let ((s (run-tests-filtered ${predicate})))
  (for-each (lambda (r)
              (unless (test-result-passed? r)
                (display "TEST-FAIL: ") (display (test-result-name r))
                (display " | ") (display (test-result-message r)) (newline)))
            (test-summary-results s))
  (display "TEST-COUNT: ") (display (test-summary-total s)) (newline)
  (display "TEST-PASSED: ") (display (test-summary-passed s)) (newline)
  (display "TEST-SKIPPED: ") (display (test-summary-skipped s)) (newline)
  (when (> (test-summary-failed s) 0) (exit 1)))\n`);
  return spawnSync(binary, ['-L', source, '-L', testLibrary, '-L', substraticLibrary,
    'eval', '-f', entry], { cwd: scratch, encoding: 'utf8', timeout: 120_000,
    env: { ...process.env, XDG_CACHE_HOME: path.join(scratch, 'cache') } });
}
function requireResult(result, rc, count) {
  assert.equal(result.error, undefined);
  assert.equal(result.status, rc, result.stdout + result.stderr);
  assert.ok(result.stdout.includes(`TEST-COUNT: ${count}`), result.stdout + result.stderr);
  assert.ok(result.stdout.includes('TEST-SKIPPED: 0'), result.stdout + result.stderr);
  if (rc === 0) assert.ok(result.stdout.includes(`TEST-PASSED: ${count}`), result.stdout + result.stderr);
  assert.ok(!result.stdout.includes('| error:') && !result.stderr.includes('Error ('),
    'import, syntax and runtime errors cannot count as behavioral reds');
}
try {
  requireResult(run(false), 0, 17);
  console.log('LAYOUT CLEAN: 17/17 table controls');
  const anchor = '(if (eq? dock \'right) 440 256) 280 56 76';
  assert.equal(original.split(anchor).length, 2, 'unique pull spacing anchor');
  const planted = original.replace(anchor, '(if (eq? dock \'right) 440 256) 258 56 76');
  fs.writeFileSync(table, planted);
  const red = run(true);
  fs.writeFileSync(table, original);
  assert.equal(hash(fs.readFileSync(table)), hash(original), 'exact source restoration');
  requireResult(red, 1, 1);
  assert.ok(red.stdout.includes(`TEST-FAIL: ${target}`));
  console.log('LAYOUT RED: squeezing the pile against the pyramid is rejected');
  requireResult(run(false), 0, 17);
  console.log('LAYOUT RESTORED: 17/17 table controls');
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
