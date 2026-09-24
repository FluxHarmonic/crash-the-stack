# Obsidian Index: a focused glass-answer audition

David loves the existing track and approved exploring its melodic development.
Begin with one controlled phrase comparison before any pedal-tone experiment.
The accepted Waves IV pedal, audible side pads, Tension V lower replies and
frame accents are the reference, with no patch or level changes in this test.

Use the third tense phrase: shared phrase 7, album pattern 8 at 2:40–3:02.857.
Preserve the opening glass statement and its release through row 139. The later
answer keeps its initial G3, rises to B3, descends A3–G3–F-sharp3, then answers
B3–G3–E3 across the suspended harmony and E-minor return. The B3 moments meet
the existing lower-answer B3 accents in unison; the final G and E outline the
returning minor chord. Two additional glass attacks complete the answer.
This is a score-based harmonic review; listening decides whether it improves
the accepted phrase.

Both halves contain eight musical bars and two release bars, synthesized from
fresh state. Original starts at 0:00; candidate at 0:28.571; total is 57.143
seconds. The first difference is a slightly longer G3 gate around 0:42.589 in
the combined clip. The first changed attack is B3 at 0:42.857 (compare the
original E3 at 0:14.286). The rest of each opening is identical.

The composer checks that all seven other channels remain exact, along with the
opening melody and its gate. Both halves use the same instrument bank and bus.
Do not adopt either generated excerpt directly: if approved, apply the later
channel-6 events to shared phrase 7, translating album instrument 8 to shared
instrument 7, then regenerate both maintained arrangements.

Reproduction:

```sh
sigil docs/music/tools/obsidian-phrase-audition.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/obsidian-phrase-scores
sigil docs/music/tools/short-ab-render.sgl \
  --motif "$PWD/build/dev/bin/motif" \
  --input /tmp/obsidian-phrase-scores --output /tmp/obsidian-phrase-audio
```

The composer accepts --source FILE to replay the frozen source-album.cts after
future changes. Scores, maps, audio, measurements and source snapshots stay
outside Git under the public alias ~/artifacts/crash-the-stack-album/:
obsidian-phrase-i/ and obsidian-phrase-i-audio/.
The maintained game and album scores remain unchanged.

Compiled audits pass for 97 original and 99 candidate attacks, both with zero
samples of clock error, paired pad roots/releases and all final gates released.

Native original/candidate halves measure -22.9/-22.8 LUFS-I, both -6.1 dBTP.
The A/B uses a common -0.5 dB monitoring gain with no extra compression or
limiting. Encoded audio measures -23.2 LUFS-I and -6.5 dBTP; its final second
peaks at -91 dBFS. Duration and stereo 44.1 kHz checks pass.

Telegram delivered obsidian-glass-answer-i-ab.ogg as message 1214. That file is
a hard link to the renderer's comparison.ogg, avoiding duplicate audio storage.
This audition was not adopted; no shared or generated score changed.

## Listening decision

David preferred the original: it sounded more mysterious. Retain the original
glass melody in both arrangements. The proposed E landing and connected descent
made the answer more conclusive; that is a score-based explanation of why the
change may have reduced the ambiguity he values, not a confirmed listening
diagnosis. More explicit resolution is not automatically an improvement.

Future experiments should preserve this melodic uncertainty and its spaces.
If exploring the pedal texture, isolate that change without rewriting the
melody or altering the approved side-pad balance. No further change is adopted.
