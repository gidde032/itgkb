/**
 * Deterministic 32-bit FNV-1a hash for stable per-article jitter, z-depth, and
 * twinkle phase. Lives in a shared util so the layout layer (force jitter) and
 * the renderer (twinkle/dust) consume one implementation and neither reaches
 * across the other (audit P4: draw.ts was importing this from layout internals).
 */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
