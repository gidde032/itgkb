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

// F3 regression (reviewer: data-pipeline, severity Medium): frontmatter block
// parsing is a single shared implementation for CLI gate and app loader.
import { parseFrontmatterBlock } from '../../scripts/validate-lib.mjs';

describe('parseFrontmatterBlock (F3)', () => {
  it('parses a valid block and returns the body', () => {
    const { fm, body, errors } = parseFrontmatterBlock('---\nid: x\n---\nBody', 'f.md');
    expect(errors).toEqual([]);
    expect(fm).toEqual({ id: 'x' });
    expect(body).toBe('Body');
  });
  it('reports missing frontmatter without throwing', () => {
    const { fm, errors } = parseFrontmatterBlock('no fm here', 'f.md');
    expect(fm).toBeNull();
    expect(errors[0]).toMatch(/no YAML frontmatter/);
  });
  it('rejects array frontmatter as not-a-mapping', () => {
    const { fm, errors } = parseFrontmatterBlock('---\n- a\n- b\n---\nBody', 'f.md');
    expect(fm).toBeNull();
    expect(errors[0]).toMatch(/not a mapping/);
  });
});

// F5 regression (reviewer: testing, severity Low): related must be an array of ids.
describe('related field validation (F5)', () => {
  it('rejects non-array related', () => {
    expect(validateFrontmatter({ ...good, related: 'a-two' }, 'f.md').join(' ')).toMatch(/related/);
  });
  it('rejects arrays containing non-strings', () => {
    expect(validateFrontmatter({ ...good, related: [3] }, 'f.md').join(' ')).toMatch(/related/);
  });
});
