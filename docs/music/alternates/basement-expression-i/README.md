# Basement Circuit: Expression I

David requested Basement Circuit next and asked that instrument patches be
explicitly reviewed alongside composition. This audition separates two patch
ideas from a phrase-development idea. No maintained game/album source or public
release is replaced pending listening feedback.

## Patch review

This is a source/patch-design review followed by contextual listening candidates;
measurements are not a claim of listening approval. Pool IDs differ from output
IDs; the shared layout maps them to the original game and album banks.

| Pool instruments | Decision for this audition |
|---|---|
| 1 kick, 4 sub | Retain the established four-on-the-floor and offbeat foundation. |
| 2 soft roll snare, 12 box clap | Retain the shortened, quieter noise and the accepted fill integration. |
| 3 sand tick, 14 breath hat | Retain the distinct sand/breath contrast; no generic replacement kit. |
| 5 minor stab, 6 open-fifth stab | Retain voicing, dry rhythmic placement and darker low-pass tone. |
| 7 pluck | Audition more body and a softer FM edge without changing its notes in the patch pair. |
| 8 bell | Keep its existing restrained, longer response; only selected phrase positions change. |
| 9–11 acid closed/middle/open | Audition faster filter closure and slightly shorter amplitude body; preserve opening progression, gain, notes, accents and slides. |
| 13 riser | Retain the approved reduced swell amplitude of 0.25. |
| 15 hollow tom, 16 logic pip | Retain the sparse electronic percussion and their existing placement. |

The pluck remains an FM stab. Index changes 1.4 to 0.95, cutoff 1350 to
1650 Hz, resonance 0.20 to 0.15, decay 160 to 220 ms and release 65 to 75 ms.
The intent is a rounder, less metallic note with a little more body. Notes,
levels, pan and reverb send are identical in its isolated comparison.

The acid patches retain cutoff, envelope depth, velocity sensitivity, drive,
resonance and output gain. Filter decay changes 180 to 90 ms; amplitude decay
160 to 120 ms and sustain 0.55 to 0.48. The sixteenth-note sequence leaves little
time for the original envelope to close. This experiment aims to separate its
accents and expose the groove, without raising the previously reduced bass.
It does not add transport modulation or change the filter-opening progression.

## Phrase development

The phrase-only comparison uses the original patches. Three shared phrases
change, on channels 6 (pluck) and 7 (bell):

- Pool 12: the album's four-bar A-pedal bridge asks E–G–A, then answers G–E
  and B–A; quiet bell responses occupy the spaces between those gestures.
- Pool 3: the later calm phrase develops D–F–A over D minor, then answers
  over F. It changes only the final four bars; the opening stays intact.
- Pool 14: the album reprise recalls the shape descending over C and G,
  then points to the existing A-minor ending.

The pluck has longer anchor gates, modest accents and quarter-note anchors;
rests divide the gestures. Bass, drum, chord and auxiliary-percussion events
are identical. Tense acid notes, slides and their accepted quieter levels are
unchanged. The first opening and the complete ending remain intact.

Both full candidates use one proposed shared pool. The layout is unchanged:
there are no new downbeat attacks conflicting with its entry gates. The game
retains its B06 loop; the album retains its 3:40.645 finite arrangement and tail.

## Listening sequence

Each pair plays BEFORE then AFTER, from fresh renderer state with two release
bars. The exposed and contextual patch pairs keep identical performance; the final
phrase pair keeps original patches. No per-half normalization or new limiting masks the differences.

| Pair | Before | After | Context |
|---|---|---|---|
| Exposed pluck | 0:00.000 | 0:11.613 | Four bars, +18 dB monitoring on both halves |
| Pluck in the mix | 0:23.226 | 0:42.581 | Eight calm bars at actual relative levels |
| Acid contour | 1:01.935 | 1:21.290 | Eight tense bars |
| Melodic replies | 1:40.645 | 2:07.742 | Four-bar bridge and eight-bar calm return |

The montage lasts 2:34.839. The pluck is deliberately distant, so its full-mix
change is subtle: the exposed pair helps judge its timbre without increasing its
level in the song. The complete candidate combines all three proposed
ideas; the complete reference preserves the accepted composition and patches.
New phrases appear near 1:01.935 (bridge), 1:17.419 (late calm development) and
3:13.548 (descending reprise). These are auditions, not release masters.

## Reproduction

From the album repository:

```sh
sigil docs/music/tools/basement-expression.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/basement-expression-replay
sigil docs/music/tools/expression-render.sgl --stage native \
  --motif "$PWD/build/dev/bin/motif" \
  --input "$PWD/docs/music/alternates/basement-expression-i" \
  --output /path/to/fresh/external/render-directory
sigil docs/music/tools/expression-render.sgl --stage delivery \
  --input "$PWD/docs/music/alternates/basement-expression-i" \
  --output /path/to/the/same/render-directory
```

The frozen before pool and layout drive later reproductions. Per-feature pools
are retained, so patch choices can be accepted independently of phrase choices.
The composer protects backing events, clock, bus, instrument routing and levels.
Full native clock, game-loop, comparison, encoded-audio and regeneration results
will accompany the delivered files. Audio and commands belong outside the repo
under ~/Ops/artifacts/crash-the-stack-album/basement-expression-i/ (initial native
renders) and basement-expression-i-delivery/ (final comparison and full OGGs).
