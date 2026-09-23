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

The migration updates source and generated score assets in `task-codex-album`.
The user's explicit synchronization request supersedes the original album-only
restriction on editing `assets/tunes/`. Asset provenance rows identify the new
authoring sources.

The subsequent integration publishes Motif 0.6.6 (commit `6a788c6`) to both
Motif remotes and pins that release in Crash. It preserves Relay Ghost's exact
2 dB instrument output trim through native and web playback, note/patch edits,
and score serialization. The builder rejects older readers that drop gain.
See [integration evidence](MOTIF-066-INTEGRATION.md) for validation and deployment.

The current game mainline uses Motif scores in its tracker. Board-mode music
still plays the existing spy/groove/breaker OGG assets; changing that playback
system is separate work. Shipping synchronized tracker scores does not replace
those board-mode recordings.

Breach Vector's approved phrase/snare revision is now mastered and published as
[album II](album/BREACH-II.md). The MP3 exporter selects its verified source
snapshot and master. No lossless or encoded audio is committed.

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
Run `sigil docs/music/tools/songs.sgl --stage check` with Motif 0.6.6 or later
as the regeneration gate. The previous authoring scripts are retained for
historical reconstruction and auditions, not as a second current source.
