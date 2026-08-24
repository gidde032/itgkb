import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchDropdown } from './SearchDropdown';
import type { Article, Constellation } from '../content/types';
import type { MatchResult } from '../search/types';

function art(id: string, title: string, constellation: string): Article {
  return {
    id,
    title,
    constellation,
    tags: [],
    summary: `${title} summary`,
    stub: false,
    related: [],
    body: '',
    sourceName: `${id}.md`,
  };
}

const articles = [art('a', 'Alpha article', 'c1'), art('b', 'Beta article', 'c2')];
const constellations: Constellation[] = [
  { id: 'c1', name: 'Group One', anchor: { x: 0, y: 0 }, color: '#f00' },
  { id: 'c2', name: 'Group Two', anchor: { x: 0, y: 0 }, color: '#0f0' },
];
const articlesById = new Map(articles.map((a) => [a.id, a]));
const constellationsById = new Map(constellations.map((c) => [c.id, c]));
const matches: MatchResult[] = [
  { id: 'a', score: 10, fields: ['title'] },
  { id: 'b', score: 5, fields: ['body'] },
];

describe('SearchDropdown (#30)', () => {
  it('renders items in rank order', () => {
    render(
      <SearchDropdown
        matches={matches}
        articlesById={articlesById}
        constellationsById={constellationsById}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent).toContain('Alpha article');
    expect(buttons[1].textContent).toContain('Beta article');
  });

  it('shows constellation names', () => {
    render(
      <SearchDropdown
        matches={matches}
        articlesById={articlesById}
        constellationsById={constellationsById}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('Group One')).toBeInTheDocument();
    expect(screen.getByText('Group Two')).toBeInTheDocument();
  });

  it('calls onSelect when an item is clicked', () => {
    const onSelect = vi.fn();
    render(
      <SearchDropdown
        matches={matches}
        articlesById={articlesById}
        constellationsById={constellationsById}
        onSelect={onSelect}
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getAllByRole('button')[1]);
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('calls onClose when Escape is pressed inside the dropdown', () => {
    const onClose = vi.fn();
    render(
      <SearchDropdown
        matches={matches}
        articlesById={articlesById}
        constellationsById={constellationsById}
        onSelect={() => {}}
        onClose={onClose}
      />,
    );
    const buttons = screen.getAllByRole('button');
    buttons[0].focus();
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard navigation between items', () => {
    render(
      <SearchDropdown
        matches={matches}
        articlesById={articlesById}
        constellationsById={constellationsById}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    const buttons = screen.getAllByRole('button');
    buttons[0].focus();
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(buttons[1]);
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(buttons[0]);
  });
});
