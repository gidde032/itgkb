import type { Article } from '../content/types';
import type { MatchResult, SearchProvider } from './types';
import { TextSearch } from './textSearch';
import { cosine } from './cosine';

const SEMANTIC_BOOST_ALPHA = 2;

export class SemanticTextSearch implements SearchProvider {
  private readonly text = new TextSearch();

  constructor(private readonly vectors: Record<string, readonly number[]>) {}

  search(query: string, articles: Article[]): MatchResult[] {
    const textResults = this.text.search(query, articles);
    if (textResults.length <= 1) return textResults;

    const anchorVec = this.vectors[textResults[0].id];
    if (!anchorVec) return textResults;

    const boosted = textResults.map((r) => {
      const vec = this.vectors[r.id];
      const sim = vec ? cosine(vec, anchorVec) : 0;
      return { ...r, score: r.score + SEMANTIC_BOOST_ALPHA * sim };
    });

    return boosted.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  }
}
