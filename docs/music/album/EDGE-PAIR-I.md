# Edge pair I — Breach Vector and Clock Edge

David authorized these immediately after the stone pair was finished. They fill
positions thirteen and fourteen, leaving Glass Current as the final arrangement
and confirmed closer. Preserve Breach Vector's accepted smooth opening balance
and adaptive variations, and Clock Edge's Room II envelopes and ambience. Game
assets, instrument banks and mix buses are unchanged.

## Breach Vector — 3:30.286, native tempo 140 / speed 4

Two short entrance motifs assemble the background current and thumpy FM pulse.
The muted riff waits until the original calm material, preserving its role below
the rhythm. All sixteen calm motifs remain. A new two-motif passage exposes the
accepted spaced plucks over bass and quiet pad breaths, then places a lower
E–D–C–A pipe answer into the gaps. The original pluck-led transition introduces
all nineteen focused motifs.

A lower-register version of the complete pipe phrase and its spaced pluck answer
extend the focused development. The original pipe slides remain. After the full
focused sequence, a two-motif return restores the smooth FM bass, muted riff and
plucks over reduced hats. A composed A-minor coda spaces the pulse and descends
the pluck through C–B–A before the explicit release tail.

| Time, rounded | Section |
|---|---|
| 0:00 | Background current and approaching bass |
| 0:05 | Thumpy pulse assembles |
| 0:09 | Original calm sequence begins |
| 0:46 | Spaced plucks over pad breaths |
| 0:50 | Lower pipe answers in the gaps |
| 0:55 | Remaining calm motifs |
| 1:31 | Accepted pluck-led transition |
| 1:36 | Focused sequence begins |
| 2:17 | Lower pipe development and spaced focused answer |
| 2:26 | Remaining focused motifs |
| 3:12 | Smooth FM bass and plucks return |
| 3:21 | A-minor pulse and pluck closure |
| 3:28 | Released room tail |

Retain the native speed-4 clock and 64-row motif construction. The format's
sixteen-row display bars are not used to reinterpret the motif's musical pulse.
No new quantization, wobble, resonance sweep or opening synth gain adjustment
is introduced. The earlier IV balance was accepted as a good overall result;
it was not claimed to precisely resolve the original requested synth change.

## Clock Edge — 3:33.750, 114 bars, 128 BPM

A four-bar entrance introduces D#–F#–F / C#–A# over the pulse, then its answering
bell and kit. All five complete calm and focused phrases remain. Between the
second and third calm phrases, an eight-bar variant exposes the interlocking
melody and bass without kick/clap in its first half, then rebuilds the rhythm.
The original transition retains its concise rhythmic handoff.

After the full focused section, a complete calm hook reprise restores the softer
bass and lead colors. The final eight bars begin with familiar material, then
trace D#–C#–A#–F#–F–D# to a final aligned kick, bass, chord, lead and bell strike.
The accepted Room II body and selective reverb remain; no new widening, patch
change or extra reverb is added. This is a listening arrangement, not a game chart.

| Time | Section |
|---|---|
| 0:00 | Hook over pulse and emerging answers |
| 0:07.5 | First two calm phrases |
| 0:37.5 | Interlocking theme without backbeat, then rebuild |
| 0:52.5 | Remaining calm phrases |
| 1:37.5 | Accepted rhythmic transition |
| 1:45 | Complete focused sequence |
| 3:00 | Full calm hook reprise |
| 3:15 | Descending final phrase |
| 3:28.1 | Final D-sharp strike |
| 3:30 | Released room tail |

## Sources and checks

`album-compose-edge.sgl` reads assets/tunes/breach-vector.cts and clock-edge.cts.
Canonical album scores and exact section maps live beside this report. Both
regenerate byte-for-byte. Both instrument banks and bus ASTs equal the accepted
game references. No phrase is nominated for game backport.

The audit finds 6,279 compiled attacks in Breach Vector and 2,122 in Clock Edge,
with zero sample-clock error. Both pass canonical validation, finite traversal,
voice budgets and final gate release. Breach has an explicit speed-4/default
meter policy: its original row subdivisions and portamento are retained, not
subjected to the newer dance scores' odd-row restriction or eighth-grid test.
Clock Edge uses speed 3 and thirty-two-row bars, with no thirty-second attacks;
its answering bell stays on eighths, while finer lead subdivisions remain.

Audio, source snapshots, command manifests, hashes and raw reports live in
~/Ops/artifacts/crash-the-stack-album/edge-pair-i/. Native export is 16-bit;
these are full provisional album auditions, not high-resolution release masters.
