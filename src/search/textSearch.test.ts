import { describe, expect, it } from 'vitest';
import { TextSearch } from './textSearch';
import type { Article } from '../content/types';

function art(id: string, title: string, tags: string[], summary: string, body: string): Article {
  return { id, title, constellation: 'c', tags, summary, stub: false, related: [], body, sourceName: `${id}.md` };
}

const articles = [
  art('cal-share', 'Calendar sharing error', ['google-calendar', 'sharing'], 'Sharing fails.', 'Check the admin console.'),
  art('printer', 'Printer setup', ['printing'], 'Install drivers.', 'Calendar of maintenance events.'),
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

  it('requires every term to match somewhere (AND semantics)', () => {
    expect(s.search('calendar admin', articles).map((r) => r.id)).toEqual(['cal-share']);
    expect(s.search('calendar zebra', articles)).toEqual([]);
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
    const tied = [art('b-art', 'same words', [], 'x', 'y'), art('a-art', 'same words', [], 'x', 'y')];
    expect(s.search('same', tied).map((r) => r.id)).toEqual(['a-art', 'b-art']);
  });
});
