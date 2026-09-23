---
title: About
summary: What Crash The Stack is, how it was made, and what you can do with it.
---
# About

Crash The Stack is a collection of cyberpunk takes on the classic casual games, and it's early: a 0.1, built in the open. You play a hacker named Crash; the games are the hacks. STACK is Mahjongg solitaire with a trace running: clear the layout before the counter-hack finds you and severs the connection. DEFRAG is Klondike without the playing cards: PWR, TX, MEM and DSK instead of suits, BOOT to ROOT instead of ace to king, and the same rules underneath. The overworld hub ties the runs together into one game.

It is free to play in the browser at [/jack-in/](/jack-in/), and it installs as an app on a phone from the browser's own menu. Desktop builds for Linux and Windows are ready but they are not available for sale yet. The devlog's [first post](/devlog/early-and-in-the-open/) says how to play and what to expect while it grows.

## The classics are sacred

Every mode keeps its classic's core rules exactly. If you know Mahjongg solitaire, you know STACK: a free tile has a free side and nothing on top, and you match pairs. If you know Klondike, you know DEFRAG: alternate hot and cold, build down, four foundations up. What the theme adds sits around the rules, never inside them: the trace, the locks, the daemons, the run.

## How it was made

I designed this game and I direct every part of how it's built. AI agents write most of the code from my direction; I direct every decision, I play every build, I review the art and the music, and I decide what stays. The design, the art direction and the opinions are mine. If the use of AI is dealbreaker for you, I understand! The source and the commit history are public, so you can see exactly how it was made.

The game is written in [Sigil](https://usesigil.org), my own Scheme, for the desktop and the web from one codebase. The [devlog](/devlog/) tells the story from the first version in 2020 to this one.

## The soundtrack

The game has a full soundtrack: twenty tunes in the source under `assets/tunes/`, and you can hear the album on the [soundtrack page](/soundtrack/). They were written in the game's own tracker, a FastTracker II-style editor over the [motif](https://codeberg.org/sigil/motif) synth engine. The tracker is part of the game for now (a standalone release comes later): open it at [/tracker/](/tracker/) in the browser, or with `--tracker` natively, and the [tracker manual](/docs/tracker/) explains the screen and the keys.

## Licences

The code is GPL-3.0-or-later: run it, study it, share it, change it; what you ship stays under the same licence. The art, the audio and the content are CC-BY-4.0: reuse them with credit to David Wilson / Flux Harmonic. Three things are reserved and not licensed for reuse: the name Crash The Stack, the logo, and the title art. Every asset's origin is recorded in `assets/MANIFEST` in the source, and the third-party notices are in `NOTICE`.

## Where it lives

- The game: [crashthestack.com/jack-in/](/jack-in/)
- The source: [github.com/FluxHarmonic/crash-the-stack](https://github.com/FluxHarmonic/crash-the-stack)
- The devlog: [/devlog/](/devlog/), with [RSS](/devlog/feed.xml) and [JSON Feed](/devlog/feed.json)
- The soundtrack: [/soundtrack/](/soundtrack/)
- The docs: [/docs/](/docs/)
- Me: [fluxharmonic.com](https://fluxharmonic.com)
