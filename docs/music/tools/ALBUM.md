# Album authoring and audio review

These new tools extend the migrated Sigil workflow without changing game tools,
runtime code or assets. Use Sigil 0.22.2+, a Motif CLI with the accepted synth
features, and FFmpeg with libvorbis, ebur128, alimiter and FLAC support.

```sh
export MOTIF_BIN=/path/to/motif
sigil docs/music/tools/album-compose.sgl --output docs/music/album
sigil docs/music/tools/album-check.sgl --output /absolute/external/pilot-version
sigil docs/music/tools/album-render.sgl --output /absolute/external/pilot-version
sigil docs/music/tools/album-check-renders.sgl --output /absolute/external/pilot-version
sigil docs/music/tools/album-compare.sgl --output /absolute/external/pilot-version
```

`album-compose` authors both pilots from the accepted game references, explicit
new phrases and section transforms. It refuses to overwrite a differing score;
review revisions deliberately and preserve them in Git. Its .cts files are the
album arrangements; the adjacent maps record section times and source lineage.
Recomposing into a temporary directory must reproduce the committed scores.

`album-check` checks canonical scores, exact titles, finite order traversal,
fixed clock, onset grids, voice budgets and final gate release. It compares
every expected note attack with Motif's compiled sample timestamp. These pilots
have no thirty-second attacks; the Black Glass transition comes from the title
arrangement rather than the game's original roll. Tracker 0xy chord cycling
changes pitch inside an envelope and does not create extra note attacks.

`album-render` requires an absolute output directory outside the repository.
Choose a fresh version directory. It records source snapshots, source and binary
hashes, exact render/encode argv, metadata, lossless originals and measurements.
Use repeated --track flags to select pilots; the default is both. WAV and FLAC
are 16-bit, stereo, 44.1 kHz; OGG quality 7 lives in ogg/. The current clean gain
and controlled-comparison recipes are explicitly draft settings in the script.
No credential location or Telegram sending is built into rendering.

`album-check-renders` verifies source snapshot parity, full durations across all
three formats, WAV/FLAC decoded PCM identity, a -1 dBTP maximum for clean WAV and
decoded OGG, and a final second below -70 dBFS. Its JSON report combines loudness,
dynamics and peak measurements. It does not certify the musical quality or
choose a final mastering target.

`album-compare` uses that report to attenuate the controlled candidate to the
clean audition's integrated loudness. Compare full files at matched loudness
before judging whether peak control helps; then compare the proposed levels in
album context. Inspect the generated loudness logs to confirm the match. Neither
controlled candidate is sent automatically or designated a release master.

Explicitly selected full auditions can be sent with the existing tool:

```sh
sigil docs/music/tools/send-telegram.sgl --env-file /path/to/private.env /absolute/external/pilot-version/ogg/black-glass.ogg
```

See [album sequence](../album/ALBUM.md), [mastering decisions](../album/MASTERING.md)
and [pilot report](../album/PILOT-I.md). All audio, comparison files and raw logs
stay under the external album artifact folder.

## Sending the mastering trial

After `album-compare` has prepared both full comparison variants, package them in
a fresh external directory:

```sh
sigil docs/music/tools/album-master-trial.sgl --input /absolute/external/pilot-i --output /absolute/external/master-trial-i
```

This produces full `matched` and `album-level` WAV/FLAC/OGG versions with clear
filenames and draft-master comments. Both retain the exact soundtrack title in
metadata. All four encodes are checked before manual selection for Telegram;
the tool itself never sends messages or reads credentials. See
[the trial listening guide](../album/MASTER-TRIAL-I.md).

## Opening pair: Cold Boot and Relay Ghost

The next pair uses a shared finite-arrangement helper and a renderer with separate
native and master stages, allowing gain decisions after measuring synthesis.

```sh
sigil docs/music/tools/album-compose-opening.sgl --output docs/music/album
sigil docs/music/tools/album-audit.sgl --output /absolute/external/opening-pair-i
sigil docs/music/tools/album-batch-render.sgl --stage native --output /absolute/external/opening-pair-i
sigil docs/music/tools/album-batch-render.sgl --stage master --track cold-boot --gain 1.5 --output /absolute/external/opening-pair-i
sigil docs/music/tools/album-batch-render.sgl --stage master --track relay-ghost --gain -0.5 --output /absolute/external/opening-pair-i
```

Supply MOTIF_BIN or --motif for compilation/synthesis. The default two tracks are
Cold Boot and Relay Ghost. Stage master requires an explicit gain and matching
native source snapshot. It preserves the native WAV and refuses to overwrite an
existing master. The full OGG filenames end in -album-i.ogg; WAV and FLAC use the
same album-i label. Do not run both stages concurrently for the same title.

The new `album-audit` also accepts --track black-glass and --track quiet-array;
it carries explicit policies for all four completed arrangements. This extends
the pilot audit to retain the opening pair's intentional transition rolls rather
than quantizing them away. The new `(crash soundtrack album arrangement)` module
shares the original composer's pattern transformations, canonical writing and
section maps without altering the accepted pilot composer.

See [OPENING-PAIR-I.md](../album/OPENING-PAIR-I.md) for the musical plan, section
landmarks and verification results. No scripts read Telegram credentials during
composition, rendering or mastering; sending remains a separate explicit step.

## Signals pair: Closed Loop and Shadow Protocol

```sh
sigil docs/music/tools/album-compose-signals.sgl --output docs/music/album
sigil docs/music/tools/album-audit.sgl --track closed-loop --track shadow-protocol --output /absolute/external/signals-pair-i
sigil docs/music/tools/album-batch-render.sgl --stage native --track closed-loop --track shadow-protocol --output /absolute/external/signals-pair-i
sigil docs/music/tools/album-batch-render.sgl --stage master --track closed-loop --gain 3 --output /absolute/external/signals-pair-i
sigil docs/music/tools/album-batch-render.sgl --stage master --track shadow-protocol --gain 2.5 --output /absolute/external/signals-pair-i
```

Set MOTIF_BIN or supply --motif for synthesis and compilation. The default batch
selection remains Cold Boot and Relay Ghost; select this pair explicitly. The
six-title audit now accounts for Shadow Protocol's native speed-6, sixteen-row
bars. Its deliberate sixteenth syncopation and lead slides remain intact. Shared
section maps derive duration from speed/tempo and bar length from the meter;
an absent meter uses the native default (4 4). Use `phrase-rows` when authoring
on that clock; the original `phrase` convenience remains thirty-two rows/bar.

See [SIGNALS-PAIR-I.md](../album/SIGNALS-PAIR-I.md) for arrangement landmarks and
checks. The new composer and the prior opening composer both reproduce their
scores and maps byte-for-byte after the shared clock support was added.

## Air pair: Blind Spot and Sector Drift

```sh
sigil docs/music/tools/album-compose-air.sgl --output docs/music/album
sigil docs/music/tools/album-audit.sgl --track blind-spot --track sector-drift --output /absolute/external/air-pair-i
sigil docs/music/tools/album-batch-render.sgl --stage native --track blind-spot --track sector-drift --output /absolute/external/air-pair-i
sigil docs/music/tools/album-batch-render.sgl --stage master --track blind-spot --gain 3 --output /absolute/external/air-pair-i
sigil docs/music/tools/album-batch-render.sgl --stage master --track sector-drift --gain 3.5 --output /absolute/external/air-pair-i
```

Set MOTIF_BIN or supply --motif for compilation/synthesis. The default selection
still remains Cold Boot and Relay Ghost; explicitly select the air pair. Both
use the speed-3 grid, with no off-sixteenth rhythmic attacks. The melodic signals
are checked on eighths. See [AIR-PAIR-I.md](../album/AIR-PAIR-I.md) for arrangement
landmarks and technical results. These additions only extend the registry;
previous scores and mastering settings are unchanged.

## Pocket pair: Dirty Cache and Basement Circuit

```sh
sigil docs/music/tools/album-compose-pocket.sgl --output docs/music/album
sigil docs/music/tools/album-audit.sgl --track dirty-cache --track basement-circuit --output /absolute/external/pocket-pair-i
sigil docs/music/tools/album-batch-render.sgl --stage native --track dirty-cache --track basement-circuit --output /absolute/external/pocket-pair-i
sigil docs/music/tools/album-batch-render.sgl --stage master --track dirty-cache --gain -1.5 --output /absolute/external/pocket-pair-i
sigil docs/music/tools/album-batch-render.sgl --stage master --track basement-circuit --gain 0 --output /absolute/external/pocket-pair-i
```

Set MOTIF_BIN or supply --motif for compilation/synthesis. Explicitly select this
pair; batch defaults remain Cold Boot and Relay Ghost. Dirty Cache joins Shadow
Protocol's speed-6 clock policy, retaining legitimate sixteenth syncopation.
Basement Circuit retains four intentional thirty-second roll hits in album
pattern 7 and its acid portamento; only its bell is subject to the eighth-grid
check. Dirty Cache's on-beat plucks receive that check on channel 7.

See [POCKET-PAIR-I.md](../album/POCKET-PAIR-I.md) for full section landmarks and
measurements. Both scores/maps regenerate exactly, and both banks/buses match
the accepted game sources. No new Sigil shell or synth feature was required.

## Stone pair: Dead Sector and Obsidian Index

```sh
sigil docs/music/tools/album-compose-stone.sgl --output docs/music/album
sigil docs/music/tools/album-audit.sgl --track dead-sector --track obsidian-index --output /absolute/external/stone-pair-i
sigil docs/music/tools/album-batch-render.sgl --stage native --track dead-sector --track obsidian-index --output /absolute/external/stone-pair-i
sigil docs/music/tools/album-batch-render.sgl --stage master --track dead-sector --gain 3 --output /absolute/external/stone-pair-i
sigil docs/music/tools/album-batch-render.sgl --stage master --track obsidian-index --gain 5 --output /absolute/external/stone-pair-i
```

Set MOTIF_BIN or supply --motif for compilation/synthesis. Explicitly select the
pair; batch defaults remain Cold Boot and Relay Ghost. Both use the speed-3 grid
with no thirty-second attacks. The probe/glass and answering voices stay on
eighths. Obsidian's additional audit requires main/side pad roots, voicings and
gates to agree, and at least six rows of release before the next chord, including
section boundaries. Missing releases are rejected even if the earlier gap was
long enough. Negative controls cover missing release, short gap, wrong voicing
and wrong root; the raw check script/result accompanies the external renders.

See [STONE-PAIR-I.md](../album/STONE-PAIR-I.md) for arrangement landmarks and
measurements. Scores/maps reproduce exactly; instrument banks and buses match
the game references, including the accepted Waves IV pad and pedal balance.

## Edge pair: Breach Vector and Clock Edge

```sh
sigil docs/music/tools/album-compose-edge.sgl --output docs/music/album
sigil docs/music/tools/album-audit.sgl --track breach-vector --track clock-edge --output /absolute/external/edge-pair-i
sigil docs/music/tools/album-batch-render.sgl --stage native --track breach-vector --track clock-edge --output /absolute/external/edge-pair-i
sigil docs/music/tools/album-batch-render.sgl --stage master --track breach-vector --gain 0.5 --output /absolute/external/edge-pair-i
sigil docs/music/tools/album-batch-render.sgl --stage master --track clock-edge --gain 3 --output /absolute/external/edge-pair-i
```

Set MOTIF_BIN or supply --motif for compilation/synthesis. Explicitly select the
pair. Breach retains speed 4, the default (4 4) display grouping and its original
64-row motifs. Do not apply the speed-3 scores' odd-row or eighth-grid restrictions
to its written subdivisions. The exact rational sample-clock audit and slide
semantics still apply to every channel. Clock Edge retains speed 3, no off-
sixteenth attacks, and eighth-grid bell answers; its lead uses finer subdivisions.

See [EDGE-PAIR-I.md](../album/EDGE-PAIR-I.md). Both composers' scores/maps reproduce
exactly; sound banks and buses equal the accepted sources. Only Glass Current
remains unarranged. Rhythm-game chart generation is outside this album pass.

## Closer: Glass Current

```sh
sigil docs/music/tools/album-compose-closer.sgl --output docs/music/album
sigil docs/music/tools/album-audit.sgl --track glass-current --output /absolute/external/closer-i
sigil docs/music/tools/album-batch-render.sgl --stage native --track glass-current --output /absolute/external/closer-i
sigil docs/music/tools/album-batch-render.sgl --stage master --track glass-current --gain 0 --output /absolute/external/closer-i
```

Supply --motif or MOTIF_BIN for native validation, compilation and synthesis.
See [CLOSER-I.md](../album/CLOSER-I.md). All fifteen standalone album scores
now exist. Glass preserves the original four thirty-second fill hits in album
pattern 9 and checks both answering voices on eighths. Its twelve-bar coda is
split into eight- and four-bar patterns to respect the native row limit.

## Listening page

`album-listening-site.sgl --artifacts /absolute/album-render-root --output
/absolute/new-preview` builds a static `soundtrack/` directory with the current
fifteen album-level MP3 encodes. No credentials are required.
Publish only that directory alongside the current game and tracker, never its
private sibling provenance report. See [LISTENING-PAGE.md](../album/LISTENING-PAGE.md)
for deployment integration, service-worker behavior and measurements.

`album-r2.sgl --stage prepare` splits the built listening bundle into a small
Pages player with absolute asset URLs and a private R2 upload plan. Supply
--bundle, --output, --bucket, --prefix and --asset-base; the base URL includes
the prefix and ends in /. `--stage upload --output ...` uses Wrangler's existing
authentication and resumes from successful per-object hash receipts. Revised
audio needs a new version prefix because published objects are immutable-cached.

## Automatic MP3 metadata and cover artwork

Generate a complete new MP3 listening bundle from the selected album masters:

```sh
sigil docs/music/tools/album-listening-site.sgl \
  --artifacts /absolute/crash-the-stack-album \
  --output /absolute/new-tagged-listening-bundle
```

This encodes all fifteen masters at 256 kbps, embeds Cover I as front-cover art,
and writes ID3v2.3 tags: artist/album artist **Crash The Stack**, individual song
title, album title, track number out of fifteen, year, CC BY 4.0 license and
**David Wilson** attribution. Each output is probed for tags, attached artwork,
audio format and expected duration. `--track black-glass` (repeatable) limits a
check or partial export while retaining the track's full-album number.

To add the same metadata to existing MP3s without re-encoding their audio:

```sh
sigil docs/music/tools/album-tag-mp3.sgl \
  --bundle /absolute/existing-local-bundle/soundtrack \
  --output /absolute/new-tagged-bundle
```

The input manifest must reference local `audio/*.mp3` files. This copies the MP3
audio packets, attaches the original PNG cover and validates tags and artwork.
Every result must decode to the exact same PCM hash as its input. Commands and
per-track checks are recorded outside the public soundtrack/ directory.
The original MP3s remain intact. Cover I is embedded without resizing, so each
file includes its 2.84 MB PNG; no additional lossy image conversion is introduced.

Both paths use `(crash soundtrack album metadata)` in lib/album-metadata.sgl.
Use the existing album-r2.sgl prepare/upload steps with a **new prefix** when
publishing changed tags. The player's Media Session metadata also supplies the
artist, title, album and cover for phone browser playback controls.
