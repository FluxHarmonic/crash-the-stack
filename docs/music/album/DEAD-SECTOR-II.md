# Dead Sector II: an answered phrase and a contrasting passage

David approved both follow-up clips and requested completion. Shared phrase 6
now carries the connected later answer and D-sharp3 approach to C-sharp3.
Shared phrase 14 adds the eight-bar experimental response after it. The next
phrase returns to the original composition and patches, exactly as auditioned.

The alternate uses a brighter FM probe, quiet filtered reflections and a short
pitched backbeat with a small clap layer. Three separate shared instrument IDs
confine these sounds to the alternate. The ten original patches, mix bus,
calm material, transition and other existing shared phrases stay intact.

Both generated arrangements use the corrected answer and alternate. The game
retains marks calm: 0, fill: 4, tense: 5 and its B05 return; the tense loop now
has five eight-bar phrases. The finite album is 208.889 seconds (3:28.889).
The revised answer begins at 1:55.556, its D-sharp approach at 2:11.667,
the alternate at 2:13.333 and the original third tense phrase at 2:31.111.

Exact structural comparisons against the approved context clip pass for both
generated scores, accounting only for instrument and pattern IDs. All other
shared phrases, original instruments and the mix bus match the prior source.
The short-clip feedback and measurements remain in
[the experiment notes](DEAD-SECTOR-EXPERIMENTS-I.md).

Reproduce the maintained scores with docs/music/songs/dead-sector.sgl --stage
write. Use album-batch-render.sgl --tracks dead-sector for the native stage,
then --stage master --gain 3 --revision ii for the existing album-level lift
and oversampled safety limiter. Keep the native 16-bit source precision explicit.

Full scores, audio, commands and validation reports belong under the public
artifact alias ~/artifacts/crash-the-stack-album/dead-sector-ii-release/.
No further composition or patch experiment is planned for this pass.

All sixteen shared songs pass regeneration with tracker edits protected. The
game audit passes 855 compiled triggers with zero samples of clock error and
its expected B05 tense-loop return.

## Album-level release checks

The album passes 929 compiled attacks with zero samples of clock error and all
final gates released. Native audio measures -22.9 LUFS-I and -5.4 dBTP. Retain
the previous +3 dB album lift: master WAV is -19.9 LUFS-I/-2.4 dBTP, OGG is
-19.8/-2.3, and the tagged MP3 is -19.9/-2.4. Loudness range is 6.7 LU. WAV and
FLAC decode to identical PCM; stereo 44.1 kHz and duration checks pass, with the
last master second peaking at -90.3 dBFS. Telegram delivered the full mastered
OGG as message 1213.

The MP3 carries David Wilson artist/album-artist credit, track 11/15, the
soundtrack album title, CC BY 4.0 metadata and the compact attached cover.
It contains 6,883,322 bytes with SHA-256
0571c51180dc736356a39973ccc0fc82ca35d1eef16daaef63c24c615d3b0129.
The versioned object is soundtrack/dead-sector-album-ii/dead-sector.mp3, with
revision query ?v=0571c51180dc. A pre-upload HEAD check confirmed that object
was unused. releases.tsv records this selection for future site builds.

Publication evidence and tagged exports are outside Git under the same public
artifact root: dead-ii-mp3/, r2-dead-ii/ and publication-dead-ii/. The publication
preserves production 33c8d536 and changes only Dead Sector's URL and duration
plus the album total. The other fourteen tracks retain their current releases.

Publication completed as deployment 84887d2f from source 004fb09. Pages uploaded
one changed manifest and reused 76 files. Public MP3 bytes, MIME, CORS and HTTP
206 range checks pass. The live manifest matches the staged fifteen-track
album. A fresh muted browser played Dead Sector past one second without error,
with the correct artist and album metadata; playback was paused afterward.
This functional check does not replace David's listening approval.

Dead Sector is complete for this pass. The synchronized game score is committed
and will ship through the next normal game build; this soundtrack publication
preserved the existing game binaries.
