# Breach Vector opening synth balance

David found III's muted-riff lift harmless but wanted the other opening synth
slightly more audible, without becoming the primary focus. IV raises instrument
4, the FM bass/synth audible from the start, by 15 percent in tracker levels,
rounded: its default and main accents go from 48 to 55, and octave responses
from 40 to 46. This is roughly a 1.2 dB increase in the volume multiplier;
velocity response and bus compression can affect the resulting audible change.

The FM patch, notes, timing and gates remain unchanged. Instrument 9's grit
bass levels remain unchanged in later sections. The small muted-riff lift from
III, middle-section pluck spacing, pads and every other channel are retained.
III and earlier sources/exports remain available for comparison. This pass is
still the complete legacy intro/loop arrangement, not the proposed calm/tense
adaptation. Dirty Cache III remains the accepted on-beat reference.

The new source is `docs/music/alternates/breach-vector/breach-vector-v4.cts`, titled **Breach Vector / IV**.
Its seven other compiled channel tables match III byte-for-byte, and channel
4's musical pitch/gate/trigger edges are unchanged. Only the FM bass volume
entries change. The source validates and prints canonically.

```sh
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks breach-vector-v4 --full-only --format both
```

Delivery is the full 164.571429-second track, with the OGG in `ogg/`. The
package includes the source snapshot, render commands, level measurements and
checksums.

Final WAV peak/RMS are -2.39/-18.61 dBFS with zero saturated samples. The
OGG decodes cleanly at stereo 44.1 kHz and matches the WAV duration; tagging
preserves decoded PCM. Direct WAV comparison confirms that the opening now
changes: the first 4.57143 seconds have a mixed RMS increase of 0.34 dB.
This is the whole mix measurement, not the isolated synth gain.

David accepted IV as the version to keep. It still did not match his intended
adjustment, but he liked the overall result and chose to stop refining it.
Keep this as the reference for subsequent arrangement work; do not describe
the original opening-synth request as precisely resolved. No technical issue
in the completed export checks warrants rejecting this version.
