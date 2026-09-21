# Obsidian Index / Waves III

David accepted Pedal II's distinct composition and requested a little waviness
in the pedal plus delicate pad support at the sides. Preserve II as the
accepted arrangement; `docs/music/alternates/obsidian-index/obsidian-index-v3.cts` is a separate texture audition.

David subsequently could not hear enough change in either the pad or bass.
Keep III as history, not an accepted improvement. OBSIDIAN-IV.md records the
stronger follow-up; the accepted composition itself remains Pedal II.

The original triangle bass remains centered with its exact patch and events.
A quiet additive-FM layer adds paired upper harmonics with a tiny detuning,
plus slow 0.16 Hz chorus. Its gain is 0.45 relative to its own patch output;
the carrier levels keep it beneath the triangle. Its 12 ms attack leaves the
original 3 ms bass attack in front, and its 55 ms release matches the bass.
This adds movement above the fundamental without a new rhythmic wobble.

The existing chord channel moves from pan -0.20 to -0.42. A faint upper chord
voice at pan +0.60 complements it, using the same roots, thirds/fifths and
sevenths one octave higher. The new pad uses a 240 ms outer attack, staggered
carrier attacks, 0.13 Hz chorus and two gently detuned copies. It follows all
32 existing pad gates at level 11, including the B/E/A suspension. Releases
remain 0.4 seconds, inside the existing space before chord changes.

To keep the eight-channel format, the 24 short contact notes move into empty
rows on the shaker channel. Their pitches, starts, gates and levels remain
identical; they now share the shaker's rightward pan and dry routing. Channel
8 becomes the new side pad. All other original cells remain intact. Voice
counts are 1/1/2/2/7/1/1/3, within the current engine's budgets.

All six principal channels' compiled event tables match Pedal II exactly.
The event comparison also verifies the contact relocation and chord-following
pad additions. The full grid audit finds 788 triggers, zero off-sixteenth
onsets and zero sample error. Tempo, sections, master bus, full duration
(194.285714 seconds), tense entry (102.857143) and loop behavior are unchanged.
Full and section sources validate and print canonically.

All three WAVs have zero saturated samples. Full peak/RMS are -6.16/-24.94
dBFS, calm -6.40/-24.81 and tense -6.40/-24.91. Stereo 44.1 kHz OGG decoding,
durations and tag preservation pass. These changes remain deliberately subtle;
listening feedback will determine whether the added motion and air are enough.

Render full/loop WAVs and OGGs with `render.sgl --tracks obsidian-index-v3
--format both --motif "$MOTIF_BIN"`; audit with the corresponding
`timing.sgl --tracks obsidian-index-v3` command. Retain the source snapshots,
event audit, metrics, exact render commands and checksums with the Ops exports.
Only the full OGG goes to Telegram. The game-owned collection remains in
authorized temporary Motif staging, awaiting its crash-the-stack handoff.
