# Reviewing procedural game music

This is the process used for the Crash The Stack soundtrack. The musical
principles apply to future games and music projects; the commands below are
the current Motif implementation. Keep the process and evidence with the
game's sources when the collection moves out of this temporary worktree.

## 1. Establish the musical job and reference

Record the scene or game mode, intended energy, recognizable motif, rhythmic
feel and the user's specific concern. Name the exact source and render version
being discussed. A timestamp is especially useful for harmonic or timing issues.
Keep an explicit accepted version separate from an audition awaiting feedback.
Never silently replace an accepted source or export.

Before composing another track, compare its opening contour, chord functions,
harmonic rhythm, bass pattern, percussion and section development against the
collection. Different keys and timbres can conceal substantially similar
writing. Obsidian I and Quiet Array shared more than a sound palette; the
successful rework changed the theme, pedal foundation and harmonic pacing.

For a revision, write down what should be audibly different and what must stay
stable. Follow specific feedback before making speculative improvements.
An approved track can remain finished while others develop.

Describe the intended audible gesture before choosing its implementation.
Black Glass's requested old-game arpeggiated instrument was misinterpreted as
short melodic note runs. David wanted the possibility of a brief cycling chord
sound and asked to remove the runs. Preserve the approved balance, undo the
wrong ornament, and treat the optional new sound as a separate decision.
After he explicitly confirmed the cycling tracker chord, Main Theme IV added
short pulse-wave stabs with rapid pitch changes under one sustained envelope.

## 2. Preserve provenance and make a deliberate edit

Create a new versioned source. Keep previous sources, full audio, section
exports, measurements and listening decisions. A new mix or title arrangement
does not automatically count as a new composition.

Use direct score editing for local changes. Use a readable composition helper
when it makes repeated phrases, section variations and collision checks more
reliable. Keep actual melodies and harmonic choices explicit; generated rows
should express those decisions. A helper must refuse to overwrite later edits
and should reproduce its own output exactly.

Use a small scope for balance auditions so feedback is attributable. For a
larger arrangement revision, make a bar/section map and explain its changes.
Preserve the original kit in fills unless a different sound is intentional.
Keep quiet details and complete melodic phrases when darkening a track.

## 3. Inspect the score and instrument behavior

Check pitches against the intended harmony, especially when the bass returns
from a contrasting section. Check inversions and sustained upper notes too.
Verify that chord releases clear or intentionally overlap the next bass/chord
change. A gate ending is not necessarily the end of the instrument's sound.

Audit note onsets, rests, gates, dynamic accents, ghost notes, section entries,
clock effects and loop destinations. Distinguish deliberate syncopation from
an accidental off-grid event. Do not quantize away a written rhythmic identity.

Check **perceived attack** separately from event timing. A pluck can trigger
exactly on the grid but have its audible energy arrive late because of its
amplitude/filter envelope, layered voices, delay or transient shape. Preserve
the rhythm while adjusting the patch when that is the cause.

Read the synth and routing APIs before adding parameters. Verify which voice
and section actually use the instrument being edited. Breach Vector showed why
raising a later riff cannot fix the listener's concern about an opening synth.
Defaults are often overridden by per-note volumes; changing only an unused
default can produce no audible result.

Current Motif details to account for:

- Tunes have up to eight tracker channels, with up to eight allocated voices
  per channel. Distinct instruments and layers count toward that allocation.
- Channel pan and reverb send come from its first played instrument. Layer
  pan/send fields do not provide independent stereo placement in this path.
- Additional notes on a channel can interrupt existing gates. Moving a short
  contact into another channel requires checking collisions, tails and routing.
- The shared reverb adds wet signal to the mix. Its gain is separate from each
  channel's send. Added width is not the same as simply increasing that gain.
- Operator amplitudes, layer gain, envelopes, note level and routing all affect
  audibility. Check the resulting signal, not just the size of a parameter edit.

## 4. Validate and compile before rendering

Run `motif tune check`, canonicalize with `motif tune print`, and inspect
`motif tune info`. Parser validation alone does not prove the tune fits the
renderer: compilation can still reject an excessive voice allocation.

Use `motif tune ticks SOURCE CHANNEL` to inspect compiled sample clocks,
frequencies, levels, gates and triggers. For a patch-only edit, compare the
compiled event tables with the reference. For an arrangement edit, compare
against the intended new score and section map.

For tracker arpeggios, audit pitch steps separately from note attacks. The
title IV stabs use `037` (root, minor third, fifth) at 56 ticks per second,
repeated on held rows because effects reset each row. Verify the intended
frequency ratios and tick clocks, one envelope trigger per stab, and a final
gate release. Extra pitch changes must not become unintended note retriggers.

The Crash grid auditor calculates expected sample timestamps using rational
arithmetic, then matches every compiled trigger by channel. At speed 3, one
row is an eighth of a quarter-note beat: even rows form the sixteenth grid,
and multiples of four form the eighth grid. Some older fills deliberately use
the intervening thirty-second rows. Document exceptions explicitly. Expect at
most one sample of clock rounding, not accumulated drift.

Do not blindly reuse a song-specific backbeat assertion on new music. The
Obsidian rework deliberately changed its strong frame-drum positions. Keep
the intended grid and accent map distinct from a test that merely reproduces
whatever events happen to be present.

## 5. Render complete listening versions and game sections

Render from the exact validated source with a recorded executable/build and
command, sample rate and format. Current auditions are stereo 44.1 kHz WAV
and native OGG. Full listening versions include transitions and fills.
Only full versions are sent to the listener unless they request otherwise.

Generate independent gameplay sections with explicit entry state and corrected
loop destinations. Calm/tense exports start with fresh DSP and reverb state;
they are not cuts from the full WAV. For a title tune, distinguish the one-time
entrance from the repeating menu body. Keep its export and loop metadata clear.

Example in this worktree:

```sh
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks obsidian-index-v4 --format both --output build/content/audition
sigil docs/music/tools/timing.sgl --motif "$MOTIF_BIN" \
  --tracks obsidian-index-v4
```

For future projects adapt the source list, section layout and timing rules;
do not treat this project's track registry as a general musical specification.

## 6. Check the exported signal

Measure duration, sample peak, RMS and saturated sample count from the lossless
WAV. Require a nonempty audible signal, correct sample rate/channel count and
no unintended clipping. Compare section levels and check transitions/swells.
Do not turn these readings into a fixed loudness target for every composition.

Decode every OGG completely, and verify codec, sample rate, channel count and
duration against the WAV. Use metadata-only stream copying to tag files, then
compare decoded PCM hashes before and after tagging. Preserve unnormalized
working renders and write a SHA256 manifest for the complete artifact package.

Useful independent checks:

```sh
ffmpeg -v error -i audition.ogg -f null -
ffprobe -v error -show_entries stream=codec_name,sample_rate,channels,duration \
  -of json audition.ogg
ffmpeg -i audition.wav -af astats -f null -
sha256sum -c SHA256SUMS-audition
```

Sample peak and RMS are the checks performed on these auditions. They are
**not true-peak or integrated-loudness measurements**. The dedicated album
mastering pass will add those, use lossless source renders, compare processing
at matched listening loudness and check encoded peaks. Final formats/targets
depend on the chosen release destination. See the album plan.

## 7. Compare audibility and musical effect

A changed file hash, waveform or parameter proves a change occurred; it does
not prove the listener can hear it or that it helps. For timbre/processing
comparisons, compare at matched playback loudness. For a requested level
change, also compare at actual delivered levels so its intended effect remains.
Listen in context, then isolate a part if its identity is uncertain.

Obsidian Waves III is a useful caution: its moving bass layer and side pad
changed the rendered signal, but David could not hear enough difference. Mark
that audition as insufficient and make the requested component more apparent.
Do not claim successful musical polish from technical checks alone.

For its follow-up, render the same short phrase with just the relevant channel.
Compare the old core, core plus new layer, and side-pad versions separately.
The opening bass difference was about 19 dB below the original in III; the
revised layer is about 10 dB below. III's side pad was roughly 11 dB below the
existing chord pad. These isolated checks expose changes hidden by whole-mix
RMS. Match note events and routing when subtracting signals, and account for
nonlinear bus processing or stochastic voices before attributing the difference
to a single layer. These probes are technical evidence, not listening substitutes.

Collect feedback on the full version: hook identity, groove, darkness versus
melodic character, section contrast, perceived attacks, fills, background life,
stereo balance, swells and fatigue. Check quieter speakers/headphones and mono
when actual listening facilities are available. Record which listening checks
were performed, by whom, and which remain outstanding.

In these agent-led passes, the assistant has inspected scores, synth/routing
code, compiled events and audio measurements; David supplies the listening
judgments. The assistant must not describe that as its own audition by ear.

## 8. Validate use in the game and retain the result

A Bxx jump and correct render duration validate the source's intended loop,
not the game's playback integration. Audition repeated loops and live section
switches with the actual player: reverb continuity, entry state, release tails,
clicks, tempo stability, decoder behavior and headroom beside effects. Current
offline delivery checks do not claim those game integration checks are done.

After feedback, record the accepted source, hashes and reason for the choice.
Store sources, helper scripts, exact render commands, measurements, reports,
metadata and manifests with the project. Verify the installed files against
the manifest. Keep delivery receipts without credentials; confirm success
before reporting a file as sent, and do not retry ambiguous uploads blindly.

The review record should answer: what changed, why, what was preserved, which
checks passed, what the listener thought, and what remains unverified. This
supports future revisions, reproducible exports and a safe project handoff.
