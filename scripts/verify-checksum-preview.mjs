// Capture the sixth carousel image from this lease's runner build.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const build = process.argv[2] || 'build/web';
const out = path.resolve('../out/checksum-preview');
fs.mkdirSync(out, { recursive: true });
const result = spawnSync('guix', ['shell', 'imagemagick', '--',
  'scripts/free-previews', build, path.join(out, 'previews.png')], {
  encoding: 'utf8', timeout: 1200_000, maxBuffer: 10 * 1024 * 1024,
  env: { ...process.env, PULSE_SINK: 'worker-null', PIPEWIRE_NODE: 'worker-null' },
});
fs.writeFileSync(path.join(out, 'preview.log'), (result.stdout || '') + (result.stderr || ''));
console.log((result.stdout || '') + (result.stderr || ''));
if (result.error || result.status !== 0) throw new Error(`Preview capture failed: ${result.error || result.status}`);
fs.writeFileSync(path.join(out, 'complete'), 'CHECKSUM-PREVIEW-COMPLETE\n');
