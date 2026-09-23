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

## Breach Vector: Phrases I

After approving and publishing Relay Ghost album II, David requested Breach
Vector with the same before/after listening process. This pass develops phrase
replies using the accepted instruments. The calm bridge grows an E–D–C answer,
then D–B–G over the G bass. The lower pipe passage and later high pipe return
recall that D–B–G cadence. The focused signal makes room for the spaced plucks,
answering in their gaps; the late return thins its final half before the calm
reprise. Drum, bass, pluck and opening performances remain intact.

Only pattern/channel pairs 11/7, 30/7, 31/5, 40/7 and 41/5 change. Instruments,
bus, tempo, order, duration and all other channel events remain identical.
The public album and game retain their accepted Breach Vector versions pending
review. Sources, maps, exact changes and listening guidance live in
`../alternates/breach-phrases-i/`. Three fresh-state contextual A/B pairs and
both full versions use one common monitoring gain, with no added limiter.

## Breach Vector phrasing approved; percussion audition

David likes Phrases I's more musical and complete replies. That candidate is
the approved arrangement baseline for the next listening comparison. He then
authorized a snare experiment: retain its low punch, shorten the noisy tail,
and add a quiet metallic click, including through the fill. Percussion I
changes instrument 2 only; all notes and the newly approved phrasing are fixed.
The game and website stay on their prior version until this pass is resolved.
See `../alternates/breach-percussion-i/README.md` for comparisons and provenance.

## Cold Boot: Motion I

After Breach Vector album II and the Motif 0.6.6 integration, David requested
Cold Boot next. [Motion I](../alternates/cold-boot-motion-i/README.md) compares
short metallic hats and greater note-triggered pressure-filter contrast,
independently and combined. Kick/sub, approved knock/fill, all performance
events and the bus remain fixed. Both game and album candidates are built
from one proposed shared patch bank; the accepted shared source remains intact
pending listening feedback. No transport LFO or automation feature is added.
The Motif gain release and public integration are now complete; see
[the integration record](../MOTIF-066-INTEGRATION.md).

David approved both Cold Boot changes, finding the mix less muddy and busy.
[Album II's selected mix](COLD-BOOT-II.md) is adopted in the shared source and
regenerated into both arrangements. Further composition changes are not
proposed; mastering and publication remain the next release step.

Cold Boot II mastering and publication are complete. Closed Loop is the next
suggested review: preserve its accepted snap-click kit and examine pluck/bell
call-and-response in the later phrases and final return. Any changes should
remain separate controlled auditions; no Closed Loop revision is adopted yet.

## Closed Loop: Phrases I

David authorized the next controlled audition. [Phrases I](../alternates/closed-loop-phrases-i/README.md)
develops the later pluck/bell conversation and recalls the opening cell in the
quiet ending. The accepted snap-click kit, bass groove, chord performance,
instrument bank and bus remain fixed. All new melodic attacks remain on the
original eighth-note grid. The complete arrangement is still 3:16.

Both game and album candidates come from one frozen shared phrase library;
the fifth tense phrase's deliberate album variant receives the same melodic
edit as the game loop. Three contextual before/after pairs and both complete
versions were delivered through Telegram (1152–1154). Sample timing, game-loop
transport, source reproducibility, encoded peaks and ending decay checks pass. This is a listening candidate: no maintained song
or public audio is replaced until the musical changes are approved.

David approved Closed Loop's phrasing as more musical and authorized adoption,
mastering and publication. The shared pool and both generated arrangements now
match the audition. Retain the accepted instrument design and mix; the musical
pass is finished. Dirty Cache is the next suggested review, keeping the rhythm
and distant plucks while examining phrase development and calm/tense contrast.

Closed Loop II is now mastered and published. The release retains its existing
+3 dB gain, measures -17.1 LUFS-I/-1.7 dBTP as MP3, and passes browser playback
verification. [The release record](CLOSED-LOOP-II.md) keeps source adoption,
mastering, publication and future deployment handoff details together.

## Dirty Cache: Phrases I

David requested the next track. [Phrases I](../alternates/dirty-cache-phrases-i/README.md)
develops the quiet lower reed reply and recalls it later in the tense section,
varies a separate tense phrase into a complete question/answer, and auditions
a short chord gap before the tense entrance. The approved calmer opening,
on-beat distant pluck, bass/drum pocket, harmonic correction and original full
reed hooks remain intact. Instruments and mix are fixed for this composition pass.

The game/album candidates share one proposed phrase pool. Four contextual A/B
pairs separate the ideas; complete before/after versions preserve the full
3:42.545 arrangement. Maintained shared sources and public audio remain at the
accepted version pending listening. All fifteen regeneration checks pass.

Dirty Cache's Phrases I montage and both full versions were delivered through
Telegram (1155–1157). All ten renders and encoded peak/duration/ending checks
pass. Full before/after OGGs both measure -15.6 LUFS-I/-1.9 dBTP with one common
monitoring gain. Native timing error is zero for both game and album candidates,
and all 25 generated audition files reproduce exactly. Listening review remains
pending; the current public release and accepted shared sources are unchanged.

## Dirty Cache: articulation feedback

David liked the improvements but found the new reed phrases too detached and
plain, with some notes feeling off-beat. Clock accuracy alone is not a phrasing
check: nearly uniform short gates and isolated scale steps can still sound like
filler. [The connected reed sketch](../alternates/dirty-cache-connected-reed/README.md)
uses a recurring motif, longer anchor tones, beat-led accents, connected slides
and breaths between ideas. The existing rhythm and instrument patches stay fixed.

One continuous 21.818-second clip was delivered as Telegram message 1158, per
David's request for a single short example without A/B. Native timing/slide and
encoded audio checks pass. This direction remains an audition; the other replies
and synchronized full arrangements await listening feedback before adaptation.

## Dirty Cache: connected full arrangement

David approved the short connected-reed sketch and requested the complete track.
[The full candidate](../alternates/dirty-cache-connected-full/README.md) retains
both tense motifs exactly and introduces the lower motif with the softer calm
reed in the bridge. The transition chord gap remains. Three conflicting reed
entry gates are reconciled in the proposed game/album layouts; both candidates
come from the same shared parts. The groove, distant plucks and original hooks
retain their existing parts.

The complete 3:42.545 OGG was delivered as Telegram message 1159. Native timing,
game-loop and encoded audio checks pass; all fifteen maintained songs regenerate
cleanly. It uses the same -0.8 dB monitoring gain as the approved sketch and
measures -15.6 LUFS-I/-1.5 dBTP. Full-track approval is pending before shared
source adoption, mastering or publication.

## Patch review coverage

David asked that the continuing review explicitly include instrument design.
Review every track's patches in calm, tense and fill context: tone, envelope
length, articulation, balance, and consistency between the main kit and fill.
Record retained patches as deliberate choices after review; do not infer a full
patch review from a successful arrangement or timing pass. Relay Ghost, Breach
Vector and Cold Boot have explicit patch comparisons; Dirty Cache's latest
pass primarily reviews phrasing with its existing approved instrument bank.
Promising instrument changes should receive contextual A/B clips before adoption.

David approved Dirty Cache's connected full arrangement and authorized finishing
adoption, mastering and publication. Shared source adoption now reproduces both
approved candidates exactly, including the three reconciled reed entry gates.
Basement Circuit is the suggested next review: consider its acid phrasing and
patch articulation while preserving the restrained drums, softened transition
swell and reduced late bass balance.
