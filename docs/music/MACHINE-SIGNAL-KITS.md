# Cold Boot and Basement Circuit percussion identities

David approved another pair of percussion auditions and welcomed tuned beeps
as a way for the soundtrack to feel like it lives inside an AI system. These
are separate versions of the accepted Cold Boot and Basement Circuit / After
Dark II arrangements. Existing sources and exports remain available.

Subsequent feedback: David liked both kits, but heard a mismatch in Cold
Boot's fill and an occasional exposed snare in Basement Circuit. See
[KIT-FILLS-II.md](KIT-FILLS-II.md) for the separate follow-up auditions.
The design and measurements below describe the first kit versions.

## Cold Boot / Machine Kit

Source: `docs/music/alternates/cold-boot/cold-boot-machine-kit.cts`.

Keep the accepted kick and low-end pulse exactly. Replace the main clap with
a short inharmonic mechanical knock tuned to C4, and give the ghost/fill snare
a shorter, grainier noise component. Closed hats become drier and grainier;
open hats combine metallic FM and noise at a lower filter band than Closed
Loop's kit. The original relay-hit rhythm becomes a clearer short blip: C/G
notes move up one octave, with low-index FM, a 40 ms outer decay and less send.
These remain quiet percussion rather than a new melodic phrase.

No events are added or moved. Kick, bass, chords, lead, distant bell, riser,
order, sections and bus remain unchanged. Main-knock and relay-blip pitches
change deliberately; their accents and clocks are retained. Six unaffected
compiled channel tables match the accepted original byte-for-byte. There are
still eight channels, with the existing voice allocation.

## Basement Circuit / Signal Kit

Source: `docs/music/alternates/basement-circuit/basement-circuit-signal-kit.cts`.

Keep the accepted kick, bass, harmonic voicings, pluck and acid development.
The clap gets a shorter, boxier band and close 6 ms bursts; closed hats become
sandy ticks, while the open hat keeps a breathier texture. Existing drum notes,
accent levels and rhythms remain. The fill snare and riser are unchanged.

Add sparse punctuation on channel 8: 27 short root-tuned beeps and 16 low tom
hits across the full arrangement. Beeps use a 25 ms low-index FM bell envelope,
with two per eight-bar calm pattern and four per tense pattern where space
allows. Toms appear near four-bar phrase endings. Their pitches follow the
current bass harmony; toms occupy an approximately 87–147 Hz register. The
opening pattern and transition get no new channel-8 events, and additions
avoid the final bar wherever the original riser is active. Every new onset
lands on a sixteenth; gate releases are explicit.

Channels 1–7 have compiled event tables identical to After Dark II. Channel 8
keeps the original riser and adds the new percussion, using three lifetime
voices. The arrangement, melodic parts, section boundaries and bus stay intact.
The added signals become a little more frequent in the tense section without
turning into a lead line.

## Reproduction and comparison

```sh
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks cold-boot-machine-kit basement-circuit-signal-kit --format both
sigil docs/music/tools/timing.sgl --motif "$MOTIF_BIN" \
  --tracks cold-boot-machine-kit basement-circuit-signal-kit
```

Add `--full-only` for just the full auditions. Full and standalone calm/tense
WAV/OGG exports accompany the source snapshots and validation records. Only
the two full tracks are delivered to Telegram. Both versions await listening
feedback; previous references are preserved. This pass uses existing synth
voices and requires no engine change. All content remains game-owned material
in the temporary staging location documented in HANDOFF.md.

## Validation results

The full grid audits find zero sample-clock error: Cold Boot has 1,851 compiled
triggers; Basement Circuit has 2,531 (its existing portamento notes do not all
retrigger). Each retains the four intentional off-sixteenth snare-roll hits.
Cold Boot channels 2 and 8 also preserve every compiled timestamp, voice,
volume, gate and duration after allowing their deliberate pitch changes.

All six sources validate and print canonically. All six WAVs have zero
saturated samples; full peak/RMS are -2.56/-18.30 dBFS for Cold Boot and
-2.28/-17.29 dBFS for Basement Circuit. Full lengths remain 152.727279 and
162.580612 seconds. All six OGGs decode cleanly at stereo 44.1 kHz and match
the WAV durations; title tagging preserves decoded PCM. Source snapshots,
exact commands, level measurements, timing audits and checksums accompany
the exports. Listening feedback is still needed to select these kits.
