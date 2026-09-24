# Clock Edge: approved phrase and mix integration

The shared source now carries the lead development approved through Expression
VIII, the exact original bell line, and the B4 unison accent. Both calm and
tense lead instruments gain 2 dB; the bell is reduced 1.5 dB. The clap, synth
patches, routing and bus retain their original character.

Only shared phrase 9 receives new notes. Its album placement is 2:30–2:45,
with the unison at 2:42.65625. The first two bars preserve the established hook.
The answer stays in the lead register, resolves to D-sharp4, and releases at
the final row before the next phrase begins on D-sharp4. The preceding phrase
also releases its last lead note before this passage. The original bell
rhythm and pitches are preserved throughout.

Game and album outputs are regenerated from the approved shared pool, with the
same gains throughout. Exact comparisons confirm both maintained outputs match
the approved candidates. The game retains calm: 0, fill: 5, tense: 6 and its
B06 tense loop. The album remains finite at 213.75 seconds with its release tail.

Validation:

- All sixteen shared songs pass regeneration; tracker edits remain protected.
- Album: 2,126 attacks, zero samples of clock error, all final gates released.
- Game: 1,733 triggers, zero samples of clock error, correct tense-loop return.
- Full native mix: -20.3 LUFS-I, -5.6 dBTP.
- Full OGG: stereo 44.1 kHz, 213.75 seconds, -20.3 LUFS-I, -5.7 dBTP.
- Final second of native audio peaks at -91 dBFS.

The transition review above is score-based. David subsequently approved the
full composition and mix, and authorized mastering and republication.

The full listening render and reproducible commands are in the artifacts
directory, publicly referenced as ~/artifacts/crash-the-stack-album/clock-edge-polish-i/.
The render uses the native mix without additional mastering gain or limiting.
The unmastered full render was the approval reference for the release below.

Process: approve the phrase in a short excerpt, verify the exact source changes,
regenerate both maintained arrangements, inspect neighboring entries/releases,
audit both playback forms, then render the full track and measure the encoded
audio and ending. Timing checks do not replace listening for harmonic clashes
or mix balance. Keep further audition scores and measurements outside Git.

Telegram acknowledged delivery of the full OGG as message 1207.


## Approved release

Retain the previous +3 dB album lift and oversampled safety limiter. Master WAV
is -17.3 LUFS-I, -2.6 dBTP and 4.6 LU LRA; OGG is -17.3 LUFS-I/-2.5 dBTP.
WAV/FLAC decoded PCM matches, all durations pass, and the final master second
peaks at -90.3 dBFS. Tagged MP3 is -17.3 LUFS-I/-2.7 dBTP.

The MP3 retains David Wilson artist credit, track 14/15, the soundtrack album
title, CC BY 4.0 metadata and the compact attached cover. Export selection now
uses this approved master.

R2 object soundtrack/clock-album-ii/clock-edge.mp3 was confirmed unused before
upload. Public bytes match the 7,038,801-byte export, SHA-256
7559d5da33d5133764d96713e2d27149eb0327fbf4785452f917dc714ff010a9.
MIME, CORS and HTTP 206 byte-range checks pass. The player uses the revision
query ?v=7559d5da33d5 to avoid stale cached responses.

Deployment 33c8d536 publishes source 652449f, preserving production aed35810.
Every current site file is retained; only Clock Edge's URL changes in the
fifteen-track manifest. Pages uploaded one file and reused 76.
The game's synchronized score ships through the next normal game deployment.

Release evidence is external: clock-edge-polish-i/ (masters), clock-ii-mp3/
(tagged export), r2-clock-ii/ (upload and HTTP checks), publication-clock-ii/
(preserved site and publication checks), under ~/artifacts/crash-the-stack-album/.


The live manifest matches the staged release. A fresh muted browser played the
updated Clock Edge past one second without an audio error, showed the expected
David Wilson/album metadata and retained all fifteen tracks. Playback was paused
after verification. This is a functional check, not a listening assessment.
Telegram delivered the full master as message 1208.

Clock Edge is complete for this pass. Continue to use releases.tsv to preserve
this selection in subsequent site builds.
