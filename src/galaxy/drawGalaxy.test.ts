import { describe, expect, it, vi } from 'vitest';
import { drawGalaxy } from './draw';
import type { Constellation } from '../content/types';

// Star labels (M3 #16): at the initial zoom stars carry a compact bracketed
// catalog id; the full title is revealed only on emphasis (hover/selection) or
// a deeper zoom, and is truncated so it never sprawls.
function makeRecordingCtx(): {
  ctx: CanvasRenderingContext2D;
  fillTexts: () => string[];
  setLineDashCalls: () => number[][];
  createLinearGradientCalls: () => number[][];
} {
  const fillText = vi.fn();
  const setLineDash = vi.fn();
  const createLinearGradient = vi.fn();
  const gradient = { addColorStop: vi.fn() };
  createLinearGradient.mockReturnValue(gradient);
  const ctx = new Proxy(
    { fillText, setLineDash, createLinearGradient },
    {
      get(target: Record<string, unknown>, prop: string) {
        if (prop in target) return target[prop];
        if (prop === 'createRadialGradient') {
          return vi.fn(() => gradient);
        }
        // Approximate metrics: 6px per character is enough to drive truncation.
        if (prop === 'measureText') return (t: string) => ({ width: String(t).length * 6 });
        if (!(prop in target)) target[prop] = vi.fn();
        return target[prop];
      },
      set(target: Record<string, unknown>, prop: string, value: unknown) {
        target[prop] = value;
        return true;
      },
    },
  ) as unknown as CanvasRenderingContext2D;
  return {
    ctx,
    fillTexts: () => fillText.mock.calls.map((c) => String(c[0])),
    setLineDashCalls: () => setLineDash.mock.calls.map((c) => c[0] as number[]),
    createLinearGradientCalls: () =>
      createLinearGradient.mock.calls.map((c) => c as unknown as number[]),
  };
}

const constellations: Constellation[] = [
  { id: 'c1', name: 'Group', anchor: { x: 0, y: 0 }, color: '#ffffff' },
];
const sceneWith = (title: string) => ({
  points: [{ id: 's1', x: 10, y: 10, z: 0.5 }],
  meta: new Map([
    ['s1', { color: '#ffffff', stub: false, title, summary: 's', catalog: 'GW-001' }],
  ]),
  links: [],
  relatedLinks: [],
  dust: [],
});
const scene = sceneWith('Star Title');
const transformAt = (k: number) =>
  ({ x: 0, y: 0, k }) as unknown as Parameters<typeof drawGalaxy>[5];

describe('star labels (#16)', () => {
  it('draws the bracketed catalog id — not the full title — at initial zoom k=0.8', () => {
    const { ctx, fillTexts } = makeRecordingCtx();
    drawGalaxy(ctx, 800, 600, scene, constellations, transformAt(0.8), null, null, null);
    const texts = fillTexts();
    expect(texts.some((t) => t.includes('GW-001'))).toBe(true);
    expect(texts).not.toContain('Star Title');
  });

  it('reveals the title when a star is emphasized (selected)', () => {
    const { ctx, fillTexts } = makeRecordingCtx();
    drawGalaxy(ctx, 800, 600, scene, constellations, transformAt(0.8), 's1', null, null);
    expect(fillTexts()).toContain('Star Title');
  });

  it('reveals the title past a deeper zoom (k=2)', () => {
    const { ctx, fillTexts } = makeRecordingCtx();
    drawGalaxy(ctx, 800, 600, scene, constellations, transformAt(2), null, null, null);
    expect(fillTexts()).toContain('Star Title');
  });

  it('truncates a long title with an ellipsis', () => {
    const { ctx, fillTexts } = makeRecordingCtx();
    const long = sceneWith(
      'A very long article title that would otherwise sprawl across the galaxy',
    );
    drawGalaxy(ctx, 800, 600, long, constellations, transformAt(2), null, null, null);
    expect(fillTexts().some((t) => t.endsWith('…') && t.length < 71)).toBe(true);
  });

  it('culls a lower-priority label when two would collide', () => {
    const { ctx, fillTexts } = makeRecordingCtx();
    const cluster = {
      points: [
        { id: 's1', x: 10, y: 10, z: 0.9 },
        { id: 's2', x: 12, y: 10, z: 0.1 },
      ],
      meta: new Map([
        ['s1', { color: '#fff', stub: false, title: 'Alpha', summary: 's', catalog: 'GW-001' }],
        ['s2', { color: '#fff', stub: false, title: 'Beta', summary: 's', catalog: 'GW-002' }],
      ]),
      links: [],
      relatedLinks: [],
      dust: [],
    };
    drawGalaxy(ctx, 800, 600, cluster, constellations, transformAt(2), null, null, null);
    const texts = fillTexts();
    // Nearer star (higher z) wins; the colliding one is dropped.
    expect(texts.some((t) => t.includes('GW-001'))).toBe(true);
    expect(texts.some((t) => t.includes('GW-002'))).toBe(false);
  });

  it('applies twinkle without error when an amplitude is set', () => {
    const { ctx, fillTexts } = makeRecordingCtx();
    drawGalaxy(ctx, 800, 600, scene, constellations, transformAt(1), null, null, null, 1500, 0.12);
    expect(fillTexts().some((t) => t.includes('GW-001'))).toBe(true);
  });

  it('hides labels entirely when zoomed far out (k=0.5)', () => {
    const { ctx, fillTexts } = makeRecordingCtx();
    drawGalaxy(ctx, 800, 600, scene, constellations, transformAt(0.5), null, null, null);
    const texts = fillTexts();
    expect(texts.some((t) => t.includes('GW-001'))).toBe(false);
    expect(texts).not.toContain('Star Title');
  });
});

describe('related lines (#39)', () => {
  const relatedScene = {
    points: [
      { id: 's1', x: 10, y: 10, z: 0.5 },
      { id: 's2', x: 100, y: 100, z: 0.5 },
    ],
    meta: new Map([
      ['s1', { color: '#aaa', stub: false, title: 'A', summary: 's', catalog: 'GW-001' }],
      ['s2', { color: '#bbb', stub: false, title: 'B', summary: 's', catalog: 'GW-002' }],
    ]),
    links: [],
    relatedLinks: [{ a: 's1', b: 's2', colorA: '#aaa', colorB: '#bbb' }],
    dust: [],
  };

  it('does not draw related lines when overlay is off and no star is selected', () => {
    const { ctx, setLineDashCalls } = makeRecordingCtx();
    drawGalaxy(ctx, 800, 600, relatedScene, constellations, transformAt(1), null, null, null);
    // setLineDash with a dashed pattern (non-empty array) should not appear.
    const dashedCalls = setLineDashCalls().filter((d) => d.length > 0);
    expect(dashedCalls).toHaveLength(0);
  });

  it('draws related lines when overlay is toggled on', () => {
    const { ctx, createLinearGradientCalls, setLineDashCalls } = makeRecordingCtx();
    drawGalaxy(
      ctx,
      800,
      600,
      relatedScene,
      constellations,
      transformAt(1),
      null,
      null,
      null,
      0,
      0,
      true,
    );
    // Should create a linear gradient for the related line.
    expect(createLinearGradientCalls().length).toBeGreaterThanOrEqual(1);
    // Should use dashed line pattern.
    const dashedCalls = setLineDashCalls().filter((d) => d.length > 0);
    expect(dashedCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('draws only selected star related lines when overlay is off but star is selected', () => {
    const { ctx, createLinearGradientCalls } = makeRecordingCtx();
    drawGalaxy(
      ctx,
      800,
      600,
      relatedScene,
      constellations,
      transformAt(1),
      's1',
      null,
      null,
      0,
      0,
      false,
    );
    // Should draw the related line for the selected star.
    expect(createLinearGradientCalls().length).toBeGreaterThanOrEqual(1);
  });

  it('does not draw unrelated lines when a star is selected and overlay is off', () => {
    const threeStarScene = {
      ...relatedScene,
      points: [...relatedScene.points, { id: 's3', x: 200, y: 200, z: 0.5 }],
      meta: new Map([
        ...relatedScene.meta,
        ['s3', { color: '#ccc', stub: false, title: 'C', summary: 's', catalog: 'GW-003' }],
      ]),
      relatedLinks: [
        { a: 's1', b: 's2', colorA: '#aaa', colorB: '#bbb' },
        { a: 's2', b: 's3', colorA: '#bbb', colorB: '#ccc' },
      ],
    };
    const { ctx, createLinearGradientCalls } = makeRecordingCtx();
    // Select s1 — should only draw s1↔s2, not s2↔s3.
    drawGalaxy(
      ctx,
      800,
      600,
      threeStarScene,
      constellations,
      transformAt(1),
      's1',
      null,
      null,
      0,
      0,
      false,
    );
    // Only 1 linear gradient for the related line (s1↔s2).
    // Note: createLinearGradient is also not called for constellation lines, so count should be 1.
    expect(createLinearGradientCalls().length).toBe(1);
  });
});
