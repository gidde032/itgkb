import type { Article, Constellation } from '../content/types';

export interface StarPosition {
  id: string;
  x: number;
  y: number;
  /** Depth cue in [0, 1]; renderers may map it to size/brightness/parallax. */
  z: number;
}

/**
 * Extensibility contract (FR-10): swap curated-force for TF-IDF or embeddings
 * later without touching the renderer or UI.
 */
export interface LayoutProvider {
  layout(articles: Article[], constellations: Constellation[]): StarPosition[];
}
