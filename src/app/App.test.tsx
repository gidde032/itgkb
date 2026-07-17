import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';
import { loadContent } from '../content/load';

describe('App integration', () => {
  it('loads real content with zero errors (FR-1 on the shipped article set)', () => {
    const { articles, constellations, errors } = loadContent();
    expect(errors).toEqual([]);
    expect(articles.length).toBeGreaterThanOrEqual(5);
    expect(constellations).toHaveLength(6);
  });

  it('renders the shell and galaxy canvas without crashing', () => {
    render(<App />);
    expect(screen.getByText('IT Knowledge Galaxy')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Galaxy map/ })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
