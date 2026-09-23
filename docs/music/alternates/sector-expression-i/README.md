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
| Pluck patch in calm mix | 0:00.000 | 0:14.400 |
| Later calm answer | 0:28.800 | 0:52.800 |
| Bell reflection | 1:16.800 | 1:31.200 |
| Focused return | 1:45.600 | 2:09.600 |

Montage duration: 2:33.600. Full before and after: 3:36 each. The patch pair
keeps the original performance; the phrase pairs use original patches. The
full candidate combines the changes. Render each half from fresh state, with
one common monitoring gain and no extra limiter or per-half normalization.

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

All 27 generated files reproduce exactly from the frozen source and Sigil
composer. All fifteen maintained-song regeneration checks pass.
