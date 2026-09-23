---
title: Three tries at the same game
date: 2026-09-16T10:00:00Z
summary: Crash The Stack in 2020, again in 2022, a cousin in 2023, and why the fourth try is the one that shipped.
---
# Three tries at the same game

I've wanted to make a cyberpunk Mahjongg solitaire for a long time. Long enough that I've written it three different times.

The first *Crash The Stack* was in May 2020, in Gambit Scheme on Substratic, an engine I was building at the time. Sixty-four commits, all written by hand. It had a complete Mahjongg core in about 480 lines: the occlusion map, the "is this tile free" rule, matching, the shuffle, and a layout format where I'd transcribed the GNOME Turtle by hand, all 144 tiles. It had a stack editor with vim keys and a title screen that said "Flux Harmonic Presents / A game by David Wilson." It never had a hint, a timer, a score, a win screen, or a single cyberpunk mechanic. The source is still up on GitHub under `substratic/crash-the-stack`.

The second try was March 2022, in Mesche, the Scheme-derived language I wrote before Sigil. Forty-four commits, and thirty of them were purely engine work, a lot of it written on Flux Harmonic streams. It rendered twenty tiles from a faces atlas, and the playability check was a stub. The engine work ate the game.

The third was a cousin: *Cybersol*, October 2023, for the Autumn Lisp Game Jam, written in Guile Hoot. Twenty-four commits in eight days. A working Klondike in 437 lines, keyboard-only so it would feel like a hacker game (asdf and jkl for the piles), SVG card art I drew myself and have since called "pretty awful." The TODO list ended with "implement new game mechanics to introduce the cyberpunk theme." I never started that task.

Here's the pattern I only saw when I lined them up: every time, the classic's core rule was working in under 500 lines, and every time the project stalled at the platform step. The engine, the build, the web export. The game was never the hard part. Getting it in front of someone was.

By this year that had changed. Sigil, the successor to Mesche, had grown a graphics library, a web build and audio tools, and two other projects had proven them: a rhythm game and a small Sokoban called blackICE that I'd mostly let an AI agent build as a test of the web bridge. blackICE taught me something too, mostly by being the thing I didn't want: it was a one-shot project, I had almost no input on it, and it plays like that. But its rules module (a grid, daemons on routes, a trace timer, undo) turned out to be the skeleton of the overworld, the part of this game I've wanted for six years and never built.

So in September I started the fourth try, and this time the platform was the solved part, after ten months of Sigil. The twists on the classic game mechanics were the next thing to build. That's the whole reason this project exists now, and the reason it's the one you can play.

The next post is about the plan, and about the first decision I reversed on myself before any code existed.
