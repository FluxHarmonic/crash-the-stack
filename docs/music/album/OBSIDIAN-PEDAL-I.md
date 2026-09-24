# Obsidian Index: pedal texture audition

David preferred the original melody to Glass Answer I because it sounded more
mysterious. He authorized the next test of subtle pedal texture. Preserve the
original notes and their spaces, the accepted Waves IV pedal core, and the
side-pad balance.

This comparison uses the first calm phrase: shared phrase 0, album pattern 1,
from 0:11.429–0:34.286. Each half contains eight musical bars and two release
bars. Original starts at 0:00; candidate at 0:28.571; total is 57.143 seconds.
There is no late melodic replacement in this clip: the candidate texture is
present from its first bass note.

Only the existing additive FM layer of triangle-tide changes. Its third-harmonic
pair rises more slowly and has a little more level relative to the untouched
octave pair. The intent is a changing upper tone over the same low pulse.

| Parameter | Original | Candidate |
|---|---|---|
| Operator 3: ratio, level, attack, decay, sustain, release | 3, .25, .012, .25, .65, .055 | 3, .38, .06, .4, .5, .055 |
| Operator 4: ratio, level, attack, decay, sustain, release | 3.018, .2, .012, .25, .65, .055 | 3.03, .32, .12, .4, .45, .055 |
| Upper-layer chorus rate | .24 Hz | .17 Hz |
| Upper-layer chorus depth | 4 ms | 5 ms |

The triangle patch, operators 1/2, upper-layer output envelope, chorus mix,
layer gain, instrument volume and routing remain exact. Every other instrument,
including the side pads, glass, lower replies and percussion, is unchanged.
No new voice is added and no master-bus setting changes. The slower upper
attacks are intentional; the original bass core still provides the beat onset.
The tense pedal is not altered in this first calm-context experiment.

The composer uses the documented operator tuple and fm4-pad chorus parameters
from Motif's synth implementation and Sigil DSP. It verifies that the canonical
renderer preserves the new patch and that the two scores differ only in their
instrument bank. Notes, clock, arrangement and bus remain identical. The
candidate's compiled audit passes 79 attacks with zero samples of clock error,
paired pad roots/releases and all final gates released.

```sh
sigil docs/music/tools/obsidian-pedal-audition.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/obsidian-pedal-scores
sigil docs/music/tools/short-ab-render.sgl \
  --motif "$PWD/build/dev/bin/motif" \
  --input /tmp/obsidian-pedal-scores --output /tmp/obsidian-pedal-audio
```

Use --source FILE with the frozen source-album.cts to reproduce the audition
later. External scores, audio, maps, source snapshot and reports use the public
artifact alias ~/artifacts/crash-the-stack-album/: obsidian-pedal-i/ and
obsidian-pedal-i-audio/. The maintained game and album arrangements are unchanged.

## Delivery checks

Original and candidate native halves both measure -23.4 LUFS-I; peaks are -6.3
and -6.2 dBTP. The comparison uses a common -0.5 dB gain with no added limiter
or compressor. Encoded audio measures -23.8 LUFS-I and -6.7 dBTP, with a final
second peak of -91 dBFS. Stereo 44.1 kHz and 57.143-second duration checks pass.

Telegram acknowledged obsidian-pedal-texture-i-ab.ogg as message 1215. The named
delivery file is a hard link to comparison.ogg, avoiding duplicate audio storage.
The patch change was not adopted; see the final listening decision below. Keep
the rejected Glass Answer I melody out of this and any subsequent candidate.

## Feedback and isolated diagnostic

David could not hear a difference in the full-mix comparison. Do not treat the
candidate as an improvement or adopt it on the basis of changed parameters.
The native renders differ: over the 22.857-second musical passage their RMS
levels differ by about -0.026 dB. The difference signal is -41.57 dBFS RMS,
17.15 dB below the original mix RMS. These measurements include phase changes;
they prove different output, not a perceptually useful change or masking.

The follow-up isolates the exact same pedal patches on channel 4 for the first
four calm bars, followed by two release bars. No stronger patch is substituted.
Use obsidian-pedal-audition.sgl --exposed with the original frozen source, then
short-ab-render.sgl --gain 6 for a common listening boost. The renderer caps
that requested gain to maintain its native peak margin and still checks the
encoded true peak and final decay. Its default remains -0.5 dB for normal A/Bs.
Original starts at 0:00; candidate at 0:17.143; total is 34.286 seconds.

This is a diagnostic with the accompaniment muted equally, not a proposed bass
level for the song. The low triangle core and its attacks remain exact; the
candidate only changes the existing upper layer as before. Keep the accepted
song unchanged. Audition artifacts use the public aliases obsidian-pedal-alone-i/
and obsidian-pedal-alone-i-audio/ under the same external album artifact root.

The isolated banks match the preceding full-mix banks exactly. Six bass attacks
pass the compiled audit with zero samples of clock error and all final gates
released. Native halves both measure -25.7 LUFS-I/-15.9 dBTP. The full +6 dB
monitoring boost fits the peak margin; encoded audio is -19.7 LUFS-I/-9.7 dBTP,
with its final second at -91 dBFS. Stereo 44.1 kHz and duration checks pass.
Telegram acknowledged the 34.286-second diagnostic as message 1216.

## Final listening decision

David could not hear a difference even in the isolated, equally boosted A/B.
Close this experiment without adoption. Retain the original pedal patch and
original melody in both game and album arrangements; neither maintained score
was changed during these auditions. Obsidian needs no further change from this
pass, and its published album version remains the accepted reference.

The lesson is to distinguish different sample values from a meaningful audible
change. Neither measurements nor repeated isolation justify adopting a patch
that provides no audible benefit to the listener. Do not repeat this comparison
or escalate its effect without a new musical reason.
