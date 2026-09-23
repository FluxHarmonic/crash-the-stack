# Closed Loop album II

David approved Phrases I as more musical and requested adoption, mastering and
publication on 2026-09-23. The musical pass is complete. The snap-click kit,
bass groove, chord performance, instrument bank and bus remain unchanged.

The later signal and bell replies now develop through the calm and tense
material, and the quiet ending recalls the opening in reverse. The shared
pool generates both arrangements, which match the approved audition exactly.
All fifteen song regeneration checks pass. The candidate's compiled game and
album timing checks both report zero sample error; the game retains its tense
loop and the album releases every voice. See [Phrases I](../alternates/closed-loop-phrases-i/README.md).

## Master and exports

The approved native `closed-loop-phrases-i/closed-loop-after.wav` is reused
losslessly after comparing its score snapshot with the adopted album. The
existing +3 dB mastering gain and oversampled safety limiter are retained.
The 3:16 arrangement measures -17.1 LUFS-I, -1.7 dBTP and 3.6 LU LRA as WAV;
OGG measures -17.0 LUFS-I and -1.7 dBTP. WAV and FLAC have identical decoded
PCM, format/duration checks pass and the last WAV second peaks at -84.3 dBFS.

The automatic MP3 exporter now selects this master. Its 256 kbps MP3 retains
David Wilson artist/album-artist credit, the soundtrack album title, track 4/15,
CC BY metadata and compact attached cover. Native provenance, raw measurements,
commands, exports and older versions remain outside the repository.

The release is published at https://crashthestack.com/soundtrack/. The tagged
MP3 measures -17.1 LUFS-I, -1.7 dBTP and 3.6 LU LRA.

## Publication

Deployment `2b9c8cc3` publishes source `1906d44` and preserves the preceding
`014fbd1d` production site. Every preserved file was fetched and hash-checked;
only Closed Loop's MP3 URL changes in the fifteen-track manifest. Pages uploaded
one changed file and reused the other 76. The live manifest matches the stage.

The immutable object is `soundtrack/closed-loop-album-ii/closed-loop.mp3`, with
`?v=262faf69d6da` in the player URL. R2 API inspection confirmed the key was
unused before upload; no pre-upload CDN probe was made. Public bytes match the
6,471,213-byte export with SHA-256
`262faf69d6daa603576cc14ab48a5c9e4de6927fd3aa4a91a85ea9fff7bac8d5`.
MIME, CORS and exact byte-range 206 checks pass. A fresh browser selected
Closed Loop, advanced beyond one second without an audio error, showed the
correct David Wilson/album metadata and retained all fifteen tracks. That
functional check was muted and paused afterward.

Game and album sources are synchronized. This page-only deployment preserves
the currently deployed game/tracker assets; their updated Closed Loop score
ships through the next normal game deployment.

External collateral under `~/artifacts/crash-the-stack-album/`:

- `closed-loop-ii-release/`: lossless provenance, WAV/FLAC/OGG, checks and commands.
- `closed-loop-ii-mp3/`: tagged MP3, cover, export report and decoded measurement.
- `r2-closed-loop-ii/`: upload plan/receipt, API existence check and HTTP evidence.
- `publication-closed-loop-ii/`: preserved site, staging script, manifests,
  deployment record and browser playback evidence.
- `tagged-preview-vii/soundtrack/audio/`: current full local MP3 collection;
  fourteen files remain byte-identical to revision VI.

Future game publishes must use `publication-closed-loop-ii/site/soundtrack/`
as `CRASH_SOUNDTRACK_DIR`, or an equivalent newer production bundle. Previous
masters, source snapshots and all audition collateral remain intact.
