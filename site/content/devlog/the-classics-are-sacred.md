---
title: The classics are sacred
date: 2026-09-22T11:00:00Z
summary: The plan for the fourth try, what changed in the first day of comments, and why I chose to review everything instead of writing it.
---
# The classics are sacred

The brief I wrote on the morning of September 16th was short. I wanted cyberpunk Mahjongg and Solitaire, with GNOME Mahjongg and Windows Klondike as the references, maybe one game with modes, maybe a story mode, and I wanted to finally make progress now that Sigil could build the same game for the desktop and the web. I've been working with AI agents (Claude, and Codex for some of it) on Sigil itself for a while, so I asked one to write a design document and stop there. No code.

The first draft came back with a collection of modes and a lot of sensible defaults. I read it with about forty inline comments, and my own thinking shifted while I was reading. Three of those comments changed the shape of the game.

The first was the name. Crash The Stack stays. It's a nod to my favorite movie, *Hackers*, and I want the whole thing to draw on that: the theme, the visual style, the way the computers talk to you.

The second was the shape. Where the draft had a "collection with modes," I asked: what if the collection was the overworld of the game, the thing that ties everything together, and the stack games were the actual hacking mechanics? You're a hacker. The games are the hacks. That one sentence turned a bundle into a game, and everything since has been built on it.

The third was about me. I'd written this rules code three times already, and writing it a fourth time by hand was exactly the slog that killed the first three tries. So I chose not to. The agents type; I direct. I decide what the game is, I play every build, and I review all of the art and music myself. That became the rule for every phase of the project, and it's the reason the [About page](/about/) says what it says about how this was made.

## What I wouldn't change

The classics are sacred. Every mode keeps its classic's core rules exactly. If you know Mahjongg solitaire, you already know how to play STACK: a free tile has a free side and nothing on top, and you match pairs. If you know Klondike, you know DEFRAG. The theme sits around the rules, never inside them. That was true in the 2020 version and it's true now.

Some smaller rulings from the same day that I still like: tap, not drag. Keep the keyboard-first play from Cybersol alongside touch. Draw one preferred, draw three offered. Vegas scoring is fine. And a banked, costly scramble for Klondike: a way to shuffle what's left on the table when you're stuck, that has to cost something to get or to use.

## Web first, on my phone

The afternoon was the plan: phases, each with a gate the build has to pass before I look at it, and a review before anything counts as done. Two decisions from that afternoon shaped everything after.

We went web first. Not because the web is the only target (it is one of them), but because a hosted build meant I could easily test on my phone whenever I was away from the computer. Every phase since has ended with me playing it on the phone and sending notes back.

The keyboard was the one thing I refused to decide on paper. Three models for moving around a 2D tile layout: a cursor, typed coordinates, and typing the glyph on the tile you want. All three got built and I played them. Typing the glyph felt like cheating. Coordinates were too hard to scan. What survived is a hint mode that lights the pairs you can play, with a cursor as the backup. Played, not argued.

Next: the day the trace meter turned into a game.
