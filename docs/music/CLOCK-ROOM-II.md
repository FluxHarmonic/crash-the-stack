# Clock Edge ambience and Obsidian Index identity review

David likes Clock Edge's rhythm-game character, but requested instrument polish
and a little more reverb because the first audition feels spare. Room II is a
separate audition in `docs/music/alternates/clock-edge/clock-edge-v2.cts`; retain the original unchanged.

## Clock Edge / Room II

The chord stabs and both layers now decay over 0.32 seconds rather than 0.20,
with release 0.12 rather than 0.07. Calm/tense lead decay increases from
0.13/0.14 to 0.18/0.19 seconds, release from 0.04 to 0.075. Answering bells
decay over 0.15 rather than 0.085 seconds, release 0.06 rather than 0.025.
These are envelope parameters; the retained note gates still shape the result.
The intent is more body and connection between phrases without another part.

Selective reverb sends rise: chords 0.12 to 0.20, leads 0.10 to 0.17,
bells 0.08 to 0.18, claps 0.035 to 0.06. Open metallic accents gain a small
0.025 send. Shared Zita size moves 0.48 to 0.52, damping 0.72 to 0.76 and wet
gain 0.18 to 0.21. The renderer adds the shared wet signal to the dry mix;
this does not attenuate the dry attacks. Kick, bass, closed hats and small
contact patches are unchanged. Instrument and note levels remain unchanged.

All written events, pitches, gates, dynamics, order and tempo are preserved.
The complete eight-channel compiled event tables match the original exactly.
The timing audit reports 1,729 triggers, zero off-sixteenth onsets, and at most
one sample of clock rounding. Full duration is 157.5 seconds; tense begins at
82.5 seconds. Calm/tense standalone exports are 75 seconds each. Source and
section validation/canonical checks pass. David accepted Room II, finding it
a good balance between the quieter tunes and more rhythm and motion. Keep it
as the current reference. It does not change the arrangement or implement a chart.

All three WAVs have zero saturated samples. Full peak/RMS are -5.87/-21.51
dBFS, calm -6.38/-21.46 and tense -5.89/-21.40. All OGGs decode cleanly as
stereo 44.1 kHz Vorbis with matching durations; title/album tagging preserves
decoded PCM. These audition measurements are not an album mastering target.

Reproduce with:

```sh
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks clock-edge-v2 --format both
sigil docs/music/tools/timing.sgl --motif "$MOTIF_BIN" \
  --tracks clock-edge-v2
```

## Obsidian Index assessment

David likes the composition but asks whether it overlaps with other songs.
The score supports that concern, especially against Quiet Array. Both use
the same functional i–VI–iv–v harmonic path in their opening eight-bar block,
two bars per chord, with the same later block reorderings. Quiet Array's
C#–A–G#–F# opening and Obsidian's B–G–F#–E opening share a descending interval
contour, transposed by a whole tone. Both use 32 calm bars, a four-bar transition
and 32 focused bars, a half-time backbeat, and similar reductions/reply placement.

Obsidian does have distinguishing material: sustained seventh voicings,
triangle bass, lower frame taps, a slower tempo and different later melodic
phrases. Sector Drift shares some reflective/glassy palette but has a different
broken-beat groove and harmonic path. The strongest overlap is therefore
compositional with Quiet Array, beyond simply sharing synth colors.

Recommended next audition: retain Obsidian's sustained seventh-chord character,
but write a new opening motif and vary the harmonic rhythm over a longer bass
pedal. Give its low percussion a distinctive recurring phrase. Keep complete
melodies and background detail; subtracting those would repeat the earlier
loss-of-character problem. Preserve Quiet Array as accepted. This is a proposed
direction at the time of this review. David subsequently authorized the rework;
see OBSIDIAN-II.md for the separate version. The original remains preserved.
