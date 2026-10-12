// Light source-evaluation tests, with a behavioral plant for every test.
// Usage: node scripts/checksum-rule-sabotage.mjs SIGIL SIGIL_TEST_SOURCE
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync,
         rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const [sigil, testSource] = process.argv.slice(2);
if (!sigil || !testSource) throw new Error('Need SIGIL and SIGIL_TEST_SOURCE');
const repo = resolve('.');
const scratch = mkdtempSync(join(tmpdir(), 'checksum-rule-sabotage-'));
const source = join(scratch, 'src');
mkdirSync(join(source, 'crash'), { recursive: true });
for (const family of ['stack', 'cards', 'checksum'])
  cpSync(join(repo, 'src/crash', family), join(source, 'crash', family), { recursive: true });
const rulePath = join(source, 'crash/checksum/rules.sgl');
const layoutPath = join(source, 'crash/checksum/layout.sgl');
const generatePath = join(source, 'crash/checksum/generate.sgl');
const rules = readFileSync(rulePath, 'utf8');
const layout = readFileSync(layoutPath, 'utf8');
const generate = readFileSync(generatePath, 'utf8');
const originals = new Map([[rulePath, rules], [layoutPath, layout], [generatePath, generate]]);
const tests = readFileSync(join(repo, 'test/test-checksum.sgl'), 'utf8')
  + '\n' + readFileSync(join(repo, 'test/test-checksum-generate.sgl'), 'utf8');
const hash = value => createHash('sha256').update(value).digest('hex');
const runFile = join(scratch, 'run.sgl');

function run(target) {
  const predicate = target
    ? `(lambda (td) (string=? (test-descriptor-name td) ${JSON.stringify(target)}))`
    : '(lambda (td) #t)';
  writeFileSync(runFile, `${tests}\n
(let ((summary (run-tests-filtered ${predicate})))
  (for-each (lambda (r)
              (unless (test-result-passed? r)
                (display "TEST-FAIL: ")
                (display (test-result-name r))
                (display " | ")
                (display (test-result-message r))
                (newline)))
            (test-summary-results summary))
  (display "TEST-COUNT: ")
  (display (test-summary-total summary))
  (newline)
  (when (> (test-summary-failed summary) 0) (exit 1)))
`);
  return spawnSync(resolve(sigil), ['-L', source, '-L', resolve(testSource), 'eval', '-f', runFile], {
    cwd: scratch,
    env: { ...process.env, XDG_CACHE_HOME: join(scratch, 'cache') },
    encoding: 'utf8', timeout: 30000,
  });
}

const rootAnchor = '(and packet (= (card-rank packet) 13))';
const rootPlant = '(and packet (= (card-rank packet) 12))';
const sumAnchor = '\n              13)))';
const sumPlant = '\n              12)))';
const coverageAnchor = '(and (playable? (cboard-pyramid b) place)';
const coveragePlant = '(and (tile-present? (cboard-pyramid b) place)';
const cases = [
  [layoutPath, "left: '()\n                                              right: '()",
    'left: (neighborhood-left (layout-neighborhood lay id))\n                                              right: (neighborhood-right (layout-neighborhood lay id))',
    'all seven leaves are free, all other packets covered'],
  [layoutPath, "right: '()", "right: '() above: '()",
    'both children must leave; unrelated leaves do not uncover a parent'],
  [rulePath, coverageAnchor, coveragePlant, 'a covered ROOT cannot be removed'],
  [layoutPath, "right: '()", "right: '() above: '()",
    'each of the 21 parents is covered exactly by its own two children'],
  [rulePath, sumAnchor, sumPlant,
    'distinct free offsets totaling 13 leave together, preserving the old board'],
  [rulePath, sumAnchor, sumPlant,
    'a wrong sum, a repeated place and a covered partner are refused'],
  [rulePath, rootAnchor, rootPlant,
    'a free ROOT leaves on one tap, an ordinary packet cannot leave alone'],
  [rulePath, 'stock: (cdr (cboard-stock b))\n                                   waste:',
    'stock: (cboard-stock b)\n                                   waste:',
    'PULL moves one packet to the buffer and clears the selection'],
  [rulePath, "((eq? place 'waste) (pair? (cboard-waste b)))",
    "((eq? place 'waste) #f)",
    'only the buffer top pairs with a free pyramid packet'],
  [rulePath, "(eq? (cboard-selected b) 'waste)", "(eq? (cboard-selected b) 'invalid)",
    'selecting the buffer then PULL cancels a complementary next packet'],
  [rulePath, rootAnchor, rootPlant, 'buffer ROOT verifies alone and exposes the older packet'],
  [rulePath, '(reverse (cboard-waste b))', '(cboard-waste b)',
    'ROLLBACK restores original feed order; exactly three passes, never a fourth'],
  [rulePath, '(if (null? (cboard-history b))', '(if (pair? (cboard-history b))',
    'undo restores removed packets, feed, buffer and pass count'],
  [rulePath, '(board-cleared? (cboard-pyramid b))', '#f',
    'clearing the pyramid wins even with packets left in the feed'],
  [rulePath, '(not (checksum-won? b))', '(checksum-won? b)',
    'loss requires an exhausted feed, no pass and no legal removal'],
  [generatePath, '(vector-set! packets a (car group))', '(vector-set! packets a 0)',
    'ten seeds use all 52 distinct packets, with 28 in the pyramid and 24 in the feed'],
  [generatePath, '(shuffled-deck seed)', '(shuffled-deck 1)',
    'a seed repeats exactly, a neighboring seed differs'],
  [generatePath, "(list 'pull move)", "(list move 'pull)",
    'ten recorded solutions clear via player controls with the feed in play'],
];

try {
  const clean = run();
  if (clean.status !== 0 || !clean.stdout.includes(`TEST-COUNT: ${cases.length}`))
    throw new Error(`Clean test failed: ${clean.stdout}${clean.stderr}`);
  console.log(`CLEAN: ${cases.length}/${cases.length}`);
  for (const [file, anchor, plant, target] of cases) {
    const original = originals.get(file);
    if (original.split(anchor).length !== 2) throw new Error(`Anchor must occur once: ${anchor}`);
    const planted = original.replace(anchor, plant);
    writeFileSync(file, planted);
    if (hash(readFileSync(file)) === hash(original) || !readFileSync(file, 'utf8').includes(plant))
      throw new Error(`Plant did not land: ${target}`);
    const red = run(target);
    writeFileSync(file, original);
    if (hash(readFileSync(file)) !== hash(original)) throw new Error(`Restore failed: ${target}`);
    // Require the targeted assertion to fail after successful evaluation.
    // Syntax/import/runtime errors are not evidence of sabotage detection.
    if (red.status !== 1 || !red.stdout.includes(`TEST-FAIL: ${target}`)
        || !red.stdout.includes('TEST-COUNT: 1') || red.stderr.includes('Error ('))
      throw new Error(`Sabotage did not produce the intended assertion: ${target}\n${red.stdout}${red.stderr}`);
    console.log(`RED: ${target}`);
  }
  const restored = run();
  if (restored.status !== 0) throw new Error(`Restored test failed: ${restored.stdout}${restored.stderr}`);
  console.log(`RESTORED: ${cases.length}/${cases.length}; ${cases.length} verified behavioral plants`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
