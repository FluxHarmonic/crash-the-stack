# Fault Line: Defrag live trial

David approved the album composition and asked to try the track in a game mode
using the merged live player. Fault Line is now the eighth tune in Defrag's
music pool. Stack, the stealth hub and the Black Glass title theme retain their
existing selections. The rhythm-game use remains a future charting task.

## Try it

Open a local browser build with:

```
?code=380000072B&fresh&tune=fault-line&trace-at=20&trace
```

Tap once if the browser needs an audio gesture. The tune override guarantees
Fault Line, even if the no-repeat rule would otherwise choose a different tune.
The trace lands after about twenty seconds of active gameplay: the two-bar fill
leads into the rock section. Without the override, a fresh process at Defrag
seed 7 selects Fault Line through the ordinary pool. Music begins calmly; the
full guitars belong to the counter-hack. Returning from the counter-hack to
normal play returns the music to calm on a bar.

The share code is Defrag, hacker rules, seed 7, draw one and Vegas scoring.
Use this normal launch path: the direct `?cards` shortcut bypasses the code
that applies the shortened `trace-at` threshold. A modifier-only key such as
Shift does not unlock Chrome audio; tap or press Enter after boot.

Native equivalent, from a release build:

```sh
scripts/dev ./build/release/bin/crash-the-stack \
  --code 380000072B --fresh --music-tune fault-line --trace-at 20
```

Use the existing rate ladder by default. For a controlled low-rate comparison,
add `music-rate=22050` in the browser or `--music-rate 22050` natively.

## Shared source and shipping

The game template in `songs/fault-line/arrangements.sgl` now generates
`assets/tunes/fault-line.cts`. Its marks are calm 0, fill 2 and tense 3. Calm
loops orders 0–1 (sixteen bars), the fill occupies order 2 (two bars), and tense
loops orders 3–9 (fifty-six bars), with B00 and B03 respectively. Tempo is 126.
The original alternate draft remains frozen for historical render provenance.

The game uses the approved shared patches at their existing game bus level,
not the louder MP3 master. Its asset is covered by the license manifest, music
catalog and service-worker precache. The album score and master are unchanged.

Master was merged at a07c8f8. Its incoming marks/history were reconciled into
all sixteen existing game/title templates, then the regenerated files were
compared byte-for-byte with the preserved merge outputs. Motif stays at 0.6.6
for instrument gain; Sigil's live-audio dependencies follow master at 0.22.5.

## Validation

The all-song regeneration check passes for all sixteen shared compositions.
`test/test-fault-line-live.sgl` exercises Defrag's real seed selection, calm
looping, trace-driven fill, tense arrival, a complete tense loop and escape back
to calm through the live renderer/resampler. The existing music, gain and asset
tests cover the surrounding integration.

At implementation commit `d123cde00288`, all 307 tests passed across
`test-music`, `test-music-live`, `test-fault-line-live`, `test-music-gain` and
`test-assets`. The web build completed, including `wasm-opt` for both game and
tracker. A headless Chrome run of the optimized game observed `music playing
fault-line`, `music section fill at 2 0`, `music section tense at 3 0`, and
`cards trace 20 twist counter 0 none`, with no console errors. The browser
check pinned 22050 Hz and disabled the background for reproducibility; phone
performance with the default adaptive rate remains a listening check.

Validation logs and the screenshot live outside the repository in
`~/artifacts/crash-the-stack-album/fault-line-game-integration/`.
No VPN preview or public deployment was started.

## Tonight's release merge

`feat/p4b` at `360541d` is merged into `feat/codex-album` at `e300967`.
The conflict in `scripts/publish-web` is resolved in favor of the new site
staging flow, with the approved per-track album URLs preserved and dry-run
uploads disabled. Motif remains 0.6.6 and the live runtime remains 0.22.5.

After the merge, 359 tests passed across `test-music`,
`test-fault-line-live`, `test-assets`, `test-menu` and `test-imports`.
The R2 handler's 17 checks passed. The generated album manifest matches all
fifteen published track titles, durations and exact URLs in the approved
Sector Drift II publication. An isolated publisher fixture confirms that
`--dry-run` selects local staging without invoking Wrangler.

Build the release from the merged commit. The optimized browser audition
recorded above predates the P4b merge; it is evidence for the music integration,
not a release artifact for the merged site. No public deployment was made.
