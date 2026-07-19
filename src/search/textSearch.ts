import type { Article } from '../content/types';
import type { MatchResult, SearchProvider } from './types';
import { normalizeSearchText } from './normalize';

const FIELD_WEIGHTS = { title: 4, tags: 3, summary: 2, body: 1 } as const;
type FieldName = keyof typeof FIELD_WEIGHTS;

interface Haystacks {
  title: string;
  tags: string;
  summary: string;
  body: string;
}

function scoreArticle(haystacks: Haystacks, terms: string[]): {
  score: number;
  fields: Set<string>;
  matchedTerms: number;
} {
  let score = 0;
  const fields = new Set<string>();
  let matchedTerms = 0;
  for (const term of terms) {
    let termMatched = false;
    for (const [field, text] of Object.entries(haystacks) as [FieldName, string][]) {
      if (text.includes(term)) {
        termMatched = true;
        score += FIELD_WEIGHTS[field];
        fields.add(field);
      }
    }
    if (termMatched) matchedTerms += 1;
  }
  return { score, fields, matchedTerms };
}

/**
 * MVP search (FR-8): normalized, case-insensitive substring over title, tags,
 * summary, and full body (see normalizeSearchText for punctuation handling).
 * Primary pass uses AND semantics (every term must match somewhere). If that
 * yields nothing — common with natural phrasing — a best-effort fallback (A2)
 * ranks articles by how many terms match and how strongly, flagged partial.
 */
export class TextSearch implements SearchProvider {
  search(query: string, articles: Article[]): MatchResult[] {
    const terms = [...new Set(normalizeSearchText(query).split(/\s+/).filter(Boolean))];
    if (terms.length === 0) return [];
    const scored = articles.map((a) => ({
      id: a.id,
      ...scoreArticle(
        {
          title: normalizeSearchText(a.title),
          tags: normalizeSearchText(a.tags.join(' ')),
          summary: normalizeSearchText(a.summary),
          body: normalizeSearchText(a.body),
        },
        terms,
      ),
    }));

    const full = scored.filter((s) => s.matchedTerms === terms.length && s.score > 0);
    if (full.length > 0 || terms.length === 1) {
      return full
        .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
        .map((s) => ({ id: s.id, score: s.score, fields: [...s.fields] }));
    }

    // A2 fallback: no article matched every term — rank by matched-term count,
    // then weighted score, so intent survives one bad token.
    return scored
      .filter((s) => s.matchedTerms > 0)
      .sort(
        (a, b) =>
          b.matchedTerms - a.matchedTerms || b.score - a.score || a.id.localeCompare(b.id),
      )
      .map((s) => ({ id: s.id, score: s.score, fields: [...s.fields], partial: true }));
  }
}
