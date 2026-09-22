# Motif Tracker

Motif Tracker is the game's tune editor, embedded in the game for now (a
standalone release comes later): a FastTracker II-style tracker over
motif's `.cts` tune file and its live player. (The extension is a
leftover from an earlier name; it is changing to `.mts`, Motif Tracker
Source, in a later release.) Eight channels, XM's
four columns per cell (note, instrument, volume, effect), an order list
of patterns, the starter instrument bank, a reverb bus and a mix-bus
compressor in the file, and everything you change is heard at the next
tick while the tune plays.

The tune file format is motif's; `motif tune check FILE.cts` validates
one, `motif tune render` renders it to WAV, and `motif mcp` lets an
agent edit the same file. The soundtrack's twenty tunes ship in
`assets/tunes/` (the game plays them live: docs/soundtrack.md): `spy`,
`groove`, `breaker`, `black-glass`, `black-glass-title`,
`basement-circuit`, `blind-spot`, `breach-vector`, `clock-edge`,
`closed-loop`, `cold-boot`, `dead-sector`, `dirty-cache`,
`glass-current`, `obsidian-index`, `quiet-array`, `relay-ghost`,
`sector-drift` and `shadow-protocol`, with `demo-columns`, which touches
every column, every effect and every instrument.

## Running it

The tracker ships inside the game today; a standalone build is planned.
Native (the desktop build):

    crash-the-stack --tune assets/tunes/spy.cts    a tune
    crash-the-stack --tracker                      a blank tune

`Ctrl-S` saves to `$XDG_DATA_HOME/crash-the-stack/tunes/NAME.cts` (the
shipped tunes are read-only; a save of one lands there under the same
name), `Ctrl-O` opens the next tune (shipped, then saved), `Ctrl-N` starts
a blank one, `Ctrl-E` prints the tune's text to stdout, `Escape` with
nothing playing leaves.

Web: `/tracker/` is the door, its own page and wasm beside the game's
(the game's page carries no tracker code, and the game's menu no link:
the site's nav is where the tracker is found).

    /tracker/                 a blank tune
    /tracker/?tune=spy        a bundled tune (any of assets/tunes/: spy, blind-spot, demo-columns, ...)
    /tracker/#t=...           a shared tune (see Sharing)

`Ctrl-O` cycles the bundled tunes; `Ctrl-S` and `Ctrl-E` both make the
share URL (there is no file to save to on the web).

## The screen

The header's first line: `MOTIF TRACKER`, the tune's name, `096BPM` the
tempo, `SPD06` the speed (ticks per row), `4/4 4 ROWS/BEAT` the meter (the
time signature, then the rows a beat gets), `ORD00/17` the order position and the order's
length, `PAT00` the pattern at that position, `OCT4` the octave the piano
keys play, `INS01 BASS` the instrument a new note gets. The right end says
`EDIT` while edit mode is on, `PLAY` while the tune plays, or a message
(`SAVED`, `OUT OF RANGE`, ...).

The second line is the order list: every position's pattern number, the
cursor's position in brackets, the playing one lit. Under each channel a
2 px level meter on a dB scale (-40 dB at the left edge, 0 dBFS full
width); a muted channel's strip is solid red, a soloed channel's is lit.

Then the spectrum strip: 32 bars from 20 Hz at the left to 16 kHz at the
right, log-spaced, each band's level in dB against full scale (-60 dB at
the bottom), with a peak-hold tick that falls over about a second. It is
the mix as mixed, before the limiter. `Alt-S` hides and shows it.

Then the grid: hex row numbers, the cursor row in the middle, one cell
per channel as `C-4 01 40 A0F` (note, instrument, volume, effect). Beat
rows are tinted, bar rows more so, by the meter.

## Edit mode, the octave and the instrument

`Space` toggles edit mode. With it off, note keys audition the current
instrument (`INS`) without writing; with it on, a note key writes the
note with `INS` at the cursor and steps one row down.

The octave (`OCT`) is set with `F1`..`F8`, natively and on the web. The
two piano rows span two octaves: `Z S X D C V G B H N J M` play `OCT`
(Z is C), `Q 2 W 3 E R 5 T 6 Y 7 U` play `OCT+1`, and `I 9 O 0 P` plus
`, L . ; /` reach into `OCT+2`. `` ` `` (or `1`) writes a note off, shown
as `===`.

The instrument (`INS`) is set with `Ctrl-Up` / `Ctrl-Down`; it is the
instrument every new note gets and the one the instrument panel edits.
On the instrument and volume columns the digits `0-9` type the two decimal
digits as shown (instrument 01..99, volume 00..64); on the effect column
`0-9 A-F` type the three hex digits of an XM effect (`A0F`, `C20`, ...).

## Keys

| key | does |
|---|---|
| arrows | move the cursor; `Shift`+arrows mark a block |
| `PgUp` / `PgDn` | 16 rows (`Alt-Up` / `Alt-Down` too) |
| `Home` / `End` | first / last row |
| `Tab` / `Shift-Tab` | next / previous channel |
| mouse wheel | scrolls three rows a notch (both targets; natively sigil-desktop 0.10.2) |
| click on the order list | that order position |
| `Space` | edit mode on / off |
| `Enter` | play from the cursor row |
| `Ctrl-Enter` or right `Shift` | loop the current pattern |
| `Escape` | stop (nothing playing: leave, natively) |
| `Delete` (or `Backspace`) | clear the cell |
| `Insert` | insert a row; `Shift-Delete` deletes the row |
| `F1`..`F8` | the octave |
| `Ctrl-Up` / `Ctrl-Down` | the instrument |
| `Ctrl-Left` / `Ctrl-Right` | the order position |
| `Ctrl-Insert` / `Ctrl-Delete` | insert / delete an order entry |
| `Alt-Left` / `Alt-Right` | the pattern number at the order position; past the last, a new pattern (sized by the meter) |
| `Ctrl-C` / `Ctrl-X` / `Ctrl-V` | copy / cut / paste the marked block (or the cell) |
| `Ctrl-Z` / `Ctrl-Y` | undo / redo (every edit, unbounded in the session) |
| `Alt-Z` | zoom: four channels at scale 2 |
| `Alt-1`..`Alt-8` | mute a channel; `Alt-M` the cursor's channel |
| `Alt-9` / `Alt-0` | solo the cursor's channel / unmute all |
| `Ctrl-I` | the instrument panel |
| `Ctrl-B` | the bus page (meter, reverb, compressor) |
| `Ctrl-M` | the next signature: 4/4, 3/4, 6/8 (2 rows a beat), 7/8, 5/4 |
| `Alt-S` | the spectrum strip |
| `Ctrl-S` / `Ctrl-O` / `Ctrl-E` / `Ctrl-N` | save / open the next tune / share / new |

The web page owns the keyboard while the tracker is up: every key in
this table is kept from the browser (Tab no longer moves its focus, Space
no longer scrolls), the canvas takes focus on load and on any click, and
only the browser's reserved chords pass (`Ctrl-W/T/Q/L`, `Ctrl-Shift-I/J/C`,
`F5`, `F11`, `F12`). The page forwards the chords itself (the browser's own `Ctrl-S`,
`Ctrl-O`, `Ctrl-N` and `Alt-digit` bindings are prevented while the
tracker is up).

## Follow

While the tune plays with edit mode off, the view follows the playing
order position and row. With edit mode on it stays where you are, so you
can write ahead of the playhead.

## The panels

`Ctrl-I` opens the instrument panel for `INS`: the kind on the first
line, then every parameter of that kind with the instrument's own values
over the kind's defaults. `Up` / `Down` select a line; `Right` / `Left`
step it (an integer by 1, a decimal by 0.05; with `Shift`, ten times
that); on the kind line they cycle the bank. Typing digits, `-` and `.`
then `Enter` sets a value outright; `Backspace` edits it; `Escape` drops
it. Every change plays live, so hold a note (or let the tune run) while
you turn a knob. `Ctrl-I` again closes the panel.

`Ctrl-B` opens the bus page instead: first the meter's three lines
(`BEATS` per bar 1..16, `DENOM` the beat's note value 1/2/4/8/16/32,
`ROWS/BEAT` 1..16: type any values for an odd
meter), then the reverb (`REVERB` zitarev or revsc, `SIZE`, `DAMP`,
`MIX`) and the mix-bus compressor (`COMP` on or off, `THRESHOLD` dBFS,
`RATIO`, `ATTACK` and `RELEASE` in ms, `MAKEUP` dB). The same keys as the
instrument panel; a value the file format refuses (out of range) is
dropped with `OUT OF RANGE`. The compressor is on by default at -12 dB,
4:1, 5/80 ms, +2 dB, which is what every tune played through before it
was a setting; `COMP` off is a 1:1 ratio with no makeup.

`Ctrl-I` from the bus page switches to the instrument panel and back.

## The meter

The header shows the meter as a time signature and a resolution:
`3/4 4 ROWS/BEAT` is three quarter-note beats to the bar, four rows to
each beat. The grid tints every beat row and, more, every bar row: at
3/4 with 4 rows a beat, beats on rows 0, 4, 8 and bars on 0, 12, 24. A
new pattern is one bar of beats times four (64 rows at 4/4, 48 at 3/4,
48 at 6/8 with 2 rows a beat). Ticks and effects do not read the meter:
`SPD` is still ticks per row and BPM is XM's (a tick is 2.5/BPM seconds,
so 4 rows at speed 6 are one beat of 24 ticks); the meter only says how
the rows group, and the denominator is a label. In the file it is
`meter: (4 3)` (rows per beat, beats per bar) after `channels:`, with a
third number for the denominator when it is not 4 (`(2 6 8)` is 6/8);
4/4 is not written.

## Sharing

`Ctrl-E` prints the tune's text natively (`crash: tune-share` and the
text, for the clipboard) and on the web makes a URL:
`/tracker/#t=<the text, deflated, base64url>`. Nothing is sent to a
server; the tune lives in the link. The budget is 16,384 characters (a
three-minute tune is about 2,700); over it the page offers the `.cts` as
a file instead. Opening the link opens the tune.

The file itself is text: `motif tune print` writes it canonically, so a
tune saved by the tracker, printed by motif and edited by an agent over
`motif mcp` is one file with no conversion.

## On a phone

Play-only. Four channels at scale 2 fill the screen, a bar at the bottom
holds `‹ PLAY STOP LOOP ›` (previous order entry, play from the cursor
row, stop, loop the pattern, next entry), a tap on the grid's upper or
lower third pages the cursor, and the share link opens there as it does
anywhere. There is no editing on a phone: the tracker's keyboard model is
the editor, and the phone is for listening to what someone shared.
