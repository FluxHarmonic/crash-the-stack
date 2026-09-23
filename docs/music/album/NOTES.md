# Album production notes

## 2026-09-21 — Pilot brief

The game and authoring-tool migration has merged. Work continues only in the
album worktree on feat/codex-album. The coordinator owns runtime integration.
The historical process and alternate sources remain under docs/music/; begin
with README.md, AUDIO-REVIEW-PROCESS.md and ALBUM-PLAN.md for the full context.

Protected references: assets/tunes/quiet-array.cts, black-glass.cts and
black-glass-title.cts. The accepted Main Theme IV is the Black Glass melodic
reference. Keep its reduced gritty voice and genuine tracker chord cycling;
do not reinstate the rejected melodic arpeggio flourishes.

New album authoring, validation and rendering tools are separate Sigil files
under docs/music/tools/. Read actual library APIs before using them. Credentials
remain outside the repository and are supplied explicitly when sending auditions.

No album phrases are nominated for game backport yet. Record any later proposal
here with the album location, reason and game destination; do not edit game assets.

## Review contract

Check canonical score validity, compiled attack clocks, voice budgets, section
boundaries, finite playback and released gates. Preserve intentional syncopation.
Measure actual full renders for loudness, peaks and decay. Numeric checks do not
establish musical quality: David's listening feedback remains the acceptance
criterion. Send full OGG auditions including bridges and endings.

David proposed Black Glass as the opener: the title theme makes the strongest
immediate statement. Sequence now begins Black Glass, Cold Boot and ends Glass
Current. Black Glass opens with the accepted title ignition and theme statement;
the newly written distant-theme passage moves into the central breakdown.

## Pilot I completion

Black Glass now opens and Cold Boot follows; David also confirmed Glass Current
as the closer. The first two complete arrangements and full OGG auditions are
recorded in PILOT-I.md. Existing game phrases and patches remain protected.

The mastering discussion clarified that these are pre-final-master auditions,
with modest gain only beyond their existing mix bus. MASTERING.md preserves the
proposed listening/measuring workflow, separate comparison levels, and verified
Motif limiter/16-bit export limitations for the engine owner. No Sigil shell
limitation blocks this workflow. Remaining thirteen arrangements are pending
feedback on the quiet/heavy pilots; no release master or album publication is
claimed.

## Mastering trial I

David liked both pilot compositions and approved comparing restrained mastering
before the remaining arrangements. Four full auditions separate matched-volume
processing review from proposed album playback levels. See MASTER-TRIAL-I.md
for listening landmarks, provenance and checks. No composition or game asset is
changed. The next arrangement pair is Cold Boot and Relay Ghost; mastering
preferences remain pending the trial listen.

## Opening pair I

David found the album-level pilots promising and authorized the next tracks
while continuing to listen for details. Cold Boot and Relay Ghost receive new
finite arrangements in positions 2/3. Their accepted instrument banks and buses
remain intact; preserve Cold Boot's integrated fill and Relay Ghost's complete
returning bell phrases. See OPENING-PAIR-I.md. The pilot mastering recipe remains
provisional; adjust gain per track from measured native renders, not by forcing
all fifteen titles to one loudness. No game backport is proposed.

## Signals pair I

While listening to the opening pair, David authorized Closed Loop and Shadow
Protocol. Six of fifteen album arrangements now exist. See SIGNALS-PAIR-I.md for
section landmarks and measured provisional levels. Preserve Closed Loop's
snap-click identity and Shadow Protocol's delicate pad/vibes and subtle tension.
Shadow uses the older speed-6, sixteen-row bar clock; its off-eighth bass/lead
notes and slides are intentional. The shared tools now account for that clock
without changing the prior scores or maps. No game backport is proposed.

## Air pair I

David reports that everything sounds great so far and asked for the next two.
The opening and signals pairs are liked; finer listening feedback remains open.
Blind Spot and Sector Drift fill positions 6/8, bringing the album to eight full
arrangements. See AIR-PAIR-I.md. Blind Spot retains its complete spacious body
with a new entrance and ending. Sector Drift adds a brief bass-and-dust break,
a full calm reprise and a G-minor landing. Both retain their accepted banks,
buses and onset grids. No game backport is proposed.

## Pocket pair I

David requested Dirty Cache and Basement Circuit while listening to the air pair;
feedback on Blind Spot and Sector Drift remains open. Ten of fifteen full album
arrangements now exist. See POCKET-PAIR-I.md for the new forms and checks.
Preserve Dirty Cache's on-beat quiet pluck, corrected harmonic return and sparse
calm texture; Basement retains Signal Kit IV's integrated drums, reduced swell
and acid accents. The native clocks, slides and intentional fills are retained.
No game backport is proposed. Dirty Cache's already strong native render calls
for attenuation, while Basement's native level fits the provisional sequence
without added gain. Keep per-title decisions rather than a universal target.

## Stone pair I

David asked to continue after the pocket-pair delivery. Dead Sector and Obsidian
Index fill positions 11/12, bringing the album to twelve full arrangements.
Feedback on the recent air and pocket pairs remains open. See STONE-PAIR-I.md
for the compact mystery arc and the pedal-led entrance, reprise and ending.
Obsidian uses the selected Waves IV patches and side-pad accents, retaining the
accepted Pedal II identity. The audit now checks paired-pad harmony and release
spacing across boundaries. No game backport is proposed. Breach Vector, Clock
Edge and the confirmed closer Glass Current remain to be arranged.

## Edge pair I

David explicitly requested the next two as soon as Dead Sector and Obsidian Index
were done. The stone-pair full OGGs were acknowledged before work continued on
Breach Vector and Clock Edge. Fourteen of fifteen full arrangements now exist;
Glass Current remains the final planned closer. No new listening acceptance is
inferred for the recent pairs. See EDGE-PAIR-I.md for the new forms and checks.

Breach retains the accepted smooth opening balance, spaced middle plucks and
adaptive grit/pipe development on its native speed-4 clock. Clock Edge retains
Room II's body and selective ambience. All game sources and both instrument
banks/buses remain intact. No game backport or new synth feature is proposed.

## Closer I and listening preview

Glass Current completes all fifteen full arrangements. Its exposed theme,
lower-register development and calm return lead to a composed harmonic ending.
The accepted Paper Kit II bank and balance are unchanged. See CLOSER-I.md.
No game backport is proposed. Completion does not imply listening acceptance
for the most recently delivered pieces or final release approval.

David requested a public listening page at crashthestack.com/soundtrack/ for
the current album. Package the provisional album-level OGGs with MP3 fallbacks,
without moving audio artifacts into Git. Preserve the existing game deployment.

## 2026-09-22: Obsidian game tension audition

David requested a more recognizable tense section after hearing the M1 game
version. A separate [Tension V audition](../OBSIDIAN-V.md) is preserved under
alternates, with the engine's correct calm/fill/tense marks. The accepted game
asset and this album's score/render stay unchanged until David hears it and
chooses whether either should adopt the revision.

[Listening feedback and tracker experiments](FEEDBACK.md) records a practical
process for deeper album review and learning through small edits on copies.

## 2026-09-22: Obsidian album adoption

David approved Tension V's added activity and requested it in the soundtrack.
[Obsidian album II](OBSIDIAN-II.md) adopts its four focused phrases and dedicated
instruments, preserving every other album phrase. The new tense entry is at
1:54.286 in the full album form. Historical game and album auditions stay
available; no game asset is edited in this worktree.

## 2026-09-22: Relay Ghost album II

David approved the quieter contact/dust kit, original bell and 2 dB lower
FM gritty bass (instrument 19). [Relay II](RELAY-II.md) adopts that mix in the
full album form, retaining the original pluck and separate acid part.
A future game backport can reuse instruments 2, 3 and 21 plus instrument 19's
output gain. Gain requires the Motif feature in `b0d135e`; no game tune,
runtime source or dependency is changed in this worktree.

## Breach Vector percussion approved; game synchronization pending

David strongly prefers Percussion I: reducing snare noise reveals the other
drums' dynamics and space. Phrases I and Percussion I together are the accepted
listening direction. No further instrument change is proposed before checking
the complete mix and eventual game transitions. The current accepted audition
is `../alternates/breach-percussion-i/breach-vector-after.cts`.

The latest work has not updated game assets. The album assignment explicitly
keeps assets/tunes/ untouched and records backports here. The snare is a direct
instrument-2 replacement for the adaptive game score, preserving notes and
all 14 fill hits. For the phrase pass, album patterns 40/41 correspond to game
patterns 34/35: the late pipe cadence and relaxed second-half signal can be
reviewed there. Album patterns 11 and 30 are album-specific bridge/development;
pattern 31 develops a repeated game-18 phrase. These should be mapped by musical
role and auditioned in the adaptive sequence, not copied by album order number.

Pending shared sound changes: Relay Ghost's instruments 2/3/21 and gritty-bass
instrument 19 output gain, plus Breach Vector's approved instrument 2. Verify
Motif instrument-gain support in the game dependency before Relay's backport.
Preserve the game's marks, loops, calm/tense behavior and SFX headroom. Album
mastering gain/limiting belongs to the listening release, not this asset sync.

## 2026-09-23 — New rock and synthwave style auditions

David requested a guitar/bass/drum-kit rock track with optional polished retro
FM character, plus a retrowave/synthwave track with big drums and thick pads.
He chose **After Image** for the latter and explicitly requested short demos
first. The rock working title is **Fault Line**. These new candidates do not
change the fifteen-track album order or any maintained game/album song.

The finite 26-bar sketches, section maps, instrument rationale and reproduction
process are preserved in [rock-wave-sketches-i](../alternates/rock-wave-sketches-i/README.md).
The Sigil composer and delivery tool are under docs/music/tools/. Rendered WAVs
and OGGs live at ~/artifacts/crash-the-stack-album/rock-wave-sketches-i-final/.
Full arrangements and synchronized game/album sources await style feedback.

## 2026-09-23 — Rock bite and dark-synthwave revision

Style II preserves Fault Line's liked composition and most of its kit, revising
only guitars and tom. After Image gains an anchored low sub beneath its octave
pulse; David clarified **dark synthwave**, so its lead moves down an octave and
pad/lead brightness softens while preserving chord voicings and the liked snare.
The short full demos and equal-gain contextual comparisons await feedback.
See [Style II](../alternates/rock-wave-sketches-ii/README.md) for scope and commands.

## 2026-09-23 — Fault Line heavier rock audition

David requested more rhythm-guitar body/distortion, a small lift for the improved
tom and a higher pentatonic solo with bends. [Fault Line Style III](../alternates/fault-line-heavy-iii/README.md)
preserves the backing composition, thickens guitar layers, lifts the tom 1.5 dB
and adds an upper D-minor pentatonic solo with verified held whole-tone bends.
It remains a short audition awaiting listening feedback. After Image is unchanged.

## 2026-09-23 — Fault Line groove development

David liked the heavier guitar/tom/solo pass and requested more modern rhythmic
composition. [Style IV](../alternates/fault-line-groove-iv/README.md) adds a
syncopated two-bar guitar/bass call and reply, selected kick accents, deliberate
stops and phrase-ending variations. It retains the Style III patches and exact
bent-lead/snare/hat/tom performance. Short A/B and complete revised demo await
feedback; full song development remains pending the chosen direction.

## 2026-09-23 — Fault Line bass identity and continuous entrance

David approved the syncopated groove and requested removal of the pre-solo stall,
an independent bass line and more low-end body. [Style V](../alternates/fault-line-flow-v/README.md)
preserves the established guitar writing outside the entrance, replaces the
long-chord pause with forward motion, and gives the picked bass low D anchors,
fifth/octave answers, passing notes and a clean fundamental layer. The bent solo
and accepted kit performances remain exact. Full short demo and A/B await feedback.

## 2026-09-23 — Fault Line bass clarity and restraint

David found Style V's bass too mobile and too sub-heavy to follow. [Style VI](../alternates/fault-line-bass-focus-vi/README.md)
reduces it to a repeated root-led motif with one fifth answer per pair, raises
the D anchor to D2, reduces the sine layer and emphasizes picked harmonics.
The guitar groove, moving entrance, kit and bent solo remain exact. The full
short demo and matching comparison await listening feedback.

## 2026-09-23 — Fault Line: assess the bass against the riff

The Style VI bass worked alone for David but still felt disconnected from the
guitar. VII keeps its patch and adjusts the actual phrase: shared main accents
and release points, replies following the guitar's harmonic movement and its
fourth/eighth-bar variations, with only sparse fifth answers in longer gaps.
The lesson is to check bass/guitar phrasing together: fewer notes and a clearer
patch do not fix conflicting accents. See alternates/fault-line-bass-lock-vii/.

## 2026-09-23 — Fault Line full composition I

Expand the accepted VII riff with a recurring clean/electric motif, an exposed
harmonic middle and a delayed bent-solo payoff. The 3:03 album form and a real
calm/fill/tense draft share parts, bank and bus. The game draft is generated under
docs/music/alternates/ until accepted for integration; existing assets and game
code are untouched. Possible role: rhythm challenge or high-pressure sequence.
See FAULT-LINE-I.md for the timeline, reproduction and review evidence.

## 2026-09-23 — Fault Line composition II: let the rock form lead

David wanted the soft opening shortened and the heavy material developed, while
retaining the softer secondary melody. II brings the band in at 0:08, keeps one
soft interlude, adds driving and half-time variations plus a contrasting earlier
solo, and ends with the band. The patches are unchanged. Quiet timbre can remain
as a countermelody within a heavy section; it need not require a long soft section.
Shared game tense phrases are updated; see FAULT-LINE-II.md.

## 2026-09-23 — Fault Line: phrase anchors and interlude transitions

An exact sample clock does not make a phrase feel on the beat. David's 0:54
reference narrowed the issue to the alternate solo: move its delayed accents
earlier while preserving the accepted melodies elsewhere. Add contextual fills
into and out of the quiet interlude, and compensate guitar level when increasing
fuzz. A held 3xx bend requires a target note and continuation on subsequent rows;
verify compiled pitch events rather than inferring a bend from an effect label.
See FAULT-LINE-III.md and the archived audit results.

## 2026-09-23 — Fault Line game role after album approval

David likes the approved composition III and sharing master and wants a place
for it in the game. Proposed role: a deliberately more forceful challenge or
counter-hack encounter, with a later rhythm-mode chart as a second use. The clean
melody and pads supply anticipation; the fuzzy riff can make the trace landing
feel like an escalation. Keep the established Black Glass title identity and
David's curated stealth hub pool. This is a proposed placement, not an approved
change to the gameplay pools or a new encounter requirement.

The shared-source game draft already provides sixteen calm bars (orders 0–1),
a two-bar entrance fill (order 2), and seven eight-bar rock variations (orders
3–9). Loop effects are B00 and B03. The future integration should preserve the
shared generator and change its game destination to assets/tunes/fault-line.cts,
adding `(marks calm: 0 fill: 2 tense: 3)` to the game template. Regenerate the
game/album outputs and receipts together; do not copy the mastered MP3 into the
runtime or raise the game bus to the standalone mastering level.

Read-only inspection of current crash-the-stack main confirms that music.sgl
uses live .cts sections and reserves CANDIDATES for tracks not yet heard in
context. First integrate Fault Line as a candidate, then audition with actual
SFX and the trace-driven fill/tense transition before assigning a pool. A cards
counter-hack is an existing context in which to test it; no new game mode is
needed for that audition. Check calm looping, the fill ending on the ICE strike,
tense looping, return to calm and headroom under simultaneous cues. The current
engine returns to calm with a short dip; a composed return fill is future work.

For a future rhythm chart, the finite album form supplies short introduction,
main groove, alternate solo, quieter interlude and a final return. Chart the
kick/snare and guitar accents at 126 BPM first, reserving denser solo figures for
higher difficulties; the chart itself is not authored yet.

Runtime integration belongs with the game coordinator: this album worktree's
src/ still has the pre-M1 music policy. Its current scope excludes runtime edits.
No runtime file, game asset, selection pool or published audio was changed here.

## 2026-09-23 — Fault Line authorized live integration

David authorized merging master and wiring Fault Line into a mode for a trial.
This supersedes the earlier candidate-only integration proposal: Defrag now
includes it, with an existing tune override and short-trace developer option
for immediate review. See ../FAULT-LINE-GAME.md. Album composition and mastering
are unchanged; runtime integration is explicitly in scope for this step.
