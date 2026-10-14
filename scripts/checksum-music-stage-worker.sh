#!/usr/bin/env bash
# Phantom diagnosis only. Never leases, hosts or publishes.
# No timeout sends an unadmitted process signal; the detached job stays observable.
set -euo pipefail
cd "$(dirname "$0")/.."
out=build/checksum-music-stage
mkdir -p "$out"
export PATH="$HOME/.sigil/versions/0.22.10:$PATH"
export PULSE_SINK=worker-null PIPEWIRE_NODE=worker-null OPTIMIZE=2
sigil --version | tee "$out/version.log"
sigil --version | rg -q '0\.22\.10'
lock=22369be17e274d0951e2194bed157917940317ee659d29c6142d3eed753d6636
test "$(sha256sum sigil.lock | cut -d' ' -f1)" = "$lock"
test -z "$(git status --porcelain --untracked-files=no)"
git rev-parse HEAD > "$out/BUILD-SHA"
cat /proc/loadavg > "$out/build-load.txt"
nice -n19 sigil deps install > "$out/deps.log" 2>&1
test "$(sha256sum sigil.lock | cut -d' ' -f1)" = "$lock"
nice -n19 scripts/dev sigil test --report "$out/music-live.json" test/test-music-live.sgl > "$out/music-live.log" 2>&1
nice -n19 node -e 'const fs=require("fs"),assert=require("assert");const r=JSON.parse(fs.readFileSync(process.argv[1]));assert.ok(r.summary.total>0);assert.equal(r.summary.passed,r.summary.total);assert.equal(r.summary.failed,0);assert.equal(r.summary.skipped,0);' "$out/music-live.json"
nice -n19 scripts/dev sigil build --config web > "$out/build.log" 2>&1
test -z "$(git status --porcelain --untracked-files=no)"
sha=$(cat "$out/BUILD-SHA")
nice -n19 node -e 'const fs=require("fs"),assert=require("assert");assert.equal(fs.readFileSync("build/web/index.html","utf8").match(/version: "([^"]+)"/)[1],process.argv[1].slice(0,12));' "$sha"
cp "$out/BUILD-SHA" build/web/BUILD-SHA
sha256sum build/web/crash-the-stack.wasm > "$out/wasm.sha256"
cat /proc/loadavg > "$out/profile-load.txt"
printf 'RESULT diagnostic-build rc=0; profiling next\n'
nice -n19 node scripts/profile-checksum-start.mjs --web build/web --out "$out/profile" --reps 10
