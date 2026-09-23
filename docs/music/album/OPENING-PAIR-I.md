# Opening pair I — Cold Boot and Relay Ghost

David liked the album-level Black Glass and Quiet Array trials and asked to
continue while he listens for smaller details. Retain their mastering approach
as promising and provisional. Do not revise those accepted compositions while
awaiting further feedback. This pair fills album positions two and three.

## Cold Boot — 3:34.545, 118 bars, 132 BPM

Preserve the accepted Machine Kit II, especially its head-nodding kick/sub
relationship and the integrated C4 transition knock. The eight-bar entrance
assembles the groove in layers. All five calm and five pressure phrases remain,
with a new stripped-down mechanism passage in the calm region and a developed
pressure response later. A final return removes the busy machinery and leaves
a G–Eb–C bell descent over the C-minor pedal.

| Time | Section |
|---|---|
| 0:00 | Kick/sub, then grain, pressure and knock assemble |
| 0:15 | Complete machine theme |
| 0:58 | Exposed mechanism with a new quiet bell answer |
| 1:13 | Groove reassembles |
| 1:42 | Accepted integrated machine fill |
| 1:49 | Pressure section begins |
| 2:33 | New lower-register pressure response |
| 2:47 | Final pressure statements |
| 3:16 | Stripped return and G–Eb–C shutdown |
| 3:31 | Explicit release tail |

The new pressure response dips to G2/Bb2 and resolves to C3 inside the existing
rhythm. Bell replies stay quiet, with the accepted distant-metal patch. No new
instrument, lead flourish or free-running wobble is introduced. The full patch
bank and bus remain identical to the selected game source.

## Relay Ghost — 3:27.273, 114 bars, 132 BPM

Preserve the accepted After Dark II mix and complete melodic phrases. The
four-bar entrance presents the returning E–B–D / F#–E bell before the drums enter.
All five calm and five focused variants remain. A new eight-bar E-minor /
A-minor / B-minor / E-minor bridge passes the phrase between bell and pluck over
sparser harmony. The original transition leads into the focused material.

A calmer reprise restores the bell's original foreground, reduces the drums and
removes the last channel's pressure. The eight-bar coda answers the opening
signal and descends to E3, giving the piece a composed resolution.

| Time | Section |
|---|---|
| 0:00 | Opening bell signal and pluck reflection |
| 0:07 | Full calm arrangement |
| 0:51 | New exposed E–A–B–E signal bridge |
| 1:05 | Calm phrases return |
| 1:35 | Original rising transition |
| 1:42 | Focused material begins |
| 2:55 | Bell reprise as the pressure recedes |
| 3:09 | Final call and answer / E-minor resolution |
| 3:24 | Explicit release tail |

No brighter reharmonization or instrument redesign is added. The accepted
minor chords, complete bell/pluck phrases, percussion and bus are retained.

## Sources, tools and checks

Canonical album scores and exact section maps are adjacent to this document.
Protected references are assets/tunes/cold-boot.cts and relay-ghost.cts. Game
assets, runtime source and package configuration are unchanged. No album phrase
is proposed for game backport at this point.

`album-compose-opening.sgl` builds both arrangements using the new shared
`(crash soundtrack album arrangement)` helpers. It reads the game references,
constructs new phrases and writes canonical finite scores. `album-audit.sgl`
uses explicit per-title grid policy: the original transition at pattern 7 alone
may contain the four off-sixteenth snare hits at rows 121/123/125/127. Bell
onsets, and Relay Ghost's plucks, remain on eighth-note positions.

Compiled audits: Cold Boot 2,368 attacks, Relay Ghost 2,572; maximum timing error
zero samples in both. Every final channel gate is released and both have two
explicit tail bars. The native parser validates both arrangements; recompiling
the composers into a temporary directory must match the committed scores.

`album-batch-render.sgl` separates native synthesis from provisional mastering.
The native stage retains full lossless sources and measurements. The master
stage accepts explicit per-track gain and uses the pilot's gentle oversampled
limiter recipe. It exports WAV/FLAC plus OGG in ogg/, checks all durations,
WAV/FLAC decoded sample equality, measured WAV and OGG true peaks below -1 dBTP,
and decay below -70 dBFS in the last second. Native WAV precision is still
16-bit; this does not claim high-resolution release mastering.

All audio, source snapshots, exact command manifests and raw measurements live
outside the repository at ~/artifacts/crash-the-stack-album/opening-pair-i/.
Only the two full album-level OGGs are intended for this listening batch; prior
pilots and matched comparisons remain preserved alongside this directory.

## Render and provisional mastering results

| Track | Native LUFS-I | Input gain | Master WAV LUFS-I | OGG LUFS-I | OGG true peak | Master LRA |
|---|---:|---:|---:|---:|---:|---:|
| Cold Boot | -17.4 | +1.5 dB | -15.9 | -15.8 | -1.3 dBTP | 3.3 LU |
| Relay Ghost | -15.9 | -0.5 dB | -16.4 | -16.4 | -1.8 dBTP | 12.1 LU |

Relay Ghost already renders louder, so its level is eased back rather than
boosted to match the heavier pieces. Cold Boot remains a steady techno pulse;
its lower loudness range was already present in the native render (3.3 LU),
not produced by heavy mastering compression. Relay Ghost's native range is
12.2 LU, becoming 12.1 LU in the master. These are provisional album levels,
not a decision that every track should reach the same number.

All four native/master WAV/FLAC/OGG format/duration checks pass per title, with
lossless master PCM identity. Final master seconds peak at -90.3 dBFS (Cold Boot)
and -84.3 dBFS (Relay Ghost). The new composer reproduced both committed scores
byte-for-byte; instrument banks and buses equal their accepted game sources
exactly. The extended audit also passes on Black Glass and Quiet Array, retaining
their original 2,327/840 attacks and zero clock error. Existing-master rejection
was exercised without changing prior artifacts.

These exports bring the album to four full arrangements out of fifteen. The
remaining eleven are still planned; this pair awaits listening feedback. The
user's ongoing detailed review of the first two tracks remains open.

Telegram acknowledged Cold Boot album I as message 1116 and Relay Ghost album I
as message 1117. Both are complete album-level OGGs. While listening, David asked
to begin the next pair, Closed Loop and Shadow Protocol; feedback on this pair
remains open.
