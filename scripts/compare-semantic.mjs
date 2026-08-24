// CI helper (#29/#30): exact comparison of committed vs regenerated semantic
// artifacts. Model weights are revision-pinned and the pipeline rounds its
// output, so any drift or hand edit must fail the run.
import { readFileSync } from 'node:fs';
import { compareArtifacts, compareVectors } from './semantic-lib.mjs';

const [aPath, bPath, aVecPath, bVecPath] = process.argv.slice(2);
if (!aPath || !bPath) {
  console.error(
    'usage: node scripts/compare-semantic.mjs <committed-map> <regen-map> [<committed-vec> <regen-vec>]',
  );
  process.exit(2);
}
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));

const { ok: mapOk, differences: mapDiff } = compareArtifacts(read(aPath), read(bPath));
if (!mapOk) {
  console.error('Semantic map regeneration mismatch:');
  for (const d of mapDiff) console.error(`  - ${d}`);
  process.exit(1);
}
console.log('Semantic map regeneration matches the committed artifact.');

if (aVecPath && bVecPath) {
  const { ok: vecOk, differences: vecDiff } = compareVectors(read(aVecPath), read(bVecPath));
  if (!vecOk) {
    console.error('Semantic vectors regeneration mismatch:');
    for (const d of vecDiff) console.error(`  - ${d}`);
    process.exit(1);
  }
  console.log('Semantic vectors regeneration matches the committed artifact.');
}
