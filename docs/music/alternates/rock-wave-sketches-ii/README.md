# Fault Line and After Image: style II

David liked Fault Line's composition and drum kit but wanted substantially more
guitar bite and a less round tom. He liked After Image's snare, asked for a
thumping bass with more sub weight, and clarified the target as **dark synthwave**.
These revisions remain short style auditions. Preserve Style I as the baseline;
no accepted game/album sources or public audio are replaced.

## Sound changes

Fault Line keeps every note, gate, level, section, bass part and bus setting.
Only guitar instruments 5–9 and tom 11 change. The guitars increase FM index,
feedback, saturation and sustained modulator energy. A quiet filtered saw layer
adds a continuous rough edge beneath each FM voice. The muted/open amplitude
shapes remain distinct, and instrument gain is multiplied by 0.85 to contain
the extra density. Root/fifth tuning, left/right placement and existing reverb
routing stay intact. This is still a synthetic FM rock palette.

The tom replaces the pitched kick sweep with a short two-pair FM body, an
inharmonic partial and a very short filtered-noise stick transient. The intent
is a more defined hit with less falling, round body. The established kick,
snare, closed/open hats and crash stay unchanged, including their pattern cells.

After Image replaces its detuned low saw with a single saw plus a centered
sine sub. Separate lower/upper-pulse instruments keep the sub at the same low
root while the original upper voice alternates octaves: octave -1 beneath low
notes and -2 beneath high notes. The resulting sub roots span roughly 29–44 Hz.
Both layers have short attacks, shaped decay and release gaps between pulses.
Bass note pitches, levels and rhythm are unchanged; upper pulses select the
second bass instrument. The low layer stays dry and centered.

To serve the dark-synthwave brief, the lead moves down one octave and its low-pass
cutoff falls from 2600 to 1450 Hz. Pad FM index and modulator levels are reduced
to soften upper harmonics. The chord voicings, slow pad motion, phrasing and
snare remain intact. Darkness comes from register, tonal balance and a more
consistent low foundation, without removing the harmonic content.

## Listening files

Each track has a complete revised demo and a short **BEFORE then AFTER** file.
The comparison uses the last two pocket bars, full two-bar transition/fill,
first two full-section bars, then two release bars per half. Render each half
from fresh state; apply one common gain per track without per-half normalization
or an added limiter. Full-before exports are also retained in the artifact
folder for reference but need not be sent again.

| Track | Complete demo | After begins in A/B | Total A/B |
|---|---:|---:|---:|
| Fault Line | 0:49.524 | 0:15.238 | 0:30.476 |
| After Image | 0:57.778 | 0:17.778 | 0:35.556 |

The whole Fault Line opens up at 0:26.667; After Image's main lead enters at
0:31.111. The earlier demos are still available in rock-wave-sketches-i.

## Reproduction and validation

```sh
sigil docs/music/tools/rock-wave-refine.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/rock-wave-ii-replay

# Repeat for fault-line and after-image with fresh external output directories.
sigil docs/music/tools/expression-render.sgl --stage native \
  --input "$PWD/docs/music/alternates/rock-wave-sketches-ii/fault-line" \
  --motif "$PWD/build/dev/bin/motif" --output /absolute/external/fault-line
sigil docs/music/tools/expression-render.sgl --stage delivery \
  --input "$PWD/docs/music/alternates/rock-wave-sketches-ii/fault-line" \
  --gain-db 0.1 --output /absolute/external/fault-line
# For after-image, request --gain-db 2.7. Each set is capped at -2 dBTP
# before encoding; both comparison halves and full files share the same gain.
```

The shared renderer's optional `--gain-db` preserves its prior -0.5 dB default.
It lets a new comparison approach its previous listening level while retaining
one common gain and peak ceiling. Decoded OGG must remain below -1 dBTP and
full endings below -70 dBFS. It does not normalize away the revised bass weight.

The Sigil revision tool asserts preserved Fault Line patterns, After Image
patterns after normalizing the lead octave/sub selector, and every untargeted
instrument. All 22 generated files reproduce exactly. Full-score audits check
canonical data, fixed timing, compiled attack positions, voice budgets, finite
transport and released gates. All fifteen maintained-song checks pass.

Supporting full-context band measurements show 28–65 Hz mean energy rising
from -32.7 to -30.0 dBFS in After Image, with broadband mean rising only 0.8 dB.
Fault Line's 1.5–5 kHz band rises 0.9 dB while broadband mean falls 0.6 dB.
These establish a tonal change rather than a uniform gain increase, but they
include the whole mix and cannot establish subjective guitar bite or bass feel.
The final choice remains a listening decision.

Audio, exact commands, native measurements, spectral-check script/logs and
renderer identity are under ~/artifacts/crash-the-stack-album/rock-wave-sketches-ii/.

## Delivery record

Source commit **139258b**. Telegram acknowledged Fault Line A/B as **1177**,
its complete revised demo as **1178**, After Image A/B as **1179**, and its
complete revised demo as **1180**. The original full demos were retained locally.
All six encoded reference/delivery files have hashes in `encoded.sha256`.

| Export | LUFS-I | dBTP | Common gain |
|---|---:|---:|---:|
| Fault Line A/B | -19.2 | -3.3 | 0 dB |
| Fault Line revised demo | -20.0 | -2.0 | 0 dB |
| After Image A/B | -18.9 | -1.9 | +1.7 dB |
| After Image revised demo | -19.3 | -2.8 | +1.7 dB |

Each full ending peaks at -91 dBFS over the last second. Both revised full
scores retain zero compiled clock error (585 and 468 attacks respectively),
released final gates and passing voice budgets. Delivery duration/format checks
pass. Full before/after native loudness is -19.7/-20.1 LUFS for Fault Line and
-21.1/-21.0 for After Image; the A/B gain is identical within each track.
Listening approval remains pending.
