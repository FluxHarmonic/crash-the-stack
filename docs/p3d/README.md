# P3d: the title, candidates for David's read

Ruling D38. Everything here came through `scripts/art/`: the logo with no
image generation at any step (`assets/src/title/blocky.txt` is the
alphabet, drawn by hand in text; `scripts/art/ansi` lays a spec out on
the 80x50 cell grid), the backdrop with generation as step one
(`scripts/art/gen title`, then `scripts/art/dither`).

## What to decide

1. **Alphabet and style**: `candidates-logo.png` (the nine below, one
   sheet). Upright or slanted; which color scheme; which shadow.
2. **Layout**: two lines (CRASH / THE STACK, 14 rows, fits over the menu)
   or three (CRASH / THE / STACK, 21 rows: the menu would move down or the
   logo scroll off). One line does not fit 80 columns at this letter size.
3. **Dither**: `candidates-backdrop.png` (twelve: two raws x three
   methods x two palette subsets). The game shipped `backdrop-hero-o4x4-a`
   first; `backdrop-hero-o8x8-b` since the read.
4. **Glitch level**: `reveal-seed7.gif` (sixteen frames of seed 7 at 1200
   baud, then the settled frame) and `reveal-strip.png`. The plan has
   three to five glitches a boot: a wrong character that corrects itself,
   a row in swapped colors that snaps, a row drawn shifted that settles,
   noise in a row's shadow, one letter inverted. More, fewer, longer?
   `?seed=N` reproduces a boot, `?baud=N` sets the pace (4800 default now:
   480 cells a second, about 1.5 seconds for the 737 cells).

## The logo candidates (`logo-*.png`, specs in `assets/src/title/candidates/`)

| file | what |
|---|---|
| `logo-hero.png` | the bible's hero colors: the ramp down from selection cyan to highlight magenta, shadow ▒ in the darkest bar tone (as built) |
| `logo-hero-slant.png` | the same, slanted, shadow ▓ in the static dark |
| `logo-split.png` | the two-tone split, cyan over magenta, no ramp |
| `logo-hot.png` | ICE orange down to trace red, slanted |
| `logo-cold.png` | the ramp up from the cold blue to the HUD text white |
| `logo-gibson.png` | Gibson's violet down to highlight magenta, slanted, shadow ░ |
| `logo-daemon.png` | daemon white down to selection cyan |
| `logo-left.png` | left-aligned, no shadow: the plainest cut |
| `logo-three-lines.png` | CRASH / THE / STACK |

Every one is four palette colors or fewer on the ground. A new candidate
is a spec file and one command: `scripts/art/ansi SPEC --png-only OUT`.

## The backdrop candidates (`backdrop-*.png`, 320x200)

Two references from `scripts/art/gen title`: `hero` is the bible's
section 7 hero prompt as written (flat pixel art); `tonal` asks for
smooth shading so the dither has tones to work with. Three methods:
Bayer 4x4 and 8x8 (ordered: the flat demoscene look) and Floyd-Steinberg
(the photographic look). Two palette subsets: `a` is twelve roles with
the hot orange and ICE amber, `b` eight cool roles. Every output passed
the color gate at its allowance. The raws stay under `assets/refs/title/`
(provenance, never shipped); the hero pieces are reserved, not CC-BY, and
David may hand-touch the chosen one in Nano Banana afterwards.

## In the game

`title-settled-seed7.png`: the menu with the logo over the backdrop.
`title-mid-reveal-seed7.png`: mid-reveal. The reveal plays once per boot,
only when the process opens on the menu; a tap or key skips it. The
backdrop lands about two seconds after boot on the web (the shell holds
every texture fetch until the service worker has activated), so the
first frames of the reveal are over the copper bars.

## After the first read (2026-09-19, the same day)

Ruled and built: the hero ramp colors and the slant, the backdrop
`backdrop-hero-o8x8-b`, default baud 4800, the glitch level up, and D39
(the menu without boxes).

- **The slant is live.** The logo is stored upright and sheared per row
  when drawn (`title-shear`, `title-row-shear` in `(crash title)`): the
  modem draws it upright, and when the last glitch resolves it slams into
  the slant over 20 ticks with an out-back ease. Two more uses are a line
  each if wanted: a slow idle sway on the menu, or the slant growing down
  the logo as the cursor passes each row (Session Log S2).
- **Glitch levels** `?glitch=0..3`, default 2: five to seven a boot with
  beats of 0.4 to 0.8 s and the first always a whole-row one (a row in
  swapped colors or shifted 1 to 3 cells); level 3 is nine to twelve with
  two whole-row ones; level 1 the first cut's two or three short ones.
  `reveal-seed7-level2.gif` shows seed 7 at level 2 and 2400 baud (half
  the default pace, so the glitches can be seen frame by frame).
- **D39.** `title-menu-d39.png`: the tower shows under the logo; the items
  are plain text over a one-cell C-BG shadow, the selected one in the
  ramp with a block cursor at its left blinking with the reveal's cursor.

## The second read (2026-09-19, later)

- **Slant**: it snapped to the character grid before (a whole-cell stair,
  one cell per two rows). Now row r of a letter line sits slant × (5 − r)
  cells right, resolved to whole pixels; default 0.25 cells a row (half
  the old angle), `?slant=N` to compare (`0.5` is the old angle, smooth;
  `0` upright).
- **Backdrop**: `backdrop-hero-o8x8-a` (the label sits below its image on
  the sheet; the pick was the one above the `-b` label).
- **D40, the boot**: textures and the audio are readied before the menu
  is live; the reveal covers it, and if the steps outlast the reveal the
  cursor blinks on `CONNECTING n/6`. Nothing pops in after the menu is
  live. `title-menu-d40.png` (web), `title-native-d40.png` (the release
  under Xvfb).
