import { validateFrontmatter, validateCollection } from '../../scripts/validate-lib.mjs';
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

export function loadContent(): LoadedContent {
  const constellations = constellationsJson as Constellation[];
  const articles: Article[] = [];
  let errors: string[] = [];
  for (const [path, raw] of Object.entries(rawArticles).sort(([a], [b]) => a.localeCompare(b))) {
    const sourceName = path.split('/').pop() ?? path;
    const { article, errors: fileErrors } = parseArticle(raw, sourceName, validateFrontmatter);
    if (article) articles.push(article);
    errors = errors.concat(fileErrors);
  }
  errors = errors.concat(
    validateCollection(
      articles.map((a) => ({ fm: a as unknown as Record<string, unknown>, sourceName: a.sourceName })),
      constellations,
    ),
  );
  for (const e of errors) console.error(`[content] ${e}`);
  return { articles, constellations, errors };
}
