# Obsidian Index / Pedal II

David likes the first composition but wants each track to stand on its own.
The comparison with Quiet Array found shared harmonic progression, opening
melodic contour and phrase construction. This authorized rework retains the
original as `docs/music/alternates/obsidian-index/obsidian-index.cts` and adds `docs/music/alternates/obsidian-index/obsidian-index-v2.cts`.
It remains one of the fifteen compositions, not an extra soundtrack track.

David accepted Pedal II as great and definitely unique, then requested gentle
motion in the pedal and delicate wider chord support. Pedal II is the accepted
arrangement reference; see OBSIDIAN-III.md for the separate texture audition.

David also accepted Clock Edge / Room II during this pass: its balance between
quieter tunes and more rhythm/motion works well. Preserve it as selected.

## Musical changes

The opening E–B leap, held A and delayed D/B answer replace the old descending
theme. Four complete eight-bar variants develop that idea through a higher
answer, an exposed held-note passage, and a return to low E. The glass lead,
triangle bass, soft kick, low frame taps, shaker and original seventh pads
retain their patches. The new identity comes primarily from the writing.

The opening bass stays on E for six bars while Em7 changes to the open C/G/B
voicing above it. A B/E/A suspension then makes the return to E feel unresolved
until the next phrase arrives. The new sustained suspension uses additive FM
carriers inside one patch; no engine feature is required. Existing pad voices
are untouched, and the pad channel uses seven of the available eight voices.

| Eight-bar phrase | Harmony / bass | Harmonic lengths in bars |
| --- | --- | --- |
| Theme | Em7/E → C/G/B over E → B/E/A over B | 3 + 3 + 2 |
| Answer | Am7/A → Em7/G → C/G/B over C → B/E/A over B | 3 + 2 + 1 + 2 |
| Suspended middle | C/G/B over E → Em7/E → B/E/A over B → Em7/E | 3 + 2 + 2 + 1 |
| Return | Em7/E → C/G/B over E → B/E/A over B → Em7/E | 4 + 2 + 1 + 1 |

The frame drums now have a two-bar phrase: quieter first-bar tap on row 12,
stronger low answer on row 24, then the next bar's row-16 tap and quiet row-28
reply. Downbeat kicks anchor this syncopation. The focused section adds small
frame ghosts, root-note bass subdivisions and a muted lower counterline.
The middle reduction has moved to support the held melody; the final phrase
settles on E. The transition uses the same percussion and new melodic material,
with a last-beat breath and no noise swell.

## Form and exports

Tempo remains 84 BPM, E minor, speed 3 and eight channels. Calm orders 0–3
cover 32 bars, transition order 4 covers four, and tense orders 5–8 cover 32.
B05 returns to the tense section. Full length is 194.285714 seconds and tense
enters at 102.857143 seconds. The standalone calm and tense loops are each
91.428571 seconds with B00. Only the full OGG is sent for listening.

The source, full/loop WAVs and OGGs, source snapshots, exact render commands,
composition/timing audit records, level measurements and checksums are retained
under the established Ops soundtrack artifact directory. The source and
collateral remain temporarily staged in Motif, intended for crash-the-stack.

## Reproduction and validation

`compose-obsidian-ii.sgl` contains the written melodies, harmonic map and kit
rules. It imports the first pair's preserved instrument bank and pattern
writer; its original source supplies the unchanged tempo, bus and provenance.
The helper accepts identical output and refuses to overwrite later edits.

```sh
sigil docs/music/tools/compose-obsidian-ii.sgl --motif "$MOTIF_BIN"
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks obsidian-index-v2 --format both
sigil docs/music/tools/timing.sgl --motif "$MOTIF_BIN" \
  --tracks obsidian-index-v2
```

Full and section sources validate and print canonically. Fresh composer output
matches the source exactly. Melodic gates do not overlap or remain open at
pattern boundaries. Pad/bass changes align, with six rows (0.536 seconds)
between each pad gate release and the next harmony, longer than its 0.4-second
release setting. Voice counts by channel are 1/1/1/1/7/1/1/1. The original
instrument bank and bus match the first source; only the suspension is added.
The grid audit finds 756 triggers, zero off-sixteenth onsets and zero sample
clock error. Full peak/RMS are -6.24/-25.00 dBFS, calm -6.48/-24.86 and tense
-6.48/-24.97. All three WAVs have zero saturated samples; all three OGGs decode
cleanly at stereo 44.1 kHz with matching durations. Tagging preserves decoded
PCM. The similar calm/tense average levels are intentional: development comes
from bass subdivisions and the lower counterline rather than a master lift.
These score/render checks accompany the subsequently accepted arrangement.
