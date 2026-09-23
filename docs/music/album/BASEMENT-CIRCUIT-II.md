# Basement Circuit album II

David selected Expression I's rounder pluck, faster-closing acid contour and
connected pluck/bell replies, followed by Fade I's original-rhythm ending.
The rejected Turnaround I remains archived. The fade reduces only channel 6
note volumes over the last two acid bars, preserving notes, slides and gates.
Its velocity-sensitive filter softens naturally as the notes get quieter.

The maintained baseline was checked against Expression I's frozen sources
before adoption. Fade I's shared pool now generates both game and album scores
identical to the selected candidates. Layouts and durations remain unchanged.
The full native album is freshly rendered: the earlier Expression I WAV lacks
the selected fade and is not reused.

Retain the existing 0 dB mastering gain and oversampled safety limiter. Release
artifacts live outside the repository under basement-ii-release/ and
basement-ii-mp3/ in ~/Ops/artifacts/crash-the-stack-album/. The complete
master was delivered through Telegram as message 1166.

## Validation and exports

All fifteen song regeneration checks pass. The album has 2,936 attacks, zero
sample-clock error, its four intentional fill 32nds and all final gates released.
The game has 2,531 compiled triggers, zero sample-clock error and its B06 tense
loop preserved. Album duration remains 220.645 seconds; game duration 162.581.

The fresh native render uses pinned Motif 0.6.6, renderer SHA-256
f68c6737ccd25946e3b6135c6a75c18ac4c5318f511faa9216084c8d12d1d842.
WAV measures -16.2 LUFS-I, -2.4 dBTP and 4.5 LU LRA; OGG measures -16.2 LUFS-I,
-2.4 dBTP and 4.6 LU LRA. Stereo 44.1 kHz, durations and decoded WAV/FLAC identity
pass. The mastered final second peaks at -84.3 dBFS. MP3 measures -16.2 LUFS-I,
-2.5 dBTP and 4.6 LU LRA. Its metadata uses David Wilson, track 10/15, the
soundtrack album title, CC BY 4.0 and the compact attached cover.

## Publication

Live at https://crashthestack.com/soundtrack/. Deployment **c9396511** publishes
source **ed32772**, preserving production 4aed2e65. All previous production
files were fetched and hash-checked; only Basement Circuit's MP3 URL changes
in the fifteen-track manifest. Pages uploaded one changed file and reused 76.
The live manifest matches the staged release.

The immutable R2 object is soundtrack/basement-album-ii/basement-circuit.mp3,
with ?v=45cf2f8c79ea in the player URL. The API confirmed the key was unused
before upload; no premature public-CDN probe was made. Public bytes match the
7,259,490-byte export with SHA-256
45cf2f8c79ea946f16fea2adc06166332dc083447418a5fff336886473f22657.
MIME, CORS and exact HTTP 206 range checks pass. A fresh muted browser played
Basement Circuit beyond one second without an audio error, showed the expected
title/artist/album and retained fifteen tracks. Playback was paused afterward.
This is a functional verification, not a subjective listening review.

The page deployment preserves current game and tracker binaries. The synchronized
game score ships through the next normal game deployment. Future deployments
must use publication-basement-ii/site/soundtrack/ as CRASH_SOUNDTRACK_DIR,
or an equivalent newer production bundle.

External collateral under ~/Ops/artifacts/crash-the-stack-album/:

- basement-ii-release/: fresh native provenance, score audits, WAV/FLAC/OGG, commands and delivery receipt.
- basement-ii-mp3/: tagged MP3, cover, export report and decoded measurement.
- r2-basement-ii/: upload plan, receipt, unused-key and public streaming checks.
- publication-basement-ii/: preserved site, staging script, deployment and browser evidence.
- tagged-preview-ix/soundtrack/audio/: all fifteen MP3s; the other fourteen are byte-identical to collection VIII.

## Next review

Glass Current is the suggested next review. Preserve its melodic identity,
paper-like percussion, softened swell and closing role. Review the tense bass
articulation and supporting replies in context; retain patches that already
work. Audition proposed changes before adopting them.
