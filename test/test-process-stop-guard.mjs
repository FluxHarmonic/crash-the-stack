import test from 'node:test';
import assert from 'node:assert/strict';
import { createProcessStopGuard } from '../scripts/process-stop-guard.mjs';

function fixture() {
  const rows = new Map([
    [10, { pid: 10, parent: 2, group: 10, start: '100' }],
    [20, { pid: 20, parent: 10, group: 20, start: '200' }],
    [21, { pid: 21, parent: 20, group: 20, start: '201' }],
  ]);
  const calls = [], printed = [];
  const guard = createProcessStopGuard({ root: 10,
    read: () => new Map([...rows].map(([pid, row]) => [pid, { ...row }])),
    signal: (pid, signal) => { assert.ok(printed[0].startsWith('STOP-LIST ')); calls.push([pid, signal]); },
    print: text => printed.push(text) });
  return { rows, calls, printed, guard };
}
test('signals only admitted positive children, children first, after printing the list', () => {
  const f = fixture();
  try {
    assert.equal(f.guard.stopGroup(20), true);
    assert.deepEqual(f.calls, [[21, 'SIGTERM'], [20, 'SIGTERM']]);
  } finally { f.guard.close(); }
});
for (const [label, mutate, group] of [
  ['PID 1 in target list', f => f.rows.set(1, { pid: 1, parent: 0, group: 20, start: '1' }), 20],
  ['group zero', () => {}, 0],
  ['group one', () => {}, 1],
  ['unadmitted member outside the root', f => f.rows.set(22, { pid: 22, parent: 999, group: 20, start: '202' }), 20],
  ['PID reuse', f => f.rows.get(21).start = '999', 20],
  ['orphaned parent', f => f.rows.get(21).parent = 1, 20],
  ['absent group leader', f => f.rows.delete(20), 20],
  ['unadmitted group leader', f => { f.rows.get(21).group = 30; f.rows.set(30, { pid: 30, parent: 1, group: 30, start: '300' }); }, 30],
]) test('refuses the whole list: ' + label, () => {
  const f = fixture();
  try {
    mutate(f);
    assert.equal(f.guard.stopGroup(group), false);
    assert.deepEqual(f.calls, []);
    assert.ok(f.printed.at(-1).startsWith('STOP-REFUSED '));
  } finally { f.guard.close(); }
});
test('admits a late descendant and stops grandchildren before their live parents', () => {
  const f = fixture();
  try {
    f.rows.set(22, { pid: 22, parent: 21, group: 20, start: '202' });
    assert.equal(f.guard.stopGroup(20), true);
    assert.deepEqual(f.calls, [[22, 'SIGTERM'], [21, 'SIGTERM'], [20, 'SIGTERM']]);
  } finally { f.guard.close(); }
});
