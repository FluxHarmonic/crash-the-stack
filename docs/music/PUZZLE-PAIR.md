# Quiet Array and Dead Sector

David approved the next pair of original game-mode tracks after accepting
Glass Current / Paper Kit II and Basement Circuit / Signal Kit IV. These
new pieces use the established dark palette, distinct percussion, complete
phrases and subtle calm/tense development. Existing tracks remain unchanged.

| Track | Role | Tempo / tonal center | Full duration | Tense entry |
| --- | --- | --- | --- | --- |
| Quiet Array | Stack / Mahjongg | 92 BPM, F# minor | 177.391 s | 93.913 s |
| Dead Sector | Minesweeper | 108 BPM, C# with Phrygian color | 151.111 s | 80.000 s |

Both have 32 calm bars (orders 0–3), a four-bar transition (order 4), then
32 focused bars (orders 5–8). B05 repeats the focused region. Independent
calm and tense exports loop to B00. Sources retain the existing speed-3,
eight-channel tracker layout. All onsets are straight sixteenths, and melody
onsets are eighths; neither transition uses a thirty-second roll or noise swell.

## Quiet Array

A low F# kick and warm sine bass support felt mallets, ceramic clicks and
soft linen brushes. The ceramic backbeat is a very short pitched FM bell,
not the usual noise-snare voice. Short band-limited contact sounds provide
occasional small replies on the other side of the stereo field.

Four written eight-bar melodies develop a C#–A–G#–F# idea through F# minor,
B minor and C# minor, with D/A/C# as a wistful open voicing. The D voicing
omits the major third. A longer held phrase accompanies the two-bar percussion
reduction in the third variant; the fourth variant resolves back to F#.
Quiet bell answers leave the main mallet line in focus.

The focused section adds low pulses, lightly brighter mallets, finer brush
subdivisions and extra bell answers. It retains the full phrases and harmonic
sequence, with modest levels. Its transition uses the same ceramic kit and
a descending/returning fragment of the melody, then leaves a final-beat breath.
The lifetime voice counts by channel are 1/1/2/1/6/2/1/1.

## Dead Sector

A dry, sealed thud and C# bass pedal give the track a watchful pulse. Tight
relay snaps, extremely short pitched clock contacts and narrow-band coil
clicks make up the kit. It uses little high-frequency hiss. The recurring
probe melody reaches toward D, the semitone above C#, before returning;
short answering lights supply restrained tonal punctuation.

Four eight-bar phrases vary the probe's order, register, cadence and spaces.
The third phrase briefly removes most percussion while retaining low notes
and part of the melodic thought. The fourth returns the melody to low C#.
The clock contacts remain background percussion rather than a continuous
alarm or a signal tied to a game action.

The focused section adds syncopated bass pulses, a little probe brightness,
quiet D/C# replies and faint upper-neighbour harmonic friction. Its darker
chord contains a low C# root, G# fifth and very quiet upper D. The transition
uses the same kit and the G#–D–C#–G# motif, with a final-beat breath.
The lifetime voice counts by channel are 1/1/1/1/5/2/1/1.

## Reproduction and ownership

`compose-puzzle-pair.sgl` preserves the written melodies and arranging rules.
It writes canonical sources, accepts identical existing sources, and refuses
to overwrite a later edited version. Use `--output` to reproduce elsewhere.

```sh
sigil docs/music/tools/compose-puzzle-pair.sgl --motif "$MOTIF_BIN"
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks quiet-array dead-sector --format both
sigil docs/music/tools/timing.sgl --motif "$MOTIF_BIN" \
  --tracks quiet-array dead-sector
```

Full and standalone calm/tense WAV/OGG exports accompany the sources; only
the two full OGGs are sent for listening. Neither piece requires engine changes.
David loved Quiet Array's relaxed feel, chords and tense section, with no
notes. He also loved Dead Sector's delicate mystery and focused rhythm.
Both first versions are accepted references; preserve them without further
refinements unless requested. This pair brought the pool to **13 compositions**.
The subsequent Obsidian Index and Clock Edge auditions complete the 15-track
pool; see FINAL-PAIR.md. Sources, render
collateral and this composer are game-owned material for the eventual
crash-the-stack migration described in HANDOFF.md.

## Validation

All six full/section sources validate and print canonically. Fresh composer
output matches both authored sources byte-for-byte. The full timing audits
find 731 triggers in Quiet Array and 732 in Dead Sector, with zero sample-clock
error and zero off-sixteenth onsets. Main backbeats and melodic grids pass;
all channel voice counts stay below the eight-voice limit.

All six WAVs have zero saturated samples; all six OGGs decode cleanly at
stereo 44.1 kHz and match their WAV durations. Title/album tagging preserves
decoded PCM. Quiet Array's full peak/RMS are -6.84/-23.47 dBFS; Dead Sector's
are -5.88/-23.81 dBFS. The subdued levels suit their background roles and
retain headroom; final in-game playback balancing remains a separate pass.

The package includes full and standalone sources, native render commands,
source/voice information, reproduction and timing records, level measurements,
this report and SHA256 checksums. Previous tracks and audition packages are
preserved. These technical checks do not replace listening feedback or the
pending in-game loop/transition review.
