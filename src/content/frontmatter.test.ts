import { describe, expect, it } from 'vitest';
import { parseArticle } from './frontmatter';
import { validateFrontmatter } from '../../scripts/validate-lib.mjs';

const VALID = `---
id: test-article
title: 'Test: An article'
constellation: networking
tags: [alpha, beta]
summary: A test summary.
stub: false
related: []
---

## Summary

Body text here.
`;

describe('parseArticle', () => {
  it('parses a valid article and strips frontmatter from the body', () => {
    const { article, errors } = parseArticle(VALID, 'valid.md', validateFrontmatter);
    expect(errors).toEqual([]);
    expect(article).not.toBeNull();
    expect(article?.id).toBe('test-article');
    expect(article?.tags).toEqual(['alpha', 'beta']);
    expect(article?.body.startsWith('\n## Summary')).toBe(true);
    expect(article?.body).not.toContain('---');
  });

  it('defaults stub=false and related=[] when omitted', () => {
    const raw = VALID.replace('stub: false\n', '').replace('related: []\n', '');
    const { article, errors } = parseArticle(raw, 'defaults.md', validateFrontmatter);
    expect(errors).toEqual([]);
    expect(article?.stub).toBe(false);
    expect(article?.related).toEqual([]);
  });

  it('rejects a file with no frontmatter block', () => {
    const { article, errors } = parseArticle('# Just markdown', 'none.md', validateFrontmatter);
    expect(article).toBeNull();
    expect(errors[0]).toMatch(/no YAML frontmatter/);
  });

  it('rejects invalid YAML with a parse error, not an exception', () => {
    const raw = '---\nid: [unclosed\n---\nbody';
    const { article, errors } = parseArticle(raw, 'bad.md', validateFrontmatter);
    expect(article).toBeNull();
    expect(errors[0]).toMatch(/YAML parse error/);
  });

  it('rejects an article missing a required field (FR-2)', () => {
    const raw = VALID.replace(/summary: .*\n/, '');
    const { article, errors } = parseArticle(raw, 'nosummary.md', validateFrontmatter);
    expect(article).toBeNull();
    expect(errors.join(' ')).toMatch(/"summary"/);
  });
});
