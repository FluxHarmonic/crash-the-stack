# Dirty Cache: connected phrasing, full track

David approved the connected reed sketch as much better and requested a full
track with that idea integrated. This is the complete 3:42.545 album audition.
Telegram acknowledged the single OGG as message **1159**. Full-track listening
approval is pending; the maintained songs and public release remain unchanged.

## Arrangement

The exact approved high and low tense lines are copied from the sketch into
shared phrases 8 and 10 (album patterns 14 and 19; game patterns 11 and 16).
Their pitches, levels, gates and selective slides are unchanged. Shared phrase
13, the album's quiet bridge, introduces the lower motif with its original
softer reed patch 8 and note/slide levels one step lower. This connects the calm
bridge to the later tense reply without giving both sections the same weight.

- **1:01.091:** softer lower motif over the calm bass and distant plucks.
- **2:02.182:** higher question and resolving answer.
- **2:45.818:** lower tense reply, before the original high hook returns.

Bass, drums, plucks, instrument bank, bus, original complete hooks and track
length are retained. Phrases I's chord gap before the tense entrance is retained.
Three channel-8 entry note-offs are removed from the candidate layouts because
the bridge and lower tense reply now attack on row zero. Other contextual gates
and effects are unchanged. Both versions use one candidate shared parts pool.

## Sources and future adoption

The Sigil composer reads the frozen Phrases I proposal and approved short sketch.
The timeline map is frozen here so later album edits cannot change historical
regeneration. The composer protects channels 1–7 while replacing reed lines and
checks exact agreement with the approved tense sketch.

Here, parts-before.cts is **Phrases I's proposed parts-after.cts**, not the
maintained song baseline. That earlier baseline remains in
../dirty-cache-phrases-i/parts-before.cts. When adopting, reconcile the maintained
source against that baseline, install both this candidate pool and its updated
layout, and regenerate the game and album together. Do not copy only the notes:
the three reconciled entry gates are part of the change.

## Reproduction and validation

Run from the album repository:

```sh
sigil docs/music/tools/dirty-cache-connected-full.sgl \
  --motif "$PWD/build/dev/bin/motif" \
  --output /tmp/dirty-cache-connected-full-replay
sigil docs/music/tools/album-audit.sgl \
  --motif "$PWD/build/dev/bin/motif" --track dirty-cache \
  --source "$PWD/docs/music/alternates/dirty-cache-connected-full/dirty-cache-after.cts" \
  --output /tmp/dirty-cache-connected-full-audit
```

All eight generated files reproduce byte-for-byte. The native album clock audit
reports 3,503 attacks, zero sample error, and all final gates released. The game
reports 2,953 triggers, zero sample error and the preserved B09 loop destination.
All fifteen maintained song regeneration checks pass; tracker edits are protected.
These checks establish timing and source integrity; the full musical result
still needs David's listening review.

Audio and commands live outside the repository under
~/Ops/artifacts/crash-the-stack-album/dirty-cache-connected-full/.
README-renders.txt, render.sgl and game-audit.sgl document reproduction. Native
WAV, source snapshot, renderer hash, raw levels, encoded OGG, audits and delivery
receipt are retained. The native renderer is the pinned Motif 0.6.6 binary.

The full OGG uses the sketch's -0.8 dB monitoring gain, without added mastering
or limiting. It measures **-15.6 LUFS-I, -1.5 dBTP**, with a -91 dBFS final second.
Duration (222.545465 seconds), 44.1 kHz stereo and encoded peak checks pass.
