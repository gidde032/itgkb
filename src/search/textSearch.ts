import type { Article } from '../content/types';
import type { MatchResult, SearchProvider } from './types';

const FIELD_WEIGHTS = { title: 4, tags: 3, summary: 2, body: 1 } as const;

/**
 * MVP search (FR-8): case-insensitive substring over title, tags, summary,
 * and full body. Every whitespace-separated term must match at least one
 * field (AND semantics); score sums field weights per term.
 */
export class TextSearch implements SearchProvider {
  search(query: string, articles: Article[]): MatchResult[] {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];
    const results: MatchResult[] = [];
    for (const a of articles) {
      const haystacks = {
        title: a.title.toLowerCase(),
        tags: a.tags.join(' ').toLowerCase(),
        summary: a.summary.toLowerCase(),
        body: a.body.toLowerCase(),
      };
      let score = 0;
      const fields = new Set<string>();
      let allTermsMatch = true;
      for (const term of terms) {
        let termMatched = false;
        for (const [field, text] of Object.entries(haystacks) as [
          keyof typeof FIELD_WEIGHTS,
          string,
        ][]) {
          if (text.includes(term)) {
            termMatched = true;
            score += FIELD_WEIGHTS[field];
            fields.add(field);
          }
        }
        if (!termMatched) {
          allTermsMatch = false;
          break;
        }
      }
      if (allTermsMatch && score > 0) {
        results.push({ id: a.id, score, fields: [...fields] });
      }
    }
    results.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    return results;
  }
}
