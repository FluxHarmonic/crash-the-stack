# Dirty Cache: more room for the tense section

David loved Shadow Protocol's subtle tense development and Breach Vector's
variations; those adaptive arrangements are accepted references. Dirty Cache's
tense section sounded different but did not change its character enough. He
suggested restraining the early part so it could open up later.

`dirty-cache-adaptive-v2.cts` is a separate audition titled **Dirty Cache /
Calm to Tense II**. Only calm orders 0–7 change:

- Remove the odd-row closed hats, leaving the even-row pulse and existing open
  hats. This removes 208 hat cells, approximately halving the calm hat activity.
- Use a softer FM chord at 900 Hz cutoff / index 0.5, replacing 1300 Hz / 0.65,
  with accents at 80 percent of their old tracker levels. The voicings and
  corrected G-minor to D-minor-seven return remain unchanged.
- Reserve the complete nine-note reed hook for its later calm appearance in
  order 5, around 48 seconds. Its earlier repetition in order 2 is omitted.
  The later phrase remains intact, along with all tense reed responses.

Bass, kick, snare and on-beat pluck cells are unchanged throughout. Their
compiled channel tables match the first adaptive version exactly. The pluck
patch, distant level and placement remain accepted reference choices. Every
transition and tense pattern is source-identical to the first adaptive pass;
this comparison changes the musical context preceding them. All prior sources
and exports are retained.

The layout remains calm 0–7, transition 8, tense 9–18 with B09. The transition
starts at 1:09.818 and tense at 1:18.545; full duration is 165.818186 seconds.
Independent calm and tense loop sources/exports accompany the full audition.
Only the full OGG is delivered to Telegram. David found this much better as a
composition and accepted it as the current Dirty Cache arrangement.

Reproduce exports and clock audits with:

```sh
sigil docs/music/tools/adaptive-timing.sgl --tracks dirty-cache-adaptive-v2 \
  --output build/content/dirty-calm-ii
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks dirty-cache-adaptive-v2 --format both
```

All full and standalone sources validate and print canonically. The compiled
trigger audit finds zero sample-clock error: 2,941 full triggers, 1,019 calm
and 1,747 tense. The standalone tense WAV is byte-identical to the previous
adaptive tense WAV, verified by SHA-256.

Full WAV peak/RMS are -1.69/-16.12 dBFS. Calm and tense loop peaks are -1.69
and -1.31 dBFS, respectively; none of the three WAVs has saturated samples.
All three OGGs decode cleanly at stereo 44.1 kHz with matching durations, and
title tagging preserves decoded PCM. Calm/tense region RMS in the full render
is -16.30/-15.98 dBFS: the retained low end keeps average level steady while
the early upper parts become less dense. David's subsequent listening feedback
confirmed that the revision improved the composition.
