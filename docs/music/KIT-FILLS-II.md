# Cold Boot and Basement Circuit: integrated fills

David liked Cold Boot's machine drums but found the fill conspicuously closer
to the original kit. He also preferred Basement Circuit's quieter drums,
while noticing an occasional snare that could blend more closely. These
separate II versions preserve both first kit auditions.

## Cold Boot / Machine Kit II

Source: `docs/music/alternates/cold-boot/cold-boot-machine-kit-v2.cts`.

The first machine kit shortened the fill noise, but left a distinct F#3 snare
body and considerably more noise than the C4 main knock. Instrument 2 now
shares the main knock's C4 pitch, body level 0.45, 1500 Hz high-pass, 12-bit
crush and 0.035 reverb send. Its noise level is 0.30 with a 34 ms decay,
slightly more rattly than the main knock's 0.24 / 28 ms. Previously the fill
used body 0.42, noise 0.50 / 60 ms, high-pass 1800 Hz and send 0.05.

All 32 transition hits and nine tense ghost hits use the new roll-knock.
The transition begins at 72.727 seconds and resolves at 80 seconds. Its
increasing density and accents remain, including the fast final roll. The
main knock, kick, hats, relay blips, bass and musical parts are unchanged.
The objective is a fill that develops the same kit rather than introducing
a conspicuous conventional snare halfway through the track.

## Basement Circuit / Signal Kit II

Source: `docs/music/alternates/basement-circuit/basement-circuit-signal-kit-v2.cts`.

The first signal kit retained instrument 2 unchanged. That voice supplies
88 hits across ghost notes, phrase endings and the transition roll. Reduce
its noise level from 0.66 to 0.52, decay from 65 to 48 ms and reverb send
from 0.08 to 0.055. Preserve its F#3 body, body level, filter and crush,
all accents, and its role as a snare. This is a modest blend adjustment,
not a replacement of the accepted box-clap or the added tuned percussion.
The transition remains at 77.419–85.161 seconds.

## Reproduction

```sh
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks cold-boot-machine-kit-v2 basement-circuit-signal-kit-v2 --format both
sigil docs/music/tools/timing.sgl --motif "$MOTIF_BIN" \
  --tracks cold-boot-machine-kit-v2 basement-circuit-signal-kit-v2
```

Both preserve every event position, accent, gate, effect, section boundary
and loop target. Cold Boot changes only instrument 2 and its 41 note pitches;
Basement Circuit changes only instrument 2. No new synth feature is needed.
Full and independent calm/tense exports accompany the sources. Only the full
OGGs are delivered for listening. David subsequently found Cold Boot's fill
much more appropriate and Basement's snare better blended without jumping
out. Both drum revisions are accepted. His remaining Basement request is a
quieter transition swell; see [PAPER-SWELL.md](PAPER-SWELL.md) for Signal Kit III.

## Validation

All six full/section sources validate and print canonically. Every compiled
channel table matches the preceding kit version, allowing only Cold Boot's
channel-2 frequency changes. Timing audits retain 1,851 Cold Boot and 2,531
Basement triggers, zero sample-clock error and four intentional off-sixteenth
roll hits apiece. Voice budgets are unchanged.

Cold Boot's calm WAV is PCM-identical to Machine Kit. Its full WAV is identical
up to the first revised hit at 73.636 seconds, with changed audio after that
point. Full peak/RMS are -2.42/-18.30 dBFS for Cold Boot and -2.39/-17.30 dBFS
for Basement Circuit. All six WAVs contain zero saturated samples; all six
OGGs decode at stereo 44.1 kHz with matching durations. Title tagging preserves
decoded PCM. Full durations remain 152.727279 and 162.580612 seconds.

The artifact package includes source snapshots, source diffs, exact render
commands, timing and audio comparison records, level measurements and a
SHA256 manifest. Full OGGs go in the existing `ogg/` delivery folder. Game
ownership and the pending repository move remain as documented in HANDOFF.md.
