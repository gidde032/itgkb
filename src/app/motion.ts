/**
 * A1: the spec's quality floor promises reduced-motion support, and CSS rules
 * can't reach d3's canvas transitions — every animated view change must route
 * its duration through here.
 */
export function motionDuration(baseMs: number): number {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 0;
  }
  return baseMs;
}
