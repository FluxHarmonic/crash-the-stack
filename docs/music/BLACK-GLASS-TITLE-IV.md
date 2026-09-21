# Black Glass / Main Theme IV

David confirmed that the intended old-school sound is a rapidly cycling
tracker chord and explicitly requested it. `docs/music/alternates/black-glass/black-glass-title-v4.cts`
adds twelve short pulse-wave chord stabs to III. This is a new title audition
awaiting listening feedback, not another composition or an album master.

The restored FM melody, approximately 4 dB quieter chirpy grit, and every
other original event remain unchanged. The stabs occupy gaps between contact
clicks on channel 8. The first arrives at 3.429 seconds; further stabs answer
the hook and its returns. The lower bridge, release and turnaround stay clear.
Eleven stabs last 0.321 seconds before their short release; one lift accent
lasts 0.214 seconds. Keep title I–III for comparison.

## Instrument and harmony

Instrument 31 is a single 25%-width `chip-pulse` voice with 10-bit crushing,
1 ms attack, 220 ms decay, 0.45 sustain and 18 ms release. Note levels range
from 17 to 20. It shares the contact channel's existing pan -0.15/send 0.12;
the first played instrument and therefore routing remain unchanged.

The native `037` effect cycles root, minor third and fifth every tick. At
140 BPM/speed 3 this means 56 pitch steps, or 18.667 complete chords, per
second. Each stab has one envelope attack, followed by held effect rows.
Most imply F minor; one follows the Bb-minor chord, and the lift's `058`
cycles C/F/Ab, an inversion of F minor. No synth-engine change was necessary.
Allocated voices by channel are 1/1/2/1/3/6/2/2, within the eight-voice limit.

## Reproduction and checks

Generate with `compose-black-glass-title.sgl --revision 4`, then render with
`render.sgl --tracks black-glass-title-v4 --format both --motif "$MOTIF_BIN"`.
Full and independent menu-loop sources validate and print canonically.

Source comparison preserves all previous events and instrument definitions.
The seven main compiled channel tables match III exactly. The added channel
audit verifies 210 pitch steps, their frequency ratios and tick positions,
one attack per stab, and all releases. Full/loop trigger audits count
1,310/1,240 with zero sample-clock error. The full B01 arrangement lasts
123.428571 seconds; the independent B00 menu loop lasts 116.571429 seconds.
Actual game-player looping remains a migration verification task.

Full WAV peak/RMS is -3.00/-19.49 dBFS; independent loop is -2.68/-19.48.
Both contain zero saturated samples. In the first stab's 0.321-second window,
the III-to-IV render difference measures -30.05 dBFS RMS against III's
-16.53 dBFS mix RMS. This confirms added output at the expected position;
it is a rendered difference including effects, not an isolated instrument or
a claim about listening preference. David judges its prominence in the mix.

Both OGGs decode cleanly as stereo 44.1 kHz Vorbis with matching durations;
metadata tagging preserves decoded PCM. Retain source snapshots, renderer
and helper hashes, the audit script/results, measurements and a SHA256
manifest with the audio. Send only the complete full OGG for listening.

After this title audition, the intended order is migration into
crash-the-stack, verification there, then finite album arrangements piloted
with Quiet Array and Black Glass. See ALBUM-PLAN.md.
