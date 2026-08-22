import type { Article } from '../content/types';
import { sharedTagCount } from '../util/tags';

export interface StarLink {
  a: string;
  b: string;
  /**
   * #29: similarity weight in (0, 1] on semantic edges — renderers map it to
   * line width/opacity and a gentle curve. Absent on curated tag-links and
   * orphan-rescue lines, which render exactly as before.
   */
  weight?: number;
}

export interface RelatedLink {
  a: string;
  b: string;
  colorA: string;
  colorB: string;
}

/** Ranked candidate pair; `strength` ranks pairs but is not needed at draw time. */
interface Pair extends StarLink {
  strength: number;
}

/**
 * Constellation line art (FR-3): sparse links between closely related stars
 * within the same constellation. Pairs are ranked by shared-tag count and
 * added greedily while both endpoints have degree < 2, which produces the
 * chain-like figures of real star charts instead of dense webs.
 *
 * Orphan rescue: after the greedy pass, any star with degree 0 is connected to
 * its nearest sibling within the same constellation (spatial distance via the
 * optional positions map). This guarantees every star has at least one
 * constellation line — no orphans.
 */
export function computeConstellationLinks(
  articles: Article[],
  positions?: ReadonlyMap<string, { x: number; y: number }>,
): StarLink[] {
  const pairs: Pair[] = [];
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const a = articles[i];
      const b = articles[j];
      if (a.constellation !== b.constellation) continue;
      const strength = sharedTagCount(a, b);
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
      links.push({ a: p.a, b: p.b });
      degree.set(p.a, da + 1);
      degree.set(p.b, db + 1);
    }
  }

  rescueOrphans(links, degree, articles, positions);

  return links;
}

/**
 * Orphan rescue: connect isolated stars to their nearest constellation
 * sibling (spatial distance via the optional positions map). Guarantees every
 * star has at least one constellation line — no orphans. Shared by the
 * curated and semantic link builders so the invariant has one implementation.
 */
function rescueOrphans(
  links: StarLink[],
  degree: Map<string, number>,
  articles: Article[],
  positions?: ReadonlyMap<string, { x: number; y: number }>,
): void {
  const byConstellation = new Map<string, Article[]>();
  for (const a of articles) {
    const group = byConstellation.get(a.constellation) ?? [];
    group.push(a);
    byConstellation.set(a.constellation, group);
  }
  for (const group of byConstellation.values()) {
    if (group.length < 2) continue;
    for (const orphan of group) {
      if ((degree.get(orphan.id) ?? 0) > 0) continue;
      // Find nearest sibling by spatial distance (if positions available),
      // otherwise fall back to the sibling with the highest degree (most
      // connected), breaking ties alphabetically for determinism.
      let bestId: string | null = null;
      let bestDist = Infinity;
      const orphanPos = positions?.get(orphan.id);
      for (const sibling of group) {
        if (sibling.id === orphan.id) continue;
        if (positions && orphanPos) {
          const sibPos = positions.get(sibling.id);
          if (sibPos) {
            const d = Math.hypot(sibPos.x - orphanPos.x, sibPos.y - orphanPos.y);
            if (d < bestDist || (d === bestDist && sibling.id < (bestId ?? ''))) {
              bestDist = d;
              bestId = sibling.id;
            }
          }
        } else {
          // Non-spatial fallback: prefer highest-degree sibling, then alphabetical.
          const sibDeg = degree.get(sibling.id) ?? 0;
          const bestDeg = bestId ? (degree.get(bestId) ?? 0) : -1;
          if (sibDeg > bestDeg || (sibDeg === bestDeg && sibling.id < (bestId ?? ''))) {
            bestId = sibling.id;
          }
        }
      }
      if (bestId) {
        const [a, b] = orphan.id < bestId ? [orphan.id, bestId] : [bestId, orphan.id];
        links.push({ a, b });
        degree.set(orphan.id, (degree.get(orphan.id) ?? 0) + 1);
        degree.set(bestId, (degree.get(bestId) ?? 0) + 1);
      }
    }
  }
}

/**
 * Semantic constellation lines (#29): the artifact's similarity edges become
 * the line art — every edge carries its weight for curved, weight-scaled
 * rendering — with the same orphan-rescue guarantee as the curated builder.
 * `articles` must already carry the MAPPED constellations (App applies
 * applySemanticConstellations), so rescue groups match the rendered knots.
 */
export function computeSemanticLinks(
  articles: Article[],
  positions: ReadonlyMap<string, { x: number; y: number }>,
  edges: ReadonlyArray<{ a: string; b: string; weight: number }>,
): StarLink[] {
  const known = new Set(articles.map((a) => a.id));
  const links: StarLink[] = [];
  const degree = new Map<string, number>();
  const seen = new Set<string>();
  for (const e of edges) {
    // The freshness gate validated the artifact; skip unknown/duplicate pairs
    // defensively so a hand-edited file degrades instead of drawing ghosts.
    if (!known.has(e.a) || !known.has(e.b) || e.a === e.b) continue;
    const key = e.a < e.b ? `${e.a}|${e.b}` : `${e.b}|${e.a}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({ a: e.a, b: e.b, weight: e.weight });
    degree.set(e.a, (degree.get(e.a) ?? 0) + 1);
    degree.set(e.b, (degree.get(e.b) ?? 0) + 1);
  }
  rescueOrphans(links, degree, articles, positions);
  return links;
}

/**
 * Compute related-article links from frontmatter `related` arrays.
 * Deduplicates bidirectional references (A→B and B→A produce one link).
 * Each link carries the constellation colors of both endpoints for gradient rendering.
 */
export function computeRelatedLinks(
  articles: Article[],
  colorByConstellation: ReadonlyMap<string, string>,
): RelatedLink[] {
  const seen = new Set<string>();
  const links: RelatedLink[] = [];
  const articleIds = new Set(articles.map((a) => a.id));
  const constellationOf = new Map(articles.map((a) => [a.id, a.constellation]));

  for (const article of articles) {
    for (const targetId of article.related) {
      if (targetId === article.id) continue; // self-reference: no degenerate link (M1)
      if (!articleIds.has(targetId)) continue;
      const key = article.id < targetId ? `${article.id}|${targetId}` : `${targetId}|${article.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const [a, b] = article.id < targetId ? [article.id, targetId] : [targetId, article.id];
      links.push({
        a,
        b,
        colorA: colorByConstellation.get(constellationOf.get(a) ?? '') ?? '#ffffff',
        colorB: colorByConstellation.get(constellationOf.get(b) ?? '') ?? '#ffffff',
      });
    }
  }
  // Deterministic order.
  links.sort((p, q) => (p.a + p.b).localeCompare(q.a + q.b));
  return links;
}
