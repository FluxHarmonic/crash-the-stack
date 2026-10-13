// Validate and summarize the actual runtime rejection population.
// Source evaluator timings are distinct from the browser frame/audio gate.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { parseDeals } from './checksum-solve.mjs';

const [dealsFile, metricsFile, output, timing = 'source'] = process.argv.slice(2);
if (!dealsFile || !metricsFile || !output) throw new Error('Need DEALS METRICS OUTPUT');
assert.ok(['source', 'native'].includes(timing), 'known timing provenance');
const deals = parseDeals(fs.readFileSync(dealsFile, 'utf8'));
const text = fs.readFileSync(metricsFile, 'utf8');
const candidatePattern = /\(candidate (\d+) (\d+) (solved|unsolvable|inconclusive) ([\d.eE+-]+) (\d+) (\d+) (\d+) (\d+)\)/g;
const acceptedPattern = /\(accepted (\d+) ([\d.eE+-]+) (\d+) (\d+)\)/g;
const candidates = [...text.matchAll(candidatePattern)].map(m => ({ seed: +m[1], attempt: +m[2],
  status: m[3], milliseconds: +m[4], nodes: +m[5], failed: +m[6], draws: +m[7], needed: +m[8] }));
const accepted = [...text.matchAll(acceptedPattern)].map(m => ({ seed: +m[1],
  milliseconds: +m[2], attempts: +m[3], nodes: +m[4] }));
assert.equal(text.replace(candidatePattern, '').replace(acceptedPattern, '').trim(), '', 'only recognized diagnostics');
assert.ok(deals.length >= 200, '200+ independently provable output seeds');
assert.equal(accepted.length, deals.length);
assert.equal(new Set(accepted.map(r => r.seed)).size, deals.length);
const winners = [];
for (const deal of deals) {
  const row = accepted.find(r => r.seed === deal.seed);
  assert.ok(row, `timing for seed ${deal.seed}`);
  const attempts = candidates.filter(r => r.seed === deal.seed);
  assert.equal(attempts.length, row.attempts);
  attempts.forEach((r, index) => assert.equal(r.attempt, index + 1));
  assert.equal(attempts.reduce((sum, r) => sum + r.nodes, 0), row.nodes);
  const hard = r => r.status === 'solved' && r.draws >= 8 && r.failed >= 20 && 100 * r.needed <= 55 * r.draws;
  const last = attempts.at(-1);
  assert.ok(hard(last), `accepted seed ${deal.seed} meets runtime difficulty filter`);
  assert.ok(attempts.slice(0, -1).every(r => !hard(r)), 'prior candidates were correctly rejected');
  winners.push(last);
}
function distribution(rows, field) {
  const values = rows.map(field).sort((a, b) => a - b);
  return values.length ? { n: values.length, mean: values.reduce((a, b) => a + b, 0) / values.length,
    p50: values[Math.floor((values.length - 1) * .5)],
    p95: values[Math.floor((values.length - 1) * .95)], max: values.at(-1) } : { n: 0 };
}
const rate = r => r.draws ? r.needed / r.draws : 0;
const solved = candidates.filter(r => r.status === 'solved');
const summary = {
  method: `Actual runtime stepper; 100k nodes/candidate, three passes, Fisher-Yates candidates. ${timing === 'native' ? 'Compiled native' : 'Source evaluator'} milliseconds, not web-frame timing. Search-order metrics, not exact minimum passes.`,
  seeds: deals.length, candidates: candidates.length,
  acceptancePercent: 100 * winners.length / candidates.length,
  provedSolvable: solved.length,
  inconclusive: candidates.filter(r => r.status === 'inconclusive').length,
  provedUnsolvable: candidates.filter(r => r.status === 'unsolvable').length,
  easyRejected: solved.length - winners.length,
  attemptsPerDeal: distribution(accepted, r => r.attempts),
  candidateMs: distribution(candidates, r => r.milliseconds),
  acceptedSearchMs: distribution(winners, r => r.milliseconds),
  wholeDealMs: distribution(accepted, r => r.milliseconds),
  beforeFilterDrawMatchRate: distribution(solved, rate),
  afterFilterDrawMatchRate: distribution(winners, rate),
  beforeFilterFailedStates: distribution(solved, r => r.failed),
  afterFilterFailedStates: distribution(winners, r => r.failed),
};
fs.writeFileSync(output, JSON.stringify({ summary, candidates, accepted }, null, 2));
console.log(JSON.stringify(summary, null, 2));
