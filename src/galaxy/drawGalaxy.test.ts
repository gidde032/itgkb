import { describe, expect, it, vi } from 'vitest';
import { drawGalaxy } from './GalaxyCanvas';
import type { Constellation } from '../content/types';

// Star labels (M3 #16): at the initial zoom stars carry a compact bracketed
// catalog id; the full title is revealed only on emphasis (hover/selection) or
// a deeper zoom, and is truncated so it never sprawls.
function makeRecordingCtx(): { ctx: CanvasRenderingContext2D; fillTexts: () => string[] } {
  const fillText = vi.fn();
  const gradient = { addColorStop: vi.fn() };
  const ctx = new Proxy(
    { fillText },
    {
      get(target: Record<string, unknown>, prop: string) {
        if (prop in target) return target[prop];
        if (prop === 'createRadialGradient' || prop === 'createLinearGradient') {
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
  return { ctx, fillTexts: () => fillText.mock.calls.map((c) => String(c[0])) };
}

const constellations: Constellation[] = [
  { id: 'c1', name: 'Group', anchor: { x: 0, y: 0 }, color: '#ffffff' },
];
const sceneWith = (title: string) => ({
  points: [{ id: 's1', x: 10, y: 10, z: 0.5 }],
  meta: new Map([['s1', { color: '#ffffff', stub: false, title, summary: 's', catalog: 'GW-001' }]]),
  links: [],
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
    const long = sceneWith('A very long article title that would otherwise sprawl across the galaxy');
    drawGalaxy(ctx, 800, 600, long, constellations, transformAt(2), null, null, null);
    expect(fillTexts().some((t) => t.endsWith('…') && t.length < 71)).toBe(true);
  });

  it('hides labels entirely when zoomed far out (k=0.5)', () => {
    const { ctx, fillTexts } = makeRecordingCtx();
    drawGalaxy(ctx, 800, 600, scene, constellations, transformAt(0.5), null, null, null);
    const texts = fillTexts();
    expect(texts.some((t) => t.includes('GW-001'))).toBe(false);
    expect(texts).not.toContain('Star Title');
  });
});
