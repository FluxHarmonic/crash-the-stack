# First soundtrack drum-kit comparisons

After accepting Dirty Cache's second calm/tense arrangement, David asked to
continue to the next task. This begins the planned percussion-identity pass
with two separate full auditions. The approved Sector Drift and Closed Loop
compositions remain unchanged. David accepted both new kits after listening,
saying their less standard drum sounds contribute to each track's vibe and
make the songs more unique. These are now the preferred versions within the
existing eleven compositions; the original kits remain available.

| Track | Comparison | Percussion identity |
| --- | --- | --- |
| Sector Drift | `sector-drift-dust-kit.cts` / Dust Kit | Softer felt-like kick, woody rim-like backbeat, darker dusty hats |
| Closed Loop | `closed-loop-relay-kit.cts` / Relay Kit | Shorter punchy kick, dry electronic clap, metallic closed/open hats |

Sector Drift's kick has less FM attack and pitch sweep, less drive and a
slightly shorter decay. The backbeat uses the existing inharmonic snare-body
voice with much less noise, a short noise decay and an octave-higher trigger
pitch. It aims for a woody rim character; it is not a sampled rim or a new
physical-model instrument. Its send is reduced slightly. The hats use lower
filter bands, restrained 13-bit texture and a little more decay, with a fast
1 ms attack retained. The result is intended to support the reflective broken
beat without introducing another foreground motif.

Closed Loop's shorter kick has a faster pitch envelope. Its backbeat becomes
the existing three-burst clap voice, with 6 ms spacing, a short 50 ms tail and
a small send. The first burst begins at the written hit; later bursts are part
of the clap's timbre, not a tracker-row offset. Metallic FM/noise hats replace
the pure-noise hats, using restrained metal/noise amounts, short decays and
14-bit resolution. The existing relay tap stays as an identifiable small sound.

For both comparisons, every drum placement, explicit/default accent level,
melodic and bass instrument, bus setting, pattern length, order and section boundary
is preserved. Only four drum instruments change: kick, backbeat, closed hat
and open hat. Sector Drift additionally raises channel 2's backbeat pitches
one octave; the clock and accent values remain identical. All other compiled
tick tables match the originals byte-for-byte. Closed Loop's entire compiled
tick tables match because its new percussion timbres use the existing pitches.

The source grid audit checks 1,054 triggers for Sector Drift with zero sample
error and 1,686 for Closed Loop with at most one sample of rounding. Neither
uses off-sixteenth fill hits. Voice counts remain unchanged and below the
per-channel limit. Both full and independent calm/tense sources validate and
print canonically. Native full and loop WAV/OGG exports accompany the audition;
only the two full OGGs are delivered to Telegram.

## Reproduction

```sh
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks sector-drift-dust-kit closed-loop-relay-kit --format both
sigil docs/music/tools/timing.sgl --motif "$MOTIF_BIN" \
  --tracks sector-drift-dust-kit closed-loop-relay-kit
```

Add `--full-only` to export just the listening versions. Full lengths remain
163.2 seconds for Sector Drift and 168 seconds for Closed Loop. All older
versions remain available. These two comparisons inform the next kit choices;
no percussion changes have been applied to the other accepted tracks. No new
engine features were needed: this pass uses existing synthesis parameters.

All six WAVs have zero saturated samples, and all six OGGs decode cleanly
at stereo 44.1 kHz with matching durations. Full peak/RMS measurements are
-5.50/-21.83 dBFS for Dust Kit and -4.89/-20.81 dBFS for Relay Kit. Relative
to the original full renders, average RMS is 0.36 and 1.02 dB lower; these
are changes in drum output/decay, with no bus normalization or melodic gain
change. This should be considered during listening comparisons. Title/album
tags preserve decoded PCM. Exact commands, source snapshots, metrics, timing
audits and checksums accompany the full and independent loop exports.
