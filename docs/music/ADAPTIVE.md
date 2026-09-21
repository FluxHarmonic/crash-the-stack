# Legacy calm/tense arrangements

David approved developing adaptive arrangements for Shadow Protocol, Dirty
Cache and Breach Vector. These are separate auditions based on the accepted
Shadow Protocol, Dirty Cache III (on-beat pluck) and Breach Vector IV. All
accepted full-song versions remain unchanged and remain the listening references.
No new composition is added to the count of eleven.

After listening, David accepted Shadow Protocol and Breach Vector's adaptive
arrangements. He particularly liked Shadow Protocol's subtle tense change and
Breach Vector's variations. Dirty Cache's tense section sounded different but
did not change the character sufficiently; see [DIRTY-CALM-II.md](DIRTY-CALM-II.md)
for a separate revision that restrains the early arrangement.

## Sections and listening positions

| Track | Calm orders / duration | Transition order / duration | Tense orders / start | Full duration / jump |
| --- | --- | --- | --- | --- |
| Shadow Protocol | 0–7 / 80 s | 8 / 5 s | 9–16 / 1:25 | 165 s / B09 |
| Dirty Cache | 0–7 / 69.818 s | 8 / 8.727 s | 9–18 / 1:18.545 | 165.818 s / B09 |
| Breach Vector | 0–15 / 73.143 s | 16 / 4.571 s | 17–35 / 1:17.714 | 164.571 s / B11 |

B11 is hexadecimal order 17. The sources retain their clocks: Shadow Protocol
96 BPM/speed 6, Dirty Cache 110 BPM/speed 6 and Breach Vector 140 BPM/speed 4.
Breach Vector retains its existing 64-row motifs and internal subdivisions;
this pass does not requantize them to a different meter. Calm patterns are
selected and reordered from the accepted compositions, retaining their musical
cells and instruments. Entry-state note-offs clear otherwise idle channels.
Absolute times in the new arrangements therefore differ from the old exports.

## Musical treatment

**Shadow Protocol:** keep the delicate FM pad, low vibes and muted signal.
The transition introduces a quiet watch-like tick around the bass pulse, with
a short C-sharp hint before the D-minor return. Tense patterns add restrained
D-pedal rearticulations, a slightly more open signal and sparse C-sharp/E bell
answers. The original bell-led phrases remain complete. A drum-light passage
reduces the ticking and bass repetitions before the groove returns.

**Dirty Cache:** retain the on-beat pluck, bass pocket and G-minor to D-minor-seven
to D-minor harmonic return. The transition develops the existing stepped-filter
chords, adds three restrained snare strokes and leaves a short breath. Tense
variants use a somewhat brighter FM chord voice, a complementary reed phrase
in the first half of selected patterns, and quiet snare ghosts. The original
reed hook occupies the second half. The pluck remains distant and unchanged.
A drum reduction interrupts the build without deleting its melodic phrase.

**Breach Vector:** base the calm sequence on IV's smooth FM bass, muted riff,
pad breaths and pluck variants, retaining spacious middle passages. A dedicated
break leads into controlled grit bass and slightly brighter fixed-filter FM
riff variants. The existing pipe phrases provide answers throughout the tense
region; no new wobble or resonant acid sweep is introduced. Drum reductions
and pluck-led passages still provide relief within that region. Converted
FM-bass accents are brought back to the established grit-bass levels so the
instrument switch does not also apply IV's FM-specific gain increase.

## Implementation and validation

Each arrangement has eight tracker channels. Lifetime voice counts by channel:

- Shadow Protocol: 1 / 1 / 1 / 2 / 1 / 1 / 1 / 1.
- Dirty Cache: 2 / 1 / 1 / 2 / 6 / 6 / 1 / 2.
- Breach Vector: 1 / 1 / 1 / 2 / 2 / 1 / 2 / 1.

All are below the eight-voice-per-channel limit. At the calm, transition and
tense starts, all channels receive an explicit note or note-off so entry does
not require held state from an earlier section. Full sources jump back to the
tense start. Separate calm and tense sources each end with B00 and initialize
from fresh state. The existing renderer generates those gameplay loop sources
alongside the complete auditions; only full tracks are sent to Telegram.

The generic legacy audit (`adaptive-timing.sgl`) checks all eight channels'
compiled note triggers against exact rational row timing, preserves legitimate
portamento semantics, and validates the final jump. Full trigger counts are
1,253 / 3,156 / 5,495 for Shadow / Dirty / Breach respectively. All three full
sources and all six standalone loops pass, with at most one sample of rounding
error. All sources validate and round-trip canonically. The older dance-grid
audit keeps its original scope because these legacy clocks differ.

Full WAV peak/RMS values are -3.01/-21.16, -1.15/-16.12 and -2.50/-18.53 dBFS
respectively, with zero saturated samples. The tense regions' full-render RMS
levels rise by 0.39, 0.30 and 0.65 dB relative to calm. These are average level
measurements, not perceptual loudness or proof of an appropriate tension level.
Listening feedback remains necessary. OGGs decode cleanly at stereo 44.1 kHz,
match WAV durations, and receive title/album tags without changing decoded PCM.
Region measurements, standalone-loop measurements and checksums accompany the
artifact package. In-game switching and repeated live playback are still to be
checked in crash-the-stack; compiled loop checks do not substitute for that.
All six separately rendered loop WAVs also have zero saturated samples, and
their OGGs decode cleanly with matching durations.

## Reproduction and ownership

```sh
sigil docs/music/arrange-legacy.sgl
sigil docs/music/tools/adaptive-timing.sgl
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks shadow-protocol-adaptive dirty-cache-adaptive breach-vector-adaptive \
  --format both
```

Add `--full-only` to the render command when only full auditions are needed.
The authoring helper refuses to replace an existing differing arrangement.
The full and loop WAVs, OGGs under `ogg/`, source snapshots, exact render
commands, timing audits and measurements live in the established Ops artifact
folder. These sources and helpers are game collateral intended for the eventual
crash-the-stack handoff. No synth-engine changes were necessary for this pass.
