# Fault Line: timing, interlude fills and guitar fuzz

Composition III retains the 2:59.048 rock-led form of [II](FAULT-LINE-II.md).
David liked the variations but heard late melody notes around 0:54, wanted fills
into and out of the interlude, and requested a little more guitar fuzz.

## Listening guide

- **0:53.333:** the lower alternate solo now anchors its actual attacks to the
  eighth-note grid. Eight of its 25 notes move earlier: seven by one sixteenth
  and one by one eighth. Pitches, velocities and order are retained. The other
  lead and clean-guitar phrases retain their timing.
- **1:22.857:** a descending, diminishing tom/snare fill leads into the quiet
  interlude at 1:23.810, replacing the final bar's normal percussion.
- **1:37.619:** a rising tom/snare pickup builds over the last three beats of
  the interlude. A restrained crash marks the moving entrance at 1:39.048.
- **Throughout the rock sections:** rhythm-guitar FM drive rises from 3.5 to
  4.4 and its saw layer from 2.3 to 3.1. Guitar gain is multiplied by 0.94
  (about -0.54 dB) to compensate. Bass, leads, clean guitar, pads and drum
  patches remain unchanged, as does the mix bus.

The timing review also found an ineffective bend in II's alternate solo. Its
3xx command had no target pitch or sufficient continuation rows. III explicitly
targets A4 from G4 and continues the held slide across four rows. Compiled events
verify eight pitch updates without retriggering, reaching A4 before the next
attack. The original higher solo is unchanged. This was score notation, not an
engine timing defect.

## Shared game draft and scope

Both generated versions receive the shared guitar patch changes and entrance
crash. The alternate solo and interlude fills belong to the album form. The
album's down-fill is a separate named variant so it does not interrupt the
game's tense groove. Game calm/fill/tense layout and loop destinations remain
unchanged; the finite game audition is 2:24.762 with its release tail.

The draft remains under docs/music/alternates/. No runtime selection, existing
game assets or published soundtrack audio changes in this pass. These are
clean-gain auditions, not release masters.

## Reproduction and checks

Composition II's shared sources are frozen under
`docs/music/alternates/fault-line-composition-ii/`. The Sigil revision composer
reproduces both maintained source files exactly into a fresh directory:

```sh
sigil docs/music/tools/fault-line-transitions.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/fresh-fault-line-iii
sigil docs/music/tools/fault-line-transitions-audit.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/fault-line-iii-checks
sigil docs/music/tools/songs.sgl --stage check --motif "$PWD/build/dev/bin/motif"
sigil docs/music/tools/fault-line-render.sgl --stage native --revision iii \
  --variant album --motif "$PWD/build/dev/bin/motif" --output /absolute/fresh/render-directory
sigil docs/music/tools/fault-line-render.sgl --stage delivery --revision iii \
  --variant album --motif "$PWD/build/dev/bin/motif" --output /absolute/fresh/render-directory
```

Use `--variant game` for the finite game preview. The targeted audit checks
solo grid, note identity, compiled bend behavior, fill placements and patch
scope. Finite-score audits check sample-clock alignment, released final gates
and channel voice budgets. These checks support the timestamp-based listening
review; they cannot establish whether a phrase feels musical.

Render commands, measurements and files live outside the repository at
`~/artifacts/crash-the-stack-album/fault-line-composition-iii/`.
The preflight-missing-bend subfolder preserves the superseded preliminary album
render; only the corrected top-level album render is for delivery.

## Verified exports

album: +2.3 dB clean gain, -19.5 LUFS-I, 11.8 LU range, -2.0 dBTP, final second -84.3 dBFS.

game: +2.2 dB clean gain, -20.1 LUFS-I, 9.8 LU range, -2.2 dBTP, final second -78.3 dBFS.

Both decoded OGGs pass duration, stereo 44.1 kHz, peak and tail checks.
The album has 2,684 actual attacks and the game preview 2,136; both have zero
sample-clock error and released final gates. All sixteen shared-song checks
pass, and the revision composer reproduces both shared source files exactly.

David approved this album composition. A mastered sharing version is documented
in [share master I](FAULT-LINE-MASTER-I.md).
