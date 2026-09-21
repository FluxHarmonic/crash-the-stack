# Black Glass / Main Theme

David favors Black Glass's bold first impression for the title screen, and
requested a dedicated main-theme arrangement with an FM instrument recalling
demoscene game music. This is a separate title arrangement of the accepted
Black Glass / Grit, not a replacement or a sixteenth composition.

Subsequent feedback: the dirty chirpy voice is too loud, while the softer
passage works well. BLACK-GLASS-TITLE-II.md records its level reduction and a
restrained FM arpeggio audition. Preserve this first version for comparison.

## Theme and arrangement

The original kick, snare, sub rhythm, dark chord stabs and gritty/chirpy bass
patches remain intact. A new paired-operator FM voice adds a metallic attack
that settles into a rounded held tone. Its F–C–Ab / G–F hook is deliberately
short and recognizable. Higher answers and a low-register bridge develop it.
In the principal statements the FM phrases trade bars with the gritty bass;
other passages retain the continuous grit groove with brief FM replies.

The bass and kick enter immediately. Grit first appears at 5.143 seconds;
the full statement starts at 6.857. The lower bridge creates space for the
return without substituting an upbeat major-key passage. The lift uses the
same kit, no noise swell and no thirty-second snare roll. The final beat
releases the voices, leaving ambience to carry into the loop return.

| Order | Section | Bars | Start (seconds) |
| --- | --- | --- | --- |
| 0 | One-time entrance | 4 | 0.000 |
| 1 | Theme statement | 8 | 6.857 |
| 2 | Grit groove / FM answers | 8 | 20.571 |
| 3 | Theme development | 8 | 34.286 |
| 4 | Lower bridge | 8 | 48.000 |
| 5 | Same-kit lift | 4 | 61.714 |
| 6 | Theme return | 8 | 68.571 |
| 7 | Grit variation / answers | 8 | 82.286 |
| 8 | Release | 8 | 96.000 |
| 9 | Turnaround | 8 | 109.714 |

F minor, 140 BPM, speed 3, eight channels. Full length is 123.428571 seconds
(72 bars); B01 returns to the statement after the one-time entrance. A
separate B00 menu-loop export is 116.571429 seconds. Both WAV and OGG are
retained, but only the complete entrance-plus-body version goes to Telegram.
The OGG itself is a one-pass listening file; game playback must honor the
source loop point or use the independent loop export appropriately.

## Reproduction and checks

`compose-black-glass-title.sgl` preserves the explicit FM phrases and arrangement
map, using selected patterns from the accepted Grit source. It refuses to
overwrite edited output. Fresh reproduction matches the authored source.

```sh
sigil docs/music/tools/compose-black-glass-title.sgl --motif "$MOTIF_BIN"
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks black-glass-title --format both
```

The full and loop sources validate and print canonically. The original bank
and master bus match Grit exactly; only the new FM instrument is added.
Voice counts are 1/1/2/1/3/6/2/1. Onsets remain on the sixteenth grid, with
the FM melody on eighths. Full and independent-loop compiled clocks are
checked against the authored events and B01/B00 destinations. All channels
receive an explicit final-beat release.

Audits find 1,298 full and 1,229 loop triggers, both with zero sample-clock
error. WAVs contain zero saturated samples; full peak/RMS are -2.41/-19.19
dBFS, loop -2.03/-19.17. Both OGGs decode cleanly as stereo 44.1 kHz Vorbis
with matching durations; tagging preserves decoded PCM. Standalone-loop DSP
starts fresh, so its measurements need not match a cut of the full render.

This is an offline title-screen audition. The main-theme balance awaits
David's feedback, and continuous playback/live loop behavior still needs
checking in the game. It is not the finite album arrangement or an album
master. The complete review workflow is in AUDIO-REVIEW-PROCESS.md.
