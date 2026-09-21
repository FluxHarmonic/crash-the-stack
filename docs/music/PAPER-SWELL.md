# Glass Current paper kit and Basement Circuit swell balance

David accepted Cold Boot / Machine Kit II's integrated fill and Basement
Circuit / Signal Kit II's better-blended snare. Preserve those drum revisions.
He requested the proposed Glass Current percussion audition and a quieter
Basement transition swell in parallel. Prior sources and exports remain.

## Glass Current / Paper Kit

Source: `docs/music/alternates/glass-current/glass-current-paper-kit.cts`, derived from `liquid-dark-v2.cts`.

Keep the accepted complete melodic phrases, pad voicings, sub/Reese bass,
pluck and tense lead. All existing drum positions and accents, including the
tight ghost notes and four fast final roll hits, remain unchanged.

- Round the kick: less FM index and drive, shorter pitch sweep and a 210 ms
  decay. Keep its pitch and accents for the established broken-beat pulse.
- Give the snare a papery texture: reduce its pitched body from 0.38 to 0.26,
  use noise level 0.60 with a 48 ms decay, lower the high-pass to 1400 Hz and
  reduce send to 0.055. Main hits, ghosts and fill all share this same voice.
- Shorten closed hats to a 32 ms noise decay with a 1 ms attack, a softer
  4700–8500 Hz band and light 13-bit grain. Open hats become a 95 ms brushed
  breath in a similar band. Retain the original alternating accents.
- Add 39 quiet, root-tuned digital ticks on channel 8. A low-index FM bell
  with an 18 ms outer decay and 8 ms release makes a small pitched click.
  Calm patterns get two per eight bars; tense patterns get four, except the
  final pattern gets three to keep clear of the riser. Tick pitches follow
  the current pad root in octave 5; accents are 12 calm / 14 tense, pan -0.18
  and send 0.04. Gates release after one row. No ticks are added to the
  opening pattern or transition fill, or to the existing drum-dropout bars.
- Lower the retained noise riser amplitude from 0.4 to 0.3 (about 2.50 dB
  before the bus) to accompany the lighter percussion.

This is an instrument-design audition, with sparse added punctuation rather
than a rewrite of the accepted theme. All original source events are
preserved; compiled channels 1–7 match After Dark II exactly. Channel 8 keeps
its riser and adds one tick voice. The bus and calm/fill/tense layout remain.

## Basement Circuit / Signal Kit III

Source: `docs/music/alternates/basement-circuit/basement-circuit-signal-kit-v3.cts`.

Only the riser's source amplitude changes: 0.4 to 0.25, a 4.08 dB reduction
before bus processing. The envelope, filters, reverb send and every pattern
cell remain. This covers the calm exit at about 1:15.48, the transition fill
from 1:17.42 and the tense turnaround at 2:40.65. Preserve the now-approved
snare and all other Signal Kit II sounds. All eight compiled channel tables
are byte-for-byte identical to II; canonical print and tune check pass.

## Reproduction

```sh
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks glass-current-paper-kit basement-circuit-signal-kit-v3 --format both
sigil docs/music/tools/timing.sgl --motif "$MOTIF_BIN" \
  --tracks glass-current-paper-kit basement-circuit-signal-kit-v3
```

Generate full and standalone calm/tense WAV/OGG exports with the existing
helpers. Only full tracks are sent to Telegram. These two auditions await
listening feedback in the original package. David subsequently liked Glass
Current's drums, asking for a quieter swell and a more present tense bass.
He also requested a small reduction of Basement's buzzy tense acid line.
See [GLASS-BASEMENT-BALANCE.md](GLASS-BASEMENT-BALANCE.md) for those follow-ups.
Cold Boot / Machine Kit II is accepted and unchanged.
All game-owned material remains in temporary Motif staging pending the
crash-the-stack move described in HANDOFF.md.

## Validation

All six full/section sources pass validation and canonical printing. Grid
audits report 3,011 Glass Current triggers and 2,531 Basement triggers, zero
sample-clock error and four intentional off-sixteenth roll hits in each.
Glass Current's channel 8 uses two lifetime voices, within the existing
limit; every other channel retains its allocation. Basement's allocation
is unchanged.

All six WAVs contain zero saturated samples; all six OGGs decode cleanly at
stereo 44.1 kHz with matching durations. Title tagging preserves decoded PCM.
Full peak/RMS are -2.67/-17.56 dBFS for Glass Current and -2.39/-17.30 dBFS for
Basement; full durations are 161.860476 and 162.580612 seconds. Basement's
full PCM is identical to II before 75.483871 seconds, and changes during the
swell, confirming the revision reaches the rendered audio at the intended point.

The artifact package includes full and standalone sources, exact commands,
clock/source comparisons, audio measurements and SHA256 checksums. Full OGGs
are delivered from the existing `ogg/` folder; historical packages are retained.
