import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/blocks/hotel-tracks.ts', 'utf8');
const paths = [...source.matchAll(/video: '(\/reference\/[^']+\.mp4)'/g)].map(
  (match) => match[1]
);
assert.equal(paths.length, 14, 'Every template needs its own preview');
assert.equal(
  new Set(paths).size,
  14,
  'Do not reuse one video across templates'
);
const hashes = new Set();
for (const path of paths) {
  const bytes = readFileSync(`public${path}`);
  assert.equal(bytes.toString('ascii', 4, 8), 'ftyp', path);
  assert.ok(bytes.includes(Buffer.from('moov')), `${path}: missing metadata`);
  assert.ok(bytes.includes(Buffer.from('mdat')), `${path}: missing media`);
  assert.ok(
    bytes.includes(Buffer.from('avc1')),
    `${path}: expected browser-compatible H.264`
  );
  assert.ok(bytes.includes(Buffer.from('mp4a')), `${path}: expected AAC sound`);
  const start = bytes.indexOf(Buffer.from('mvhd')) + 4;
  assert.ok(start > 3, `${path}: missing duration`);
  const version = bytes[start];
  const scale = bytes.readUInt32BE(start + (version === 1 ? 20 : 12));
  const duration =
    version === 1
      ? Number(bytes.readBigUInt64BE(start + 24))
      : bytes.readUInt32BE(start + 16);
  const seconds = duration / scale;
  assert.ok(seconds > 0 && seconds < 60, `${path}: invalid duration`);
  hashes.add(createHash('sha256').update(bytes).digest('hex'));
  console.log(`${path}: ${seconds.toFixed(2)}s, H.264 + AAC`);
}
assert.equal(hashes.size, 14, 'Preview files must contain distinct media');
console.log(
  'All 14 stored videos passed format checks. Subject motion must be checked separately with decoded frames.'
);
