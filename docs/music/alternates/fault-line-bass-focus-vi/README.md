# Fault Line: focused picked bass VI

David found Style V's bass too mobile to follow harmonically and too round/subby
to hear its notes clearly. This pass simplifies the bass and changes its timbre.
The accepted guitar groove, forward-moving entrance, bent lead and entire drum
performance remain unchanged. This remains a short style audition.

## Musical change

The bass now uses a repeating two-bar root-led motif: four attacks per bar,
mostly the chord root, with one brief fifth response in the first bar of each
pair. It shares strong anchors with the riff but keeps offset answers, instead
of either duplicating every guitar note or running a separate moving melody.
Root changes still follow D, B-flat, G and A. Passing-note runs and repeated
register leaps are removed. The entrance follows the same simple idea, then
anticipates D with the final two hits; its moving guitar/kick pattern is intact.

The D anchors move from D1 to D2. The part now bottoms at G1 (about 49 Hz),
keeping the pitch pattern in a more audible register. Its 132 previous attacks
become 90, and consecutive pitch changes fall from 121 to 32. Forty-three new
attacks still fall between guitar strikes, so there is some independence without
the previous countermelody's density.

The sine layer falls from relative volume 0.5 to 0.12 (about -12.4 dB), with
shorter decay/sustain/release. The FM bass gets a stronger octave carrier,
harmonic 2:1 and 4:1 modulation, a firmer transient, modest extra drive and less
sustain. The aim is a picked, slightly gritty midrange that communicates pitch,
with a small fundamental layer supporting it. Output gain remains 0.9; no
other instrument or bus definition changes. This is a balance and articulation
revision, not an additional lead voice.

## Listening guide

The complete revised demo is **49.524 seconds**. The **38.095-second A/B** plays
Style V first, then Style VI at **0:19.048**. Each half covers four pocket bars,
the moving two-bar entrance, two solo bars and two release bars. Monitoring gain
is common to before/after and complete references; there is no individual
normalization or added limiter. The previous version stays available separately.

## Reproduction and validation

```sh
sigil docs/music/tools/fault-line-bass-focus.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/fault-line-vi-replay
sigil docs/music/tools/expression-render.sgl --stage native \
  --input "$PWD/docs/music/alternates/fault-line-bass-focus-vi" \
  --motif "$PWD/build/dev/bin/motif" --output /absolute/fresh/artifacts
sigil docs/music/tools/expression-render.sgl --stage delivery \
  --input "$PWD/docs/music/alternates/fault-line-bass-focus-vi" \
  --gain-db -1.3 --output /absolute/fresh/artifacts
sigil docs/music/tools/fault-line-bass-focus-audit.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /absolute/fresh/artifacts
```

The generator checks non-bass score preservation. The dedicated audit checks
identical compiled ticks on all seven other channels, identical other instrument
definitions, fewer bass attacks/pitch changes and retained rhythmic independence.
The finite audit reports 709 attacks with zero sample-clock error, no 32nd-note
attacks, released final gates and passing voice budgets. Exact lead tick equality
preserves the previous five-bend proof. All seven generated files reproduce,
and all fifteen maintained-song regeneration checks pass.

Full-context band measurements show 30–110 Hz mean energy down 0.7 dB,
180–1400 Hz up 0.2 dB and broadband mean down 0.2 dB. These measurements combine
writing and patch changes in the entire mix; they do not isolate bass harmonics
or establish whether its pitches are clear to a listener. The listening copy
is the decision point.

Audio and exact native/delivery commands, snapshots, renderer identity, audit
records and supporting tone-measurement script/logs live at
~/Ops/artifacts/crash-the-stack-album/fault-line-bass-focus-vi/.
No maintained game/album song or public audio changes in this pass.

## Delivery measurements

The requested -1.3 dB delivery gain was capped to **-1.9 dB** for every
reference to retain peak headroom. Decoded OGG: A/B -19.7 LUFS-I / -3.5 dBTP;
previous full -19.8 / -2.9; revised full -19.8 / -2.1. All delivery duration,
peak and ending checks pass. These are audition copies, not album masters.

Delivered 2026-09-23: Telegram acknowledged A/B message 1187 and full revised
demo message 1188. Source/validation commit: 4373dac. Encoded file hashes are
in encoded.sha256. The previous full reference is retained locally.
