# Dirty Cache: Phrases I

Listening candidate, not an adopted release. David requested Dirty Cache next
after approving Closed Loop. Preserve the accepted bass-led rhythm, quieter
calm opening, distant on-beat plucks, corrected G-minor/D-minor-seven/D-minor
return, complete original reed hook, and all instrument patches and mix settings.

## Musical changes

Four small changes develop the composition without raising the overall mix:

- **Lower bridge reply, around 1:03:** give the quiet reed an A–C–A question,
  followed by the familiar G–F–E–D descent. The original complete calm hook
  immediately before it stays intact. This album-only bridge now introduces
  a shape that can return later in the shared tense material.
- **Tense entrance, around 1:43:** keep the last bar's first bright chord stab,
  then omit the final two paired stabs. The existing bass and drum fill carry
  the remaining space into the first complete tense hook. This auditions a
  clearer entrance without further thinning the approved calm opening.
- **Tense development, around 2:02:** replace the first-half reed scale with
  a syncopated D–F–A / G–F–E question and a lower D–C–A / C–D answer across the
  four-bar phrase. Explicit gates and rests make it a complete musical reply.
- **Late lower callback, around 2:47:** recall A–C–A / G–F–E–D in the lower
  reed register before the original high hook returns at 2:54.545. This phrase
  is shared by game and album. In the game it acts as a lower-register answer
  within the tense section; the album also connects it to the earlier bridge.

The bass, kicks, snares, hats and channel-7 plucks are byte-for-byte identical
as channel event sequences. Preserve the original bass ghosts, portamento,
reed-hook slides and deliberate sixteenth syncopation. The pluck remains on its
approved eighth grid. Patches, bus, chart, arrangement order and length are
unchanged; no new synth feature is needed for this pass.

Changed shared pattern/channel pairs: 5/(5,6), 8/8, 10/8 and 13/8. The first
three affect both game and album; pattern 13 is the album's existing bridge.
The arrangement remains 222.545 seconds, or 3:42.545. Every generated reference
matches its maintained accepted source exactly before the changes are applied.

## Listening comparison

Each pair plays **before, then after**, including two release bars in each half.
Fresh engine state, identical instrument banks and one common monitoring gain
keep the comparison controlled. No per-half normalization or new limiter.

| A/B file starts: before / after | Passage | Full album source |
| --- | --- | --- |
| 0:00.000 / 0:21.818 | Calm hook into lower bridge reply | 0:52.364–1:09.818 |
| 0:43.636 / 1:05.455 | Chord gap into the first tense hook | 1:36.000–1:53.455 |
| 1:27.273 / 1:49.091 | Tense question and lower answer | 2:02.182–2:19.636 |
| 2:10.909 / 2:32.727 | Low callback into the final high hook | 2:45.818–3:03.273 |

The montage lasts 2:54.545. Both complete 3:42.545 versions are provided too.
Judge the entrance gap separately from the reed replies; either can be retained
independently after listening. The public soundtrack and maintained sources stay
at the approved version until this candidate is reviewed.

## Source and process

`parts-before.cts` and `arrangements.sgl` freeze the baseline. The Sigil composer
produces `parts-after.cts`, synchronized game/album candidates, eight excerpts,
section maps and the comparison manifest. Its source guards compare every
protected channel, patch, mix/clock field, chart and arrangement order.
`source-checks.json` records hashes and the declared changes.

Later reruns use the frozen reference, including after adoption, so a new
accepted version cannot silently become the audition's before side. To adopt,
first reconcile any intervening tracker/source edits, then apply the candidate
shared phrase diff and regenerate both arrangements with the guarded song tools.
Keep the game-specific loop overlay and album's finite ending.

```sh
sigil docs/music/tools/dirty-cache-phrases.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/dirty-cache-phrases-replay
sigil docs/music/tools/expression-render.sgl \
  --motif "$PWD/build/dev/bin/motif" \
  --input "$PWD/docs/music/alternates/dirty-cache-phrases-i" \
  --output "$HOME/Ops/artifacts/crash-the-stack-album/dirty-cache-phrases-i" \
  --stage native
sigil docs/music/tools/expression-render.sgl \
  --input "$PWD/docs/music/alternates/dirty-cache-phrases-i" \
  --output "$HOME/Ops/artifacts/crash-the-stack-album/dirty-cache-phrases-i" \
  --stage delivery
sigil docs/music/tools/album-audit.sgl \
  --motif "$PWD/build/dev/bin/motif" --track dirty-cache \
  --source "$PWD/docs/music/alternates/dirty-cache-phrases-i/dirty-cache-after.cts" \
  --output "$HOME/Ops/artifacts/crash-the-stack-album/dirty-cache-phrases-i/audit"
```

Use fresh output directories for renders. Audio, renderer hash, exact command
lists, raw measurements and audit reports remain outside the repository under
`~/Ops/artifacts/crash-the-stack-album/dirty-cache-phrases-i/`, with delivered
OGGs in `ogg/`. The renderer is Crash's pinned, published Motif 0.6.6 dependency.
