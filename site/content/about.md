---
title: About
summary: What Crash The Stack is, how it was made, and what you can do with it.
---
# About

Crash The Stack is a collection of cyberpunk takes on the classic casual games, and it's early: a 0.1, built in the open. You play a hacker named Crash; the games are the hacks. STACK is Mahjongg solitaire with a trace running: clear the layout before the counter-hack finds you and severs the connection. DEFRAG is Klondike without the playing cards: PWR, TX, MEM and DSK instead of suits, BOOT to ROOT instead of ace to king, and the same rules underneath. The overworld hub ties the runs together into one game.

It is free to play in the browser at [/jack-in/](/jack-in/), and it installs as an app on a phone from the browser's own menu. Desktop builds for Linux and Windows are ready but they are not available for sale yet. The [News](/news/) posts cover each release. What the game is right now, and what to expect while it grows, is below.

## The classics are sacred

Every mode keeps its classic's core rules exactly. If you know Mahjongg solitaire, you know STACK: a free tile has a free side and nothing on top, and you match pairs. If you know Klondike, you know DEFRAG: alternate hot and cold, build down, four foundations up. What the theme adds sits around the rules, never inside them: the trace, the locks, the daemons, the run.

## How it was made

I designed this game and I direct every part of how it's built. AI agents write most of the code from my direction; I direct every decision, I play every build, I review the art and the music, and I decide what stays. The design, the art direction and the opinions are mine. If the use of AI is dealbreaker for you, I understand! The source and the commit history are public, so you can see exactly how it was made.

The game is written in [Sigil](https://usesigil.org), my own Scheme, for the desktop and the web from one codebase. The History section below tells the story from the first version in 2020 to this one.

## The soundtrack

The game has a full soundtrack: twenty tunes in the source under `assets/tunes/`, and you can hear the album on the [soundtrack page](/soundtrack/). They were written in the game's own tracker, a FastTracker II-style editor over the [motif](https://codeberg.org/sigil/motif) synth engine. The tracker is part of the game for now (a standalone release comes later): open it at [/tracker/](/tracker/) in the browser, or with `--tracker` natively, and the [tracker manual](/docs/tracker/) explains the screen and the keys.

## History

I've wanted to make a cyberpunk Mahjongg solitaire for a long time. Long enough that I wrote it three times before this one.

The first was May 2020, in Gambit Scheme on [Substratic](https://github.com/substratic/engine), an engine I was building at the time. Sixty-four commits, all by hand. It had a complete Mahjongg core in about 480 lines: the occlusion map, the "is this tile free" rule, matching, the shuffle, and a layout format where I'd transcribed the GNOME Turtle by hand, all 144 tiles. It had a stack editor with vim keys and a title screen that said "Flux Harmonic Presents / A game by David Wilson." It never had a hint, a timer, a score, a win screen, or a single cyberpunk mechanic. The source is still up [on GitHub](https://github.com/substratic/crash-the-stack).

The second was March 2022, in [Mesche](https://codeberg.org/mesche/mesche), the Scheme-derived language I wrote before Sigil. Forty-four commits, thirty of them purely engine work, a lot of it written on Flux Harmonic streams. It rendered twenty tiles from a faces atlas and the playability check was a stub. The engine work ate the game.

The third was a cousin: [*Cybersol*](https://codeberg.org/FluxHarmonic/algj2023-cybersol), October 2023, for the Autumn Lisp Game Jam, in Guile Hoot. Twenty-four commits in eight days, a working Klondike in 437 lines, keyboard-only so it would feel like a hacker game, and SVG card art I drew myself and have since called "pretty awful." The TODO list ended with "implement new game mechanics to introduce the cyberpunk theme." I never started that task.

Here's the pattern I only saw when I lined them up: every time, the classic's core rule was working in under 500 lines, and every time the project stalled at the platform step. The engine, the build, the web export. The game was never the hard part. Getting it in front of someone was.

By September 2026 that had changed, after ten months of [Sigil](https://usesigil.org). So I started the fourth try, and this time the platform was the solved part.

### Three decisions on the first morning

The brief I wrote on September 16th was short, and I asked an agent to write a design document and stop there. No code. The first draft came back with a collection of modes and a lot of sensible defaults. I read it with about forty inline comments, and my own thinking shifted while I was reading. Three of those comments changed the shape of the game.

The first was the name. Crash The Stack stays. It's a nod to my favorite movie, *Hackers*, and I want the whole thing to draw on that.

The second was the shape. Where the draft had a "collection with modes," I asked: what if the collection was the overworld, the thing that ties everything together, and the stack games were the actual hacking mechanics? You're a hacker. The games are the hacks. That one sentence turned a bundle into a game, and everything since has been built on it.

The third was about me. I'd written this rules code three times already, and writing it a fourth time by hand was exactly the slog that killed the first three tries. So I chose not to. The agents type; I direct.

### The trace has phases

The first build with a trace meter did almost nothing with it. I filled the meter, it told me a pair was locked and drew the two tiles red, and then I picked the pair anyway and kept playing. If that had been the last possible pair, the game should have ended. Instead nothing happened at all, and I sent that note back: being traced has to mean something, and it has to be clear what.

What came back was a cycling bar with escalating locks. I overruled it the same day, because I already knew what I wanted the trace to be: phases. TRACE, COUNTER-HACK, SEVERED. The twist mode gained a fail state that day; the clean mode keeps GNOME's rule.

Locks came out of playing the installed app on my phone a few hours later. Should a lock be breakable? Only if the locked pair is the last one; then it's a weak lock and one tap breaks it. Strong locks are unbreakable, and a strong lock decays into a weak one after 45 seconds, or the moment it blocks your last legal match. That's the whole system, and I like how small it is.

### Klondike without playing cards

DEFRAG started as a question: is there any way to make this feel like Klondike but more cyberpunk? What if we weren't talking about cards, or at least not in the playing-card sense?

The answer was a memory dump. Packets instead of cards. Hot and cold instead of red and black. Four subsystems instead of four suits: PWR, TX, MEM, DSK. BOOT at the bottom of a run and ROOT at the top, with DAEMON and SYSOP where the jack and queen would be. You PULL from the feed, COMMIT to the foundations, ROLLBACK a move, PROBE for a hint. Clear the table and the system comes back online. I loved that reading the moment I saw it, and after playing it on the phone the only change was the colors: hot is orange, cold is blue.

## Licenses

The code is GPL-3.0-or-later: run it, study it, share it, change it; what you ship stays under the same license. The art, the audio and the content are CC-BY-4.0: reuse them with credit to David Wilson / Flux Harmonic. Three things are reserved and not licensed for reuse: the name Crash The Stack, the logo, and the title art. Every asset's origin is recorded in `assets/MANIFEST` in the source, and the third-party notices are in `NOTICE`.

## Where it lives

- The game: [crashthestack.com/jack-in/](/jack-in/)
- The source: [github.com/FluxHarmonic/crash-the-stack](https://github.com/FluxHarmonic/crash-the-stack)
- The news: [/news/](/news/), with [RSS](/news/feed.xml) and [JSON Feed](/news/feed.json)
- The soundtrack: [/soundtrack/](/soundtrack/)
- The docs: [/docs/](/docs/)
- Me: [fluxharmonic.com](https://fluxharmonic.com)
