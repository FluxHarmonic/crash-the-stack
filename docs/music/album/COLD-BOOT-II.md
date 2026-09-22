# Cold Boot album II

David approved Motion I's metallic hats and pressure-filter contrast, hearing
less mud and less busyness, then requested mastering and publication. The
approved mix is now live on the soundtrack page. The musical pass is finished.

The five patches are maintained in `../songs/cold-boot/parts.cts`. Game and album
outputs regenerate from that source and exactly match the approved candidates.
The kick, sub, integrated knock/fill, chord stabs, distant bell, all notes,
accents, gates, bus and 3:34.545 form stay intact. All fifteen shared-song checks
pass. See [the audition record](../alternates/cold-boot-motion-i/README.md).

## Master and exports

The approved `cold-boot-motion-i/cold-boot-after.wav` is reused losslessly.
Its source snapshot matches the adopted album byte for byte; renderer and source
hashes are retained. The established +1.5 dB input gain and oversampled peak
limiter preserve the revised mix without another composition or patch change.

| Format | LUFS-I | True peak | LRA |
|---|---:|---:|---:|
| WAV | -15.9 | -1.5 dBTP | 3.3 LU |
| OGG | -15.8 | -1.4 dBTP | 3.3 LU |
| MP3 | -15.9 | -1.5 dBTP | 3.3 LU |

Duration/format checks pass, WAV/FLAC decoded PCM matches, and the last WAV
second peaks at -90.3 dBFS. The 256 kbps MP3 includes the compact cover, David
Wilson artist/album-artist credit, soundtrack album title, track 2/15 and CC BY
metadata. The automatic exporter selects this master for future MP3 bundles.

## Publication

Published at https://014fbd1d.crashthestack.pages.dev from `560f743` and live at
https://crashthestack.com/soundtrack/. Only Cold Boot's MP3 URL changed. All
other player, game and tracker files were verified against deployment
`c3e7651a` and retained; the other fourteen track entries are unchanged.

The public object is `soundtrack/cold-boot-album-ii/cold-boot.mp3`, addressed
with `?v=b268d1999e4a`. That content-hash query bypasses the cached 404 from the
pre-upload existence check. The final URL returns the exact tagged MP3 bytes,
correct MIME/CORS headers and HTTP 206 ranges. A fresh browser context selected
Cold Boot, advanced playback beyond one second, reported correct Media Session
metadata, and retained all fifteen tracks. The check was muted and paused.

Source adoption synchronizes game and album scores. This page-only publication
preserves the currently deployed game/tracker score assets; those receive the
updated Cold Boot score through the next normal game deployment.

External collateral beneath `~/Ops/artifacts/crash-the-stack-album/`:

- `cold-boot-ii-release/`: native provenance, WAV/FLAC/OGG, commands and checks.
- `cold-boot-ii-mp3/`: tagged MP3, cover, export report and decoded measurements.
- `r2-cold-boot-ii/`: immutable upload plan, receipt and HTTP verification.
- `publication-cold-boot-ii/`: complete preserved site, staging/version scripts,
  previous/current manifests, deployment and browser evidence.
- `tagged-preview-vi/soundtrack/audio/`: complete current local MP3 collection,
  retaining revision V's fourteen other files and replacing only Cold Boot.

Future game publishes must use `publication-cold-boot-ii/site/soundtrack/` as
`CRASH_SOUNDTRACK_DIR`, or preserve an equivalent newer production manifest.
Previous masters, source snapshots and before/after auditions remain intact.
