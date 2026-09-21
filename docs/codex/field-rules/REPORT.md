# Living field candidates

2026-09-21, `feat/codex-field-rules` in `task-codex-field-rules`.
Six GPU rules for D55's per-deal pool: **cyclic**, **flow**, **signal**,
**echo**, **synapse**, and **flame**. David requested the flame extension
after approving the previous five.
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
legacy LIFE/REACTION keep their original ordering. Palette uniforms change
only when the field is seeded. New fields store their shown byte in red,
so the existing ring presentation and severed collapse apply directly.

The original LIFE, FEED, REACTION, COLLAPSE, and VIEW source strings are
unchanged. CPU LIFE/REACTION equations and their rule table remain intact.
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
0.03% of flame.

Five-minute live runs at the normal stride sample 20 frames, including ICE
and burst agitation:

| Final implementation | Largest single-tone share | Fewest half cells changed between samples | Result |
| --- | ---: | ---: | --- |
| flow (`124b77c`) | 74.3% | 801 | pass |
| cyclic (`216b75a`) | 60.9% | 1469 | pass |
| signal (`9855446`) | 50.2% | 599 | pass |
| echo (`c68e427`) | 41.8% | 2005 | pass |
| synapse (`be2c3d3`) | 55.7% | 38 | pass |
| flame (`9f6a1fc`) | 46.4% | 1032 | pass |

The browser regression run at `124b77c` passed all eight existing arms.
LIFE and REACTION each matched all 3520 half cells of their CPU reference
at step 12; REACTION also matched all 880 reconstructed dither levels.
The subsequent changes add or refine the GPU-only rules; the original five
shader strings still compare byte-identically to the base.
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
The [flame capture](flame.png) is from `9f6a1fcd62bf`.
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
the useful hardware comparison. No phone timing data has been supplied yet.

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
mode is unchanged in the flame application build `9f6a1fc`.

## Integration and review

REACTION stays the default here. P4c owns the FIELD/LIFE removal and shell
policy. `GPU-MODES` exposes the six new names for D55's pool. Both shells
in this base branch still pass background seed **1**, independent of the
board seed. The new rules accept any seed through `bg-new`/`bg-choose`, and
the CPU tests cover same/different seeds. P4c should supply the board seed
when wiring per-deal selection. No settings, menus, audio, tables, service
worker, or publishing configuration changed.

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
is `9f6a1fcd62bf`; the following documentation commit adds the report and
captures without changing the application source.
