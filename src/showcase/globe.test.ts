import { describe, expect, it } from 'vitest';
import {
  anchorDirection,
  angleBetween,
  projectGlobe,
  GLOBE_RADIUS,
  SHELL_THICKNESS,
} from './globe';
import type { Article, Constellation } from '../content/types';
import type { StarPosition } from '../layout/types';

const constellations: Constellation[] = [
  {
    id: 'alpha',
    name: 'Alpha',
    anchor: { x: -320, y: -160 },
    color: '#e4b363',
    prefix: 'ALP',
  },
  {
    id: 'beta',
    name: 'Beta',
    anchor: { x: 400, y: 80 },
    color: '#dd6070',
    prefix: 'BET',
  },
];

function article(id: string, constellation: string): Article {
  return {
    id,
    title: id,
    constellation,
    tags: [],
    summary: '',
    stub: false,
    related: [],
    body: '',
    sourceName: `${id}.md`,
  };
}

function pos(id: string, x: number, y: number, z: number): StarPosition {
  return { id, x, y, z };
}

describe('anchorDirection', () => {
  it('returns unit vectors', () => {
    for (const anchor of [
      { x: -320, y: -160 },
      { x: 400, y: 80 },
      { x: 0, y: 0 },
      { x: 0, y: -320 },
    ]) {
      const d = anchorDirection(anchor);
      expect(Math.hypot(d[0], d[1], d[2])).toBeCloseTo(1, 9);
    }
  });
  it('maps negative anchor y to the northern hemisphere', () => {
    const d = anchorDirection({ x: 0, y: -320 });
    expect(d[1]).toBeGreaterThan(0.9);
  });
});

describe('projectGlobe (#31 globe amendment, 2026-08-21)', () => {
  it('places every real-content star in a thin shell around the globe radius', async () => {
    const { loadContent } = await import('../content/load');
    const { CuratedForceLayout } = await import('../layout/curatedForce');
    const content = loadContent();
    const laid = new CuratedForceLayout().layout(content.articles, content.constellations);
    const out = projectGlobe(laid, content.articles, content.constellations);
    expect(out).toHaveLength(content.articles.length);
    for (const p of out) {
      const r = Math.hypot(p.x, p.y, p.z);
      expect(r).toBeGreaterThanOrEqual(GLOBE_RADIUS - SHELL_THICKNESS / 2 - 1e-6);
      expect(r).toBeLessThanOrEqual(GLOBE_RADIUS + SHELL_THICKNESS / 2 + 1e-6);
    }
  });

  it('keeps each figure cohesive — every star near its constellation direction', async () => {
    const { loadContent } = await import('../content/load');
    const { CuratedForceLayout } = await import('../layout/curatedForce');
    const content = loadContent();
    const laid = new CuratedForceLayout().layout(content.articles, content.constellations);
    const out = projectGlobe(laid, content.articles, content.constellations);
    const byId = new Map(out.map((p) => [p.id, p]));
    const anchorById = new Map(content.constellations.map((c) => [c.id, c.anchor]));
    for (const a of content.articles) {
      const p = byId.get(a.id);
      const anchor = anchorById.get(a.constellation);
      if (!p || !anchor) continue;
      expect(angleBetween([p.x, p.y, p.z], anchorDirection(anchor))).toBeLessThan(
        (22 * Math.PI) / 180,
      );
    }
  });

  it('separates the curated constellations around the globe', async () => {
    const { loadContent } = await import('../content/load');
    const content = loadContent();
    const dirs = content.constellations.map((c) => anchorDirection(c.anchor));
    for (let i = 0; i < dirs.length; i++) {
      for (let j = i + 1; j < dirs.length; j++) {
        expect(angleBetween(dirs[i], dirs[j])).toBeGreaterThan((15 * Math.PI) / 180);
      }
    }
  });

  it('preserves local figure offsets — larger 2D offset lands further from the figure center', () => {
    const articles = [article('near', 'alpha'), article('far', 'alpha')];
    const positions = [
      pos('near', -320 + 20, -160 + 10, 0.5),
      pos('far', -320 + 120, -160 + 40, 0.5),
    ];
    const out = projectGlobe(positions, articles, constellations);
    const dir = anchorDirection(constellations[0].anchor);
    const byId = new Map(out.map((p) => [p.id, p]));
    const nearAngle = angleBetween(
      [byId.get('near')!.x, byId.get('near')!.y, byId.get('near')!.z],
      dir,
    );
    const farAngle = angleBetween(
      [byId.get('far')!.x, byId.get('far')!.y, byId.get('far')!.z],
      dir,
    );
    expect(farAngle).toBeGreaterThan(nearAngle);
    expect(nearAngle).toBeGreaterThan(0);
  });

  it('is deterministic — same inputs, same outputs', () => {
    const articles = [article('a1', 'alpha'), article('b1', 'beta')];
    const positions = [pos('a1', -300, -150, 0.9), pos('b1', 380, 60, 0.2)];
    expect(projectGlobe(positions, articles, constellations)).toEqual(
      projectGlobe(positions, articles, constellations),
    );
  });

  it('falls back to the globe center direction for unknown constellations', () => {
    const articles = [article('orphan', 'unknown-constellation')];
    const out = projectGlobe([pos('orphan', 10, 10, 0.5)], articles, constellations);
    // Fallback anchor (0,0) → lon 0, lat 0 → +Z direction.
    expect(out[0].z).toBeGreaterThan(0);
    expect(Math.hypot(out[0].x, out[0].y, out[0].z)).toBeCloseTo(GLOBE_RADIUS, 6);
  });
});
