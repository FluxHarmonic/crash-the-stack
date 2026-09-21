# Black Glass / Main Theme III

David likes the second title version's improved balance but says its melodic
arpeggios are not what he meant. His optional idea is a brief old-game-style
arpeggiated instrument, potentially a stab that appears occasionally. A rapidly
cycling tracker chord is the likely interpretation, not an approved new part.
At this stage the separate sound was deferred. David subsequently confirmed
the rapidly cycling tracker chord and requested it explicitly; see
BLACK-GLASS-TITLE-IV.md for that separate audition.

`docs/music/alternates/black-glass/black-glass-title-v3.cts` restores the first title version's entire FM
lead line and preserves II's approximately 4 dB reduction of the 128 chirpy
grit/tear accents. The sub, softer Reese, drums, chords, contacts, bridge,
turnaround, instrument patches and master bus remain intact. No extra
instrument or arpeggiated stab is added. Retain title I and II for comparison.

Reproduce with `compose-black-glass-title.sgl --revision 3`, then render with
`render.sgl --tracks black-glass-title-v3 --format both --motif "$MOTIF_BIN"`.
The helper still reproduces revision II exactly after sharing its level-edit
routine. Full and independent menu-loop sources validate and print canonically.

Score comparison matches the first title exactly except for the intended 128
grit-note level reductions. The complete compiled lead table matches title I;
the complete grit table matches II. All other compiled channel tables match I.
The full arrangement retains B01 and lasts 123.428571 seconds; the independent
B00 menu loop is 116.571429 seconds. Game-player loop integration remains a
separate check. Only the complete full OGG is delivered for listening.

Full/loop audits find 1,298/1,229 triggers with zero sample-clock error. Both
WAVs contain zero saturated samples: full peak/RMS -3.00/-19.50 dBFS, loop
-2.68/-19.49. Both OGGs decode cleanly as stereo 44.1 kHz Vorbis with matching
durations; tagging preserves decoded PCM. Installed artifacts are checksummed.
