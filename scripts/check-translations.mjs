import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { m } from '../src/paraglide/messages.js';

// Compilation may succeed with an empty registry if a translation plugin fails.
// Fail explicitly on missing functions instead of relying on a successful build.
for (const locale of ['en', 'zh']) {
  const source = JSON.parse(
    await readFile(
      new URL(`../messages/${locale}.json`, import.meta.url),
      'utf8'
    )
  );
  for (const key of Object.keys(source).filter((key) => key !== '$schema')) {
    assert.equal(
      typeof m[key],
      'function',
      `Missing generated translation: ${key}`
    );
  }
  assert.equal(
    m['common.sign.email_placeholder']({}, { locale }),
    source['common.sign.email_placeholder']
  );
  console.log(`${locale}: translation registry and login placeholder verified`);
}
