#!/bin/sh
# assets/src/icon.txt -> assets/icon-192.png, icon-512.png (purpose any) and
# assets/icon-maskable-192.png, icon-maskable-512.png (purpose maskable: the
# same art on a 24x24 canvas of the ground, so it sits inside the 80 %
# safe zone a launcher may crop to a circle or a squircle). Cells scale by
# nearest neighbour so the pixels stay crisp. The palette letters are the
# roles of assets/palette.sgl: k C-BG, c C-SELECTED, m C-HIGHLIGHT,
# s C-BAR-C. Needs gawk and ImageMagick's convert (guix: imagemagick).
set -e
cd "$(dirname "$0")"
art=$(grep -v '^#' icon.txt | tr -d '|')
rows=$(printf '%s\n' "$art" | wc -l)
cols=$(printf '%s\n' "$art" | head -1 | wc -c); cols=$((cols - 1))
pal='
  r["k"]=13;  g["k"]=10;  b["k"]=26
  r["c"]=77;  g["c"]=242; b["c"]=217
  r["m"]=255; g["m"]=89;  b["m"]=217
  r["s"]=46;  g["s"]=28;  b["s"]=77
'
{
  printf 'P6\n%d %d\n255\n' "$cols" "$rows"
  printf '%s\n' "$art" | LC_ALL=C awk "BEGIN { $pal }"'
    { for (i = 1; i <= length($0); i++) { ch = substr($0, i, 1); printf "%c%c%c", r[ch], g[ch], b[ch] } }'
} > /tmp/crash-icon.ppm
for size in 192 512; do
  convert /tmp/crash-icon.ppm -filter point -resize "${size}x${size}" "../icon-$size.png"
  identify "../icon-$size.png"
  # maskable: the art centered on a 24-cell ground (16 of 24 = 67 %, inside the safe zone)
  convert /tmp/crash-icon.ppm -background "#0D0A1A" -gravity center -extent 24x24 -filter point -resize "${size}x${size}" "../icon-maskable-$size.png"
  identify "../icon-maskable-$size.png"
done
# the site's favicon: the same art at 32
convert /tmp/crash-icon.ppm -filter point -resize 32x32 "../../site/assets/favicon-32.png"
cp ../icon-192.png ../../site/assets/icon-192.png
cp ../icon-512.png ../../site/assets/icon-512.png
rm -f /tmp/crash-icon.ppm
