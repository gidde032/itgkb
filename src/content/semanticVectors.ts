import type { Article } from './types';
import type { SemanticMap } from './semanticMap';

const semanticVectorsModules = import.meta.glob<string>('../../content/semantic-vectors.json', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const rawSemanticVectors = Object.values(semanticVectorsModules)[0];

export interface SemanticVectors {
  schemaVersion: number;
  generatorVersion: number;
  model: string;
  revision: string;
  inputHash: string;
  dimensions: number;
  vectors: Record<string, number[]>;
}

const SCHEMA_VERSION = 1;
const GENERATOR_VERSION = 3;
const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const MODEL_REVISION = '751bff37182d3f1213fa05d7196b954e230abad9';
const EXPECTED_DIMS = 384;

export function isSemanticVectors(v: unknown): v is SemanticVectors {
  if (typeof v !== 'object' || v === null) return false;
  const m = v as Record<string, unknown>;
  if (
    m.schemaVersion !== SCHEMA_VERSION ||
    m.generatorVersion !== GENERATOR_VERSION ||
    m.model !== MODEL_ID ||
    m.revision !== MODEL_REVISION ||
    typeof m.inputHash !== 'string' ||
    !/^sha256:[0-9a-f]{64}$/.test(m.inputHash)
  ) {
    return false;
  }
  if (typeof m.dimensions !== 'number' || m.dimensions !== EXPECTED_DIMS) return false;
  if (typeof m.vectors !== 'object' || m.vectors === null || Array.isArray(m.vectors)) return false;
  const entries = Object.values(m.vectors as Record<string, unknown>);
  if (entries.length === 0) return false;
  const first = entries[0];
  if (!Array.isArray(first) || first.length !== EXPECTED_DIMS) return false;
  return true;
}

export function parseSemanticVectors(raw: string | undefined): SemanticVectors | null {
  if (raw === undefined) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isSemanticVectors(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function loadSemanticVectors(): SemanticVectors | null {
  return parseSemanticVectors(rawSemanticVectors);
}

export function vectorsCoverArticles(vecs: SemanticVectors, articles: readonly Article[]): boolean {
  const ids = new Set(Object.keys(vecs.vectors));
  return ids.size === articles.length && articles.every((a) => ids.has(a.id));
}

export function vectorsMatchMap(vecs: SemanticVectors, map: SemanticMap): boolean {
  return vecs.inputHash === map.inputHash;
}
