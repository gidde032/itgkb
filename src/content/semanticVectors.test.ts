import { describe, expect, it } from 'vitest';
import { loadContent } from './load';
import { loadSemanticMap } from './semanticMap';
import {
  isSemanticVectors,
  loadSemanticVectors,
  parseSemanticVectors,
  vectorsCoverArticles,
  vectorsMatchMap,
  type SemanticVectors,
} from './semanticVectors';
import type { Article } from './types';

function art(id: string): Article {
  return {
    id,
    title: id,
    constellation: 'c',
    tags: [],
    summary: 's',
    stub: false,
    related: [],
    body: 'b',
    sourceName: `${id}.md`,
  };
}

function minimalVecs(): SemanticVectors {
  return {
    schemaVersion: 1,
    generatorVersion: 3,
    model: 'Xenova/all-MiniLM-L6-v2',
    revision: '751bff37182d3f1213fa05d7196b954e230abad9',
    inputHash: 'sha256:' + '0'.repeat(64),
    dimensions: 384,
    vectors: { a: new Array(384).fill(0.1) },
  };
}

describe('committed semantic vectors artifact (#30)', () => {
  const vecs = loadSemanticVectors();

  it('loads the committed artifact', () => {
    expect(vecs).not.toBeNull();
  });

  it('covers exactly the real article set', () => {
    const { articles } = loadContent();
    expect(Object.keys(vecs!.vectors)).toHaveLength(articles.length);
    expect(vectorsCoverArticles(vecs!, articles)).toBe(true);
  });

  it('has 384-dim vectors for every article', () => {
    for (const vec of Object.values(vecs!.vectors)) {
      expect(vec).toHaveLength(384);
      expect(vec.every((n: number) => Number.isFinite(n))).toBe(true);
    }
  });

  it('inputHash matches the semantic map', () => {
    const map = loadSemanticMap();
    expect(map).not.toBeNull();
    expect(vectorsMatchMap(vecs!, map!)).toBe(true);
  });
});

describe('isSemanticVectors', () => {
  it('accepts well-formed data', () => {
    expect(isSemanticVectors(minimalVecs())).toBe(true);
  });

  it('rejects null and non-objects', () => {
    expect(isSemanticVectors(null)).toBe(false);
    expect(isSemanticVectors('nope')).toBe(false);
    expect(isSemanticVectors(42)).toBe(false);
  });

  it('rejects wrong schema version', () => {
    expect(isSemanticVectors({ ...minimalVecs(), schemaVersion: 99 })).toBe(false);
  });

  it('rejects wrong model', () => {
    expect(isSemanticVectors({ ...minimalVecs(), model: 'wrong-model' })).toBe(false);
  });

  it('rejects wrong dimensions', () => {
    expect(isSemanticVectors({ ...minimalVecs(), dimensions: 128 })).toBe(false);
  });

  it('rejects empty vectors', () => {
    expect(isSemanticVectors({ ...minimalVecs(), vectors: {} })).toBe(false);
  });

  it('rejects vectors with wrong length', () => {
    expect(isSemanticVectors({ ...minimalVecs(), vectors: { a: [0.1, 0.2] } })).toBe(false);
  });

  it('rejects missing inputHash', () => {
    const bad = { ...minimalVecs() } as Record<string, unknown>;
    delete bad.inputHash;
    expect(isSemanticVectors(bad)).toBe(false);
  });
});

describe('parseSemanticVectors', () => {
  it('returns null for undefined', () => {
    expect(parseSemanticVectors(undefined)).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parseSemanticVectors('{not json')).toBeNull();
  });

  it('returns null for schema-invalid JSON', () => {
    expect(parseSemanticVectors('{"schemaVersion":99}')).toBeNull();
  });
});

describe('vectorsCoverArticles', () => {
  it('is false when an article is missing from vectors', () => {
    expect(vectorsCoverArticles(minimalVecs(), [art('a'), art('b')])).toBe(false);
  });

  it('is false when vectors has extra entries', () => {
    const v = minimalVecs();
    v.vectors['b'] = new Array(384).fill(0);
    expect(vectorsCoverArticles(v, [art('a')])).toBe(false);
  });
});

describe('vectorsMatchMap', () => {
  it('returns false when hashes disagree', () => {
    const vecs = minimalVecs();
    const map = loadSemanticMap()!;
    expect(vectorsMatchMap(vecs, map)).toBe(false);
  });
});
