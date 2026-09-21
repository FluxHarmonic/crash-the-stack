# P4c captures (2026-09-21, native under Xvfb, 1280x800)

The credits crawl mid-crawl and the pause panel over a JACK IN stack, at
two panel translucencies, for David's pick. The panel is a C-BG fill at
PANEL-ALPHA with a 1 px C-BAR-C frame drawn as lines over it (the first
cut drew the frame as a filled rect under the fill, which is why nothing
showed through).

- `credits-alpha-055.png`, `pause-alpha-055.png`: PANEL-ALPHA 0.55 (what ships at this commit).
- `credits-alpha-065.png`, `pause-alpha-065.png`: PANEL-ALPHA 0.65.

Probed pixels (menu = the bare backdrop at the same spot; the box at 0.55):
(640,300) menu (39,24,65) -> box (24,15,42); (500,200) menu (20,15,39) ->
box (14,11,30); the pause panel over a tile (36,37,48) -> (22,21,34).
