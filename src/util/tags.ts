import type { Article } from '../content/types';

/**
 * Count tags shared by two articles. Single source of truth shared by the
 * layout (force-simulation links) and the renderer (constellation line art) so
 * the tag-similarity definition cannot drift between them (audit P5).
 */
export function sharedTagCount(a: Article, b: Article): number {
  const set = new Set(a.tags);
  return b.tags.reduce((n, t) => n + (set.has(t) ? 1 : 0), 0);
}
