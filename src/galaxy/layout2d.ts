import type { Article, Constellation } from '../content/types';
import type { StarPosition } from '../layout/types';
import { hashString } from '../util/hash';

/**
 * The semantic map remains the shared content layout. This second, 2D-only
 * pass gives constellation groups enough room for their rendered labels and
 * line art without changing the positions consumed by the 3D globe.
 */
const GROUP_GAP = 36;
const GROUP_PADDING = 24;
const LABEL_RESERVE = 34;
const ARTICLE_DENSITY_PADDING = 8;
const RELAX_ITERATIONS = 120;
const FINAL_SEPARATION_ITERATIONS = 24;

interface GroupLayout {
  id: string;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  radius: number;
}

export interface GalaxyViewTransform {
  x: number;
  y: number;
  k: number;
}

function pairDirection(a: string, b: string): { x: number; y: number } {
  const angle = ((hashString(`${a}|${b}`) % 360) * Math.PI) / 180;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function separateGroups(groups: GroupLayout[], pullToTarget: boolean): void {
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const a = groups[i];
      const b = groups[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let distance = Math.hypot(dx, dy);
      if (distance < 0.0001) {
        const direction = pairDirection(a.id, b.id);
        dx = direction.x;
        dy = direction.y;
        distance = 1;
      }
      const minimum = a.radius + b.radius + GROUP_GAP;
      if (distance >= minimum) continue;
      const shift = (minimum - distance) * 0.51;
      const nx = dx / distance;
      const ny = dy / distance;
      a.x -= nx * shift;
      a.y -= ny * shift;
      b.x += nx * shift;
      b.y += ny * shift;
    }
  }

  if (pullToTarget) {
    for (const group of groups) {
      group.x += (group.targetX - group.x) * 0.018;
      group.y += (group.targetY - group.y) * 0.018;
    }
  }
}

/**
 * Deterministically separates 2D constellation footprints while preserving
 * each group's internal semantic shape. Article order does not affect the
 * result; only ids, positions, and mapped constellation membership do.
 */
export function layoutGalaxy2D(
  positions: readonly StarPosition[],
  articles: readonly Article[],
  constellations: readonly Constellation[],
): StarPosition[] {
  const positionById = new Map(positions.map((position) => [position.id, position]));
  const articlesByConstellation = new Map<string, Article[]>();
  for (const article of articles) {
    const group = articlesByConstellation.get(article.constellation) ?? [];
    group.push(article);
    articlesByConstellation.set(article.constellation, group);
  }

  const constellationById = new Map(constellations.map((c) => [c.id, c]));
  const constellationByArticleId = new Map(
    articles.map((article) => [article.id, article.constellation]),
  );
  const groups: GroupLayout[] = [];
  const translationById = new Map<string, { x: number; y: number }>();

  for (const [id, groupArticles] of articlesByConstellation) {
    const points = groupArticles
      .map((article) => positionById.get(article.id))
      .filter((position): position is StarPosition => position !== undefined);
    if (points.length === 0) continue;

    const authoredAnchor = constellationById.get(id)?.anchor ?? { x: 0, y: 0 };
    const targetX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const targetY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    const maxDistance = Math.max(
      ...points.map((point) => Math.hypot(point.x - targetX, point.y - targetY)),
    );
    // The label reserve is deliberately part of the group footprint. The
    // label pass still performs exact screen-space collision checks later.
    const densityReserve = Math.sqrt(points.length) * ARTICLE_DENSITY_PADDING;
    const radius = Math.max(24, maxDistance) + GROUP_PADDING + LABEL_RESERVE + densityReserve;
    groups.push({
      id,
      targetX: Number.isFinite(targetX) ? targetX : authoredAnchor.x,
      targetY: Number.isFinite(targetY) ? targetY : authoredAnchor.y,
      x: targetX,
      y: targetY,
      radius,
    });
  }

  groups.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (let i = 0; i < RELAX_ITERATIONS; i++) separateGroups(groups, true);
  for (let i = 0; i < FINAL_SEPARATION_ITERATIONS; i++) separateGroups(groups, false);

  for (const group of groups) {
    translationById.set(group.id, {
      x: group.x - group.targetX,
      y: group.y - group.targetY,
    });
  }

  return positions.map((position) => {
    const constellation = constellationByArticleId.get(position.id);
    const translation = constellation ? translationById.get(constellation) : undefined;
    return translation
      ? { ...position, x: position.x + translation.x, y: position.y + translation.y }
      : { ...position };
  });
}

/** Compute a stable overview transform that frames the complete 2D layout. */
export function fitGalaxyView(
  width: number,
  height: number,
  positions: readonly StarPosition[],
): GalaxyViewTransform {
  if (positions.length === 0 || width <= 0 || height <= 0) {
    return { x: width / 2, y: height / 2, k: 0.8 };
  }
  const minX = Math.min(...positions.map((position) => position.x));
  const maxX = Math.max(...positions.map((position) => position.x));
  const minY = Math.min(...positions.map((position) => position.y));
  const maxY = Math.max(...positions.map((position) => position.y));
  const contentWidth = Math.max(1, maxX - minX + 160);
  const contentHeight = Math.max(1, maxY - minY + 160);
  const k = Math.max(
    0.3,
    Math.min(0.8, 0.9 * Math.min(width / contentWidth, height / contentHeight)),
  );
  return {
    x: width / 2 - ((minX + maxX) / 2) * k,
    y: height / 2 - ((minY + maxY) / 2) * k,
    k,
  };
}
