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
    expect(screen.getByRole('img', { name: 'Interactive galaxy map of IT knowledge articles' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// Phase 3 integration: search wires provider → dimming set → panel via Enter.
import { fireEvent } from '@testing-library/react';

describe('App search integration (FR-8, FR-7)', () => {
  it('typing a query shows a live match count from real content', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search articles' }), {
      target: { value: 'traceroute' },
    });
    expect(screen.getByRole('status')).toHaveTextContent(/1 star/);
  });

  it('Enter opens the top match article panel', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search articles' }), {
      target: { value: 'traceroute' },
    });
    fireEvent.keyDown(screen.getByRole('searchbox', { name: 'Search articles' }), { key: 'Enter' });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Traceroute: Reading and interpreting output' }),
    ).toBeInTheDocument();
  });
});

// P3-F1 regression (reviewer: skeptic, severity Medium): typing in search must
// NOT rebuild the canvas setup (zoom, listeners, ResizeObserver) per keystroke.
describe('search keystrokes do not churn canvas setup (P3-F1)', () => {
  it('constructs the ResizeObserver once across many keystrokes', () => {
    const stub = (globalThis as Record<string, unknown>).__ResizeObserverStub as {
      constructedCount: number;
    };
    render(<App />);
    const after_mount = stub.constructedCount;
    const input = screen.getByRole('searchbox', { name: 'Search articles' });
    for (const q of ['c', 'ca', 'cal', 'cale', 'calen']) {
      fireEvent.change(input, { target: { value: q } });
    }
    expect(stub.constructedCount).toBe(after_mount);
  });
});
