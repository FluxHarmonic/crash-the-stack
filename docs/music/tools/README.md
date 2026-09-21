# Soundtrack shell tools

Run these with Sigil 0.22.2 or newer. The implementation follows the main
Sigil repo's docs/guides/shell-scripting.md and uses (sigil shell) checked
commands and structured argv. No Python runtime is used. Every path is derived
from the script's location; scripts work outside the repository's cwd.

Supply a Motif binary containing the soundtrack synth and native OGG features
with --motif FILE or MOTIF_BIN. Otherwise motif must be on PATH. Motif remains
an independent dependency; building Crash does not build this authoring CLI.
Generated scores/audio default to build/music/<tool>/ and are not committed.

```sh
export MOTIF_BIN=/path/to/motif
sigil docs/music/tools/render.sgl --accepted --format both
sigil docs/music/tools/render.sgl --accepted --tracks black-glass-title quiet-array --prepare-only
sigil docs/music/tools/verify-migration.sgl
sigil docs/music/tools/check-tools.sgl
sigil docs/music/tools/check-telegram.sgl
sigil docs/music/tools/adaptive-timing.sgl
sigil docs/music/tools/timing.sgl --tracks quiet-array obsidian-index-v4
sigil docs/music/tools/legacy.sgl
sigil docs/music/tools/revisions.sgl
sigil docs/music/tools/inventory.sgl --artifacts /path/to/external/audio
```

`render --accepted` selects the sixteen shipping filenames and clean display
titles. Without it, --tracks refers to historical working slugs in catalog.json.
This distinction matters for black-glass, cold-boot and other names reused by
shipping copies. Rendering old non-adaptive legacy variants needs --full-only.
--tracks accepts several names; --track NAME may also be repeated. --format
selects wav, ogg or both. OGGs go into the output directory's ogg/ subfolder.
Full files contain the fill. Independent sections compile with fresh DSP state.
The helpers refuse to overwrite a differing generated section or composition.

## Composition

The five composer entry points retain their families and revision choices:
compose-puzzle-pair, compose-final-pair, compose-obsidian-ii,
compose-black-glass-title (--revision 1 through 4), and arrange-legacy.
Each accepts --output DIR. They assemble editable 32-row phrases and pattern
placements from ../recipes/*.sgl, preserving complete patch definitions and
chart/order/history metadata. Repeated phrases share a definition. New music
can change notes, instrument definitions and placements in that data; the
assembler checks missing phrases, overlaps and bounds, then asks Motif for
canonical output. This is a data-oriented Sigil rewrite, not a Python wrapper
or a copy of finished .cts files. check-tools compares all twelve generated
outputs byte-for-byte with the original snapshots and checks failure paths.

The shared modules use hierarchical namespaces (crash soundtrack tools) and
(crash soundtrack audit), loaded locally by the entry points. No game package
or runtime src/ modification is required. The score writer uses number->string
for floats: generic write shortens patch ratios. Native section history retains
the original `derived by render.py` text for exact historical parity; it is
provenance text, not an executable dependency.

## Telegram

Only send explicitly selected full auditions. Choose either environment
variables TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID, or --env-file FILE.
An explicit dotenv file may also use the existing COURIER_TELEGRAM_TOKEN and
COURIER_TELEGRAM_CHAT_ID names. There is no default credential-file location.
Use --dry-run to validate inputs without reading credentials or contacting
Telegram. curl receives the endpoint/token through stdin configuration, never
argv. Redirects are not followed, logs omit private data, and failed or
ambiguous uploads are not retried automatically. check-telegram uses fake
credentials and a local fake curl; it never calls the network.

```sh
sigil docs/music/tools/send-telegram.sgl --env-file /path/to/private.env /path/to/track-full.ogg
```

Historical reports retain their listening decisions and measurements. Their
sources are immutable references; use SOUNDTRACK.md and catalog.json for the
current selections. No album arrangements or mastering are performed here.
