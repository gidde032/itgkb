import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { GalaxyCanvas } from './GalaxyCanvas';
import type { StarPosition } from '../layout/types';

// P1 regression (audit: the twinkle loop repainted at ~30fps forever, even while
// idle). The loop must self-cancel after an idle window and resume on interaction.
// We drive requestAnimationFrame manually so the test is deterministic.

type RAFCb = FrameRequestCallback;
let nextHandle = 1;
const pending = new Map<number, RAFCb>();
let perfNow = 0;

function flushFrame(t: number): number {
  perfNow = t;
  const first = pending.entries().next();
  if (first.done) return pending.size;
  const [handle, cb] = first.value;
  pending.delete(handle);
  cb(t);
  return pending.size;
}

beforeEach(() => {
  nextHandle = 1;
  pending.clear();
  perfNow = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: RAFCb) => {
    const h = nextHandle++;
    pending.set(h, cb);
    return h;
  });
  vi.stubGlobal('cancelAnimationFrame', (h: number) => {
    pending.delete(h);
  });
  vi.spyOn(performance, 'now').mockImplementation(() => perfNow);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('GalaxyCanvas twinkle loop (P1 idle-gate)', () => {
  const props = {
    articles: [],
    constellations: [],
    positions: [] as StarPosition[],
    semanticEdges: null,
    selectedId: null,
    onSelect: () => {},
    matchIds: null,
    focus: null,
  };

  it('runs while active, self-cancels when idle, and resumes on interaction', () => {
    const { container } = render(<GalaxyCanvas {...props} />);
    const canvas = container.querySelector('canvas')!;

    // Mount with motion allowed → loop is running (one frame pending).
    expect(pending.size).toBe(1);

    // Frame at t=500ms (within IDLE_MS) → renders and reschedules.
    expect(flushFrame(500)).toBe(1);

    // Frame at t=3000ms (> IDLE_MS since last interaction at t=0) → goes idle,
    // does NOT reschedule. This is the fix: no perpetual repaint.
    expect(flushFrame(3000)).toBe(0);

    // A user interaction (mousemove) wakes the loop again.
    fireEvent.mouseMove(canvas);
    expect(pending.size).toBe(1);
  });

  it('does not start the loop when reduced motion is preferred', () => {
    const setReducedMotion = (globalThis as unknown as Record<string, (v: boolean) => void>)
      .__setReducedMotion;
    setReducedMotion(true);
    render(<GalaxyCanvas {...props} />);
    expect(pending.size).toBe(0);
  });
});
