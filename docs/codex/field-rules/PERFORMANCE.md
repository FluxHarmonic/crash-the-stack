# Music startup and measurement follow-up

David asked for this follow-up after the Pixel 2 XL reports and the decision
to retain all seven backgrounds. It is separate from P4c's selection/menu
integration. The application change is `a20578e`; the prior hosted baseline
was `addc03a5f78c`.

## Findings

Waiting three seconds did not remove startup from the reports. The ring holds
3600 frames, which can span several minutes on this phone. The existing
reports therefore mixed startup with settled gameplay. Their largest frame
cannot be attributed to the selected field rule just from that report.

Audio loading did perform avoidable work on the drawing thread: conversion
of an entire decoded track before yielding, large base64 dispatches, and a
second full-track allocation/copy when joining the received chunks. The
browser trace also contains large tasks *before* the first track is decoded.
The audio changes below do not eliminate that separate startup cost.

## Changes

- The page converts float PCM to the original s16 bytes and base64 in a
  short-lived worker. It keeps one chunk in flight and delivers on animation
  frames, adapting to an 8 ms main-thread budget, capped at 256 KB of PCM per
  dispatch. The budget is a target, not a hard upper bound. Browsers without
  workers, or a failed worker, use yielded inline conversion.
- The receiver allocates one announced-size bytevector and fills it in order.
  It publishes that same buffer only when byte and chunk counts match.
  Overflow or incomplete transfers cannot become tracks. This removes the
  final concatenation; the initial allocation still has a measurable cost.
- The stats overlay now offers **Reset & close**, including when clipboard
  copying succeeds. The game applies it at a frame boundary and resets its
  sample ring, GC baseline, rolling counters and worst-frame state. The page
  resets its ring at the same boundary. Old/reset-bearing frames are excluded.
- Reports label the window `startup` or `reset-N`, show music loading status
  and upload/publication timings, and include `flush`, `boot`, and `count`.
  BOOT includes initial `boot!`, later boot steps, and starting/updating music.
  This is a phase measurement, not an assertion that audio causes all of it.
- Page callbacks sharing an animation timestamp count as one frame. The game
  samples the completed previous tick before replacing that tick's phase
  timings. The native shell's shorter samples remain accepted and its added
  columns are zero rather than stale web values.

## Validation

The focused Sigil tests pass: three stats, four transfer, and thirteen
existing music checks. The JavaScript checks execute the shipped page code:
exact PCM for 700001 clipped positive/negative samples, adaptive yielded
batches, worker/no-worker/error paths, worker cleanup, single completion,
shared-frame callback accounting and reset exclusion.

The browser verifier loads all three complete tracks and starts playback,
clicks Reset & close, checks a fresh 3.5-second window against page callback
counts, confirms old upload samples are gone while loading status remains,
and resets again. It also checks runtime and GL errors. Headless audio is
muted; PCM correctness and playback state are checked, not speaker quality.

```sh
scripts/dev sigil test test/test-stats.sgl test/test-audio-transfer.sgl test/test-music.sgl
node scripts/test-web-perf.mjs
scripts/dev sigil build --config web
node scripts/verify-web-perf.mjs build/web --port 18081 --cdp 19481 --output /tmp/perf-final.json
node scripts/verify-web-perf.mjs build/web --port 18081 --cdp 19481 --rate 4 --output /tmp/perf-final-4x.json
```

## Browser measurements

Final application `a20578e20985` builds successfully and passes browser
acceptance at normal speed and with fourfold CPU throttling. All three track
lengths match (3748608, 3656448, 3628800 frames), and both resets work without
runtime or GL errors. These are local headless Chrome/SwiftShader diagnostics,
portrait 390×844, effective DPR 2, FLOW, seed 7. They are individual runs under
varying host load, not Pixel 2 XL measurements or a statistical speedup claim.

| Measurement | Baseline, 4× CPU | Final, 4× CPU | Final, normal CPU |
| --- | ---: | ---: | ---: |
| Audio chunk dispatch count | 43 | 144 | 89 |
| Chunk dispatch mean / max, ms | 28.3 / 88.7 | 8.2 / 20.0 | 4.1 / 8.4 |
| Final publication mean / max, ms | 16.4 / 17.8 | 4.2 / 5.6 | 3.0 / 4.3 |
| Music starts after navigation, s | 5.1 | 8.9 | 2.8 |

The final 4× report's full upload category (including worker setup, PCM
snapshot, and receiver allocation) peaks at 83.3 ms. Receiver allocation
alone peaks at 32.4 ms. Moving conversion off-thread does not make those
operations free. The startup frame still peaks at 1466 ms: BOOT now exposes
840 ms, while OTHER is at most 4 ms. This supports focusing the next startup
investigation on initialization rather than blaming a background rule.

After reset, the 4× game window has 98 samples over 3.5 seconds: frame mean
35.9 ms, median 33 ms, p95/max 50 ms, and no old upload or GC samples. The
normal-speed reset has 185 samples over 3.5 seconds: frame mean 18.9 ms,
p95 33 ms and max 34 ms. Page/game sample counts agree within two frames.
The page snapshot can include a report/bridge interval that the game has not
yet sampled; do not treat their single maxima as identical measurements.

A rejected intermediate implementation (`b6b686a`) converted every chunk on
the main thread with a 4 ms budget. It passed correctness/reset checks but
needed 30 seconds to start the theme and 75 seconds for all tracks under
4× throttling. Merely extracting its encoder helper still needed about a
minute for all tracks. The final worker path takes 17.2 seconds for all three
in the final 4× run, 6.3 seconds at normal speed. None of those intermediate
candidates replaced the phone preview.

## Phone measurement

Open `http://10.11.0.2:8774/?stack&fresh&seed=7&bg=flow&ms`.
Keep the first report if measuring startup. For settled gameplay, wait until
the report says `page music settled 3/3 failed 0 loading none`, press
**Reset & close**, wait 3–5 seconds, then tap the MS readout and copy again.
The second report should say `window reset-1`. REACTION makes a useful second
comparison. There is no need to recapture all seven to investigate the shared
startup path.

## Integration and remaining work

P4c can merge these commits with the background work. The audio protocol now
requires `audio-size` between `track` and `audio-chunk`; page and shell must
be deployed together, as the versioned web build does. No assets, audio mix,
track ordering, reveal gate, settings policy or service-worker logic changed.
Worker creation uses a blob URL; failure falls back to inline conversion.

The largest pre-audio startup stall remains. Use BOOT versus DRAW/FLUSH and
the page timing in the new report to narrow it before changing more code.
The worker path deliberately spreads delivery across frames, so music can
arrive later on a slow device even while individual interruptions shrink.
Phone feedback is still needed to judge that tradeoff and audible continuity.

The tested application is hosted from `build/hosted` at
`http://10.11.0.2:8774/`, version `a20578e20985`. The subsequent documentation
commit does not alter that build. The unrelated localhost listener on 8774
is left alone; the preview binds specifically to the WireGuard address.
