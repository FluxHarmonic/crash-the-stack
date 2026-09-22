# Mastering trial I

David liked both full compositions and approved a short mastering trial before
arranging the next batch. Black Glass and Quiet Array are accepted for this
production experiment; final release mastering is still open.

## Listening order

Four full OGG files provide two comparisons. They preserve the complete music,
bridges, endings and durations; no excerpt or synthetic A/B montage is used.

1. Compare each `master-trial-i-matched` file with its original pilot-i clean
   audition, keeping player volume unchanged and normalization disabled if the
   player provides that option. The matched file brings the limiter candidate
   down to the previous audition's integrated loudness. Listen for changes in
   kick/click attack, bass definition and delicate background detail.
2. Listen to the `master-trial-i-album-level` files together at unchanged player
   volume. These propose more presence while keeping Quiet Array below Black
   Glass in perceived level. This is the album-balance check, separate from the
   first comparison's check for processing damage.

For Black Glass, the opening and the focused return at 2:17 expose the drum and
bass transients. The 1:29–1:57 exposed middle helps check whether increased
playback level preserves space around the FM notes. For Quiet Array, compare the
1:34 exposed bridge and the 3:29 calm reprise: the candidate should preserve the
softness of the mallets and their background reflections.

Quiet Array barely reaches the limiter, so the matched comparison should remain
very close to the clean audition. That is expected: extra processing is not a
requirement for mastering. Black Glass's controlled peaks make it the more
useful test of the limiter recipe. No subjective listening verdict is claimed
by the automated checks.

## Processing and preservation

The sources are the full float processing files already prepared in pilot-i,
with exact input hashes recorded in the new artifact directory. Those sources
ultimately derive from native 16-bit WAV, so this trial makes no high-resolution
source claim. No OGG is used as an input to mastering.

The candidate retains the accepted score bus processing and adds 2 dB beyond
the clean audition gain, into the documented 4x-oversampled limiter. Its settings
are a nominal -1.5 dB ceiling, 5 ms attack, 80 ms release, automatic makeup off and
latency compensation. Matched versions attenuate Black Glass by 1.9 dB and Quiet
Array by 2 dB. No EQ, stereo-width change, reverb, arrangement or tail edit is
added in this trial.

The Sigil entry point is `docs/music/tools/album-master-trial.sgl`. It checks the
source snapshots against the album scores, exports tagged 16-bit WAV/FLAC and
OGG quality 7, measures each WAV and decoded OGG, verifies full durations and
lossless PCM identity, and rejects delivery peaks above -1 dBTP. It also checks
that the final second has decayed below -70 dBFS and that export loudness stays
within 0.2 LU of the prepared candidate. Existing trial evidence is protected
from accidental overwrite; use a new output directory for a new version.

Audio and full evidence live in
`~/Ops/artifacts/crash-the-stack-album/master-trial-i/`, with OGGs in `ogg/`.
`README-renders.txt` records reproduction instructions; `export-commands.json`
contains exact command arrays, `input-audio.sha256` identifies the inputs, and
`trial-check.json` contains the measured results. The original pilot auditions
remain untouched in the adjacent pilot-i directory.

The next decision is whether to retain this restrained gain/peak-control recipe
as the provisional album approach. Final track-to-track level and spacing choices
wait for the complete sequence. The next arrangement batch is Cold Boot and
Relay Ghost, following Black Glass at the start of the album.

## Export results

| Full OGG | LUFS-I | Loudness range | True peak |
|---|---:|---:|---:|
| Black Glass, matched | -17.3 | 14.9 LU | -2.9 dBTP |
| Black Glass, album-level | -15.4 | 14.9 LU | -1.2 dBTP |
| Quiet Array, matched | -20.1 | 10.0 LU | -3.9 dBTP |
| Quiet Array, album-level | -18.1 | 10.0 LU | -1.8 dBTP |

All four full WAV/FLAC/OGG durations match the score within one sample; the
lossless exports have identical decoded PCM. The matched loudness values equal
the previous clean auditions at the meter's 0.1 LU precision. The WAV loudness
ranges remain 14.9 LU and 9.9 LU; Vorbis reports 10.0 LU for Quiet Array. Final
WAV seconds peak at -84.3 and -90.3 dBFS respectively. Every delivery OGG retains
at least 1 dB of measured true-peak margin. A repository output path and an
existing trial directory are both rejected before exports or evidence writes.

Telegram acknowledged all four full OGG deliveries: matched Black Glass 1112,
matched Quiet Array 1113, album-level Black Glass 1114, album-level Quiet Array
1115. The external telegram-receipts.txt preserves the tool acknowledgements.
Mastering preference remains pending David's listening feedback.
