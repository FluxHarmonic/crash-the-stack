#!/bin/sh
# assets/src/test-tile.txt -> assets/test-tile.png (RGBA, 128x44).
# Cells scale x2. Needs gawk and ImageMagick's convert (guix: imagemagick).
set -e
cd "$(dirname "$0")"
SCALE=2
art=$(grep -v '^#' test-tile.txt | tr -d '|')
rows=$(printf '%s\n' "$art" | wc -l)
cols=$(printf '%s\n' "$art" | head -1 | wc -c); cols=$((cols - 1))
W=$((cols * SCALE)); H=$((rows * SCALE))
pal='
  r["."]=0;   g["."]=0;   b["."]=0
  r["#"]=200; g["#"]=215; b["#"]=220
  r["="]=240; g["="]=250; b["="]=255
  r["-"]=150; g["-"]=165; b["-"]=175
  r["s"]=90;  g["s"]=100; b["s"]=120
  r["S"]=55;  g["S"]=60;  b["S"]=78
  r["k"]=25;  g["k"]=30;  b["k"]=50
  r["c"]=40;  g["c"]=220; b["c"]=200
  r["m"]=230; g["m"]=60;  b["m"]=190
  r["y"]=250; g["y"]=200; b["y"]=60
'
{
  printf 'P6\n%d %d\n255\n' "$W" "$H"
  printf '%s\n' "$art" | awk -v S="$SCALE" "BEGIN { $pal }"'
    { for (rr = 0; rr < S; rr++) for (i = 1; i <= length($0); i++) { ch = substr($0, i, 1); for (k = 0; k < S; k++) printf "%c%c%c", r[ch], g[ch], b[ch] } }'
} > /tmp/crash-test-tile.ppm
{
  printf 'P5\n%d %d\n255\n' "$W" "$H"
  printf '%s\n' "$art" | awk -v S="$SCALE" '
    { for (rr = 0; rr < S; rr++) for (i = 1; i <= length($0); i++) { a = (substr($0, i, 1) == ".") ? 0 : 255; for (k = 0; k < S; k++) printf "%c", a } }'
} > /tmp/crash-test-tile-alpha.pgm
convert /tmp/crash-test-tile.ppm /tmp/crash-test-tile-alpha.pgm -alpha off -compose CopyOpacity -composite ../test-tile.png
rm -f /tmp/crash-test-tile.ppm /tmp/crash-test-tile-alpha.pgm
identify ../test-tile.png
