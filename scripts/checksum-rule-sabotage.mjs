// Light source-evaluation tests, with a behavioral plant for every test.
// Usage: node scripts/checksum-rule-sabotage.mjs SIGIL SIGIL_TEST_SOURCE SUBSTRATIC_SOURCE [TEST NAME ...]
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync,
         rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const [sigil, testSource, substraticSource] = process.argv.slice(2);
const preflightOnly = process.argv.includes('--check-anchors');
const focusedNames = process.argv.slice(5).filter(arg => arg !== '--check-anchors');
if (!sigil || !testSource || !substraticSource)
  throw new Error('Need SIGIL, SIGIL_TEST_SOURCE and SUBSTRATIC_SOURCE');
const repo = resolve('.');
const scratch = mkdtempSync(join(tmpdir(), 'checksum-rule-sabotage-'));
const source = join(scratch, 'src');
mkdirSync(join(source, 'crash'), { recursive: true });
cpSync(join(repo, 'src/crash'), join(source, 'crash'), { recursive: true });
cpSync(join(resolve(substraticSource), 'substratic'), join(source, 'substratic'), { recursive: true });
const rulePath = join(source, 'crash/checksum/rules.sgl');
const layoutPath = join(source, 'crash/checksum/layout.sgl');
const generatePath = join(source, 'crash/checksum/generate.sgl');
const tablePath = join(source, 'crash/checksum/table.sgl');
const tracePath = join(source, 'crash/checksum/trace.sgl');
const menuPath = join(source, 'crash/menu.sgl');
const inputPath = join(source, 'crash/input.sgl');
const cardsInputPath = join(source, 'crash/cards/input.sgl');
const scanTablePath = join(source, 'crash/scan/table.sgl');
const decryptTablePath = join(source, 'crash/decrypt/table.sgl');
const solvePath = join(source, 'crash/checksum/solve.sgl');
const rules = readFileSync(rulePath, 'utf8');
const layout = readFileSync(layoutPath, 'utf8');
const generate = readFileSync(generatePath, 'utf8');
const originals = new Map([[rulePath, rules], [layoutPath, layout], [generatePath, generate]]);
for (const file of [tablePath, tracePath, menuPath, inputPath, cardsInputPath, scanTablePath, decryptTablePath, solvePath])
  originals.set(file, readFileSync(file, 'utf8'));
const tests = readFileSync(join(repo, 'test/test-checksum.sgl'), 'utf8')
  + '\n' + readFileSync(join(repo, 'test/test-checksum-generate.sgl'), 'utf8')
  + '\n' + readFileSync(join(repo, 'test/test-checksum-table.sgl'), 'utf8')
  + '\n' + readFileSync(join(repo, 'test/test-menu.sgl'), 'utf8')
  + '\n' + readFileSync(join(repo, 'test/test-end-panels.sgl'), 'utf8')
  + '\n' + readFileSync(join(repo, 'test/test-checksum-runtime-solve.sgl'), 'utf8');
const hash = value => createHash('sha256').update(value).digest('hex');
const runFile = join(scratch, 'run.sgl');

function run(target) {
  const predicate = target
    ? `(lambda (td) (string=? (test-descriptor-name td) ${JSON.stringify(target)}))`
    : `(lambda (td) (member (test-descriptor-name td)
         (list ${selectedCases.map(c => JSON.stringify(c[3])).join(' ')})))`;
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
    encoding: 'utf8', timeout: selectedCases.some(entry => entry[0] === generatePath
      && (!target || entry[3] === target)) ? 900000 : 90000,
  });
}

const rootAnchor = '(and packet (= (card-rank packet) 13))';
const rootPlant = '(and packet (= (card-rank packet) 12))';
const sumAnchor = '\n              13)))';
const sumPlant = '\n              12)))';
const coverageAnchor = '(and (playable? (cboard-pyramid b) place)';
const coveragePlant = '(and (tile-present? (cboard-pyramid b) place)';
const cases = [
  [tablePath, 'board: b\n         trace:', 'board: #f\n         trace:',
    'opening an archive provides a playable board immediately and clocks advance on play'],
  [solvePath, '(= 13 (vector-ref (search-offsets s) id))', '(= 12 (vector-ref (search-offsets s) id))',
    'runtime ROOTs uncover the complete pyramid; missing complements prove loss'],
  [solvePath, '(when (and top (= 13 (+ offset (vector-ref feed-offsets top))))\n                   (add (node drawn',
    '(when (and top (= 12 (+ offset (vector-ref feed-offsets top))))\n                   (add (node drawn',
    'runtime buffer-to-PULL and buffer-to-pyramid moves replay through player doors'],
  [solvePath, '(< (node-pass n) (search-limit s))', '(<= (node-pass n) (search-limit s))',
    'runtime forbids a necessary fourth pass; permitting it is a positive control'],
  [solvePath, '(< (node-pass n) (search-limit s))', '(< (node-pass n) (- (search-limit s) 1))',
    'runtime preserves removed-feed order and clears a chain on exactly the third pass'],
  [solvePath, "(set-search-status! s 'inconclusive)", "(set-search-status! s 'unsolvable)",
    'runtime node exhaustion is inconclusive, with no accepted line'],
  [solvePath, "(and (eq? (search-status s) 'running) (more?))", "(eq? (search-status s) 'running)",
    'runtime frame slicing preserves the line, counters and unmodified dealt packets'],
  [inputPath, "(end-panel-actions (eq? (trace-phase (session-trace s)) 'cleared)",
    '(end-panel-actions #f',
    'STACK win defaults to NEW STACK; Return and Space request the next seed'],
  [inputPath, "(end-panel-actions (eq? (trace-phase (session-trace s)) 'cleared)",
    '(end-panel-actions #t',
    'STACK loss defaults to RESTART; Return and Space retain the seed'],
  [cardsInputPath, '(end-panel-actions (deal-won? d)', '(end-panel-actions #f',
    'DEFRAG win defaults to NEW DUMP; Return and Space request another deal'],
  [cardsInputPath, '(end-panel-actions (deal-won? d)', '(end-panel-actions #t',
    'DEFRAG loss defaults to RESTART; Return and Space retain the seed'],
  [scanTablePath, '(panel default: 0)', '(panel default: 1)',
    'SCAN win defaults to NEW SEGMENT; Return starts another'],
  [scanTablePath, '(panel default: 0)', '(panel default: 1)',
    'SCAN loss defaults to RESTART; Return requests retry'],
  [decryptTablePath, '(end-panel-actions #t', '(end-panel-actions #f',
    'DECRYPT completed DAILY defaults to NEW BOARD; Return starts TIMED'],
  [decryptTablePath, '(end-panel-actions #f', '(end-panel-actions #t',
    "DECRYPT TIME'S UP defaults to RESTART; Return restarts TIMED"],
  [tablePath, '440 256', '256 256',
    'both horizontal docks keep packet-sized targets below the base and real taps draw then select'],
  [tablePath, "(end-panel-actions (eq? (checksum-table-outcome t) 'cleared)",
    '(end-panel-actions #f',
    'a win defaults to NEW ARCHIVE and Return requests a fresh board'],
  [tablePath, "(end-panel-actions (eq? (checksum-table-outcome t) 'cleared)",
    '(end-panel-actions #t',
    'a loss defaults to RESTART and Return retries its seed'],
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
  [generatePath, '(list->vector (take cards 28))',
    '(list->vector (map (lambda (packet) (modulo packet 13)) (take cards 28)))',
    'ten seeds use all 52 distinct packets, with 28 in the pyramid and 24 in the feed'],
  [generatePath, 'rng: (prng-seed seed)', 'rng: (prng-seed 41)',
    'a seed repeats exactly, a neighboring seed differs'],
  [generatePath, 'solution: (checksum-solve-line s)', 'solution: (reverse (checksum-solve-line s))',
    'ten recorded solutions clear via player controls with the feed in play'],
  [rulePath, sumAnchor, sumPlant, 'tap-click pairs and ROOTs go through the same table selection'],
  [tablePath, '(let loop ((id 27))', '(let loop ((id 0))',
    'a tap in overlap hits the visible child, and covered packets cannot be selected'],
  [tablePath, "((memq key '(space return))", "((memq key '(unused))",
    'arrows plus Space and Enter perform a packet pair'],
  [rulePath, "(eq? (cboard-selected b) 'waste)", "(eq? (cboard-selected b) 'invalid)",
    'PULL by key or tap permits a selected buffer-to-next-pull pair'],
  [tablePath, "((eq? key 'u) (undo t))", "((eq? key 'u) t)",
    'U undoes a move; a no-op undo never charges the trace'],
  [tablePath, '(if (checksum-table-paused before) 0.0 dt)', 'dt',
    'pause clears selection, holds both clocks, and Escape resumes'],
  [tablePath, '(if (checksum-table-paused before) 0.0 dt)',
    '(if (or (checksum-table-paused before) (checksum-table-outcome before)) 0.0 dt)',
    'clear freezes trace, keeps the panel fade clock running and offers retry/new/quit'],
  [tablePath, "((checksum-lost? b) 'stalled)", "((checksum-lost? b) #f)",
    'no legal removals at the final feed shows SEAL HOLDS'],
  [tablePath, '(clock-steps clock)\n                                             fire-checksum-ice',
    '0\n                                             fire-checksum-ice',
    'HACKER runs the shared trace phases and severs; CLASSIC never severs'],
  [tablePath, '(trace-pass tr)', 'tr', 'HACKER rollback uses the shared pass charge'],
  [tracePath, '(* LOCK-DECAY TICKS-PER-SECOND)', '(* 2 LOCK-DECAY TICKS-PER-SECOND)',
    'existing LOCK and SCRAMBLE members only; arithmetic lock leaves a disjoint move'],
  [rulePath, '(board-unscramble (cboard-pyramid b) place)', '(cboard-pyramid b)',
    'shared SCRAMBLE preserves packets; selecting a marked face clears its glitch'],
  [tracePath, "history: '()\n                            pyramid:", 'history: (cboard-history before)\n                            pyramid:',
    'ICE cuts undo history; temporary locks cannot cause an immediate loss'],
  [menuPath, "'free-checksum \"CHECKSUM\" 'new-board 'version 'back",
    "'free-checksum \"CHECKSUM\" 'version 'new-board 'back",
    'CHECKSUM tile opens its own screen and NEW BOARD selects CHECKSUM'],
  [menuPath, "((free-checksum) 'checksum)", "((free-checksum) 'stack)",
    "CHECKSUM's version stays independent and Back returns to its kept tile"],
];
const selectedCases = focusedNames.length
  ? cases.filter(entry => focusedNames.includes(entry[3])) : cases;
if (!selectedCases.length || (focusedNames.length && selectedCases.length !== focusedNames.length))
  throw new Error('Every focused name must identify one sabotage case');

try {
  for (const [file, anchor, , target] of selectedCases)
    if (originals.get(file).split(anchor).length !== 2)
      throw new Error(`Anchor must occur once (${target}): ${anchor}`);
  if (preflightOnly) {
    console.log(`ANCHORS: ${selectedCases.length}/${selectedCases.length} unique; no source evaluation or plant ran`);
  } else {
  const clean = run();
  if (clean.status !== 0 || !clean.stdout.includes(`TEST-COUNT: ${selectedCases.length}`))
    throw new Error(`Clean test failed: rc=${clean.status}, signal=${clean.signal}, error=${clean.error || ''}\n${clean.stdout}${clean.stderr}`);
  console.log(`CLEAN: ${selectedCases.length}/${selectedCases.length}`);
  for (const [file, anchor, plant, target] of selectedCases) {
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
        || !red.stdout.includes('TEST-COUNT: 1') || red.stderr.includes('Error (')
        || red.stdout.includes('| error:'))
      throw new Error(`Sabotage did not produce the intended assertion: ${target}\n${red.stdout}${red.stderr}`);
    console.log(`RED: ${target}`);
  }
  const restored = run();
  if (restored.status !== 0) throw new Error(`Restored test failed: ${restored.stdout}${restored.stderr}`);
  console.log(`RESTORED: ${selectedCases.length}/${selectedCases.length}; ${selectedCases.length} verified behavioral plants`);
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
