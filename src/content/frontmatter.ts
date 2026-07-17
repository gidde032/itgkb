import yaml from 'js-yaml';
import type { Article } from './types';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export interface ParseResult {
  article: Article | null;
  errors: string[];
}

/** Parse one raw markdown file into an Article. Mirrors scripts/validate-lib.mjs rules. */
export function parseArticle(
  raw: string,
  sourceName: string,
  validate: (fm: Record<string, unknown>, sourceName: string) => string[],
): ParseResult {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) return { article: null, errors: [`${sourceName}: no YAML frontmatter block found`] };
  let fm: unknown;
  try {
    fm = yaml.load(match[1]);
  } catch (e) {
    return { article: null, errors: [`${sourceName}: YAML parse error — ${(e as Error).message}`] };
  }
  if (typeof fm !== 'object' || fm === null) {
    return { article: null, errors: [`${sourceName}: frontmatter is not a mapping`] };
  }
  const record = fm as Record<string, unknown>;
  const errors = validate(record, sourceName);
  if (errors.length > 0) return { article: null, errors };
  return {
    article: {
      id: record.id as string,
      title: record.title as string,
      constellation: record.constellation as string,
      tags: (record.tags as string[] | undefined) ?? [],
      summary: record.summary as string,
      stub: (record.stub as boolean | undefined) ?? false,
      related: (record.related as string[] | undefined) ?? [],
      body: raw.slice(match[0].length),
      sourceName,
    },
    errors: [],
  };
}
