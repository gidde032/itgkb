import type { Article } from '../content/types';

export interface StarLink {
  a: string;
  b: string;
  strength: number;
}

function sharedTags(a: Article, b: Article): number {
  const set = new Set(a.tags);
  return b.tags.reduce((n, t) => n + (set.has(t) ? 1 : 0), 0);
}

/**
 * Constellation line art (FR-3): sparse links between closely related stars
 * within the same constellation. Pairs are ranked by shared-tag count and
 * added greedily while both endpoints have degree < 2, which produces the
 * chain-like figures of real star charts instead of dense webs.
 */
export function computeConstellationLinks(articles: Article[]): StarLink[] {
  const pairs: StarLink[] = [];
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const a = articles[i];
      const b = articles[j];
      if (a.constellation !== b.constellation) continue;
      const strength = sharedTags(a, b);
      if (strength > 0) pairs.push({ a: a.id, b: b.id, strength });
    }
  }
  // Deterministic order: strength desc, then id pair asc.
  pairs.sort((p, q) => q.strength - p.strength || (p.a + p.b).localeCompare(q.a + q.b));
  const degree = new Map<string, number>();
  const links: StarLink[] = [];
  for (const p of pairs) {
    const da = degree.get(p.a) ?? 0;
    const db = degree.get(p.b) ?? 0;
    if (da < 2 && db < 2) {
      links.push(p);
      degree.set(p.a, da + 1);
      degree.set(p.b, db + 1);
    }
  }
  return links;
}
