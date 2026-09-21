# Timing revision 2

David's listening feedback identified displaced drums, leads and bells. The
main issue was the written rhythm: the arrangements used a thirty-second-note
row grid, and several recurring phrases landed halfway between the intended
sixteenths. That is 43.60 ms in liquid, 60.48 ms in house and 56.82 ms in electro.
The compiler was scheduling those written positions accurately.

## Musical corrections

- Drums and bass now use a straight sixteenth-note onset grid. Brushed and
  off-beat hats retain their existing groove. The final eight snare hits in
  each four-bar fill remain thirty-seconds, with the original rising accents.
- Liquid's early kick at bar row 11 moves to 12. Its bass pickups at 7 and 27
  move to 8 and 28. Nineteen accidental adjacent kick doubles merge into a
  single hit when they land together. Two half-time drum-drop return snares
  move from beat four back to beat three, matching the rest of the calm groove.
- Pluck answers now use eighths: liquid/house row offsets 3, 14, 23 become
  4, 16, 24; electro offsets 2, 12, 26 become 4, 12, 28.
- Liquid's lead at offsets 2, 14, 22 becomes 0, 12, 24: an anchored downbeat,
  off-beat answer and beat-four response. Electro's recurring late bell at
  offset 9 moves to beat two (8). House's bell pickup moves from 30 to 28.
- Off-grid snare ghosts and turnarounds align to sixteenths. Three coincident
  house snare hits merge using the stronger original accent.
- Acid sixteenths and legato slides, electro arpeggios, syncopated chord stabs,
  harmony, patches, volumes, tempo, order and section lengths are retained.
  Melodic note-offs move with their onsets, preserving their short articulations.

This is an edit of the three compositions, not a new engine quantization mode.
No synth or render code changed. Fast bell/lead/percussion attacks were checked
against their patch definitions (roughly 1–8 ms). The pad's slower swell and the
clap's internal 10 ms bursts are intentional and remain part of those sounds.
The renderer's shared one-sample retrigger dip is about 0.023 ms at 44.1 kHz.

## Checks

`timing.sgl` independently checks every written onset against its role's grid,
the main snare backbeats, the final fill roll and the tense-loop jump. It then
compares every channel's compiled triggers with an exact rational sample clock
across the full arrangement, including acid slides that do not retrigger.

| Track | Note/slide onsets | Compiled note triggers | Worst clock error |
| --- | ---: | ---: | ---: |
| Glass Current | 3,074 | 3,074 | 0 samples |
| Basement Circuit | 2,616 | 2,500 | 0 samples |
| Relay Ghost | 2,523 | 2,523 | 0 samples |

Each fill retains exactly four odd-row snare hits in its final thirty-second
roll. All three original versions fail this new audit, confirming it catches
the placements that prompted the revision. Comparison against the originals
also confirms unchanged instrument definitions, melodic pitch/velocity
sequences, lead/bell/pluck gate lengths, tempo, pattern lengths and order.
All revised sources round-trip canonically and compile within the voice budget.

Run from this checkout:

```sh
sigil docs/music/tools/timing.sgl --motif "$MOTIF_BIN"
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --full-only --format both --output /tmp/motif-timing-v2
```

David requested full versions only for future listening deliveries so the fill
is included. This revision delivers three full WAVs and three full OGGs, with
`-timing-v2` appended to their filenames; the earlier auditions remain intact.
The OGGs use Motif's native Vorbis writer, and the new helper's `--full-only`
option omits standalone calm/tense files. Final musical approval remains a
listening comparison against the first versions.
