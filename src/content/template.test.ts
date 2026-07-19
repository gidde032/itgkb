import { describe, expect, it } from 'vitest';
import { parseFrontmatterBlock, validateFrontmatter } from '../../scripts/validate-lib.mjs';

// P6-A3 regression (contextless review: user-friction lens, severity HIGH):
// TEMPLATE.md shipped with a placeholder related id, so copying it per
// README's add-an-article steps failed validate:content on the template's
// own content. The template must validate out of the box (unique id aside).

const raw = (
  import.meta.glob('../../content/TEMPLATE.md', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
)[Object.keys(import.meta.glob('../../content/TEMPLATE.md', { query: '?raw', import: 'default', eager: true }))[0]];

describe('TEMPLATE validates out of the box (P6-A3)', () => {
  it('has frontmatter that passes field validation', () => {
    const { fm, errors } = parseFrontmatterBlock(raw, 'TEMPLATE.md');
    expect(errors).toEqual([]);
    expect(fm).not.toBeNull();
    expect(validateFrontmatter(fm as Record<string, unknown>, 'TEMPLATE.md')).toEqual([]);
  });

  it('carries no placeholder related ids that cannot resolve', () => {
    const { fm } = parseFrontmatterBlock(raw, 'TEMPLATE.md');
    expect((fm as { related?: unknown }).related).toEqual([]);
  });
});
