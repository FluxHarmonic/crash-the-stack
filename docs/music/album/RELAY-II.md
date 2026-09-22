# Relay Ghost album II

David chose the quieter contact/dust drums, retained the original bell, and
confirmed that the gritty bass—not the separate acid line—should be reduced
by 2 dB. He requested the complete track and expects this to close the pass.

The canonical album score now adopts that exact mix from the gritty-bass-down
comparison. Instrument 2 uses the contact snap and small noise edge, 3/21 the
shorter closed/open hat dust, and 19 a linear output gain of 0.7943282347242815.
The approved kit also covers the transition roll. Original kick, sub, chords,
pluck, bell, riser and acid line remain intact. The metallic bell and wire
pluck prototypes are preserved as experiments, not silently included here.

The whole gritty bass voice, including its chirpy FM harmonics, is 2 dB lower.
This does not selectively filter those harmonics or change the synth patch.
The separate acid part follows the harmony with a different rhythm: on the
first tense bar the gritty bass starts on E2, while acid E3 enters six rows
later. Both can sound squelchy, which caused the earlier label ambiguity.

## Form and checks

Duration remains 3:27.273, with 114 bars at 132 BPM/speed 3. Every pattern,
order, note volume, effect, gate and bus setting equals album I. The parser and
album audit pass: 2,572 attacks, zero sample timing error, four intentional
transition roll subdivisions and all final gates released. Cold Boot remains
byte-identical. The instrument bank matches the chosen audition exactly.

`album-compose-opening.sgl` now generates this revision by default, taking the
approved bank from the preserved gritty-bass-down audition. `--relay-revision i`
regenerates the original album version; Cold Boot is unaffected by that option.
Album I remains in `../alternates/relay-expression-i/relay-ghost-before.cts`.
The earlier expression and bell/bass audition tools now read that immutable
snapshot so subsequent canonical album changes do not alter their comparisons.

Motif commit `b0d135e` on `feat/codex-expression` supplies instrument gain.
The composer explicitly checks that the canonical renderer preserves it.
The game's dependency and assets remain untouched. Until the feature is
released, use the feature renderer to reproduce this album revision.

## Renders

External directory: `~/Ops/artifacts/crash-the-stack-album/relay-ii/`.
Full listening file: `ogg/relay-ghost-album-ii.ogg`; WAV and FLAC are retained.
The delivery gain stays at -1.1 dB, as in the comparisons. The established
oversampled peak-ceiling recipe remains in the album renderer, with no boost
to undo the quieter drums or bass. These are provisional listening masters.
The native source remains 16-bit; the exporter does not create extra precision.

A separate identification clip in `relay-bass-identity-i/` isolates the original
gritty bass at 0:00, the acid line at 0:18.182, and both at 0:36.364. The acid-only
example is boosted 8 dB for audibility; the combined example keeps the original
relative balance. This explanatory clip precedes the 2 dB bass reduction and
is not another mix proposal. The full album II is the selected listening version.

Public listening audio is unchanged during this full-track review. The musical
changes are also candidates for a future game backport once gain support is
available, recorded in NOTES.md rather than editing game assets here.

## Suggested next track

Breach Vector: preserve the accepted smooth opening, thumping bass rhythm and
spaced plucks. Start by comparing a small development of the supporting
call-and-response phrases around the exposed middle and late return. Establish
an audible arrangement improvement before adding instruments. This is the
suggested next task, not an unrequested rewrite already applied to that track.

## Delivery validation

The album-II OGG measures -18.2 LUFS-I and -3.3 dBTP; the WAV is
-18.3 LUFS-I and -3.3 dBTP. WAV and FLAC decode to identical PCM.
All formats retain the 207.273-second duration; the final second peaks at
-84.3 dBFS. The identification OGG is 54.545 seconds, stereo 44.1 kHz,
and -9.4 dBTP. Both composer revisions reproduce their expected scores.

## Telegram delivery

Sent on 2026-09-22: full `relay-ghost-album-ii.ogg` (message 1140), then
`relay-ghost-bass-identification-i.ogg` (message 1141). API acknowledgements
and delivered-file SHA-256 hashes are retained beside each external render.
Awaiting the listener's full-track review; no public deployment performed.

## Approved album master

David approved the full revised mix and requested mastering and publication.
The release retains the approved native render and uses +0.5 dB input gain
through the existing oversampled ceiling recipe, 1.6 dB above the deliberately
quiet comparison export. No balance, timbre or arrangement changes are added.
The WAV measures -16.7 LUFS-I, 10.8 LU LRA and -1.7 dBTP; the OGG is -16.6
LUFS-I and -1.7 dBTP. This sits close to the original -16.4 LUFS-I album release
without pushing the more spacious mix to an exact loudness target. All duration,
lossless PCM and final-decay checks pass.

Release masters: `relay-ii-release/`; tagged MP3: `relay-ii-mp3/` under the
external album artifact root. The MP3 exporter now selects this release by
default, retaining David Wilson, track 3/15 and the compact embedded artwork.
Versioned R2 object: `soundtrack/relay-album-ii/relay-ghost.mp3`.
The previous public release and comparison renders remain available locally.

The release is live at https://crashthestack.com/soundtrack/ (deployment
340709c4). The decoded public MP3 measures -16.7 LUFS-I and -1.6 dBTP.
A fresh browser context selected Relay Ghost and advanced playback from its
new URL with all fifteen tracks, correct artist and download hint intact.
That functional check was muted and paused afterward. The complete current
local MP3 set is `tagged-preview-iv/soundtrack/audio/`. Future game publication
must carry `publication-relay-ii/site/soundtrack/` or the current live manifest.
