// Runner measurement of untouched shuffled deals and difficulty filters.
// This is analysis, not the runtime generator or a replacement proof gate.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { parseDeals, solve } from './checksum-solve.mjs';

const [oldFile, randomFile, outDir] = process.argv.slice(2);
if (!oldFile || !randomFile || !outDir) throw new Error('Need OLD DEALS, RANDOM DEALS, OUT');
const out = path.resolve(outDir);
fs.mkdirSync(out, { recursive: true });
const rank = packet => packet % 13 + 1;
const children = Array.from({ length: 28 }, () => []);
for (let row = 0; row < 6; row++) for (let col = 0; col <= row; col++) {
  const id = row * (row + 1) / 2 + col;
  const left = (row + 1) * (row + 2) / 2 + col;
  children[id] = [left, left + 1];
}

function lineMetrics(deal, solution) {
  const live = new Set(Array.from({ length: 28 }, (_, id) => id));
  let stock = [...deal.stock], position = 0, waste = [], passes = 1;
  let draws = 0, nextMatches = 0, pullPairs = 0;
  function draw() {
    assert.ok(position < stock.length, 'witness draw has a feed packet');
    const packet = stock[position++], offset = rank(packet);
    const top = waste.at(-1);
    const needed = offset === 13 || (top !== undefined && rank(top) + offset === 13)
      || [...live].some(id => children[id].every(child => !live.has(child))
        && rank(deal.pyramid[id]) + offset === 13);
    draws++; if (needed) nextMatches++;
    return packet;
  }
  for (const action of solution) {
    if (action === 'pull') { waste.push(draw()); continue; }
    if (action === 'rollback') {
      assert.equal(position, stock.length); assert.ok(waste.length);
      stock = waste; position = 0; waste = []; passes++; continue;
    }
    const [a, b] = action;
    if (a === 'waste' && b === 'pull') { draw(); waste.pop(); pullPairs++; }
    else if (a === 'waste') waste.pop();
    else {
      assert.ok(live.delete(a), 'witness removes an existing pyramid packet');
      if (b === 'waste') waste.pop();
      else if (b !== null) assert.ok(live.delete(b));
    }
  }
  assert.equal(live.size, 0); assert.ok(passes <= 3);
  return { passes, draws, nextMatches, nextMatchRate: draws ? nextMatches / draws : 0, pullPairs };
}

function measure(deal, budget) {
  const started = performance.now();
  const searches = [];
  let accepted;
  for (let passLimit = 1; passLimit <= 3; passLimit++) {
    const result = solve(deal.pyramid, deal.stock, { maxNodes: budget, passLimit });
    searches.push({ passLimit, nodes: result.nodes, failedBranches: result.failedBranches,
      memoizedDeadStates: result.memoizedDeadStates, budgetExceeded: result.budgetExceeded,
      solvable: result.solvable });
    if (result.solvable) { accepted = result; break; }
  }
  return { seed: deal.seed, milliseconds: performance.now() - started,
    solvable: !!accepted, inconclusive: !accepted && searches.some(s => s.budgetExceeded),
    searches, ...(accepted ? { ...lineMetrics(deal, accepted.solution),
      failedBranches: accepted.failedBranches,
      minimumPassesKnown: searches.slice(0, -1).every(s => !s.budgetExceeded) } : {}) };
}

function quantiles(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  return sorted.length ? { n: sorted.length, mean: sorted.reduce((a, b) => a + b, 0) / sorted.length,
    p50: sorted[Math.floor((sorted.length - 1) * .5)], p95: sorted[Math.floor((sorted.length - 1) * .95)],
    max: sorted.at(-1) } : { n: 0 };
}
function distribution(rows) {
  const wins = rows.filter(row => row.solvable);
  const passCounts = [1, 2, 3].map(pass => wins.filter(row => row.passes === pass).length);
  const rateBins = Array.from({ length: 10 }, (_, bin) => wins.filter(row =>
    Math.min(9, Math.floor(row.nextMatchRate * 10)) === bin).length);
  return { candidates: rows.length, solved: wins.length,
    acceptedPercent: rows.length ? 100 * wins.length / rows.length : 0,
    inconclusive: rows.filter(row => row.inconclusive).length,
    provedUnsolvable: rows.filter(row => !row.solvable && !row.inconclusive).length,
    solutionPasses: passCounts, exactMinimumPasses: wins.filter(row => row.minimumPassesKnown).length,
    nextMatchRateDeciles: rateBins, nextMatchRate: quantiles(wins.map(row => row.nextMatchRate)),
    failedBranches: quantiles(wins.map(row => row.failedBranches)),
    allCandidateMs: quantiles(rows.map(row => row.milliseconds)),
    acceptedMs: quantiles(wins.map(row => row.milliseconds)) };
}

const populations = [
  ['constructed', parseDeals(fs.readFileSync(oldFile, 'utf8')), 2_000_000],
  ['random', parseDeals(fs.readFileSync(randomFile, 'utf8')), 100_000],
];
const measured = {};
for (const [name, deals, budget] of populations) {
  const rows = [];
  for (const deal of deals) {
    rows.push(measure(deal, budget));
    if (rows.length % 25 === 0) {
      fs.writeFileSync(path.join(out, `${name}-progress.json`), JSON.stringify(distribution(rows), null, 2));
      console.log(`${name}: ${rows.length}/${deals.length}, solved ${rows.filter(row => row.solvable).length}`);
    }
  }
  measured[name] = rows;
  fs.writeFileSync(path.join(out, `${name}.json`), JSON.stringify(rows, null, 2));
}
const filters = {};
for (const rate of [.45, .55, .65]) for (const minBranches of [0, 20, 100]) {
  const accepted = measured.random.filter(row => row.solvable
    && row.nextMatchRate <= rate && row.failedBranches >= minBranches);
  filters[`rate<=${rate},failedBranches>=${minBranches}`] = {
    acceptancePercent: 100 * accepted.length / measured.random.length,
    ...distribution(accepted),
  };
}
const summary = { method: 'Independent search: constructed budget 2M/pass, random budget 100k/pass; budget failures are inconclusive/discarded.',
  metric: 'Next draw is needed if ROOT or complementary to a currently free pyramid packet or buffer top on the independently found solution. Failed branches depend on solver ordering.',
  constructed: distribution(measured.constructed), random: distribution(measured.random), filters };
fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
