# Shared game and soundtrack migration

David requested that approved musical changes stay in sync between the game
and longer, independently listenable album arrangements. He also requested
committing the combined and generated versions, with tracker edits reconciled
back into the combined source rather than overwritten.

All fifteen songs are migrated to [shared song sources](songs/README.md).
There are 31 generated tune arrangements: fifteen game, fifteen album, and
Black Glass's title screen. Source pools deduplicate identical instruments and
phrases; layouts retain deliberate variations, original entry gates, chart
metadata, loop destinations and album form. Album maps now identify these
shared sources and regenerate from the same layout.

## Approved synchronization

- Relay Ghost's game instrument bank now matches album II: contact/dust drums,
  original bell/pluck, and gritty bass output down 2 dB. Notes and game loops
  remain unchanged. The album score is byte-identical to its published revision.
- Breach Vector's approved Phrases I and Percussion I become the current album
  score. The game receives the same snare and the applicable late pipe/signal
  replies in patterns 34/35, preserving its original entry gates and B11 loop.
  Album-only bridge/development remains explicitly named material. Both forms
  refer to the same accepted patch bank and shared revised late phrases.
- Obsidian Index's previously approved Tension V accompaniment is now in the
  game tense patterns 5–8 as well as album II. Calm/fill, main melody, pads and
  B05 remain. Its album score is unchanged.
- The other twelve game tunes, Black Glass title, and the other fourteen album
  scores remain byte-identical. Black Glass's role-specific patches are explicit
  variants rather than duplicated, silently independent authoring files.

## Integration boundary

This work updates source and generated score assets in `task-codex-album`.
The user's explicit synchronization request supersedes the original album-only
restriction on editing `assets/tunes/`; no runtime source or package dependency
is changed. Asset provenance rows identify the new authoring sources.

Relay Ghost's exact trim requires Motif commit `b0d135e` from
`feat/codex-expression` before the game uses these scores. The builder rejects
older readers that drop instrument gain. That feature is not yet on the local
Motif main branch, and its web build has not been validated here. Merge/release
and wire the runtime dependency during game integration; score synchronization
is not a claim that the currently deployed game has been upgraded.

Release handoff: validate the instrument-gain feature in Motif's web build,
merge and publish a Motif update, then bump Crash's dependency and verify Relay
Ghost's gritty bass trim in browser playback alongside the existing tunes.
This small engine update need not wait for the remaining musical improvements;
composition and patch changes can continue through the shared-source workflow.

No game/site deployment or new public audio release is part of this migration.
The public Breach Vector MP3 still precedes the recently approved phrase/snare
pass; regenerate its master and publish that revision separately. The MP3
exporter's source-snapshot check prevents silently using its stale master.
No lossless or encoded audio is committed.

## Validation and workflow

The importer reconstructed every intended score from shared parts and layouts.
The generated proposal changed only the three game scores and Breach Vector
album score listed above. All other tune outputs compare byte for byte.
The unchanged loop controls and the new game phrase timing are checked with
Motif's compiled tick audit. The asset-manifest test covers the generated files.

The isolated Sigil tests edit a shared instrument and a shared phrase, verify
both game and album propagation, then modify a generated tracker file in the
last song of a batch. The entire batch must refuse to write, retaining the
edited file and all earlier outputs. Reconciliation restores generation and
an exact check passes. The old renderer rejection is also exercised separately.

All fifteen regeneration checks and 209 asset-manifest tests passed. The three
updated game scores have zero sample error in compiled note timing and retain
their respective loop destinations (Relay 6, Breach 17, Obsidian 5).

Read [the authoring workflow](songs/README.md) before editing. Commit the source
pool, arrangement map, generated scores, album maps and hash receipt together.
Run `sigil docs/music/tools/songs.sgl --stage check` with the feature renderer
as the regeneration gate. The previous authoring scripts are retained for
historical reconstruction and auditions, not as a second current source.
