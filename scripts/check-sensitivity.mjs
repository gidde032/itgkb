// Content-sensitivity gate (M4 #22): the public repo must not carry
// organization-specific data (Carlson/UMN/TDX names, internal hostnames),
// email addresses, or unresolved (verify)/[NEEDS VERIFICATION] markers.
//
// Report-only for now — NOT yet wired into `npm run gates`. It becomes a hard
// gate once the seed articles are generalized (#24). Run: npm run check:sensitivity
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findSensitiveMatches } from './validate-lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const articlesDir = join(root, 'content', 'articles');

let findings = [];
for (const file of readdirSync(articlesDir)
  .filter((f) => f.endsWith('.md'))
  .sort()) {
  const raw = readFileSync(join(articlesDir, file), 'utf8');
  findings = findings.concat(findSensitiveMatches(file, raw));
}

if (findings.length > 0) {
  console.error(
    `Content-sensitivity check FAILED (${findings.length} match${findings.length === 1 ? '' : 'es'}):`,
  );
  const byFile = new Map();
  for (const f of findings) {
    if (!byFile.has(f.sourceName)) byFile.set(f.sourceName, []);
    byFile.get(f.sourceName).push(f);
  }
  for (const [file, fs] of byFile) {
    console.error(`\n  ${file}`);
    for (const f of fs) console.error(`    L${f.line}  [${f.patternId}] "${f.match}"`);
  }
  const counts = findings.reduce(
    (acc, f) => ((acc[f.patternId] = (acc[f.patternId] ?? 0) + 1), acc),
    {},
  );
  console.error(
    `\n  by category: ${Object.entries(counts)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')}`,
  );
  process.exit(1);
}
console.log('Content-sensitivity check passed: no organization-specific data found.');
