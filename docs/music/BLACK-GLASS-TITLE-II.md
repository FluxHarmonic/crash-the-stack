# Black Glass / Main Theme II

David finds the title version's dirty chirpy bass too loud, clarifying that
he means pressure-grit/pressure-tear rather than the sub. He likes the softer
passage after it drops out and asks about chiptune-style arpeggiation.

Subsequent feedback: David likes the improved title balance but rejects these
lead flourishes as the wrong interpretation. Main Theme III restores the first
lead line while retaining the quieter grit; see BLACK-GLASS-TITLE-III.md.

The separate `docs/music/alternates/black-glass/black-glass-title-v2.cts` lowers all 128 grit/tear note
levels by approximately 4 dB (multiply by 0.63 and round): 28/24 become 18/15,
and opening 25/22 become 16/14. Their default levels also fall from 27 to 17.
Patches, pitches and gates remain unchanged. The sub, softer Reese, drums,
chord parts, contacts and master bus retain their original settings/events.
The entire lower bridge and softer turnaround retain identical score cells.

Five brief F-minor arpeggios ornament existing FM phrase endings. They run
on sixteenths, using F–Ab–C–Ab–F or the shorter F–Ab–C–F, with quieter inner
notes. The main hook remains recognizable and most phrases stay unchanged.
The bursts begin around 0:02.8, 0:09.6, 0:33.9, 1:11.4 and 1:35.6. This
auditions chiptune character without a continuous rapid arpeggio.

The complete title form, 123.428571-second duration and B01 jump are retained.
The independent B00 menu loop remains 116.571429 seconds. This is a retained
comparison with the first title version, not a replacement for Black Glass / Grit.

```sh
sigil docs/music/tools/compose-black-glass-title.sgl --revision 2
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks black-glass-title-v2 --format both
```

Fresh composer output matches exactly; full and loop sources validate and
print canonically. Compiled tables for drums, sub, chords and contacts match
the first title edit. Score comparison permits only the specified grit level
changes and five FM ornaments. Full/loop timing audits find 1,316/1,243 triggers
with zero sample-clock error. The new FM sixteenths are explicit musical
choices; no off-sixteenth attacks or clock changes are introduced.

Both WAVs have zero saturated samples. Full peak/RMS are -3.00/-19.49 dBFS,
loop -2.67/-19.48. Both OGGs decode cleanly as stereo 44.1 kHz Vorbis with
matching durations, and metadata tagging leaves decoded PCM unchanged.

Only the full version is sent to Telegram. Keep prior sources and exports.
The title balance is approved; these arpeggios are superseded by III's removal.
Game loop integration remains untested. See AUDIO-REVIEW-PROCESS.md for the
reusable review workflow.
