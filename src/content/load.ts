import { validateFrontmatter, analyzeCollection } from '../../scripts/validate-lib.mjs';
import constellationsJson from '../../content/constellations.json';
import { parseArticle } from './frontmatter';
import type { Article, Constellation } from './types';

const rawArticles = import.meta.glob('../../content/articles/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export interface LoadedContent {
  articles: Article[];
  constellations: Constellation[];
  /** FR-1: invalid articles are excluded loudly, never silently. */
  errors: string[];
}

/** Pure assembly step, exported for tests; loadContent feeds it the glob. */
export function assembleContent(
  rawFiles: Record<string, string>,
  constellations: Constellation[],
): LoadedContent {
  const articles: Article[] = [];
  let errors: string[] = [];
  for (const [path, raw] of Object.entries(rawFiles).sort(([a], [b]) => a.localeCompare(b))) {
    const sourceName = path.split('/').pop() ?? path;
    const { article, errors: fileErrors } = parseArticle(raw, sourceName, validateFrontmatter);
    if (article) articles.push(article);
    errors = errors.concat(fileErrors);
  }
  const { errors: collectionErrors, excludedSources } = analyzeCollection(
    articles.map((a) => ({
      fm: a as unknown as Record<string, unknown>,
      sourceName: a.sourceName,
    })),
    constellations,
  );
  errors = errors.concat(collectionErrors);
  // P6-A2 (contextless review, skeptic lens, CRITICAL): collection-invalid
  // articles are excluded per FR-1, not just logged — an unknown-constellation
  // article used to render as an unclustered white star at the origin.
  const kept = articles.filter((a) => !excludedSources.has(a.sourceName));
  for (const e of errors) console.error(`[content] ${e}`);
  return { articles: kept, constellations, errors };
}

export function loadContent(): LoadedContent {
  return assembleContent(rawArticles, constellationsJson as Constellation[]);
}
