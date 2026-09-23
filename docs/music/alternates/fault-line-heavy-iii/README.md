# Fault Line: heavier guitars and bent pentatonic solo

Style III responds to David's request for thicker, more distorted guitars, a
slightly louder version of the improved tom, and a higher pentatonic solo with
bends. The reference is Fault Line Style II, preserved as `fault-line-before.cts`.
After Image and all fifteen maintained game/album tracks stay at their previous
versions. This remains a short style audition, not an official album adoption.

## Instruments and composition

Rhythm guitars retain their root/fifth FM core and different left/right tuning.
Drive increases from 1.25 to 3.5, carrier levels increase, and longer amplitude
decay/sustain gives each hit more body. FM index settles at 2.4 so the heavier
sound emphasizes saturated chord body instead of increasingly sharp FM sidebands.
The former small saw edge becomes a stronger two-voice, lightly detuned saw layer
with more drive and a 2300 Hz pre-distortion low-pass. A quiet saturated triangle
an octave below adds lower body. Muted and open patches retain distinct envelopes.
Each rhythm channel allocates six instrument/layer voices, below the limit of eight.

The first preflight hit 0.0 dBTP at the full ending. Final rhythm-guitar output
gains are therefore 0.45 left and 0.42 right, 2.50 dB below the preflight's 0.6/0.56.
The distortion and layer ratios remain intact; gain is adjusted after the patch.
The failed preflight is retained outside the repo and is not a listening export.

The approved shorter tom keeps exactly the same synthesis and receives **+1.5 dB**
of instrument output gain (including its stick layer). Kick, snare, hats, crash,
bass, backing notes, velocity, timing, pan/send and bus settings remain unchanged.

The lead now plays D-minor pentatonic notes **D, F, G, A, C**, mainly D5–A5 with
an A4 answer. It uses picked opening notes, longer bent tones, short descending
replies, a higher final call and a D resolution. The landing answers F5–D5.
Its patch uses more saturation but less FM index/feedback, stronger sustain and
lower output gain to let the higher register sing without turning piercing.

Five whole-tone bends are written with `304` tone portamento, continued with
`300` across four rows. At speed 3, each active tick moves a quarter semitone;
eight steps reach the target without retriggering the envelope. The solo bends
G5 up to A5, C5 up to D5, G5 down to F5, then C5 up to D5 and back down to C5.
Targets remain held until the authored note-off or next phrase. These are
continuous-gate pitch movements rather than re-attacked scale notes.

## Listening guide

The complete revised demo is still **49.524 seconds**; the solo enters at
**0:26.667**. The **45.714-second A/B** plays Style II first, then Style III at
**0:22.857**. Each half contains the two-bar transition/tom fill, the whole
eight-bar lead section and two release bars. Both halves and complete reference
files share one monitoring gain, with no extra limiter or individual normalization.
The retained full-before render is available locally; only A/B and revised full
are sent for this pass.

## Reproduction and checks

```sh
sigil docs/music/tools/fault-line-heavy.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/fault-line-iii-replay
sigil docs/music/tools/expression-render.sgl --stage native \
  --input "$PWD/docs/music/alternates/fault-line-heavy-iii" \
  --motif "$PWD/build/dev/bin/motif" --output /absolute/fresh/artifacts
sigil docs/music/tools/expression-render.sgl --stage delivery \
  --input "$PWD/docs/music/alternates/fault-line-heavy-iii" \
  --gain-db 0 --output /absolute/fresh/artifacts
sigil docs/music/tools/fault-line-bend-audit.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /absolute/fresh/artifacts
```

The generator asserts preserved backing patterns and bus. The dedicated bend
audit checks all forty actual compiled pitch steps, quarter-semitone progression,
held gates, no bend retriggers, target holds and unchanged compiled backing
performance (excluding voice indices changed by layer allocation). The finite
score audit checks canonical form, attack grid/clock, voice budget, final releases
and tail. The after score contains 599 attacks, zero sample clock error and no
32nd-note attacks. The eight generated files reproduce exactly; all fifteen
maintained-song checks pass. These checks cannot establish subjective sound quality.

Final audio, exact commands, renderer identity, native/encoded measurements and
receipts live in ~/artifacts/crash-the-stack-album/fault-line-heavy-iii-final/.
The earlier fault-line-heavy-iii/ folder contains the undelivered preflight;
its unchanged before renders were safely reused after source/renderer comparison.

## Delivered review copy

Source commit: **ca3cdf6**. Telegram acknowledged the Style II/III comparison
as **1181** and the complete revised short demo as **1182**. No failed preflight
audio was sent. Encoded reference/delivery hashes are preserved in `encoded.sha256`.

The common delivery gain is -1.3 dB. A/B measures -19.0 LUFS-I/-3.8 dBTP;
the complete revised demo measures -19.8 LUFS-I/-2.0 dBTP, with a last-second
peak of -91 dBFS. Both format/duration checks pass. The full before reference
measures -21.3 LUFS-I/-3.2 dBTP at that same gain; the new density and more active
solo intentionally affect loudness. Listening feedback remains pending.
