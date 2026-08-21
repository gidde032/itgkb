import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import type { Article, Constellation } from '../content/types';
import type { StarPosition } from '../layout/types';
import { catalogMeta, constellationColors } from '../content/catalog';
import { computeConstellationLinks, computeRelatedLinks } from '../galaxy/links';
import { expandDepth } from './depth';
import { relatedArcs, type Vec3 } from './arcGeometry';
import { framePoints, boundingSphere } from './framing';
import { Scene, type FrameRequest, type SolidLink } from './Scene';
import { OrbitIcon, ResetIcon } from '../ui/icons';
import { prefersReducedMotion } from '../app/motion';

/**
 * 3D showcase renderer (#31). Same public contract as GalaxyCanvas — consumes
 * positions + match state only, never article bodies — mounted as a lazy chunk
 * by App (decision 6). Depth comes from the deterministic expansion; related
 * lines are always on as dashed gradient arcs (decision 2); the orbit toggle
 * and reset controls match the galaxy's chrome-button house style (decision 5).
 */
export interface ShowcaseCanvasProps {
  articles: Article[];
  constellations: Constellation[];
  positions: StarPosition[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** FR-8 parity: non-matching stars dim in place. Null = no search. */
  matchIds: ReadonlySet<string> | null;
  /** FR-7 parity: bumping seq flies the camera to the star with this id. */
  focus: { id: string; seq: number } | null;
}

export function ShowcaseCanvas({
  articles,
  constellations,
  positions,
  selectedId,
  onSelect,
  matchIds,
  focus,
}: ShowcaseCanvasProps): JSX.Element {
  const wrapRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLSpanElement>(null);
  const starLabelRef = useRef<HTMLDivElement>(null);
  const chipLabelRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<FrameRequest | null>(null);
  const frameSeq = useRef(0);
  const [hovered, setHovered] = useState<{ id: string; x: number; y: number } | null>(null);
  const [orbitOn, setOrbitOn] = useState(true);
  // Drives the render loop: 'always' while orbiting or tweening, 'demand' at
  // rest — a still showcase burns no GPU, matching the galaxy's idle discipline.
  // Review repair (correctness #2): starts false. It previously started true
  // and was only cleared by a completed frame request, so a user who never
  // triggered one kept the loop at 'always' forever. The rig also self-heals
  // it to false on any frame with no tween running.
  const [animating, setAnimating] = useState(false);
  // Review repair (a11y #7/#8, correctness #3): live reduced-motion value —
  // the frameloop and the orbit rig must react to OS preference changes
  // mid-session, not a mount-time snapshot.
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  const positions3D = useMemo(
    () => expandDepth(positions, articles, constellations),
    [positions, articles, constellations],
  );
  const meta = useMemo(() => catalogMeta(articles, constellations), [articles, constellations]);
  const posById = useMemo(
    () =>
      new Map<string, Vec3>(
        positions3D.map((p) => {
          const v: Vec3 = [p.x, p.y, p.z];
          return [p.id, v];
        }),
      ),
    [positions3D],
  );
  const stars3D = useMemo(
    () => positions3D.map((p) => ({ id: p.id, position: [p.x, p.y, p.z] as Vec3 })),
    [positions3D],
  );
  const allPoints = useMemo(() => positions3D.map((p) => [p.x, p.y, p.z] as Vec3), [positions3D]);

  const pointsByConstellation = useMemo(() => {
    const constellationOf = new Map(articles.map((a) => [a.id, a.constellation]));
    const byC = new Map<string, Vec3[]>();
    for (const c of constellations) byC.set(c.id, []);
    for (const p of positions3D) {
      const cid = constellationOf.get(p.id);
      if (cid === undefined) continue;
      byC.get(cid)?.push([p.x, p.y, p.z]);
    }
    return byC;
  }, [articles, constellations, positions3D]);

  // Constellation chips float above their figure's bounding sphere (decision 13).
  const chipPosById = useMemo(() => {
    const m = new Map<string, Vec3>();
    for (const [cid, pts] of pointsByConstellation) {
      if (pts.length === 0) continue;
      const { center, radius } = boundingSphere(pts);
      m.set(cid, [center[0], center[1] + radius + 70, center[2]]);
    }
    return m;
  }, [pointsByConstellation]);

  // Same link computation as the 2D galaxy (orphan rescue uses 2D positions —
  // the figures' shapes stay identical across modes).
  const links = useMemo(() => {
    const posMap = new Map(positions.map((p) => [p.id, { x: p.x, y: p.y }]));
    return computeConstellationLinks(articles, posMap);
  }, [articles, positions]);

  const colors = useMemo(() => constellationColors(constellations), [constellations]);
  const relatedLinks = useMemo(() => computeRelatedLinks(articles, colors), [articles, colors]);

  const solidLinks = useMemo(() => {
    const constellationOf = new Map(articles.map((a) => [a.id, a.constellation]));
    return links
      .map((l): SolidLink | null => {
        const a = posById.get(l.a);
        const b = posById.get(l.b);
        if (!a || !b) return null;
        return {
          key: `c|${l.a}|${l.b}`,
          idA: l.a,
          idB: l.b,
          a,
          b,
          color: colors.get(constellationOf.get(l.a) ?? '') ?? '#ffffff',
        };
      })
      .filter((l): l is SolidLink => l !== null);
  }, [links, posById, colors, articles]);

  // Arc geometry consumes object-shaped positions ({x,y,z}); the star map
  // (tuple form) feeds the scene graph.
  const posObjById = useMemo(
    () => new Map(positions3D.map((p) => [p.id, { x: p.x, y: p.y, z: p.z }])),
    [positions3D],
  );
  const arcs = useMemo(() => relatedArcs(relatedLinks, posObjById), [relatedLinks, posObjById]);

  const initialFrame = useMemo(() => framePoints(allPoints), [allPoints]);

  // FR-7 parity: focus requests fly the camera to the star.
  useEffect(() => {
    if (!focus) return;
    setAnimating(true);
    frameRef.current = { seq: ++frameSeq.current, kind: 'star', id: focus.id };
  }, [focus]);

  const requestConstellationFrame = useCallback((id: string) => {
    setAnimating(true);
    frameRef.current = { seq: ++frameSeq.current, kind: 'constellation', id };
  }, []);

  const resetView = useCallback(() => {
    setAnimating(true);
    frameRef.current = { seq: ++frameSeq.current, kind: 'scene' };
  }, []);

  const onHover = useCallback((id: string | null, clientX: number, clientY: number) => {
    const wrap = wrapRef.current;
    if (wrap) wrap.style.cursor = id ? 'pointer' : 'grab';
    if (!id) {
      setHovered(null);
      return;
    }
    const rect = wrap?.getBoundingClientRect();
    setHovered({ id, x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) });
  }, []);

  const hoveredMeta = hovered ? meta.get(hovered.id) : undefined;

  return (
    <div className="galaxy-wrap showcase-wrap" ref={wrapRef} style={{ cursor: 'grab' }}>
      <div
        className="showcase-canvas"
        role="img"
        aria-label="Interactive 3D map of IT knowledge articles"
      >
        <Canvas
          camera={{ fov: 50, near: 2, far: 12000, position: initialFrame.position }}
          dpr={[1, 2]}
          gl={{ antialias: true }}
          frameloop={(orbitOn && !reducedMotion) || animating ? 'always' : 'demand'}
          onPointerMissed={() => onSelect(null)}
        >
          <Scene
            positions3D={stars3D}
            meta={meta}
            solidLinks={solidLinks}
            arcs={arcs}
            selectedId={selectedId}
            hoveredId={hovered?.id ?? null}
            matchIds={matchIds}
            positionById={posById}
            pointsByConstellation={pointsByConstellation}
            chipPosById={chipPosById}
            allPoints={allPoints}
            frameRef={frameRef}
            hudRef={hudRef}
            starLabelRef={starLabelRef}
            chipLabelRef={chipLabelRef}
            orbitEnabled={orbitOn}
            reducedMotion={reducedMotion}
            setAnimating={setAnimating}
            onHover={onHover}
            onSelectStar={onSelect}
          />
        </Canvas>
      </div>
      {/* Star catalog labels (bracketed, 2D-parity reveal rules) — positioned
          per-frame by the label projector. */}
      <div className="label-overlay" ref={starLabelRef} aria-hidden="true">
        {articles.map((a) => {
          const m = meta.get(a.id);
          return (
            <span key={a.id} data-id={a.id} className="s-label">
              <span className="s-label__id" style={{ color: m?.color }}>
                [{m?.catalog}]
              </span>
              <span className="s-label__title">{a.title}</span>
            </span>
          );
        })}
      </div>
      {/* Constellation name chips — clickable framing targets (decision 13). */}
      <div className="label-overlay" ref={chipLabelRef}>
        {constellations.map((c) =>
          chipPosById.has(c.id) ? (
            <button
              key={c.id}
              type="button"
              data-id={c.id}
              className="c-label"
              style={{ color: c.color }}
              title={`Frame ${c.name}`}
              onClick={() => requestConstellationFrame(c.id)}
            >
              {c.name}
            </button>
          ) : null,
        )}
      </div>
      {hovered && hoveredMeta && hovered.id !== selectedId && (
        <div
          className="star-tooltip"
          style={{ left: hovered.x, top: hovered.y }}
          role="tooltip"
          aria-hidden="true"
        >
          <strong>{hoveredMeta.title}</strong>
          <span>{hoveredMeta.summary}</span>
        </div>
      )}
      <div className="hud" aria-hidden="true">
        <span ref={hudRef}>AZ 0.0° · EL +0.0°</span> · <b>{articles.length} OBJECTS</b> ·{' '}
        {constellations.length} FIELDS
      </div>
      <button
        type="button"
        className="related-toggle"
        aria-pressed={orbitOn}
        onClick={() => setOrbitOn((v) => !v)}
        title="Toggle idle auto-orbit"
      >
        <OrbitIcon />
        Orbit
      </button>
      <button type="button" className="reset-view" onClick={resetView}>
        <ResetIcon />
        Reset view
      </button>
    </div>
  );
}
