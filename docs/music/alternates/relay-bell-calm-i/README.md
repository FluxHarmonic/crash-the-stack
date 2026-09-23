# Relay Ghost: calm bell comparison I

David prefers the Expression I drums: less noisy, leaving the other parts room
to breathe. Retain the contact/dust kit for subsequent Relay Ghost auditions.
The wire pluck has not been approved. The metallic bell is interesting, but
the existing bell also works, so compare them in the calm arrangement before
choosing. No accepted album/game arrangement or public audio is replaced here.

Both halves use the preferred drums (instruments 2, 3 and 21), the original
pluck, and the first sixteen full calm bars from album patterns 1 and 2. The
only instrument difference is the bell, id 9. This auditions the previously
heard suspended-metal patch unchanged; no new bell-brightness or gain change
is introduced. Both halves start from fresh renderer state and include two
bars of release. No isolated-instrument monitoring boost is used.

| Start | Material |
|---|---|
| 0:00.000 | Existing bell, sixteen calm bars |
| 0:29.091 | Two release bars |
| 0:32.727 | Metallic bell, identical sixteen calm bars |
| 1:01.818 | Two release bars |

Total encoded duration: 1:05.455. The common delivery gain is -1.1 dB, the same
as Expression I. Each native half measures -16.7 LUFS-I; combined OGG measures
-17.8 LUFS-I with -3.4 dBTP. All 366 note attacks per half and the complete
compiled tick tables match across eight channels. Notes, bus, order and all
non-bell instruments compare equal. The parser validates both scores.

Reproduce from the album worktree with a fresh external output directory:

```sh
sigil docs/music/tools/relay-bell-context.sgl \
  --motif "$MOTIF_BIN" \
  --output "$AUDITION_DIR"
```

The script retains canonical scores/maps here and writes source snapshots,
WAVs, OGG, exact command arguments, hashes and checks outside the repository.
Delivered artifacts: `~/Ops/artifacts/crash-the-stack-album/relay-bell-calm-i/`.

David also asked whether the squeaky bass line over the top is too loud.
A roughly 2 dB reduction is worth comparing with the preferred drums. Clarify
whether he means the higher acid pattern on channel 8 (instruments 23–25) or
the lower grit bass on channel 4 (instrument 19) before changing that part.
The calm bell comparison contains no bass-level change.

## Listening decision

Telegram acknowledged this comparison as message 1138. David chose the original
bell as more appropriate for Relay Ghost. Retain it in further revisions.
He likes the metallic patch itself; preserve it in the expression collection
for a different musical context rather than discarding it. The quieter drums
remain preferred. No wire-pluck or bass-level decision is implied by the bell
choice, and the public arrangement has not been replaced.
