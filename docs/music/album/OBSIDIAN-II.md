# Obsidian Index album II

David approved the game Tension V audition and requested its added activity in
the soundtrack. The album now uses those exact four focused phrases and their
three dedicated instruments. The original introduction, calm phrases,
transition, opening-theme reprise, landing and tail are retained. Main glass
melody, both pad voices, original instruments and mix bus are unchanged.

The stronger bass, pitched frame accents and metallic octave answers enter at
1:54.286, continuing through 3:25.714. The softer reprise then returns to the
original instruments. Total duration remains 4:05.714 and album position is 12.
This is a finite album arrangement: the game audition's adaptive marks and B05
loop are removed by the album composer.

The original album source and renders remain in stone-pair-i/ and Git history.
The new source/map regenerate with album-compose-stone.sgl; Dead Sector's source
and map still regenerate byte-for-byte unchanged. Structured comparison verifies
that only the four tense accompaniments change. The normal album audit checks
finite playback, exact compiled attack clocks, eighth-grid melodies, voices,
paired pad harmony/releases and final gates.

New audio and raw evidence live under
~/Ops/artifacts/crash-the-stack-album/obsidian-ii/.
Use album-batch-render.sgl with --track obsidian-index --revision ii and the
same +5 dB mastering gain as album I. The renderer now uses the shared David
Wilson metadata and accepts revision labels without replacing prior renders.
The MP3 exporter selects this revision automatically, with track 12/15 and the
compact embedded cover. Game runtime integration remains separate.

## Verification and delivery

The score has 870 attacks with zero compiled sample-clock error, no stray
thirty-second attacks and all final gates released. The complete WAV, FLAC and
OGG match 245.714286 seconds at stereo 44.1 kHz; WAV/FLAC decoded PCM is identical.
With the existing +5 dB gain, the master measures -18.4 LUFS-I, 3.5 LU LRA and
-1.5 dBTP; OGG peaks at -1.4 dBTP and MP3 at -1.5 dBTP. The final master second
peaks at -90.3 dBFS. MP3 tags, cover, duration and format all pass validation.

Telegram acknowledged the full album II OGG as message 1134. The complete
updated local MP3 set is tagged-preview-iii/soundtrack/audio/; only Obsidian
changes, and the previous set remains in tagged-preview-ii/. The isolated MP3
export is obsidian-ii-mp3/. Publication uses the fresh R2 prefix
soundtrack/obsidian-album-ii/ and changes only this track's URL in the existing
fifteen-track player manifest.
