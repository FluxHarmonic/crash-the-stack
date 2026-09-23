# Sector Drift: Expression I

A controlled audition of a softer, longer-bodied signal pluck and developed
melodic replies. Freeze the accepted shared pool, layout and both generated
arrangements first. Candidate game and album forms use one proposed pool and
unchanged layouts. Maintained songs and public audio await listening approval.

## Instrument review

Retain the felt kick and round sub: the former supplies a restrained attack
and the latter carries the broken rhythm. Keep the woody rim across main
beats, ghosts and transition; the dusty closed/open hats and relay taps already
suit this track. Preserve the layered minor-tine chords, answer bell, send/pan
settings and bus. There is no new drum kit, swell, pad or bass layer.

Only shared instrument 6, signal-pluck, changes: FM index 0.6 to 0.45, decay
0.32 to 0.42 seconds, release 0.085 to 0.11 seconds. Preserve cutoff 1450 Hz,
attack behavior, output gain, note levels, pan and send. The softer edge and
longer body are intended to let individual notes carry a phrase across the
space. Longer decay can change energy; the comparison does not normalize that
away. Retaining the other eight instruments is a deliberate review decision.

## Composition

Keep the opening hook and first tense statements. The later calm phrase's
second half grows Bb–D–F, settles back to D, then answers through A–C–D over
D minor. A quiet bell response and A–G pickup prepare the next G-minor phrase.
The album's softer reprise recalls this answer at reduced note levels.

The final tense phrase gives the bell a brief Bb reply between the pluck's
calls, then a lower A–G response at the end. The game phrase and its album
variant receive identical edits. The four-bar bass/dust bridge retains its
empty first half and descending G–Eb–D–C bell pitches, replacing equal spacing
with an opening anchor, paired middle notes and a small breath before C.

Only channels 6/7 in shared phrases 3, 8, 10, 11 and 12 change. Preserve all
backing-channel cells, chord progression, drum/bass accents, transition, final
G-minor landing, transport and duration. Written gates leave percussive voices
room to decay; they do not add a sustained tone to those patches.

## Listening guide

Each pair plays BEFORE then AFTER, including two release bars per half:

| Pair | Before | After |
|---|---:|---:|
| Exposed pluck (+18 dB both halves) | 0:00.000 | 0:09.600 |
| Pluck patch in calm mix | 0:19.200 | 0:33.600 |
| Later calm answer | 0:48.000 | 1:12.000 |
| Bell reflection | 1:36.000 | 1:50.400 |
| Focused return | 2:04.800 | 2:28.800 |

Montage duration: 2:52.800. Full before and after: 3:36 each. The patch pair
keeps the original performance; the phrase pairs use original patches. The
full candidate combines the changes. Render each half from fresh state, with
one common monitoring gain and no extra limiter or per-half normalization.
The exposed pair receives equal +18 dB boosts for judging timbre; that boost
is not applied to the patch or full mix. It was added because the patch
change is subtle in context.

```sh
sigil docs/music/tools/sector-expression.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/sector-expression-replay
sigil docs/music/tools/expression-render.sgl --stage native \
  --input "$PWD/docs/music/alternates/sector-expression-i" \
  --motif "$PWD/build/dev/bin/motif" --output /absolute/fresh/artifacts
sigil docs/music/tools/expression-render.sgl --stage delivery \
  --input "$PWD/docs/music/alternates/sector-expression-i" \
  --output /absolute/fresh/artifacts
```

External audio and exact rendering commands live under
~/Ops/artifacts/crash-the-stack-album/sector-expression-i-native/ and
sector-expression-i-delivery/. Timing, codec and reproduction checks and
receipts will be recorded after rendering. Numerical checks do not establish
subjective listening quality.

All 31 generated files reproduce exactly, including the exposed pair. All
fifteen maintained-song regeneration checks pass.

## Delivered validation

Telegram acknowledged the montage as **1171**, full before as **1172**, and
full candidate as **1173**. Listening approval is pending; maintained song
sources and public audio remain unchanged.

All twelve native renders pass source/renderer identity, stereo 44.1 kHz,
duration and peak checks. The delivery applies one common -0.5 dB base gain.
The montage measures -21.4 LUFS-I/-5.9 dBTP; both complete versions measure
-21.6 LUFS-I/-6.0 dBTP. Both final seconds peak at -91.0 dBFS. The exposed
pluck before/after measures -40.3/-39.4 LUFS-I before its equal +18 dB boost;
the longer decay adds some body naturally, without a gain change. Its complete
calm mix rounds to -21.0 LUFS-I on both sides before delivery gain.

The candidate album has 1,264 attacks, zero sample-clock error, no 32nd-note
attacks and all final gates released. The game has 1,057 compiled triggers,
zero sample-clock error and the preserved B05 tense loop. Every channel's
compiled ticks match between the contextual pluck comparison halves. Full
score audits precede the added exposed pair; the full scores are unchanged.
All 31 final sources reproduce exactly, and all fifteen maintained songs
regenerate cleanly.

Pinned native renderer: Motif 0.6.6, SHA-256
f68c6737ccd25946e3b6135c6a75c18ac4c5318f511faa9216084c8d12d1d842.
The official expression renderer verifies exact source and renderer identity
before reusing each completed native job. External directories retain argv,
source and audio hashes, measurements, audit scripts, receipts and commands.

David approved the complete candidate and authorized release. The shared pool
and both maintained arrangements now match this audition exactly; all fifteen
regeneration checks pass. See [Sector Drift II](../../album/SECTOR-DRIFT-II.md)
for mastering and publication details.

Sector Drift II is now mastered and published. Telegram 1174 contains the
full master; the release record above preserves export and verification details.
