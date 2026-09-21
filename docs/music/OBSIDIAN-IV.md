# Obsidian Index / Waves IV

David could not hear enough difference between accepted Pedal II and Waves III.
He specifically requested a louder side pad and more apparent bass change.
Treat III as an insufficient texture audition, not an accepted improvement.

David subsequently approves IV's more audible pads: they support the harmonic
content and make Obsidian more distinct from Quiet Array. Keep Waves IV as the
current accepted reference, preserving II's accepted composition and all prior
versions. No further texture changes are requested.

This separate `obsidian-index-v4.cts` keeps III's notes, routing and added pad,
but raises all 32 pad accents from 11 to 18 and its carrier levels about 127%.
Together those changes provide roughly 11.4 dB more pad signal before the bus.
The pad continues to follow the existing chord gates and their 0.4-second
releases; harmony and timing are unchanged.

The original centered triangle bass remains intact. Its added upper layer
rises from gain 0.45 to 0.95. Carrier levels become 0.90/0.80/0.25/0.20,
strengthening the detuned pair; ratios become 2/2.012/3/3.018. The stronger
pair's separation is about 10.4 cents, giving approximately 0.99 Hz beating
on E2. Chorus changes from 0.16 Hz / 3 ms / 0.30 mix to 0.24 Hz / 4 ms /
0.40 mix. These changes target audible moving harmonics above the low core.

All other instrument patches, melodic/drum events, levels, gates, effects,
tempo, section positions and master bus match III. Pattern comparison allows
only the 32 pad level edits. The full and section sources validate and print
canonically, and the grid audit checks the same 788 triggers. Keep II, III and
their exports alongside this comparison. This pass changes no synth engine.

Full duration remains 194.285714 seconds, tense enters at 102.857143 seconds,
and standalone calm/tense exports remain 91.428571 seconds each. Render using
`render.sgl --tracks obsidian-index-v4 --format both --motif "$MOTIF_BIN"`.
Only the full OGG is delivered. David's subsequent feedback confirms that the
pad increase provides the intended audible harmonic support.

All 788 triggers have zero sample-clock error and no off-sixteenth onsets.
Isolating the opening bass phrase measured III's added signal about 19.1 dB
below the original bass; IV brings it to about 10.4 dB below. The original
chord pad measured -49.25 dBFS RMS in that short check, while III's added side
pad was -60.48. The final IV side pad measures -48.87 dBFS RMS in the same
phrase, near the existing chord pad. These are specific isolated signal measurements,
not proof of perceived improvement. See the accompanying presence-check record.

All three final WAVs contain zero saturated samples. Full peak/RMS are
-6.06/-24.72 dBFS, calm -6.29/-24.59 and tense -6.29/-24.67. OGG decode,
stereo 44.1 kHz format, matching duration and tagging-without-PCM-change pass.
