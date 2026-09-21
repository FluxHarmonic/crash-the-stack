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
