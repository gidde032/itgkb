export interface Constellation {
  id: string;
  name: string;
  anchor: { x: number; y: number };
  color: string;
  /** Short catalog-id prefix for stars in this constellation (e.g. GW, SEC). */
  prefix?: string;
  /**
   * Showcase-mode depth placement (#31): curated z offset for the whole figure
   * plus how far its stars spread in depth. Optional — the 2D galaxy ignores
   * it; absent values fall back to { z: 0, spread: DEFAULT }.
   */
  depth?: { z: number; spread: number };
}

export interface Article {
  id: string;
  title: string;
  constellation: string;
  tags: string[];
  summary: string;
  stub: boolean;
  related: string[];
  /** Markdown body (frontmatter stripped). */
  body: string;
  /** Source filename, for diagnostics. */
  sourceName: string;
}
