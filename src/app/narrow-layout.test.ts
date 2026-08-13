// @vitest-environment node
//
// M5 regression: on narrow viewports the search bar must sit between the
// wordmark header and the list-view content — no overlap in either direction.
// Runs in node so we can read the CSS file directly.

// Node builtins are available at runtime (vitest node env) but tsc doesn't
// include @types/node — declare just the signatures we need.
declare function require(id: string): unknown;
declare const __dirname: string;

import { describe, expect, it } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(path: string, enc: string): string };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path') as { resolve(...parts: string[]): string };

const css = fs.readFileSync(path.resolve(__dirname, '../styles.css'), 'utf-8');

function extractMediaBlock(): string {
  const start = css.indexOf('@media (max-width: 899px)');
  if (start === -1) throw new Error('narrow media query not found in styles.css');
  const braceStart = css.indexOf('{', start);
  let depth = 1;
  let i = braceStart + 1;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }
  return css.slice(braceStart + 1, i - 1);
}

function extractRule(source: string, selector: string, prop: string): number | null {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ruleBlock = source.match(new RegExp(`${esc}\\s*\\{([^}]*)\\}`))?.[1];
  if (!ruleBlock) return null;
  const m = ruleBlock.match(new RegExp(`${prop}\\s*:\\s*([\\d.]+)rem`));
  return m ? parseFloat(m[1]) : null;
}

const media = extractMediaBlock();

describe('narrow-viewport search-bar positioning (M5)', () => {
  it('narrow media query overrides search-bar top and list-view top', () => {
    expect(extractRule(media, '.search-bar', 'top')).not.toBeNull();
    expect(extractRule(media, '.list-view', 'top')).not.toBeNull();
  });

  it('search bar clears the wordmark header (padding + mark + sub ≈ 3.5rem)', () => {
    const headerPadding = extractRule(css, '.app-header', 'padding') ?? 1;
    const markFontSize = extractRule(css, '.wordmark__mark', 'font-size') ?? 1.5;
    const subMarginTop = extractRule(css, '.wordmark__sub', 'margin-top') ?? 0.4;
    const subFontSize = extractRule(css, '.wordmark__sub', 'font-size') ?? 0.6;
    const headerBottom = headerPadding + markFontSize + subMarginTop + subFontSize;

    const searchTop = extractRule(media, '.search-bar', 'top')!;
    expect(searchTop).toBeGreaterThan(headerBottom);
  });

  it('search bar input fits above the list-view top with clearance', () => {
    const searchTop = extractRule(media, '.search-bar', 'top')!;
    const listTop = extractRule(media, '.list-view', 'top')!;
    const inputFontSize = extractRule(css, '.search-bar input', 'font-size') ?? 0.9;
    const inputHeight = 0.55 + inputFontSize + 0.55 + 0.2;
    expect(searchTop + inputHeight).toBeLessThan(listTop);
  });
});
