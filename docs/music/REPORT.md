# Three tracks for Crash The Stack

These are original calm-to-tense arrangements for David's WAV audition. The
calm regions keep a drum groove and bass movement; the tense regions add
rhythmic density, brighter voices and stronger accents. The compositions are
in `docs/music/alternates/glass-current/liquid.cts`, `docs/music/alternates/basement-circuit/acid-house.cts` and `docs/music/alternates/relay-ghost/electro.cts`.

The branch was rebased onto local master `6ef679e` (0.6.2). The initial brief
allowed new content only. During this session David explicitly chose “Add the
required synth features now,” authorizing the additive synthesis work below.
There was no `CLAUDE.md` in this worktree; the parent Sigil workspace's file
provided the build instructions. No other worktree or tracker binary was edited.

## Arrangements

All order numbers below are decimal. Effects use hexadecimal. Every regular
pattern is eight bars (256 rows); the single fill is four bars (128 rows).
Speed 3 and `meter: (8 4)` give eight rows per quarter note, so a row is a
thirty-second note. No tempo or speed changes hide inside the patterns.
Section boundaries are recorded in each tune's history, not a new format field.
Each region uses unique pattern IDs, including answer, drum-drop, return and
turnaround variants. The full arrangement is traversed once before Bxx returns
to the tense region, never the opening calm region.

| File / title | Key, tempo | Calm | Fill | Tense / jump | Nominal duration |
| --- | --- | --- | --- | --- | --- |
| `liquid.cts` / Glass Current | D minor, 172 BPM | 0–6, 56 bars | 7, 4 bars | 8–14, 56 bars; `B08` | 161.86 s |
| `acid-house.cts` / Basement Circuit | A minor, 124 BPM | 0–4, 40 bars | 5, 4 bars | 6–10, 40 bars; `B06` | 162.58 s |
| `electro.cts` / Relay Ghost | E minor, 132 BPM | 0–4, 40 bars | 5, 4 bars | 6–10, 40 bars; `B06` | 152.73 s |

Glass Current starts with a half-time snare, rolling pitched sub, brushed hats
and sparse minor/major pad voicings. The fill accelerates into thirty-seconds;
the tense part uses a full snare backbeat, detuned reese and short lead stabs.
Basement Circuit starts with four-on-the-floor kick, off-beat hats, warm
layered chords and filtered pluck answers. The acid response introduces
sixteenth hats, `318` legato slides and volume accents, with cutoff steps over
two-bar groups. Relay Ghost keeps a syncopated break beneath a changing bell
hook; its tense response brings in grit bass, `037`/`047` arpeggios and stepped
ladder brightness. All three fills use velocity-shaped snare rolls.

The regular harmonic and drum motifs are intentional. Variation comes from
phrase-level harmonic rotation, changed answers, ghost notes, short drum drops
and turnarounds. The calm/tense regions last about 78/78 seconds, 77/77 seconds,
and 73/73 seconds respectively before their complete arrangement repeats.

## Eight-channel budgets

Each channel has at most eight allocated voices for the *entire tune*, not just
at one instant. Each layered triad consumes three voices. Minor and major
versions therefore consume six on their shared channel.

| Channel | Glass Current | Basement Circuit | Relay Ghost |
| --- | --- | --- | --- |
| 1 | kick | four-on-the-floor kick | syncopated kick |
| 2 | roll-snare, backbeat and ghosts | clap / roll-snare | roll-snare, backbeat and ghosts |
| 3 | brushed / open noise hats | off-beat / sixteenth / open hats | brushed / open noise hats |
| 4 | pitched sub / reese | pitched sub | pitched sub / grit bass |
| 5 | minor / major pad triads | minor / major stab triads | minor / major stab triads |
| 6 | pluck answers | pluck / three acid cutoff settings | pluck answers |
| 7 | stabbing FM lead | bell turnaround | bell motif |
| 8 | noise riser | noise riser | three filter-step arp voices / riser |

The same instrument bank is present for calm and tense; roles and density
change at the transition. Kick and bass are centered, chord beds lean left,
and hats/plucks/bells sit slightly right. Per-channel send/pan follow the first
instrument as required by the renderer. Reverb is restrained and bass is dry.
The shared compressor uses 3:1, -12 dB, 8/100 ms and +1 dB makeup.

## Instruments and synthesis additions

Reusable, directly playable catalogs live in `docs/music/presets/content-core.cts`,
`content-support.cts` and `content-filter-steps.cts`. Copy an instrument form into
another tune and assign its ID there. `.cts` has no external preset import, so
the songs embed their definitions and are self-contained. The catalogs separate
instruments across channels/files to respect the lifetime voice limit.

| Requested patch | Implementation |
| --- | --- |
| reese | New `saw-reese`: two detuned bandlimited saw oscillators, low-cutoff ladder, drive and slow modulation-index motion. These are actual saw oscillators, not renamed sine FM operators. |
| acid | New `saw-acid`: saw into drive and resonant ladder, decaying filter envelope, tracker-volume-sensitive cutoff. Three cutoff settings open the line over bars; accents are real volume-column routing. |
| stab | New `fm4-stab`: filtered, short-decay FM; `ratio` transposes the whole voice. Instrument layers at root, equal-tempered third and fifth make a triad on one channel. |
| pluck | A bright, shorter-decay, lower-cutoff `fm4-stab` variant. |
| sub | `chip-kick` with zero FM index, gentle 18 ms pitch drop, long decay and very low drive: the remaining carrier is a sine. |
| clap | New `chip-clap`: filtered noise under three one-shots, starting exactly at 0, 10 and 20 ms. The third burst carries the tail. |
| roll-snare | Shortened `chip-snare` noise decay with restrained body and 14-bit crush; explicit notes retrigger at sixteenths/thirty-seconds. |

The graph API adds `g:velocity` and `g:burst`, implemented in the native render
loop shared by native and web builds. Velocity is the current tracker volume
normalized to 0–1 (before channel mix gain), drum step strength, or unity for
ordinary melodic/bus graphs. Existing patches continue to use their previous
constant velocity. Burst state belongs to each graph node and survives chunks;
a fresh gate edge resets its delay and envelope. No new dependency or `.cts`
field/effect was needed. The new bank module is `(motif patches dance)`.

## What got in the way

- FM4 operators have sine waveforms only. True saw voices belong beside the FM4
  bank as graph compositions; changing the external sigil-dsp operator format
  was unnecessary. The reese and acid now use actual bandlimited saw nodes.
- Volume previously changed output gain only. The new velocity graph input
  supplies the acid filter and new FM stab, without changing old patches.
- There was no delayed one-shot. Envelope attack offsets do not create actual
  silent delays, so that approximation was replaced with `g:burst`.
- Instrument layers transpose only by integer octaves. The new stab's `ratio`
  parameter supplies thirds/fifths inside each voice; no format extension is
  needed for a layered chord. Pad voicings use FM operator ratios similarly.
- There is no filter automation effect or tune automation lane. The acid and
  electro builds use ordered cutoff variants, with a filter envelope on each
  note. A continuous multi-bar sweep independent of note retriggers remains a
  useful future tracker feature. This is a stepped build, not continuous
  automation presented as one.
- `Exx` retrigger/note-delay effects are unsupported. Eight rows per beat make
  the snare's thirty-seconds explicit at the same BPM instead.
- The CLI renders one traversal up to a repeated order/row; it does not extend
  a Bxx loop indefinitely. Section WAVs therefore contain one complete loop.
- The prebuilt tracker in the other worktree predates these synth kinds. It
  cannot audition them until its owner rebuilds it against this Motif version.
  It was not rebuilt or used to claim a visual/editor audition.

## Reproducing the renders

From this worktree:

```sh
# Build Motif separately, then set MOTIF_BIN to its CLI.
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks liquid acid-house electro --format both
```

The default output is `~/artifacts/crash-the-stack-codex-content/`.
`--output PATH` selects another directory. `--prepare-only` validates canonical
source files and writes six independent section tunes plus commands without
rendering. The Sigil port requires Sigil and a compatible Motif CLI; see tools/README.md.

With `--format both`, the output includes nine matching OGGs in `ogg/`.
`--format wav` (the default) or `--format ogg` selects only one format. Native
OGG export is also available directly through `motif tune render FILE -o FILE.ogg`
at Vorbis quality 0.6; `.OGG` works too. The delivered OGGs were converted from
the finished WAVs using `ffmpeg -c:a libvorbis -q:a 6` and decode-checked.

The output contains `liquid-{full,calm,tense}.wav`,
`acid-house-{full,calm,tense}.wav`, `electro-{full,calm,tense}.wav`, the six section
`.cts` inputs, `README-renders.txt` with exact commands, and `tune-info.txt`.
Section inputs start fresh, have a local `B00`, and do not inherit the fill's
noise or full mix's reverb. WAVs are 44.1 kHz stereo; no external normalization
or post-production is applied. Audition with repeat enabled to hear the loop.

## Validation and listening status

Completed checks:

- Native dev and release builds succeeded. No web build or rebuilt tracker was
  tested. The installed toolchain emitted its existing dependency-coherence
  warnings; no lockfile or dependency was changed.
- The release tune suite passed all 178 assertions, and the FM suite passed
  all 59, including delayed-burst onset/cancellation and streaming parity.
  The dev suite's sole failure was its spectrum timing threshold (1.08 ms
  against 0.5 ms); the release build passed that same check at 85 microseconds.
- Four real CLI export cases passed: WAV, OGG, uppercase OGG and extensionless
  WAV, each at 32 kHz stereo for exactly 3,200 frames / 0.1 seconds.
- The existing `spy.cts` two-second WAV was byte-identical before/after the
  dance-engine additions. Existing presets were not retuned.
- All three source tunes are byte-identical after canonical printing. All six
  section exports validate and compile. Every channel is within its budget.
- Full-track float scans found no NaN/Infinity. All nine WAVs are non-silent
  stereo 44.1 kHz with zero saturated PCM samples; all nine OGGs decode cleanly.
  Exact durations, measured levels and SHA-256 hashes accompany the files.
- The acid-house full WAV is one sample shorter than its compiled sample
  count, from the existing duration-to-sample floating-point round trip
  (about 23 microseconds); its musical layout and section boundaries agree.

| Track | Full WAV peak | Calm RMS | Tense RMS |
| --- | --- | --- | --- |
| Glass Current | -2.07 dBFS | -16.10 dBFS | -17.33 dBFS |
| Basement Circuit | -2.48 dBFS | -17.52 dBFS | -16.95 dBFS |
| Relay Ghost | -1.36 dBFS | -17.23 dBFS | -17.11 dBFS |

These are unnormalized mixes. In particular, the liquid tense part has denser
drums and lead activity but lower RMS than its sine-sub calm section. Whether
it needs more bass weight is a listening decision. Musical judgment and final
balance approval remain David's listening pass; these checks do not substitute
for hearing the arrangements on his playback system.

## Telegram delivery

David also requested OGG copies via his Courier Telegram credentials. The
reusable `send-telegram.sgl` helper posts selected files as documents using the
Bot API directly. It reads only the token/chat fields from
an explicitly supplied private environment file, never logs credentials, and does not automatically retry
an ambiguous upload. Example, after explicitly choosing to send the files:

```sh
sigil docs/music/tools/send-telegram.sgl \
  ~/artifacts/crash-the-stack-codex-content/ogg/*.ogg
```

The Sigil port uses the shell interface and curl; see tools/README.md. It does not change Courier's
configuration, start another Telegram poller, or copy credentials into the repo.

Telegram acknowledged all nine OGG documents during this session. The installed
artifact directory was verified against its `SHA256SUMS` after copying.

## Timing revision after listening feedback

The first delivery's rhythmic placement was revised after David heard drums,
leads and bells landing awkwardly. See [TIMING.md](TIMING.md) for the specific
corrections, the complete channel/sample-clock audit, and the reproduction
command. Subsequent listening deliveries include only the full versions, with
the fill intact. Original measurements above describe the initial delivery;
revision-specific measurements accompany the new files.

## Darker musical direction

After the timing revision, David requested dark dubstep and techno originals,
followed by separate darker experiments on the original three tracks. See
[DARKER.md](DARKER.md) for the arrangements, validation and reproduction commands.
Only full arrangements, including their fills, are sent for these auditions.
