import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MODEL_REVISION,
  OUTLIER_MIN_DIST,
  compareArtifacts,
  computeInputHash,
  placeStars,
  semanticText,
} from '../../scripts/semantic-lib.mjs';
import {
  coversArticles,
  isSemanticMap,
  parseSemanticMap,
  usesKnownConstellations,
  type SemanticMap,
} from '../content/semanticMap';
import type { Article, Constellation } from '../content/types';

// Permanent contracts for the independent Luna xHigh review of PR #50.
// Each test names the originating lens and accepted severity.

const revision = '751bff37182d3f1213fa05d7196b954e230abad9';

function map(): SemanticMap {
  return {
    schemaVersion: 2,
    generatorVersion: 3,
    model: 'Xenova/all-MiniLM-L6-v2',
    revision,
    seed: 42,
    inputHash: `sha256:${'0'.repeat(64)}`,
    stars: [
      {
        id: 'a',
        constellation: 'known',
        x: 0,
        y: 0,
        z: 0.5,
        outlier: false,
        strength: 0.5,
      },
    ],
    edges: [],
  };
}

const article = { id: 'a' } as Article;
const constellation: Constellation = {
  id: 'known',
  name: 'Known',
  color: '#ffffff',
  anchor: { x: 0, y: 0 },
};

describe('PR #50 review repairs', () => {
  it('skeptical/product/integrity (HIGH): missing or invalid JSON reaches fallback', () => {
    expect(parseSemanticMap(undefined)).toBeNull();
    expect(parseSemanticMap('{invalid')).toBeNull();
  });

  it('skeptical/product/integrity (MEDIUM): malformed identity and grouping are rejected', () => {
    const unknown = map();
    unknown.stars[0] = { ...unknown.stars[0], constellation: 'bogus' };
    expect(isSemanticMap(unknown)).toBe(true);
    expect(usesKnownConstellations(unknown, [constellation])).toBe(false);

    const extra = map();
    extra.stars.push({ ...extra.stars[0], id: 'extra' });
    expect(coversArticles(extra, [article])).toBe(false);

    const duplicate = map();
    duplicate.stars.push({ ...duplicate.stars[0] });
    expect(isSemanticMap(duplicate)).toBe(false);
  });

  it('skeptical/integrity (MEDIUM): hash tracks inference tag order', () => {
    const first = {
      id: 'a',
      title: 'Title',
      summary: 'Summary',
      tags: ['one', 'two'],
      constellation: 'known',
    };
    const reversed = { ...first, tags: ['two', 'one'] };
    expect(semanticText(first)).not.toBe(semanticText(reversed));
    const hashConstellations = [constellation as unknown as Record<string, unknown>];
    expect(computeInputHash([first], hashConstellations)).not.toBe(
      computeInputHash([reversed], hashConstellations),
    );
  });

  it('integrity (HIGH): model provenance is an immutable commit revision', () => {
    expect(MODEL_REVISION).toBe(revision);
    expect(MODEL_REVISION).toMatch(/^[0-9a-f]{40}$/);
    expect(isSemanticMap({ ...map(), revision: '0'.repeat(40) })).toBe(false);
    const generator = readFileSync(
      join(process.cwd(), 'scripts/generate-semantic-map.mjs'),
      'utf8',
    );
    expect(generator).toContain('{ revision: MODEL_REVISION }');
    const workflow = readFileSync(join(process.cwd(), '.github/workflows/ci.yml'), 'utf8');
    expect(workflow).toContain('semantic-minilm-${{ runner.os }}-751bff37182d-');
  });

  it('integrity (HIGH): default artifact comparison rejects edited depth', () => {
    const committed = map();
    const edited = structuredClone(committed);
    edited.stars[0].z = 1;
    expect(compareArtifacts(committed, edited).ok).toBe(false);
  });

  it('skeptical (LOW): a center-anchored outlier remains in sparse space', () => {
    const [star] = placeStars({
      ids: ['a'],
      assignments: [0],
      clusterToConstellation: ['known'],
      strengths: [0],
      outliers: [true],
      edges: [],
      anchors: new Map([['known', { x: 0, y: 0 }]]),
    });
    expect(Math.hypot(star.x, star.y)).toBeGreaterThanOrEqual(OUTLIER_MIN_DIST - 0.01);
  });

  it('product/spec-drift (MEDIUM): canonical docs describe the semantic default', () => {
    const normalized = (path: string) =>
      readFileSync(join(process.cwd(), path), 'utf8').split(/\s+/).join(' ');
    expect(normalized('SPEC.md')).toContain('OQ-2: RESOLVED');
    expect(normalized('design/DESIGN.md')).toContain('semantic similarity graph');
    expect(normalized('README.md')).toContain('npm run build:semantic');
    expect(normalized('CHANGELOG.md')).toContain('Semantic layout');
  });
});
