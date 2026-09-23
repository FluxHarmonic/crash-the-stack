# Glass Current: Expression I

Controlled audition of one patch change and later phrase development. The
accepted shared pool and generated game/album scores are frozen as the before
reference. Both full candidates use one proposed shared pool and unchanged
layouts. No maintained tune or public audio is adopted by this experiment.

## Instrument review

The round kick and sub remain: their short/long roles already separate the
attack and weight. Retain the paper snare across main hits, ghosts and fill,
silk ticks, brush breath and sparse data ticks. The approved quieter riser,
minor pads and their room/pan settings also stay. Preserve the pluck's existing
FM tone and the restrained stab lead: their melodic dialogue is the focus of
the phrasing comparison. Review does not require changing every patch.

Only pool instrument 5, the tense Reese, changes. Its amp attack is 8 to 4 ms,
decay 200 to 100 ms, sustain 0.8 to 0.68, and release 80 to 45 ms. The aim is
clearer pulses with less carry between notes. Keep the approved 900 Hz cutoff,
drive 0.48, resonance 0.28, spread 16, index 0.003 and motion depth 0.0025;
all pitches, gates, accents, gain and slow motion rate remain. No extra LFO,
automation, brightening or mastering change is included.

## Phrase design

Preserve the opening theme, harmony, backing and final D-minor resolution.
The quiet bridge states a longer G–Bb–D anchor gesture, answers over D minor,
then introduces a falling E–G–E / C–B response over A minor. A–F–E resolves
to a longer D anchor in the next harmony. The later calm return recalls that
answer as the kit recedes. Shared calm phrase 1 and its album withdrawal
variant receive the same second-half change.

The fourth tense phrase develops its existing A-minor/D-minor calls with
longer anchor tones and deliberate breathing space. The last tense phrase
and its album variant recall the D-minor answer, then settle through a
G-minor pluck response. The two-bar alternation of lead and pluck remains.
Shared phrases changed: 1, 11, 14, 16, 18 and 20, channels 6/7 only. Some
phrases are album-specific; shared equivalents stay synchronized.

## Listening and reproduction

Four contextual pairs, each BEFORE then AFTER, with two release bars per half:

| Pair | Before | After |
|---|---:|---:|
| Reese envelope in tense mix | 0:00.000 | 0:13.953 |
| Quiet pluck reflection | 0:27.907 | 0:41.860 |
| Later lead answers | 0:55.814 | 1:09.767 |
| Calm return as drums recede | 1:23.721 | 1:37.674 |

The montage is 1:51.628. Each full track is 3:57.209. The first pair changes
only the Reese envelope; the three phrase pairs retain original patches.
Full after combines all proposals. Fresh synth state and one common monitoring
gain preserve the comparison; no per-half normalization or extra limiter.

```sh
sigil docs/music/tools/glass-expression.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/glass-expression-replay
sigil docs/music/tools/expression-render.sgl --stage native \
  --input "$PWD/docs/music/alternates/glass-expression-i" \
  --motif "$PWD/build/dev/bin/motif" --output /absolute/fresh/artifacts
sigil docs/music/tools/expression-render.sgl --stage delivery \
  --input "$PWD/docs/music/alternates/glass-expression-i" \
  --output /absolute/fresh/artifacts
```

Native/encoded measurements, compiled timing, reproduction checks and delivery
receipts will be recorded after the audition is rendered. Numerical checks
establish timing and format properties, not subjective listening quality.

Longer written anchor gates preserve each patch's natural percussive decay;
they do not add sustain to the pluck or lead. Rhythmic placement, note choices,
accents and the spacing of replies carry the phrasing change. All 27 generated
files reproduce exactly from the frozen baseline and Sigil composer.

## Delivered checks

Telegram acknowledged the montage as **1167**, complete before as **1168**, and
complete candidate as **1169**. Listening approval is pending; maintained shared
sources, game/album scores and public audio remain unchanged.

All ten fresh native files pass format/duration/peak checks. Delivery applies
one common -0.5 dB gain. The montage measures -17.6 LUFS-I/-4.2 dBTP; complete
before/after measure -16.5/-16.6 LUFS-I with both at -2.6 dBTP. Each final second
peaks at -90.3 dBFS. Native full levels both round to -16.1 LUFS-I; the isolated
bass-in-mix pair measures -16.5/-16.7 LUFS-I. No level normalization disguises
the shorter envelope's small energy reduction.

The candidate album has 3,779 compiled attacks, zero sample-clock error, its
four intentional fill 32nds and all final gates released. The game has 3,008
compiled triggers, zero sample-clock error and the preserved B08 tense loop.
Every channel's compiled ticks match between the bass comparison halves. All
fifteen maintained-song regeneration checks pass, and all 27 generated audition
files reproduce exactly.

External audio: ~/Ops/artifacts/crash-the-stack-album/glass-expression-i-native/
and glass-expression-i-delivery/. Native jobs use the pinned Motif 0.6.6 renderer,
SHA-256 f68c6737ccd25946e3b6135c6a75c18ac4c5318f511faa9216084c8d12d1d842.
The official expression renderer verifies exact source and renderer identity
before reusing the completed native files. Source hashes, exact commands,
measurements, audits, worker scripts and delivery receipts are preserved there.
