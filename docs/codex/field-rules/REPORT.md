# Living field candidates

2026-09-21, `feat/codex-field-rules` in `task-codex-field-rules`.
Six GPU rules for D55's per-deal pool: **cyclic**, **flow**, **signal**,
**echo**, **synapse**, and **flame**. David requested the flame extension
after approving the previous five.
David approved keeping all six alongside REACTION, then requested that
LIFE be removed entirely. These seven modes are the completed visual set.
The revisions respond to David's feedback on the hosted preview: darker
surfaces with small accents, no cells that look stuck, and Matrix/Hackers-inspired
falling or rectilinear signals.

## Rules and visual intent

**Cyclic** has sixteen neighbor-driven phases and angular moving fronts.
A visited cell advances when an eight-neighbor cell has its next phase, or
when seeded renewal fires. Visits stay asynchronous at 55%; renewal rises
from 16 per thousand when calm to 40 under ICE and 64 during a burst.
Each cell also carries a waiting age and advances within 24 steps (1.2
seconds at the normal schedule). The initial ages are seeded independently,
so that guard does not refresh the whole surface together. David found the
phase colors and sparse accented tips too flashy even after darkening the
ramp. The final display instead eases local activity: each integer step
mixes seven parts of the previous shown byte with one part of 176 for an
advance or 16 for a waiting cell. It starts at 32. This removes phase-wrap
flashes and bright tips, giving the fronts a soft, dark persistence.
David approved this revision:
“cyclic is *much* better, I really like it now.”

**Flow** provides a quieter drifting surface. A scalar backtraces along the
curl of a periodic, slowly evolving stream function with two harmonics.
Four nearest samples implement bilinear advection. The scalar decays by
0.997 per step; every eighth step a seeded, wrapped Gaussian rain spot
replenishes it. Calm displacement is 0.35 cells per step, capped at 0.8
under agitation. This is an analytic curl field, not a noise texture. The
16-bit simulation state remains intact; the shown value is its square,
which keeps most of the surface dark and accents the fresh rain cores.

**Signal** follows David's Matrix/Hackers suggestion: falling vertical heads
with fading trails, crossed by occasional horizontal runs. The seed chooses
one column in each five-column band and one row in each eleven-row band.
Column speeds vary from one to three field steps per cell, while horizontal
heads move every other step. ICE speeds them up. Heads enter at the top or
left and leave at the opposite edge; their trails fade in place. It evokes
code rain through moving blocks and lines, not literal glyphs or new assets.
David liked the trails but asked for dither in the empty areas. A stable
spatial hash supplies a floor between shown bytes 0 and 31, using only BG
and BAR-A. Its irregular grain stays still while the trails provide motion.
An earlier attempt used slow spatial waves; David found that their broad
bands of different dither density looked like a pixel-spacing bug. The
seeded grain removes those bands without adding flicker. The floor does
not alter head transport or add another rendering pass.

**Echo** turns David's water/radio-wave idea into four staggered radial
wave packets. Each travels at 0.19 cells per step and fades before its
seeded center changes. Signed waves interfere; their absolute amplitude
supplies the display above stationary dark grain. The shown byte eases
32% toward its target per step and caps at 200, keeping strong overlaps
small and avoiding abrupt ring changes. Centers do not wrap at the screen
edges. This is an analytic interference field, not a fluid simulation.

**Synapse** builds a seeded graph of jittered junctions, joined by sparse
horizontal, vertical, and diagonal connections. It caches the wiring on
the first step. Pulses then travel through eight-neighbor wire cells on
every third field step. Junctions pause for two such beats before forwarding
the pulse; refractory paths prevent immediate backtracking. A seeded
junction receives a scheduled activation every 21 steps, supplemented by
rare spontaneous activity. Faint wiring and stationary grain fill quiet
areas; the activity trails fade as new branches light. The underlying graph
stays fixed, so topology changes do not introduce another distraction.
Both additions keep their normal cadence under ICE.

The first synapse run passed both held checkpoints but briefly narrowed to
three dark tones during live play. Its 42-step scheduled event could be
ignored while the chosen node was refractory, leaving nearly invisible
activity between events. The final local heartbeat runs every 21 steps
(1.05 seconds) and restarts that one node even when resting. Other pulses
still respect refractory paths. This keeps a visible source without raising
the display cap or the network-wide speed.

**Flame** feeds a heat field from the bottom edge. Slow, spatially uneven
fuel and sideways gusts form rising tongues; four nearest samples implement
bilinear upward advection at 0.42 cells per step. Heat cools on the way up,
and vertical samples clamp at the edges so fuel never wraps from bottom
to top. BA retains the heat as 16 bits. The squared heat supplies a dark
shown value above stationary grain, eased by 35% per step and capped at
200. The existing cool palette makes this feel like a flame inside the
system, with sparse hot pockets near the base rather than an orange wash.
Its cadence stays steady under ICE.

David found the first flame version mostly confined to the lower third.
The final cooling is `0.004 + 0.002 * noise`, down from
`0.014 + 0.007 * noise`. The source, rise speed, grain, squared display,
easing, and cap are unchanged. A fixed step-200 comparison counts the highest row with at least
four of its 80 half-cell pixels in palette slots 3 or higher (the visible
midtones). The original reaches 36.4% of the field height; an intermediate
cooling setting reached 63.6%, and the final setting reaches 68.2%. This
comparison uses a fixed frame; heights still vary with the fuel. Fainter
flame tones reach farther upward.

These offer six distinct motion patterns alongside Gray–Scott. Another
chemical reaction would overlap REACTION's look; Brian's Brain would make a
sparser spark field. All six candidates use the existing eight palette
colors and 2×2 ordered dither, with no visible gradients or alpha blends.

## Packing, uniforms, and rendering

| Rule | RGBA8 state | Main uniforms |
| --- | --- | --- |
| cyclic | R = shown byte; G = phase 0…15; B = waiting age 0…23; A = 255 | `u_states=16`, `u_rate=550`, `u_max_age=24`; step key and agitation-driven `u_rain` |
| flow | R = squared scalar for display; G unused; B/A = scalar high/low byte | `u_decay=0.997`; step count, seed phase, displacement rate, rain cell and rain gate |
| signal | R = shown byte; G = downward head; B = rightward head; A = 255 | step key/count, seed hash, agitation-driven speed |
| echo | R = eased interference display; G/B unused; A = 255 after first step | step count and seed hash |
| synapse | R = shown byte; G = phase 0…17; B = empty/wire/node 0…2; A = initialized flag | step key/count and seed hash |
| flame | R = eased squared heat display; G unused; B/A = heat high/low byte | step count and seed hash |

The graphics library supplies `u_resolution`. All six need one
880-fragment step pass. Presentation uses the unchanged 80×44 dither target
and nearest upscale. Their ramp orders the existing roles as BG, BAR-A,
BAR-B, STATIC-B, WIRE-DARK, BAR-C, MOSS, ARCHIVE. The last two are accents;
REACTION keeps its original ordering. Palette uniforms change
only when the field is seeded. New fields store their shown byte in red,
so the existing ring presentation and severed collapse apply directly.

The original FEED, REACTION, COLLAPSE, and VIEW shaders are unchanged.
REACTION's CPU equations remain intact. LIFE's CPU and GPU implementations,
seed, shader resource, rule entry, and exclusive helpers have been removed.
The shared collapse factor is now named `FIELD-COLLAPSE`; the shown-byte
presentation and collapse still serve all six GPU additions.
The additions are GPU-only; the `-cpu` names for these additions do not silently run a different rule.

## Measurements that changed the implementation

The first cyclic renewal setting, 2 per thousand, briefly let one tone
cover 98.0% of the field in an every-step integer sweep. Increasing renewal
to 16 fixed the calm sweep, but a longer browser run revealed another
problem once ICE raised the visit rate: synchronized fronts narrowed the
field to three tones. Keeping visits at 55% and scaling renewal instead
avoids that synchronization. The waiting-age guard addresses David's
separate observation of individual cells appearing stuck.

The final cyclic model scanned 6000 steps for seeds 1–8 at each of the calm,
ICE, and burst renewal rates. Across all three rates no tone exceeded
70.8%, at least 76 cells advanced every step, waiting age never exceeded 23, and
no bright accents appeared. The eased display uses three or more tones
throughout the sweep, with four at steps 200 and 6000 for seed 1. Some other
seeds briefly narrow to three dark tones after settling, while retaining
texture and motion. The browser arm also compares the step-200 render to this integer oracle.

Reproduce the model with:

```sh
node docs/codex/field-rules/sweep-cyclic.mjs 16 40 64
node docs/codex/field-rules/sweep-cyclic.mjs 2 4 8 12 16 --legacy
```

The first flow presentation put its common midrange values into the
original ramp's brighter purple and moss slots. David's visual feedback caught
that distraction even though the palette and liveness tests passed. The
new ramp ordering and squared display value address the distribution of
colors rather than introducing transparency or additional colors.

## Validation

Native compilation and `test-bg-gpu` plus `test-palette` passed: 106 tests
after adding flame.
The legacy background run passed all 53 checks in 43m 30s. That run
included the two original GPU seed checks; those now live in the separate
`test-bg-gpu` file with signal's third check. The same test loop now covers
echo, synapse, and flame too. No legacy test was removed.
Each final rule replays its held step-200 map exactly and passes the
step-6000 palette/dither checkpoint. Cyclic also matches the integer oracle
in all 3520 half cells. At step 200 bright accents occupy 0% of cyclic,
0.09% of flow, 3.41% of signal, 0% of echo, 0.11% of synapse, and
0.14% of the taller flame.

Five-minute live runs at the normal stride sample 20 frames, including ICE
and burst agitation:

| Final implementation | Largest single-tone share | Fewest half cells changed between samples | Result |
| --- | ---: | ---: | --- |
| flow (`124b77c`) | 74.3% | 801 | pass |
| cyclic (`216b75a`) | 60.9% | 1469 | pass |
| signal (`9855446`) | 50.2% | 599 | pass |
| echo (`c68e427`) | 41.8% | 2005 | pass |
| synapse (`be2c3d3`) | 55.7% | 38 | pass |
| flame (`a72e554`) | 55.8% | 2111 | pass |

The browser regression run at `124b77c` passed all eight existing arms.
LIFE and REACTION each matched all 3520 half cells of their CPU reference
at step 12; REACTION also matched all 880 reconstructed dither levels.
The subsequent additions preserved the original five shader strings until
David's final LIFE removal. The four retained original shaders still
compare byte-identically at the GLSL level to the approved build.
Adding echo and synapse also left the three approved shader strings
byte-identical to `bef6669`. Adding flame preserved all ten existing shader
strings byte-identically to `23f1e3a`.

The browser harness checks repeated held maps at step 200, a step-6000
checkpoint (`bgstride=1` shortens that wait), then five real minutes at the
normal stride. Every sample checks 3520 half cells for palette membership,
valid dither, at least four tones, dominant share at most 90%, bright accent
coverage at most 15%, and continuing motion. It also fails missing textures,
Scheme errors, exceptions, and GL errors. Known image-fetch warnings during
navigation use the same narrow treatment as the existing browser arm.
A forced pixel rejection in a temporary harness copy was verified to exit 1.

```sh
node scripts/verify-field-rules.mjs build/hosted --rule cyclic --seconds 300 --port 18074 --cdp 19474
node scripts/verify-field-rules.mjs build/hosted --rule flow --seconds 300 --port 18075 --cdp 19475
node scripts/verify-field-rules.mjs build/hosted --rule signal --seconds 300 --port 18076 --cdp 19476
```

## Captures and frame cost

Final 640×400 nearest-neighbor captures: cyclic from application commit
`216b75a76ef1`, unchanged flow from `124b77c7f7be`, and signal from
`985544674f81`: [cyclic](cyclic.png), [flow](flow.png), [signal](signal.png).
The extensions: [echo](echo.png) from `c68e4273e1d7` and
[synapse](synapse.png) from `be2c3d341a50`.
The taller [flame capture](flame.png) is from `a72e554edbea`.
Setup: landscape phone emulation at DPR 3, board seed 7, background seed 1,
held at step 200, from the committed hosted snapshot.

```sh
for field_rule in cyclic flow signal echo synapse flame; do
  node scripts/shot-web.mjs build/hosted "docs/codex/field-rules/$field_rule.png" \
    --query "stack&fresh&seed=7&bg=$field_rule&bghold=200" \
    --do 'line:^crash: bg held 200$' --port 18077 --cdp 19477
done
```

Performance uses `scripts/measure-ms.mjs --phone --windows 3`, three
120-frame windows after discarding the first. The game selected a 780×488
buffer from portrait phone emulation (390×844 CSS, DPR 3). This is headless
SwiftShader on a shared machine; STEP/PRESENT measure CPU submission and
driver stalls, not GPU timer queries. The actual phone's `?ms` reading is
the useful hardware comparison. The first actual phone measurements follow
the software-renderer table below.

Measurements of each final rule implementation:

| Rule | Application commit | Mean frame ms | Max frame ms | Step ms | Present ms |
| --- | --- | ---: | ---: | ---: | ---: |
| cyclic | `216b75a` | 92.0 | 250 | 61.9 | 7.3 |
| flow | `124b77c` | 80.7 | 267 | 53.7 | 6.9 |
| signal | `9855446` | 64.0 | 200 | 37.6 | 8.1 |
| reaction | `124b77c` | 115.3 | 217 | 76.9 | 0.9 |
| echo | `c68e427` | 53.7 | 200 | 28.5 | 9.4 |
| synapse | `be2c3d3` | 36.7 | 83 | 15.2 | 9.1 |
| flame | `9f6a1fc` | 43.0 | 250 | 21.2 | 7.9 |

These are observations, not a phone speedup claim. Shared host load and
software rendering dominate the timings, and the runs happened at different
times. All six additions use one field step pass. Every previously measured
mode except flame is unchanged in the taller-flame build `a72e554`.
The flame timing predates its cooling-only height adjustment; the shader
structure, resolution, and number of passes are unchanged.

### Pixel 2 XL phone measurements

David supplied these seven copied `?ms` summaries on 2026-09-21, in the
listed order, from application `a72e554edbea`. All report DPR 2, stride 3,
rsteps 2, audio depth 6144, atlas on, copper roll, and phosphor on. Browser
and orientation were not supplied. Values below are milliseconds except
sample count and window seconds.

| Rule | Samples / seconds | Frame mean / p50 / p95 / max | Step mean / p50 / p95 | Present mean | Draw mean / p50 | Frames over 50 ms |
| --- | --- | --- | --- | ---: | --- | --- |
| cyclic | 134 / 7.1 | 52.8 / 34 / 101 / 1300 | 2.5 / 2 / 6 | 1.8 | 26.6 / 25 | 27 / 134 |
| flow | 82 / 4.9 | 59.9 / 34 / 135 / 1300 | 2.9 / 2 / 7 | 1.8 | 24.8 / 18 | 19 / 82 |
| signal | 126 / 7.6 | 60.1 / 34 / 135 / 1234 | 3.2 / 2 / 8 | 2.0 | 29.9 / 27 | 36 / 126 |
| echo | 118 / 7.4 | 63.0 / 34 / 184 / 1472 | 2.8 / 2 / 6 | 1.8 | 28.4 / 27 | 35 / 118 |
| synapse | 171 / 7.5 | 43.7 / 34 / 100 / 1300 | 2.1 / 1 / 5 | 1.6 | 23.4 / 20 | 20 / 171 |
| flame | 75 / 5.0 | 66.7 / 34 / 167 / 1133 | 3.5 / 3 / 10 | 2.2 | 30.8 / 28 | 25 / 75 |
| reaction | 69 / 5.1 | 74.2 / 50 / 233 / 1251 | 8.1 / 6 / 23 | 1.7 | 34.2 / 30 | 28 / 69 |

All six new modes have lower measured mean and median step times than
REACTION. SYNAPSE has the lowest measured mean step and whole-frame time;
FLAME has the highest mean step among the additions, still below REACTION.
The common 34 ms frame median is approximately a 29 fps cadence; REACTION's
50 ms median is a 20 fps cadence. These are median intervals, not average
FPS or proof of steady performance. STEP includes CPU background advance
and GPU submission/stalls; PRESENT is also a CPU wall-clock measurement,
not a GPU timer query. Do not sum phase percentiles or treat STEP as a
complete measure of GPU cost.

David observed a spike whenever the background music began. Every sample
contains a 1.1–1.5 second maximum frame, consistent with a shared startup
event, but aggregate summaries cannot identify its precise cause. The
regular audio pump averages only 0.1–0.3 ms. Music startup runs in the
shell's boot timing section, which the copied summary does not expose
separately; low PUMP timing does not exclude startup audio work.

The requested three-second settling delay did not exclude startup: both
`crash/stats` and the page callback instrumentation retain up to 3600
frames, with no automatic warm-up exclusion. These short captures include
their initial frames. Means, tails, and maxima therefore mix startup and
ongoing play; the unequal windows also give startup unequal weight. This
is useful initial hardware evidence, not a controlled settled ranking.
For a follow-up, a fresh measurement window after music starts would
separate ongoing rendering cost from the reported startup hitch. No
background simplification is justified by the startup maxima alone.

## Integration and review

REACTION stays the default here. David's explicit removal request supersedes
the initial instruction to leave LIFE for P4c: this branch now removes LIFE
from the implementation and FIELD choices. A saved `field=life` value reads
as the REACTION default through existing validation; `life` and `life-cpu`
are rejected by the shared query/CLI mode selector, like any unknown name.
Settings tests cover that migration and all seven remaining mode names.
LIFE-only checks and performance-script entries are removed; shared schedule
and phase tests now exercise REACTION, including its iteration cap.
P4c still owns removal of the FIELD row and per-deal shell policy.
`GPU-MODES` exposes the six new names for D55's pool. Both shells
in this base branch still pass background seed **1**, independent of the
board seed. The new rules accept any seed through `bg-new`/`bg-choose`, and
the CPU tests cover same/different seeds. P4c should supply the board seed
when wiring per-deal selection. The only settings change removes LIFE from
the existing FIELD row; menus, audio, tables, service worker, and publishing
configuration are untouched.

After LIFE removal (`addc03a`), the browser regression suite passes all
seven remaining arms. REACTION matches its CPU reference at all 3520
half cells and all 880 reconstructed dither levels at step 12. Each of
CYCLIC, FLOW, SIGNAL, ECHO, SYNAPSE, and FLAME also matches the approved
`a72e554` build at every half cell at step 200 (board seed 7, field seed 1,
landscape phone emulation at DPR 3). Both retired query names boot without
a field. No runtime or GL errors occurred. The temporary comparison server
initially failed to resolve its build subdirectories; after correcting
that harness path, the complete comparison passed.

The optional native test backend stopped before executing tests because
its runner requires a `build-fn` callback that this repository does not
provide. Validation uses the normal bytecode test backend instead.
The full targeted run passes **145 tests** across `test-bg` (26),
`test-bg-gpu` (6), `test-settings` (13), and `test-palette` (100), in
13m 59.68s. The four-seed REACTION stress test reports no frozen steps
and eight tones after 3600 ticks for every seed; phase, burst-end, severed
collapse, and CPU/GPU schedule checks pass. The shorter three-file run
also passed its 119 checks while the stress test was computing.

Both the optimized web build and native release build complete.
`scripts/verify-field-native --display :98` passes all three remaining
arms: desktop GL shader compilation, REACTION GPU/CPU capture comparison
(AE 0 over 1280×704 at step 12), and no GL errors. The isolated display
and native game processes are cleaned up by the harness.

```sh
scripts/dev sigil test test/test-bg.sgl test/test-bg-gpu.sgl test/test-settings.sgl test/test-palette.sgl
scripts/dev sigil build --config web
scripts/dev sigil build --config release
node verify-field.mjs build/web --port 18079 --cdp 19479
scripts/verify-field-native --display :98
```

- `http://10.11.0.2:8774/?stack&fresh&seed=7&bg=cyclic&ms`
- `http://10.11.0.2:8774/?stack&fresh&seed=7&bg=flow&ms`
- `http://10.11.0.2:8774/?stack&fresh&seed=7&bg=signal&ms`
- `http://10.11.0.2:8774/?stack&fresh&seed=7&bg=reaction&ms`
- `http://10.11.0.2:8774/?stack&fresh&seed=7&bg=echo&ms`
- `http://10.11.0.2:8774/?stack&fresh&seed=7&bg=synapse&ms`
- `http://10.11.0.2:8774/?stack&fresh&seed=7&bg=flame&ms`

Hosting is bound specifically to `10.11.0.2:8774`. `check-bind 8774` also
sees an unrelated pre-existing `127.0.0.1:8774` listener from another
worktree and therefore returns failure. That process was left alone; our
host's PID, cwd, exact WireGuard listener, and HTTP version are checked
independently. No wildcard or LAN listener was created. The host is
detached so it remains available after the session. The served application
is `addc03a5f78c`; the following documentation commit records validation
without changing the application source. The existing captures remain
representative: all six added modes match their approved frames exactly.
