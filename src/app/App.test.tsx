import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';
import { loadContent } from '../content/load';

describe('App integration', () => {
  it('loads real content with zero errors (FR-1 on the shipped article set)', () => {
    const { articles, constellations, errors } = loadContent();
    expect(errors).toEqual([]);
    // M4 #25: 41 vendor-generic articles across 7 constellations, all populated,
    // no stubs.
    expect(articles).toHaveLength(41);
    expect(constellations).toHaveLength(7);
    expect(articles.filter((a) => a.stub)).toHaveLength(0);
    // Every constellation now has at least one article.
    for (const c of constellations) {
      expect(articles.some((a) => a.constellation === c.id)).toBe(true);
    }
    // Every article belongs to a defined constellation (no orphans).
    const constellationIds = new Set(constellations.map((c) => c.id));
    for (const a of articles) {
      expect(constellationIds.has(a.constellation)).toBe(true);
    }
  });

  it('renders the shell and galaxy canvas without crashing', () => {
    render(<App />);
    expect(screen.getByText('IT Galactic Knowledge Base')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Interactive galaxy map of IT knowledge articles' }),
    ).toBeInTheDocument();
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
    // 'traceroute' matches traceroute-reading-output and network-architecture.
    expect(screen.getByRole('status')).toHaveTextContent(/2 stars/);
  });

  it('Enter opens the top match article panel', async () => {
    render(<App />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search articles' }), {
      target: { value: 'traceroute' },
    });
    fireEvent.keyDown(screen.getByRole('searchbox', { name: 'Search articles' }), { key: 'Enter' });
    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'Traceroute: Reading and interpreting output',
      }),
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
  it('renders the grouped list instead of the canvas when narrow, and opens articles from it', async () => {
    (globalThis as unknown as { __setNarrowViewport: (v: boolean) => void }).__setNarrowViewport(
      true,
    );
    render(<App />);
    expect(
      screen.queryByRole('img', { name: 'Interactive galaxy map of IT knowledge articles' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Articles by constellation' }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /Traceroute: Reading and interpreting output/ }),
    );
    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'Traceroute: Reading and interpreting output',
      }),
    ).toBeInTheDocument();
  });

  it('keeps the canvas on wide viewports', () => {
    render(<App />);
    expect(
      screen.getByRole('img', { name: 'Interactive galaxy map of IT knowledge articles' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Articles by constellation' }),
    ).not.toBeInTheDocument();
  });
});

// P4-F4 regression: the viewport hook must respond to live media-query
// changes, not just the initial match — resizing swaps views without reload.
import { act } from '@testing-library/react';

describe('live viewport switching (P4-F4)', () => {
  it('swaps canvas for list when the viewport narrows mid-session', () => {
    render(<App />);
    expect(
      screen.getByRole('img', { name: 'Interactive galaxy map of IT knowledge articles' }),
    ).toBeInTheDocument();
    act(() => {
      (globalThis as unknown as { __setNarrowViewport: (v: boolean) => void }).__setNarrowViewport(
        true,
      );
    });
    expect(
      screen.getByRole('navigation', { name: 'Articles by constellation' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: 'Interactive galaxy map of IT knowledge articles' }),
    ).not.toBeInTheDocument();
  });
});

// A4 regression: desktop users can toggle into the list view and back.
describe('desktop list toggle (A4)', () => {
  it('switches to the list and back without a narrow viewport', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'List view' }));
    expect(
      screen.getByRole('navigation', { name: 'Articles by constellation' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: 'Interactive galaxy map of IT knowledge articles' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Galaxy view' }));
    expect(
      screen.getByRole('img', { name: 'Interactive galaxy map of IT knowledge articles' }),
    ).toBeInTheDocument();
  });

  it('hides the toggle on narrow viewports where the list is forced', () => {
    (globalThis as unknown as { __setNarrowViewport: (v: boolean) => void }).__setNarrowViewport(
      true,
    );
    render(<App />);
    expect(screen.queryByRole('button', { name: 'List view' })).not.toBeInTheDocument();
  });
});

// A2 end-to-end: natural phrasing that used to zero out now finds the article.
describe('search fallback end-to-end (A2)', () => {
  it("finds the calendar article for 'calendar wont update'", async () => {
    render(<App />);
    const input = screen.getByRole('searchbox', { name: 'Search articles' });
    fireEvent.change(input, { target: { value: 'calendar wont update' } });
    expect(screen.getByRole('status')).toHaveTextContent(/close match/);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(
      await screen.findByRole('heading', { level: 2, name: /Event couldn't be updated/ }),
    ).toBeInTheDocument();
  });
});

// A11y audit: a keyboard user gets a skip link past the canvas and a main
// landmark to navigate by, plus a page-level heading.
describe('app landmarks (a11y)', () => {
  it('renders a skip link targeting search, a main landmark, and a page h1', () => {
    render(<App />);
    const skip = screen.getByRole('link', { name: 'Skip to search' });
    expect(skip).toHaveAttribute('href', '#article-search');
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'IT Knowledge Galaxy' }),
    ).toBeInTheDocument();
  });
});
