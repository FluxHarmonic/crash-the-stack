# Signals pair I — Closed Loop and Shadow Protocol

Album positions four and five extend the accepted game compositions into finite
pieces. David requested this pair while listening to Cold Boot and Relay Ghost.
The approved instrument banks and mix buses are retained exactly; the game files
remain untouched. These are provisional album auditions, not release masters.

## Closed Loop — 3:16, 98 bars, 120 BPM

The snap-click kit remains the rhythmic identity. A new four-bar entrance passes
a B–D–F# pluck signal to its answering bell, gradually admitting the bass and
kick. All five calm and five energized phrases remain complete. A short exposed
mechanism passage interrupts the calm region before the accepted transition.
The ending returns the quiet hook, resolves to B minor and releases into two
tail bars. No new patch or additional noise swell is introduced.

| Time | Section |
|---|---|
| 0:00 | First signal and answering circuit |
| 0:08 | Five complete calm phrases |
| 1:28 | Snap-click mechanism exposed, then signals reconnect |
| 1:36 | Accepted restrained transition |
| 1:44 | Five energized phrases |
| 3:04 | Calm hook and B-minor closure |
| 3:12 | Released room tail |

## Shadow Protocol — 3:50, 92 bars, 96 BPM

Preserve the delicate pad, vibes, syncopated bass and subtle focused section.
The entrance establishes distant D-minor harmony before the bass emerges. A new
eight-bar D–Bb–A–D passage between the calm phrases exposes the harmony, with
small vibes and muted-lead answers. The original watch-tick transition introduces
the focused material; a lower-register response develops that section without
raising its intensity substantially. The final reprise restores the distant
atmosphere, then a composed D-minor withdrawal lets the piece settle.

| Time | Section |
|---|---|
| 0:00 | Distant pad and emerging bass |
| 0:10 | First four calm phrases |
| 0:50 | Exposed D–Bb–A–D harmonic passage |
| 1:10 | Remaining four calm phrases |
| 1:50 | Watch-tick transition |
| 1:55 | First four focused phrases |
| 2:35 | Lower signal response |
| 2:45 | Remaining four focused phrases |
| 3:25 | Distant pad and vibes reprise |
| 3:35 | Final D-minor withdrawal |
| 3:45 | Released room tail |

## Reproduction and timing policy

`album-compose-signals.sgl` uses the shared finite-arrangement helper. Scores and
exact section maps live beside this report. Source references are
assets/tunes/closed-loop.cts and assets/tunes/shadow-protocol.cts. No phrase is
nominated for game backport yet.

Shadow Protocol retains its native speed-6, 16-row bar clock. Closed Loop uses
speed 3 with 32 rows per bar. Odd rows in Shadow are legitimate sixteenths;
applying the newer tracks' odd-row prohibition would incorrectly remove its
syncopation. The audit uses the native clock, retains portamento/vibrato and
checks the pad/vibes grid separately from the deliberately syncopated lead.

Compiled attacks: Closed Loop 1,792; Shadow Protocol 1,435. Maximum clock error
is zero samples in both. Both have finite playback, valid voice budgets and all
final gates released. Closed Loop has no thirty-second attacks. Instrument-bank
and bus AST equality with both accepted sources passed. The shared helper's
clock/map extension also reproduces the prior Cold Boot and Relay Ghost scores
and maps byte-for-byte.

Audio, snapshots, hashes, exact command manifests and raw measurements belong in
~/Ops/artifacts/crash-the-stack-album/signals-pair-i/. The renderer preserves
native WAVs and exports full provisional WAV/FLAC/OGG files. The existing native
export remains 16-bit; these are not high-resolution release masters.

## Provisional mastering and render checks

| Track | Native LUFS-I | Gain | WAV LUFS-I | OGG LUFS-I | OGG true peak | Master LRA |
|---|---:|---:|---:|---:|---:|---:|
| Closed Loop | -20.1 | +3 dB | -17.1 | -17.0 | -1.7 dBTP | 3.5 LU |
| Shadow Protocol | -20.8 | +2.5 dB | -18.3 | -18.2 | -1.4 dBTP | 11.8 LU |

The pilot's four-times-oversampled limiter remains the processing recipe, with
nominal -1.5 dB ceiling, 5 ms attack, 80 ms release and makeup disabled. Closed
Loop sits below the heavy opening titles; Shadow Protocol remains quieter and
closer to Quiet Array's album level. Native loudness ranges were 3.5 and 11.8 LU
respectively, unchanged at reported precision after mastering. No new EQ,
widening or reverb is added.

Both new scores and section maps reproduce byte-for-byte from the composer.
Native/master WAV, FLAC and OGG durations match their maps within one sample;
master WAV and decoded FLAC PCM match exactly. Final master seconds peak at
-84.3 dBFS and -90.3 dBFS respectively. WAV and decoded OGG true peaks pass the
-1 dBTP delivery ceiling. These checks establish technical consistency, not
listening approval. This pair brings the album to six full arrangements out
of fifteen, pending David's feedback on the new pieces.
