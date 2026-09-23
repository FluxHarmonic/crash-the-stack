# Basement Circuit: Turnaround I

David liked Expression I's complete candidate, particularly the more melodic
phrasing, and requested a short A/B of one further idea: a clearer last acid
turnaround into the calm reprise. This compares against Expression I's **after**
version, with its new patches and melodic replies on both sides.

Only the last acid call/breath/answer changes. In the final two-bar window,
the first eight sixteenth-note events remain exactly as before. The acid releases
at row 208 for two beats, then answers E2–D2–C2–B1–A1 at rows 224/228/232/236/240.
The answer triggers once and uses 308 slides with explicit 300 continuation rows;
it settles on A ahead of the reprise and releases at row 255. Patches, levels of
the retained opening figure, other instruments, backing and bus stay intact.
The descending reply uses the existing accent range rather than increasing gain.

The same edit reaches shared pool phrases 10 and 13: the game's final tense
phrase and its album variant. Full candidates are generated together, but only
the short comparison is rendered and delivered. Their layouts, game B06 loop,
album duration and previously liked Expression I details remain unchanged.
The maintained game/album sources and public audio remain untouched.

## Listening

One 30.968-second OGG, BEFORE then AFTER:

- **0:00.000:** Expression I candidate as previously heard.
- **0:15.484:** proposed turnaround.
- The new breath starts at **0:20.323**, the descending answer at **0:21.290**,
  and the calm reprise at **0:23.226** in the combined file.

Each half contains two unchanged lead-in bars, two turnaround bars, two calm
reprise bars and two release bars. Each render starts fresh. The same delivery
gain applies to both halves; there is no independent normalization or new limiter.

## Reproduction

```sh
sigil docs/music/tools/basement-turnaround.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/basement-turnaround-replay
sigil docs/music/tools/short-ab-render.sgl \
  --motif "$PWD/build/dev/bin/motif" \
  --input "$PWD/docs/music/alternates/basement-turnaround-i" \
  --output /path/to/fresh/external/output
```

The frozen Expression I pool and layout drive the composer. This directory
retains before/after pools, the shared layout, both full candidates, both excerpts
and their maps, comparison metadata and source guards. The composer verifies
that no instrument, backing event, prior phrase, clock or bus change leaks into
the experiment. The short renderer records source/renderer hashes, exact render
and encode commands, common gain, duration, format, peak and ending measurements.
It renders only the two excerpts, keeping the requested deliverable short.

External audio and checks live under
~/artifacts/crash-the-stack-album/basement-turnaround-i/.

## Validation and delivery

Telegram acknowledged the single short A/B as **message 1164**. No full-track
files were sent. Listening feedback is pending.

All eleven generated files reproduce byte-for-byte. The compiled pitch trace
confirms E2, D2, C2, B1 and A1 are reached, the answer triggers once, the breath
releases the acid voice, and every backing-channel tick matches the reference.
The full album candidate reports 2,919 attacks with zero sample error, its four
original fill 32nds and every final gate released. The game reports 2,514
triggers, zero sample error and its preserved B06 loop. All fifteen maintained
song regeneration checks pass.

Both native halves measure -15.9 LUFS-I. One common -0.5 dB monitoring gain
produces the 30.968-second OGG at -16.4 LUFS-I/-4.2 dBTP. Duration, stereo
44.1 kHz format and ending decay pass; the final second peaks at -90.3 dBFS.
The descriptive delivery filename is a byte-identical copy of the renderer's
comparison.ogg. Source snapshots, commands, renderer hash, pitch/audit scripts,
raw logs and the Telegram receipt remain in the external artifact directory.

## Rejected after listening

David disliked the low sliding tail, describing it as flatulence, and found
the preceding cutoff abrupt. Do not adopt this turnaround. Preserve it only as
process history. He still wants the acid line to trail out, and requested a
single short clip with a volume fade on the original Expression I rhythm.
