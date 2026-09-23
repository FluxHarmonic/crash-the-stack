# Closed Loop: Phrases I

Listening candidate, not an adopted release. The accepted shared source, game,
album and public player remain at their current versions pending David's review.
Both proposed arrangements are generated from the same candidate phrase pool.

## Musical changes

Keep the dry snap-click kit, kick, sub, minor-tine chords, relay taps, all patches
and the existing bus. Develop only channels 6 (signal pluck / energized pulse)
and 7 (answer bell), using the original eighth-note grid and explicit gates.

- **1:04–1:12 and 2:40–2:48:** the fourth calm/tense phrase's back half rises
  B–D–F#, answers E–D–C#, then follows the existing E-minor stab with E–B–G.
  The bell responds with G/E before D/B over the returning B bass. This keeps
  the response connected to the chord rather than repeating the previous bars.
- **1:20–1:28 and 2:56–3:04:** the fifth phrase answers with a different contour:
  B–D–F#, E–D–B, F#–A–C#, then D–C# into the bell's B. The last reply resolves
  while leaving the existing rhythmic break intact. The game's tense loop and
  the album's deliberate final-phrase variant receive the same melodic edits.
- **3:09–3:12:** the quiet ending recalls the opening B/D/F# cell in reverse,
  F#–D–C#–B, with a low A/F# bell response. There is still a complete four-second
  release section. The opening, exposed mechanism and fill are untouched.

These are phrase variations, not a louder mix. Original note-level ranges are
retained. Only a few response notes are added; the arrangement remains 3:16.

## Listening comparison

Every pair plays **before, then after**, including two release bars per half.
Both halves have fresh engine state, the same instrument bank and bus, and one
common monitoring gain. No independent normalization or new limiter is used.

| A/B file time | Passage | Full album source time |
| --- | --- | --- |
| 0:00 / 0:36 | Later calm replies, before / after | 0:56–1:28 |
| 1:12 / 1:48 | Later energized replies, before / after | 2:32–3:04 |
| 2:24 / 2:36 | Ending, before / after | 3:04–3:16 |

The change starts eight seconds into each calm/tense phrase. Listen for the
pluck rising and the bell answering, then for the descent into the final B.
Both complete versions are provided as well; judge whether the development
helps the track without making the circuit-wiring groove too busy.

## Sources and reproducibility

`parts-before.cts` and `arrangements.sgl` freeze the accepted source. The Sigil
composer derives `parts-after.cts`, both game/album candidates and six excerpts.
`source-checks.json` records hashes and the protected-channel assertions.
`comparison.json` provides render lengths and ordering. The maps describe each
excerpt. Shared pattern IDs 3, 4, 9, 10, 13 and 14 change on channels 6/7 only.
Instrument, bus, clock, order and all other channel events compare identical.

Once frozen here, the composer uses this reference for reproducible reruns;
it does not silently substitute a later accepted song. To adopt after listening,
reconcile any newer tracker/source edits first, apply the shared phrase diff,
and regenerate both arrangements with the normal guarded song tools. Do not
copy the generated album over the maintained source.

```sh
sigil docs/music/tools/closed-loop-phrases.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/closed-loop-phrases-replay

sigil docs/music/tools/expression-render.sgl \
  --motif "$PWD/build/dev/bin/motif" \
  --input "$PWD/docs/music/alternates/closed-loop-phrases-i" \
  --output "$HOME/Ops/artifacts/crash-the-stack-album/closed-loop-phrases-i" \
  --stage native
sigil docs/music/tools/expression-render.sgl \
  --input "$PWD/docs/music/alternates/closed-loop-phrases-i" \
  --output "$HOME/Ops/artifacts/crash-the-stack-album/closed-loop-phrases-i" \
  --stage delivery
sigil docs/music/tools/album-audit.sgl \
  --motif "$PWD/build/dev/bin/motif" --track closed-loop \
  --source "$PWD/docs/music/alternates/closed-loop-phrases-i/closed-loop-after.cts" \
  --output "$HOME/Ops/artifacts/crash-the-stack-album/closed-loop-phrases-i/audit"
```

Use a fresh artifact directory for rendering. Audio, renderer hash, commands,
level measurements and timing audit stay outside the repository. The native
renderer is the published Motif 0.6.6 dependency pinned by Crash.

## Source and timing validation

All fifteen maintained song regeneration checks pass. Both reference scores
match the accepted game/album exactly. The candidate album has 1,799 compiled
attacks, zero sample timing error, no off-grid melodic attacks and all final
gates released. This is seven more attacks over 3:16 than the accepted album;
the development primarily changes contour and response rather than density.

The game candidate has 1,690 compiled attacks, zero sample timing error and
its original final jump to order 6. Its one-pass duration remains 168 seconds.
A fresh `/tmp/closed-loop-phrases-replay` generation reproduced all 21 generated
files byte-for-byte, including the frozen pools, layout, complete scores,
comparison excerpts, maps and manifests. This verifies that later adoption
will not erase the audition's baseline or change the comparison silently.

## Audio validation and delivery

All eight native renders pass duration, 44.1 kHz stereo and nonclipping checks.
Both full native versions measure -20.1 LUFS-I and -4.7 dBTP. Calm and tense
pairs have identical integrated loudness (-20.2 and -19.4 LUFS-I respectively).
The ending changes from -22.4 to -22.7 LUFS-I, with the same -8.5 dBTP peak.

Delivery applies one common -0.5 dB gain. The 2:48 montage measures -20.4 LUFS-I;
both 3:16 full OGGs measure -20.5 LUFS-I. All three encoded true peaks are
-5.2 dBTP. The final second of each full track peaks at -90.3 dBFS. No added
limiter or per-half normalization is involved. These are comparison levels,
not an album-release master.

Audio lives in `~/Ops/artifacts/crash-the-stack-album/closed-loop-phrases-i/`,
with delivered files in `ogg/`. That directory retains native WAVs, exact
score snapshots, renderer hash, command lists, raw measurements, audit reports,
reproduction log and `README-renders.txt`. Native renderer SHA-256:
`f68c6737ccd25946e3b6135c6a75c18ac4c5318f511faa9216084c8d12d1d842`.

Telegram acknowledged the montage as message **1152**, full reference as
**1153**, and full candidate as **1154**. Source/tool commit: `1fbdf4f`.
Listening approval is pending. No maintained song, generated game asset,
accepted album score or public recording has been replaced.

## Listener decision and adoption

David approved the revision as more musical and requested adoption, mastering
and publication on 2026-09-23. The musical pass is complete; no further patch
or mix changes are proposed. The maintained shared pool now carries these
phrases, and both generated arrangements match the approved candidates exactly.
The original pool, arrangement layout, scores, audio and A/B remain preserved.
