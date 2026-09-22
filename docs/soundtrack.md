# The soundtrack, live

The game's music is played live from the tunes in `assets/tunes/*.cts` on
motif's player (M1, D59): no rendered audio ships, the tune file is the
soundtrack, and what the tracker edits is what the game plays.

## What plays when

`(crash music)` is the data:

- **Pools**, one per table. `POOLS` in `src/crash/music.sgl` lists the
  tracks for the stack and for the cards (BREACH VECTOR is in both); a
  track that belongs on the other table moves by editing that list.
  DEAD SECTOR and CLOCK EDGE wait for their own modes and are in neither.
- **The pick** at a deal: `pool[(seed × 2654435761) mod n]`, and the next
  entry when that is the pool's last pick, so two deals in a row differ
  and the same seed (a share code, the daily) always gets the same track.
- **The menu theme**: BLACK GLASS (`black-glass-title`), the intro then
  its loop, resumed where it left off each time the menu returns.
- **The section the trace asks for**: `calm` while the trace runs, `fill`
  in the run-up to the trace landing, `tense` from the moment it lands
  (the ICE's strike; David's ruling of 2026-09-22). That one function,
  `music-section`, is the whole coupling between the trace and the music:
  it takes the phase, the ms until the trace lands, and the fill's window.

`(crash music live)` runs it on one player:

- A new deal opens its pick from the tune's `calm` mark. CONTINUE, and a
  return from the menu, resume where the track left off.
- A switch fades the leaving track out over 0.5 s and the coming one in
  over 1 s; at most one player runs.
- **The fill runs up to the trace.** The live model asks for the `fill`
  mark when the trace's remaining time is within a window: the sink's
  queue (what the ear is behind the walker), the walker's wait for its
  next bar row, the fill's length (its patterns' rows at the header tempo
  and speed) and half a bar. The jump lands on the next bar row, so the
  fill ends within half a bar of the trace landing either way; it runs on
  into the tense region (the region set to fill-through-tense at the
  landing, then to tense alone once the walk is there), which loops.
- **Tense begins at the strike.** The phase turning `counter` asks for
  the `tense` mark at the next bar row unless the fill already ran into
  it. A strike with no run-up (a shuffle jumping the trace past its
  threshold; a tune with no fill) goes to tense with no fill. A strike
  during the fill cuts it at the next bar.
- A return to calm (no path in today's trace model; kept for one) asks
  for the `calm` mark at the next bar row with a 300 ms dip.
- MUSIC and VOLUME in the settings apply at once, on the music's own gain.

The marks are in the file, after the order:

    (marks calm: 0 fill: 8 tense: 9)

`calm` is required; `fill` and `end` are optional; each names an order
position, and the regions follow from them in order: calm = [calm, fill),
fill = [fill, tense), tense = [tense, end). `motif tune check` refuses a
mark past the order. The tracker will show and edit them in a later row;
`motif mcp`'s `tune/set-marks` sets them today.

## How it is mixed

The music renders into a sink of its own beside the cues' (two
AudioWorkletNodes on the web, two streams natively): 32768 frames of
ring, kept 16384 frames ahead (341 ms at 48 kHz), refilled at most 4096
frames per pump, its gain the sink's own volume. The cues keep their
shallow ring (6144 frames ahead, 128 ms at 48 kHz), so a sound effect
never waits behind the music and a stalled frame does not run the music
dry. On the web the page also pumps the music every 12 ms between frames
(`?pump=off` leaves only the frame's pump, for a comparison).

## The render rate

The synth's cost scales with the rate, so the music may render below the
device's rate and is upsampled into its sink by a 4-tap cubic
(`%upsample!`, C). Which rate a device gets is decided by a ladder at
play: the device's rate first (24000 when the page's hints say four cores
or fewer, or 2 GB or less; or the rate this device's last ladder chose,
kept in the store as `music-rate`), and after about a second of pulls at
a rate whose mean cost per 60 fps frame is over 4 ms, the next lower of
32000, 24000, 22050; never up. A step reopens the player at the render
head with the section kept (continuing exactly: the head's offset into its
row is skipped at the new rate). 32000 keeps 11–16 kHz within 3 dB of the
full rate; 22050 is 8.6 dB down there and gone above 16 kHz.

Doors: `?music-rate=N` (web) and `--music-rate N` (native) pin a rate;
`?tune=NAME` / `--music-tune NAME` make every deal pick that tune (the slug of
`assets/tunes/NAME.cts`) instead of the pool's: David's ear on the host;
`?trace-at=N` / `--trace-at N` land the next deal's trace at N seconds (the
arm reads the fill's run-up on a 190 s trace after a hint and two shuffles);
`?rate=N` runs the whole AudioContext at N (a measurement door, not for
play: the cues dull and their ring's milliseconds double).

## Reading it

`?ms` / `--ms`: the readout's fourth line, also the first line of the
copied stats:

    MUSIC BLIND-SPOT 1:56 PULL 4.3 SINK RUNNING DRY 7680/0 RATE 48000/32000 SET ON/10

the track and its order position:row, the synth's cost in ms per 1024
device frames (smoothed), the audio context's state, the starved frames
of the cues' sink then the music's, the device's rate then the music's,
the MUSIC setting and VOLUME.

Console lines with `?trace` / `--trace`:

    crash: music pick NAME seed N for TABLE
    crash: music open NAME top|resume POS ROW ms N     N: the open's cost
    crash: music reopen POS ROW skip N head H ms M   a ladder step's reopen
    crash: music playing NAME POS ROW          the sink pulled past the open position
    crash: music section fill|tense|calm asked at POS ROW   the trace's ask (POS ROW: the walker's)
    crash: music section fill|tense|calm at POS ROW   the landing, a bar row (tense's also when the fill runs into it)
    crash: music fade out NAME
    crash: music rate N per-frame-ms M         the ladder stepped
    crash: menu-playing TITLE                  the pause panel's title line

The pause panel says `♪ <NAME:>` (a note glyph, then the tune's `name:` upcased) under
the share code; the tracker's header carries the same glyph before the tune's name.
