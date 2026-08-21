import type { Article, Constellation } from '../content/types';
import type { StarPosition } from '../layout/types';

/**
 * Showcase-mode depth expansion (#31 decision 1): the 3D renderer consumes the
 * SAME x,y as the 2D galaxy and derives real depth deterministically — each
 * constellation gets a curated z offset (constellations.json `depth.z`) and its
 * stars spread around it by `depth.spread` scaled by the star's existing
 * parallax z (a hash-derived uniform in [0,1]). No new LayoutProvider: this
 * transform sits downstream of the layout seam, so a future semantic layout
 * (#29) flows through it unchanged.
 */
export interface StarPosition3D {
  id: string;
  x: number;
  y: number;
  z: number;
}

/** Applied when a constellation omits `depth` (and to unknown constellations). */
export const DEFAULT_DEPTH: Readonly<{ z: number; spread: number }> = {
  z: 0,
  spread: 110,
};

export function expandDepth(
  positions: readonly StarPosition[],
  articles: readonly Article[],
  constellations: readonly Constellation[],
): StarPosition3D[] {
  const constellationByStar = new Map(articles.map((a) => [a.id, a.constellation]));
  const depthByConstellation = new Map(constellations.map((c) => [c.id, c.depth ?? DEFAULT_DEPTH]));
  return positions.map((p) => {
    const cid = constellationByStar.get(p.id);
    const d = (cid !== undefined ? depthByConstellation.get(cid) : undefined) ?? DEFAULT_DEPTH;
    return { id: p.id, x: p.x, y: p.y, z: d.z + (p.z - 0.5) * d.spread };
  });
}
