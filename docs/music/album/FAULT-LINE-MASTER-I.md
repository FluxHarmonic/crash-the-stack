# Fault Line: share master I

David approved composition III and requested a mastered version to share. The
arrangement and instrument balance are unchanged from the approved 2:59.048
album render (source commit 17ec4f8).

Master from the verified composition III native WAV. Add +4.3 dB before the
album's established four-times-oversampled limiter: nominal -1.5 dB ceiling,
5 ms attack, 80 ms release, automatic level compensation disabled and lookahead
latency compensated. Downsample to stereo 44.1 kHz and dither to 16-bit. This
is 2 dB more input gain than the clean audition. Retain the quiet interlude's
contrast and the original ending; no arrangement, EQ or reverb changes.

The share file is a 256 kbps MP3 with the existing compact 800 x 800 album cover,
artist David Wilson, title Fault Line, album Crash The Stack - Original
Soundtrack and the established CC BY 4.0 attribution. No track number is assigned
until the expanded album sequence is settled. A lossless FLAC and quality-7 OGG
are retained alongside it. The intermediate WAV is temporary and automatically
removed; the existing native WAV is reused in place, not duplicated.

## Reproduction

From the album worktree, with a fresh external output directory:

```sh
sigil docs/music/tools/fault-line-master.sgl \
  --input /absolute/artifacts/fault-line-composition-iii \
  --output /absolute/artifacts/fault-line-master-i
```

The Sigil tool verifies the source snapshot, records the input/source/renderer
hashes and exact command arrays, confirms FLAC PCM parity, and measures every
delivery for loudness, true peak, duration and final decay. MP3 identity and
embedded artwork are checked. Peak ceiling for decoded deliveries is -1 dBTP.
The measurements supplement listening; no new subjective listening verdict is
claimed for this master.

Files and complete evidence:
`~/Ops/artifacts/crash-the-stack-album/fault-line-master-i/`.
This is a sharing master; final album sequencing and inter-track mastering remain
open. Website publication and the existing fifteen-track selection are unchanged.

## Verified results

| Format | LUFS-I | Range | True peak | Final second |
|---|---:|---:|---:|---:|
| FLAC | -17.6 | 11.8 LU | -1.5 dBTP | -90.3 dBFS |
| MP3 | -17.6 | 11.8 LU | -1.2 dBTP | -84.3 dBFS |
| OGG | -17.6 | 11.8 LU | -1.3 dBTP | -84.3 dBFS |

Mastering tool and evidence commit: d38f08b. The share MP3 was delivered to
Telegram with confirmed message 1198. Its SHA-256 is recorded in master-checks.json.
