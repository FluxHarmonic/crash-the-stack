# Obsidian Index and Clock Edge

David accepted Quiet Array and Dead Sector enthusiastically, including their
focused sections, with no requested changes. Keep those first versions as
references. These last two planned originals complete the 15-composition pool;
these are the first auditions, not finished album masters. Subsequent feedback
and the separate Clock Edge ambience audition are recorded in CLOCK-ROOM-II.md.

| Track | Role | Tempo / key | Calm orders | Transition | Tense orders | Full length / tense entry |
| --- | --- | --- | --- | --- | --- | --- |
| Obsidian Index | Pyramid Solitaire | 84 BPM, E minor | 0–3 | 4 | 5–8; B05 | 194.286 s / 102.857 s |
| Clock Edge | Falling-block rhythm mode | 128 BPM, D# minor | 0–4 | 5 | 6–10; B06 | 157.500 s / 82.500 s |

Each pattern spans eight four-beat bars; transitions span four. Both retain
speed 3, eight channels and straight sixteenth onsets, with eighth-grid melody.
Independent calm/tense exports loop at B00. No noise riser or thirty-second
snare roll is used. Transitions use each track's main kit and a final-beat breath.

## Obsidian Index

A glassy B–G–F#–E idea unfolds over sustained minor-seventh voicings, triangle
bass and low frame-drum taps. The harmonic family is Em7, C/G/B (major seventh
with no third), Am7 and Bm7. Four written eight-bar melodies vary the contour,
register and cadence; the final variant returns to E. The third variant keeps
longer glass notes across a brief percussion reduction.

Its kit uses a soft low kick, short pitched frame taps and a low-band granular
shaker. The pads use restrained pure FM carriers and little chorus. Unlike the
short mallet chords of Quiet Array, these voicings sustain behind the melody.
The focused version adds bass pulses, shaker detail, lower-register answers
and a few quiet contact notes, retaining the same principal glass voice.
Voice counts by channel are 1/1/1/1/6/1/1/1.

## Clock Edge

A clear quarter-note kick supports narrow detuned bass and a composed minor
signal hook. Short claps carry a quiet pitched FM layer; closed/open metallic
ticks and clipped noise contacts make the percussion identity. The hook uses
D#–F#–F motion (F is E# in the scale) and answering D#/A#/G#/B phrases.
The harmony stays around D# minor, G# minor and an open B/F# voicing.

Five eight-bar variants alter answers and register, include a two-bar rhythmic
reduction, and close with a shortened drum phrase and return to D#. The focused
section introduces finer sixteenths, extra replies, slightly more open bass and
brighter signal articulation. Levels remain measured; tempo never changes.
Its clear beats, reductions and phrase boundaries are useful future chart cues,
but this pass does not generate a rhythm-game chart or implement game behavior.
Voice counts by channel are 1/2/2/2/4/2/1/1.

## Reproduction

`compose-final-pair.sgl` keeps the written phrases and arranging rules, reusing
the collision-checking writer in `compose-puzzle-pair.sgl`. It accepts identical
sources and refuses to overwrite later edits. Use `--output` to reproduce
elsewhere while keeping both helpers and render.sgl together in the repository.

```sh
sigil docs/music/tools/compose-final-pair.sgl --motif "$MOTIF_BIN"
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks obsidian-index clock-edge --format both
sigil docs/music/tools/timing.sgl --motif "$MOTIF_BIN" \
  --tracks obsidian-index clock-edge
```

Full and standalone calm/tense WAV/OGG exports accompany the sources. Only full
OGGs are delivered to Telegram. All tracks and collateral are game-owned and
remain in authorized temporary Motif staging; see HANDOFF.md. No synth engine
change is needed. The separate album-arrangement proposal is in ALBUM-PLAN.md;
no album edit, master, publication or repository migration is implied here.

## Validation

All six full/section sources validate and print canonically. Fresh composer
output matches both authored sources byte-for-byte. Full timing audits find
694 triggers with zero sample error for Obsidian Index, and 1,729 triggers
with at most one sample of rounding for Clock Edge. Both have zero off-sixteenth
onsets; melody/backbeat grid checks pass. Voice counts fit the existing budget.

All six WAVs contain zero saturated samples. All six OGGs decode cleanly at
stereo 44.1 kHz with matching durations; title/album tagging preserves decoded
PCM. Full peak/RMS are -6.63/-24.97 dBFS for Obsidian Index and -5.98/-21.55 dBFS
for Clock Edge. Their background and rhythmic energy roles remain distinct;
final in-game and album balancing are later passes.

Full lengths are 194.285714 and 157.500000 seconds. The package retains source
snapshots, exact render commands, composer/source information, reproduction and
timing records, measurements, the album proposal and SHA256 checksums. These
technical checks leave musical selection to listening feedback; in-game
transition/chart behavior and album arrangements have not been validated yet.
