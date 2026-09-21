# Sigil authoring-tool port

The eleven Python entry points are replaced by Sigil scripts. The current
reference is the main Sigil repository's `docs/guides/shell-scripting.md` and
its `(sigil shell)` implementation; the older Folio shell-design proposal is
historical. Validation used installed Sigil 0.22.2 (5b494e16).

Five composition entry points expand shared 32-row phrases and placements
from twelve editable recipes. This preserves the musical decisions as data
and consolidates assembly, collision checks, canonical printing and overwrite
protection in one Sigil implementation. It does not call Python or read a
finished source as its implementation. The historical snapshots serve only
as independent comparison references. Full instrument definitions, order,
chart metadata and authoring history are retained.

The render helper uses the accepted catalog or historical slugs, creates
independent calm/tense/menu sections, and executes native Motif argv through
checked shell commands. Timing uses absolute integer-derived sample positions
and distinguishes pitch changes from envelope attacks. Legacy comparison
scripts retain their structural and compiled-event checks. Generated files
live under build/music or an explicit output directory.

## Equivalence and failure checks

- All twelve composition outputs match their original canonical sources
  byte-for-byte, including all four Black Glass title revisions.
- All 31 independent section sources for the sixteen accepted arrangements
  match the original Python section generator byte-for-byte.
- The original and ported legacy/revision comparisons pass for their five
  pairs. The ported adaptive auditor covers all four legacy arrangements and
  their independent calm/tense sections.
- check-tools.sgl verifies exact composition output and negative controls for
  overwrite refusal, a wrong loop target and an unavailable renderer.
- check-telegram.sgl uses a local fake curl for acknowledged uploads, malformed
  credentials, duplicate/missing files, token redaction, ambiguous transport
  failure without retries, and credential-free dry runs. Environment-variable
  credentials were also checked with the fake transport.
- The real Sigil Telegram upload of the accepted full Black Glass title OGG
  succeeded as message 1109, and David confirmed receipt. Its private env-file
  path was passed at invocation; it is not embedded in the sender.

Destination asset tests and shipping-score results are recorded in MIGRATION.md.
These checks validate the migration and tools, not actual game-player looping.

## API observations

No blocking Sigil shell limitation was found. The generic datum writer rounds
some floating-point values for display: `(write 1.1892071)` produces `1.18921`,
whereas `(number->string 1.1892071)` preserves `1.1892071`. The score serializer
uses the latter so FM ratios and other patch parameters survive exactly.
This is a serialization consideration, not a shell execution failure.

The shell's `out` trims trailing newlines by contract. Canonical Motif text
has exactly one final newline, so the helper restores it explicitly. `skip`
is the core list-tail operation. Existing standard APIs suffice; no private
replacement for a missing shell facility was needed.
