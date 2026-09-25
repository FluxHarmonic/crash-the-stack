# Shadow Protocol: signal reply audition

David authorized a focused experiment in another favorite after the release
schedule gained time. Preserve the delicate pad/vibes character and subtle
calm-to-tense development. This candidate gives the descending signal a brief
vibes answer and a little percussion space, using the existing instruments.

The target is album pattern 12, shared phrase 8 (tense-2), at 2:05–2:15.
The comparison includes the unchanged lower-register phrase immediately after
it, so the unresolved ending can be judged against its original return.
Both halves start with fresh synthesis state.

## Audible proposal

Keep every signal pitch and note onset. Let its opening A–Bb–A breathe through
varied gates, sustain the following G slightly longer, then articulate F–E–D
with shorter releases. The vibes echo F4–E4 after that descent. The existing
C#4 signal and final C#5 vibes note preserve the unsettled ending rather than
adding a new resolution. The return begins on its original D.

| Signal row | Pitch | Level | Gate rows |
|---|---|---|---|
| 8 | A4 | 28 | 6 |
| 16 | Bb4 | 27 | 5 |
| 24 | A4 | 25 | 3 |
| 32 | G4 | 27 | 6 |
| 40 | F4 | 29 | 3 |
| 44 | E4 | 25 | 3 |
| 48 | D4 | 29 | 3 |
| 56 | C#4 | 22 | 3 |

New vibes notes are F4 at row 52/level 18 and E4 at row 56/level 17, each gated
for two rows. Remove brush ghosts at rows 50, 54 and 58, and watch ticks at
50 and 58. Kick, bass, rim, pad, all original vibes events, patches and mix
remain exact. The E answer shares the C# signal's onset, making a major third;
the earlier F enters after the D gate closes. Instrument releases may overlap
these written gates and should be judged in the listening comparison.

The intended result is one connected exchange, not a constant additional line.
This is a score-based proposal; measurements cannot establish whether the new
phrasing improves the listener's favorite.

## Comparison and reproduction

The A/B is 50 seconds: original at 0:00, candidate at 0:25. Each half contains
20 seconds of music plus five seconds of released room tail. The vibes reply
begins at 0:33.125, corresponding to 0:08.125 in the original half and 2:13.125
in the album. The unchanged following phrase starts at 0:10 and 0:35.

```sh
sigil docs/music/tools/shadow-protocol-audition.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/shadow-reply-scores
sigil docs/music/tools/short-ab-render.sgl \
  --motif "$PWD/build/dev/bin/motif" \
  --input /tmp/shadow-reply-scores --output /tmp/shadow-reply-audio
sigil docs/music/tools/album-audit.sgl \
  --motif "$PWD/build/dev/bin/motif" --tracks shadow-protocol \
  --source /tmp/shadow-reply-scores/after.cts --output /tmp/shadow-reply-audit
```

Use --source FILE with the frozen source-album.cts to reproduce this against
the exact reference later. Scores, snapshots, maps, renders and measurements
remain external under ~/artifacts/crash-the-stack-album/, in
shadow-protocol-reply-i/ and shadow-protocol-reply-i-audio/.

The composer verifies the protected accompaniment and lead outline, original
vibes events, identical following phrase and tail, and unchanged bank/bus/clock.
The maintained game and album scores and published master remain unchanged.
The candidate targeted shared tense-2, used by game patterns 10 and 15 and
album patterns 12 and 18. It was not adopted.

## Verification and delivery

The original compiles to 177 attacks and the candidate to 174, matching two
added vibes attacks and five removed percussion attacks. Both pass the 96 BPM,
speed-6 sample-clock audit with zero samples of error and released final gates.
The deliberate legacy bass/lead syncopation is preserved.

Both native halves measure -20.1 LUFS-I/-2.8 dBTP. The comparison applies the
same -0.5 dB monitoring gain, without new compression or limiting. Encoded audio
measures -20.5 LUFS-I/-3.4 dBTP; its final second peaks at -90.3 dBFS. Stereo
44.1 kHz, 50-second duration and decoded loudness/peak/tail checks pass.

Telegram acknowledged shadow-protocol-signal-reply-i-ab.ogg as message 1219.
The named delivery file is a hard link to comparison.ogg, avoiding another
copy of the audio. Technical checks establish render correctness, not musical
preference.

## Listening decision

David preferred the original after hearing the A/B. Close this experiment
without adopting its articulation, vibes reply or percussion changes. Retain
the accepted shared source, both generated arrangements and published master.
No reason beyond the preference was specified; do not infer a particular
instrument or note as the cause. More connected phrasing is a hypothesis to
audition, not an automatic improvement to an already loved composition.
