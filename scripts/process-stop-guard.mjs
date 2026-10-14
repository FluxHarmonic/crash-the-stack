// Admit descendants while their ancestry is intact. Never signal a group.
import fs from 'node:fs';

function processes() {
  const rows = new Map();
  for (const name of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(name)) continue;
    try {
      const text = fs.readFileSync(`/proc/${name}/stat`, 'utf8');
      const fields = text.slice(text.lastIndexOf(')') + 2).split(' ');
      rows.set(Number(name), { pid: Number(name), parent: Number(fields[1]),
        group: Number(fields[2]), start: fields[19] });
    } catch { /* exited during enumeration */ }
  }
  return rows;
}

export function createProcessStopGuard({ root = process.pid, read = processes,
  signal = (pid, kind) => process.kill(pid, kind), print = console.error } = {}) {
  const admitted = new Map();
  const rootRow = read().get(root);
  if (!rootRow || root <= 1) throw new Error('stop guard requires a present owned root');
  admitted.set(root, rootRow);
  function admit() {
    const rows = read();
    if (rows.get(root)?.start !== rootRow.start) return;
    let changed;
    do {
      changed = false;
      for (const row of rows.values()) {
        if (row.pid <= 1 || admitted.has(row.pid)) continue;
        const parent = rows.get(row.parent), savedParent = admitted.get(row.parent);
        if (parent && savedParent && parent.start === savedParent.start) {
          admitted.set(row.pid, { ...row, parentStart: parent.start });
          changed = true;
        }
      }
    } while (changed);
  }
  admit();
  const timer = setInterval(admit, 100);
  timer.unref();
  function stopGroup(group, kind = 'SIGTERM') {
    const rows = read();
    const targets = [...rows.values()].filter(row => row.group === group);
    print('STOP-LIST ' + JSON.stringify({ root, group, signal: kind, targets }));
    const reject = reason => { print('STOP-REFUSED ' + reason); return false; };
    if (!Number.isInteger(group) || group <= 1) return reject('invalid group');
    if (!targets.length) return true;
    if (!admitted.has(group) || rows.get(group)?.start !== admitted.get(group).start)
      return reject('unadmitted or absent group leader');
    function owned(row) {
      const saved = admitted.get(row.pid), parent = rows.get(row.parent);
      if (row.pid === root || row.pid <= 1 || row.group <= 1 || !saved
          || saved.start !== row.start || saved.parent !== row.parent
          || !parent || parent.start !== saved.parentStart) return false;
      let cursor = parent;
      const seen = new Set([row.pid]);
      while (cursor.pid !== root) {
        if (seen.has(cursor.pid)) return false;
        seen.add(cursor.pid);
        const known = admitted.get(cursor.pid), next = rows.get(cursor.parent);
        if (!known || cursor.start !== known.start || cursor.parent !== known.parent
            || !next || next.start !== known.parentStart) return false;
        cursor = next;
      }
      return cursor.start === rootRow.start;
    }
    if (!targets.every(owned)) return reject('whole list has an unadmitted or changed process');
    // Recheck the entire list before the first signal; PID reuse cannot be admitted.
    const fresh = read();
    if ([...fresh.values()].filter(row => row.group === group).length !== targets.length
        || targets.some(row => {
          const now = fresh.get(row.pid), parent = fresh.get(row.parent);
          return !now || now.start !== row.start || now.parent !== row.parent
            || now.group !== row.group || parent?.start !== rows.get(row.parent)?.start;
        })) return reject('process list changed before signaling');
    // Children first, using only positive admitted PIDs, never a broadcast/group kill.
    for (const row of targets.sort((a, b) => (a.pid === group) - (b.pid === group))) {
      try { signal(row.pid, kind); } catch (error) {
        if (error.code !== 'ESRCH') throw error;
      }
    }
    return true;
  }
  return { admit, stopGroup, close: () => clearInterval(timer) };
}
