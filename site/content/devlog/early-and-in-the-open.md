---
title: Early, and in the open
date: 2026-09-23T13:00:00Z
summary: What Crash The Stack is right now, how to play it, and what to expect from a game being built in public.
---
# Early, and in the open

If you got here from a search, a friend's link, or social media, here's what you've found.

Crash The Stack is a collection of cyberpunk takes on classic casual games, and it's early. Two games are in: STACK, which is Mahjongg solitaire under a trace, and DEFRAG, which is Klondike as a memory dump. The hub between them is where the runs happen. More modes are on the way, and I'm building the whole thing in public, with every commit in the [source](https://github.com/FluxHarmonic/crash-the-stack) and the reasoning in this devlog.

## How to play

[JACK IN](/jack-in/) opens the game in your browser. On a phone, the browser's own menu will offer to install it; do that and it runs fullscreen. There's no account and there are no ads.

JACK IN from the menu is the run itself. You walk a sector of Gibson's system, and the world moves on the beat of the music: one step a beat, whether or not you touch anything, and the daemons patrol on the same clock. The framed tiles are nodes. Stand on one, press Enter, and it opens a board: STACK on the odd layers, DEFRAG on the even ones. Clear it and the node crashes, which pays its bounty in credits and hands you its key; you come back to the sector standing where you left. Enough keys open the way down, and there are six layers, each wider and busier than the last. The bar at the bottom left is the trace, and it fills while you stand there thinking.

STACK: match free tiles in pairs. A tile is free when nothing sits on top of it and at least one of its long sides is open. If you know Mahjongg solitaire, that's the rule and there's no other. Play it clean, the way GNOME plays it, or with the trace on: three minutes until you're traced, then the counter-hacks come (locks, a forced shuffle, scrambled faces) while a forty second countdown runs to the severed connection. A hint mode lights the pairs you can play; a cursor is there if you'd rather use the keyboard.

DEFRAG: it's Klondike. Build down the table alternating hot and cold, build the four foundations up from BOOT to ROOT, PULL from the feed one or three at a time. PROBE shows you the next move of a winning line from where you are, and refuses when there isn't one.

FREE PLAY gives you either game on its own. Pick STACK or DEFRAG and you get a new board, that day's daily (the same layout for everyone), and the version to play it in: HACKER with the trace, or CLASSIC without. Every board has a share code, so you can send someone the exact layout you just played.

## What to expect

It's a 0.1. The classics' rules are the settled part: a free tile is a free tile, and Klondike builds the way Klondike builds. Everything I've put around them is still moving, and some of it has moved already: the trace numbers came down twice in the first week. Expect more of that, plus new modes as drops (SCAN, a Minesweeper with a hacking angle, is first), the sector growing past its six layers, and Gibson getting more to say. When something you saved stops working across a version, that's a bug, and I'd like to hear about it.

The music is twenty tunes written in the game's own tracker, and you can hear the album on the [soundtrack page](/soundtrack/). The tracker is part of the game and has its own page at [/tracker/](/tracker/): load a tune, change a note, and hear it at the next tick. The [manual](/docs/tracker/) is here on the site.

## How it was made

I designed this game and I direct every part of how it's built. AI agents write most of the code from my direction; I direct every decision, I play every build, I review the art and the music, and I decide what stays. The design, the art direction and the opinions are mine. If the use of AI is dealbreaker for you, I understand! The source and the commit history are public, so you can see exactly how it was made.

The [About page](/about/) has the licences and the rest, and the earlier posts here tell the story of how it got to this point, starting with the version I wrote by hand in 2020. Thanks for playing.
