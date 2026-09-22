---
title: Early, and in the open
date: 2026-09-22T13:00:00Z
summary: What Crash The Stack is right now, how to play it, and what to expect from a game being built in public.
---
# Early, and in the open

If you got here from a search, a friend's link, or the tracker, here's what you've found.

Crash The Stack is a collection of cyberpunk takes on the classic solitaire games, and it's early. Two games are in: STACK, which is Mahjongg solitaire under a trace, and DEFRAG, which is Klondike as a memory dump. The hub between them is where the runs happen. More modes are on the way, and I'm building the whole thing in public, with every commit in the [source](https://github.com/FluxHarmonic/crash-the-stack) and the reasoning in this devlog.

## How to play

[JACK IN](/jack-in/) opens the game in your browser. On a phone, the browser's own menu will offer to install it; do that and it runs fullscreen. There's no account and there are no ads.

STACK: match free tiles in pairs. A tile is free when nothing sits on top of it and at least one of its long sides is open. If you know Mahjongg solitaire, that's the rule and there's no other. Play it clean, the way GNOME plays it, or with the trace on: five minutes until you're traced, then the counter-hacks come (locks, a forced shuffle, scrambled faces) until the connection is severed. A hint mode lights the pairs you can play; a cursor is there if you'd rather use the keyboard.

DEFRAG: it's Klondike. Build down the table alternating hot and cold, build the four foundations up from BOOT to ROOT, PULL from the feed one or three at a time. PROBE shows you the next move of a winning line from where you are, and refuses when there isn't one.

FREE PLAY gives you either game on its own, in the hacker version or the classic one. There's a daily board of each kind, the same for everyone that day, and every board has a share code so you can send someone the exact layout you just played.

## What to expect

It's a 0.1. The rules are done and won't change; the classics are sacred here. Around them, things will keep moving: new modes as drops (SCAN, a Minesweeper with a hacking angle, is first), the overworld growing out of the hub, and Gibson getting more to say. When something you saved stops working across a version, that's a bug, and I'd like to hear about it.

The music is three tunes written in the game's own tracker. The tracker ships in the game: open it at [/tracker/](/tracker/), load a tune, change a note, and hear it at the next tick. The [manual](/docs/tracker/) is here on the site.

## How it was made

I designed this game and I direct every part of how it's built. AI agents write most of the code from my direction; I review all of it, I play every build, and I decide what stays. The design, the art direction and the opinions are mine. If the use of AI is dealbreaker for you, I understand! The source and the commit history are public, so you can see exactly how it was made.

The [About page](/about/) has the licences and the rest, and the earlier posts here tell the story of how it got to this point, starting with the version I wrote by hand in 2020. Thanks for playing.
