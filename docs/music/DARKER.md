# Darker auditions

David liked the revised timing but found Relay Ghost and Glass Current too
upbeat for the hacker game. These auditions favor minor pedal harmony, lower
registers and space between melodic phrases. A little wistfulness remains.
The original three sources and their timing-v2 renders remain available.

## New compositions

| Source | Character | Calm / fill / tense orders | Duration |
| --- | --- | --- | --- |
| `docs/music/alternates/black-glass/black-glass.cts` | F minor, 140 BPM half-time dubstep | 0–5 / 6 / 7–12, `B07` | 171.43 s |
| `docs/music/alternates/cold-boot/cold-boot.cts` | C minor, 132 BPM hypnotic techno | 0–4 / 5 / 6–10, `B06` | 152.73 s |

Black Glass keeps its main snare on beat three in both regions. Long sub notes,
short low reese responses and occasional descending Ab–G–F bell fragments leave
space in the calm region. The tense region uses rhythmically gated, resonant
bass answers, varying between long pressure notes and clipped sixteenths.
Eight-bar variants include drum reductions, altered answers and a short gap
before the tense loop returns. There is no major-chord progression.

Cold Boot keeps four-on-the-floor kicks under a C pedal, short offbeat sub gates
and a low repeating synth figure. Minor stabs occasionally replace their fifth
with a tritone. Eb, Bb and rare Db answers add friction; bell phrases are sparse.
The tense region adds sixteenth percussion, opens the pulse's filter envelope
and uses brief drum drops. Its energy comes from repetition and timbre rather
than an ascending melody or bright chord changes.

Both use the existing synth bank. Black Glass's bass movement comes from
note-triggered filter envelopes and explicit cutoff variants, not a free-running
wobble LFO or continuous automation. No new engine feature was needed for these
arrangements. Their embedded, named instruments can be copied into other tunes.

| Channel | Black Glass (allocated voices) | Cold Boot (allocated voices) |
| --- | --- | --- |
| 1 | deep kick (1) | deep kick (1) |
| 2 | weighted snare / ghosts / roll (1) | dry clap / snare roll (2) |
| 3 | closed / open dust hats (2) | closed / open dust hats (2) |
| 4 | sustained sine sub (1) | short gated sine sub (1) |
| 5 | minor stab triad (3) | minor / diminished stab triads (6) |
| 6 | low reese / three pressure bass presets (4) | three pressure pulse presets (3) |
| 7 | distant bell (1) | distant bell (1) |
| 8 | metallic click / fill noise swell (2) | metallic click / fill noise swell (2) |

The timing audit checks every compiled trigger against the rational sample
clock, plus the sixteenth grid, eighth-note bell phrases and intended snare
backbeats. Both retain exactly four off-sixteenth snare hits in the final
thirty-second roll. Black Glass has 1,832 triggers with at most one sample of
rounding difference (23 microseconds); Cold Boot has 1,851 with zero difference.
Sources round-trip byte-identically through Motif's printer and compile within
the eight-voice budget on every channel.

Full WAV measurements: Black Glass peaks at -3.09 dBFS (RMS -19.49 dBFS),
Cold Boot at -2.27 dBFS (RMS -18.35 dBFS). Neither has saturated PCM samples.
Both native OGGs decode cleanly at 44.1 kHz stereo with matching durations.
Black Glass's WAV is one sample shorter than the compiled duration because of
the existing floating-point duration-to-frame conversion, not a musical edit.
Full floating-point scans of both tracks found no NaN. David's first listening
response to Black Glass identified its dark mood and solid rhythm as a strong
fit for the game. Preserve this version as a reference; any future wobble-bass
experiment should be a separate alternative.
David also approved Cold Boot's thumping kick/bass groove and unobtrusive sound;
those are useful references for future background arrangements.

Reproduce full WAVs and native Vorbis OGGs, with fills:

```sh
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks black-glass cold-boot --full-only --format both
sigil docs/music/tools/timing.sgl --tracks black-glass cold-boot
```

OGGs go in the output's `ogg/` subfolder. Technical checks cannot establish
whether the mood and balance work in the game; that remains the listening pass.

## Separate After Dark variations

These are separate `*-dark.cts` files. The original `liquid.cts`,
`acid-house.cts` and `electro.cts` remain byte-for-byte unchanged, as do all
earlier delivered audio files. Every drum cell in channels 1–3 is identical to
the timing-v2 source, including ghost-note velocities and the complete fill.
Tempo, pattern lengths, order and loop destinations are also unchanged.

| Source | Musical experiment |
| --- | --- |
| `docs/music/alternates/glass-current/liquid-dark.cts` | Replace the D minor / Bb major / F major / C major rotation with D minor / G minor / D minor / A minor. Lower the pads and melodic voices, soften the pluck and lead, and leave gaps between their phrases. Keep the rolling bass rhythm and corrected drums. |
| `docs/music/alternates/relay-ghost/electro-dark.cts` | Use E minor / E minor / A minor / B minor with lower bass and chord voicings. Replace the frequent high bell hook with occasional lower descending answers; reduce pluck activity and use minor arpeggios. Preserve the break and bass articulation. |
| `docs/music/alternates/basement-circuit/acid-house-dark.cts` | A lighter revision: lower chord voicings, open fifths in place of major triads, a softer lower pluck and fewer bells. The entire bass part and tense acid line—including every slide, accent and note—remain identical. |

Minor harmony is maintained across variant orderings of these progressions.
All retained notes keep their original row positions and release cells; no
drum or bass onset was moved. The changes remove 114 melodic onsets from liquid,
282 from electro and 22 from house, leaving more space around their grooves.
The house acid timbre and its three cutoff variants are unchanged.

```sh
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks liquid-dark acid-house-dark electro-dark --full-only --format both
sigil docs/music/tools/timing.sgl \
  --tracks liquid-dark acid-house-dark electro-dark
```

All three variations pass the timing audit with zero sample-clock error:
2,960 compiled triggers for liquid, 2,478 for house (116 legato slides), and
2,241 for electro. All three full OGGs decode cleanly with matching durations
at 44.1 kHz stereo. WAVs have no saturated samples: liquid peaks at -1.99 dBFS,
house at -2.25 dBFS, electro at -1.45 dBFS. Their RMS levels are -17.10,
-17.28 and -17.73 dBFS respectively. Telegram acknowledged all three files.

## Black Glass / Grit

David requested a nastier tense lead after hearing Black Glass. The separate
`docs/music/alternates/black-glass/black-glass-grit.cts` layers driven, crushed FM bass with the resonant
saw for the tense lead. Two grit settings vary the FM bite and filter opening;
the louder layered voice uses slightly lower tracker volumes. No wobble LFO
was added in this pass.

The original remains unchanged. The entire calm region and fill, every drum
and sub event, and all lead pitches and gate timings match the original.
Channel 6 now allocates eight voices across the complete tune, exactly the
limit; other channel budgets are unchanged. Its 1,832 triggers pass the same
one-sample maximum rounding check as the original. The float scan finds no
NaN, the WAV has no saturated samples (peak -2.26, RMS -18.98 dBFS), and the
native full OGG decodes cleanly with matching duration.
The rendered calm-and-fill PCM prefix is byte-identical to the original.
Telegram acknowledged the full Grit OGG.

```sh
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks black-glass-grit --full-only --format both
```

## Blind Spot: stealth overworld audition

`docs/music/alternates/blind-spot/blind-spot.cts` is a separate alternative to `spy.cts`, which remains
unchanged. It uses D minor at 96 BPM, with a low pulse, soft kick, muted rim,
quiet ticks and a three-note signal spread across several bars. Minor dyads
and occasional low room tone provide tension without a continuous pad bed or
prominent lead. The muted signals stay around A3–F4. Eight-bar variants change
answers and briefly reduce percussion while the low pulse maintains direction.

Calm is order 0–3 (32 bars, 80 seconds); order 4 is a four-bar quiet transition
(10 seconds); the watchful tense variation is 5–8 (32 bars, 80 seconds), with
`B05` returning to its start. The full audition lasts 170 seconds. The transition
ends with a quiet beat instead of a roll or riser. The tense variation increases
the pulse and percussion activity without a large volume jump or new lead.

Channels 1–8 are soft kick, muted rim, cloth tick, sine sub, minor dyad, muted
signal, low room tone and short metallic latch respectively. Each allocates
one voice except the two-voice dyad. All attacks intended as rhythmic anchors
are short; the room tone is deliberately slower. Every onset uses the straight
sixteenth grid, with melodic signals on eighths. The audit expects no odd-row
fill hits for this track and checks the rim's beat-three anchor at its quieter
accent level.

```sh
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks blind-spot --full-only --format both
sigil docs/music/tools/timing.sgl --tracks blind-spot
```

Blind Spot's 624 compiled triggers pass with at most one sample of rounding
difference. A negative control with a displaced rim hit is rejected by the
audit. Its full float scan finds no NaN; the stereo 44.1 kHz WAV has no saturated
samples, with peak -6.65 dBFS and RMS -24.32 dBFS. This intentionally quieter
mix is not normalized up to the dance tracks. The 170-second native OGG decodes
cleanly and matches the WAV duration.

## Authoring follow-up

The next melodic refinement is documented in [PHRASES.md](PHRASES.md): separate
After Dark II versions restore complete calls and answers while retaining the
darker harmony and corrected rhythm.

The authoring script expanded explicitly chosen musical phrases into tracker
rows and checked cell collisions; the resulting `.cts` files are the editable
source of truth and have no Python runtime dependency. David suggested a Sigil
authoring script using Motif's own tune model and printer. This is a useful
follow-up, deferred in favor of completing the current musical auditions.
