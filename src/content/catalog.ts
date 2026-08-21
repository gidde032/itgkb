import type { Article, Constellation } from './types';

/**
 * Render-neutral star metadata shared by the 2D galaxy and the 3D showcase
 * (#31). Extracted from GalaxyCanvas so both renderers number catalog ids
 * identically (GW-001, SEC-001, …) from one implementation.
 */
export interface CatalogStarMeta {
  color: string;
  stub: boolean;
  title: string;
  summary: string;
  /** Star-catalog id (e.g. GW-014) — the instrument-layer signature. */
  catalog: string;
}

/** Map of constellation id → accent color (star fill, halos, lines, labels). */
export function constellationColors(constellations: readonly Constellation[]): Map<string, string> {
  return new Map(constellations.map((c) => [c.id, c.color]));
}

/**
 * Build per-star render metadata. Catalog ids number per constellation in
 * article order (GW-001, GW-002, …), prefixed by the constellation's catalog
 * prefix (fallback ITG when a prefix is missing).
 */
export function catalogMeta(
  articles: readonly Article[],
  constellations: readonly Constellation[],
): Map<string, CatalogStarMeta> {
  const prefixByConstellation = new Map(constellations.map((c) => [c.id, c.prefix]));
  const colorByConstellation = constellationColors(constellations);
  const counters = new Map<string, number>();
  return new Map(
    articles.map((a) => {
      const n = (counters.get(a.constellation) ?? 0) + 1;
      counters.set(a.constellation, n);
      const prefix = prefixByConstellation.get(a.constellation) ?? 'ITG';
      return [
        a.id,
        {
          color: colorByConstellation.get(a.constellation) ?? '#ffffff',
          stub: a.stub,
          title: a.title,
          summary: a.summary,
          catalog: `${prefix}-${String(n).padStart(3, '0')}`,
        },
      ];
    }),
  );
}
