# Breach Vector: Phrases I

A listening proposal after the approved Relay Ghost mix. The accepted album
and game are unchanged. This pass develops the existing pipe and muted-signal
phrases, keeping the instrument bank, drum kit, bass rhythm, plucks, opening,
bus and finite 3:30.286 arrangement. There are no new effects or patches.

## What changes

- In pattern 11 (0:50.286), the quiet pipe answer grows from E–D / C–A into
  E–D–C / D–B–G. C connects into the F harmony and the final reply follows G.
- Pattern 30 (2:17.143) keeps the lower pipe phrase and slides, changing its
  final three notes to D4–B3–G3. Pattern 40 (3:02.857) recalls that cadence an
  octave higher. These replace the repeated A–C–A ending over the G bass.
- Pattern 31 (2:21.714) replaces the busy supporting signal with two short
  replies in the spaced pluck's gaps. The pluck itself is untouched.
- Pattern 41 (3:07.429) retains the signal's first half, then answers with
  C–A–F / D–B–G to relax into the original calm reprise at 3:12.

This is intentionally an arrangement test. Deciding whether these replies
help the track should precede further timbre changes. It does not attempt to
revisit the previously accepted opening-synth balance.

## A/B montage

Each half is synthesized from fresh state, with its original instruments and
bus, followed by two display bars of release (2.286 seconds). Both halves use
the same monitoring gain; there is no independent loudness normalization or
new limiter. Each musical excerpt is four consecutive original motifs.

| Passage | Before | After | Original album excerpt |
|---|---:|---:|---:|
| Calm bridge | 0:00.000 | 0:20.571 | 0:41.143–0:59.429 |
| Lower pipe and spaced replies | 0:41.143 | 1:01.714 | 2:12.571–2:30.857 |
| Late return | 1:22.286 | 1:42.857 | 2:58.286–3:16.571 |

The montage lasts 2:03.429. Changes occupy part of each excerpt; surrounding
unchanged phrases provide context. The two full versions are also supplied,
each 3:30.286, at the same monitoring gain. The reference is freshly rendered
with the same engine, rather than taken from the differently mastered website.

## Reproduction and checks

`docs/music/tools/breach-phrases.sgl` creates the source snapshots, six
comparison scores and their maps. Once frozen, the before score drives future
reproduction. It matches the accepted album-I source byte for byte at the time
of this pass. The full after score retains the historical source provenance;
this README and source-checks.json describe the new, unaccepted changes.

The source check permits only pattern/channel pairs 11/7, 30/7, 31/5, 40/7 and
41/5 to differ. All other per-channel events, instrument settings, order and
clock remain identical. The established full-score audit passes on both:
6,279 attacks before, 6,236 after, zero compiled sample-clock error, original
speed-4 subdivisions/slides retained, and all final gates released.

Audio and evidence are external at
`~/Ops/artifacts/crash-the-stack-album/breach-phrases-i/`.
Run from the album worktree, using the same Motif renderer for both halves:

```sh
sigil docs/music/tools/breach-phrases.sgl \
  --motif "$MOTIF_BIN" --output "$SCORE_DIR"
sigil docs/music/tools/expression-render.sgl \
  --motif "$MOTIF_BIN" --input "$SCORE_DIR" \
  --output "$AUDIO_DIR" --stage native
sigil docs/music/tools/expression-render.sgl \
  --input "$SCORE_DIR" --output "$AUDIO_DIR" --stage delivery
sigil docs/music/tools/album-audit.sgl \
  --motif "$MOTIF_BIN" --track breach-vector \
  --source "$SCORE_DIR/breach-vector-after.cts" --output "$REPORT_DIR"
```

Use a fresh absolute external audio directory. The render tool records source
and renderer hashes, exact commands, native levels, common gain, montage
positions, decoded peaks, duration checks and full-track ending decay. Numerical
checks establish those properties; listener review decides musical merit.

## Render validation

Delivery uses a common -0.5 dB gain. Both complete OGGs measure -17.6 LUFS-I;
the before/after decoded peaks are -2.6/-2.5 dBTP. The A/B montage is -17.2
LUFS-I and -3.5 dBTP. Duration, stereo 44.1 kHz, source identity and final
release checks pass. Equal reported loudness is measured, not independently
normalized. The composer reproduces the complete candidate byte for byte.

## Delivery

Telegram acknowledged the A/B montage as message 1143, complete before as
1144, and complete candidate as 1145 on 2026-09-22. The canonical Breach Vector
album/game scores and public recording remain unchanged pending feedback.
Delivery receipts and hashes are beside the external audio. Source commit:
5880119. No claim of subjective listening approval is implied by the checks.

David subsequently approved these phrasing improvements, calling them more
musical and complete. The after score is now the arrangement baseline for
Percussion I; public adoption waits for the follow-on snare review.
