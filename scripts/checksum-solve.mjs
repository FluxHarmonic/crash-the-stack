// Independent Pyramid solver. Reads DEAL datums, never generator witnesses
// or game/STACK rules. The 256-seed proof belongs on an azoth runner.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SIZE = 28;
const FULL = (1 << SIZE) - 1;
const rank = packet => packet % 13 + 1;
const children = Array.from({ length: SIZE }, () => []);
for (let row = 0; row < 6; row++) {
  for (let col = 0; col <= row; col++) {
    const id = row * (row + 1) / 2 + col;
    const left = (row + 1) * (row + 2) / 2 + col;
    children[id] = [left, left + 1];
  }
}

export function solve(pyramid, initialStock, { maxNodes = 2_000_000, passLimit = 3 } = {}) {
  if (pyramid.length !== 28 || initialStock.length !== 24)
    throw new Error('Need 28 pyramid and 24 feed packets');
  const offsets = pyramid.map(rank);
  const dead = new Set();
  let nodes = 0;
  let budgetExceeded = false;
  function search(mask, stock, position, waste, pass) {
    if (mask === 0) return [];
    // ROOT never needs a partner and removing it can only uncover packets.
    // Force free ROOTs to avoid permutations of the same harmless removals.
    const roots = [];
    let changed;
    do {
      changed = false;
      for (let id = 0; id < SIZE; id++) {
        if ((mask & (1 << id)) && offsets[id] === 13
            && children[id].every(child => !(mask & (1 << child)))) {
          mask &= ~(1 << id);
          roots.push([id, null]);
          changed = true;
        }
      }
    } while (changed);
    if (roots.length) {
      const tail = search(mask, stock, position, waste, pass);
      return tail === null ? null : [...roots, ...tail];
    }
    if (++nodes > maxNodes) {
      budgetExceeded = true;
      return null;
    }
    const key = `${mask}/${stock.slice(position).map(rank).join(',')}/${waste.map(rank).join(',')}/${pass}`;
    if (dead.has(key)) return null;
    const free = [];
    const required = Array(14).fill(0);
    const available = Array(14).fill(0);
    for (let id = 0; id < SIZE; id++) {
      if (mask & (1 << id)) {
        required[offsets[id]]++;
        available[offsets[id]]++;
        if (children[id].every(child => !(mask & (1 << child)))) free.push(id);
      }
    }
    for (let index = position; index < stock.length; index++) available[rank(stock[index])]++;
    for (const packet of waste) available[rank(packet)]++;
    // Even ideal future draws cannot clear a pyramid offset without enough
    // complementary packets left anywhere. This is only a necessary test.
    for (let offset = 1; offset <= 12; offset++) {
      if (required[offset] > available[13 - offset]) return null;
    }
    const choices = [];
    const top = waste.at(-1);
    // Prioritize pyramid progress, but search every stock/pass choice too.
    for (let a = 0; a < free.length; a++) {
      const id = free[a];
      if (offsets[id] === 13)
        choices.push([mask & ~(1 << id), stock, position, waste, pass, [id, null]]);
      for (let b = a + 1; b < free.length; b++) {
        const other = free[b];
        if (offsets[id] + offsets[other] === 13)
          choices.push([mask & ~(1 << id) & ~(1 << other), stock, position, waste, pass, [id, other]]);
      }
      if (top !== undefined && offsets[id] + rank(top) === 13)
        choices.push([mask & ~(1 << id), stock, position, waste.slice(0, -1), pass, [id, 'waste']]);
    }
    if (top !== undefined && rank(top) === 13)
      choices.push([mask, stock, position, waste.slice(0, -1), pass, ['waste', null]]);
    if (position < stock.length) {
      const next = stock[position];
      if (top !== undefined && rank(top) + rank(next) === 13)
        choices.push([mask, stock, position + 1, waste.slice(0, -1), pass, ['waste', 'pull']]);
      choices.push([mask, stock, position + 1, [...waste, next], pass, 'pull']);
    } else if (waste.length && pass < passLimit) {
      // waste is chronological here; recycling preserves its draw order.
      choices.push([mask, waste, 0, [], pass + 1, 'rollback']);
    }
    for (const [nextMask, nextStock, nextPosition, nextWaste, nextPass, action] of choices) {
      const tail = search(nextMask, nextStock, nextPosition, nextWaste, nextPass);
      if (tail !== null) return [action, ...tail];
      if (budgetExceeded) return null;
    }
    dead.add(key);
    return null;
  }
  const solution = search(FULL, initialStock, 0, [], 1);
  return { solvable: solution !== null, solution, nodes, budgetExceeded };
}

export function parseDeals(text) {
  const pattern = /\(deal (\d+) \(([\d\s]*)\) \(([\d\s]*)\)\)/g;
  const deals = [...text.matchAll(pattern)].map(match => ({
    seed: Number(match[1]),
    pyramid: match[2].trim().split(/\s+/).map(Number),
    stock: match[3].trim().split(/\s+/).map(Number),
  }));
  if (text.replace(pattern, '').trim()) throw new Error('Unexpected deal-export output');
  if (new Set(deals.map(deal => deal.seed)).size !== deals.length)
    throw new Error('Repeated seeds are not a proof');
  for (const deal of deals) {
    const deck = [...deal.pyramid, ...deal.stock].sort((a, b) => a - b);
    if (deal.pyramid.length !== 28 || deal.stock.length !== 24
        || deck.length !== 52 || deck.some((packet, index) => packet !== index))
      throw new Error(`Invalid deck for seed ${deal.seed}`);
  }
  return deals;
}

function main() {
  const [file, mode] = process.argv.slice(2);
  if (!file) throw new Error('Usage: node scripts/checksum-solve.mjs DEALS [--smoke]');
  const deals = parseDeals(readFileSync(file, 'utf8'));
  const minimum = mode === '--smoke' ? 1 : 200;
  if (deals.length < minimum) throw new Error(`Need at least ${minimum} distinct seeds`);
  let worst = 0;
  let firstPass = 0;
  for (const deal of deals) {
    // A stricter first-pass search avoids exploring two unnecessary feed
    // retries inside each bad branch. Success is still a legal Pyramid
    // proof; no generator witness is consulted. General deals may need
    // the full three-pass search, which remains available as a fallback.
    let result = solve(deal.pyramid, deal.stock, { passLimit: 1 });
    if (result.solvable) firstPass++;
    else result = solve(deal.pyramid, deal.stock);
    if (!result.solvable)
      throw new Error(`Seed ${deal.seed}: ${result.budgetExceeded ? 'budget exceeded (inconclusive)' : 'unsolvable'}`);
    worst = Math.max(worst, result.nodes);
  }
  // Sabotage: force a BOOT at the apex, remove every SYSOP (12) from
  // the input. BOOT cannot verify alone or find any complementary packet.
  // Bypass deck validation to test the solver's rules, not the parser.
  const broken = deals[0].pyramid.map(packet => rank(packet) === 12 ? 0 : packet);
  broken[0] = 0;
  const brokenStock = deals[0].stock.map(packet => rank(packet) === 12 ? 0 : packet);
  const red = solve(broken, brokenStock, { maxNodes: 2_000_000 });
  if (red.solvable || red.budgetExceeded)
    throw new Error(`Independent sabotage failed or inconclusive: nodes=${red.nodes}`);
  console.log(`SOLVED: ${deals.length}/${deals.length}; ${firstPass} on first pass; worst ${worst} nodes; independent coverage, ranks and feed`);
  console.log(`SABOTAGE: unsolvable after ${red.nodes} nodes; BOOT apex with no SYSOP`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
