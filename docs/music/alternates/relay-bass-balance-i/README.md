# Relay Ghost: bass balance I

David approved the quieter contact/dust drums and chose the original bell.
He asked whether the squeaky bass line above the arrangement was too loud.
The exact part was not yet identified, so this comparison lowers the two
plausible parts independently. It does not assume a bass-level decision.

All three versions use the first sixteen tense bars (album patterns 8 and 9),
the preferred kit, original bell and original pluck. Each starts from fresh
renderer state and ends with two release bars. All 587 note attacks per version
and the complete compiled tick tables match. The only score differences are
the declared output gains; no patch parameters or note volumes change.

| Time | Version |
|---|---|
| 0:00.000 | Current balance with preferred drums |
| 0:32.727 | Higher squelchy acid line 2 dB lower (channel 8, instruments 23–25) |
| 1:05.455 | Lower gritty bass 2 dB lower (channel 4, instrument 19) |

Each block contains 29.091 seconds of music and 3.636 seconds of room release.
Total encoded duration is 1:38.182. Both proposed cuts use linear output gain
0.7943282347242815. The upper and lower parts are never attenuated together in
this audition. The common delivery gain is -1.1 dB, without an extra limiter
or per-version normalization. The existing score bus remains active.

Native integrated loudness is -16.1 LUFS for current balance and upper-down,
and -16.7 LUFS for gritty-bass-down. The upper part contributes little to whole
mix loudness; equal rounded LUFS does not mean that its gain edit did nothing.
Encoded comparison: -17.4 LUFS-I and -4.0 dBTP. Duration and stereo/44.1 kHz
format checks pass. These measurements do not decide which balance sounds best.

## Instrument gain support

This audition uses Motif commit `b0d135e` on `feat/codex-expression` in
`task-motif-expression`. The new instrument-level `gain:` scales the base
voice and all layers after synthesis, independently of tracker volume and
velocity-sensitive timbre. This avoids changing the acid filter accent when
lowering the instrument. Native gain tests, the tune/session regression suites,
live/compiled PCM parity and an MCP gain-preservation test pass. A legacy WAV
render remains byte-identical to the pre-change engine.

The feature is not released yet. Older renderers may silently discard `gain:`;
the composer verifies its survival through the canonical printer before any
audio is rendered. No game runtime dependency or package file is changed here.
The public player and accepted album source remain untouched pending the
remaining balance choice.

## Reproduction

From the album worktree, using the feature renderer and a fresh external
artifact directory:

```sh
sigil docs/music/tools/relay-bass-context.sgl \
  --motif "$MOTIF_BIN" \
  --output "$AUDITION_DIR"
```

The script writes canonical .cts and section maps here, and keeps snapshots,
WAVs, OGG, hashes, exact commands and measurements outside the repository.
Artifacts: `~/Ops/artifacts/crash-the-stack-album/relay-bass-balance-i/`.
