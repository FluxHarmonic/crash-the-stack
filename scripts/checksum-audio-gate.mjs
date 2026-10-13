import assert from 'node:assert/strict';

// The cue ring can contain silence. Music has its own deeper ring, so
// cue-only all-dry counts neither prove nor disprove an audible glitch.
export function requireHealthyDealAudio(trace) {
  assert.equal(trace.isolated, true, 'check the actual hosted worklet-sab path');
  const baseline = new Map((trace.baseline || trace.samples[0]?.sinks || []).map(s => [s.id, s]));
  const rows = trace.maxima || trace.samples.flatMap(row => row.sinks);
  let sounding = 0, music = 0;
  for (const s of rows) {
    const before = baseline.get(s.id);
    sounding = Math.max(sounding, s.sounding - (before?.sounding || 0));
    if (s.capacity === 32768) music = Math.max(music, s.underruns - (before?.underruns || 0));
  }
  const final = trace.finalSinks || trace.samples.at(-1)?.sinks || [];
  assert.ok(final.some(s => s.capacity === 32768 && s.mode === 'worklet-sab'), 'real music remains active');
  assert.equal(sounding, 0, 'no stream may lose sounding output frames');
  assert.equal(music, 0, 'the active music ring may not run dry');
  return { sounding, music };
}
