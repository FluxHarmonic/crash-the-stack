# Dirty Cache: connected reed sketch

David liked the direction of Phrases I but found the new lines plain, separated
into individual steps with gaps, sometimes feeling off-beat and like filler.
He requested one short clip without A/B. This is an articulation and melodic
shape experiment, not an adopted game/album revision.

The previous replies used almost uniform short gates and many disconnected
attacks. Passing a sample-clock/grid audit did not establish musical phrasing.
This revision uses a repeated D–F–G–A gesture, longer anchor tones, a contrasting
answer, selective connected slides, and rests between phrases rather than
between nearly every note. Main accents land on quarter-note positions; the
small passing movements use eighths. Timing is not randomized.

## What is in the clip

One continuous eight-bar sketch, then two release bars: **21.818 seconds**.
The first four bars present a lower D–F–G–A / C–A question and a resolved answer.
The next four recall the gesture an octave higher, answering with F–E before
the final G–F–E–C–D cadence. Selective F-to-G and G-to-F portamento joins keep
the reed envelope open; stronger tones have modest accents and longer gates.

Only channel 8 changes. Bass, drums, distant plucks, chords and mix settings
are retained from Phrases I's album patterns 19 and 14, played consecutively
for this sketch. These correspond to shared tense phrases 10 and 8. The order
here is an audition sequence, not the final album timeline. The instrument
is the existing focused reed throughout; no new patch or gain change is used.

If the direction is approved, develop the other replies consistently and
regenerate game/album candidates together. This sketch starts the lower line
on row zero, so adoption into shared phrase 10 must reconcile channel-8 entry
note-offs in both layouts rather than silently overwriting them. The calm
bridge would use its original softer reed patch and needs its own adaptation.
The existing maintained songs and public audio remain unchanged.

## Reproduction and checks

```sh
sigil docs/music/tools/dirty-cache-legato.sgl \
  --motif "$PWD/build/dev/bin/motif" \
  --output /tmp/dirty-cache-connected-replay
sigil docs/music/tools/album-audit.sgl \
  --motif "$PWD/build/dev/bin/motif" --track dirty-cache \
  --source "$PWD/docs/music/alternates/dirty-cache-connected-reed/dirty-cache-connected-reed.cts" \
  --output /tmp/dirty-cache-connected-audit
```

The composer reads the frozen Phrases I candidate and protects channels 1–7.
The compiled audit reports 386 attacks with zero sample error, correct pluck
placement and all final gates released; the connected 3xx notes correctly avoid
retriggering. All fifteen maintained song regeneration checks pass.

Audio and reproduction material live under
`~/artifacts/crash-the-stack-album/dirty-cache-connected-reed/`:
`render.sgl` records synthesis/encoding and accepts repository/output paths as
arguments. Run it into a fresh external directory. Native WAV, source snapshot,
renderer SHA-256, OGG, raw levels, audit and delivery reports are retained.
The OGG uses the same -0.8 dB monitoring gain as Phrases I, with no added limiter.
It measures -14.9 LUFS-I, -2.8 dBTP and -76.3 dBFS in the final second. Duration
and 44.1 kHz stereo checks pass. This is not a release master.

Telegram acknowledged the single clip as **message 1158**. No A/B or additional
full-track files were sent. Listening review is pending.

## Listening decision

David approved the sketch as much better and requested full integration.
[The full candidate](../dirty-cache-connected-full/README.md) preserves both
approved tense lines exactly and adapts the lower motif to the softer calm
bridge. Telegram message 1159 contains the complete track for listening review.
