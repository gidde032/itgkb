import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ListView } from './ListView';
import type { Article, Constellation } from '../content/types';

const constellations: Constellation[] = [
  { id: 'alpha', name: 'Alpha Group', anchor: { x: 0, y: 0 }, color: '#fff' },
  { id: 'beta', name: 'Beta Group', anchor: { x: 0, y: 0 }, color: '#fff' },
];

function art(id: string, title: string, constellation: string, stub = false): Article {
  return {
    id,
    title,
    constellation,
    tags: [],
    summary: `${title} summary`,
    stub,
    related: [],
    body: '',
    sourceName: `${id}.md`,
  };
}

const articles = [
  art('a2', 'Zeta article', 'alpha'),
  art('a1', 'Alpha article', 'alpha', true),
  art('b1', 'Beta article', 'beta'),
];

describe('ListView (NF-7)', () => {
  it('groups by constellation in config order and sorts titles within groups', () => {
    render(
      <ListView
        articles={articles}
        constellations={constellations}
        matchIds={null}
        matches={null}
        onOpen={() => {}}
      />,
    );
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['Alpha Group', 'Beta Group']);
    const buttons = screen.getAllByRole('button').map((b) => b.textContent);
    expect(buttons[0]).toContain('Alpha article');
    expect(buttons[1]).toContain('Zeta article');
  });

  it('marks stub articles', () => {
    render(
      <ListView
        articles={articles}
        constellations={constellations}
        matchIds={null}
        matches={null}
        onOpen={() => {}}
      />,
    );
    const stubButton = screen.getByRole('button', { name: /Alpha article/ });
    expect(stubButton.textContent).toContain('stub');
    const richButton = screen.getByRole('button', { name: /Beta article/ });
    expect(richButton.textContent).not.toContain('stub');
  });

  it('filters by active search matches and hides empty groups', () => {
    render(
      <ListView
        articles={articles}
        constellations={constellations}
        matches={null}
        matchIds={new Set(['b1'])}
        onOpen={() => {}}
      />,
    );
    expect(screen.queryByRole('heading', { name: 'Alpha Group' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Beta article/ })).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', () => {
    render(
      <ListView
        articles={articles}
        constellations={constellations}
        matches={null}
        matchIds={new Set()}
        onOpen={() => {}}
      />,
    );
    expect(screen.getByText('No articles match this search.')).toBeInTheDocument();
  });

  it('opens an article on activation', () => {
    const onOpen = vi.fn();
    render(
      <ListView
        articles={articles}
        constellations={constellations}
        matchIds={null}
        matches={null}
        onOpen={onOpen}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Beta article/ }));
    expect(onOpen).toHaveBeenCalledWith('b1');
  });
});

describe('ListView flat ranked mode (#30)', () => {
  const matches = [
    { id: 'b1', score: 10, fields: ['title'] },
    { id: 'a2', score: 5, fields: ['body'] },
  ];

  it('renders a flat list in rank order when matches are provided', () => {
    render(
      <ListView
        articles={articles}
        constellations={constellations}
        matchIds={new Set(['b1', 'a2'])}
        matches={matches}
        onOpen={() => {}}
      />,
    );
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent).toContain('Beta article');
    expect(buttons[1].textContent).toContain('Zeta article');
  });

  it('shows constellation tags in flat mode', () => {
    render(
      <ListView
        articles={articles}
        constellations={constellations}
        matchIds={new Set(['b1'])}
        matches={[{ id: 'b1', score: 10, fields: ['title'] }]}
        onOpen={() => {}}
      />,
    );
    expect(screen.getByText('Beta Group')).toBeInTheDocument();
  });

  it('shows empty state for zero-length matches', () => {
    render(
      <ListView
        articles={articles}
        constellations={constellations}
        matchIds={new Set()}
        matches={[]}
        onOpen={() => {}}
      />,
    );
    expect(screen.getByText('No articles match this search.')).toBeInTheDocument();
  });
});
