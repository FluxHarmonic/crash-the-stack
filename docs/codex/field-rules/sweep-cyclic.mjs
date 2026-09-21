// Exploratory integer model of CYCLIC-SOURCE; browser acceptance remains
// scripts/verify-field-rules.mjs. Scan EVERY step, including short-lived
// nearly flat frames that a 15-second browser sampling interval can miss.
// node docs/codex/field-rules/sweep-cyclic.mjs [rain-per-mille ...]
const WIDTH = 40, HEIGHT = 22, CELLS = WIDTH * HEIGHT, STEPS = 6000;
const rains = process.argv.length > 2 ? process.argv.slice(2).map(Number) : [2, 4, 8, 12, 16];
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
for (const rain of rains) for (let seed = 1; seed <= 8; seed++) {
  let rng = seed, current = new Uint8Array(CELLS), next = new Uint8Array(CELLS);
  for (let i = 0; i < CELLS; i++) {
    rng = rng * 48271 % 2147483647;
    current[i] = Math.floor((rng % 1000000) / 1000000 * 16);
  }
  let peak = 0, peakStep = 0, minimumChanged = CELLS, minimumTones = 8;
  for (let step = 0; step < STEPS; step++) {
    const key = hash31((hash31(seed) + Math.imul(step, 2047323)) & 0x7fffffff);
    let changed = 0;
    const counts = new Uint16Array(8);
    for (let i = 0; i < CELLS; i++) {
      const k = current[i], successor = (k + 1) % 16;
      const h = hash31((key + i % WIDTH + Math.floor(i / WIDTH) * 64) & 0x7fffffff);
      const advance = h % 1000 < rain || neighbors[i].some(j => current[j] === successor);
      next[i] = (h >>> 10) % 1000 < 550 && advance ? successor : k;
      changed += next[i] !== k;
      const tone = Math.floor(next[i] / 2);
      if (next[i] % 2) { counts[tone] += 2; counts[(tone + 1) % 8] += 2; }
      else counts[tone] += 4;
    }
    minimumTones = Math.min(minimumTones, counts.filter(n => n > 0).length);
    minimumChanged = Math.min(minimumChanged, changed);
    const dominant = Math.max(...counts) / (4 * CELLS);
    if (dominant > peak) { peak = dominant; peakStep = step + 1; }
    [current, next] = [next, current];
  }
  console.log(JSON.stringify({rain, seed, peak, peakStep, minimumChanged, minimumTones}));
}
