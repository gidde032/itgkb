import { describe, expect, it } from 'vitest';
import { SemanticTextSearch } from './semanticTextSearch';
import type { Article } from '../content/types';

function art(id: string, title: string, tags: string[], summary: string, body: string): Article {
  return {
    id,
    title,
    constellation: 'c',
    tags,
    summary,
    stub: false,
    related: [],
    body,
    sourceName: `${id}.md`,
  };
}

const vec = (angle: number): number[] => [Math.cos(angle), Math.sin(angle)];

const articles = [
  art('vpn', 'VPN access', ['networking'], 'Remote access via VPN.', 'Use the campus VPN.'),
  art(
    'network-arch',
    'Network architecture overview',
    ['networking'],
    'Topology and design.',
    'VPN tunnels are part of the architecture.',
  ),
  art(
    'printer',
    'Printer setup',
    ['printing'],
    'Install drivers.',
    'For VPN users, check port forwarding.',
  ),
];

const vectors: Record<string, number[]> = {
  vpn: vec(0),
  'network-arch': vec(0.1),
  printer: vec(Math.PI / 2),
};

describe('SemanticTextSearch (#30)', () => {
  const s = new SemanticTextSearch(vectors);

  it('promotes semantically close articles above incidental body matches', () => {
    const results = s.search('VPN', articles);
    expect(results[0].id).toBe('vpn');
    expect(results[1].id).toBe('network-arch');
    expect(results[2].id).toBe('printer');
  });

  it('preserves fields and partial flags from text search', () => {
    const results = s.search('VPN', articles);
    expect(results[0].fields).toContain('title');
    const partial = s.search('vpn zebra', articles);
    expect(partial.every((r) => r.partial === true)).toBe(true);
  });

  it('returns text results unchanged for a single match', () => {
    const single = [art('vpn', 'VPN access', ['networking'], 'Remote.', 'Body.')];
    const singleVecs = { vpn: vec(0) };
    const ss = new SemanticTextSearch(singleVecs);
    const results = ss.search('VPN', single);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('vpn');
  });

  it('returns empty for empty query', () => {
    expect(s.search('', articles)).toEqual([]);
  });

  it('degrades to text order when anchor vector is missing', () => {
    const noAnchor = new SemanticTextSearch({ 'network-arch': vec(0), printer: vec(1) });
    const results = noAnchor.search('VPN', articles);
    expect(results[0].id).toBe('vpn');
  });

  it('computes the expected blended score', () => {
    const results = s.search('VPN', articles);
    const vpnResult = results.find((r) => r.id === 'vpn')!;
    // title(4) + summary(2) + body(1) + alpha(2) * cosine(self)=1
    expect(vpnResult.score).toBeCloseTo(7 + 2 * 1.0);
    const archResult = results.find((r) => r.id === 'network-arch')!;
    const expectedSim = Math.cos(0.1);
    // body(1) + alpha(2) * cosine(0.1 radians apart)
    expect(archResult.score).toBeCloseTo(1 + 2 * expectedSim);
  });

  it('is deterministic for tied blended scores', () => {
    const tiedArts = [
      art('b-art', 'same words', [], 'x', 'y'),
      art('a-art', 'same words', [], 'x', 'y'),
    ];
    const tiedVecs = { 'a-art': vec(0), 'b-art': vec(0) };
    const ts = new SemanticTextSearch(tiedVecs);
    expect(ts.search('same', tiedArts).map((r) => r.id)).toEqual(['a-art', 'b-art']);
  });
});
