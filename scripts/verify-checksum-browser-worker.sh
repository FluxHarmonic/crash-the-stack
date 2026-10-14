#!/usr/bin/env bash
# Recheck the four browser arms against an immutable, already built artifact.
set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
web=${1:?need served artifact directory}
out=${2:-"$root/build/checksum-browser-settle"}
mkdir -p "$out"
cd "$root"
export PULSE_SINK=worker-null PIPEWIRE_NODE=worker-null
test -f "$web/BUILD-SHA" || exit 125
cp "$web/BUILD-SHA" "$out/BUILD-SHA"
git rev-parse HEAD > "$out/VERIFIER-SHA"
sha256sum "$web/crash-the-stack.wasm" > "$out/wasm.sha256"
sha256sum verify-checksum.mjs > "$out/verifier.sha256"
rc=0
for viewport in portrait desktop; do
  for dock in center right; do
    label="$viewport-$dock"
    args=("$web" --dock "$dock" --port 8117 --cdp 9337
          --deals "$root/bench/checksum-reference/deals.scm"
          --shot "$out/screens/$label.png")
    if [ "$viewport" = portrait ]; then args+=(--portrait); fi
    if [ -n "${CHECKSUM_AUDIO_NEGATIVE:-}" ]; then
      args+=(--audio-negative "$CHECKSUM_AUDIO_NEGATIVE")
    fi
    nice -n 19 node verify-checksum.mjs "${args[@]}" > "$out/$label.log" 2>&1
    arm_rc=$?
    printf 'RESULT checksum-browser %s rc=%s\n' "$label" "$arm_rc"
    printf '%s %s\n' "$label" "$arm_rc" >> "$out/results.txt"
    if [ "$arm_rc" != 0 ]; then rc=1; fi
  done
done
printf '%s\n' "$rc" > "$out/rc"
exit "$rc"
