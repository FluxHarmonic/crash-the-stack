# Legacy listening revisions II

David accepted Shadow Protocol as a substantial improvement, particularly its
subtle pads and background detail. Preserve that version. Dirty Cache was also
an improvement, but he identified an awkward harmonic return at 0:48. Breach
Vector improved on Breaker, but its opening synth movement distracted from the
thumping bass rhythm he liked. These revisions are separate auditions, with
all originals and first variations retained.

## Dirty Cache / II

The reported passage is pattern 3. The bass returns from G to D at row 32,
but the two chord voices originally remain G4/Bb4, with a D5/Bb4/G4 plucked
figure, through the second half of the pattern. That is a G-minor upper harmony
over the returning D bass; it does not resolve with the low part. The passage
starts at exactly 48 seconds and repeats at approximately 100.36 seconds.

Keep the first two bars of G minor. At the bass return, move the upper stabs
to F4/A4 and the pluck to C5/A4/F4/C5: together with D in the bass this gives
D minor seven. In the final bar, settle to D4/F4 and A4/F4/D4/A4. This descends
through a related voicing instead of leaving the upper accompaniment elevated.
Every other pattern, instrument, accent, effect, note placement and gate is
unchanged, including the funky bass turnaround and the reed hook.

## Breach Vector / II

Keep every percussion and bass note, accent and event time. Reduce the main
FM bass index and feedback so the pulse has a less animated upper edge; reduce
the grit bass's attack modulation and bit crushing in the drop. The resonant
acid riff becomes a short FM stab through a fixed 1.1 kHz filter, with quieter
accents and a small reverb send. Remove the introductory riff fragment so the
bass establishes the opening; the full riff enters at order 1, about 4.57 s.

Keep the riff's later phrases and slides. Lower the complete plucked arpeggios
one octave, soften their excitation and level, and retain the pipe melody and
written bends with zero patch vibrato and gentler modulation/drive. Add very
quiet, short pad phrases following A/F/G roots on channel 7 in patterns 0, 1
and 8. Each pad gates off before the next root. Other sections retain space,
and the pipe still provides a contrasting voice in the drop.

The new pad shares channel 7 with the pipe: two lifetime voices, below the
eight-voice limit. The eight tracker channels and original B01 intro/loop
arrangement remain. This is a revision of the existing composition, not an
additional soundtrack track or a newly divided calm/tense arrangement.

## Validation and reproduction

Both sources check successfully and round-trip through the canonical printer.
`revisions.sgl` verifies unchanged tempo, speed, order and compiled percussion/
bass tables against the first variations. Dirty Cache keeps all 3,130 trigger
times/durations, including those in the revised harmony. Breach Vector keeps
the later riff and pluck trigger times/durations, omits only the intro riff,
and adds the stated pad phrases: 5,422 compiled triggers in the full render.

```sh
sigil docs/music/tools/revisions.sgl
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks dirty-cache-v2 breach-vector-v2 --full-only --format both
```

Full WAV/OGG auditions retain the original lengths: 165.818186 seconds for
Dirty Cache and 164.571429 seconds for Breach Vector. OGG files live in `ogg/`
and carry title/album tags applied without changing decoded audio. Final
WAV peak/RMS levels are -1.57/-16.14 dBFS for Dirty Cache and -2.41/-18.84 dBFS
for Breach Vector, with zero saturated samples. Both OGGs decode cleanly as
stereo 44.1 kHz and match their WAV durations. Measurements and checksums
accompany the exports. Technical checks do not
replace David's listening comparison; both revisions await that feedback.
