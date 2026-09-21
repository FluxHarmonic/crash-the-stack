# Air pair I — Blind Spot and Sector Drift

David found the album work so far sounded great and requested the next pair.
These fill album positions six and eight, on either side of Quiet Array. Keep
the accepted delicate stealth texture and dusty broken-beat identity distinct.
Game assets, instrument banks and mix buses remain unchanged.

## Blind Spot — 3:15, 78 bars, 96 BPM

The original 170-second body already has a complete calm-to-watchful arc. Retain
its long spaces rather than adding a busy bridge. The new four-bar entrance
previews the A–F–E signal over a brief room tone and minor dyad; low footsteps
arrive gradually. All four calm and four tense phrases remain intact, separated
by the original quiet transition. A new four-bar ending answers F–E with D as
the percussion and bass recede, followed by two explicit tail bars.

| Time | Section |
|---|---|
| 0:00 | Room edge and three-note signal |
| 0:10 | Four complete calm phrases |
| 1:30 | Quiet crossing |
| 1:40 | Four watchful pulse phrases |
| 3:00 | Footsteps recede and signal resolves to D |
| 3:10 | Released room tail |

The room tone remains intermittent, not a continuous pad bed. Existing soft
footfall, muted rim, cloth tick and metallic latch patches retain their levels.
The new entrance and ending use restrained written accents within that palette.

## Sector Drift — 3:36, 90 bars, 100 BPM

The entrance presents the D–F–D / Bb–A pluck figure before the dusty kit emerges.
Retain all four reflective and four focused phrases. After the first two focused
phrases, a four-bar bass-and-dust breakdown removes the chord/pluck layer and
passes a G–Eb–D–C answer to the bell over the C-minor portion. The final two
focused phrases return, then a complete eight-bar calm theme reprise restores
the original pluck/bell relationship over quieter drums. A composed G-minor
landing resolves the pluck to G and leaves a distant D bell above the tonic.

| Time | Section |
|---|---|
| 0:00 | Tine signal and emerging dusty groove |
| 0:09.6 | Four complete reflective phrases |
| 1:26.4 | Accepted transition |
| 1:36 | First two focused phrases |
| 2:14.4 | Bass and dust, then descending bell response |
| 2:24 | Final two focused phrases |
| 3:02.4 | Complete calm theme reprise |
| 3:21.6 | G-minor landing |
| 3:31.2 | Released room tail |

Preserve the accepted Dust Kit's felt kick, woody rim and darker hats. No new
patch, additional riser, brighter reharmonization or mix-bus change is added.

## Sources and verification

`album-compose-air.sgl` reads assets/tunes/blind-spot.cts and sector-drift.cts
and writes finite album scores and section maps beside this report. Both retain
the native speed-3, thirty-two-row bar grid. Melodic signals stay on eighths;
all rhythmic attacks remain on the sixteenth grid without thirty-second rolls.

The compiled audit counts 645 attacks for Blind Spot and 1,260 for Sector Drift,
with zero sample-clock error. Both pass canonical parser validation, voice
budgets, finite playback and final gate release. Instrument banks and bus ASTs
equal the game references exactly. Regenerating both scores and maps into a
temporary directory reproduces them byte-for-byte. No game backport is proposed.

All audio and raw reports belong in
~/Ops/artifacts/crash-the-stack-album/air-pair-i/. Retain the native sources,
canonical snapshots, exact command manifests and hashes. Native source precision
remains 16-bit; these are provisional album-level auditions, not release masters.
