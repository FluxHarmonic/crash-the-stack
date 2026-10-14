// Verification-only continuation queued after the original runner proof arm.
// Delivered as an untracked tool; never changes the product checkout.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const checkerSha = process.argv[3];
assert.match(checkerSha, /^[a-f0-9]{40}$/);
const web = path.resolve('../out/checksum-proof/ordered/web');
const out = path.resolve('../out/checksum-proof/browser-recheck');
assert.equal(fs.readFileSync(path.join(web, 'BUILD-SHA'), 'utf8').trim(),
  '6d1d43cf290feb6e122f3aab942c02d2266f9c4f');
assert.equal(createHash('sha256').update(fs.readFileSync(path.join(web, 'crash-the-stack.wasm'))).digest('hex'),
  '33a3539a4d435739948878512ee143631f94cd02b01ce028fd3c3323d08a41be');
const result = spawnSync('bash', ['scripts/verify-checksum-browser-worker.sh', web, out], {
  stdio: 'inherit',
  env: { ...process.env, CHECKSUM_BROWSER_VERIFIER: 'verify-checksum-recheck.mjs',
    CHECKSUM_VERIFIER_SHA: checkerSha,
    CHECKSUM_AUDIO_NEGATIVE: path.resolve('checksum-audio-negative-431365a.log') },
});
if (result.error) console.error(result.error);
process.exit(result.error ? 125 : (result.status ?? 125));
