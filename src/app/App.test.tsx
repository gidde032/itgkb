import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';
import { loadContent } from '../content/load';

describe('App integration', () => {
  it('loads real content with zero errors (FR-1 on the shipped article set)', () => {
    const { articles, constellations, errors } = loadContent();
    expect(errors).toEqual([]);
    // Phase 4 contract: the complete seed set — exact counts, not minimums.
    expect(articles).toHaveLength(20);
    expect(constellations).toHaveLength(6);
    expect(articles.filter((a) => a.stub)).toHaveLength(6);
    for (const c of constellations) {
      expect(articles.some((a) => a.constellation === c.id)).toBe(true);
    }
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
    // Phase 4 content: 'traceroute' matches its own article + umn-network-architecture.
    expect(screen.getByRole('status')).toHaveTextContent(/2 stars/);
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


// Phase 4: NF-7 viewport switch — list replaces canvas below the breakpoint.
describe('narrow viewport swaps galaxy for list (NF-7)', () => {
  it('renders the grouped list instead of the canvas when narrow, and opens articles from it', () => {
    (globalThis as unknown as { __setNarrowViewport: (v: boolean) => void }).__setNarrowViewport(true);
    render(<App />);
    expect(screen.queryByRole('img', { name: 'Interactive galaxy map of IT knowledge articles' })).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Articles by constellation' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Traceroute: Reading and interpreting output/ }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Traceroute: Reading and interpreting output' }),
    ).toBeInTheDocument();
  });

  it('keeps the canvas on wide viewports', () => {
    render(<App />);
    expect(screen.getByRole('img', { name: 'Interactive galaxy map of IT knowledge articles' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Articles by constellation' })).not.toBeInTheDocument();
  });
});
