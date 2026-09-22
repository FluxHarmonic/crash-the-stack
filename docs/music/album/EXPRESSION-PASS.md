# Expression pass and controlled comparisons

David approved exploring a small instrument collection and a Relay Ghost
revision, then asked to hear old and new sounds side by side. Each change now
gets a controlled comparison before adoption. The first deliverable is patch
work using existing Motif capabilities; it does not yet implement the proposed
transport modulation, smooth automation or tracker delay features.

## Listening protocol

Keep the accepted source and renderer identity. Create a finite temporary
composition for each comparison: the same notes, velocities, gates, tempo,
channel placement and bus, with only the declared patches changed. Render each
half from a fresh engine state, including two release bars, then concatenate
before and after. This prevents a different preceding phrase or reverb tail
from favoring either half. Include full calm and tense passages as well as
exposed instruments; a good solo sound can still be wrong in the arrangement.

Balance patches before delivery using measurements as a check, then let the
listener decide. Equal integrated loudness does not guarantee equal perceived
attack or brightness. Preserve meaningful transient differences. Apply the
same monitoring gain to both halves of a quiet solo pair, document that gain,
and keep the full mixes at their actual relative levels. Do not normalize each
half independently or hide the comparison behind different mastering settings.
The comparison uses gain only, with no additional limiter or compression; the
score's existing shared bus remains active. Compare full renders afterward.

Record source and renderer hashes, exact commands, section timestamps,
duration, encoded true peak, final decay and compiled note timing. Keep the
accepted album and game sources untouched until the audition is approved.
Numerical checks establish those properties, not subjective listening quality.
Use Sigil for authoring, analysis orchestration and delivery; Node is the
fallback if Sigil cannot reasonably perform a task.

## Relay Ghost: Expression I

The candidate changes the backbeat into a short FM contact snap with a small
noise edge, shortens the hat dust, and replaces the distant FM pluck with a
Karplus–Strong wire. The kick, bass, chords, bell, filter sequence, transition
notes and entire arrangement remain. The same contact patch also covers the
fill; there is no return to the old snare during the roll.

Two additional pairs audition a less harmonic metallic bell and an airy FM
choir. These are not included in the full Relay Ghost candidate. The choir's
reference is a newly voiced warm-pad chord, explicitly not an existing part of
Relay Ghost. Its purpose is to compare possible future sustained textures.
The metallic voice is an FM approximation, not a physical modal resonator.

| Pair | Before starts | After starts | Same boost on both |
|---|---:|---:|---:|
| Percussion | 0:00.000 | 0:10.909 | 0 dB |
| Plucked answer | 0:21.818 | 0:29.091 | +14 dB |
| Calm full mix | 0:36.364 | 0:54.545 | 0 dB |
| Tense full mix | 1:12.727 | 1:30.909 | 0 dB |
| Bell / metallic prototype | 1:49.091 | 2:00.000 | +6 dB |
| Warm pad / choir prototype | 2:10.909 | 2:21.818 | +6 dB |

The comparison lasts 2:32.727; both complete arrangements last 3:27.273.
The delivery report records the additional common safety gain used for all
files. The pluck monitoring boost is for judging timbre; it does not raise the
pluck's level in the full composition.

Score prototypes and snapshots: `../alternates/relay-expression-i/`.
Patch definitions: `../tools/lib/expression-patches.sgl`.
Composer: `../tools/relay-expression.sgl`.
Renderer: `../tools/expression-render.sgl`.
Audit: `../tools/expression-audit.sgl`.
External audio: `~/Ops/artifacts/crash-the-stack-album/relay-expression-i-delivery/`.
Earlier measurement attempts remain in `relay-expression-i/` and
`relay-expression-i-review/`; they are not listening releases.

An instrument's `volume:` is a default for notes without an explicit volume.
The soundtrack specifies note volumes, so adjusting the instrument default
alone did not change those rendered notes. Change a supported patch gain or
FM carrier levels when balancing a timbre without altering the performance.
The Karplus–Strong decay is its natural ringing time; note-off does not act
like a conventional ADSR release. Check the rendered tail as well as gates.

## Follow-on work

The expression engine branch is `feat/codex-expression` in the isolated Motif
worktree `task-motif-expression`, based on 0.6.5 (`2ed1aa4`). Its baseline builds.
No expression DSP changes have been made yet. These are the next independent
feature steps, each needing its own audible A/B and native/live parity checks:

1. Beat-synchronized modulation with explicit phase and note-reset behavior.
   Use an actual tempo-aware transport; the existing renderer's header-BPM
   clock alone is insufficient for Fxx changes, live tempo edits and seeking.
2. Smooth score-recorded parameter automation. Avoid rebuilding a voice on
   every parameter step, which would restart envelopes. Define seeking,
   looping and calm/tense transition behavior before committing a format.
3. Tempo-synchronized filtered delay exposed to tracker tunes. Motif already
   has a layer delay; define dry-preserving send behavior and channel routing,
   and distinguish wet-output filtering from filtering inside the feedback.
4. Evaluate a dedicated metallic resonator after hearing the FM prototype.
   Keep the accepted patch defaults and render behavior compatible.

After patch feedback, develop Relay Ghost's replies and late return as a
separate arrangement comparison. Review the other fourteen tracks one at a
time for phrase completion, fill continuity and composed endings. Do not apply
the same new instrument to every track or fill the quiet songs with decoration.
Black Glass's chirpy bass/retro stabs, Shadow Protocol's subtle tension,
Blind Spot and Quiet Array's space, Obsidian's pedal and side pads, and Glass
Current's closing role are protected listener-approved identities.

A separate instrument gain is also a useful engine extension: it should scale
the base voice and layers after note dynamics, default to unity, and leave the
tracker's existing `volume:` default semantics intact. Explicit note volume
winning over the default is intentional, not a playback bug. This control is implemented in Motif commit `b0d135e` and used by Bass
Balance I. It was not present in the earlier Expression I and Calm Bell I
renderers. The beat modulation, smooth automation and filtered-delay work
remains pending; static instrument gain does not implement those features.

## Delivered review measurements

Delivered on 2026-09-22 from source commit `4449b96`. All fourteen scores parse
and print canonically. Seven before/after pairs have identical notes, gates,
clock and bus; all 2,572 compiled attacks and every other full-track tick match.
The reference score matches the accepted album source byte for byte. The audio
reference is freshly synthesized using the same renderer as the alternate;
it is not the previously distributed master. All protected game and accepted
album arrangement files remain untouched.

The wire pair measures -41.3/-41.4 LUFS-I before its shared monitoring boost;
metal -27.7/-27.7 and warm pad/choir -27.6/-27.6. The percussion pair measures
-18.2/-19.7: its shorter transients and sparser noise remain a real mix change.
The full candidate is 0.9 LU quieter in the encoded delivery; no per-file gain
was applied to disguise this difference.

| Encoded file | LUFS-I | True peak |
|---|---:|---:|
| Sequential A/B | -18.5 | -2.5 dBTP |
| Complete reference | -17.0 | -2.2 dBTP |
| Complete candidate | -17.9 | -3.2 dBTP |

The common delivery gain is -1.1 dB. Both complete last seconds peak at
-90.3 dBFS. Native and encoded durations pass, and no new limiter is applied.
Raw logs, source snapshots, exact argv, renderer hash, reuse provenance and
machine-readable checks live in the external delivery directory.

Telegram acknowledged the A/B file as message 1135, complete before as 1136,
and complete after as 1137. Listening approval is pending. These are auditions,
not an adopted album revision or public-site update.

## First listening feedback

David prefers the quieter Expression I drums because they leave the rest of
the arrangement more space. Keep that kit in the next auditions. He finds the
metallic bell interesting and requested a calm-section comparison against the
existing bell, which he also likes. The wire pluck and choir remain unapproved.

[Calm bell comparison I](../alternates/relay-bell-calm-i/README.md) holds the new
kit and original pluck constant, comparing sixteen calm bars with only the bell
changed. Existing bell first; metallic bell at 0:32.727. He also raised the
level of the squeaky upper bass line as a possible issue; identification of
the higher acid line versus the main gritty bass is pending before a separate
level audition.

After hearing the calm comparison (Telegram 1138), David chose the original
bell for Relay Ghost. The metallic patch is liked but is a better candidate
for a different context. Preserve both the patch and comparison. Further Relay
Ghost auditions should retain the original bell and preferred quieter kit;
the wire pluck, choir and bass-level questions remain separate.

## Bass balance follow-up

Keep the preferred drums, original bell and original pluck while comparing the
two potentially distracting tense parts independently. The three-way audition
uses the same sixteen tense bars: current balance, upper acid instruments
23–25 reduced by 2 dB, then lower gritty bass instrument 19 reduced by 2 dB.
No bass choice has been approved yet. Use instrument output gain rather than
lower note volumes, because the acid patch's velocity also controls its filter.

[Bass Balance I](../alternates/relay-bass-balance-i/README.md) now provides that
three-way audition: baseline at 0:00, upper synth down at 0:32.727, gritty bass
down at 1:05.455. The gain implementation and its validation live in the Motif
feature branch; Crash's runtime and public album are not upgraded by this test.

## Relay Ghost selected mix

David clarified that the gritty FM bass, including the squeaky harmonics he
hears above it, is the part to lower by 2 dB. The quieter kit and original bell
are retained; the original pluck also stays. [Album II](RELAY-II.md) adopts this
combination and provides the requested complete track. The separate acid line
is unchanged. Preserve the metallic bell for another context. Breach Vector
is the suggested next phrase-development pass.
