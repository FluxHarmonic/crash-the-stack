# Pocket pair I — Dirty Cache and Basement Circuit

David requested the next pair while listening to Blind Spot and Sector Drift.
These fill positions nine and ten. Preserve the accepted on-beat distant pluck,
corrected harmony and calm/tense contrast in Dirty Cache, and the integrated
Signal Kit IV drums, reduced swell and lower acid accents in Basement Circuit.
All game assets, instrument banks and mix buses remain unchanged.

## Dirty Cache — 3:42.545, 102 bars, 110 BPM

A four-bar distant pluck entrance admits a few bass gestures before the original
bass-led opening. The restrained calm material remains complete, including the
corrected G-minor to D-minor-seven to D-minor return. The full nine-note reed hook
still appears later in the calm section; it is not restored to the earlier
position rejected in the first adaptive arrangement.

After that hook, a new lower A–G–F–E–D reed echo sits above the existing bass
pocket and quiet pluck. The drums return softly for four bars before the remaining
calm phrases. The original filter transition leads to all ten focused phrases.
A complete calm hook reprise reduces the pressure, then the upper accompaniment
withdraws into a compact rhythmic D-minor ending with a final F–E–D pluck answer.

| Time, rounded | Section |
|---|---|
| 0:00 | Distant pluck and approaching bass pocket |
| 0:09 | Original bass-led opening and restrained calm material |
| 0:44 | Corrected harmonic excursion and return |
| 0:52 | Calm phrase containing the complete reed hook |
| 1:01 | Lower reed echo over bass and pluck |
| 1:10 | Soft drums reassemble |
| 1:19 | Remaining calm phrases |
| 1:36 | Accepted filter transition |
| 1:45 | Complete focused sequence |
| 3:12 | Complete calm reed hook reprise |
| 3:21 | Upper layers withdraw |
| 3:29 | Rhythmic D-minor closure |
| 3:38 | Released room tail |

Keep the native speed-6, sixteen-row bars. Odd-row bass ghosts, snare ghosts and
slides are musical placements, not timing errors. The plucks remain on beat;
the new notes retain the accepted patch and restrained written levels. No new
instrument or brighter early chord patch is introduced.

## Basement Circuit — 3:40.645, 114 bars, 124 BPM

An eight-bar entrance starts with kick, offbeat bass, sand ticks and occasional
small percussion before the pluck and chords enter. All five complete calm
phrases remain. A short A-pedal passage between phrases three and four passes
small answers between pluck and bell, exposing the hollow tom and logic pip.
The accepted quiet swell and integrated fill still lead directly into all five
acid phrases, with their reduced accents, filter variants and slide effects.

An eight-bar reprise returns the complete opening pluck theme over gentler drums.
The eight-bar ending begins with the familiar groove, then settles on A minor,
spacing the kick and sub and resolving C–E–B–A in the pluck. A final distant E
bell leaves the tonic harmony to decay. No additional swell or acid flourish
is added to the closing passage.

| Time, rounded | Section |
|---|---|
| 0:00 | Low-lit pulse, then pluck emerges |
| 0:15 | First three calm phrases |
| 1:02 | Small signals over an A pedal |
| 1:10 | Last two calm phrases |
| 1:41 | Accepted restrained swell and fill |
| 1:48 | Complete acid development |
| 3:06 | Opening pluck returns as pressure recedes |
| 3:21 | A-minor circuit winds down |
| 3:37 | Released room tail |

## Reproduction and score checks

`album-compose-pocket.sgl` reads assets/tunes/dirty-cache.cts and
basement-circuit.cts. Canonical album scores and exact section maps live beside
this report. Both regenerate byte-for-byte from the composer. Instrument-bank
and bus AST equality with each accepted source passed. No game backport is
proposed; game assets, runtime source and package configuration are untouched.

The compiled audit finds 3,484 attacks for Dirty Cache and 2,933 for Basement
Circuit, with zero sample-clock error. Both pass finite traversal, canonical
parser validation, voice budgets and final gate release. Dirty Cache retains its
sixteen-row bar policy; Basement uses thirty-two-row bars and preserves exactly
four deliberate thirty-second snare hits in its original transition, now album
pattern 7. Pluck timing in Dirty Cache and bell timing in Basement are checked
on the eighth grid. Acid slides retain their native non-retriggering behavior.

Audio, snapshots, command manifests, hashes and raw measurements belong in
~/Ops/artifacts/crash-the-stack-album/pocket-pair-i/. Native WAV export remains
16-bit; these are provisional album-level auditions, not release masters.

## Provisional mastering and full render results

| Track | Native LUFS-I | Gain | WAV LUFS-I | OGG LUFS-I | OGG true peak | Master LRA |
|---|---:|---:|---:|---:|---:|---:|
| Dirty Cache | -14.8 | -1.5 dB | -16.4 | -16.3 | -2.3 dBTP | 3.3 LU |
| Basement Circuit | -16.2 | 0 dB | -16.2 | -16.2 | -2.4 dBTP | 4.6 LU |

Dirty Cache's native level exceeds the heavier opening titles, so attenuation
places it near Relay Ghost rather than pushing its bass forward. Basement's
native level already suits this part of the sequence and receives no added gain.
Both pass through the provisional pilot processing chain with no added EQ,
reverb or widening. Native loudness ranges are 3.4 and 4.6 LU; the resulting
3.3 and 4.6 LU retain the existing character at reported precision. Do not
mistake the low LRA of a steady groove for heavy new mastering compression.

All four native/master WAV/FLAC/OGG durations match the score maps within one
sample. Master WAV and decoded FLAC PCM match exactly. Final master seconds peak
at -90.3 dBFS for Dirty Cache and -84.3 dBFS for Basement; both WAVs and decoded
OGGs pass the -1 dBTP ceiling. Technical checks establish consistency, not
musical acceptance. Ten of fifteen full arrangements now exist; feedback on
this pair and the preceding air pair remains open.

Telegram acknowledged the complete Dirty Cache album I OGG as message 1122 and
Basement Circuit album I as message 1123. Both full files were delivered once;
listening feedback remains open.
