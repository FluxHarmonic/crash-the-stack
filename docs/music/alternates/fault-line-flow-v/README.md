# Fault Line: independent bass and moving entrance V

David approved Style IV's syncopation, then identified a stall before the solo
and asked for an independent bass-guitar line with more low-end weight. This
pass preserves the established guitar groove outside the two-bar entrance and
retains the accepted bent solo, snare, hats, toms, crash and non-bass instruments.
It remains a 49.524-second style audition; no maintained game/album song changes.

## Composition and sound

The old entrance started with a long open A chord, then left an 18-row interval
before the next guitar attack. The new first bar continues the main riff's short
accents and melodic turn. The second bar adds moving chord accents and D pickups
while the kick supplies a forward pulse. Its longest guitar inter-onset gap is
six rows, about 0.357 seconds, instead of 18 rows/about 1.071 seconds. Guitar
note lengths there are at most three rows; the old held opening chord is gone.
The entrance occupies the same bars and flows into the unchanged solo at 0:26.667.
The existing tom fill plays over this movement rather than over a thinning band.

The bass now has a written two-bar identity: low root anchors, fifth answers,
octave responses and short descending approaches. Subsequent chords develop
that idea instead of copying every guitar pitch and rest. Longer anchor gates
carry the floor through selected guitar gaps, while short connecting notes
thread between the syncopated accents. The transition's bass answer leads into
the low D under the solo. The D-minor anchor and ending now reach D1 (36.708 Hz),
with higher responses preserving the picked-bass character and melodic clarity.

Instrument 4 retains the FM pick transient. Its fundamental operator has a
slightly stronger, longer body, and the amplitude sustain/release increase
modestly. A clean, centered `chip-sub` layer reinforces the same pitch, not a
constant octave below every note. That avoids unnecessary very-low extensions
under the G/F notes. The layer has a short attack and gated release; the bass
stays dry. Instrument output gain remains 0.9 and no bus processing changes.
All other instrument definitions are identical to the accepted Style IV bank.

## Listening guide

The complete revised demo is **49.524 seconds**. Hear the new entrance around
**0:22.857–0:26.667**. The **38.095-second A/B** plays Style IV first, then Style V
at **0:19.048**. Each half includes the last four pocket bars, the two-bar
entrance, the first two solo bars and two release bars. All comparison halves
and complete reference files use the same -1.3 dB monitoring gain. There is no
per-half normalization or extra limiter.

## Reproduction and checks

```sh
sigil docs/music/tools/fault-line-flow.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /tmp/fault-line-v-replay
sigil docs/music/tools/expression-render.sgl --stage native \
  --input "$PWD/docs/music/alternates/fault-line-flow-v" \
  --motif "$PWD/build/dev/bin/motif" --output /absolute/fresh/artifacts
sigil docs/music/tools/expression-render.sgl --stage delivery \
  --input "$PWD/docs/music/alternates/fault-line-flow-v" \
  --gain-db -1.3 --output /absolute/fresh/artifacts
sigil docs/music/tools/fault-line-flow-audit.sgl \
  --motif "$PWD/build/dev/bin/motif" --output /absolute/fresh/artifacts
```

Of 132 compiled bass attacks, 79 occur between guitar attack positions. This
checks that the line has rhythmic independence while still sharing anchors.
The compiled lead/kit tick tables are identical to Style IV; kick/guitar tick
performance outside the entrance is also identical. The previous five-bend
verification therefore still applies. The generator checks score scope and bus;
the dedicated audit checks instrument scope, bass independence, low register and
maximum entrance gap. The finite audit reports 751 attacks, zero sample-clock
error, no 32nd-note attacks, released final gates and passing voice budgets.
All seven generated files reproduce and all fifteen maintained-song checks pass.

Supporting full-context measurements show 30–110 Hz mean energy increasing
1.5 dB, versus a 0.9 dB broadband increase. These include the newly written
entrance, bass line and patch together; they do not isolate the patch or establish
subjective quality. The full revised OGG measures -19.2 LUFS-I/-2.4 dBTP; the
A/B is -19.4 LUFS-I/-3.0 dBTP. Both full endings peak at -91 dBFS in the last
second. Duration, stereo 44.1 kHz and encoded-peak checks pass.

Audio, exact commands, score snapshots, renderer identity, measurements and
receipts live at ~/Ops/artifacts/crash-the-stack-album/fault-line-flow-v/.
Keep Style IV as the accepted groove reference while awaiting listening feedback
on this bass and entrance revision. After Image and public audio remain unchanged.

## Delivered review copy

Source commit **80f22ae**. Telegram acknowledged the Style IV/V comparison as
**1185** and the complete revised short demo as **1186**. All reference and
delivered OGG hashes are preserved in `encoded.sha256`; commands, measurements
and acknowledgments remain in the external render folder. Listening feedback
on the independent bass and moving entrance is pending.
