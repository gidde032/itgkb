import { describe, expect, it, vi } from 'vitest';
import { drawGalaxy } from './GalaxyCanvas';
import type { Constellation } from '../content/types';

// A3 regression: star titles must be drawn at the INITIAL zoom (k=0.8), not
// only after zooming past the old 0.9 threshold.
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
const scene = {
  points: [{ id: 's1', x: 10, y: 10, z: 0.5 }],
  meta: new Map([['s1', { color: '#ffffff', stub: false, title: 'Star Title', summary: 's' }]]),
  links: [],
  dust: [],
};
const transformAt = (k: number) =>
  ({ x: 0, y: 0, k }) as unknown as Parameters<typeof drawGalaxy>[5];

describe('star title visibility threshold (A3)', () => {
  it('draws titles at the initial zoom level k=0.8', () => {
    const { ctx, fillTexts } = makeRecordingCtx();
    drawGalaxy(ctx, 800, 600, scene, constellations, transformAt(0.8), null, null, null);
    expect(fillTexts()).toContain('Star Title');
  });
  it('hides titles when zoomed far out (k=0.5)', () => {
    const { ctx, fillTexts } = makeRecordingCtx();
    drawGalaxy(ctx, 800, 600, scene, constellations, transformAt(0.5), null, null, null);
    expect(fillTexts()).not.toContain('Star Title');
  });
});
