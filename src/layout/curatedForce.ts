import {
  forceSimulation,
  forceX,
  forceY,
  forceCollide,
  forceLink,
  forceManyBody,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import type { Article, Constellation } from '../content/types';
import type { LayoutProvider, StarPosition } from './types';
import { hashString } from '../util/hash';
import { sharedTagCount } from '../util/tags';

interface StarNode extends SimulationNodeDatum {
  id: string;
  anchorX: number;
  anchorY: number;
}

/** Seeded LCG so d3-force's internal jitter is reproducible run-to-run. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/**
 * Curated layout (SPEC FR-4, kickoff decision 4a): constellations sit at
 * hand-placed anchors; stars settle near their constellation's anchor, pulled
 * together by shared tags and kept apart by collision. Deterministic: same
 * content in → same positions out.
 */
export class CuratedForceLayout implements LayoutProvider {
  layout(articles: Article[], constellations: Constellation[]): StarPosition[] {
    const anchorById = new Map(constellations.map((c) => [c.id, c.anchor]));
    const nodes: StarNode[] = articles.map((a) => {
      const anchor = anchorById.get(a.constellation) ?? { x: 0, y: 0 };
      const h = hashString(a.id);
      // Deterministic initial scatter around the anchor so the sim starts stable.
      const angle = ((h % 360) * Math.PI) / 180;
      const radius = 40 + (h % 70);
      return {
        id: a.id,
        anchorX: anchor.x,
        anchorY: anchor.y,
        x: anchor.x + Math.cos(angle) * radius,
        y: anchor.y + Math.sin(angle) * radius,
      };
    });

    const nodeIndex = new Map(nodes.map((n) => [n.id, n]));
    const links: SimulationLinkDatum<StarNode>[] = [];
    for (let i = 0; i < articles.length; i++) {
      for (let j = i + 1; j < articles.length; j++) {
        const a = articles[i];
        const b = articles[j];
        if (a.constellation !== b.constellation) continue; // cross-cluster placement is curated
        const shared = sharedTagCount(a, b);
        if (shared > 0) {
          links.push({
            source: nodeIndex.get(a.id) as StarNode,
            target: nodeIndex.get(b.id) as StarNode,
          });
        }
      }
    }

    const sim = forceSimulation<StarNode>(nodes)
      .randomSource(makeRandom(42))
      .force('anchorX', forceX<StarNode>((d) => d.anchorX).strength(0.12))
      .force('anchorY', forceY<StarNode>((d) => d.anchorY).strength(0.12))
      .force('charge', forceManyBody<StarNode>().strength(-60).distanceMax(220))
      .force(
        'links',
        forceLink<StarNode, SimulationLinkDatum<StarNode>>(links).distance(70).strength(0.25),
      )
      .force('collide', forceCollide<StarNode>(26))
      .stop();

    // Run synchronously to a settled state; positions are computed once per load.
    for (let i = 0; i < 300; i++) sim.tick();

    return nodes.map((n) => ({
      id: n.id,
      x: n.x ?? 0,
      y: n.y ?? 0,
      z: (hashString(n.id + ':z') % 1000) / 1000,
    }));
  }
}
