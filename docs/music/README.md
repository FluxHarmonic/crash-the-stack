# Crash The Stack music library

This directory preserves the soundtrack's musical decisions, authoring tools
and review process. The collection contains sixteen completed compositions and a separate
accepted Black Glass title arrangement. Historical versions remain available.
The published fifteen-track album and the new Fault Line composition/master
are documented in [album/ALBUM.md](album/ALBUM.md).

## Start here

- [SOUNDTRACK.md](SOUNDTRACK.md): accepted sources, identities and listening decisions.
- [AUDIO-REVIEW-PROCESS.md](AUDIO-REVIEW-PROCESS.md): the reusable workflow for
  composing, checking timing, investigating patch behavior, measuring renders,
  listening, preserving provenance and delivering auditions. Use this as the
  starting point for future games and music projects.
- [tools/README.md](tools/README.md): current Sigil shell commands, source
  selection, editable recipes, exports, verification and credential-independent delivery.
- [ALBUM-PLAN.md](ALBUM-PLAN.md): proposed fifteen-track album, arrangement
  development and mastering approach; Quiet Array and Black Glass are the pilots.

## Musical development and lessons

- [TIMING.md](TIMING.md), [PHRASES.md](PHRASES.md) and [DARKER.md](DARKER.md):
  grid placement, complete musical phrases and the darker game identity.
- [MODES.md](MODES.md), [ADAPTIVE.md](ADAPTIVE.md), [REVISIONS.md](REVISIONS.md),
  [LISTENING-III.md](LISTENING-III.md), [LISTENING-IV.md](LISTENING-IV.md) and
  [DIRTY-CALM-II.md](DIRTY-CALM-II.md): game roles, legacy reharmonization,
  perceived pluck attacks and meaningful calm/tense contrast.
- [DRUM-KITS.md](DRUM-KITS.md), [MACHINE-SIGNAL-KITS.md](MACHINE-SIGNAL-KITS.md),
  [KIT-FILLS-II.md](KIT-FILLS-II.md), [PAPER-SWELL.md](PAPER-SWELL.md) and
  [GLASS-BASEMENT-BALANCE.md](GLASS-BASEMENT-BALANCE.md): distinct percussion,
  coherent fills, restrained transitions and foreground balance.
- [PUZZLE-PAIR.md](PUZZLE-PAIR.md), [FINAL-PAIR.md](FINAL-PAIR.md),
  [CLOCK-ROOM-II.md](CLOCK-ROOM-II.md) and the OBSIDIAN-II/III/IV reports:
  puzzle identities, harmonic support, stereo detail and audibility checks.
- The BLACK-GLASS-TITLE I/II/III/IV reports: title-screen form, gritty bass
  balance, FM melody and the accepted rapidly cycling tracker chord stabs.
- [REPORT.md](REPORT.md): original synth capabilities, export work and early review.

These are chronological records. Older proposals and mixes are retained as
history; SOUNDTRACK.md and catalog.json identify the current accepted versions.

## Sources and evidence

Shipping scores live in ../../assets/tunes. alternates/ holds all 52 exact
historical source snapshots, including the original accepted audition headers.
presets/ holds three authoring catalogs; recipes/ contains editable composition
data used by the Sigil tools. No Python runtime is required.

[MIGRATION.md](MIGRATION.md) and migration-map.json map every moved original
file and cite its Motif authoring commits. The former Python implementations
and original document text remain recoverable from those commits. The original
handoff inventory is preserved in provenance/motif-handoff.json.

[SIGIL-PORT.md](SIGIL-PORT.md) records equivalence checks, negative controls,
API observations and the successful real Telegram delivery. validation/ stores
the migration's test and audit evidence. handoff.json indexes current files and
the external Ops audio collection, including earlier WAV/OGG renders, source
snapshots, checksums, measurements and audit scripts. Audio stays out of git.
Credentials are excluded from the library and all inventories.

Runtime selection and in-game loop/transition checks belong to the integration
owner. Offline compilation and render checks do not stand in for those tests.
