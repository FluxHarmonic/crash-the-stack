# Crash soundtrack ownership and handoff

The collection has moved from Motif into Crash. See MIGRATION.md and
migration-map.json for every old/new path and authoring commit. SOUNDTRACK.md
selects the accepted references; catalog.json drives the Sigil tools.

- Sixteen shipping scores in assets/tunes: fifteen compositions plus the
  accepted Black Glass / Main Theme arrangement. Their display titles are
  clean; patches, patterns, order, charts and historical metadata are intact.
- All 52 original audition sources, including exact pre-title-cleanup snapshots
  of the shipping versions, remain in docs/music/alternates/<title>/.
- Preset catalogs are authoring references in docs/music/presets. Every tune
  embeds its instruments; there is no runtime preset-file dependency.
- Documentation, composition recipes and Sigil shell tools live here.
  The former Python implementations remain recoverable from the Motif SHAs
  in migration-map.json. No Python runtime is needed by the new tools.
- WAV/OGG files and their provenance remain in the external Ops artifact
  collection. handoff.json inventories them without copying audio into git.

Reusable synthesis, graph behavior, native rendering/OGG export, engine tests
and the generic demo-columns/grit-bass-test tunes stay in Motif. Its README
continues to document those APIs.

The coordinator owns runtime wiring. This migration does not change src/,
package.sgl, sw.js or either shell. Asset validation and offline score checks
do not claim actual game-player loop or calm/tense transition validation.
Verify those once integration consumes the new assets and Motif engine.

Telegram delivery accepts environment credentials or an explicit --env-file.
No machine-specific credential location is embedded in a tool. Credentials
are never part of an inventory or artifact package.
