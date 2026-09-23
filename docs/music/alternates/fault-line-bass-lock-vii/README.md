# Fault Line: bass and guitar phrasing VII

David liked the Style VI bass in isolation but found it disconnected from the
rhythm guitar in the mix. This pass changes only the bass performance. Every
patch, instrument level, bus setting, drum part, guitar part and lead bend stays
as in VI. The moving entrance and finite 49.524-second layout remain intact.

The previous bass often attacked during guitar releases and missed the open
chord accents. Its repeating two-bar shape also ignored the guitar's different
fourth- and eighth-bar replies. Simplifying a line alone did not make it support
the arrangement. This revision follows the actual guitar phrase variations.

- The call shares attacks at rows 0, 10, 16 and 28, with the same gate lengths.
  The guitar alone plays its quick row-6 strike and third/fourth decorations.
- The reply shares rows 0, 12, 18, 26 and 30. Its third follows the guitar's
  third instead of landing a root or fifth against that note.
- The more spacious fourth-bar reply shares rows 0, 10, 18 and 28. A quiet fifth
  at row 24 answers inside the rest, then resolves with the guitar at row 28.
- The eighth-bar turnaround follows the guitar's D pickups. The moving entrance
  shares its A, C, E and D accents without adding an independent running line.

The bass has 100 attacks rather than 90. Of those, 97 share guitar onsets,
compared with 47 of the previous 90. The three independent notes are deliberately
quiet fifth responses in longer gaps. Every shared attack agrees with the guitar
pitch one octave below; gates in the revised sections end together. This is a
rhythmic foundation with selective responses, rather than a duplicate of every
guitar strike. These checks establish the intended relationship, not whether
the musical result works for the listener.

## Listening and reproduction

The full demo is 49.524 seconds. The comparison plays VI first and VII from
**0:19.048**. Each half covers four pocket bars, the two-bar moving entrance,
two solo bars and two release bars. Both halves use the same delivery gain.

Run from the album worktree:

```sh
sigil docs/music/tools/fault-line-bass-lock.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/fault-line-vii-replay
sigil docs/music/tools/fault-line-bass-lock-audit.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /absolute/external/artifacts
sigil docs/music/tools/expression-render.sgl --stage native \
  --input "$PWD/docs/music/alternates/fault-line-bass-lock-vii" \
  --motif "$PWD/build/dev/bin/motif" --output /absolute/fresh/artifacts
sigil docs/music/tools/expression-render.sgl --stage delivery \
  --input "$PWD/docs/music/alternates/fault-line-bass-lock-vii" \
  --gain-db -1.9 --output /absolute/fresh/artifacts
```

The audit compares all seven non-bass compiled tick streams, the complete
instrument bank and the bus. It checks the increased proportion of shared
attacks, their octave relationship and matching note-offs in the changed
sections. The finite-score audit checks the playback clock and released gates.

Renders, source snapshots, command arrays, renderer identity and measurements:
`~/Ops/artifacts/crash-the-stack-album/fault-line-bass-lock-vii/`.
This is still an audition; maintained game/album arrangements and public files
are unchanged.

Validation completed: all seven generated source/map/manifest files reproduce
exactly; all fifteen maintained songs regenerate. The finite audit reports 719
attacks, zero sample-clock error and all final gates released.

Native preflight found one full-mix accent at 0.0 dBTP. Bass attack levels in
the revised sections were reduced by two tracker units before final delivery.
Patch gains and all other channels remain unchanged. The rejected render is
retained separately; final renders use the `fault-line-bass-lock-vii-final/`
artifact directory.
