// Integer oracle for CYCLIC-SOURCE, also used by the browser arm at step 200.
// node docs/codex/field-rules/sweep-cyclic.mjs [rain-per-mille ...] [--legacy]
// --legacy reproduces the first presentation and its unbounded waiting time.
import { fileURLToPath } from 'node:url';
const WIDTH = 40, HEIGHT = 22, CELLS = WIDTH * HEIGHT;
function hash31(x) {
  x = Math.imul(x ^ (x >>> 16), 0x2c9277) & 0x7fffffff;
  x = Math.imul(x ^ (x >>> 15), 0x3a8f05) & 0x7fffffff;
  return x ^ (x >>> 16);
}
const neighbors = Array.from({length: CELLS}, (_, i) => {
  const cells = [];
  for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) {
    if (x || y) cells.push(((Math.floor(i / WIDTH) + y + HEIGHT) % HEIGHT) * WIDTH +
                          (i % WIDTH + x + WIDTH) % WIDTH);
  }
  return cells;
});
export function cyclicAt(seed, steps, rain = 16, legacy = false, visit = 550) {
  let rng = seed, current = new Uint8Array(CELLS), next = new Uint8Array(CELLS);
  const ages = new Uint8Array(CELLS), shown = new Uint8Array(CELLS);
  for (let i = 0; i < CELLS; i++) {
    rng = rng * 48271 % 2147483647;
    current[i] = Math.floor((rng % 1000000) / 1000000 * 16);
    ages[i] = legacy ? 0 : hash31((seed + i) & 0x7fffffff) % 24;
    shown[i] = legacy ? current[i] * 16 : 32;
  }
  let peak = 0, peakStep = 0, minimumChanged = CELLS, minimumTones = 8;
  let longestWait = 0, accentPeak = 0;
  for (let step = 0; step < steps; step++) {
    const key = hash31((hash31(seed) + Math.imul(step, 2047323)) & 0x7fffffff);
    let changed = 0;
    const counts = new Uint16Array(8);
    for (let i = 0; i < CELLS; i++) {
      const k = current[i], successor = (k + 1) % 16;
      const h = hash31((key + i % WIDTH + Math.floor(i / WIDTH) * 64) & 0x7fffffff);
      const advance = h % 1000 < rain || neighbors[i].some(j => current[j] === successor);
      const moved = (!legacy && ages[i] >= 23) || ((h >>> 10) % 1000 < visit && advance);
      next[i] = moved ? successor : k;
      ages[i] = moved ? 0 : Math.min(255, ages[i] + 1);
      longestWait = Math.max(longestWait, ages[i]);
      changed += moved;
      shown[i] = legacy ? next[i] * 16 : Math.floor((shown[i] * 7 + (moved ? 176 : 16)) / 8);
      const base = Math.floor(shown[i] / 32), quarter = Math.floor((shown[i] % 32) / 8);
      counts[base] += 4 - quarter;
      counts[(base + 1) % 8] += quarter;
    }
    minimumTones = Math.min(minimumTones, counts.filter(n => n > 0).length);
    minimumChanged = Math.min(minimumChanged, changed);
    const dominant = Math.max(...counts) / (4 * CELLS);
    if (dominant > peak) { peak = dominant; peakStep = step + 1; }
    accentPeak = Math.max(accentPeak, (counts[6] + counts[7]) / (4 * CELLS));
    [current, next] = [next, current];
  }
  const tones = new Array(CELLS * 4);
  for (let i = 0; i < CELLS; i++) {
    const base = Math.floor(shown[i] / 32), up = (base + 1) % 8;
    const q = Math.floor((shown[i] % 32) / 8);
    const at = Math.floor(i / WIDTH) * 2 * WIDTH * 2 + (i % WIDTH) * 2;
    tones[at] = q >= 1 ? up : base;
    tones[at + 1] = q === 3 ? up : base;
    tones[at + WIDTH * 2] = base;
    tones[at + WIDTH * 2 + 1] = q >= 2 ? up : base;
  }
  return {tones, summary: {rain, seed, legacy, visit, peak, peakStep, minimumChanged, minimumTones, longestWait, accentPeak}};
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), legacy = args.includes('--legacy');
  const rains = args.filter(a => a !== '--legacy').map(Number);
  for (const rain of rains.length ? rains : [16]) for (let seed = 1; seed <= 8; seed++)
    console.log(JSON.stringify(cyclicAt(seed, 6000, rain, legacy).summary));
}
