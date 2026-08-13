import { describe, expect, it } from 'vitest';
import { TextSearch } from './textSearch';
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

const articles = [
  art(
    'cal-share',
    'Calendar sharing error',
    ['google-calendar', 'sharing'],
    'Sharing fails.',
    'Check the admin console.',
  ),
  art(
    'printer',
    'Printer setup',
    ['printing'],
    'Install drivers.',
    'Calendar of maintenance events.',
  ),
  art('vpn', 'VPN access', ['networking'], 'Remote access.', 'Use the campus VPN.'),
];

describe('TextSearch (FR-8)', () => {
  const s = new TextSearch();

  it('matches across title, tags, summary, and body, case-insensitively', () => {
    const ids = s.search('CALENDAR', articles).map((r) => r.id);
    expect(ids).toContain('cal-share'); // title + tags
    expect(ids).toContain('printer'); // body only
    expect(ids).not.toContain('vpn');
  });

  it('ranks title/tag matches above body-only matches', () => {
    const [first, second] = s.search('calendar', articles);
    expect(first.id).toBe('cal-share');
    expect(second.id).toBe('printer');
    expect(first.score).toBeGreaterThan(second.score);
  });

  it('prefers full AND matches; falls back to partial ranking when none exist (A2)', () => {
    // Full-match pass: only cal-share matches both terms, no partial flag.
    const full = s.search('calendar admin', articles);
    expect(full.map((r) => r.id)).toEqual(['cal-share']);
    expect(full[0].partial).toBeUndefined();
    // 'zebra' matches nothing, but intent survives: partial results ranked.
    const fallback = s.search('calendar zebra', articles);
    expect(fallback.length).toBeGreaterThan(0);
    expect(fallback[0].id).toBe('cal-share');
    expect(fallback.every((r) => r.partial === true)).toBe(true);
    // Single unmatched term still yields nothing (no fallback for 1 term).
    expect(s.search('zebra', articles)).toEqual([]);
  });

  it('reports which fields matched', () => {
    const [r] = s.search('drivers', articles);
    expect(r.id).toBe('printer');
    expect(r.fields).toContain('summary');
  });

  it('returns nothing for empty or whitespace queries', () => {
    expect(s.search('', articles)).toEqual([]);
    expect(s.search('   ', articles)).toEqual([]);
  });

  it('is deterministic for tied scores', () => {
    const tied = [
      art('b-art', 'same words', [], 'x', 'y'),
      art('a-art', 'same words', [], 'x', 'y'),
    ];
    expect(s.search('same', tied).map((r) => r.id)).toEqual(['a-art', 'b-art']);
  });
});

// A2 regression: punctuation normalization — apostrophes collapse, hyphens
// split, so natural phrasing and frontmatter conventions meet in the middle.
import { normalizeSearchText } from './normalize';

describe('search normalization (A2)', () => {
  const s2 = new TextSearch();
  const punctArticles = [
    art(
      'gcal-update',
      "Google Calendar: \u201cEvent couldn't be updated\u201d error",
      ['google-calendar'],
      'Update fails.',
      'Details.',
    ),
  ];

  it('normalizeSearchText strips apostrophes and spaces out punctuation', () => {
    expect(normalizeSearchText("couldn't")).toBe('couldnt');
    expect(normalizeSearchText('google-calendar')).toBe('google calendar');
    expect(normalizeSearchText('lsof -ti :3000')).toBe('lsof  ti  3000');
  });

  it("matches \u2018wont update\u2019-style queries against \u2018couldn't be updated\u2019 titles via fallback", () => {
    const results = s2.search('calendar wont update', punctArticles);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('gcal-update');
    expect(results[0].partial).toBe(true);
  });

  it('matches hyphenated tags from space-separated queries as a FULL match', () => {
    const results = s2.search('google calendar', punctArticles);
    expect(results[0].id).toBe('gcal-update');
    expect(results[0].partial).toBeUndefined();
  });

  it("treats couldnt and couldn't as the same token", () => {
    expect(s2.search('couldnt', punctArticles)).toHaveLength(1);
    expect(s2.search("couldn't", punctArticles)).toHaveLength(1);
  });

  // P6-D2 regression: en/em dashes normalize to space like hyphens.
  it('normalizes en-dash and em-dash to space', () => {
    expect(normalizeSearchText('A–B—C')).toBe('a b c');
  });
});

// P6-D2 regression: duplicate query terms must not inflate scores.
describe('duplicate query terms (P6-D2)', () => {
  const s3 = new TextSearch();
  const dup = [art('a', 'VPN access', ['networking'], 'Remote.', 'body')];
  it('produces the same score regardless of repeated terms', () => {
    const [single] = s3.search('vpn', dup);
    const [doubled] = s3.search('vpn vpn', dup);
    expect(doubled.score).toBe(single.score);
  });
});
