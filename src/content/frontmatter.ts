import { parseFrontmatterBlock } from '../../scripts/validate-lib.mjs';
import type { Article } from './types';

export interface ParseResult {
  article: Article | null;
  errors: string[];
}

/** Parse one raw markdown file into an Article. Parsing + rules both live in scripts/validate-lib.mjs (single source of truth — F3). */
export function parseArticle(
  raw: string,
  sourceName: string,
  validate: (fm: Record<string, unknown>, sourceName: string) => string[],
): ParseResult {
  const { fm, body, errors: parseErrors } = parseFrontmatterBlock(raw, sourceName);
  if (!fm) return { article: null, errors: parseErrors };
  const errors = validate(fm, sourceName);
  if (errors.length > 0) return { article: null, errors };
  return {
    article: {
      id: fm.id as string,
      title: fm.title as string,
      constellation: fm.constellation as string,
      tags: fm.tags as string[],
      summary: fm.summary as string,
      stub: (fm.stub as boolean | undefined) ?? false,
      related: (fm.related as string[] | undefined) ?? [],
      body,
      sourceName,
    },
    errors: [],
  };
}
