# Dead Sector: two independent experiments

Dead Sector is one of David's favorites. He welcomes both restrained and
experimental changes, with no presumption that either replaces the original.
Keep the current maintained song as the reference.

Both short comparisons use the same second tense phrase: shared phrase 6,
album 1:55.556–2:13.333. Each half contains eight musical bars followed by two
release bars. Original begins at 0:00; candidate begins at 0:22.222; total
length is 44.444 seconds. Each half starts from a fresh renderer state.

## Restrained answer

Keep the original patches, bell, accompaniment and first four melodic bars.
The later lead rises through G-sharp–B–C-sharp, answers itself and descends
through F-sharp–E–D–C-sharp. Four additional attacks connect the answer without
adding another voice. The D releases before the original C-sharp bell attack.
The audible change is in the latter half of the candidate, around 0:32 onward.

## Experimental response

This is a separate alternative, based directly on the original. The lead has
a brighter FM index and a more metallic edge. A short pitched contact with a
small clap layer replaces the backbeat timbre at the same onsets. Quieter,
filtered probe reflections replace the high bell replies, with a wider pan and
a little more room send. These are composed echo notes, not a new delay effect.

The lead uses paired calls and C-sharp resolutions, including the original
Phrygian D–C-sharp tension. Kick, sub-bass rhythm, chord events, clock and bus
stay fixed. The experiment changes melodic phrasing, the response voice and
backbeat sound together; approval would invite separate tests if only some
elements appeal.

## Verification and delivery

Both candidates pass compiled timing and release checks: restrained 117 attacks,
experimental 119, zero samples of clock error, all final gates released.
Structural assertions preserve accompaniment events in both and the exact bell
performance in the restrained version. Maintained game and album files are
unchanged.

Native original/restrained halves both measure -22.9 LUFS-I; the experimental
half measures -22.8, a 0.1 LU difference. Both comparisons use the same -0.5 dB
monitoring gain, with no extra compression or limiting. Encoded true peaks are
-6.8 dBTP (restrained) and -6.6 dBTP (experimental), with final tails at -91 dBFS.
Duration and stereo 44.1 kHz checks pass.

Telegram: restrained 1209, experimental 1210. Both remain unadopted pending
listening feedback.

## Reproduction

The Sigil composer is ../tools/dead-sector-audition.sgl. It requires a fresh
external output directory and accepts --source FILE to replay the archived
source-parts.cts snapshot. short-ab-render.sgl renders each child comparison.

```sh
sigil docs/music/tools/dead-sector-audition.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/dead-sector-scores
sigil docs/music/tools/short-ab-render.sgl \
  --motif "$PWD/build/dev/bin/motif" \
  --input /tmp/dead-sector-scores/restrained --output /tmp/dead-sector-restrained
sigil docs/music/tools/short-ab-render.sgl \
  --motif "$PWD/build/dev/bin/motif" \
  --input /tmp/dead-sector-scores/experimental --output /tmp/dead-sector-experimental
```

Frozen scores, maps, source snapshot, commands, renderer hashes, audio and
measurement reports stay outside Git. Public artifact aliases under
~/artifacts/crash-the-stack-album/: dead-sector-experiments-i/,
dead-sector-restrained-i/ and dead-sector-experimental-i/.

## Follow-up: smoother approach and an alternate passage

David prefers the coherence of the restrained answer and also likes the
experimental version. One of the closing restrained notes sounds a semitone
out to him. The likely candidate is D3 at row 232, approaching C-sharp3;
the new audition changes only that pitch to D-sharp3. This tests E–D-sharp–
C-sharp instead of E–D–C-sharp, without claiming the culprit is confirmed.
The changed note occurs at 0:16.111 in the standalone clip.

Try the experimental material once as an eight-bar alternate immediately after
the revised second tense phrase, before returning to the original third tense
phrase. In the full album this would insert at 2:13.333 and add 17.778 seconds.
Keep the experiment's original notes and timbres, including its Phrygian tension.
Separate instrument IDs confine the alternative lead and backbeat to this
passage; the original bank remains intact for the surrounding material.

Two single clips were delivered to Telegram:

- Corrected answer: 22.222 seconds, message 1211.
- Alternate in context: 57.778 seconds, message 1212. Revised answer at 0:00,
  alternate at 0:17.778, original third tense phrase at 0:35.556, release at
  0:53.333.

Structural checks confirm exactly one changed pitch in the restrained phrase,
identical experimental notes after instrument-ID remapping, all ten original
patches preserved, and the exact original return phrase. Compiled timing checks
pass for 117 and 330 attacks, respectively, with zero samples of clock error
and all final gates released. Both encoded clips measure -23.3 LUFS-I at the
same -0.5 dB monitoring gain as the earlier auditions. True peaks are -6.8 and
-6.7 dBTP; final-second peaks are -91 dBFS. Stereo 44.1 kHz and durations pass.

Reproduce with dead-sector-audition.sgl --context, optionally passing --source
to the frozen source-parts.cts. Scores, maps, render commands, audit reports and
receipts live under the public alias
~/artifacts/crash-the-stack-album/dead-sector-context-ii/.
Maintained game and album sources remain unchanged pending listening feedback.
If adopted, put the alternate phrase in the shared pool and arrange it in both
versions so the game and album stay in sync.

David approved both follow-up clips. The exact material is now adopted in the
shared game and album arrangements; see [Dead Sector II](DEAD-SECTOR-II.md).
