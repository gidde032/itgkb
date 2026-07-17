import type { StarPosition } from '../layout/types';

export interface DisplayPoint {
  id: string;
  x: number;
  y: number;
  z: number;
}

export const PARALLAX = 0.05;

/**
 * Parallax depth cue: deeper stars (low z) lag slightly behind the pan,
 * nearer stars lead it. Draw AND hit-testing both consume these display
 * positions from this single function, so what you click is always what you
 * see (guards against the F1 class of divergence).
 */
export function displayPositions(
  positions: readonly StarPosition[],
  panX: number,
  panY: number,
  scale: number,
): DisplayPoint[] {
  const px = (panX / Math.max(scale, 0.0001)) * PARALLAX;
  const py = (panY / Math.max(scale, 0.0001)) * PARALLAX;
  return positions.map((p) => ({
    id: p.id,
    x: p.x + (p.z - 0.5) * px,
    y: p.y + (p.z - 0.5) * py,
    z: p.z,
  }));
}
