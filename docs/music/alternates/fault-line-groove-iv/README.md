# Fault Line: syncopated groove IV

David approved Style III's heavier direction, then asked for a less basic rock
pattern and more rhythmic character. This pass changes the rhythm composition
while preserving the accepted instrument bank and higher pentatonic lead with
bends. The complete audition remains 26 bars at 126 BPM, 49.524 seconds.

## Musical change

The main riff has a recurring two-bar call and reply. The call uses clipped
strikes on rows 0, 6 and 10, an open accent at 16, a quick third/fourth turn at
20/22 and a return at 28. The reply changes the placement: 0/4, a longer chord
at 12, a melodic answer at 18 and late strikes at 26/30. Those placements leave
a mix of clear snare space, short bursts and held accents. Notes stay on the
sixteenth-note grid; the syncopation is written, not randomized timing.

The fourth bar is a sparser answer with an open chord at 18 and space before
28. The eighth bar changes again, holding an accent at 16 and using short D
pickups at 26/30. This creates a recognizable motif with phrase punctuation
instead of repeating one pattern unaltered at every chord. The D/B-flat/G/A
harmonic framework stays recognizable; brief melodic turns now also move the
bass, rather than leaving a static root under every guitar gesture.

Bass and both guitars share attack positions and pitch motion, with the bass
one octave below the guitar roots. Shorter bass gates keep the bottom from
smearing the rests. Selected riff hits also trigger the kick. The two guitars
stop together rather than leaving a sustained right-hand chord across the gaps.
The transition follows the same accent language and hints at D before the solo.

Patches, instrument output gains, distortion/layer ratios and bus are unchanged.
The bent lead, snare, hats, toms and crash retain their exact compiled tick tables.
The new rhythm has its own per-note accents and shorter chord gates. One routing
consequence is retained deliberately: the right guitar first plays its muted
instrument, whose existing send is 0.025 rather than the open instrument's 0.055.
Motif takes channel send from the first played instrument, so that side is a
little drier. Pan remains the same. No new synth feature was needed.

## Listening guide

The **38.095-second A/B** plays Style III first, then Style IV at **0:19.048**.
Each half has four bars of the pocket without lead, four bars beneath the bent
solo, then two release bars. The full revised short demo remains **49.524 seconds**,
with the solo entering at **0:26.667**. Both halves and full references use one
common -1.3 dB monitoring gain, with no individual normalization or extra limiter.
Full native loudness rounds to -18.5 LUFS-I for both before and after.

## Reproduction and checks

```sh
sigil docs/music/tools/fault-line-groove.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/fault-line-iv-replay
sigil docs/music/tools/expression-render.sgl --stage native \
  --input "$PWD/docs/music/alternates/fault-line-groove-iv" \
  --motif "$PWD/build/dev/bin/motif" --output /absolute/fresh/artifacts
sigil docs/music/tools/expression-render.sgl --stage delivery \
  --input "$PWD/docs/music/alternates/fault-line-groove-iv" \
  --gain-db -1.3 --output /absolute/fresh/artifacts
sigil docs/music/tools/fault-line-groove-audit.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /absolute/fresh/artifacts
```

The generator checks preservation of the bank and untouched pattern channels.
The compiled audit verifies 137 aligned bass/guitar strikes, their octave/pitch
relationship, 84 kick accents on riff attacks and unchanged lead/kit performance.
The finite score has 742 attacks, zero sample-clock error, no 32nd-note attacks,
released final gates and passing voice budgets. Because the lead tick table is
identical to Style III, its five previously audited bends are retained exactly.
All seven generated files reproduce; all fifteen maintained-song checks pass.
Audio measurements do not establish subjective musical quality.

External audio and exact native/delivery commands live at
~/Ops/artifacts/crash-the-stack-album/fault-line-groove-iv/.
The comparison OGG measures -19.4 LUFS-I/-3.8 dBTP; the full revised demo is
-19.7 LUFS-I/-3.8 dBTP. The complete before reference is retained locally.
This remains a style audition. The official game/album tracks and public site
are unchanged, and After Image remains at its dark-synthwave revision.

## Delivered review copy

Source commit: **2e930a2**. Telegram acknowledged the Style III/IV comparison
as **1183** and the complete revised short demo as **1184**. `encoded.sha256`
records all retained reference and delivered OGG files. Both full endings peak
at -91 dBFS over the last second. Duration, stereo 44.1 kHz, encoded peak and
release checks pass. Listening feedback remains pending.
