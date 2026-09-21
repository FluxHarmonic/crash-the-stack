# Crash The Stack — proposed official soundtrack

David requested full-length listening compositions for an official soundtrack
after the final two game tracks. The pool now contains 15 distinct compositions;
Obsidian Index IV is accepted with audible pad support strengthening II's
distinct composition (OBSIDIAN-IV.md). Clock Edge / Room II
is accepted. See CLOCK-ROOM-II.md. Quiet Array and
Dead Sector are accepted without changes, alongside the previously selected
references in SOUNDTRACK.md. This is a proposed production plan, not a claim
that album arrangements, mastering or distribution are complete.

## Musical objective

Make an album with its own beginning, development and resolution, while
retaining the dark, delicate, rhythmically grounded character developed in the
game tracks. Preserve their distinctive drum voices, spacious background detail,
complete melodic phrases and restrained use of wistful harmony. Beeps and
clicks remain part of the music's identity. Fills should belong to the kit,
swells should support the transition, and foreground synths should leave room
for the other parts.

Keep the approved game sources and exports as stable references. Album versions
receive their own source files and exports, with explicit links to those
references. A listening cut can revisit a theme, take a different route into
the tense material, or finish with a reprise without altering gameplay loops.

## Proposed sequence and individual development

Durations are working targets, not quotas. This outline totals approximately
54:15; around 50–55 minutes is a useful first target. The current full game
auditions total about 41:18, so this proposes roughly thirteen minutes of new
development distributed across the collection. Keep a piece shorter if
its idea is complete. Every extension should add a musical development,
change of perspective or useful breathing space.

| # | Track | Target | Album development to audition |
| --- | --- | --- | --- |
| 1 | Cold Boot | 3:30 | Bring in the pulse in layers, establish the mechanical theme, develop its pressure section, then end on a short stripped-down return. |
| 2 | Relay Ghost | 3:30 | Preserve the accepted mix and returning bell. Extend the opening signal and add a concise coda around its existing phrases. |
| 3 | Closed Loop | 3:15 | Introduce the interlocking signals separately, connect them, briefly expose the snap/click rhythm, then return with the complete hook. |
| 4 | Shadow Protocol | 3:45 | Build the stealth pattern gradually; expand the subtle tense passage and return to the distant pads for an ending. |
| 5 | Blind Spot | 3:00 | Retain its small gestures and long spaces. Frame the accepted body with a short atmospheric entrance and a gentle withdrawal. |
| 6 | Quiet Array | 3:45 | Preserve the approved melody and chord sequence. Add a small exposed-chord bridge and a final calm reprise after the focused passage. |
| 7 | Sector Drift | 3:30 | Present the reflective theme, develop its answers, briefly reduce to bass and dusty percussion, and end with the melodic return. |
| 8 | Dirty Cache | 3:45 | Keep the corrected harmony and on-beat distant plucks. Develop the restrained opening into the tense groove, then close with a compact rhythmic coda. |
| 9 | Basement Circuit | 3:45 | Grow from the low-lit groove into the accepted acid development. Give the transition room, then resolve through a quieter return of the opening parts. |
| 10 | Dead Sector | 3:00 | Keep its minimal mystery and tense rhythm. Add a short suspended middle passage and end with the probe motif resolving back to the low pulse. |
| 11 | Obsidian Index | 4:00 | Build on the selected identity rework: let the pedal and seventh voicings unfold, develop the rising glass theme and lower answers, then return to the initial motif over a thinning accompaniment. |
| 12 | Breach Vector | 3:30 | Preserve the approved smooth synth balance and thumpy bass. Use its spacious middle plucks as a bridge into the developed groove and final return. |
| 13 | Clock Edge | 3:30 | Introduce the hook over the pulse, develop its interlocking answers, use the rhythmic reduction as a clear break, and finish with a decisive final phrase. |
| 14 | Black Glass | 4:30 | Make this the heavy climax: establish the dark groove, reveal the accepted gritty/chirpy voice, create a low-pressure break, then deliver a final focused return. |
| 15 | Glass Current | 4:00 | Close with the melodic theme, its more textured tense bass and a calmer final statement. Let the last harmony and ambience decay naturally. |

The sequence is a listening proposal. Audition transitions between tracks after
the first album drafts; energy, register, shared sounds and mood should guide
reordering. Each track should also work independently. Start with ordinary
track boundaries and intact tails; decide later whether any deliberately
composed inter-track transition adds enough to justify it.

## Production passes

1. **Select the final game references.** Retain the accepted Obsidian Index IV
   and Clock Edge / Room II. Black Glass title III keeps the approved quieter
   grit and removes the unwanted lead flourishes. Title IV adds the subsequently
   requested tracker-chord stabs and is now accepted. Record the chosen
   source hashes, titles, section positions and
   approved sound balances. The other accepted tracks need no speculative
   retuning simply because an album is planned.
2. **Move the game-owned collection into crash-the-stack.** Follow its existing
   asset/storage conventions. Move sources, retained alternatives, composers,
   render/audit helpers, reports and audio provenance together. Keep reusable
   Motif engine work in Motif. Preserve original versions and history.
   Verify inventory coverage, reproduce the selected renders, and check actual
   game loops and calm/tense transitions before beginning album arrangements.
3. **Pilot two album cuts: Quiet Array and Black Glass.** These test both ends
   of the collection: delicate melodic development and heavier rhythmic drama.
   Write short arrangement maps first, render complete versions, and compare
   with the approved game references. Use the feedback to set the scale of the
   remaining album work.
4. **Arrange the remaining tracks in small listening batches.** Develop intros,
   transitions, contrasting middle passages, returns and composed endings as
   indicated above. Maintain clear musical phrasing. A repeated section should
   evolve through voicing, response, register, rhythm or orchestration.
5. **Mix as a collection.** Compare perceived levels, low-end weight, drum
   transients, synth prominence, swells, stereo balance and reverb tails.
   Preserve the intended energy difference between stealth/puzzle pieces and
   action pieces. Recheck the former timing trouble spots and every fill.
6. **Prepare and review masters.** Render finite album arrangements with full
   note releases and ambience tails. Check clipping, peaks, noise, stereo/mono
   behavior, file integrity, starts/ends and adjacent-track playback. Review
   the full sequence in one listening session before finalizing it.
7. **Package the approved release.** Finalize artist/composer/production credits,
   album title, artwork, track order, naming and metadata. Prepare lossless
   masters plus listening copies, a versioned manifest and a concise credits
   document. Choose the distribution destination and verify its then-current
   delivery requirements before preparing its upload package.

## Audio and project deliverables

Maintain three clearly identified sets: accepted gameplay material, album
arrangements/masters, and retained audition history. Choose exact paths after
inspecting crash-the-stack; do not infer its storage layout from Motif.

For each album cut retain the editable source, the referenced game-source hash,
arrangement map, render command, source sample rate/precision, mix measurements,
lossless master and listening copy. Include complete tails rather than cutting
at a game loop point. Keep a clean final ending even when an optional album
transition is also produced.

Current auditions are native stereo 44.1 kHz, 16-bit WAV plus OGG. Use lossless
renders as mastering inputs; do not derive masters from the OGGs. Before final
mastering, inspect whether Motif should gain a float or 24-bit render path.
If higher precision is desired, implement and validate that path, then render
from the synth sources again. Simply converting an existing 16-bit file does
not recover additional source precision. Retain the original working renders
regardless of the final delivery format.

Choose final mastering levels by listening and measurement across the album,
then check the chosen destination's requirements. Avoid making the quiet
pieces as dense as the heavy ones just to match a single meter reading.

## Standalone album mastering direction

David wants to use some of the gameplay headroom for the standalone soundtrack:
there will be no simultaneous game sound effects competing with the music.
Plan a dedicated album mix/master, preserving the accepted gameplay versions.
Do not infer a fixed loudness increase from the current peak/RMS measurements.

For the Quiet Array and Black Glass album pilots, compare a clean gain-adjusted
render against a gently controlled master. Match playback loudness for the
processing comparison, then audition their intended final levels in sequence.
Judge kick punch, bass definition, melodic presence, quiet background details
and reverb tails before choosing how much compression or limiting helps.
Retain the restrained/heavy contrast between these pieces.

Measure integrated and short-term loudness, loudness range and true peak for
the completed album cuts, alongside listening across the sequence. Choose a
coherent level range and a conservative true-peak ceiling after those pilots;
no numerical loudness target is selected yet. Check encoded listening copies
for overshoots and artifacts too. Master from fresh lossless renders, retain
unmastered mixes and record all processing settings for reproduction.

More foreground presence may also call for small album-specific mix changes,
such as bass weight or clearer inner voices. Make those in the mix rather
than expecting a final limiter to solve arrangement balance. Compression and
limiting remain optional tools, not requirements to flatten every track.

## Decisions for the album phase

David asks which existing piece should accompany the title screen and whether
the game needs a dedicated theme. Cold Boot was the initial unobtrusive menu
recommendation, but David favors the bold impression Black Glass could make:
players wondering "whoa, what is this game". Black Glass is now the favored
title-screen direction. A separate title arrangement could establish its bass
rhythm early, reveal the gritty lead as the player lingers, and return through
a composed menu loop. Preserve its force and contrast with the delicate puzzle
music. Cold Boot remains suitable for a quieter screen. David subsequently
commissioned the title arrangement and requested a demoscene-style FM voice.
BLACK-GLASS-TITLE.md documents the new 2:03 main-theme audition, its metallic
hook and repeating menu body. It remains a Black Glass variation, distinct
from both the accepted Grit gameplay source and the future finite album cut.
Main Theme II responds to the loud chirpy bass by lowering it about 4 dB and
trying five brief FM arpeggios, preserving the softer passage David likes.
David likes that balance but rejects the lead flourishes as the wrong type
of arpeggio. Main Theme III removes them and retains the quieter grit; see
BLACK-GLASS-TITLE-III.md. David subsequently confirmed the rapidly cycling
tracker chord and explicitly requested it. Main Theme IV adds twelve short
pulse-wave chord stabs around the hook while retaining III's balance and
melody; see BLACK-GLASS-TITLE-IV.md. David accepted IV, explicitly approving its modern-plus-retro identity.

The working title is **Crash The Stack — Original Soundtrack**. The proposed
15-track sequence, approximate lengths and pilot pair are for discussion after
the last two game auditions. Artist credit, artwork direction, distribution
destination and release date are still open. No publishing or account action
is part of this plan. Obsidian IV is accepted. After the requested title tracker
stabs, David proposes migration into Crash followed by full soundtrack work.
Follow that order: repository handoff and playback verification, then the
Quiet Array and Black Glass album pilots. AUDIO-REVIEW-PROCESS.md records the
reusable checking workflow.
