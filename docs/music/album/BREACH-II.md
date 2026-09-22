# Breach Vector album II

David approved Phrases I and Percussion I, then requested mastering and public
release before the next track pass. The shared song source now generates this
exact accepted album score and its corresponding game arrangement.

The master reuses the approved native `breach-percussion-i/breach-vector-after.wav`
without resynthesis or changes to notes, patches or mix. Its score snapshot is
byte-identical to the canonical album score. The previous +0.5 dB input gain
and oversampled peak-ceiling recipe retain the snare's reduced noise and the
newly exposed drum dynamics. No additional compression or loudness targeting
is introduced.

The WAV and OGG measure -16.9 LUFS-I, with 4.2 LU loudness range and true peaks
of -1.9 and -1.8 dBTP respectively. Duration remains 210.285714 seconds;
WAV/FLAC decode identically, and the final second peaks at -90.3 dBFS.

External artifacts under `~/Ops/artifacts/crash-the-stack-album/`:

- `breach-ii-release/`: WAV, FLAC, OGG, source snapshot, native hashes and checks.
- `breach-ii-mp3/`: tagged 256 kbps MP3, compact embedded cover and metadata checks.
- `r2-breach-ii/`: immutable upload plan and receipt.
- `publication-breach-ii/`: verified current-site snapshot and publication record.

The automatic MP3 exporter selects this master. It retains David Wilson as
artist/album artist, the soundtrack album name, track 13/15 and CC BY credit.
The new object is `soundtrack/breach-album-ii/breach-vector.mp3`. Earlier audio
and the before/after comparisons remain preserved.

Publication changes only Breach Vector's URL in the existing fifteen-track
manifest. Every preserved public file is compared against the preceding
production deployment before uploading the page. Game integration is a separate
step following the Motif gain release.

## Publication complete

Published at https://cfb7d2bb.crashthestack.pages.dev (source `853dbc4`). The
public MP3 is byte-identical to the tagged export; MIME, CORS and HTTP 206 byte
ranges pass. Decoded MP3 is -16.9 LUFS-I and -1.7 dBTP. A fresh browser context
selected Breach Vector and advanced playback from the new URL with correct
Media Session metadata and all fifteen tracks present. The functional test
was muted and paused afterward.

Future game deployments must retain the manifest in
`publication-breach-ii/site/soundtrack/` or the current production equivalent.

The complete current local MP3 collection is now
`tagged-preview-v/soundtrack/audio/`; it copies revision IV and replaces only
Breach Vector with the new tagged export. Its revision record retains the hash.
