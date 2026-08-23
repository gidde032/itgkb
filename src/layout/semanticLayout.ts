import type { Article } from '../content/types';
import type { SemanticMap } from '../content/semanticMap';
import type { LayoutProvider, StarPosition } from './types';

/**
 * Semantic layout (#29, FR-10 swap): positions come from the committed
 * build-time artifact — same flat coordinate space and z∈[0,1] depth cue as
 * the curated layout, so both renderers and the globe projection consume it
 * unchanged. Constructed only when the map covers every article (App checks
 * via coversArticles); a missing entry falls back to the origin rather than
 * crashing, but that path is unreachable in practice.
 */
export class SemanticLayout implements LayoutProvider {
  constructor(private readonly map: SemanticMap) {}

  // Positions come wholly from the artifact, so the constellations argument
  // of the LayoutProvider contract is not needed here.
  layout(articles: Article[]): StarPosition[] {
    const byId = new Map(this.map.stars.map((s) => [s.id, s]));
    return articles.map((a) => {
      const s = byId.get(a.id);
      return s ? { id: a.id, x: s.x, y: s.y, z: s.z } : { id: a.id, x: 0, y: 0, z: 0.5 };
    });
  }
}
