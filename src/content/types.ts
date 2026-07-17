export interface Constellation {
  id: string;
  name: string;
  anchor: { x: number; y: number };
  color: string;
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
