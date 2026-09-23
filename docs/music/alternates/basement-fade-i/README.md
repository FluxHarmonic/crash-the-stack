# Basement Circuit: acid fade I

David rejected Turnaround I's abrupt gap and low sliding tail but still wants
the acid line to trail out. He requested the same short context with a volume
fade, delivered as a single clip without A/B. Use the liked Expression I
candidate as the baseline; none of the rejected notes or gap are included.

The existing final acid rhythm fades over two bars. Only channel 6 note volumes
change in shared phrases 10 and 13, so game and album candidates stay aligned.
The gain factor for rows 192–254 is ((256-row)/64)^2, applied to each original
note's volume. The minimum is 1 because zero in the tracker volume column means
no override, rather than silence. The original row-255 gate release remains.
No pitches, gates, slides, triggers, patch definitions or backing events change.
The acid patch's velocity-sensitive filter naturally softens with its volume;
this is not independent post-filter gain automation.

Motif also supports Axy channel volume slides and Cxx direct volume settings.
Explicit note-volume scaling suits this repeated, accented line and preserves
its existing 3xx slide effects in the single effect column. Merely adding Axy
without changing subsequent notes would let their explicit levels reset the fade.

The 15.484-second clip contains two lead-in bars, two fading acid bars, two calm
reprise bars and two release bars. The fade starts at 0:03.871 and the reprise
at 0:07.742. Only this single clip is rendered for listening; complete candidate
scores are retained for synchronized adoption if approved.

Reproduce the source from the album repository:

```sh
sigil docs/music/tools/basement-fade.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/basement-fade-replay
```

Audio and reproduction commands live under
~/Ops/artifacts/crash-the-stack-album/basement-fade-i/. Its render.sgl accepts
repository and fresh output paths, uses the pinned Motif native renderer, and
encodes OGG with the same -0.5 dB monitoring gain as Expression I. Source and
renderer hashes, measurements, audit and delivery evidence are retained there.
The maintained game/album scores and public release remain unchanged.

## Checks and delivery

Telegram acknowledged the single clip as **message 1165**. No A/B or additional
full tracks were sent. Listening feedback is pending. The clip measures
-16.4 LUFS-I/-4.6 dBTP, with a -90.3 dBFS final second; duration and stereo
44.1 kHz format checks pass.

Compiled comparisons confirm identical acid pitches, gates, slides and trigger
times, every backing-channel tick unchanged, no acid-volume increase, and a
final acid level of 1/64. All nine generated files reproduce byte-for-byte.
All fifteen maintained-song regeneration checks pass. This remains a proposed
shared-source change until listening approval.
