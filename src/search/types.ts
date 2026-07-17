import type { Article } from '../content/types';

export interface MatchResult {
  id: string;
  /** Higher = more relevant. Implementation-defined scale. */
  score: number;
  /** Which fields matched, for UI hints: 'title' | 'tags' | 'summary' | 'body'. */
  fields: string[];
}

/**
 * Extensibility contract (FR-10): the UI consumes ranked MatchResults and
 * never inspects how they were produced, so an embedding/semantic backend can
 * replace TextSearch without touching any component.
 */
export interface SearchProvider {
  search(query: string, articles: Article[]): MatchResult[];
}
