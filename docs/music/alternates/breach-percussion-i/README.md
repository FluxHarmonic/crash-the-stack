# Breach Vector: Percussion I

David approved Phrases I's more complete replies and asked to audition a tighter
snare with a faint metallic click. Both sides start from that approved phrasing,
not the older website recording. This remains a percussion proposal; the game
and public album are unchanged while it is reviewed.

## Sound design

Only instrument 2 changes. The original chip-snare body stays at 0.38, with
unchanged 14-bit crush, note pitches, volumes, center pan and 0.12 reverb send.
Noise decay falls from 85 to 45 ms and its level from 0.58 to 0.50. A separate
FM layer adds a brief inharmonic metallic edge at layer volume 0.18. Its carrier
decays are 18/14 ms with a 30 ms output envelope and zero sustain. It is an
attack detail rather than a ringing bell or melodic voice.

The low FM snare body and existing kick remain intact. The 300 snare attacks
all use instrument 2, including all 14 transition hits. Consequently the fill,
ghost dynamics and regular backbeat share the candidate timbre. Hats, bass,
pluck, pipe, signal, pad and every note/effect/gate are unchanged.

The source of truth is `../breach-phrases-i/breach-vector-after.cts`, whose
SHA-256 is recorded in source-checks.json. `breach-vector-before.cts` is its
exact snapshot; `breach-vector-after.cts` changes only the snare instrument.
The complete length remains 3:30.286.

## Comparison

Each half starts a fresh renderer and has two display bars (2.286 seconds) of
release. All files use one common monitoring gain, with no per-half loudness
normalization, new limiter or bus change. The raw full reference is freshly
rendered with the same engine as the candidate.

| Passage | Before | After | Original patterns |
|---|---:|---:|---|
| Exposed kick, snare and hats | 0:00.000 | 0:11.429 | 2–3, percussion only |
| Calm full mix | 0:22.857 | 0:43.429 | 2–5 |
| Fill into focused groove | 1:04.000 | 1:24.571 | 19–22 |

The montage is 1:45.143. Both full versions are retained and delivered as well.
The fill excerpt includes the approach, the complete transition and the first
two focused motifs, so listen for a consistent drum identity through the handoff.

## Reproduction

Run from the album worktree with a fresh absolute external AUDIO_DIR and the
same Motif renderer for both sides:

```sh
sigil docs/music/tools/breach-percussion.sgl \
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

`breach-percussion.sgl` checks that patterns, order, bus and all other instruments
are identical, and verifies the fill uses the revised snare. The established
album audit checks exact compiled timing, finite traversal, voice budgets and
final gates. Audio checks cover duration, stereo format, native/encoded true
peak and full ending decay. These measurements do not establish subjective
musical approval.

External audio and exact commands:
`~/Ops/artifacts/crash-the-stack-album/breach-percussion-i/`, with OGGs under
`ogg/`. All earlier versions remain preserved.

## Score and native checks

The complete candidate has 6,236 compiled attacks, matching the approved phrase
version, with zero sample timing error and all final gates released. The source
comparison proves every note, gate, effect, pattern and order remains identical.
The composer reproduces the candidate byte for byte. Native full levels are
-17.0 LUFS-I before and -17.4 after, with peaks of -2.0/-2.3 dBTP. The shorter
noise tail's energy difference is preserved rather than normalized away.
