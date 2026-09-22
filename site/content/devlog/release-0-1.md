---
title: Release 0.1
date: 2026-09-22T13:00:00Z
summary: Two games, a hub, a soundtrack you can open in the tracker, and the source. What's in the first release and what comes next.
---
# Release 0.1

Six days after the brief, here's the first release. You can play it at [crashthestack.com/jack-in/](/jack-in/), free, in the browser, on a phone or a desktop, and the source is public at [github.com/FluxHarmonic/crash-the-stack](https://github.com/FluxHarmonic/crash-the-stack).

## What's in it

**STACK** is Mahjongg solitaire under a trace. The layout is our own, generated solvable, with 36 faces in four subsystems and eight daemon wildcards. Play it clean with GNOME's no-fail rule, or with the trace on: five minutes until you're traced, then the counter-hacks (locks, a forced shuffle, scrambled faces) until the connection is severed. A hint mode lights the pairs you can play; a cursor is there if you'd rather.

**DEFRAG** is Klondike as a memory dump: packets, four subsystems, BOOT to ROOT, PULL and COMMIT and ROLLBACK, and a PROBE that shows the next move of a winning line from where you are, and refuses when there isn't one. Draw one or three, Vegas or standard scoring.

**JACK IN** is the run: the layers of Gibson's defenses, a hub between them, and the boards as the hacks. **FREE PLAY** is just the games. There's a **daily** board of each kind, the same for everyone that day, and a **share code** on every board so you can send a friend the exact layout you just cleared or didn't.

The background is a cellular field that runs on the GPU: a Gray-Scott reaction and six other rules, one picked per deal by the board's seed, so no two boards sit on the same surface. My first read of it on the phone was "looks great but it's killing the CPU," and the fix was to move all of it to the GPU rather than to make it smaller. I love the way it looks and I wasn't willing to give that up.

The **soundtrack** is three tunes, *Spy*, *Groove* and *Breaker*, written in the game's own tracker over a four-operator FM synth I had built for it, because the two-operator one sounded primitive next to the sound I had in my head. The tracker ships in the game: open it at [/tracker/](/tracker/), load a tune, change a note, and hear it at the next tick. The [manual](/docs/tracker/) is on this site. Make your own tune and share it as a link; there's no file to save on the web.

Settings, a scoreboard, a credits crawl, and a pause menu that holds the clock. The whole thing installs as an app from the browser's menu and plays offline.

## What isn't

Two solitaire games and a hub are the proof that this is one game and not a bundle. More modes are content, and they come as drops: SCAN first (Minesweeper with a hacking angle), then PATCH (rotate the circuits), CHECKSUM (Pyramid over DEFRAG's packets) and INTERCEPT (the rhythm game, catching data on the wire). The overworld's stealth layer, the difficulty tiers and Gibson's own lines grow with those.

Desktop builds for Linux and Windows are built with every release and attached to it on GitHub. They're not for sale anywhere yet; the web version is the whole game.

## How it was made

I designed this game and I direct every part of how it's built. AI agents write most of the code from my direction; I review all of it, I play every build, and I decide what stays. The design, the art direction and the opinions are mine. If that's a dealbreaker for you, I understand! The source and the commit history are public, so you can see exactly how it was made.

The [About page](/about/) has the licences (GPL code, CC-BY art and audio) and the rest. The earlier posts here are the story of how it got to this point. Thanks for playing.
