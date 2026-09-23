---
title: The trace has phases
date: 2026-09-22T12:00:00Z
summary: The first real play test, the counter-hack, Klondike without playing cards, and the year 2030.
---
# The trace has phases

The first build with a trace meter did almost nothing with it. I filled the meter, it told me a pair was locked and drew the two tiles red, and then I picked the pair anyway and kept playing. If that had been the last possible pair, the game should have ended. Instead nothing happened at all, and I sent that note back: being traced has to mean something, and it has to be clear what.

The proposal that came back was a cycling bar with escalating locks and a rule that the last legal match could never be locked, so Mahjongg would keep its no-fail-state feel. I overruled it the same day, because I already knew what I wanted the trace to be: phases.

The first phase is being traced. Once you're traced, you're vulnerable to counter-hacking measures. And when the *real* timer runs out, your connection gets severed. TRACE, COUNTER-HACK, SEVERED. The twist mode gained a fail state that day; the clean mode keeps GNOME's rule. The counter-hacks are a set you can add to (a lock, a forced shuffle, a scrambled face), and the numbers (five minutes to the trace, another minute to the sever) were a starting point to tune from my own clear times. They came down to three minutes and forty seconds over the next few days of playing.

Locks came out of playing the installed app on the phone a few hours later. Should a lock be breakable? Only if the locked pair is the last one; then it's a weak lock, a different color, and one tap breaks it. Strong locks are unbreakable. A strong lock decays into a weak one after 45 seconds, or the moment it blocks your last legal match. That's the whole system, and I like how small it is.

## Klondike without playing cards

DEFRAG started as a question: is there any way to make this feel like Klondike but more cyberpunk? What if we weren't talking about cards, or at least not in the playing-card sense?

The answer was a memory dump. Packets instead of cards. Hot and cold instead of red and black. Four subsystems instead of four suits: PWR, TX, MEM, DSK. BOOT at the bottom of a run and ROOT at the top, with DAEMON and SYSOP where the jack and queen would be. You PULL from the feed, COMMIT to the foundations, ROLLBACK a move, PROBE for a hint. Clear the table and the system comes back online. I loved that reading the moment I saw it, and after playing it on the phone the only change was the colors: hot is orange, cold is blue.

## 2030

The same day I wrote down what the game is actually about. It's 2030, and the rapid pace of AI self-improvement has produced a superintelligence named Gibson that now threatens to take control of human civilization. You are Crash, a member of a hacker collective on a mission to destroy Gibson. Gibson's defenses are layers, so Crash crashes the Stack. Gibson taunts you, and he's clever about it; think of how Plague talked in *Hackers*. The system speaks in flat all-caps; Gibson speaks in sentences, first person, and only once he's noticed you.

I'm aware of what it means to make a game about destroying a runaway AI in the open, with AI agents writing most of the code. I've decided to let that sit exactly where it is.

Two modes at the top level came out of this: JACK IN is the real game, with the overworld; FREE PLAY is just the games, in their classic form or the hacker one, outside the world. And a site with an About page and this devlog, so nobody who plays the fullscreen app has to miss a post. That last decision is why the game lives at `/jack-in/` and not at the root: an installed app that opens a link outside its own path opens it in the browser, the way a link should.

Next: what this is right now, and how to play it.
