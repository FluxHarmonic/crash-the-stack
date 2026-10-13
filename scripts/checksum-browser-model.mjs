// Independent state used to validate the browser's real input path.
// It derives coverage and ranks from exported packets, never game helpers.
import assert from 'node:assert/strict';
const rank = packet => packet % 13 + 1;
const children = Array.from({ length: 28 }, () => []);
for (let row = 0; row < 6; row++) for (let col = 0; col <= row; col++) {
  children[row * (row + 1) / 2 + col] = [
    (row + 1) * (row + 2) / 2 + col, (row + 1) * (row + 2) / 2 + col + 1];
}
export function packetCenter(place, dock) {
  if (place === 'pull') return [dock === 'right' ? 468 : 284, 342];
  if (place === 'waste') return [dock === 'right' ? 540 : 356, 342];
  let row = 0; while ((row + 1) * (row + 2) / 2 <= place) row++;
  const col = place - row * (row + 1) / 2;
  return [320 - 32 * row + 64 * col, 70 + 32 * row];
}
export class BrowserBoard {
  constructor(deal) {
    this.pyramid = deal.pyramid;
    this.live = new Set(Array.from({ length: 28 }, (_, id) => id));
    this.stock = [...deal.stock]; this.waste = []; this.pass = 1;
  }
  free(id) { return this.live.has(id) && children[id].every(child => !this.live.has(child)); }
  places() {
    return [...this.live].filter(id => this.free(id)).sort((a, b) => a - b)
      .concat(this.waste.length ? ['waste'] : [],
        this.stock.length || (this.waste.length && this.pass < 3) ? ['pull'] : []);
  }
  cursorRoute(start, target, dock) {
    const places = this.places();
    assert.ok(places.includes(target), 'keyboard target is available');
    const queue = [[start, []]], seen = new Set([start]);
    for (let index = 0; index < queue.length; index++) {
      const [current, route] = queue[index];
      if (current === target) return route;
      const [x, y] = packetCenter(current, dock);
      for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) {
        const horizontal = key === 'ArrowLeft' || key === 'ArrowRight';
        const sign = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1;
        let next = current, best = Infinity;
        for (const place of places) {
          const [tx, ty] = packetCenter(place, dock);
          const along = horizontal ? tx - x : ty - y;
          const across = horizontal ? ty - y : tx - x;
          const score = Math.abs(along) + 3 * Math.abs(across);
          if (sign * along > 0 && score < best) { next = place; best = score; }
        }
        if (!seen.has(next)) { seen.add(next); queue.push([next, [...route, key]]); }
      }
    }
    throw new Error(`No keyboard route from ${start} to ${target} (${dock})`);
  }
  apply(action) {
    if (action === 'pull') {
      assert.ok(this.stock.length, 'PULL has a packet'); this.waste.push(this.stock.shift()); return;
    }
    if (action === 'rollback') {
      assert.equal(this.stock.length, 0); assert.ok(this.waste.length && this.pass < 3);
      this.stock = this.waste; this.waste = []; this.pass++; return;
    }
    const [a, b] = action;
    const packet = place => {
      if (place === 'waste') { assert.ok(this.waste.length); return this.waste.at(-1); }
      if (place === 'pull') { assert.ok(this.stock.length); return this.stock[0]; }
      assert.ok(this.free(place), `packet ${place} is free`); return this.pyramid[place];
    };
    if (b === null) assert.equal(rank(packet(a)), 13);
    else { assert.notEqual(a, b); assert.equal(rank(packet(a)) + rank(packet(b)), 13); }
    for (const place of b === null ? [a] : [a, b]) {
      if (place === 'waste') this.waste.pop();
      else if (place === 'pull') this.stock.shift();
      else this.live.delete(place);
    }
  }
}
