import { describe, expect, it } from 'vitest';
import {
  validateFrontmatter,
  validateCollection,
  validateFilenameId,
  validateConstellations,
} from '../../scripts/validate-lib.mjs';

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

// P8 regression (audit: id/filename drift passed the gate silently).
describe('validateFilenameId (P8)', () => {
  it('accepts when id matches the filename', () => {
    expect(validateFilenameId('a-one.md', 'a-one', 'a-one.md')).toEqual([]);
  });
  it('rejects when id differs from the filename', () => {
    const errs = validateFilenameId('a-one.md', 'a-two', 'a-one.md');
    expect(errs.join(' ')).toMatch(/does not match filename/);
  });
  it('rejects a missing id', () => {
    expect(validateFilenameId('a-one.md', undefined, 'a-one.md').length).toBe(1);
  });
});

// P7 regression (audit: malformed constellations.json crashed layout but passed
// validate:content because only c.id was read).
describe('validateConstellations (P7)', () => {
  const good = [
    {
      id: 'networking',
      name: 'Networking',
      prefix: 'NET',
      color: '#4fc2b0',
      anchor: { x: 1, y: 2 },
    },
  ];
  it('accepts a well-formed constellation set', () => {
    expect(validateConstellations(good)).toEqual([]);
  });
  it('rejects a missing anchor', () => {
    const errs = validateConstellations([{ ...good[0], anchor: undefined }]);
    expect(errs.join(' ')).toMatch(/anchor/);
  });
  it('rejects an anchor with non-number coordinates', () => {
    const errs = validateConstellations([{ ...good[0], anchor: { x: '1', y: 2 } }]);
    expect(errs.join(' ')).toMatch(/anchor/);
  });
  it('rejects a missing prefix', () => {
    const errs = validateConstellations([{ ...good[0], prefix: '' }]);
    expect(errs.join(' ')).toMatch(/prefix/);
  });
  it('rejects a missing color', () => {
    const errs = validateConstellations([{ ...good[0], color: '' }]);
    expect(errs.join(' ')).toMatch(/color/);
  });
  it('rejects a duplicate constellation id', () => {
    const errs = validateConstellations([...good, { ...good[0] }]);
    expect(errs.join(' ')).toMatch(/duplicate constellation id/);
  });
  it('rejects an empty array', () => {
    expect(validateConstellations([]).join(' ')).toMatch(/non-empty array/);
  });
});
