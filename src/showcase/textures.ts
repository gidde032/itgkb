import * as THREE from 'three';
import { hashString } from '../util/hash';

/**
 * Sprite textures for the showcase renderer (#31 decision 9: sprite glow, no
 * post-processing). Built mathematically as DataTextures — no 2D canvas
 * context needed, so they construct in any environment (tests included) and
 * are byte-for-byte deterministic.
 */

function makeRadialTexture(
  size: number,
  alpha: (radius01: number, angle: number) => number,
): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  const c = (size - 1) / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - c) / c;
      const dy = (y - c) / c;
      const r = Math.min(1, Math.hypot(dx, dy));
      const a = Math.max(0, Math.min(1, alpha(r, Math.atan2(dy, dx))));
      const i = (y * size + x) * 4;
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.round(a * 255);
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  return tex;
}

let glowTex: THREE.DataTexture | null = null;
let ringTex: THREE.DataTexture | null = null;
let dashedRingTex: THREE.DataTexture | null = null;

/** Soft white glow: bright core falling off like the 2D radial gradient. */
export function getGlowTexture(): THREE.DataTexture {
  glowTex ??= makeRadialTexture(96, (r) => (r < 0.18 ? 1 : Math.pow(1 - (r - 0.18) / 0.82, 2.4)));
  return glowTex;
}

/** Solid ring (selection halo, tinted at draw time). */
export function getRingTexture(): THREE.DataTexture {
  ringTex ??= makeRadialTexture(96, (r) => Math.max(0, 1 - Math.abs(r - 0.74) / 0.09) ** 1.5);
  return ringTex;
}

/** Dashed ring (stub styling — the 3D counterpart of the 2D dashed circle). */
export function getDashedRingTexture(): THREE.DataTexture {
  dashedRingTex ??= makeRadialTexture(96, (r, angle) => {
    const ring = Math.max(0, 1 - Math.abs(r - 0.74) / 0.11) ** 1.5;
    // 8 dashes around the circle; deterministic by construction.
    const dash = (((angle + Math.PI) / (Math.PI * 2)) * 8) % 1 < 0.62 ? 1 : 0;
    return ring * dash;
  });
  return dashedRingTex;
}

/**
 * Deterministic background dust: `count` points scattered in a spherical shell
 * (radius 500–1500) around the galaxy — the 3D counterpart of the 2D dust
 * layer. Returns a flat Float32Array of xyz triples.
 */
export function dustPositions3D(count: number): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const h1 = hashString(`dust3-x-${i}`);
    const h2 = hashString(`dust3-y-${i}`);
    const h3 = hashString(`dust3-z-${i}`);
    const h4 = hashString(`dust3-r-${i}`);
    // Uniform direction from three hashes, radius from the fourth.
    const u = (h1 % 1000) / 999 - 0.5;
    const v = (h2 % 1000) / 999 - 0.5;
    const w = (h3 % 1000) / 999 - 0.5;
    const len = Math.hypot(u, v, w) || 1;
    const radius = 500 + (h4 % 1000) * 1.0;
    out[i * 3] = (u / len) * radius;
    out[i * 3 + 1] = (v / len) * radius * 0.7; // slightly flattened halo
    out[i * 3 + 2] = (w / len) * radius;
  }
  return out;
}
