# Motif 0.6.6 soundtrack integration

The published Motif release preserves per-instrument output gain, including
Relay Ghost's approved 2 dB gritty-bass trim. This scales the rendered instrument
rather than changing note velocity, so velocity-sensitive patches retain their
character. Unity is the default; old scores keep their original levels.

## Release and dependency

Motif `v0.6.6` is commit `6a788c645673cc51ad9a510bebff48712f9ec779`, published
to master and the annotated release tag on Codeberg and the private mirror.
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
`~/artifacts/crash-the-stack-album/integration-motif-066/`. No build output,
package cache or rendered audio belongs in Git.

## Runtime scope

This updates the Motif consumer in the tracker and ships the synchronized
scores. Current board-mode music still uses the existing spy/groove/breaker OGG
assets. Replacing that system with dynamic calm/tense score playback is separate
integration work, not implied by this dependency update.

Breach Vector album II is already published separately; see
[the mastering and publication record](album/BREACH-II.md). Future game deploys
must preserve its current soundtrack manifest using `CRASH_SOUNDTRACK_DIR`.

## Browser build and deployment

The full web build completed successfully. After Asyncify and `wasm-opt`, the
game is 25,137,475 bytes (23.97 MiB) and the tracker is 15,718,691 bytes
(14.99 MiB), each below Pages' 25 MiB file limit. All twenty staged tune files
match their repository counterparts byte for byte.

A fresh Chromium session passes seven integration checks: Relay Ghost tense
playback, gain-preserving browser serialization, Breach Vector tense playback,
Obsidian Index tense playback, legacy spy playback, game boot, and absence of
runtime errors. Playback requires nonzero measured browser audio and an
advancing score position, not merely a successful page load.

Deployment `c3e7651a` is live at https://crashthestack.com/ and
https://c3e7651a.crashthestack.pages.dev. The stamped build and deployment source
are `23b16a76357a`; changes after the runtime commit are tests and documentation.
The previous production was `cfb7d2bb`, checked immediately before publishing.

```sh
CRASH_SOUNDTRACK_DIR="$HOME/artifacts/crash-the-stack-album/publication-breach-ii/site/soundtrack" \
  scripts/publish-web --dry-run
CRASH_SOUNDTRACK_DIR="$HOME/artifacts/crash-the-stack-album/publication-breach-ii/site/soundtrack" \
  scripts/publish-web "Integrate Motif 0.6.6 and synchronized soundtrack scores"
```

The public game's page, service worker, both WASM files, three revised scores,
and every soundtrack page file match the validated local files by SHA-256.
The soundtrack retains all fifteen entries, Relay Ghost album II, Obsidian
Index album II, and the newly published Breach Vector album II. The public
listening page remains https://crashthestack.com/soundtrack/.

The same seven browser checks also pass against the canonical public domain
in a new browser profile after deployment, including measured audio output
and Relay Ghost's gain-preserving share/save path.

The first live run selected Breach position 16 and Obsidian position 4 because
its 40 ms synthetic key holds were too brief under browser load. Its strict
position assertions correctly failed those two checks. With 120 ms key holds
and a two-second post-load pause, the rerun passes all seven checks and exits
zero, selecting the intended tense positions 17 and 5. Both logs are retained;
`crash-motif-066-browser-live-ii.log` is the successful final public run. No
application or score change was required.
