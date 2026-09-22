# Shared song sources

The game and soundtrack are arrangements of one maintained composition. All
fifteen titles now use this workflow. Black Glass also generates its existing
title-screen arrangement. Both source material and generated scores are checked
in; the generated `.cts` files remain directly editable in the tracker.

## Files for each song

- `<slug>.sgl` is the small Sigil command for that song.
- `<slug>/parts.cts` holds the shared instrument bank, mix bus, clock and named
  phrase library. It is a normal tracker-readable tune, but its pool order is
  an editing inventory, not a listening arrangement.
- `<slug>/arrangements.sgl` names phrases and maps their uses into game and
  album patterns. It preserves order, chart data, history, entry gates and
  transport commands. Labels describe album sections. Black Glass also has a
  `title` arrangement and explicit gameplay/title patch variants.
- `<slug>/generated.json` records source hashes, output hashes and mappings
  back to the source phrases and instrument IDs. It is generated bookkeeping.
- `assets/tunes/<slug>.cts` and `docs/music/album/<slug>.cts` are generated
  outputs, committed alongside the sources. Album maps are generated too.

Identical phrases and instrument definitions are stored once. Deliberately
varied phrases remain separately named: extending an album bridge must not
silently rewrite every calm loop. Instrument IDs in the shared pool may differ
from output IDs; the arrangement's `bank` mapping is explicit. Initial note-off
cells belong to the arrangement's `entry-offs`, and loop commands to `effects`.
Transport effects B/D/F and row-zero note-offs are rejected inside the shared
phrase library; put them in the corresponding arrangement overlays.

## Generate and check

Use Sigil and a Motif executable containing instrument gain support (currently
Motif feature commit `b0d135e`). Set `MOTIF_BIN` or pass `--motif /path/to/motif`.
An older Motif can silently drop `gain:`; this builder detects that loss and
refuses to produce either score. No credentials or machine-specific renderer
location is embedded in these tools.

```sh
# Check every committed output against its combined source.
sigil docs/music/tools/songs.sgl --stage check

# After editing shared material, regenerate both versions of one song.
sigil docs/music/songs/breach-vector.sgl --stage write

# Regenerate all songs, checking the whole batch before any writes.
sigil docs/music/tools/songs.sgl --stage write

# Preview in a fresh external tree with the same relative output paths.
sigil docs/music/tools/songs.sgl --track relay-ghost \
  --stage export --output /tmp/relay-song-preview

# Exercise propagation, drift detection and tracker-edit protection.
sigil docs/music/tools/songs-test.sgl
```

Check is the default mode. Writes refuse missing baselines, changed generated
files, invalid scores and conflicting entry/transport edits. There is no force
flag. The complete batch is preflighted before any file is replaced. Each file
is replaced through a same-directory temporary file, and receipts are updated
last. This is not a filesystem-wide transaction: an I/O interruption can require
recovery from Git. Avoid concurrent editing while generating.

Commit source, generated game/album files, maps and receipts together. Run the
all-song check as a review/build gate. No CI workflow exists in this worktree;
this command is ready to add to the coordinator's checks once its renderer has
the required Motif support.

## Editing in the tracker

Editing the generated game or album file is supported. The next check reports
that the file differs from its recorded baseline; generation refuses to erase
it, even if another song in the batch has a valid pending source change.

1. Save the tracker-edited file and its diff against the committed generated
   baseline. Keep that edited copy until reconciliation and regeneration pass.
2. Use `arrangements.sgl` or the receipt's mapping to locate the affected shared
   phrase and instrument. Apply the changes there, using the inverse bank map
   for instrument IDs. An agent can do this reconciliation for now.
3. Decide whether a passage edit belongs everywhere the phrase is used. For a
   one-off variation, duplicate the phrase under a new name and change only the
   intended arrangement reference. Entry gates and loop destinations belong
   in the layout rather than the shared notes.
4. After preserving/reconciling the edits, restore the generated files to the
   exact committed baseline whose hashes are in `generated.json`.
5. Generate both versions, inspect the diffs and audition the relevant game
   transition and album passage. Commit both sides together.

Do not reset edited outputs before saving their changes. There is no automatic
reverse importer yet; it cannot safely decide shared changes versus deliberate
variants. Export also requires reconciled generated baselines, making the same
protection apply to all generation modes.

A direct edit to `parts.cts` is simpler: its notes/instruments already are the
source. Preserve source pattern IDs and the `phrases` name map. Add a bank entry
when a new instrument becomes available to an arrangement. Gates at pattern
entry remain explicit in the layout.

## Arrangement and mastering boundaries

Game forms retain their calm/fill/tense order, loop commands, chart data and
entry state. Album forms add introductions, development, reprises and endings.
Both share musical patches and phrases. Black Glass's previously approved
low-pressure gameplay and title colors remain explicit variants in one source;
the migration does not silently replace either approved sound.

Mastering/export stays separate: game headroom and album release gain/limiting
are not copied into one another. Editing scores does not automatically render,
upload, send Telegram messages or deploy the game or website.

The previous composers and audition scripts remain as historical tools. They
are no longer the authoritative way to regenerate current album files; export
historical experiments to fresh temporary directories. For composers that read
the game tunes, use the corresponding historical Git revision to reproduce old
results; current game inputs now contain later approved changes. `songs-migrate.sgl` is
the one-time importer and refuses existing source directories. Do not rerun it
over maintained shared sources.
