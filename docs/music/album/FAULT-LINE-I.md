# Fault Line: full composition I

A 3:02.857 album audition expanding the approved Style VII riff into a complete
rock/electronic arrangement. It is a candidate addition, not yet a published
soundtrack track. The existing fifteen tracks and the game tune assets are
unchanged. Intended game roles are a rhythm challenge or high-pressure sequence;
the new calm material also supplies a quieter exploration of the same theme.

## Form and listening guide

| Time | Section | Intent |
|---|---|---|
| 0:00 | Signal in the dark | Minor/major FM veils; clean guitar enters halfway through, bass late |
| 0:15 | Calm theme | A complete picked-guitar motif over restrained half-time kit and bass |
| 0:30 | Calm answer | Quiet answering harmonics and electronic glints |
| 0:46 | Main riff | Accepted syncopated guitars and aligned bass, unchanged |
| 1:01 | Electric theme | Compact version of the clean motif played by the distorted lead |
| 1:16 | Exposed harmonic middle | Kit drops away; chord order changes to G minor, B-flat, D minor, A minor |
| 1:31 | Pulse returns | The middle gains quiet drums and answering notes |
| 1:47 | Pressure rises | Four-bar drum build, keeping the clean theme audible |
| 1:54 | Moving entrance | Accepted two-bar transition |
| 1:58 | Bent solo | Accepted high pentatonic solo and its bends |
| 2:13 | Theme in full | The recurring melodic theme over the more forceful backing |
| 2:29 | Final riff | Theme continues over the more restrained original pocket |
| 2:44 | Clean afterimage | Distortion and kit withdraw; shorter clean reprise |
| 2:51 | D minor landing | E/F color resolves to D as successive notes soften |
| 2:59 | Room tail | Final gates are released; two bars for decay |

The rock kit, picked bass, distorted guitars and solo patches are retained
exactly from VII. Four instruments are added: a clean FM guitar, minor and major
FM veils, and a short electronic glint. The pad contains two slowly entering
carrier tones rather than a large wash. It uses modest stereo placement and
reverb; no large noise swell or extra sub layer was added. The clean motif uses
occasional ninth/major-seventh color while the riff keeps the darker foundation.

The mix bus retains the same compressor and room settings with makeup reduced
to -3 dB for native rendering headroom. Both game and album share this setting.
Listening export adds only measured clean gain, capped to leave at least 2 dB
of measured native peak margin. This is an arrangement audition, not a release
master; no loudness normalization or new limiting is used.

## Shared game draft

`docs/music/songs/fault-line/parts.cts` and `arrangements.sgl` are the maintained
source. `docs/music/songs/fault-line.sgl` regenerates both outputs and records
maps/hashes, with the same tracker-edit protection as the existing songs.

The generated game draft is `docs/music/alternates/fault-line-game.cts`:

- Orders 0–1: sixteen calm bars; B00 repeats the calm section.
- Order 2: the two-bar moving transition.
- Orders 3–5: twenty-four tense bars: riff, electric theme and bent solo; B03
  repeats the tense section.
- Future game integration needs fill/tense boundaries `[2, 3]`. The draft is not
  registered in game selection or the catalog yet.

All six game phrases are shared exactly with the album. The listening render
plays calm, transition and tense once, then adds two release bars (1:23.810).
Its native snapshot removes only loop commands; the real game draft keeps them.
The tense entrance is at 0:34.286 in that listening file.

## Reproduction and review

Use the shared files for future edits; the initial composer is historical and
refuses overwriting differing generated scores. It can reproduce its initial
source package in a fresh temporary folder:

```sh
sigil docs/music/tools/fault-line-compose.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/fresh-fault-line-composition
sigil docs/music/songs/fault-line.sgl --stage check --motif "$PWD/build/dev/bin/motif"
sigil docs/music/tools/fault-line-composition-audit.sgl --output /tmp/fault-line-checks
sigil docs/music/tools/fault-line-render.sgl --stage native --variant album \
  --motif "$PWD/build/dev/bin/motif" --output /absolute/fresh/render-directory
sigil docs/music/tools/fault-line-render.sgl --stage delivery --variant album \
  --motif "$PWD/build/dev/bin/motif" --output /absolute/fresh/render-directory
```

Use `--variant game` for the complete calm/fill/tense audition. Native WAV,
listening WAV, FLAC and OGG, source snapshots, commands, renderer identity and
measurements live outside the repo in
`~/Ops/artifacts/crash-the-stack-album/fault-line-composition-i/`.

Validation checks the original twelve patches and exact accepted riff,
transition and solo; six shared game/album phrases; game loop boundaries;
finite sample-clock timing; channel voice budgets and final gates. Initial album
check: 1,980 attacks, zero sample-clock error, no off-grid 32nd-note attacks,
and all final gates released. All sixteen shared compositions regenerate,
including the fifteen published titles. The initial four composition files
reproduce exactly. Listening feedback still decides whether the new themes,
section lengths and contrasts work.

## Listening export measurements

Both native renders passed without clipping. Album: +2.8 dB clean export gain,
-20.2 LUFS-I, 16.4 LU range, -1.9 dBTP decoded OGG, final second -84.3 dBFS.
Game preview: +2.7 dB gain, -20.0 LUFS-I, 10.1 LU range, -2.0 dBTP, final
second -78.3 dBFS. The different gains retain the same peak-margin policy;
these are not equal-loudness comparisons. All duration/format/tail checks pass.
The game preview has 1,119 attacks, zero sample-clock error and released gates.
Shared-source propagation, drift detection, tracker-edit protection and
whole-batch preflight tests pass.

Composition II supersedes this initial form; see [the rock-led revision](FAULT-LINE-II.md).
The commands and audits above describe the first composition at commit 67d2ae0.
Its audio and source snapshots remain preserved for comparison.
