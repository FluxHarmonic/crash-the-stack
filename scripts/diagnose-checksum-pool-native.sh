#!/usr/bin/env bash
# Focused worker-side probe: emit the pool's C and compile that one module.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
out=${CHECKSUM_PROBE_OUT:-"$root/build/checksum-pool-native-probe"}
source=${CHECKSUM_PROBE_SOURCE:-"$root/src/crash/checksum/pool/data.sgl"}
sigil_bin="$HOME/.sigil/versions/0.22.10/sigil"
sdk="$HOME/.sigil/deps/codeberg-sigil-sigil-fba8cb3b62857799af019158c94608447c8ba496/packages/sigil-lib"
mkdir -p "$out"
trap 'rc=$?; printf "%s\n" "$rc" > "$out/rc"' EXIT
"$sigil_bin" --version
sha256sum "$source"
cat > "$out/emit.sgl" <<EOF
(import (sigil compiler))
(unless (compile-to-native-library-c
          "$source"
          "$out/pool.c"
          "sigil_module_crash_checksum_pool_data_init")
  (error "pool C emission failed"))
EOF
# Keep the project dependency loader out of this isolated compiler API probe.
cd /tmp
SIGIL_OPT_LEVEL=2 nice -n 19 timeout 60 "$sigil_bin" eval -f "$out/emit.sgl" > "$out/emit.log" 2>&1
wc -lc "$out/pool.c"
sha256sum "$out/pool.c"
if [ "${CHECKSUM_PROBE_EMIT_ONLY:-0}" = 1 ]; then
  echo 'PROBE-COMPLETE: C emission only'
  exit 0
fi
test -f "$sdk/include/sigil/sigil.h"
nice -n 19 timeout 180 guix shell gcc-toolchain -- \
  gcc -std=c99 -O2 -I"$sdk/include" -I"$sdk/src" \
  -c "$out/pool.c" -o "$out/pool.o" \
  > "$out/compile.log" 2>&1
stat -c '%n %s bytes' "$out/pool.o"
echo 'PROBE-COMPLETE: single native pool module compiled; full web gate still required'
