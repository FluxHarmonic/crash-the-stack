# Album pilot I — 2026-09-21

Two complete listening arrangements, awaiting David's feedback. These are before
final album mastering: accepted score bus processing plus modest clean gain,
without added mastering compression or limiting. Separate controlled candidates
remain private comparison artifacts, not the files sent for composition review.

## Quiet Array — 4:05.217

An exposed four-bar entrance establishes the chords before the accepted ceramic
pulse arrives. All four calm and four focused phrases remain. A new eight-bar
bridge opens up the harmony, then the original transition leads into the focused
material. The calm resolution returns at reduced percussion level, followed by
a composed B-minor / C#-minor / F#-minor cadence and natural decay.

| Time | Listening landmark |
|---|---|
| 0:00 | Harmony before pulse |
| 0:10 | Calm material begins |
| 1:34 | New exposed harmonic bridge |
| 1:55 | Ceramic transition |
| 2:05 | Focused material begins |
| 3:29 | Calm reprise |
| 3:50 | Composed cadence |
| 4:00 | Explicit release-tail pattern |

The exact section map is quiet-array-map.json. Accepted patches and mallet
attacks are preserved. The original D/A/C# open voicing remains intact. New
bridge notes are composed responses, not blank repetitions to reach a duration.

## Black Glass — 4:24.000

Opens directly with the accepted title ignition, hook and tracker-chord gesture.
The game's low-pressure groove provides space between theme statements. The
middle moves through the lower-register title bridge, a new exposed F-minor /
Bb-minor / C-minor passage and distant theme fragments before rebuilding.

The second half develops the accepted gritty rhythms at the title's quieter
balance, returns to the FM hook with an opening percussion reduction, then
recedes into an F-minor coda. Rapid tracker chords remain occasional accents;
the rejected melodic arpeggio flourishes have not returned.

| Time | Listening landmark |
|---|---|
| 0:00 | Title ignition; groove and hook immediately |
| 0:21 | Low-pressure groove |
| 0:48 | Grit answers, then theme development |
| 1:15 | Lower-register bridge |
| 1:29 | New exposed harmonic passage |
| 1:43 | Distant theme fragments |
| 1:57 | Pulse rebuild |
| 2:10 | Lift with tracker pickup |
| 2:17 | Focused theme return |
| 2:45 | Further rhythmic development |
| 3:12 | Final theme return |
| 3:39 | Release and recession |
| 4:07 | FM coda |
| 4:21 | Explicit release-tail pattern |

The exact section map is black-glass-map.json. Grit imported from the game is
scaled by 0.63, matching the title balance David preferred. The title's native
0xy tracker cycling is retained without extra envelope retriggers.

## Verification and evidence

- Both sources pass native canonicalization, validation and finite compilation.
  Recomposing into a temporary directory reproduced both committed CTS files.
- Quiet Array: 840 compiled attacks. Black Glass: 2,327. Maximum sample-clock
  error is zero for both. These arrangements have no off-sixteenth note attacks;
  Quiet Array mallet and bell attacks remain on eighth-note grid positions.
- Maximum voices per channel: Quiet Array 6, Black Glass 6; both below the limit
  of 8. All final gates are released, with two dedicated tail bars and no Bxx,
  Dxx or Fxx playback-control effects.
- Full WAV, FLAC and OGG durations match the scores within one sample. FLAC
  decoded PCM equals the clean WAV exactly. Clean WAV and decoded OGG true peaks
  stay below the -1 dBTP review ceiling. Final-second audio is below -70 dBFS.
- The controlled candidates were attenuated by 1.9 dB (Black Glass) and 2 dB
  (Quiet Array) for matched-loudness comparison. No listening preference is
  claimed from these measurements.
- Game assets, src/ and package.sgl remain unchanged. No audio/build output is
  committed. No game-phrase backport is proposed at this point.

All raw evidence and audio: ~/artifacts/crash-the-stack-album/pilot-i/.
The directory includes native WAVs, clean WAV/FLAC, full OGGs in ogg/, controlled
and matched comparisons, source snapshots and hashes, command manifests, score
and render audit JSON, loudness/peak logs, probes, and Telegram receipts.

The authoring WAV path is currently 16-bit; these are not high-resolution release
masters. See MASTERING.md for the confirmed limiter/export findings and proposed
engine work. Native files retain conservative tails: below -70 dBFS for roughly
5.5 seconds at Quiet Array's end and 2.4 seconds at Black Glass's end. Final album
spacing should trim excess silence after the natural decay, preserving the raw
renders and score tails for future editing.

David's listening review should determine whether the new bridges sustain
interest, Black Glass's final return earns its length, and Quiet Array's calm
reprise gives it a satisfying ending. Technical checks cannot answer those
musical questions. Remaining thirteen arrangements follow after pilot feedback.

Telegram acknowledged both full clean-gain OGG auditions: Black Glass message
1110 and Quiet Array message 1111. The matched comparisons measure -17.3 and
-20.1 LUFS respectively, matching the clean versions to the meter's 0.1 LU
reporting precision. Only the clean versions were sent.
