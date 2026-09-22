# Cold Boot: Motion I

This audition explores a more metallic hat and greater pressure-filter contrast.
The accepted kick/sub pulse, integrated C4 knock/fill, chord stabs, distant bell,
relay blips, notes, accents, gates, pan, sends, bus and arrangement remain fixed.
It is a proposal for listening, not an adopted or published revision.

## Shared source and patch choices

`cold-boot-motion.sgl` reads the maintained shared parts and layouts. It first
checks the committed generation baseline, then builds both game and album
candidates with `build-song-score`. `parts-after.cts` and `arrangements.sgl` are
the candidate shared source; complete before/after snapshots accompany them.
The before snapshots must match both accepted arrangements byte for byte.
Adoption should reconcile these patch changes into the maintained shared pool
and regenerate both outputs, never copy just the album candidate over it.

Only shared instrument IDs 3, 13, 8, 9 and 10 change:

- Closed grain becomes a `chip-hat` metallic tick with 22 ms decay, metal 0.40,
  noise 0.13, 4800 Hz high-pass and 12-bit crush. The open variant uses 70 ms,
  metal 0.48 and noise 0.14. Both use the existing note pitches and velocities.
  The open/closed hats therefore share a timbre without replacing the knock.
- The three existing acid-filter colors become 140/260/560 Hz resting cutoffs,
  380/900/2050 Hz envelope depths, and 70/80/75 ms filter decays. Resonance stays
  0.58 in the first two and becomes 0.61 in the brightest. The original
  velocity-to-cutoff response, oscillator drive and amplitude envelopes remain.
  These are note-triggered filter envelopes and existing patch selections;
  this audition does not implement a transport LFO or score automation.

Shared IDs map to game/album IDs 3, 21, 12, 14 and 16 respectively. The accepted
fill and main knock patches (shared 2 and 11; output 2 and 18) remain identical.
All protected instruments and complete pattern/order/bus data are checked for
identity. Game and album use the same candidate patch bank.

## Listening comparison

Each clip is synthesized from a fresh state with two bars of release. Every
pair is BEFORE then AFTER; each isolates the declared change. The complete
candidate combines both changes and retains the album's 3:34.545 form.

| Pair | Before | After | Change |
|---|---:|---:|---|
| Exposed percussion | 0:00.000 | 0:10.909 | Hats only |
| Calm groove | 0:21.818 | 0:40.000 | Hats only |
| Tense groove | 0:58.182 | 1:16.364 | Filter contrast only |
| Fill into tense | 1:34.545 | 2:00.000 | Both changes |

The montage is 2:25.455. Both full versions accompany it. All files receive
one common monitoring gain; halves are not independently normalized, and no
additional mastering limiter is applied. The original score bus is unchanged.
Listen for excessive thinning of the hats, distracting brightness in the
pressure replies, and whether the combined groove preserves its steady weight.
Measurements establish timing and signal properties, not musical approval.

## Reproduction

From the Crash worktree, with Motif 0.6.6 or later and a fresh external AUDIO_DIR:

```sh
sigil docs/music/tools/cold-boot-motion.sgl \
  --motif "$MOTIF_BIN" --output "$SCORE_DIR"
sigil docs/music/tools/expression-render.sgl \
  --motif "$MOTIF_BIN" --input "$SCORE_DIR" --output "$AUDIO_DIR" --stage native
sigil docs/music/tools/expression-render.sgl \
  --input "$SCORE_DIR" --output "$AUDIO_DIR" --stage delivery
sigil docs/music/tools/album-audit.sgl \
  --motif "$MOTIF_BIN" --track cold-boot \
  --source "$SCORE_DIR/cold-boot-after.cts" --output "$AUDIO_DIR/audit"
MOTIF_BIN="$MOTIF_BIN" sigil docs/music/tools/songs.sgl --stage check
```

Audio and measurements live under
`~/Ops/artifacts/crash-the-stack-album/cold-boot-motion-i/`, with delivered OGGs
in `ogg/`. The accepted song pool, generated game/album arrangements and public
master remain intact while this proposal is reviewed.
