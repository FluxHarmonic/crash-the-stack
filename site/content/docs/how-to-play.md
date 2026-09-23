---
title: How to play
summary: The rules of STACK and DEFRAG, the trace, and the controls on a keyboard and a phone.
---
# How to play

[JACK IN](/jack-in/) opens the game in your browser. On a phone, the browser's own menu offers to install it; installed, it runs fullscreen. Saves live in the browser; there is no account.

## The menu

JACK IN starts a run: the layers of Gibson's defenses, each guarded by a board you clear to get through. FREE PLAY gives you either game on its own. Pick STACK or DEFRAG and the game's screen offers NEW BOARD, DAILY BOARD (the same layout for everyone that day) and VERSION, which is HACKER (the trace on) or CLASSIC (the plain game) and is remembered for that game. Under the games sit ENTER CODE, where a share code goes in, and HIGH SCORES. Every board has a share code in its pause menu (Escape, or the MENU button): send it to a friend and they get the exact layout you played.

## STACK

STACK is Mahjongg solitaire. Match free tiles in pairs until the layout is gone. A tile is free when nothing sits on top of it and at least one of its long sides is open. The daemon faces are the flowers and seasons: any two daemons match each other, and a daemon never matches a suit face. Every layout is generated solvable from its seed.

With the trace on, the clock runs: three minutes until you are traced, then the counter-hacks begin (a lock on a pair, a forced shuffle, scrambled faces) while a second clock counts down, and at zero the connection is severed. A strong lock cannot be broken; it weakens after 45 seconds, or the moment it blocks your last legal match, and one tap breaks a weak one. Play the classic version and none of that happens: GNOME's rules, no fail state.

Tools sit in the corner stack (the wrench): a hint rings a free tile, a shuffle rearranges what is left, and each one charges the trace.

## DEFRAG

DEFRAG is Klondike. Packets instead of cards: four subsystems (PWR and TX are hot, MEM and DSK are cold), ranks from BOOT at the bottom through DAEMON and SYSOP to ROOT at the top. Build down the table alternating hot and cold; build the four foundations up from BOOT; PULL from the feed one or three at a time (a setting); ROLLBACK undoes a move. PROBE shows the next move of a winning line from where you are, and refuses when there is none. Scoring is BOUNTY (Vegas) or AUDIT (standard), a setting.

## Controls

Tap or click a tile or a packet to select it, tap its match to play. On a keyboard, every uncovered tile wears a one- or two-letter tag: type the tag to pick that tile (Tab hides and shows the tags; shift+Tab switches to a cursor you move with the arrow keys). Space opens the tool stack and each tool has its key; `?` shows the keys line; Escape opens the pause menu, which holds the clock. The main menu is the arrow keys and Enter, or a tap.

## Settings

Music, sound effects and volume; SCANLINES and VEIL, the two screen effects; BACKGROUND, the living field behind the board (LIVE picks a rule per deal, STILL is a calm gradient). The card table's own settings, PULL and SCORING, are in its pause menu under GAME SETTINGS.
