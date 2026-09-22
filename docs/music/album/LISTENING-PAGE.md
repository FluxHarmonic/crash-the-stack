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

## Published and verified — 2026-09-21

Live: https://crashthestack.com/soundtrack/.
Final deployment: https://f162bc5a.crashthestack.pages.dev, source ae07ce6.
The previous R2 two-format player was b8b2f99b; the earlier all-audio Pages
attempt never deployed. The game/tracker remain the 2c33835 build, with only
the documented service-worker soundtrack bypass and version changed. Its
worker version is 2c338353d1a0-album-a186034.

The final public manifest contains fifteen MP3 URLs and no OGG URLs. The MP3
set is 105,931,365 bytes. Its source-hash upload receipts are retained under
r2-mp3-i/; the resume check skips all fifteen successfully completed uploads.
The initial fifteen OGG uploads remain unreferenced in R2; local OGG/WAV/FLAC
artifacts are unchanged. Future upload plans contain only MP3.

Public checks: the game page, tracker page, worker, player HTML/JS/CSS and album
manifest match their staged hashes. /soundtrack redirects to /soundtrack/.
All uploaded audio objects passed byte-range, full-content MD5/ETag, MIME and
CORS checks. On the live site, Chromium requests no audio before playback,
plays Black Glass from assets.crashthestack.com, seeks near its end and advances
to Cold Boot. The page remains cross-origin isolated and anonymous CORS audio
works. Browser checks are muted; they do not replace listening review.

Existing clients controlled by the old game worker may need to open the game
and accept its normal update before /soundtrack/ reaches the new route. No
forced activation or clearing of game storage was introduced.

Publication manifests, logs, scripts and raw HTTP verification are external in
publication-mp3-i/, publication-r2-i/ and r2-preview-i/. The publisher safeguard
and route change are committed on feat/codex-album; the coordinator must merge
them before the next game deployment to retain the soundtrack page.

## Cover and music license

David requested a square cover based on the actual title screen and 8-bit Flux
Harmonic logo, replacing the large introductory text. Cover I is recorded in
art/ARTWORK.md with the input hashes, exact prompt and built-in image-generation
provenance. The delivered image is 1254x1254 PNG; it is kept in Git and served
from assets.crashthestack.com/soundtrack/art/cover-i.png. The page uses an
accessible hidden heading, image description and compact runtime line.

David also requested a CC-BY music notice. The footer links CC BY 4.0 and credits
David Wilson, as explicitly selected by David. Flux Harmonic remains the cover
publisher mark.
MUSIC-LICENSE.md records its scope; existing software, art and logo terms are
unchanged. CC BY allows sharing and adaptation with attribution, a license link
and change notices. The notice is on the page; existing immutable MP3 objects
are not retagged or re-encoded.

Cover/license publication completed at https://73d56ef3.crashthestack.pages.dev
(source 2895ebb). The live page now uses the cover and explicitly credits
**David Wilson** for the CC BY 4.0 music. The cover was opened in swayimg at
David's request. It decoded successfully from R2 in the browser; the 390px
phone viewport had no horizontal overflow and retained all fifteen tracks.
Final HTTP/hash checks verified the cover, HTML, CSS, player, album manifest,
game page, tracker page and worker. The final attribution was verified in the
served HTML; the shared browser restarted during the final screenshot attempt.
Public verification and deployment logs are in the external
publication-cover-license-ii/ directory. Audio objects and the game remain intact.

## Phone metadata

David requested artist **Crash The Stack**, individual song titles, embedded
cover artwork and automated MP3 production. David Wilson remains the CC BY
attribution name; artist and attribution are distinct fields. Both new exports
and existing-file retagging use the shared Sigil metadata module.

All fifteen existing MP3s were stream-copied to tagged-preview-i/soundtrack/.
Checks confirm each title, artist, album artist, album, track number, attribution
and attached picture, with identical decoded PCM before/after. The fresh
WAV-to-MP3 pipeline was also exercised on Black Glass and passed its automatic
metadata, artwork, format and duration checks. ID3v2.3 is used; no ID3v1 footer.
R2 publication uses soundtrack/preview-i-tagged/ to avoid old immutable caches.
The page supplies the same artist and cover through the Media Session API.

Tagged publication completed at https://e0a59eea.crashthestack.pages.dev
(source c797d75). All fifteen public MP3 objects passed byte-range, length,
content type, CORS and ETag checks against the local tagged files. Results are
in the external r2-tagged-i/public-verification.json; deployment records are in
publication-tagged-i/. The existing game, tracker and worker were preserved.

The live browser successfully played the tagged Black Glass MP3. Media Session
reported Black Glass, artist Crash The Stack, the album title and cover artwork;
the page retained all fifteen tracks. Playback was muted and paused after this
functional check; physical phone player behavior has not been tested.
New object URLs bypass old immutable audio caches. Reload the page and select a
track to use them; previously downloaded files must be downloaded again.

## Artist credit and compact cover revision

David approved artist/album artist **David Wilson** and album title
**Crash The Stack - Original Soundtrack**. Both export paths now derive an
800 x 800 JPEG from Cover I for embedding (196,330 bytes at FFmpeg quality 5),
retaining the full original PNG for the website and archival artwork. The
shared metadata validator checks the JPEG codec, dimensions and attached-picture
flag as well as titles, numbering, artist, album and license fields.

The revised local bundle is tagged-preview-ii/soundtrack/audio/. Existing
versions are retained. Public assets use soundtrack/preview-ii-tagged/ so
listeners receive the revised metadata after reloading the player. The album
notes now record the artist credit and AI-assisted production process.

Revision II is live at https://dff6aa97.crashthestack.pages.dev (source 2e935c2).
All fifteen public objects passed checksum, range, MIME and CORS checks. All
fifteen local MP3s retain identical decoded audio, with a total size reduction
of 39,719,295 bytes. A complete fresh Black Glass export also passed validation.
Live browser playback confirmed artist David Wilson, the selected album title,
the new audio URL and fifteen tracks. The browser check was muted and does not
claim physical phone testing. Publication logs and verification are retained
in publication-tagged-ii/ and r2-tagged-ii/ outside the repository.

## Obsidian album II and restored page routing

David approved Tension V's added activity for the album on 2026-09-22. The full
4:05.714 track now carries it from 1:54.286 to 3:25.714. Only its MP3 URL changes;
the other fourteen public audio objects remain the accepted tagged revision.
The complete new local MP3 set is tagged-preview-iii/soundtrack/audio/.

Production had advanced to 47c7fbb1 (game 08d3fb9). Its soundtrack HTML route
returned the game page, although player.js, CSS and the album manifest were
still available. Fetching index.html followed Pages' redirect to that fallback;
HTTP 200 was insufficient to validate it. The first Obsidian publication
76f82193 preserved that broken HTML, which the browser check caught. The final
stage restores the repository's album HTML and worker bypass using version
08d3fb9bfd4a-album-ii, preserving the current game and tracker binaries.

The publisher now refuses an HTML bundle without the album audio element and
a built worker without the soundtrack bypass, so stale build output fails
before deployment. Existing controlled clients can accept the normal game
update; no forced worker activation or game-storage clearing is introduced.

The corrected publication is https://a5f3c5c1.crashthestack.pages.dev, source
6b43936. A fresh browser context loaded the real soundtrack player and played
Obsidian Index from soundtrack/obsidian-album-ii/ with David Wilson and the
correct album metadata; all fifteen tracks were present. The check was muted
and paused afterward. R2 checksum, MIME, range and CORS verification passed.
Final deployment records are in publication-obsidian-ii/deployment-restored.txt;
its publication.json records preserved game hashes and the worker restoration.

## Native download control

David requested hiding the player's download button. The native audio element
now uses controlslist="nodownload". Supporting browsers hide that control while
retaining native playback, seeking and volume. This is a presentation choice:
the MP3 stream URLs remain accessible. No context-menu blocking is added.

Published at https://eb656662.crashthestack.pages.dev (source 9d1930d).
Live Chromium verification confirms native controls remain enabled,
controlsList contains nodownload, the browser supports that token, and playback
still advances with all fifteen tracks present. This functional check was muted.
The single-HTML-change staging and deployment record are external in
publication-player-controls-i/.
