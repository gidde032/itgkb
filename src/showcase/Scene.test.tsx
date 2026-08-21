import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import * as THREE from 'three';

/**
 * Scene-level test: fiber/drei are mocked with real THREE objects behind them,
 * so the camera rig (frame requests, tween, HUD) and label projector run their
 * actual per-frame code. Custom-element warnings from r3f intrinsics under
 * jsdom are silenced — they are expected outside a real WebGL renderer.
 */

const h = vi.hoisted(() => ({
  frameCbs: [] as Array<(state: unknown) => void>,
  camera: null as THREE.PerspectiveCamera | null,
  controls: null as {
    target: THREE.Vector3;
    autoRotate: boolean;
    update: () => void;
    addEventListener: () => void;
    removeEventListener: () => void;
  } | null,
}));

vi.mock('@react-three/fiber', async () => {
  const THREE = await import('three');
  const camera = new THREE.PerspectiveCamera(50, 1, 2, 12000);
  camera.position.set(0, 200, 1000);
  h.camera = camera;
  return {
    useFrame: (cb: (state: unknown) => void) => {
      h.frameCbs.push(cb);
    },
    useThree: () => ({ camera, gl: {} }),
  };
});

vi.mock('@react-three/drei', async () => {
  const React = await import('react');
  const THREE = await import('three');
  const controls = {
    target: new THREE.Vector3(0, 0, 0),
    autoRotate: false,
    update: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  h.controls = controls;
  return {
    Line: () => null,
    OrbitControls: React.forwardRef(function OrbitControls(
      _props: unknown,
      ref: React.ForwardedRef<unknown>,
    ) {
      if (ref) (ref as { current: unknown }).current = controls;
      return null;
    }),
  };
});

import { Scene, type FrameRequest } from './Scene';
import { DEFAULT_VIEW_DIR } from './framing';

const meta = new Map([
  ['a', { color: '#e4b363', stub: false, title: 'Alpha', summary: 'sa', catalog: 'GW-001' }],
  ['b', { color: '#e4b363', stub: true, title: 'Beta', summary: 'sb', catalog: 'GW-002' }],
]);

function baseProps() {
  const hudRef = { current: null as HTMLSpanElement | null };
  const starLabelRef = { current: null as HTMLDivElement | null };
  const chipLabelRef = { current: null as HTMLDivElement | null };
  return {
    props: {
      positions3D: [
        { id: 'a', position: [0, 0, 0] as [number, number, number] },
        { id: 'b', position: [100, 50, 20] as [number, number, number] },
      ],
      meta,
      solidLinks: [
        {
          key: 'c|a|b',
          idA: 'a',
          idB: 'b',
          a: [0, 0, 0] as [number, number, number],
          b: [100, 50, 20] as [number, number, number],
          color: '#e4b363',
        },
      ],
      arcs: [
        {
          id: 'a|b',
          points: [
            [0, 0, 0],
            [50, 40, 10],
            [100, 50, 20],
          ] as [number, number, number][],
          colors: [
            [1, 0, 0],
            [0.5, 0.5, 0.5],
            [0, 0, 1],
          ] as [number, number, number][],
        },
      ],
      selectedId: null as string | null,
      hoveredId: null as string | null,
      matchIds: null as ReadonlySet<string> | null,
      positionById: new Map([
        ['a', [0, 0, 0] as [number, number, number]],
        ['b', [100, 50, 20] as [number, number, number]],
      ]),
      pointsByConstellation: new Map([
        [
          'gw',
          [
            [0, 0, 0],
            [100, 50, 20],
          ] as [number, number, number][],
        ],
      ]),
      chipPosById: new Map([
        ['gw', [0, 0, 50] as [number, number, number]],
        ['far', [0, 0, 300] as [number, number, number]],
      ]),
      allPoints: [
        [0, 0, 0],
        [100, 50, 20],
      ] as [number, number, number][],
      frameRef: { current: null as FrameRequest | null },
      hudRef,
      starLabelRef,
      chipLabelRef,
      orbitEnabled: true,
      reducedMotion: false,
      setAnimating: vi.fn(),
      onHover: vi.fn(),
      onSelectStar: vi.fn(),
    },
    refs: { hudRef, starLabelRef, chipLabelRef },
  };
}

function renderScene(overrides: Record<string, unknown> = {}) {
  const { props, refs } = baseProps();
  const merged = { ...props, ...overrides };
  const utils = render(
    <>
      <span ref={refs.hudRef} />
      <div ref={refs.starLabelRef}>
        <span data-id="a" className="s-label">
          <span className="s-label__title">Alpha</span>
        </span>
        <span data-id="b" className="s-label" />
      </div>
      <div ref={refs.chipLabelRef}>
        <button data-id="gw" className="c-label" type="button">
          Workspace
        </button>
        <button data-id="far" className="c-label" type="button">
          Far Side
        </button>
      </div>
      <Scene {...merged} />
    </>,
  );
  return { ...utils, props: merged, refs };
}

/** Drive every registered useFrame callback at time t. */
function tick(t: number) {
  const camera = h.camera;
  if (!camera) throw new Error('camera not initialized');
  const state = {
    clock: { elapsedTime: t },
    camera,
    size: { width: 1024, height: 768 },
  };
  for (const cb of [...h.frameCbs]) cb(state);
}

let warnSpy: ReturnType<typeof vi.spyOn>;

describe('Scene orbit management (#31 decision 5)', () => {
  beforeEach(() => {
    h.frameCbs.length = 0;
    if (h.camera) h.camera.position.set(0, 200, 1000);
    if (h.controls) {
      h.controls.autoRotate = false;
      h.controls.target.set(0, 0, 0);
    }
    warnSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
    (globalThis as unknown as { __setReducedMotion: (v: boolean) => void }).__setReducedMotion(
      false,
    );
  });

  it('enables auto-orbit on controls when the toggle is on', () => {
    renderScene();
    expect(h.controls?.autoRotate).toBe(true);
  });

  it('disables auto-orbit when the toggle is off', () => {
    renderScene({ orbitEnabled: false });
    expect(h.controls?.autoRotate).toBe(false);
  });

  // Review repair regression (a11y #7 / correctness #3): reduced motion is a
  // live value; orbit must be hard-off even with the toggle on.
  it('hard-disables auto-orbit when reduced motion is requested', () => {
    renderScene({ reducedMotion: true });
    expect(h.controls?.autoRotate).toBe(false);
  });
});

describe('Scene camera rig (#31 decisions 4, 13)', () => {
  beforeEach(() => {
    h.frameCbs.length = 0;
    if (h.camera) h.camera.position.set(0, 200, 1000);
    if (h.controls) {
      h.controls.autoRotate = false;
      h.controls.target.set(0, 0, 0);
    }
    warnSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
    (globalThis as unknown as { __setReducedMotion: (v: boolean) => void }).__setReducedMotion(
      false,
    );
  });

  it('tweens the camera toward a scene-frame request and reports done', () => {
    const setAnimating = vi.fn();
    const { props } = renderScene({ setAnimating });
    (props.frameRef as { current: FrameRequest | null }).current = {
      seq: 1,
      kind: 'scene',
    };
    tick(0.1); // starts the tween
    const startZ = h.camera!.position.z;
    tick(0.45); // midway
    expect(h.camera!.position.z).toBeLessThan(startZ);
    tick(1.0); // past the tween duration
    expect(setAnimating).toHaveBeenCalledWith(false);
    // Final position matches the framing distance for two nearby stars.
    expect(h.camera!.position.z).toBeGreaterThan(50);
    expect(h.camera!.position.z).toBeLessThan(600);
  });

  it('snaps instantly under reduced motion instead of tweening', () => {
    (globalThis as unknown as { __setReducedMotion: (v: boolean) => void }).__setReducedMotion(
      true,
    );
    const setAnimating = vi.fn();
    const { props } = renderScene({ setAnimating });
    (props.frameRef as { current: FrameRequest | null }).current = {
      seq: 2,
      kind: 'star',
      id: 'a',
    };
    tick(0.1);
    expect(setAnimating).toHaveBeenCalledWith(false);
    // Snapped to the frameStar distance (~130 radius framing), not tweening.
    expect(h.camera!.position.z).toBeGreaterThan(50);
    expect(h.camera!.position.z).toBeLessThan(600);
  });

  it('frames a constellation from its points (decision 13)', () => {
    const { props } = renderScene();
    (props.frameRef as { current: FrameRequest | null }).current = {
      seq: 3,
      kind: 'constellation',
      id: 'gw',
    };
    tick(0.1);
    tick(1.0);
    expect(h.controls?.target.x).toBeCloseTo(50, 0);
  });

  it('updates the HUD azimuth/elevation readout', () => {
    const { refs } = renderScene();
    tick(0.2);
    tick(0.4);
    expect(refs.hudRef.current?.textContent).toMatch(/^AZ \d+\.\d+° · EL [−+]\d+\.\d+°$/);
  });

  // Review repair regression (correctness #1 / contract #1): the rig used to
  // mutate the shared DEFAULT_VIEW_DIR constant, so after any directional
  // fly-to, "Reset view" returned to the captured bearing, not the default.
  it('reset returns to the default bearing after a directional fly-to', () => {
    const { props } = renderScene();
    // Point the camera far away from the default bearing before the fly-to.
    h.camera!.position.set(500, 0, 500);
    h.controls!.target.set(0, 0, 0);
    h.camera!.lookAt(0, 0, 0);
    h.camera!.updateMatrixWorld(true);
    (props.frameRef as { current: FrameRequest | null }).current = {
      seq: 1,
      kind: 'star',
      id: 'a',
    };
    tick(0.1);
    tick(1.0);
    // Reset must restore the DEFAULT_VIEW_DIR bearing (≈ (0, 0.33, 0.94)),
    // not the (0.707, 0, 0.707) bearing captured during the fly-to.
    (props.frameRef as { current: FrameRequest | null }).current = {
      seq: 2,
      kind: 'scene',
    };
    tick(1.1);
    tick(2.0);
    const dir = new THREE.Vector3().subVectors(h.camera!.position, h.controls!.target).normalize();
    const expected = new THREE.Vector3(
      DEFAULT_VIEW_DIR[0],
      DEFAULT_VIEW_DIR[1],
      DEFAULT_VIEW_DIR[2],
    ).normalize();
    expect(dir.dot(expected)).toBeGreaterThan(0.99);
  });

  // Review repair regression (correctness #2): the animating flag used to be
  // clearable only by a completed frame request, pinning frameloop='always'.
  it('self-heals the animating flag when no tween is running', () => {
    const setAnimating = vi.fn();
    renderScene({ setAnimating });
    tick(0.1); // no request issued, no tween running
    expect(setAnimating).toHaveBeenCalledWith(false);
  });
});

describe('Scene label projector (#31 decision 10)', () => {
  beforeEach(() => {
    h.frameCbs.length = 0;
    if (h.camera) h.camera.position.set(0, 200, 1000);
    if (h.controls) h.controls.target.set(0, 0, 0);
    warnSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => warnSpy.mockRestore());

  it('reveals star labels when the camera is close and hides them when far', () => {
    const { container } = renderScene();
    const label = container.querySelector<HTMLElement>('[data-id="a"]');
    const park = (x: number, y: number, z: number) => {
      h.camera!.position.set(x, y, z);
      h.camera!.lookAt(0, 0, 0);
      h.camera!.updateMatrixWorld(true);
    };
    // Park the camera within reveal distance of star 'a' at the origin.
    park(0, 50, 200);
    tick(0.1);
    expect(label?.classList.contains('s-label--on')).toBe(true);

    // Park the camera far away: labels hide.
    park(0, 0, 5000);
    tick(2.0);
    expect(label?.classList.contains('s-label--on')).toBe(false);
  });

  it('shows the title only for emphasized stars (hover/selection parity)', () => {
    const { container } = renderScene({ selectedId: 'a' });
    tick(0.1);
    const title = container.querySelector<HTMLElement>('[data-id="a"] .s-label__title');
    const other = container.querySelector<HTMLElement>('[data-id="b"] .s-label__title');
    expect(title?.style.display).toBe('inline');
    expect(other).toBeNull();
  });

  // Deep-zoom title parity (maintainer request 2026-08-21): close enough, the
  // one-line title shows on nearby labels without hover/selection — the 3D
  // counterpart of the 2D galaxy's k > 1.6 rule.
  it('shows titles on nearby labels when the camera is close, hides them when far', () => {
    const { container } = renderScene();
    const title = container.querySelector<HTMLElement>('[data-id="a"] .s-label__title');
    const park = (z: number) => {
      h.camera!.position.set(0, 0, z);
      h.camera!.lookAt(0, 0, 0);
      h.camera!.updateMatrixWorld(true);
    };
    park(200); // inside CLOSE_TITLE_DIST (300)
    tick(0.1);
    expect(title?.style.display).toBe('inline');
    park(500); // label still revealed (650) but past the title threshold
    tick(0.2);
    expect(title?.style.display).toBe('none');
  });

  // Review repair regression (contract #3): 2D parity — search-dimmed stars
  // carry no label, even when hovered/selected.
  it('suppresses labels for search-dimmed stars even when selected', () => {
    const { container } = renderScene({ selectedId: 'a', matchIds: new Set(['b']) });
    h.camera!.position.set(0, 50, 200);
    h.camera!.lookAt(0, 0, 0);
    h.camera!.updateMatrixWorld(true);
    tick(0.1);
    expect(container.querySelector('[data-id="a"]')?.classList.contains('s-label--on')).toBe(false);
  });

  // Review repair regression (a11y #1): a focused constellation chip that
  // rotates behind the camera is hidden — focus must be redirected, not
  // dropped to <body>.
  it('moves focus off a chip that rotates behind the camera', () => {
    const { container } = renderScene();
    const far = container.querySelector<HTMLElement>('[data-id="far"]');
    const near = container.querySelector<HTMLElement>('[data-id="gw"]');
    far!.focus();
    expect(document.activeElement).toBe(far);
    // Camera close to origin looking at it: 'gw' (z=50) stays in front,
    // 'far' (z=300) is behind the camera.
    h.camera!.position.set(0, 50, 200);
    h.camera!.lookAt(0, 0, 0);
    h.camera!.updateMatrixWorld(true);
    tick(0.5);
    expect(far!.style.display).toBe('none');
    expect(near!.style.display).toBe('block');
    expect(document.activeElement).toBe(near);
  });
});
