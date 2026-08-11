import { describe, expect, it } from 'vitest';
import { motionDuration, prefersReducedMotion } from './motion';

const setReduced = (v: boolean) =>
  (globalThis as unknown as { __setReducedMotion: (v: boolean) => void }).__setReducedMotion(v);

// A1 regression: canvas/d3 transitions must honor prefers-reduced-motion —
// CSS rules can't reach them, so this helper is the enforcement point.
describe('motionDuration (A1)', () => {
  it('passes durations through when motion is allowed', () => {
    expect(motionDuration(450)).toBe(450);
  });
  it('collapses to 0 under prefers-reduced-motion', () => {
    setReduced(true);
    expect(motionDuration(450)).toBe(0);
    expect(motionDuration(500)).toBe(0);
  });
});

describe('prefersReducedMotion', () => {
  it('reflects the media query', () => {
    setReduced(false);
    expect(prefersReducedMotion()).toBe(false);
    setReduced(true);
    expect(prefersReducedMotion()).toBe(true);
  });
});
