# Soundtrack migration

Migration source: Motif `feat/codex-content` at `b5cde86198db1a0efae6a0c72ee3549f9b099113`.
Destination: Crash `feat/codex-soundtrack`, based on `99db634`.

David expanded the coordinator's eleven-track list to all fifteen compositions.
The accepted Black Glass title arrangement makes sixteen shipping .cts files.
Its tracker stabs establish the approved modern-plus-retro identity.

## Layout and preservation

Only assets/MANIFEST is modified among existing game files. New scores live
under assets/tunes, all exact historical versions under docs/music/alternates,
and collateral under docs/music. Existing spy/groove/breaker assets are untouched.
No src/, package.sgl, sw.js, shell, dependency or runtime-selection edits.

All 52 original sources are retained byte-for-byte, including the accepted
audition snapshots. Shipping copies change only name: to the display title
listed in SOUNDTRACK.md. Presets live in docs/music/presets because scores
embed their instruments and do not need external preset files at runtime.
No preset MANIFEST rows are therefore required. No WAV/OGG audio is added;
the existing Ops collection remains the audio store, indexed by handoff.json.

The eleven Python entry points are rewritten in Sigil shell. Composition
recipes and a shared phrase assembler reproduce all twelve prior outputs
exactly; render/section, timing, comparison and delivery tools are native Sigil.
Original Python implementations remain in the source commits below.
See tools/README.md for commands and the credential-independent Telegram API.

## Validation

`scripts/dev sigil test test/test-assets.sgl` passed. The tree has 32 shipped
assets and 32 manifest rows, with no unmanifested, missing, symlink or
unclassified assets. The stray-file, ghost-row and symlink controls passed.
See validation/test-assets.txt for the exact test summary.

The destination Sigil verifier checked all 52 archived hashes and all 16
shipping scores, allowing only their display-title changes. Canonical printing
and all 29,907 compiled note triggers passed with zero sample-clock error.
The twelve composer outputs and 31 independent section sources match the
original Python outputs byte-for-byte. Legacy/revision/adaptive audits and
negative controls passed; see validation/ and SIGIL-PORT.md.

A full Black Glass title render executed through the new Sigil tool from /tmp,
outside the repository. Its stereo 44.1 kHz Vorbis decodes cleanly, lasts
123.428571 seconds and has the exact accepted audition's decoded PCM hash.
The real Sigil Telegram delivery was confirmed as message 1109 and heard by
David. No credential path is embedded in the tool.

All modified pre-existing game files are limited to assets/MANIFEST. No new
Python, WAV or OGG files are in the repository. The companion Motif cleanup
commit cites this game landing commit; it removes the moved sources,
catalogs and collateral and updates README examples to the retained demos.
Actual game-player loops and transitions remain with the runtime integration
owner; offline audits do not claim those tests. The worker parks after the
migration and Motif cleanup, before album work.

## What stays in Motif

- `(motif patches dance)` and the reusable synthesis changes.
- Velocity/burst graph support and native renderer OGG export.
- Tune-render filename selection, README API documentation and engine tests.
- `tunes/demo-columns.cts` and `tunes/grit-bass-test.cts`.

## MANIFEST rows added

```text
tunes/blind-spot.cts | CC-BY-4.0 | hand-made | - | - | 2026-09-21 | hand | Blind Spot: 96 BPM, D minor, calm orders 0-3, transition 4, tense 5-8, B05; accepted from motif tunes/blind-spot.cts
tunes/relay-ghost.cts | CC-BY-4.0 | hand-made | - | - | 2026-09-21 | hand | Relay Ghost: 132 BPM, E minor, calm orders 0-4, transition 5, tense 6-10, B06; accepted from motif tunes/electro-dark-v2.cts
tunes/glass-current.cts | CC-BY-4.0 | hand-made | - | - | 2026-09-21 | hand | Glass Current: 172 BPM, D minor, calm orders 0-6, transition 7, tense 8-14, B08; accepted from motif tunes/glass-current-paper-kit-v2.cts
tunes/basement-circuit.cts | CC-BY-4.0 | hand-made | - | - | 2026-09-21 | hand | Basement Circuit: 124 BPM, A minor, calm orders 0-4, transition 5, tense 6-10, B06; accepted from motif tunes/basement-circuit-signal-kit-v4.cts
tunes/cold-boot.cts | CC-BY-4.0 | hand-made | - | - | 2026-09-21 | hand | Cold Boot: 132 BPM, C minor, calm orders 0-4, transition 5, tense 6-10, B06; accepted from motif tunes/cold-boot-machine-kit-v2.cts
tunes/black-glass.cts | CC-BY-4.0 | hand-made | - | - | 2026-09-21 | hand | Black Glass: 140 BPM, F minor, calm orders 0-5, transition 6, tense 7-12, B07; accepted from motif tunes/black-glass-grit.cts
tunes/sector-drift.cts | CC-BY-4.0 | hand-made | - | - | 2026-09-21 | hand | Sector Drift: 100 BPM, G minor, calm orders 0-3, transition 4, tense 5-8, B05; accepted from motif tunes/sector-drift-dust-kit.cts
tunes/closed-loop.cts | CC-BY-4.0 | hand-made | - | - | 2026-09-21 | hand | Closed Loop: 120 BPM, B minor, calm orders 0-4, transition 5, tense 6-10, B06; accepted from motif tunes/closed-loop-relay-kit.cts
tunes/shadow-protocol.cts | CC-BY-4.0 | hand-made | - | - | 2026-09-21 | hand | Shadow Protocol: 96 BPM, D minor, calm orders 0-7, transition 8, tense 9-16, B09; accepted from motif tunes/shadow-protocol-adaptive.cts
tunes/dirty-cache.cts | CC-BY-4.0 | hand-made | - | - | 2026-09-21 | hand | Dirty Cache: 110 BPM, D dorian, calm orders 0-7, transition 8, tense 9-18, B09; accepted from motif tunes/dirty-cache-adaptive-v2.cts
tunes/breach-vector.cts | CC-BY-4.0 | hand-made | - | - | 2026-09-21 | hand | Breach Vector: 140 BPM, A minor, calm orders 0-15, transition 16, tense 17-35, B11; accepted from motif tunes/breach-vector-adaptive.cts
tunes/quiet-array.cts | CC-BY-4.0 | hand-made | - | - | 2026-09-21 | hand | Quiet Array: 92 BPM, F# minor, calm orders 0-3, transition 4, tense 5-8, B05; accepted from motif tunes/quiet-array.cts
tunes/dead-sector.cts | CC-BY-4.0 | hand-made | - | - | 2026-09-21 | hand | Dead Sector: 108 BPM, C# Phrygian, calm orders 0-3, transition 4, tense 5-8, B05; accepted from motif tunes/dead-sector.cts
tunes/obsidian-index.cts | CC-BY-4.0 | hand-made | - | - | 2026-09-21 | hand | Obsidian Index: 84 BPM, E minor, calm orders 0-3, transition 4, tense 5-8, B05; accepted from motif tunes/obsidian-index-v4.cts
tunes/clock-edge.cts | CC-BY-4.0 | hand-made | - | - | 2026-09-21 | hand | Clock Edge: 128 BPM, D# minor, calm orders 0-4, transition 5, tense 6-10, B06; accepted from motif tunes/clock-edge-v2.cts
tunes/black-glass-title.cts | CC-BY-4.0 | hand-made | - | - | 2026-09-21 | hand | Black Glass / Main Theme: 140 BPM, F minor, intro order 0, title loop orders 1-9, B01; accepted from motif tunes/black-glass-title-v4.cts
```

## Complete old-to-new map

Source commits come from `git log --format=%h -- <old-path>` in Motif.
The original hashes and shipping-copy paths are in migration-map.json.
The original handoff inventory is retained in provenance/motif-handoff.json.

| Old Motif path | New Crash path | Motif commits |
| --- | --- | --- |
| `tunes/obsidian-index.cts` | `docs/music/alternates/obsidian-index/obsidian-index.cts` | `24ff699` |
| `tunes/obsidian-index-v2.cts` | `docs/music/alternates/obsidian-index/obsidian-index-v2.cts` | `696de58` |
| `tunes/obsidian-index-v3.cts` | `docs/music/alternates/obsidian-index/obsidian-index-v3.cts` | `0494127` |
| `tunes/obsidian-index-v4.cts` | `docs/music/alternates/obsidian-index/obsidian-index-v4.cts; shipping: assets/tunes/obsidian-index.cts` | `0494127` |
| `tunes/clock-edge.cts` | `docs/music/alternates/clock-edge/clock-edge.cts` | `24ff699` |
| `tunes/clock-edge-v2.cts` | `docs/music/alternates/clock-edge/clock-edge-v2.cts; shipping: assets/tunes/clock-edge.cts` | `1785092` |
| `tunes/quiet-array.cts` | `docs/music/alternates/quiet-array/quiet-array.cts; shipping: assets/tunes/quiet-array.cts` | `b2459e5` |
| `tunes/dead-sector.cts` | `docs/music/alternates/dead-sector/dead-sector.cts; shipping: assets/tunes/dead-sector.cts` | `b2459e5` |
| `tunes/liquid.cts` | `docs/music/alternates/glass-current/liquid.cts` | `6aecadc`, `8954be4` |
| `tunes/liquid-dark.cts` | `docs/music/alternates/glass-current/liquid-dark.cts` | `1346588` |
| `tunes/liquid-dark-v2.cts` | `docs/music/alternates/glass-current/liquid-dark-v2.cts` | `290248c` |
| `tunes/glass-current-paper-kit.cts` | `docs/music/alternates/glass-current/glass-current-paper-kit.cts` | `eddef52` |
| `tunes/glass-current-paper-kit-v2.cts` | `docs/music/alternates/glass-current/glass-current-paper-kit-v2.cts; shipping: assets/tunes/glass-current.cts` | `3f6ca2e` |
| `tunes/acid-house.cts` | `docs/music/alternates/basement-circuit/acid-house.cts` | `6aecadc`, `8954be4` |
| `tunes/acid-house-dark.cts` | `docs/music/alternates/basement-circuit/acid-house-dark.cts` | `1346588` |
| `tunes/acid-house-dark-v2.cts` | `docs/music/alternates/basement-circuit/acid-house-dark-v2.cts` | `290248c` |
| `tunes/basement-circuit-signal-kit.cts` | `docs/music/alternates/basement-circuit/basement-circuit-signal-kit.cts` | `f9ad2ac` |
| `tunes/basement-circuit-signal-kit-v2.cts` | `docs/music/alternates/basement-circuit/basement-circuit-signal-kit-v2.cts` | `303b125` |
| `tunes/basement-circuit-signal-kit-v3.cts` | `docs/music/alternates/basement-circuit/basement-circuit-signal-kit-v3.cts` | `eddef52` |
| `tunes/basement-circuit-signal-kit-v4.cts` | `docs/music/alternates/basement-circuit/basement-circuit-signal-kit-v4.cts; shipping: assets/tunes/basement-circuit.cts` | `3f6ca2e` |
| `tunes/electro.cts` | `docs/music/alternates/relay-ghost/electro.cts` | `6aecadc`, `8954be4` |
| `tunes/electro-dark.cts` | `docs/music/alternates/relay-ghost/electro-dark.cts` | `1346588` |
| `tunes/electro-dark-v2.cts` | `docs/music/alternates/relay-ghost/electro-dark-v2.cts; shipping: assets/tunes/relay-ghost.cts` | `290248c` |
| `tunes/black-glass.cts` | `docs/music/alternates/black-glass/black-glass.cts` | `d0c461b` |
| `tunes/black-glass-grit.cts` | `docs/music/alternates/black-glass/black-glass-grit.cts; shipping: assets/tunes/black-glass.cts` | `1346588` |
| `tunes/black-glass-title.cts` | `docs/music/alternates/black-glass/black-glass-title.cts` | `0494127` |
| `tunes/black-glass-title-v2.cts` | `docs/music/alternates/black-glass/black-glass-title-v2.cts` | `0494127` |
| `tunes/black-glass-title-v3.cts` | `docs/music/alternates/black-glass/black-glass-title-v3.cts` | `7c5d2b4` |
| `tunes/black-glass-title-v4.cts` | `docs/music/alternates/black-glass/black-glass-title-v4.cts; shipping: assets/tunes/black-glass-title.cts` | `b5cde86` |
| `tunes/cold-boot.cts` | `docs/music/alternates/cold-boot/cold-boot.cts` | `d0c461b` |
| `tunes/cold-boot-machine-kit.cts` | `docs/music/alternates/cold-boot/cold-boot-machine-kit.cts` | `f9ad2ac` |
| `tunes/cold-boot-machine-kit-v2.cts` | `docs/music/alternates/cold-boot/cold-boot-machine-kit-v2.cts; shipping: assets/tunes/cold-boot.cts` | `303b125` |
| `tunes/blind-spot.cts` | `docs/music/alternates/blind-spot/blind-spot.cts; shipping: assets/tunes/blind-spot.cts` | `1346588` |
| `tunes/sector-drift.cts` | `docs/music/alternates/sector-drift/sector-drift.cts` | `471f6a7` |
| `tunes/sector-drift-dust-kit.cts` | `docs/music/alternates/sector-drift/sector-drift-dust-kit.cts; shipping: assets/tunes/sector-drift.cts` | `3d5714c` |
| `tunes/closed-loop.cts` | `docs/music/alternates/closed-loop/closed-loop.cts` | `471f6a7` |
| `tunes/closed-loop-relay-kit.cts` | `docs/music/alternates/closed-loop/closed-loop-relay-kit.cts; shipping: assets/tunes/closed-loop.cts` | `3d5714c` |
| `tunes/spy.cts` | `docs/music/alternates/shadow-protocol/spy.cts` | `6d7f72e`, `932d565`, `1bfec34`, `528fe3c`, `a5c75f6`, `e71337d` |
| `tunes/shadow-protocol.cts` | `docs/music/alternates/shadow-protocol/shadow-protocol.cts` | `471f6a7` |
| `tunes/shadow-protocol-adaptive.cts` | `docs/music/alternates/shadow-protocol/shadow-protocol-adaptive.cts; shipping: assets/tunes/shadow-protocol.cts` | `7b8cc7c` |
| `tunes/groove.cts` | `docs/music/alternates/dirty-cache/groove.cts` | `6d7f72e`, `98ae389`, `932d565`, `184bc55` |
| `tunes/dirty-cache.cts` | `docs/music/alternates/dirty-cache/dirty-cache.cts` | `471f6a7` |
| `tunes/dirty-cache-v2.cts` | `docs/music/alternates/dirty-cache/dirty-cache-v2.cts` | `4f872c9` |
| `tunes/dirty-cache-v3.cts` | `docs/music/alternates/dirty-cache/dirty-cache-v3.cts` | `63f5abd` |
| `tunes/dirty-cache-adaptive.cts` | `docs/music/alternates/dirty-cache/dirty-cache-adaptive.cts` | `7b8cc7c` |
| `tunes/dirty-cache-adaptive-v2.cts` | `docs/music/alternates/dirty-cache/dirty-cache-adaptive-v2.cts; shipping: assets/tunes/dirty-cache.cts` | `5432a5f` |
| `tunes/breaker.cts` | `docs/music/alternates/breach-vector/breaker.cts` | `6d7f72e`, `932d565`, `184bc55`, `12bd74b`, `1bfec34`, `528fe3c` |
| `tunes/breach-vector.cts` | `docs/music/alternates/breach-vector/breach-vector.cts` | `471f6a7` |
| `tunes/breach-vector-v2.cts` | `docs/music/alternates/breach-vector/breach-vector-v2.cts` | `4f872c9` |
| `tunes/breach-vector-v3.cts` | `docs/music/alternates/breach-vector/breach-vector-v3.cts` | `63f5abd` |
| `tunes/breach-vector-v4.cts` | `docs/music/alternates/breach-vector/breach-vector-v4.cts` | `45a8c65` |
| `tunes/breach-vector-adaptive.cts` | `docs/music/alternates/breach-vector/breach-vector-adaptive.cts; shipping: assets/tunes/breach-vector.cts` | `7b8cc7c` |
| `docs/codex/content/send-telegram.py` | `docs/music/tools/send-telegram.sgl` | `6d4e2d1` |
| `docs/codex/content/GLASS-BASEMENT-BALANCE.md` | `docs/music/GLASS-BASEMENT-BALANCE.md` | `d184dd5`, `3f6ca2e` |
| `docs/codex/content/REVISIONS.md` | `docs/music/REVISIONS.md` | `4f872c9` |
| `docs/codex/content/compose-final-pair.py` | `docs/music/tools/compose-final-pair.sgl` | `24ff699` |
| `docs/codex/content/DIRTY-CALM-II.md` | `docs/music/DIRTY-CALM-II.md` | `3d5714c`, `5432a5f` |
| `docs/codex/content/MACHINE-SIGNAL-KITS.md` | `docs/music/MACHINE-SIGNAL-KITS.md` | `303b125`, `f9ad2ac` |
| `docs/codex/content/LISTENING-III.md` | `docs/music/LISTENING-III.md` | `3461f31`, `63f5abd` |
| `docs/codex/content/DRUM-KITS.md` | `docs/music/DRUM-KITS.md` | `aee2fcb`, `3d5714c` |
| `docs/codex/content/KIT-FILLS-II.md` | `docs/music/KIT-FILLS-II.md` | `eddef52`, `303b125` |
| `docs/codex/content/OBSIDIAN-II.md` | `docs/music/OBSIDIAN-II.md` | `0494127`, `696de58` |
| `docs/codex/content/PAPER-SWELL.md` | `docs/music/PAPER-SWELL.md` | `3f6ca2e`, `eddef52` |
| `docs/codex/content/CLOCK-ROOM-II.md` | `docs/music/CLOCK-ROOM-II.md` | `696de58`, `1785092` |
| `docs/codex/content/DARKER.md` | `docs/music/DARKER.md` | `290248c`, `1346588`, `d0c461b` |
| `docs/codex/content/TIMING.md` | `docs/music/TIMING.md` | `6aecadc` |
| `docs/codex/content/ADAPTIVE.md` | `docs/music/ADAPTIVE.md` | `5432a5f`, `7b8cc7c` |
| `docs/codex/content/LISTENING-IV.md` | `docs/music/LISTENING-IV.md` | `cd812f2`, `45a8c65` |
| `docs/codex/content/SOUNDTRACK.md` | `docs/music/SOUNDTRACK.md` | `b5cde86`, `7c5d2b4`, `0494127`, `696de58`, `1785092`, `24ff699`, `b2459e5`, `d184dd5`, `3f6ca2e`, `eddef52`, `303b125`, `f9ad2ac`, `aee2fcb`, `3d5714c`, `5432a5f`, `73bcb85`, `cd812f2`, `45a8c65`, `3461f31`, `63f5abd`, `4f872c9`, `32461ba`, `f6b33a4`, `7ec3c04` |
| `docs/codex/content/BLACK-GLASS-TITLE-IV.md` | `docs/music/BLACK-GLASS-TITLE-IV.md` | `b5cde86` |
| `docs/codex/content/FINAL-PAIR.md` | `docs/music/FINAL-PAIR.md` | `1785092`, `24ff699` |
| `docs/codex/content/BLACK-GLASS-TITLE-III.md` | `docs/music/BLACK-GLASS-TITLE-III.md` | `b5cde86`, `7c5d2b4` |
| `docs/codex/content/legacy.py` | `docs/music/tools/legacy.sgl` | `471f6a7` |
| `docs/codex/content/HANDOFF.md` | `docs/music/HANDOFF.md` | `0494127`, `32461ba` |
| `docs/codex/content/arrange-legacy.py` | `docs/music/tools/arrange-legacy.sgl` | `7b8cc7c` |
| `docs/codex/content/compose-black-glass-title.py` | `docs/music/tools/compose-black-glass-title.sgl` | `b5cde86`, `7c5d2b4`, `0494127` |
| `docs/codex/content/OBSIDIAN-III.md` | `docs/music/OBSIDIAN-III.md` | `0494127` |
| `docs/codex/content/compose-puzzle-pair.py` | `docs/music/tools/compose-puzzle-pair.sgl` | `b2459e5` |
| `docs/codex/content/PUZZLE-PAIR.md` | `docs/music/PUZZLE-PAIR.md` | `24ff699`, `b2459e5` |
| `docs/codex/content/AUDIO-REVIEW-PROCESS.md` | `docs/music/AUDIO-REVIEW-PROCESS.md` | `b5cde86`, `7c5d2b4`, `0494127` |
| `docs/codex/content/revisions.py` | `docs/music/tools/revisions.sgl` | `4f872c9` |
| `docs/codex/content/PHRASES.md` | `docs/music/PHRASES.md` | `f6b33a4`, `7ec3c04`, `290248c` |
| `docs/codex/content/adaptive-timing.py` | `docs/music/tools/adaptive-timing.sgl` | `5432a5f`, `7b8cc7c` |
| `docs/codex/content/ALBUM-PLAN.md` | `docs/music/ALBUM-PLAN.md` | `b5cde86`, `7c5d2b4`, `0494127`, `696de58`, `1785092`, `24ff699` |
| `docs/codex/content/timing.py` | `docs/music/tools/timing.sgl` | `0494127`, `696de58`, `24ff699`, `b2459e5`, `3f6ca2e`, `eddef52`, `f9ad2ac`, `3d5714c`, `471f6a7`, `290248c`, `1346588`, `d0c461b`, `6aecadc` |
| `docs/codex/content/handoff.json` | `docs/music/handoff.json` | `b5cde86`, `7c5d2b4`, `0494127`, `696de58`, `1785092`, `24ff699`, `b2459e5`, `d184dd5`, `3f6ca2e`, `eddef52`, `303b125`, `f9ad2ac`, `aee2fcb`, `3d5714c`, `5432a5f`, `73bcb85`, `cd812f2`, `45a8c65`, `3461f31`, `63f5abd`, `4f872c9`, `32461ba` |
| `docs/codex/content/render.py` | `docs/music/tools/render.sgl` | `b5cde86`, `7c5d2b4`, `0494127`, `696de58`, `1785092`, `24ff699`, `b2459e5`, `3f6ca2e`, `eddef52`, `303b125`, `f9ad2ac`, `3d5714c`, `5432a5f`, `7b8cc7c`, `45a8c65`, `63f5abd`, `4f872c9`, `471f6a7`, `290248c`, `1346588`, `d0c461b`, `6aecadc`, `6d4e2d1` |
| `docs/codex/content/REPORT.md` | `docs/music/REPORT.md` | `1346588`, `d0c461b`, `6aecadc`, `6d4e2d1` |
| `docs/codex/content/compose-obsidian-ii.py` | `docs/music/tools/compose-obsidian-ii.sgl` | `696de58` |
| `docs/codex/content/BLACK-GLASS-TITLE.md` | `docs/music/BLACK-GLASS-TITLE.md` | `0494127` |
| `docs/codex/content/BLACK-GLASS-TITLE-II.md` | `docs/music/BLACK-GLASS-TITLE-II.md` | `7c5d2b4`, `0494127` |
| `docs/codex/content/OBSIDIAN-IV.md` | `docs/music/OBSIDIAN-IV.md` | `7c5d2b4`, `0494127` |
| `docs/codex/content/MODES.md` | `docs/music/MODES.md` | `24ff699`, `b2459e5`, `4f872c9`, `471f6a7` |
| `src/motif/patches/content-support.cts` | `docs/music/presets/content-support.cts` | `8954be4` |
| `src/motif/patches/content-filter-steps.cts` | `docs/music/presets/content-filter-steps.cts` | `8954be4` |
| `src/motif/patches/content-core.cts` | `docs/music/presets/content-core.cts` | `8954be4` |

## Display-title cleanup

| Accepted source | Previous name | Shipping title |
| --- | --- | --- |
| `electro-dark-v2.cts` | Relay Ghost / After Dark II | Relay Ghost |
| `glass-current-paper-kit-v2.cts` | Glass Current / Paper Kit II | Glass Current |
| `basement-circuit-signal-kit-v4.cts` | Basement Circuit / Signal Kit IV | Basement Circuit |
| `cold-boot-machine-kit-v2.cts` | Cold Boot / Machine Kit II | Cold Boot |
| `black-glass-grit.cts` | Black Glass / Grit | Black Glass |
| `sector-drift-dust-kit.cts` | Sector Drift / Dust Kit | Sector Drift |
| `closed-loop-relay-kit.cts` | Closed Loop / Relay Kit | Closed Loop |
| `shadow-protocol-adaptive.cts` | Shadow Protocol / Calm to Tense | Shadow Protocol |
| `dirty-cache-adaptive-v2.cts` | Dirty Cache / Calm to Tense II | Dirty Cache |
| `breach-vector-adaptive.cts` | Breach Vector / Calm to Tense | Breach Vector |
| `obsidian-index-v4.cts` | Obsidian Index / Waves IV | Obsidian Index |
| `clock-edge-v2.cts` | Clock Edge / Room II | Clock Edge |
| `black-glass-title-v4.cts` | Black Glass / Main Theme IV | Black Glass / Main Theme |
