# Stone pair I — Dead Sector and Obsidian Index

David asked to continue after delivery of the pocket pair. These arrangements
fill positions eleven and twelve. Keep Dead Sector's minimal semitone mystery
and Obsidian's accepted Pedal II composition with Waves IV texture. The audible
side pads and moving bass harmonics are preserved exactly, along with both
tracks' instrument banks and mix buses. Game assets remain untouched.

## Dead Sector — 3:11.111, 86 bars, 108 BPM

A short entrance presents G#–D–C# over the low pulse and quiet contacts. All
four calm phrases remain complete. Between the second and third, a four-bar
suspended passage exposes the upper-neighbor friction, briefly removes the
kick, then lets the bass and pulse return. The accepted quiet transition leads
to all four focused phrases, preserving the syncopated rhythm David liked.

An eight-bar reprise uses the full final calm probe phrase, reducing the drums
then withdrawing them in its second half. The low pulse becomes quieter while
the probe returns to C#3. Two explicit release bars follow. The piece remains
small and watchful, with no new pad bed, riser or larger drum sound.

| Time, rounded | Section |
|---|---|
| 0:00 | First probe and emerging sealed pulse |
| 0:09 | First two complete calm phrases |
| 0:44 | Suspended contact, then pulse returns |
| 0:53 | Remaining calm phrases |
| 1:29 | Accepted quiet transition |
| 1:38 | Complete focused sequence |
| 2:49 | Probe reprise and low C-sharp withdrawal |
| 3:07 | Released room tail |

## Obsidian Index — 4:05.714, 86 bars, 84 BPM

The new four-bar entrance exposes E pedal and both chord pads before the glass
E–B leap and held A appear. Keep all four complete calm variants and the original
suspended transition. Their uneven three/three/two-bar harmony, held melodic
passages and low frame-drum answers preserve the identity of the accepted rework.
All four focused phrases retain the moving bass, subtle ghosts and lower replies.

A complete eight-bar reprise restores the opening melody; percussion falls away
halfway through while the chord support retains its accepted level. The new
four-bar ending settles to Em7 over E, with a B–G–F#–E glass descent and longer
bass gates that leave room for its upper harmonics to move. The left and right
pads release together before two tail bars. No patch gain, chorus, stereo width
or bus reverb is changed.

| Time, rounded | Section |
|---|---|
| 0:00 | E pedal and wide chord support, then glass emerges |
| 0:11 | Four complete unfolding calm phrases |
| 1:43 | Accepted suspended transition |
| 1:54 | Four focused glass/lower-answer phrases |
| 3:26 | Complete opening theme as accompaniment thins |
| 3:49 | E-minor landing and lingering pedal |
| 4:00 | Released room tail |

## Reproduction and score checks

`album-compose-stone.sgl` reads assets/tunes/dead-sector.cts and
obsidian-index.cts. The canonical scores and exact maps beside this report
regenerate byte-for-byte. Instrument-bank and bus AST equality with both game
references passed. No game phrase backport is proposed.

Both scores use the speed-3, thirty-two-row bar clock. The audit finds 806 and
870 compiled attacks respectively, with zero sample-clock error and no
thirty-second attacks. Probe, glass and answering voices stay on eighths. Both
pass canonical validation, finite traversal, voice budgets and final gate release.

Obsidian's 37 main/side pad pairs share roots, voicing types and gate positions.
The reusable album audit now verifies those relationships and requires an
explicit release at least six rows before each new chord, across section
boundaries as well as within phrases. At 84 BPM this is approximately 0.536
seconds, longer than the patch's 0.4-second release. Negative controls reject
missing release, short gap, wrong root and wrong voicing; valid entry/release
passes. This guards the harmonic clarity requested during the original rework.

Audio and raw evidence live in
~/Ops/artifacts/crash-the-stack-album/stone-pair-i/, including native sources,
canonical snapshots, exact command manifests and hashes. Native WAV precision
remains 16-bit. These are provisional album auditions, not release masters.
