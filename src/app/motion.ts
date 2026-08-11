/**
 * A1: the spec's quality floor promises reduced-motion support, and CSS rules
 * can't reach d3's canvas transitions — every animated view change must route
 * its duration through here.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function motionDuration(baseMs: number): number {
  return prefersReducedMotion() ? 0 : baseMs;
}
