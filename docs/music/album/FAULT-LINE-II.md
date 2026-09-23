# Fault Line: rock-led composition II

David liked the quiet opening but wanted the rock sections to carry the song,
with the soft material used as a brief intro and a middle interlude. He also
asked for an alternate solo and wanted to retain the softer secondary melody
over the rock backing.

The new album form is **2:59.048** (94 bars at 126 BPM). The intro is four bars
(7.619 seconds), followed immediately by the band. There is one eight-bar soft
interlude (15.238 seconds). Quiet material thus frames and interrupts the rock
form instead of occupying its opening forty-six seconds and long middle.

## Form

| Start | Section | Development |
|---|---|---|
| 0:00 | Short clean invitation | The clean melody is present immediately; bass joins halfway through |
| 0:08 | Main riff | Accepted guitar/bass groove |
| 0:23 | Driving variation | New syncopated call/reply; clean secondary melody joins in the second half |
| 0:38 | Electric theme | The existing melodic theme over the original backing |
| 0:53 | Lower-register alternate solo | Longer connected phrases, a held whole-tone rise and an ascending answer |
| 1:09 | Rock harmonic turn | G minor, B-flat, D minor and A minor under the softer clean melody |
| 1:24 | Exposed harmonic middle | The retained quiet eight-bar interlude |
| 1:39 | Moving entrance | The accepted transition returns without the old stall |
| 1:43 | Bent solo | Existing higher pentatonic solo, unchanged |
| 1:58 | Theme in full | Existing melodic reprise |
| 2:13 | Half-time weight | Longer guitar/bass gates and a half-time snare; quiet secondary melody |
| 2:29 | Final driving theme | Main melody over the new driving riff |
| 2:44 | Rock coda | Four instrumental bars keep the band in front |
| 2:51 | Final band chord | The accepted demo's D landing replaces the long soft outro |
| 2:55 | Room tail | Natural release |

All sixteen instrument patches and the mix bus are unchanged from composition I.
The contrast comes from notes, gates, drum placement, chord order and form.
The two original electric-theme sections remain; the clean FM guitar also carries
selected secondary phrases over the new heavy backing. It is not removed merely
to make the arrangement heavier.

The new backing variations anchor every bass attack to a guitar attack and share
the same gate length. The guitar can still add unaccompanied decorations. This
retains the relationship established during the bass review rather than
reintroducing a separate, competing bass countermelody.

## Shared game draft

The same shared source now supplies an expanded tense sequence. Calm orders 0–1
and the transition at order 2 remain unchanged. Tense orders 3–9 contain the
main riff, driving variation, electric theme, harmonic turn, existing solo,
half-time variation and final driving theme. B00 repeats calm; B03 repeats tense.
The alternate album solo remains an intentional album-only phrase.

The game draft remains `docs/music/alternates/fault-line-game.cts`; no runtime
selection or published website audio changes. A complete game audition is
2:24.762 including its release tail, with tense starting at 0:34.286.

## Sources, validation and reproduction

Edit `docs/music/songs/fault-line/parts.cts` and `arrangements.sgl`, then use the
normal shared-song generator. The composition I parts and layout were frozen
under `docs/music/alternates/fault-line-composition-i/` before this revision.
The historical revision composer reads those snapshots and writes to a fresh
folder; both revised shared-source files reproduce exactly.

```sh
sigil docs/music/tools/fault-line-rock-form.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/fresh-fault-line-ii
sigil docs/music/songs/fault-line.sgl --stage check --motif "$PWD/build/dev/bin/motif"
sigil docs/music/tools/fault-line-rock-form-audit.sgl --output /tmp/fault-line-ii-checks
sigil docs/music/tools/fault-line-render.sgl --stage native --revision ii \
  --variant album --motif "$PWD/build/dev/bin/motif" --output /absolute/fresh/render-directory
sigil docs/music/tools/fault-line-render.sgl --stage delivery --revision ii \
  --variant album --motif "$PWD/build/dev/bin/motif" --output /absolute/fresh/render-directory
```

Use `--variant game` for the expanded calm-to-tense audition. The renderer now
accepts an explicit revision and derives the game release-tail pattern from the
actual layout rather than assuming six game patterns.

The form audit verifies unchanged patches/bus and every original source phrase,
new bass/guitar attack and release alignment, eight shared rock sections, short
intro/interlude and loop boundaries. The album finite-score check reports 2,680
attacks, zero sample-clock error, no off-grid 32nd-note attacks, released final
gates and passing voice budgets. All sixteen shared compositions regenerate.
These checks supplement the listening review; they cannot judge the phrasing.

Native sources, renders, commands and measurements:
`~/Ops/artifacts/crash-the-stack-album/fault-line-composition-ii/`.
This remains a clean-gain composition audition, not a release master.

## Render checks

Both versions use +2.4 dB clean export gain. Decoded album: -19.5 LUFS-I,
13.9 LU range, -2.0 dBTP, final second -84.3 dBFS. Game: -20.0 LUFS-I,
9.8 LU range, -1.5 dBTP, final second -78.3 dBFS. All format, duration,
peak and tail checks pass. Game preview timing check: 2,135 attacks, zero
sample-clock error, final gates released and passing voice budgets.

Composition III supersedes this audition; see [the timing/fill/fuzz pass](FAULT-LINE-III.md).
