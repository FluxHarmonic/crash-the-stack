// Full existing-table regression gate on the same runner lease as the build.
// Preserve the complete JSON report even when the suite is red.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const at = args.indexOf('--out');
const out = path.resolve(at < 0 ? 'build/checksum-suite' : args[at + 1]);
fs.mkdirSync(out, { recursive: true });
const album = spawnSync('guix', ['shell', 'jq', 'curl', '--', 'scripts/test-album-r2'], {
  encoding: 'utf8', timeout: 1800_000, maxBuffer: 10 * 1024 * 1024,
  env: { ...process.env, PULSE_SINK: 'worker-null', PIPEWIRE_NODE: 'worker-null' },
});
fs.writeFileSync(path.join(out, 'album-r2.log'), (album.stdout || '') + (album.stderr || ''));
console.log('ALBUM-R2:', (album.stdout || '').trim());
const report = path.join(out, 'report.json');
const result = spawnSync('scripts/dev', ['sigil', 'test', '--report', report], {
  cwd: process.cwd(), encoding: 'utf8', timeout: 5400_000, maxBuffer: 30 * 1024 * 1024,
  env: { ...process.env, PULSE_SINK: 'worker-null', PIPEWIRE_NODE: 'worker-null' },
});
fs.writeFileSync(path.join(out, 'suite.log'), (result.stdout || '') + (result.stderr || ''));
if (!fs.existsSync(report)) throw new Error(`No suite report: rc=${result.status}; ${result.error || ''}`);
const data = JSON.parse(fs.readFileSync(report, 'utf8'));
console.log('SUITE:', JSON.stringify(data.summary));
for (const failure of data.failures || []) console.log('SUITE-FAIL:', JSON.stringify(failure));
if (!data.summary || data.summary.total < 3000) throw new Error('Full suite did not run');
if (album.error || album.status !== 0 || result.error || result.status !== 0 || data.summary.failed !== 0) process.exitCode = 1;
else fs.writeFileSync(path.join(out, 'complete'), 'CHECKSUM-SUITE-COMPLETE\n');
