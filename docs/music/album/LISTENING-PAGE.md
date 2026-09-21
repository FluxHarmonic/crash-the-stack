# Album listening preview

Requested URL: https://crashthestack.com/soundtrack/.

The static player presents all fifteen provisional album-level arrangements in
the confirmed sequence: Black Glass first, Glass Current last. Runtime is
55:09.297. Audio starts only after a playback action. Track selection, previous/
next, native seek and volume controls, automatic progression and an end-of-album
state are included. David selected MP3-only delivery for the website: 256 kbps
MP3 encoded directly from each master WAV. OGG/WAV/FLAC remain local album
artifacts. The public audio set is fifteen MP3 files, 101.02 MiB total.

## Reproduce the public bundle

```sh
sigil docs/music/tools/album-listening-site.sgl \
  --artifacts /absolute/crash-the-stack-album \
  --output /absolute/fresh-listening-preview
```

The output directory must be new and outside the repository. The tool validates
all selected score snapshots against the canonical album scores and checks
published audio durations, stereo/44.1 kHz format and the Pages per-asset limit.
It encodes MP3 directly from the selected WAVs. Black Glass and Quiet
Array select the album-level pilot trials, not the matched-level comparisons.

Only `soundtrack/` is public. Its sibling `build-report.json` contains local paths,
source/audio hashes and exact MP3 argv for provenance; do not publish that report.
The selected album master WAV/FLAC files and all original render logs remain
outside the public tree and outside Git. Source precision remains 16-bit.

Initial two-format bundle, retained as history:
~/Ops/artifacts/crash-the-stack-album/listen-preview-i/.
The OGG total is 78,640,277 bytes (75.00 MiB); MP3 is 105,931,365 bytes
(101.02 MiB). Largest asset: Black Glass MP3, 8,450,500 bytes (8.06 MiB).
Cloudflare Pages permits 25 MiB per file and 20,000 files on the Free plan:
https://developers.cloudflare.com/pages/platform/limits/ (checked 2026-09-21).
That initial bundle had thirty audio files plus four small page/data files;
the final public delivery uses fifteen MP3s on R2 and four small files on Pages.

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

The approved publisher safeguard requires `CRASH_SOUNDTRACK_DIR` (or the built
`build/web/soundtrack` directory), then copies the bundle into the staging tree.
It refuses to publish without the bundle so later game deployments cannot
silently remove the album. David explicitly approved this behavior and publication on 2026-09-21.
The safeguard is committed on feat/codex-album; merge it into the coordinator
branch before the next game publication. Set CRASH_SOUNDTRACK_DIR to the
generated soundtrack/ directory when publishing.

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

## R2 asset hosting (selected for publication)

David selected assets.crashthestack.com as a reusable public assets host after
the all-audio Pages upload encountered repeated ECONNRESET errors. The original
Pages upload was stopped before deployment. Its limits were not the cause.
The player remains at crashthestack.com/soundtrack/; audio now lives in the
new crashthestack-assets R2 bucket under soundtrack/preview-i/.

Prepare a Pages-only player and upload plan from the checked listening bundle:

```sh
sigil docs/music/tools/album-r2.sgl --stage prepare \
  --bundle /absolute/listen-preview-i/soundtrack \
  --output /absolute/new-r2-preview \
  --bucket crashthestack-assets \
  --prefix soundtrack/preview-i \
  --asset-base https://assets.crashthestack.com/soundtrack/preview-i/
sigil docs/music/tools/album-r2.sgl --stage upload \
  --output /absolute/new-r2-preview
```

The upload stage uses existing Wrangler authentication, one object at a time,
and records a source-hash receipt after each successful upload. Repeating it
resumes the remaining files. It rejects source changes after plan creation.
Use a new prefix for revised audio: versioned objects have a one-year immutable
cache lifetime. Do not overwrite a published version with changed bytes.
Only the four small files under this output's soundtrack/ belong in Pages.
The upload plan, local paths, receipts and logs are private provenance outside
that public directory. No master WAV/FLAC is uploaded.

The R2 domain uses TLS 1.2 minimum. Bucket CORS allows GET/HEAD from
https://crashthestack.com, the Range request header, and exposes Content-Length,
Content-Range and ETag. The audio element uses crossorigin="anonymous" so these
requests also work under the game's Cross-Origin-Embedder-Policy: require-corp.
Other browser origins need a deliberate CORS addition; the files themselves
are public. The initially proposed wildcard CORS policy was rejected by automatic
review; the restricted policy was approved and applied instead.

The publisher safeguard remains applicable: CRASH_SOUNDTRACK_DIR now points to
the R2 preview's small soundtrack/ directory. Future game deployments keep the
page while leaving audio objects independently stored in R2. Merge the committed
publisher and service-worker changes before the next coordinator publication.

## MP3-only refinement

David selected MP3 alone after the first R2-backed page deployed. The player
and both packaging tools now omit OGG from public manifests and uploads. The
selected MP3 objects already passed checksum, MIME, CORS and range checks; no
re-encoding was needed. Final page bundle: r2-mp3-i/soundtrack/ beneath the
external album artifact root. Local OGG/WAV/FLAC sources remain intact.
