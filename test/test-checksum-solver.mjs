// Hand-derived checks for the independent solver, separate from deal tests.
import assert from 'node:assert/strict';
import { solve } from '../scripts/checksum-solve.mjs';

const roots = () => Array(28).fill(12);
const stockRoots = () => Array(24).fill(12);

assert.equal(solve(roots(), stockRoots()).solvable, true, 'ROOTs verify alone');
assert.equal(solve(Array(28).fill(0), Array(24).fill(0)).solvable, false,
  'no ROOTs or sum-to-13 pair is unsolvable');

const bufferPair = roots();
bufferPair[0] = 0;
const feedPair = [4, 7, 11, ...Array(21).fill(12)];
const paired = solve(bufferPair, feedPair);
assert.equal(paired.solvable, true);
assert.ok(paired.solution.some(move => Array.isArray(move)
  && move[0] === 'waste' && move[1] === 'pull'), 'buffer-to-next-PULL pair');
assert.ok(paired.solution.some(move => Array.isArray(move)
  && move[0] === 0 && move[1] === 'waste'), 'buffer-to-pyramid pair');

// A covered chain goes 4 -> 3 -> 2 -> 1 from leaf to apex. Feed partners
// appear in the reverse order; unmatched 5s block older buffer partners.
const fourPasses = roots();
fourPasses[0] = 0;
fourPasses[1] = 1;
fourPasses[3] = 2;
fourPasses[6] = 3;
const reverseFeed = [11, 4, 10, 4, 9, 4, 8, ...Array(17).fill(4)];
assert.equal(solve(fourPasses, reverseFeed).solvable, false, 'fourth pass forbidden');
const allowed = solve(fourPasses, reverseFeed, { passLimit: 4 });
assert.equal(allowed.solvable, true, 'control: permitting fourth pass clears the chain');
assert.equal(allowed.solution.filter(move => move === 'rollback').length, 3);
const threePasses = roots();
threePasses[0] = 0;
threePasses[1] = 1;
threePasses[3] = 2;
const threeFeed = [11, 4, 10, 4, 9, ...Array(19).fill(4)];
const lastPass = solve(threePasses, threeFeed);
assert.equal(lastPass.solvable, true, 'third pass is allowed');
assert.equal(lastPass.solution.filter(move => move === 'rollback').length, 2);
console.log('PASS: independent solver ROOT, arithmetic, coverage chain, buffer/PULL, buffer/pyramid and pass-budget controls');
