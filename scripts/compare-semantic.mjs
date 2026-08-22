// CI helper (#29): tolerant comparison of two semantic-map JSON files via
// semantic-lib's compareArtifacts. Byte equality is too strict across
// platforms (last-bit float wobble in model inference can move a rounded
// coordinate), but a cluster flip, an input-hash change, or real coordinate
// drift must fail the run.
import { readFileSync } from 'node:fs';
import { compareArtifacts } from './semantic-lib.mjs';

const [aPath, bPath] = process.argv.slice(2);
if (!aPath || !bPath) {
  console.error('usage: node scripts/compare-semantic.mjs <committed.json> <regenerated.json>');
  process.exit(2);
}
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const { ok, differences } = compareArtifacts(read(aPath), read(bPath));
if (!ok) {
  console.error('Semantic map regeneration mismatch:');
  for (const d of differences) console.error(`  - ${d}`);
  process.exit(1);
}
console.log('Semantic map regeneration matches the committed artifact.');
