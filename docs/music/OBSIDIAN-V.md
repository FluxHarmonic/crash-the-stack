# Obsidian Index: Tension V audition

David heard little contrast when the game engine entered the tense material.
The M1 game source has the correct `(marks calm: 0 fill: 4 tense: 5)`; the
older album-worktree game reference lacks marks. This audition carries M1's
positions and changes the musical contrast. It does not replace the accepted
game asset or the standalone album arrangement. Album adoption is a separate
listening decision.

## Intended difference

Keep the accepted glass theme and wide chord veils. At order 5, give the bass
more pressure and make the low metallic answering line recognizable under game
sounds. A raised answer every two bars provides a clear recurring signal;
slightly firmer pitched frame taps support it without adding a snare or swell.

Dedicated tense instruments leave the calm and transition patches untouched:

- Bass 14 retains the triangle and moving FM layer. Triangle drive rises from
  0.12 to 0.28, layer gain from 0.95 to 1.0, and note levels rise three steps.
- Answer 19 opens the filter from 1200 to 2100 Hz and index from 0.45 to 1.15,
  with shorter 0.24-second decay / 0.11-second release. Instrument volume is
  25, note levels rise six steps, and the send is reduced to 0.12. Existing
  answers on row 8 of each 64-row phrase move up an octave.
- Frame 12 has slightly more pitched body (index 0.28) and drive (0.3).
  Strong accents rise two steps; quiet note levels remain intact.

Patterns 0–4, the main glass melody, both pad channels, tempo, master bus,
attack rows, note-off rows and B05 loop remain intact. No global gain is added.
The full render is 3:14.286; the tense entry is 1:42.857. Compare 0:00–0:23
with 1:43–2:06 for the same theme in calm and tense treatment, then hear the
later phrase variants in context.

## Reproduction

The authoring and rendering tools are Sigil shell scripts. Supply the native
Motif executable explicitly; use an external output directory. The rendering
step produces a same-engine original reference, the new full WAV, and a full
OGG under ogg/. The source under alternates retains the audition in Git.

```sh
sigil docs/music/tools/obsidian-tension.sgl --motif /path/to/motif --output /absolute/obsidian-tension-v
sigil docs/music/tools/obsidian-tension-render.sgl --motif /path/to/motif --output /absolute/obsidian-tension-v
```

Timing validation checks exact compiled trigger samples, melody/percussion
grids, section markers and loop destination. Rendering verifies duration,
stereo 44.1 kHz, decoded OGG and true-peak headroom. It also compares the first
4,536,000 PCM frames, covering calm plus the complete transition, against the
reference. Raw commands, source snapshots, hashes, audit and measurement logs
remain beside the external render. Measurements are not listening approval.

## Render checks

Both full WAVs are stereo 44.1 kHz and 194.285714 seconds. The first 4,536,000
PCM frames are identical, confirming unchanged calm and transition audio.
All 788 compiled attacks have zero sample-clock error. Tense-section loudness
moves from -23.6 to -22.9 LUFS, a 0.7 LU increase. Full revision loudness is
-23.1 LUFS with -6.3 dBTP; its OGG measures -6.2 dBTP and decodes cleanly.
No normalization or limiter was added. This verifies signal integrity and
headroom; David's listening determines whether the contrast succeeds.

The full delivery file is
~/artifacts/crash-the-stack-codex-content/obsidian-tension-v/ogg/obsidian-index-tension-v-full.ogg.
The reference WAV, revised WAV, source snapshots, full/tense loudness logs,
render-checks.json, exact commands and hashes live in the parent directory.
