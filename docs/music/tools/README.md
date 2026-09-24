> Current authoring: [shared song sources](../songs/README.md). Use `songs.sgl`
> to regenerate/check both game and album versions. Earlier composers below
> remain historical tools; renderers and validators remain supported.

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

David provided standing authorization on 2026-09-23: "You have my permission
to send every audition file to telegram, don't ask again". Send soundtrack
auditions to his existing configured Telegram destination without requesting
per-file or per-revision confirmation. This covers auditions, not public
publication or unrelated files. Record confirmed delivery receipts.

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

### Controlled expression auditions

`relay-expression.sgl --motif PATH --output DIR` generates a preserved album
reference, full patch alternate, six before/after phrase pairs and their maps.
`expression-audit.sgl --motif PATH --output EXTERNAL_DIR` verifies the committed
pairs and exact full-track compiled ticks. The patches are reusable Sigil data
in `(crash soundtrack expression patches)`; accepted game/album scores remain
unchanged.

`expression-render.sgl --motif PATH --output EXTERNAL_DIR --stage native`
renders and measures all cases; `--stage delivery` creates the sequential A/B
and both full OGGs. `--input DIR` selects the generated case directory. Optional
`--reuse PRIOR_EXTERNAL_DIR` reuses only native WAVs with identical score bytes
and renderer identity, then remeasures them; changed cases render normally.
Delivery refuses sources changed since synthesis and uses equal monitoring
gain within every pair. See `../album/EXPRESSION-PASS.md` for the listening
protocol and current section map. All scripts use the Sigil shell interface.

`relay-bell-context.sgl --motif PATH --output EXTERNAL_DIR` produces the focused
calm bell A/B: sixteen identical bars with the preferred contact/dust kit and
original pluck, first using the existing bell and then the metallic prototype.
It checks all compiled ticks, allows only instrument 9 to differ, and writes
a single OGG comparison plus source snapshots and measurement records.

`relay-bass-context.sgl --motif PATH --output EXTERNAL_DIR` compares current,
upper-synth-down and gritty-bass-down balances over sixteen identical tense
bars. It requires Motif's new instrument `gain:` support and explicitly checks
that the renderer preserves that field. Only the specified output gains may
differ; all compiled tick tables must match. The preferred kit, original bell
and original pluck remain constant.

### Relay Ghost album II

`album-compose-opening.sgl --relay-revision ii` (the default) adopts the
approved drum bank and gritty-bass output gain from the preserved audition.
`--relay-revision i` reproduces album I. Use a Motif renderer containing
commit `b0d135e` for gain support; the composer verifies gain survives.

`relay-bass-identity.sgl --motif PATH --output EXTERNAL_DIR` renders three
identification examples: gritty FM bass, separate acid line, then both.
The acid-only example receives an explicit +8 dB monitoring boost; the
combined example uses the original relative levels before the approved cut.
It checks duration, sample format and decoded true peak. Historical audition
tools read the frozen album-I snapshot so accepted updates do not alter A/Bs.

### Breach Vector phrase comparisons

`breach-phrases.sgl --motif PATH --output SCORE_DIR` preserves the current album
reference and generates a candidate plus three contextual before/after pairs.
Once present, the frozen reference drives reproduction. Its source checks
restrict changes to the five declared pattern/channel pairs.

`expression-render.sgl --input SCORE_DIR --output EXTERNAL_DIR --motif PATH
--stage native` then `--stage delivery` renders and validates the comparison
and both complete arrangements. Optional `slug`, `title`, `audition` and
`comment` fields in comparison.json name other tracks; absent fields preserve
the original Relay Ghost behavior. This shares the existing gain, fresh-state,
peak, tail, duration and source-provenance checks.

`album-audit.sgl --track breach-vector --source CANDIDATE.cts --motif PATH
--output REPORT_DIR` applies the established full-track policy to an alternate
without installing it as the accepted album. `--source` requires one title.
Omitting it retains normal album auditing.

`breach-percussion.sgl --motif PATH --output SCORE_DIR` compares a shorter
chip-snare with a faint FM metal layer against the original snare, using the
approved Breach Vector Phrases I score on both sides. It generates percussion,
calm and transition comparisons and both complete scores for the shared
`expression-render.sgl` workflow. Only instrument 2 may change; the composer
also verifies that every snare/fill hit uses that instrument.

### Shared Closed Loop phrase comparisons

`closed-loop-phrases.sgl --motif PATH --output SCORE_DIR` freezes the accepted
shared pool and layout, then generates proposed game/album arrangements and
three contextual before/after pairs. Only the declared melodic phrases change;
protected channel events, instruments, bus, order and clock are checked. The
frozen reference in `alternates/closed-loop-phrases-i/` drives later reruns,
including after adoption. Use `expression-render.sgl` for native audio and OGG
delivery, and `album-audit.sgl --track closed-loop --source CANDIDATE.cts` for
sample-clock and release checks. This composer never adopts the candidate.

### Shared Dirty Cache phrase comparisons

`dirty-cache-phrases.sgl --motif PATH --output SCORE_DIR` freezes the shared
baseline and generates synchronized game/album candidates with four contextual
A/B pairs. It preserves the approved on-beat plucks, corrected harmonic return,
bass/drum events, patches and mix. The proposed chord gap and reed variations
remain independent choices. Source guards restrict changes to declared
pattern/channel pairs; chart/order checks apply to the generated arrangements.
Render with `expression-render.sgl`; audit the complete candidate with
`album-audit.sgl --track dirty-cache --source CANDIDATE.cts`. Frozen references
under `alternates/dirty-cache-phrases-i/` make later comparisons reproducible.

### Shared Basement Circuit expression comparisons

`basement-expression.sgl --motif PATH --output SCORE_DIR` freezes the accepted
shared pool and layout, with separate pluck, acid-envelope and phrase candidates.
It writes synchronized full game/album alternatives and four A/B pairs: exposed
pluck, pluck in the calm mix, acid contour, and replies with original patches.
The exposed pair has an equal monitoring boost; full mixes keep actual levels.
Use `expression-render.sgl` for native/delivery stages and `album-audit.sgl` with
`--track basement-circuit --source CANDIDATE.cts`. The composer protects drum,
sub, chord, swell and auxiliary-percussion events and does not adopt candidates.
The frozen references support later reproduction after accepted sources evolve.

### Short Basement Circuit turnaround comparison

`basement-turnaround.sgl` uses the frozen Expression I candidate to compare one
late acid turnaround, retaining synchronized game/album candidates and excerpt
maps. `short-ab-render.sgl --input SCORE_DIR --output EXTERNAL_DIR --motif PATH`
renders just two excerpts from a manifest naming `before_stem`, `after_stem`,
`half_seconds` and `title`. It concatenates before/after with one common gain,
records source/renderer provenance, and checks encoded duration, format, peak
and final decay. Excerpt scores must already include their release tails.


### Public inventory paths

The inventory records source_root as "." and artifact_root as
~/artifacts/<directory-name>/. These are portable public references; the actual
artifact path supplied at execution time is not written into the manifest.
Individual entries stay relative to their respective roots. Use --manifest FILE
to verify a generated inventory separately without replacing the historical
handoff document.

New audition scores and measurement reports belong in the external artifacts
directory. Retain composers and concise decisions here, plus the maintained
shared sources and generated game/album scores. Do not add more frozen audition
trees under docs/music/alternates/.

### Isolated A/B monitoring

short-ab-render.sgl accepts --gain DB for quiet diagnostic clips, applying one
common gain to both halves and capping it against the measured native peak.
The default is still -0.5 dB. Encoded peak and decay checks remain mandatory;
this monitoring boost is not adopted into the composition or album master.
