// Content gate (FR-11): exits non-zero on any violation.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatterBlock, validateFrontmatter, validateCollection } from './validate-lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const articlesDir = join(root, 'content', 'articles');
const constellations = JSON.parse(readFileSync(join(root, 'content', 'constellations.json'), 'utf8'));

const entries = [];
let errors = [];

for (const file of readdirSync(articlesDir).filter((f) => f.endsWith('.md')).sort()) {
  const raw = readFileSync(join(articlesDir, file), 'utf8');
  const { fm, errors: parseErrors } = parseFrontmatterBlock(raw, file);
  if (!fm) {
    errors = errors.concat(parseErrors);
    continue;
  }
  errors = errors.concat(validateFrontmatter(fm, file));
  entries.push({ fm, sourceName: file });
}

errors = errors.concat(validateCollection(entries, constellations));

if (errors.length > 0) {
  console.error(`Content validation FAILED (${errors.length} error${errors.length === 1 ? '' : 's'}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`Content validation passed: ${entries.length} articles, ${constellations.length} constellations.`);
