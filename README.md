# Crash The Stack

Cyberpunk takes on the classic casual games. STACK is Mahjongg solitaire
under a trace; DEFRAG is Klondike as a memory dump; the hub ties the runs
together. Written in [Sigil](https://usesigil.org) for the desktop and the
web from one codebase.

**Play:** [crashthestack.com/jack-in/](https://crashthestack.com/jack-in/),
free, in the browser; it installs as an app from the browser's menu.
The site has the [About page](https://crashthestack.com/about/), the
[devlog](https://crashthestack.com/devlog/), the
[soundtrack](https://crashthestack.com/soundtrack/) and the
[docs](https://crashthestack.com/docs/) (how to play, the tracker manual).

## How it was made

I designed this game and I direct every part of how it's built. AI agents write most of the code from my direction; I direct every decision, I play every build, I review the art and the music, and I decide what stays. The design, the art direction and the opinions are mine. If the use of AI is dealbreaker for you, I understand! The source and the commit history are public, so you can see exactly how it was made.

## Building it

The build needs the Sigil toolchain the repo pins (`package.sgl`'s `sigil:`
floor; `sigil cli use` picks it) and, for the native build, the C
libraries `manifest.scm` lists; `scripts/dev` runs a command inside that
environment through Guix.

    scripts/dev sigil deps install                 the dependencies, from sigil.lock
    scripts/dev sigil build                        the native dev build -> build/dev/bin/crash-the-stack
    scripts/dev sigil build --config release       the native release build (native codegen)
    scripts/dev sigil build --config windows-amd64 the Windows build, cross-compiled through zig
                                                   -> build/windows-amd64/bin/crash-the-stack.exe (docs/windows/)
    guix shell binaryen -- sigil build --config web  the browser build -> build/web

Run the native build with `scripts/dev build/dev/bin/crash-the-stack`;
`--stack`, `--cards`, `--seed N`, `--fresh` and the other doors are listed
at the top of `src/crash/shell/native.sgl`. The web build is served by
`scripts/serve-web` (a local host) and deployed by `scripts/publish-web`,
which stages the site under `site/` with the game at `/jack-in/`
(`scripts/stage-web`).

The tests: `scripts/dev sigil test` runs the suite; the browser arms are
`verify.mjs`, `verify-cards.mjs`, `verify-field.mjs`, `verify-guard.mjs`
and `verify-site.mjs` (Node and a headless Chrome), and
`scripts/verify-field-native` drives the release binary on an X server.

## The tracker

The soundtrack was written in the game's own tracker over the
[motif](https://codeberg.org/sigil/motif) synth engine, and the tracker
ships in the game:

    crash-the-stack --tracker                      a blank tune
    crash-the-stack --tune assets/tunes/spy.cts    a shipped tune

On the web it is [/tracker/](https://crashthestack.com/tracker/), its own
page beside the game. `docs/tracker.md` is the manual.

## The site

`site/` is the crashthestack.com site, built with
[Press](https://codeberg.org/sigil/press): `cd site && sigil deps install &&
sigil run -- build` writes `site/public/`.

## Licences

The code is GPL-3.0-or-later (`LICENSE`). The art, the audio and the
content are CC-BY-4.0 (`assets/LICENSE`), credit David Wilson / Flux
Harmonic, except the reserved marks in `assets/RESERVED.md`: the name,
the logo and the title art. Every asset's origin is in `assets/MANIFEST`.
The third-party notices are in `NOTICE`; the credits are `assets/credits.txt`
(the CREDITS crawl in the game).

Issues and discussion are welcome; see `CONTRIBUTING.md`.
