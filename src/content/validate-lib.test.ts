import { describe, expect, it } from 'vitest';
import { validateFrontmatter, validateCollection } from '../../scripts/validate-lib.mjs';

const good = {
  id: 'a-one',
  title: 'T',
  constellation: 'networking',
  tags: ['x'],
  summary: 'S',
  stub: false,
  related: [],
};

describe('validateFrontmatter', () => {
  it('accepts a fully valid frontmatter object', () => {
    expect(validateFrontmatter(good, 'f.md')).toEqual([]);
  });
  it('rejects non-kebab-case ids', () => {
    expect(validateFrontmatter({ ...good, id: 'Bad_ID' }, 'f.md').join(' ')).toMatch(/kebab-case/);
  });
  it('rejects non-string tags', () => {
    expect(validateFrontmatter({ ...good, tags: [1] }, 'f.md').join(' ')).toMatch(/tags/);
  });
  it('rejects non-boolean stub', () => {
    expect(validateFrontmatter({ ...good, stub: 'yes' }, 'f.md').join(' ')).toMatch(/stub/);
  });
});

describe('validateCollection', () => {
  const constellations = [{ id: 'networking' }];
  it('flags duplicate ids across files', () => {
    const errs = validateCollection(
      [
        { fm: { ...good }, sourceName: 'a.md' },
        { fm: { ...good }, sourceName: 'b.md' },
      ],
      constellations,
    );
    expect(errs.join(' ')).toMatch(/duplicate id/);
  });
  it('flags unknown constellations', () => {
    const errs = validateCollection(
      [{ fm: { ...good, constellation: 'nope' }, sourceName: 'a.md' }],
      constellations,
    );
    expect(errs.join(' ')).toMatch(/unknown constellation/);
  });
  it('flags unresolvable related ids (FR-11)', () => {
    const errs = validateCollection(
      [{ fm: { ...good, related: ['ghost'] }, sourceName: 'a.md' }],
      constellations,
    );
    expect(errs.join(' ')).toMatch(/does not resolve/);
  });
});
