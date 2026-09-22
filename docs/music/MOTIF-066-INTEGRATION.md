# Motif 0.6.6 soundtrack integration

The published Motif release preserves per-instrument output gain, including
Relay Ghost's approved 2 dB gritty-bass trim. This scales the rendered instrument
rather than changing note velocity, so velocity-sensitive patches retain their
character. Unity is the default; old scores keep their original levels.

## Release and dependency

Motif `v0.6.6` is commit `6a788c645673cc51ad9a510bebff48712f9ec779`, published
to master and the annotated release tag on both Codeberg and git.azoth.works.
Crash's `d6450c4` pins that exact release and sigil-dsp 0.3.4 in `sigil.lock`.
The remaining dependency pins, including Sigil 0.22.3, are unchanged. No local
package redirects are used for the integration build.

## Validation

Motif's native tune and session suites pass. Its dedicated gain fixture passes
all fourteen assertions under Node/WASI and Chromium: default and round-trip
behavior, base and layer scaling, unchanged note timing, velocity-sensitive
acid timbre, boost, mute, invalid values, chunk parity, and live/compiled PCM
agreement. The fixture imports `(sigil process)` for `exit`; the Node runner
requires an explicit successful completion marker and all fourteen passes,
so a loader error cannot masquerade as success merely by returning exit zero.
A negative control confirms the runner rejects that case.

Crash's five integration assertions pass against its actual Relay Ghost asset:
loading, note edits, patch-kind edits, save/reload, and undo retain the gain.
All 57 tracker model tests pass. The asset audit initially mistook a quoted
example in a source comment for a filename; it now reads Sigil forms and tests
that comments are skipped while real literals remain visible. All 235 asset
assertions pass after that correction. The released renderer also validates
all 31 generated arrangements; the fifteen-song regeneration check passes
without changing any committed output.

Build and check commands, run from the Crash worktree:

```sh
sigil deps install
scripts/dev sigil test test/test-music-gain.sgl test/test-tracker-model.sgl test/test-assets.sgl
scripts/dev sigil build --config web
MOTIF_BIN="$PWD/build/dev/bin/motif" sigil docs/music/tools/songs.sgl --stage check
```

External logs, browser checks, hashes and commands live under
`~/Ops/artifacts/crash-the-stack-album/integration-motif-066/`. No build output,
package cache or rendered audio belongs in Git.

## Runtime scope

This updates the Motif consumer in the tracker and ships the synchronized
scores. Current board-mode music still uses the existing spy/groove/breaker OGG
assets. Replacing that system with dynamic calm/tense score playback is separate
integration work, not implied by this dependency update.

Breach Vector album II is already published separately; see
[the mastering and publication record](album/BREACH-II.md). Future game deploys
must preserve its current soundtrack manifest using `CRASH_SOUNDTRACK_DIR`.
