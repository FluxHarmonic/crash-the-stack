# Album mastering approach

The album should retain the contrast between heavy rhythmic tracks and delicate
puzzle/stealth music. Mastering decisions follow finished arrangements and mix
balances; a limiter cannot repair an intrusive bass voice or an overlong bridge.

## Repeatable process

1. Render fresh lossless audio from the canonical album score and record the
   score, renderer revision/hash, sample rate and complete settings.
2. Compare adjacent tracks at the intended album playback level. Choose per-track
   gain with attention to the musical foreground, rather than forcing equal LUFS.
3. If needed, make a gently controlled peak version. Match its integrated loudness
   to the clean version before listening for damage to kicks, clicks, bass attack,
   stereo detail and room decay. Then compare proposed actual playback levels.
4. Check integrated/short-term loudness, loudness range, sample peaks, true peaks,
   mono compatibility and beginnings/endings. Review whole arrangements as well
   as their busiest transitions. Automated evidence supplements listening.
5. Measure the decoded delivery codec too. Aim initially for at least 1 dB of true
   peak margin in delivery files; tighten or lower the working ceiling as needed
   after resampling and encoding. This is our review policy, not a claim that one
   universal number defines a good master.
6. Finish inter-track spacing after the sequence is stable. Retain native tails
   for edits; remove unnecessary trailing silence only in the delivery stage.
   Final artwork, artist credit and distribution metadata remain undecided.

Current tools: [tools/ALBUM.md](../tools/ALBUM.md). FFmpeg's
[alimiter documentation](https://ffmpeg.org/ffmpeg-filters.html#alimiter)
explains oversampling, automatic leveling and lookahead latency compensation;
[ebur128](https://ffmpeg.org/ffmpeg-filters.html#ebur128) supplies the measurements.
The candidate uses 4x oversampling, automatic leveling off and compensated
lookahead. Its nominal -1.5 dB limiter setting is not a guarantee of that exact
true peak after downsampling: remeasure the output.

## Pilot I settings and evidence

The clean auditions add +1 dB to Black Glass and +3 dB to Quiet Array, without
additional compression or limiting beyond the accepted Motif score/render chain.
The controlled candidate adds another 2 dB into the oversampled limiter. This is
an experiment, not an accepted master. The matching tool then brings that
candidate back to the clean audition's measured integrated loudness for comparison.

| Track | Clean LUFS-I | Clean LRA | Clean true peak | Candidate LUFS-I | Candidate true peak |
|---|---:|---:|---:|---:|---:|
| Black Glass | -17.3 | 14.9 LU | -1.1 dBTP | -15.4 | -1.4 dBTP |
| Quiet Array | -20.1 | 9.9 LU | -3.9 dBTP | -18.1 | -1.9 dBTP |

The candidate barely reaches the limiter on Quiet Array; most of that difference
is simple gain. Neither these levels nor an equal loudness target are final.
Listen to the matched files before claiming an improvement. The large Black
Glass range includes its intentionally exposed middle and receding ending.

## Motif findings for the engine owner

Inspected the source corresponding to the existing authoring renderer, read-only.
No engine changes were made from the album branch.

- Motif already has a final Soundpipe peaklim stage. In `src/c/render.c`, the WAV
  path creates separate left and right limiters with attack 0.01, release 0.1,
  threshold 0.95; `src/motif/render/plan.sgl` uses matching streaming settings.
  This is fixed renderer behavior, separate from the score's bus compressor.
- Soundpipe `vendor/soundpipe/modules/peaklim.c` converts `p->thresh` using dB2lin.
  Thus 0.95 means +0.95 dB, not a linear 0.95 ceiling. Its envelope follower is
  not a brickwall true-peak guarantee. Independent channels can also receive
  different gain reduction. Verify and correct units before relying on this
  stage for final peak control.
- The inspected Soundpipe attack-coefficient branch also references `p->rel`
  rather than `p->atk`. Flag this for the DSP owner to verify against the shipped
  dependency and test; do not silently alter the sound of accepted game renders.
- Native WAV export currently quantizes to signed 16-bit. Even the helper named
  write-float32-pcm-to-wav! accepts float input but writes a 16-bit WAV. An external
  float comparison file made from that output does not restore lost precision.

Useful engine follow-up: true float WAV export before integer quantization,
an explicit mastering/bypass mode, clear dB units, stereo-linked lookahead peak
control with oversampling, configurable ceiling and gain-reduction metering.
Keep compatibility with accepted game playback. Album-specific loudness policy
belongs in the album tooling, not as a new global game-render default.

These are Motif/DSP findings, not a Sigil-shell blocker. Sigil successfully drives
composition, validation, native rendering, encoding, measurement and delivery.
