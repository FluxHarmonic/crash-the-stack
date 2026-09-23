# Fault Line and After Image: style demos I

Two short auditions requested before developing full arrangements. Fault Line
is a working title; After Image is David's chosen two-word title. Both use the
existing pinned Motif 0.6.6 synth set. These are additional candidates, not
replacements for existing songs or additions to the published fifteen-track
album yet. Listening acceptance is pending.

## Musical direction

**Fault Line**: 126 BPM, D minor, 26 bars (49.524 seconds). A muted FM guitar
riff and picked bass introduce the palette, followed by a rock backbeat. The
full section at 0:26.667 opens the guitars and adds short lead answers. Two
carrier/modulator pairs inside each guitar voice supply root and fifth;
short versus sustained amplitude envelopes distinguish muted and open playing.
The left and right parts have different articulations and a small tuning offset.
The result aims for retro FM guitar character, not sampled-guitar realism.

The harmony moves D, B-flat, G, A. Riffs use the chord's diatonic third and
fourth; the B-flat riff uses D natural to agree with the lead. The right guitar
holds a root/fifth pedal while the left riff moves. The lead leaves room for
that riff, with connected calls that resolve into D minor. Kick, short snare,
metallic hats, toms and a restrained crash form one kit, including the fill.
The bass and drums remain central; there is no pad replacing the guitar body.

**After Image**: 108 BPM, F minor, 26 bars (57.778 seconds). An octave bass pulse
supports slow, wide FM pads. The left pad supplies root/fifth; the right supplies
third/seventh, following Fm7, Dbmaj7, Bbm7 and Cm7. Unison detuning and gentle
chorus give the chord body movement. The longer-bodied snare, open hat and
slightly heavier kick distinguish this from the rock kit and the quieter
percussion elsewhere in the soundtrack. This uses a shaped synthetic snare
with room send, not a dedicated gated-reverb effect.

The sustained saw theme enters with the larger kit at 0:31.111. Its falling
minor-key phrases and longer held notes contrast with Fault Line's low guitar
riff and short responses. Both tracks use fixed timing, deliberate note lengths,
accents and rests. No random timing offsets or bus limiter are added.

## Listening decisions

Judge whether Fault Line reads as guitar/bass/kit rock and whether its FM edge
is appealing. Judge After Image's pad body, snare size and lead against the
requested dark synthwave direction. These sketches expose restrained and full
textures, then land and release. They are single demos, not before/after pairs.
The longer forms, game calm/tense layouts and official album placement follow
feedback. Preserve these snapshots when revising.

## Reproduction and checks

```sh
sigil docs/music/tools/rock-wave-sketches.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/rock-wave-replay
```

The four generated files are checked in beside this document. Section maps
record exact bar boundaries. The canonical writer refuses to overwrite a
differing score. Audio and the commands that produced it live outside the repo
at ~/artifacts/crash-the-stack-album/rock-wave-sketches-i-final/.
The earlier rock-wave-sketches-i/ artifacts are undelivered preflight renders;
the final folder includes the B-flat harmony correction.

Native rendering uses the pinned executable and records its checksum, exact
argv, source snapshot and WAV checksum. `rock-wave-delivery.sgl` verifies those
snapshots/checksums, checks stereo 44.1 kHz duration, applies gain only, and
encodes Vorbis quality 7 with title/artist metadata. Each different composition
approaches -17 LUFS only where a -2 dBTP pre-encode ceiling allows; transient
headroom takes priority. Decoded OGG must remain below -1 dBTP and its last
second below -70 dBFS. These are monitoring exports, not final album masters.

The external demo audit is a copy of `album-audit.sgl` with only the two title
policies, default paths and import locations adapted. It checks finite transport,
canonical score, sixteenth-note attack grid, source versus compiled attack
positions, eight-voice channel budget, explicit final note-offs and a two-bar
release tail. Numerical checks do not establish subjective listening quality.
All fifteen maintained-song regeneration checks pass.

## Delivered review copies

Source commit: **306672e**. All four generated score/map files reproduce exactly.
Fault Line has 585 compiled attacks; After Image has 468. Both have zero sample
clock error, no 32nd-note attacks, released final gates and passing voice budgets.
The OGGs retain the expected duration and stereo 44.1 kHz format.

| Demo | Gain | OGG LUFS-I | OGG dBTP | Last-second peak | Telegram |
|---|---:|---:|---:|---:|---:|
| Fault Line | +0.1 dB | -19.6 | -2.1 | -91 dBFS | 1175 |
| After Image | +2.7 dB | -18.4 | -2.0 | -91 dBFS | 1176 |

Telegram acknowledged both complete short demos. The external final folder
contains receipt log, render argv, score/WAV/renderer hashes, level and ending
measurements, audit script and all fifteen maintained-song check logs.
`delivery-checks.json` preserves source and delivered OGG hashes here as well.
Listening feedback remains the next step; no public audio has changed.
