# Pluck timing and riff balance auditions

David noticed Dirty Cache's pluck consistently sounding behind the beat. The
original Groove history explicitly describes sixteenths after the beat, and
channel 7 places its notes on rows 1, 5, 9 and so on at speed 6. At 110 BPM,
this is 136.36 ms after each quarter-note beat. Karplus-Strong's ringing tone
and reverb may affect perception, but this written displacement is deliberate;
it is not evidence of a drifting scheduler or a 136 ms instrument attack.

David requested a full on-beat comparison. `dirty-cache-v3.cts`, titled
**Dirty Cache / III - On Beat**, moves those cells one row earlier to 0, 4, 8
and so on. All 288 compiled pluck attacks land on the quarter-note grid within
one sample of rounding. Pitches, accents, instrument, the revised harmonic
return from II, and the complete arrangement are retained. Every other
channel's compiled table matches II byte-for-byte. II remains the delayed
comparison; III is an audition, not yet an accepted replacement.

David liked Breach Vector II's smoother, less harsh treatment and the more
spacious pluck passages in the middle, but wanted the muted synth riff a
little more audible. `breach-vector-v3.cts`, titled **Breach Vector / III**,
raises channel 5's explicit accents and instrument-default volume by 12 percent,
rounded to tracker levels (default 27 to 30). Its fixed filter, FM patch,
phrases, pads, pluck spacing and other mix settings remain unchanged. All
compiled pitch/gate/attack edges match II, with only channel 5 volume changes;
all seven other compiled channel tables match byte-for-byte.

## Calm and tense direction

These III auditions still use the legacy intro/B01 loop arrangement. The
following is a proposed separate arrangement pass, not implemented sections.
Resolve the timing and balance listening choices before using them as the
basis of that pass. Keep these full-song references alongside any adaptive
arrangements, and continue sending full calm/transition/tense auditions.

| Track | Calm foundation | Tense development |
| --- | --- | --- |
| Dirty Cache | Current bass pocket, corrected harmonic return, chosen pluck placement, quiet reed hook and restrained FM stabs | Keep the bass pocket; develop the filter-opening chord variants, add a complementary reed answer and modest percussion accents. Preserve full phrases and the D-minor-seven return. |
| Breach Vector | Current smooth FM bass, slightly clearer muted riff, low pad breaths and existing spaces in the pluck | Bring the controlled grit bass and pipe response into a sustained region, give the riff a little more harmonic edge and shape the drum fills. Preserve the thump and avoid restoring the distracting opening sweep. |
| Shadow Protocol | Keep the accepted delicate stealth treatment | Add restrained ticking percussion and a more insistent bass pulse with a sparse uneasy answer; retain the background space. |

For Dirty Cache, an initial layout could keep 19 four-bar entries: calm 0–7,
transition 8, tense 9–18 with B09. For Breach Vector, retain 36 64-row entries:
calm 0–15, transition 16, tense 17–35 with B11 (hexadecimal 17). These are
proposed order regions, requiring purpose-built pattern variants; the existing
patterns are not already assigned to these roles. Keep the current tempos and
clocks, make each region independently loopable for gameplay, and audition
phrase-boundary transitions. Tension should come from arrangement and timbre,
with controlled mix levels rather than a large loudness jump.

## Reproduction

```sh
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks dirty-cache-v3 breach-vector-v3 --full-only --format both
```

The full auditions retain II's durations, 165.818186 s and 164.571429 s.
The output package includes the source snapshots, command list, audio levels,
OGGs in `ogg/`, and checksums. Both versions remain subject to listening feedback.

Final WAV peak/RMS: Dirty Cache III -1.22/-16.14 dBFS; Breach Vector III
-2.41/-18.83 dBFS. Neither has saturated PCM samples. Both tagged OGGs decode
cleanly at stereo 44.1 kHz, match the WAV durations, and retain identical
decoded PCM before and after metadata tagging. Sources validate and round-trip
canonically. Previous versions remain unchanged.

## Listening decision and opening-synth clarification

David preferred Dirty Cache III's pluck placement. He initially wondered if it
was too quiet, then liked its distant supporting detail with the rhythm in
focus. Keep this version as the current reference; its patch and volume were
unchanged from II, so the audition varied only placement.

David heard no volume change in Breach Vector's opening wobbly synth. The III
edit targeted instrument 5, the short muted riff entering at 4.57143 seconds,
not instrument 4, the FM bass audible from the beginning. Direct comparison
of the full II/III WAVs confirms their first 201600 stereo frames are identical;
the first differing PCM frame is 201617 (4.571814 seconds). Thus the opening
bass was not brought forward. The identification of his intended voice remains
uncertain; establish which sound he means before another edit. The small riff
level lift is not an accepted resolution of the opening-synth request.
