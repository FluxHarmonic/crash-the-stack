#!/usr/bin/env node
// solve-seeds - which seeded DEFRAG deals can be won, and how hard they are.
//
//   node scripts/solve-seeds.mjs [--from 1] [--to 600] [--budget 1500000]
//                                [--out docs/p2b/winnable-lines.txt] [--probe 4]
//                                [--emit src/crash/cards/seeds.sgl]
//
// --emit PATH rewrites the WINNABLE-SEEDS vector in that module from the
// lines just written (the seed column, in file order).
//
// A full-knowledge Klondike solver over the deal (crash cards deck) makes
// from a seed (MINSTD Fisher-Yates, replicated here) under the table's
// rules as (crash cards rules) has them: PULL 1, unlimited turns of the
// buffer, kings only on an empty stack, a run moves from any face-up
// card, a locked (encrypted) packet ends its run and turns up when
// uncovered like a dealt face-down card. Under PULL 1 with unlimited
// turns every card in the feed and the buffer can be brought to the top,
// so the search keeps them as one POOL and plays any pool card directly.
// Foundation-to-table moves are never made (conservative: costs a WON
// verdict in rare deals, never gives a wrong one).
//
// This script is a LINE FINDER, not the authority: every line it writes
// is replayed through the real rules by test/test-cards-seeds.sgl, and
// only seeds whose line replays to a won game go into (crash cards
// seeds). The output file holds, per winnable seed, the line in the
// replay's notation:
//   tI.D   the run from depth D (0 = top) of pile I
//   wC     card C (0..51: suit = C div 13 in S H D C, rank = 1 + C mod 13)
//          from the pool (the feed or the buffer)
//   >tI    onto pile I;  >fI  onto foundation I (the suit's, or the first
//          empty one, as the rules pick it)
// Seeds are written easy to hard: by the positions the search visited to
// find the line (the hardness signal: lines run 62..101 moves whatever
// the deal, while the search spans four orders of magnitude), then by
// the line's length.
//
// --probe N: on each winnable seed, at the midpoint of its line, lock
// (encrypt) each of up to N encryptable packets in turn and re-solve;
// the summary reports how often one lock kills the deal (the number that
// decides between a softer encrypt and a DECRYPT tool; David's call).

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const FROM = parseInt(opt("--from", "1"), 10);
const TO = parseInt(opt("--to", "600"), 10);
const BUDGET = parseInt(opt("--budget", "1500000"), 10);
const PROBE = parseInt(opt("--probe", "4"), 10);
const PROBE_BUDGET = parseInt(opt("--probe-budget", "300000"), 10);
const OUT = opt("--out", "docs/p2b/winnable-lines.txt");
const EMIT = opt("--emit", null);

// ---- the deal, exactly as (crash stack prng) and (crash cards deck) make it ----
const MODULUS = 2147483647n, MULTIPLIER = 48271n;
function prngSeed(n) { let s = ((BigInt(n) % MODULUS) + MODULUS) % MODULUS; return s === 0n ? 1n : s; }
function prngNext(s) { return (s * MULTIPLIER) % MODULUS; }
function prngIndex(s, n) { return Number(s % BigInt(n)); }

function shuffledDeck(seed) {
  const v = Array.from({ length: 52 }, (_, i) => i);
  let rng = prngSeed(seed);
  for (let i = 51; i >= 1; i--) {
    rng = prngNext(rng);
    const j = prngIndex(rng, i + 1);
    const t = v[i]; v[i] = v[j]; v[j] = t;
  }
  return v;
}

const suit = (c) => Math.floor(c / 13);
const rank = (c) => 1 + (c % 13);
const red = (c) => suit(c) === 1 || suit(c) === 2;
const card = (s, r) => s * 13 + r - 1;
const SUITS = "SHDC", RANKS = "A234567890JQK";
const cardString = (c) => SUITS[suit(c)] + RANKS[rank(c) - 1];

// A position: piles (arrays bottom..top of {c, up}), fr (rank per suit),
// fidx (foundation index per suit, -1 unassigned), pool (array of cards).
function deal(seed) {
  const cards = shuffledDeck(seed);
  const piles = [];
  let k = 0;
  for (let i = 0; i < 7; i++) {
    const pile = [];
    for (let n = 0; n <= i; n++) pile.push({ c: cards[k++], up: false });
    pile[pile.length - 1].up = true;
    piles.push(pile);
  }
  return { piles, fr: [0, 0, 0, 0], fidx: [-1, -1, -1, -1], nextf: 0, pool: cards.slice(k) };
}

// ---- moves ----
function runLength(pile) { let n = 0; for (let i = pile.length - 1; i >= 0 && pile[i].up; i--) n++; return n; }
function validPile(c, top) { return top === null ? rank(c) === 13 : (red(c) !== red(top) && rank(c) === rank(top) - 1); }
function faceDown(p) { let n = 0; for (const pile of p.piles) for (const e of pile) if (!e.up) n++; return n; }
function onFoundations(p) { return p.fr[0] + p.fr[1] + p.fr[2] + p.fr[3]; }
function won(p) { return onFoundations(p) === 52; }

// A move: {src: ["t", i, d] | ["w", c], dst: ["t", i] | ["f", suit]}
function moves(p) {
  const tops = p.piles.map((pile) => pile.length ? pile[pile.length - 1].c : null);
  const out = [];
  // table moves, the rules' legal-moves less the pointless run splits
  for (let i = 0; i < 7; i++) {
    const pile = p.piles[i], len = pile.length, run = runLength(pile);
    for (let d = 0; d < run; d++) {
      const idx = len - 1 - d, c = pile[idx].c;
      const under = idx > 0 ? pile[idx - 1] : null;
      const splitOk = !under || !under.up || rank(under.c) === p.fr[suit(under.c)] + 1;
      if (d === 0 && rank(c) === p.fr[suit(c)] + 1) out.push({ src: ["t", i, d], dst: ["f", suit(c)] });
      if (!splitOk) continue;
      for (let j = 0; j < 7; j++) {
        if (j === i) continue;
        if (!validPile(c, tops[j])) continue;
        if (tops[j] === null && d + 1 === len) continue; // a king heading its pile to another empty pile
        out.push({ src: ["t", i, d], dst: ["t", j] });
      }
    }
  }
  // pool moves, from the destinations
  const inPool = new Set(p.pool);
  for (let s = 0; s < 4; s++) {
    const r = p.fr[s] + 1;
    if (r <= 13 && inPool.has(card(s, r))) out.push({ src: ["w", card(s, r)], dst: ["f", s] });
  }
  for (let j = 0; j < 7; j++) {
    const top = tops[j];
    const wanted = top === null ? [card(0, 13), card(1, 13), card(2, 13), card(3, 13)]
      : rank(top) === 1 ? [] : (red(top) ? [0, 3] : [1, 2]).map((s) => card(s, rank(top) - 1));
    for (const c of wanted) if (inPool.has(c)) out.push({ src: ["w", c], dst: ["t", j] });
  }
  return out;
}

function movedCard(p, m) { return m.src[0] === "w" ? m.src[1] : p.piles[m.src[1]][p.piles[m.src[1]].length - 1 - m.src[2]].c; }
function safe(p, c) {
  const r = rank(c);
  if (r <= 2) return true;
  const others = red(c) ? [0, 3] : [1, 2];
  return others.every((s) => p.fr[s] >= r - 1);
}
function uncovers(p, m) {
  if (m.src[0] !== "t") return false;
  const pile = p.piles[m.src[1]], d = m.src[2];
  return d + 1 === runLength(pile) && d + 1 < pile.length;
}
function orderedMoves(p) {
  const all = moves(p);
  const s = all.find((m) => m.dst[0] === "f" && safe(p, movedCard(p, m)));
  if (s) return [s];
  const score = (m) => m.dst[0] === "f" ? 0 : uncovers(p, m) ? 1 : m.src[0] === "w" ? 2 : 3;
  return all.map((m) => [score(m), m]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
}

function apply(p, m) {
  const piles = p.piles.slice();
  let cards;
  let pool = p.pool;
  if (m.src[0] === "w") {
    cards = [m.src[1]];
    pool = p.pool.filter((c) => c !== m.src[1]);
  } else {
    const i = m.src[1], pile = piles[i], n = m.src[2] + 1;
    cards = pile.slice(pile.length - n).map((e) => e.c);
    const rest = pile.slice(0, pile.length - n);
    if (rest.length && !rest[rest.length - 1].up) { rest[rest.length - 1] = { c: rest[rest.length - 1].c, up: true }; }
    piles[i] = rest;
  }
  const fr = p.fr, fidx = p.fidx;
  let nextf = p.nextf;
  if (m.dst[0] === "t") {
    const j = m.dst[1];
    piles[j] = piles[j].concat(cards.map((c) => ({ c, up: true })));
    return { piles, fr, fidx, nextf, pool };
  }
  const s = m.dst[1];
  const fr2 = fr.slice(); fr2[s] += 1;
  let fidx2 = fidx;
  if (fidx[s] < 0) { fidx2 = fidx.slice(); fidx2[s] = nextf; nextf += 1; }
  return { piles, fr: fr2, fidx: fidx2, nextf, pool };
}

function key(p) {
  let k = p.fr.join(",") + "|";
  for (const pile of p.piles) { for (const e of pile) k += String.fromCharCode(40 + e.c * 2 + (e.up ? 1 : 0)); k += "/"; }
  return k;
}
function distance(p) { return 8 * faceDown(p) + (52 - onFoundations(p)); }
const DMAX = 8 * 21 + 52;

// Best-first over the positions, each seen once. {status, line, nodes}
function solve(p0, budget) {
  const buckets = Array.from({ length: DMAX + 1 }, () => []);
  const seen = new Set([key(p0)]);
  buckets[distance(p0)].push({ p: p0, line: null });
  let nodes = 0, low = 0;
  for (;;) {
    while (low <= DMAX && buckets[low].length === 0) low++;
    if (low > DMAX) return { status: "lost", nodes };
    if (nodes >= budget) return { status: "unknown", nodes };
    const { p, line } = buckets[low].pop();
    if (won(p)) { const out = []; for (let l = line; l; l = l.prev) out.push(l.m); return { status: "won", line: out.reverse(), nodes }; }
    nodes++;
    for (const m of orderedMoves(p)) {
      const p1 = apply(p, m), k = key(p1);
      if (seen.has(k)) continue;
      seen.add(k);
      const d = distance(p1);
      buckets[d].push({ p: p1, line: { m, prev: line } });
      if (d < low) low = d;
    }
  }
}

// The replay notation. A foundation destination names the index the
// rules would pick: the suit's foundation, or the first empty one.
function lineText(p0, line) {
  let p = p0;
  const toks = [];
  for (const m of line) {
    const src = m.src[0] === "w" ? `w${m.src[1]}` : `t${m.src[1]}.${m.src[2]}`;
    let dst;
    if (m.dst[0] === "t") dst = `t${m.dst[1]}`;
    else { const s = m.dst[1]; dst = `f${p.fidx[s] >= 0 ? p.fidx[s] : p.nextf}`; }
    toks.push(`${src}>${dst}`);
    p = apply(p, m);
  }
  if (!won(p)) throw new Error("line does not win on replay");
  return toks.join(" ");
}

// ---- the encrypt-kill probe ----
function encryptable(p) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const pile = p.piles[i], run = runLength(pile);
    for (let d = 1; d < run; d++) out.push([i, d]);
  }
  return out;
}
function lock(p, i, d) {
  const piles = p.piles.slice();
  const pile = piles[i].slice(), idx = pile.length - 1 - d;
  pile[idx] = { c: pile[idx].c, up: false };
  piles[i] = pile;
  return { ...p, piles };
}
function probe(p0, line) {
  let p = p0;
  const half = Math.floor(line.length / 2);
  for (let k = 0; k < half; k++) p = apply(p, line[k]);
  const places = encryptable(p).slice(0, PROBE);
  const r = { tried: 0, won: 0, lost: 0, unknown: 0 };
  for (const [i, d] of places) {
    const v = solve(lock(p, i, d), PROBE_BUDGET);
    r.tried++; r[v.status]++;
  }
  return r;
}

// ---- main ----
const t0 = Date.now();
const results = [];
const tally = { won: 0, lost: 0, unknown: 0 };
const kills = { tried: 0, won: 0, lost: 0, unknown: 0, seedsKilled: 0, seedsProbed: 0 };
for (let seed = FROM; seed <= TO; seed++) {
  const p0 = deal(seed);
  const t = Date.now();
  const v = solve(p0, BUDGET);
  tally[v.status]++;
  let pr = null;
  if (v.status === "won" && PROBE > 0) {
    pr = probe(p0, v.line);
    kills.tried += pr.tried; kills.won += pr.won; kills.lost += pr.lost; kills.unknown += pr.unknown;
    if (pr.tried) kills.seedsProbed++;
    if (pr.lost) kills.seedsKilled++;
  }
  console.log(`seed ${seed} ${v.status} moves ${v.line ? v.line.length : 0} nodes ${v.nodes} ms ${Date.now() - t}` +
    (pr ? ` probe ${pr.tried} lost ${pr.lost} unknown ${pr.unknown}` : ""));
  if (v.status === "won") results.push({ seed, moves: v.line.length, nodes: v.nodes, text: lineText(p0, v.line), probe: pr });
}
results.sort((a, b) => a.nodes - b.nodes || a.moves - b.moves || a.seed - b.seed);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const header = [
  `# winnable DEFRAG seeds ${FROM}..${TO}, budget ${BUDGET}, sorted easy to hard (nodes, then moves)`,
  `# generated by scripts/solve-seeds.mjs; verified by test/test-cards-seeds.sgl through (crash cards rules)`,
  `# won ${tally.won} lost ${tally.lost} unknown ${tally.unknown}`,
];
fs.writeFileSync(OUT, header.concat(results.map((r) => `seed ${r.seed} moves ${r.moves} nodes ${r.nodes} line ${r.text}`)).join("\n") + "\n");
console.log(`--- seeds ${FROM}..${TO}: won ${tally.won} lost ${tally.lost} unknown ${tally.unknown} (${((100 * tally.won) / (TO - FROM + 1)).toFixed(1)}% won) in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
if (PROBE > 0) console.log(`--- encrypt probe: ${kills.tried} locks on ${kills.seedsProbed} winnable deals at mid-line: ${kills.lost} killed (${kills.tried ? ((100 * kills.lost) / kills.tried).toFixed(1) : 0}%), ${kills.unknown} unknown; ${kills.seedsKilled} deals killable by one lock (${kills.seedsProbed ? ((100 * kills.seedsKilled) / kills.seedsProbed).toFixed(1) : 0}%)`);
console.log(`--- wrote ${results.length} lines to ${OUT}`);
if (EMIT) {
  const src = fs.readFileSync(EMIT, "utf8");
  const m = src.match(/\(define WINNABLE-SEEDS\n\s+#\([^)]*\)\)/);
  if (!m) { console.log(`--- ${EMIT}: no WINNABLE-SEEDS vector found`); process.exit(1); }
  const rows = [];
  for (let i = 0; i < results.length; i += 12) rows.push(results.slice(i, i + 12).map((r) => r.seed).join(" "));
  const vec = `(define WINNABLE-SEEDS\n      #(${rows.join("\n        ")}))`;
  fs.writeFileSync(EMIT, src.replace(m[0], vec));
  console.log(`--- ${EMIT}: WINNABLE-SEEDS now ${results.length} seeds`);
}
