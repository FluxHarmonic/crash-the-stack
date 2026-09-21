# Glass Current and Basement Circuit: tense voice balance

David liked Glass Current's new drums, requested a further reduction of its
noise swell, and wanted the bassy tense synth to stand out slightly with more
character. He also asked for Basement Circuit's ending bassy voice to sit back
slightly, clarifying that he meant the buzzy acid line. These separate versions
preserve the approved drums and all earlier auditions.

## Glass Current / Paper Kit II

Source: `docs/music/alternates/glass-current/glass-current-paper-kit-v2.cts`.

The target is instrument 5, the detuned Reese bass on channel 4 that enters
with the tense section at 83.721 seconds. Open its low-pass from 650 to 900 Hz,
raise drive from 0.4 to 0.48 and resonance from 0.25 to 0.28. Increase its
subtle frequency-modulation index from 0.002 to 0.003 and slow index motion from
0.0015 to 0.0025. Keep the original spread, motion rate and envelope so its
phrasing and entry remain familiar. The intent is a little more midrange
texture and motion without turning it into a foreground lead.

Raise its 272 explicit note levels from 36/39 to 39/42 (about 0.6–0.7 dB),
and the default from 39 to 42. This affects only the tense Reese. The calm
sub-bass, melody, pads, pluck, lead and all percussion remain unchanged.

Lower instrument 20's source amplitude from 0.3 to 0.2, another 3.52 dB
before bus processing. This applies consistently to the calm exit, main fill
and tense turnaround. Retain its envelope, filters and reverb send.

## Basement Circuit / Signal Kit IV

Source: `docs/music/alternates/basement-circuit/basement-circuit-signal-kit-v4.cts`.

Lower only the tense acid line on channel 6, from its entry at 85.161 seconds.
Across the three filter variants, note levels 27/30/33/45 become 24/27/30/41,
a reduction of about 0.8–1.0 dB across 600 note cells. Apply the same mapping
to slide notes and reduce instrument defaults from 29 to 26. All acid patch settings, filter
variant choices and slide effects remain. Since the acid filter responds to
velocity, the reduced accents also soften its filter peaks slightly.

Retain the approved snare, the Signal Kit III swell reduction, the deep bass
pulse and every other voice. No pitches, onsets, gates, effects, order entries
or section boundaries change in either track. Both buses remain untouched.

## Reproduction

```sh
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks glass-current-paper-kit-v2 basement-circuit-signal-kit-v4 --format both
sigil docs/music/tools/timing.sgl --motif "$MOTIF_BIN" \
  --tracks glass-current-paper-kit-v2 basement-circuit-signal-kit-v4
```

Full and standalone calm/tense WAV/OGG exports accompany the sources; only
full tracks are delivered to Telegram. David liked the changes in both tracks
and considers them done for now. Keep Paper Kit II and Signal Kit IV as the
accepted references; no further refinements unless requested. Game ownership
and the pending repository migration remain as recorded in HANDOFF.md.

## Validation

All six sources pass validation and canonical printing. Compiled comparisons
preserve every channel's timestamps, frequencies, gates, triggers and durations,
allowing only Glass channel 4 and Basement channel 6 volume changes. All other
channel tables match byte-for-byte. The full grid audits retain 3,011 Glass
Current triggers and 2,531 Basement triggers, zero sample-clock error, and
four intentional off-sixteenth roll hits each. Voice allocations are unchanged.

Glass Current's full WAV is PCM-identical to Paper Kit I up to the first swell
at 76.744195 seconds; Basement's full WAV matches III until the tense entry at
85.161293 seconds. Audio differs after those points. Basement's standalone
calm WAV is also PCM-identical to III. The first tense pattern's overall mix
RMS changes by +0.103 dB in Glass and -0.026 dB in Basement; these are local
voice adjustments, with little change to the overall playback level.

All six WAVs contain zero saturated samples, and all six OGGs decode cleanly
at stereo 44.1 kHz with matching durations. Stream-copy title tagging preserves
decoded PCM. Full peak/RMS are -2.65/-17.54 dBFS for Glass Current and
-2.39/-17.32 dBFS for Basement. Full durations remain 161.860476 and 162.580612
seconds. Source snapshots, exact commands, timing/source/audio comparison
records, level measurements and SHA256 checksums accompany the exports.
