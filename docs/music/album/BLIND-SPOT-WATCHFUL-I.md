# Blind Spot: watchful reply audition

David loves the accepted track and authorized a short experiment for the next
release. Preserve its delicate, airy stealth character. This test develops a
rhythmic exchange with existing sounds, without changing patches or rewriting
the original melodic outline.

Use the third tense phrase: shared phrase 7, album pattern 8 at 2:20–2:40.
Its bass deliberately thins between rows 128 and 192. Keep that pause and every
original event. Add an A3–C4 muted call, a tiny C4 latch reply, then a quieter A3
with the returning bass and a matching latch reply. The original D4 signals
return afterward. These five attacks occupy the existing pause as one small
exchange; the opening F4/E4 statement remains exact.

| Row | Channel / instrument | Note | Level | Gate rows |
|---|---|---|---|---|
| 144 | 6 / muted-signal | A3 | 16 | 5 |
| 156 | 6 / muted-signal | C4 | 18 | 5 |
| 164 | 8 / latch | C4 | 9 | 1 |
| 176 | 6 / muted-signal | A3 | 14 | 5 |
| 184 | 8 / latch | A3 | 8 | 1 |

A and C fit the D-minor setting; the return A coincides with the existing D bass
pulse. Explicit releases separate the calls and replies. The quieter second A
is intended to retreat into the original D signals, not create a new lead.
This is a score-based rationale; listening decides whether the extra activity
supports the stealth mood or fills space that was better left alone.

Both halves use the same bank, bus and clock, with fresh synthesis state.
Eight musical bars plus two release bars make each half 25 seconds. Original
starts at 0:00, candidate at 0:25; total is 50 seconds. The first new note is at
0:36.250 in the A/B, corresponding to 0:11.250 in the original half. The new
exchange lasts through approximately 0:39.5; the original D enters at 0:40.

The composer asserts that all original cells remain intact and channels
1–5 and 7 are exact. Canonical scores may differ only in pattern data. No
instrument, bass, drum, chord, room-tone or mix change is bundled into the test.

```sh
sigil docs/music/tools/blind-spot-audition.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/blind-spot-scores
sigil docs/music/tools/short-ab-render.sgl \
  --motif "$PWD/build/dev/bin/motif" \
  --input /tmp/blind-spot-scores --output /tmp/blind-spot-audio
```

Use --source FILE with the frozen source-album.cts for later reproduction.
Scores, maps, audio, commands and reports live outside Git under the public
alias ~/artifacts/crash-the-stack-album/: blind-spot-watchful-i/ and
blind-spot-watchful-i-audio/. Maintained game and album scores remain unchanged.
If approved, add the events to shared phrase 7, mapping album instrument 8 to
shared 6 and album instrument 26 to shared 8, then regenerate both arrangements.

## Verification and delivery

The candidate passes 89 compiled attacks with zero samples of clock error and
all final gates released. Both native halves measure -23.3 LUFS-I/-7.0 dBTP.
The A/B uses the same -0.5 dB monitoring gain, with no added compression or
limiting. Encoded audio measures -23.7 LUFS-I/-7.4 dBTP, with a final-second
peak of -91 dBFS. Stereo 44.1 kHz and the 50-second duration pass checks.

Telegram acknowledged blind-spot-watchful-reply-i-ab.ogg as message 1217.
The named delivery file is a hard link to comparison.ogg, avoiding duplicated
audio storage. David approved this candidate; see [the shared integration](BLIND-SPOT-II.md).
