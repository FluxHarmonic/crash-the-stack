# Cold Boot album II: approved mix

David approved Motion I's metallic hats and pressure-filter contrast, hearing
less mud and less busyness in the mix. This completes the musical pass. The
kick, sub, integrated knock/fill, chord stabs, distant bell, all notes, accents,
gates, bus and 3:34.545 arrangement stay as approved previously.

The five patch changes are adopted in `../songs/cold-boot/parts.cts`. Both game
and album outputs regenerate from that source and exactly match the Motion I
candidates. See [the audition record](../alternates/cold-boot-motion-i/README.md)
for the independent comparisons, measured levels and listening receipts.

Mastering and publication are pending. The current website still serves album
I, and deployed game/tracker assets still predate this source adoption. Reuse
`cold-boot-motion-i/cold-boot-after.wav` under the external album artifacts root
as the lossless native source after checking its source snapshot; it is the
approved performance. Evaluate the established Cold Boot album gain (+1.5 dB)
and limiter recipe against the revised mix, then check encoded true peak,
duration and ending decay before release. Do not use the gain-adjusted audition
OGG as a mastering source.

At publication, update the automatic MP3 master selection, metadata-bearing
export, immutable audio object and soundtrack manifest together. Preserve the
other fourteen tracks and both earlier masters and comparisons. No new engine
feature is needed for this revision.

Adoption validation passes for all fifteen songs (four independent check groups
covering 4/4/4/3 songs). Both generated outputs match the approved candidates,
and the adopted album is byte-identical to the rendered native source snapshot.
The existing timing/audio audits therefore apply without resynthesis. No other
song source or generated arrangement changes in this adoption.

## Album-level master prepared

The approved native WAV is copied losslessly to `cold-boot-ii-release/` with
source and renderer hashes. The established +1.5 dB input gain and oversampled
peak limiter produce -15.9 LUFS-I / -1.5 dBTP WAV and -15.8 LUFS-I / -1.4 dBTP
OGG. Loudness range remains 3.3 LU. Duration and all format checks pass;
WAV/FLAC decoded PCM is identical and the final second peaks at -90.3 dBFS.
The exporter now selects this master for Cold Boot. Publication follows after
the tagged MP3 and preserved live-site snapshot pass their checks.
