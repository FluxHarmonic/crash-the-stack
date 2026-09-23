# Fault Line: Defrag live trial

David approved the album composition and asked to try the track in a game mode
using the merged live player. Fault Line is now the eighth tune in Defrag's
music pool. Stack, the stealth hub and the Black Glass title theme retain their
existing selections. The rhythm-game use remains a future charting task.

## Try it

Open the browser preview with:

```
?cards&fresh&seed=7&tune=fault-line&trace-at=20&trace
```

Tap once if the browser needs an audio gesture. The tune override guarantees
Fault Line, even if the no-repeat rule would otherwise choose a different tune.
The trace lands after about twenty seconds of active gameplay: the two-bar fill
leads into the rock section. Without the override, a fresh process at Defrag
seed 7 selects Fault Line through the ordinary pool. Music begins calmly; the
full guitars belong to the counter-hack. Escape should return to calm on a bar.

Native equivalent, from a release build:

```sh
scripts/dev ./build/release/bin/crash-the-stack \
  --cards --fresh --seed 7 --music-tune fault-line --trace-at 20
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
tests cover the surrounding integration. Native and browser results are recorded
in the follow-up validation entry once complete.
