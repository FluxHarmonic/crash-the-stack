#!/bin/sh
# assets/src/icon.txt -> assets/icon-192.png and assets/icon-512.png.
# Cells scale by nearest neighbour so the pixels stay crisp. Needs gawk
# and ImageMagick's convert (guix: imagemagick).
set -e
cd "$(dirname "$0")"
art=$(grep -v '^#' icon.txt | tr -d '|')
rows=$(printf '%s\n' "$art" | wc -l)
cols=$(printf '%s\n' "$art" | head -1 | wc -c); cols=$((cols - 1))
pal='
  r["k"]=6;   g["k"]=8;   b["k"]=15
  r["#"]=200; g["#"]=215; b["#"]=220
  r["="]=240; g["="]=250; b["="]=255
  r["-"]=150; g["-"]=165; b["-"]=175
  r["S"]=55;  g["S"]=60;  b["S"]=78
  r["c"]=40;  g["c"]=220; b["c"]=200
'
{
  printf 'P6\n%d %d\n255\n' "$cols" "$rows"
  printf '%s\n' "$art" | awk "BEGIN { $pal }"'
    { for (i = 1; i <= length($0); i++) { ch = substr($0, i, 1); printf "%c%c%c", r[ch], g[ch], b[ch] } }'
} > /tmp/crash-icon.ppm
for size in 192 512; do
  convert /tmp/crash-icon.ppm -filter point -resize "${size}x${size}" "../icon-$size.png"
  identify "../icon-$size.png"
done
rm -f /tmp/crash-icon.ppm
