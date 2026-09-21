# Mode tracks and legacy soundtrack variations

David requested Sector Drift and Closed Loop as the next two mode tracks,
then clarified that the older tracks to assess were Spy, Groove and Breaker.
He authorized separate variations where needed to fit the emerging sound.
All five auditions use title-based filenames and include the complete track.

## Two new compositions

| Track | Intended role | Tempo / key | Order layout | Duration |
| --- | --- | --- | --- | --- |
| Sector Drift | Reflective Defrag / Klondike background | 100 BPM, G minor | calm 0–3, transition 4, focused 5–8; B05 | 163.2 s |
| Closed Loop | Circuit-wiring background | 120 BPM, B minor | calm 0–4, transition 5, focused 6–10; B06 | 168 s |

Sector Drift uses a broken beat, rounded sub, minor tine chords and a complete
reflective melody. Its darker G/C/G/D minor movement keeps the wistful touch
without a major-chord lift. In the focused variation, a soft bell answers the
pluck instead of adding a loud lead. Four eight-bar variants change responses,
reduce drums briefly and return to the groove.

Closed Loop has syncopated kicks and a B pedal. Two short signals occupy
different subdivisions and together form the hook; the focused section joins
more of the responses and changes the main pluck to a restrained resonant
saw pulse. It has five eight-bar variants, including a short drum reduction.
Neither new track uses a thirty-second roll: each four-bar transition has
restrained percussion and a breath before the focused region.

Channels 1–8 are kick, snare, closed/open hat, sub, minor triad, main signal,
answer bell and relay tap. Lifetime voices are 1/1/2/1/3/1/1/1 for Sector Drift
and 1/1/2/1/3/2/1/1 for Closed Loop. Every onset is on the straight sixteenth
grid; their melodic signals are on eighths. Sector Drift's 1,054 triggers have
zero sample-clock error; Closed Loop's 1,686 have at most one sample of rounding
difference. Both sources validate and round-trip canonically.

Full WAV peaks/RMS are -5.08/-21.47 dBFS for Sector Drift and -2.43/-19.79 dBFS
for Closed Loop, with no saturated PCM samples. Both native OGGs decode cleanly
at stereo 44.1 kHz. Sector Drift's WAV is one sample shorter than its compiled
duration due to the existing duration rounding; Closed Loop is exactly 168 s.
Title/album tags were added by stream copy, with decoded PCM verified identical.

David called Sector Drift excellent and Closed Loop great after listening.
Keep these versions as references. He also correctly identified the shared
kick/snare/noise-hat palette. Future kit alternatives could use a woody rim
and dusty brushed hats for Sector Drift, and a shorter kick, dry electronic
clap and metallic ticks for Closed Loop. Preserve the approved arrangements
and audition any kit changes separately; none of those alternatives is part
of the current files.

## The older three are usable compositions

All three original files validate and compile. This assessment is based on
their written arrangements and synth/mix settings, not a claim of a new
listening audition or in-game test. They have complete phrases, instrumental
identities and intro/loop structures. Their denser chip voices and brighter
mixes are the main reason to try alternative treatments alongside the newer
soundtrack. Preserve the originals for comparison.

| Original | Separate variation | Role and treatment |
| --- | --- | --- |
| Spy | Shadow Protocol | Alternate stealth: smoother FM bass, filtered FM signal in place of the pulse, lower vibes and less diffuse pad/reverb. Keep the bass ostinato and all melodic phrases. |
| Groove | Dirty Cache | Funkier Defrag/background alternative: retain the D Dorian bass, ghost notes, slides, sub layer and reed hook; use softer hats/FM chord stabs and a narrower filter-opening range. |
| Breaker | Breach Vector | Action/rhythm candidate: retain the complete riff, pipe melody, bends and fast percussion pattern; use a driven resonant saw riff, softer hats and more controlled lead/snare levels. |

These are variations, not three additional compositions. Spy's vibes move
down one octave with their complete contour intact. All other written pitches
remain unchanged. Every note placement, gate, effect, pattern length and order
is retained. No phrase is removed. The original clocks (including Breaker's
speed 4) are retained rather than forced onto the newer tunes' grid.

Explicit accent volumes and instrument default volumes are reduced together:
some old slide/empty-note rows reload an instrument default, so adjusting only
the note accents would make the lead jump up mid-phrase. The legacy audit
compares source events and compiled pitch/gate edges, triggers and note
durations to the originals. Volume-only table rows are ignored because rounded
accent levels can become equal and coalesce; actual musical event times must
match exactly. Voice counts remain within the original budgets.

These older arrangements have intros and B01 loops, not distinct calm/fill/tense
sections. The renderer requires `--full-only` for their new variations to avoid
inventing section exports. The first auditions received positive feedback;
see [REVISIONS.md](REVISIONS.md) for the accepted Shadow Protocol reference
and subsequent Dirty Cache and Breach Vector revisions requested after listening.

All three pass the legacy event audit: Shadow Protocol has 1,159 compiled
triggers, Dirty Cache 3,130 and Breach Vector 5,408. Compiled musical edge times
match the originals exactly. Full-only enforcement was checked with a rejected
section-export request before any output directory was created.

The full WAVs now have no saturated PCM samples: Shadow Protocol peaks at
-3.04 dBFS (RMS -21.36), Dirty Cache at -1.52 dBFS (RMS -16.14), and Breach
Vector at -1.96 dBFS (RMS -18.51). Breach Vector's first render had two clipped
samples and a float peak of 1.00473; reducing bus makeup from +1 to -1 dB fixed
the overshoot in the final render. Its float scan found no NaN. All three
final OGGs decode cleanly at stereo 44.1 kHz and match their WAV durations.
Title/album tagging preserves decoded PCM. The mixes retain their different
energy levels; a later game/album balancing pass remains separate.

## Reproduction

```sh
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks sector-drift closed-loop --full-only --format both
sigil docs/music/tools/timing.sgl --tracks sector-drift closed-loop
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks shadow-protocol dirty-cache breach-vector --full-only --format both
sigil docs/music/tools/legacy.sgl
```

The full OGGs are in the output's `ogg/` subfolder. Renders are not normalized.
Vorbis tags may be added without audio re-encoding using `ffmpeg -c:a copy`
with `TITLE` set to the tune name and `ALBUM` to `Crash The Stack`.

## Count and selection

At this pass there were eleven distinct compositions: eight from this content session,
plus Spy, Groove and Breaker. Their alternative versions are not counted again.
The four remaining proposed concepts (Quiet Array, Dead Sector, Obsidian Index,
Clock Edge) would bring that to fifteen if the three legacy pieces are retained,
or twelve if the album selection contains only the newer compositions. They
were proposed, not yet written or automatically authorized by that count.
David subsequently approved Quiet Array and Dead Sector; their complete
first auditions bring the pool to thirteen. See [PUZZLE-PAIR.md](PUZZLE-PAIR.md).
David accepted that pair; Obsidian Index and Clock Edge subsequently received
complete first auditions, bringing the pool to fifteen. See [FINAL-PAIR.md](FINAL-PAIR.md)
and [ALBUM-PLAN.md](ALBUM-PLAN.md) for the last pair and proposed listening album.

A coherent 12–15-track selection is realistic. Choose final versions by
musical role and listening feedback; later check relative levels, loop behavior
and headroom for game effects in crash-the-stack before treating it as a
finished game soundtrack or mastered album.
