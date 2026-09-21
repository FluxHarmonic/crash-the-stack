# Album listening preview

Requested URL: https://crashthestack.com/soundtrack/.

The static player presents all fifteen provisional album-level arrangements in
the confirmed sequence: Black Glass first, Glass Current last. Runtime is
55:09.297. Audio starts only after a playback action. Track selection, previous/
next, native seek and volume controls, automatic progression and an end-of-album
state are included. OGG is preferred where supported, with 256 kbps MP3 fallback
encoded directly from each master WAV. No external fonts, scripts or services.

## Reproduce the public bundle

```sh
sigil docs/music/tools/album-listening-site.sgl \
  --artifacts /absolute/crash-the-stack-album \
  --output /absolute/fresh-listening-preview
```

The output directory must be new and outside the repository. The tool validates
all selected score snapshots against the canonical album scores and checks
published audio durations, stereo/44.1 kHz format and the Pages per-asset limit.
It copies the selected existing OGGs without re-encoding. Black Glass and Quiet
Array select the album-level pilot trials, not the matched-level comparisons.

Only `soundtrack/` is public. Its sibling `build-report.json` contains local paths,
source/audio hashes and exact MP3 argv for provenance; do not publish that report.
The selected album master WAV/FLAC files and all original render logs remain
outside the public tree and outside Git. Source precision remains 16-bit.

Initial bundle: ~/Ops/artifacts/crash-the-stack-album/listen-preview-i/.
The OGG total is 78,640,277 bytes (75.00 MiB); MP3 is 105,931,365 bytes
(101.02 MiB). Largest asset: Black Glass MP3, 8,450,500 bytes (8.06 MiB).
Cloudflare Pages permits 25 MiB per file and 20,000 files on the Free plan:
https://developers.cloudflare.com/pages/platform/limits/ (checked 2026-09-21).
There are thirty audio files plus four small page/data files.

## Integration with the game site

A Pages publish replaces the deployment's complete file set. Add `soundtrack/`
to the current site's staging set, preserving the game, tracker and existing
headers. Do not deploy the album directory alone to the production Pages project.
This album worktree predates newer game/tracker changes; never publish its old
game build over the live game. Integrate the small publisher change into the
current publisher, or stage from the independently verified current build.

`web/sw.js` now exempts `/soundtrack` and its descendants from the game's
navigation fallback and offline cache. This lets audio Range requests reach
Pages and prevents a previously visited game from substituting its cached page
for the soundtrack. Preserve the current tracker route when integrating this
small guard. Existing installed clients need to accept the normal game update;
do not force service-worker activation or interrupt a game in progress.

A proposed publisher safeguard requires `CRASH_SOUNDTRACK_DIR` (or the built
`build/web/soundtrack` directory), then copies the bundle into the staging tree.
It refuses to publish without the bundle so later game deployments cannot
silently remove the album. Automatic approval review requested explicit user
confirmation of this future deployment behavior. No publisher change or public
upload was made while that confirmation was pending.

## Verification

The complete bundle built successfully from all fifteen checked masters. All
thirty published audio files pass size, format and duration checks. Browser
checks on Chromium cover no initial audio requests, OGG playback, direct track
selection, seek near the end followed by automatic progression, previous track,
MP3-only playback and the final-track completion state. The phone layout has no
horizontal overflow; desktop and phone screenshots accompany external artifacts.
A focused service-worker harness checks that soundtrack navigation and audio
bypass interception, while game navigation and game audio retain their paths.
Safari and a physical phone are not yet tested. Browser functional checks were
muted and do not represent listening approval or final mastering review.
