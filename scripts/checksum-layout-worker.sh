#!/usr/bin/env bash
# Focused layout revision: pinned source checks, web build, three viewports.
# Never leases, hosts, pushes or publishes.
set -euo pipefail
cd "$(dirname "$0")/.."
out=build/checksum-layout-proof
mkdir -p "$out"
export PATH="$HOME/.sigil/versions/0.22.10:$PATH"
export PULSE_SINK=worker-null PIPEWIRE_NODE=worker-null OPTIMIZE=2
sigil --version | tee "$out/version.log"
sigil --version | rg -q '0\.22\.10'
lock=22369be17e274d0951e2194bed157917940317ee659d29c6142d3eed753d6636
test "$(sha256sum sigil.lock | cut -d' ' -f1)" = "$lock"
test -z "$(git status --porcelain --untracked-files=no)"
git rev-parse HEAD > "$out/BUILD-SHA"
nice -n19 sigil deps install > "$out/deps.log" 2>&1
test "$(sha256sum sigil.lock | cut -d' ' -f1)" = "$lock"
nice -n19 node scripts/checksum-layout-check.mjs "$(command -v sigil)" \
  .sigil/deps/sigil-test/src .sigil/deps/substratic/src > "$out/table.log" 2>&1
cat "$out/table.log"
nice -n19 timeout 7200 scripts/dev sigil build --config web > "$out/build.log" 2>&1
test -z "$(git status --porcelain --untracked-files=no)"
sha=$(cat "$out/BUILD-SHA")
node -e 'const fs=require("fs"),assert=require("assert");assert.equal(fs.readFileSync("build/web/index.html","utf8").match(/version: "([^"]+)"/)[1],process.argv[1].slice(0,12));' "$sha"
cp "$out/BUILD-SHA" build/web/BUILD-SHA
sha256sum build/web/crash-the-stack.wasm > "$out/wasm.sha256"
if ! command -v google-chrome >/dev/null; then
  chrome=$(command -v chromium)
  mkdir -p "$out/shim"
  printf '#!/bin/sh\nexec %s "$@"\n' "$chrome" > "$out/shim/google-chrome"
  chmod +x "$out/shim/google-chrome"
  export PATH="$PWD/$out/shim:$PATH"
fi
nice -n19 bash scripts/verify-checksum-browser-worker.sh "$PWD/build/web" "$out/browser"
printf 'RESULT checksum-layout all-required-checks rc=0\n' | tee "$out/ready-for-host"
