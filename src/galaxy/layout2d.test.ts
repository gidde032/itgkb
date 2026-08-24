import { describe, expect, it } from 'vitest';
import type { Article, Constellation } from '../content/types';
import type { StarPosition } from '../layout/types';
import { fitGalaxyView, layoutGalaxy2D } from './layout2d';

const constellations: Constellation[] = [
  { id: 'alpha', name: 'Alpha', anchor: { x: -100, y: 0 }, color: '#fff' },
  { id: 'beta', name: 'Beta', anchor: { x: 100, y: 0 }, color: '#fff' },
];

function article(id: string, constellation: string): Article {
  return {
    id,
    title: id,
    constellation,
    tags: [],
    summary: 'summary',
    stub: false,
    related: [],
    body: '',
    sourceName: `${id}.md`,
  };
}

const articles = [article('a1', 'alpha'), article('a2', 'alpha'), article('b1', 'beta')];
const positions: StarPosition[] = [
  { id: 'a1', x: 0, y: 0, z: 0.4 },
  { id: 'a2', x: 12, y: 0, z: 0.6 },
  { id: 'b1', x: 24, y: 0, z: 0.5 },
];

function centerOf(laid: readonly StarPosition[], ids: readonly string[]): { x: number; y: number } {
  const points = laid.filter((point) => ids.includes(point.id));
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

describe('layoutGalaxy2D', () => {
  it('separates growing constellation footprints without changing local shape or z', () => {
    const laid = layoutGalaxy2D(positions, articles, constellations);
    const alpha = centerOf(laid, ['a1', 'a2']);
    const beta = centerOf(laid, ['b1']);

    expect(Math.hypot(beta.x - alpha.x, beta.y - alpha.y)).toBeGreaterThan(150);
    expect(laid[1].x - laid[0].x).toBe(positions[1].x - positions[0].x);
    expect(laid.map((point) => point.z)).toEqual(positions.map((point) => point.z));
  });

  it('allocates more separation as a constellation gains articles', () => {
    const expandedArticles = [
      ...articles,
      ...Array.from({ length: 9 }, (_, index) => article(`a${index + 3}`, 'alpha')),
    ];
    const expandedPositions = [
      ...positions,
      ...Array.from({ length: 9 }, (_, index) => ({
        id: `a${index + 3}`,
        x: index * 2,
        y: (index % 3) * 2,
        z: 0.4,
      })),
    ];
    const expandedAlphaIds = expandedArticles
      .filter((article) => article.constellation === 'alpha')
      .map((article) => article.id);
    const baseLaid = layoutGalaxy2D(positions, articles, constellations);
    const expandedLaid = layoutGalaxy2D(expandedPositions, expandedArticles, constellations);

    const baseDistance = Math.hypot(
      centerOf(baseLaid, ['b1']).x - centerOf(baseLaid, ['a1', 'a2']).x,
      centerOf(baseLaid, ['b1']).y - centerOf(baseLaid, ['a1', 'a2']).y,
    );
    const expandedDistance = Math.hypot(
      centerOf(expandedLaid, ['b1']).x - centerOf(expandedLaid, expandedAlphaIds).x,
      centerOf(expandedLaid, ['b1']).y - centerOf(expandedLaid, expandedAlphaIds).y,
    );

    expect(expandedDistance).toBeGreaterThan(baseDistance);
  });

  it('is deterministic regardless of article iteration order', () => {
    expect(layoutGalaxy2D(positions, articles, constellations)).toEqual(
      layoutGalaxy2D(positions, [...articles].reverse(), constellations),
    );
  });
});

describe('fitGalaxyView', () => {
  it('frames the complete layout and preserves the existing overview ceiling', () => {
    const fitted = fitGalaxyView(800, 600, positions);
    expect(fitted.k).toBeGreaterThanOrEqual(0.3);
    expect(fitted.k).toBeLessThanOrEqual(0.8);
    expect(fitted.x).toBeTypeOf('number');
    expect(fitted.y).toBeTypeOf('number');
  });
});
