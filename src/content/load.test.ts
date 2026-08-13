import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assembleContent } from './load';
import type { Constellation } from './types';

// P6-A2 regression (contextless review: skeptical-senior-engineer lens,
// severity CRITICAL): collection-invalid articles were logged but still
// rendered, violating FR-1's "excluded loudly" contract. Policy
// (maintainer-approved): exclude unknown-constellation articles and the
// second occurrence of a duplicate id; keep an article whose only defect is
// a dead related link.

const constellations: Constellation[] = [
  { id: 'networking', name: 'Networking', anchor: { x: 0, y: 0 }, color: '#88aaff' },
];

const md = (id: string, constellation: string, extra = ''): string =>
  `---\nid: ${id}\ntitle: T\nconstellation: ${constellation}\ntags: [x]\nsummary: S\n${extra}---\nBody`;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('collection-invalid exclusion (P6-A2)', () => {
  it('excludes unknown-constellation articles and reports the error', () => {
    const { articles, errors } = assembleContent(
      { 'a.md': md('a-one', 'nope'), 'b.md': md('b-one', 'networking') },
      constellations,
    );
    expect(articles.map((a) => a.id)).toEqual(['b-one']);
    expect(errors.join(' ')).toMatch(/unknown constellation/);
  });

  it('excludes the second occurrence of a duplicate id, keeping the first', () => {
    const { articles, errors } = assembleContent(
      { 'a.md': md('dup', 'networking'), 'b.md': md('dup', 'networking') },
      constellations,
    );
    expect(articles).toHaveLength(1);
    expect(articles[0].sourceName).toBe('a.md');
    expect(errors.join(' ')).toMatch(/duplicate id/);
  });

  it('keeps an article whose only defect is a dead related link', () => {
    const { articles, errors } = assembleContent(
      { 'a.md': md('a-one', 'networking', 'related: [ghost]\n') },
      constellations,
    );
    expect(articles.map((a) => a.id)).toEqual(['a-one']);
    expect(errors.join(' ')).toMatch(/does not resolve/);
  });

  it('still excludes per-file-invalid articles (FR-1 baseline)', () => {
    const { articles, errors } = assembleContent(
      { 'a.md': '---\nid: a-one\n---\nBody', 'b.md': md('b-one', 'networking') },
      constellations,
    );
    expect(articles.map((a) => a.id)).toEqual(['b-one']);
    expect(errors.length).toBeGreaterThan(0);
  });
});
