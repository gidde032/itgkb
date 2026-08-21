import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Line, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type { CatalogStarMeta } from '../content/catalog';
import type { RelatedArc, Vec3 } from './arcGeometry';
import { framePoints, frameStar, DEFAULT_VIEW_DIR, type Frame } from './framing';
import { GLOBE_RADIUS } from './globe';
import { prefersReducedMotion } from '../app/motion';
import { getGlowTexture, getRingTexture, getDashedRingTexture, dustPositions3D } from './textures';

/**
 * Showcase scene (#31): the WebGL composition layer. Everything computable
 * (depth expansion, arc geometry, framing math) lives in pure sibling modules
 * with unit tests; this file only wires those results into react-three-fiber.
 */

/** Idle auto-orbit resumes this long after the user stops dragging (decision 5). */
const ORBIT_RESUME_MS = 2200;
/** Camera closer than this to a star reveals its catalog label (2D-parity rule). */
export const LABEL_REVEAL_DIST = 650;
const STAR_CORE = '#fbf6ee';
const SELECT_RING_COLOR = '#f2a0a6';
const TWEEN_S = 0.7;

/** Camera moves requested by the wrapper (fly-to, framing, reset). */
export type FrameRequest =
  | { seq: number; kind: 'scene' }
  | { seq: number; kind: 'star'; id: string }
  | { seq: number; kind: 'constellation'; id: string };

export interface SolidLink {
  key: string;
  idA: string;
  idB: string;
  a: Vec3;
  b: Vec3;
  color: string;
}

export interface SceneProps {
  positions3D: readonly { id: string; position: Vec3 }[];
  meta: ReadonlyMap<string, CatalogStarMeta>;
  solidLinks: readonly SolidLink[];
  arcs: readonly RelatedArc[];
  selectedId: string | null;
  hoveredId: string | null;
  matchIds: ReadonlySet<string> | null;
  /** Star positions by id (framing + label projection). */
  positionById: ReadonlyMap<string, Vec3>;
  /** Framing targets for the clickable constellation chips (decision 13). */
  pointsByConstellation: ReadonlyMap<string, readonly Vec3[]>;
  /** Where each constellation's clickable name chip floats (world space). */
  chipPosById: ReadonlyMap<string, Vec3>;
  allPoints: readonly Vec3[];
  frameRef: React.MutableRefObject<FrameRequest | null>;
  hudRef: React.RefObject<HTMLSpanElement>;
  starLabelRef: React.RefObject<HTMLDivElement>;
  chipLabelRef: React.RefObject<HTMLDivElement>;
  orbitEnabled: boolean;
  /** Live prefers-reduced-motion value (subscribed, not snapshotted). */
  reducedMotion: boolean;
  setAnimating: (v: boolean) => void;
  onHover: (id: string | null, clientX: number, clientY: number) => void;
  onSelectStar: (id: string) => void;
}

// ---------------- Background dust ----------------

function Dust({ count }: { count: number }): JSX.Element {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(dustPositions3D(count), 3));
    return g;
  }, [count]);
  // Review repair (correctness #4): the geometry is created outside JSX, so r3f
  // will not auto-dispose it — each List↔3D round trip leaked one GPU buffer.
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <points geometry={geometry} frustumCulled={false}>
      {/* Bugfix (2026-08-21 review): dust MUST NOT attenuate with distance — a
          point near the camera ballooned to ~90% of the screen and blocked the
          view. Constant pixel size + a shell outside the camera's reach. */}
      <pointsMaterial
        size={2.5}
        color="#aebcd8"
        transparent
        opacity={0.4}
        sizeAttenuation={false}
        depthWrite={false}
      />
    </points>
  );
}

// ---------------- Stars ----------------

interface StarProps {
  id: string;
  position: Vec3;
  meta: CatalogStarMeta;
  dimmed: boolean;
  emphasized: boolean;
  selected: boolean;
  onHover: SceneProps['onHover'];
  onSelectStar: SceneProps['onSelectStar'];
}

function StarObject({
  id,
  position,
  meta,
  dimmed,
  emphasized,
  selected,
  onHover,
  onSelectStar,
}: StarProps): JSX.Element {
  const glowScale = emphasized ? 29 : 21;
  const glowOpacity = dimmed ? 0.07 : meta.stub ? 0.38 : emphasized ? 1 : 0.85;
  const coreOpacity = dimmed ? 0.15 : meta.stub ? 0.6 : 1;
  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(id, e.nativeEvent.clientX, e.nativeEvent.clientY);
  };
  const out = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(null, 0, 0);
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelectStar(id);
  };
  return (
    <group position={position}>
      <sprite scale={[glowScale, glowScale, 1]}>
        <spriteMaterial
          map={getGlowTexture()}
          color={meta.color}
          transparent
          opacity={glowOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      <mesh>
        <sphereGeometry args={[meta.stub ? 2.3 : 3, 10, 10]} />
        <meshBasicMaterial color={STAR_CORE} transparent opacity={coreOpacity} />
      </mesh>
      {/* Generous invisible hit target (2026-08-21 fix): a dedicated
          transparent sphere keeps far-view clicking easy without depending on
          the glow sprite's visual opacity. */}
      <mesh onPointerOver={over} onPointerOut={out} onClick={click}>
        <sphereGeometry args={[8, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {meta.stub && (
        <sprite scale={[11, 11, 1]}>
          <spriteMaterial
            map={getDashedRingTexture()}
            color={meta.color}
            transparent
            opacity={dimmed ? 0.08 : 0.6}
            depthWrite={false}
          />
        </sprite>
      )}
      {selected && (
        <sprite scale={[13.5, 13.5, 1]}>
          <spriteMaterial
            map={getRingTexture()}
            color={SELECT_RING_COLOR}
            transparent
            opacity={0.9}
            depthWrite={false}
          />
        </sprite>
      )}
    </group>
  );
}

// ---------------- Camera rig (tweens + HUD) ----------------

interface Tween {
  fromPos: Vec3;
  fromTgt: Vec3;
  toPos: Vec3;
  toTgt: Vec3;
  t0: number;
  dur: number;
}

interface CameraRigProps {
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  frameRef: SceneProps['frameRef'];
  hudRef: SceneProps['hudRef'];
  positionById: SceneProps['positionById'];
  pointsByConstellation: SceneProps['pointsByConstellation'];
  allPoints: SceneProps['allPoints'];
  setAnimating: SceneProps['setAnimating'];
}

function CameraRig({
  controlsRef,
  frameRef,
  hudRef,
  positionById,
  pointsByConstellation,
  allPoints,
  setAnimating,
}: CameraRigProps): JSX.Element | null {
  const { camera } = useThree();
  const tweenRef = useRef<Tween | null>(null);
  const lastSeqRef = useRef(-1);
  const hudAtRef = useRef(0);
  const dirScratch = useRef(new THREE.Vector3());

  useFrame((state) => {
    const now = state.clock.elapsedTime;
    const controls = controlsRef.current;

    const req = frameRef.current;
    if (req && req.seq !== lastSeqRef.current) {
      lastSeqRef.current = req.seq;
      // Frame from the CURRENT view direction so the move feels continuous
      // with where the user is looking (reset returns to the default bearing).
      // Review repair (correctness #1 / contract #1): copy the constant —
      // mutating DEFAULT_VIEW_DIR in place corrupted every later reset.
      const dir: Vec3 = [...DEFAULT_VIEW_DIR];
      if (controls) {
        const d = dirScratch.current.subVectors(camera.position, controls.target);
        if (d.lengthSq() > 1e-6) {
          d.normalize();
          dir[0] = d.x;
          dir[1] = d.y;
          dir[2] = d.z;
        }
      }
      let frame: Frame | null = null;
      if (req.kind === 'star') {
        const p = positionById.get(req.id);
        if (p) frame = frameStar(p, dir);
      } else if (req.kind === 'constellation') {
        const pts = pointsByConstellation.get(req.id);
        if (pts) frame = framePoints(pts, dir);
      } else {
        frame = framePoints(allPoints, DEFAULT_VIEW_DIR);
      }
      if (!frame) {
        setAnimating(false);
      } else if (prefersReducedMotion() || !controls) {
        camera.position.set(frame.position[0], frame.position[1], frame.position[2]);
        controls?.target.set(frame.target[0], frame.target[1], frame.target[2]);
        controls?.update();
        setAnimating(false);
      } else {
        tweenRef.current = {
          fromPos: camera.position.toArray() as unknown as Vec3,
          fromTgt: controls.target.toArray() as unknown as Vec3,
          toPos: frame.position,
          toTgt: frame.target,
          t0: now,
          dur: TWEEN_S,
        };
      }
    }

    const tw = tweenRef.current;
    if (tw) {
      const t = Math.min(1, (now - tw.t0) / tw.dur);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const lerp = (a: number, b: number) => a + (b - a) * e;
      camera.position.set(
        lerp(tw.fromPos[0], tw.toPos[0]),
        lerp(tw.fromPos[1], tw.toPos[1]),
        lerp(tw.fromPos[2], tw.toPos[2]),
      );
      controls?.target.set(
        lerp(tw.fromTgt[0], tw.toTgt[0]),
        lerp(tw.fromTgt[1], tw.toTgt[1]),
        lerp(tw.fromTgt[2], tw.toTgt[2]),
      );
      controls?.update();
      if (t >= 1) {
        tweenRef.current = null;
        setAnimating(false);
      }
    } else {
      // Review repair (correctness #2): self-heal the render-loop flag — if no
      // tween is running, nothing needs 'always'. setState with the same value
      // is a React no-op, so this is free per frame.
      setAnimating(false);
    }

    // HUD (throttled): azimuth/elevation of the camera about the orbit target —
    // the 3D counterpart of the galaxy's RA/DEC readout.
    const hud = hudRef.current;
    if (hud && now - hudAtRef.current > 0.15) {
      hudAtRef.current = now;
      const t = controls?.target;
      const dx = camera.position.x - (t?.x ?? 0);
      const dy = camera.position.y - (t?.y ?? 0);
      const dz = camera.position.z - (t?.z ?? 0);
      const az = (Math.atan2(dx, dz) * (180 / Math.PI) + 360) % 360;
      const el = Math.asin(dy / (Math.hypot(dx, dy, dz) || 1)) * (180 / Math.PI);
      hud.textContent = `AZ ${az.toFixed(1)}° · EL ${el >= 0 ? '+' : '−'}${Math.abs(el).toFixed(1)}°`;
    }
  });
  return null;
}

// ---------------- DOM label projection ----------------

const placeScratch = new THREE.Vector3();
const distScratch = new THREE.Vector3();

interface LabelProjectorProps {
  starLabelRef: SceneProps['starLabelRef'];
  chipLabelRef: SceneProps['chipLabelRef'];
  selectedId: string | null;
  hoveredId: string | null;
  matchIds: SceneProps['matchIds'];
  positionById: SceneProps['positionById'];
  chipPosById: ReadonlyMap<string, Vec3>;
}

function LabelProjector({
  starLabelRef,
  chipLabelRef,
  selectedId,
  hoveredId,
  matchIds,
  positionById,
  chipPosById,
}: LabelProjectorProps): JSX.Element | null {
  const starEls = useRef<Map<string, HTMLElement> | null>(null);
  const chipEls = useRef<Map<string, HTMLElement> | null>(null);

  useEffect(() => {
    const collect = (container: HTMLDivElement | null) => {
      const m = new Map<string, HTMLElement>();
      if (container) {
        for (const el of Array.from(container.querySelectorAll<HTMLElement>('[data-id]'))) {
          const id = el.dataset.id;
          if (id) m.set(id, el);
        }
      }
      return m;
    };
    starEls.current = collect(starLabelRef.current);
    chipEls.current = collect(chipLabelRef.current);
  }, [starLabelRef, chipLabelRef]);

  useFrame(({ camera, size }) => {
    const place = (el: HTMLElement, p: Vec3, dx: number, dy: number): boolean => {
      placeScratch.set(p[0], p[1], p[2]).project(camera);
      if (placeScratch.z > 1 || placeScratch.z < -1) return false; // behind the camera
      const x = (placeScratch.x * 0.5 + 0.5) * size.width + dx;
      const y = (-placeScratch.y * 0.5 + 0.5) * size.height + dy;
      el.style.transform = `translate(${x}px, ${y}px)`;
      return true;
    };

    for (const [id, p] of positionById) {
      const el = starEls.current?.get(id);
      if (!el) continue;
      // Review repair (contract #3): 2D parity — search-dimmed stars carry no
      // label, even when hovered/selected (draw.ts suppresses labels for
      // non-matches the same way).
      const dimmed = matchIds !== null && !matchIds.has(id);
      const emphasized = !dimmed && (id === selectedId || id === hoveredId);
      const near =
        camera.position.distanceTo(distScratch.set(p[0], p[1], p[2])) < LABEL_REVEAL_DIST;
      const placed = place(el, p, 12, -8);
      el.classList.toggle('s-label--on', placed && !dimmed && (emphasized || near));
      const title = el.querySelector<HTMLElement>('.s-label__title');
      if (title) title.style.display = emphasized ? 'inline' : 'none';
    }

    for (const [cid, p] of chipPosById) {
      const el = chipEls.current?.get(cid);
      if (!el) continue;
      const placed = place(el, p, 0, -16);
      el.style.display = placed ? 'block' : 'none';
    }

    // Review repair (a11y #1): a focused chip rotating behind the camera is
    // display:none'd out of the accessibility tree, which would drop focus to
    // <body>. Redirect focus to the first still-visible chip before that
    // happens so keyboard users keep their place.
    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      active.classList.contains('c-label') &&
      active.style.display === 'none'
    ) {
      const firstVisible = Array.from(chipEls.current?.values() ?? []).find(
        (el) => el.style.display !== 'none',
      );
      firstVisible?.focus();
    }
  });
  return null;
}

// ---------------- Scene ----------------

export function Scene(props: SceneProps): JSX.Element {
  const {
    positions3D,
    meta,
    solidLinks,
    arcs,
    selectedId,
    hoveredId,
    matchIds,
    positionById,
    pointsByConstellation,
    allPoints,
    frameRef,
    hudRef,
    starLabelRef,
    chipLabelRef,
    chipPosById,
    orbitEnabled,
    reducedMotion,
    setAnimating,
    onHover,
    onSelectStar,
  } = props;
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  // Decision 5: idle auto-orbit — on while enabled, yields instantly to input,
  // resumes after stillness, hard-off under reduced motion. Review repair
  // (a11y #7 / correctness #3): reduced motion arrives as a live prop (the
  // wrapper subscribes to the media query), not a mount-time snapshot, so an
  // OS preference change mid-session takes effect immediately.
  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    let paused = false;
    let timer: number | undefined;
    const apply = () => {
      c.autoRotate = orbitEnabled && !reducedMotion && !paused;
    };
    const onStart = () => {
      paused = true;
      apply();
      if (timer) window.clearTimeout(timer);
    };
    const onEnd = () => {
      timer = window.setTimeout(() => {
        paused = false;
        apply();
      }, ORBIT_RESUME_MS);
    };
    c.addEventListener('start', onStart);
    c.addEventListener('end', onEnd);
    apply();
    return () => {
      c.removeEventListener('start', onStart);
      c.removeEventListener('end', onEnd);
      if (timer) window.clearTimeout(timer);
    };
  }, [orbitEnabled, reducedMotion]);

  return (
    <>
      <color attach="background" args={['#070b14']} />
      <fogExp2 attach="fog" args={['#070b14', 0.00022]} />
      {/* The ball of night (repair Q2a): a barely-lighter sphere just inside
          the star shell so the globe reads as a solid object from any angle.
          raycast disabled — it must never intercept star clicks; the near-side
          stars sit on/above it and the far side occludes naturally. */}
      <mesh raycast={() => null}>
        <sphereGeometry args={[GLOBE_RADIUS - 32, 48, 32]} />
        <meshBasicMaterial color="#0d1526" />
      </mesh>
      <Dust count={420} />
      {/* Constellation line art: straight, solid — star-chart chains (decision 3). */}
      {solidLinks.map((l) => {
        const dim = matchIds !== null && !(matchIds.has(l.idA) && matchIds.has(l.idB));
        return (
          <Line
            key={l.key}
            points={[l.a, l.b]}
            color={l.color}
            lineWidth={1}
            transparent
            opacity={dim ? 0.05 : 0.22}
          />
        );
      })}
      {/* Related-article arcs: dashed, gradient, always on; emphasized on
          selection, dimmed during search (decisions 2–3). */}
      {arcs.map((arc) => {
        const [aId, bId] = arc.id.split('|');
        const emphasized = selectedId !== null && (aId === selectedId || bId === selectedId);
        const dim = matchIds !== null && (!matchIds.has(aId) || !matchIds.has(bId));
        return (
          <Line
            key={arc.id}
            points={arc.points}
            vertexColors={arc.colors}
            lineWidth={emphasized ? 2.2 : 1.1}
            dashed
            dashSize={7}
            gapSize={5}
            transparent
            opacity={dim ? 0.06 : emphasized ? 0.6 : 0.22}
          />
        );
      })}
      {positions3D.map(({ id, position }) => {
        const m = meta.get(id);
        if (!m) return null;
        return (
          <StarObject
            key={id}
            id={id}
            position={position}
            meta={m}
            dimmed={matchIds !== null && !matchIds.has(id)}
            emphasized={id === selectedId || id === hoveredId}
            selected={id === selectedId}
            onHover={onHover}
            onSelectStar={onSelectStar}
          />
        );
      })}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        minDistance={25}
        maxDistance={3400}
        autoRotateSpeed={0.4}
      />
      <CameraRig
        controlsRef={controlsRef}
        frameRef={frameRef}
        hudRef={hudRef}
        positionById={positionById}
        pointsByConstellation={pointsByConstellation}
        allPoints={allPoints}
        setAnimating={setAnimating}
      />
      <LabelProjector
        starLabelRef={starLabelRef}
        chipLabelRef={chipLabelRef}
        selectedId={selectedId}
        hoveredId={hoveredId}
        matchIds={matchIds}
        positionById={positionById}
        chipPosById={chipPosById}
      />
    </>
  );
}
