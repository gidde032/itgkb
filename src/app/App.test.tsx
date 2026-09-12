import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';
import { loadContent } from '../content/load';

// #31: the 3D chunk and WebGL detection are mocked at the App level — the
// segmented control's mode switching is what's under test here, not WebGL.
const webglState = vi.hoisted(() => ({ available: true }));
vi.mock('./webgl', () => ({ hasWebGL: () => webglState.available }));
vi.mock('../showcase/ShowcaseCanvas', () => ({
  ShowcaseCanvas: (props: { showRelatedOverlay: boolean; onToggleRelatedOverlay: () => void }) => (
    <div
      className="galaxy-wrap"
      data-testid="showcase-canvas"
      role="img"
      aria-label="3D showcase map"
    >
      <button
        type="button"
        aria-label="3D Related lines"
        aria-pressed={props.showRelatedOverlay}
        onClick={props.onToggleRelatedOverlay}
      />
    </div>
  ),
}));

describe('App integration', () => {
  it('loads real content with zero errors (FR-1 on the shipped article set)', () => {
    const { articles, constellations, errors } = loadContent();
    expect(errors).toEqual([]);
    // M4 #25, updated 2026-09-12: 53 vendor-generic articles across 7
    // constellations, all populated, no stubs.
    expect(articles).toHaveLength(53);
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

describe('search dropdown in galaxy mode (#30)', () => {
  it('shows a dropdown with ranked results when searching in galaxy mode', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search articles' }), {
      target: { value: 'calendar' },
    });
    expect(screen.getByRole('listbox', { name: 'Search results' })).toBeInTheDocument();
  });

  it('hides the dropdown when query is cleared', () => {
    render(<App />);
    const input = screen.getByRole('searchbox', { name: 'Search articles' });
    fireEvent.change(input, { target: { value: 'calendar' } });
    expect(screen.getByRole('listbox', { name: 'Search results' })).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.queryByRole('listbox', { name: 'Search results' })).not.toBeInTheDocument();
  });

  it('does not show a dropdown in list mode', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'List' }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search articles' }), {
      target: { value: 'calendar' },
    });
    expect(screen.queryByRole('listbox', { name: 'Search results' })).not.toBeInTheDocument();
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

  it('moves focus to search and announces the list when a focused viewport surface is removed', () => {
    render(<App />);
    const galaxyButton = screen.getByRole('button', { name: 'Galaxy' });
    galaxyButton.focus();
    expect(galaxyButton).toHaveFocus();

    act(() => {
      (globalThis as unknown as { __setNarrowViewport: (v: boolean) => void }).__setNarrowViewport(
        true,
      );
    });

    const search = screen.getByRole('searchbox', { name: 'Search articles' });
    expect(search).toHaveFocus();
    expect(screen.getByText('Viewport is narrow; showing the article list.')).toHaveAttribute(
      'aria-live',
      'polite',
    );
  });

  it('preserves focus when the 3D surface is active during the transition', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '3D' }));
    const related = await screen.findByRole('button', { name: '3D Related lines' });
    related.focus();
    expect(related).toHaveFocus();

    act(() => {
      (globalThis as unknown as { __setNarrowViewport: (v: boolean) => void }).__setNarrowViewport(
        true,
      );
    });

    expect(screen.getByRole('searchbox', { name: 'Search articles' })).toHaveFocus();
  });

  it('moves focus from a search result when narrowing removes the dropdown', () => {
    render(<App />);
    const search = screen.getByRole('searchbox', { name: 'Search articles' });
    fireEvent.change(search, { target: { value: 'calendar' } });
    const result = screen
      .getByRole('listbox', { name: 'Search results' })
      .querySelector<HTMLButtonElement>('button');
    if (!result) throw new Error('Expected a search result button');
    result.focus();
    expect(result).toHaveFocus();

    act(() => {
      (globalThis as unknown as { __setNarrowViewport: (v: boolean) => void }).__setNarrowViewport(
        true,
      );
    });

    expect(search).toHaveFocus();
  });

  it('moves focus from the forced list when widening restores the desktop canvas', () => {
    (globalThis as unknown as { __setNarrowViewport: (v: boolean) => void }).__setNarrowViewport(
      true,
    );
    render(<App />);
    const listButton = screen.getByRole('button', {
      name: /Traceroute: Reading and interpreting output/,
    });
    listButton.focus();
    expect(listButton).toHaveFocus();

    act(() => {
      (globalThis as unknown as { __setNarrowViewport: (v: boolean) => void }).__setNarrowViewport(
        false,
      );
    });

    expect(screen.getByRole('searchbox', { name: 'Search articles' })).toHaveFocus();
  });

  it('falls back to search when a resized-away article trigger is later closed', async () => {
    render(<App />);
    const search = screen.getByRole('searchbox', { name: 'Search articles' });
    fireEvent.change(search, { target: { value: 'calendar' } });
    const result = screen
      .getByRole('listbox', { name: 'Search results' })
      .querySelector<HTMLButtonElement>('button');
    if (!result) throw new Error('Expected a search result button');
    result.focus();
    expect(result).toHaveFocus();
    fireEvent.click(result);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    act(() => {
      (globalThis as unknown as { __setNarrowViewport: (v: boolean) => void }).__setNarrowViewport(
        true,
      );
    });
    fireEvent.click(screen.getByRole('button', { name: 'Close article' }));

    expect(search).toHaveFocus();
  });
});

// A4 regression: desktop users can pick the list view and back. Since #31 the
// single toggle is a three-segment control (List · Galaxy · 3D).
describe('view-mode segmented control (A4, #31 decision 11)', () => {
  it('switches to the list and back to the galaxy without a narrow viewport', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'List' }));
    expect(
      screen.getByRole('navigation', { name: 'Articles by constellation' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: 'Interactive galaxy map of IT knowledge articles' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Galaxy' }));
    expect(
      screen.getByRole('img', { name: 'Interactive galaxy map of IT knowledge articles' }),
    ).toBeInTheDocument();
  });

  it('switches to the 3D showcase and back (lazy chunk mounts, galaxy unmounts)', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '3D' }));
    // Lazy chunk resolves asynchronously — await it rather than assert sync.
    expect(await screen.findByTestId('showcase-canvas')).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: 'Interactive galaxy map of IT knowledge articles' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Galaxy' }));
    expect(
      screen.getByRole('img', { name: 'Interactive galaxy map of IT knowledge articles' }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('showcase-canvas')).not.toBeInTheDocument();
  });

  it('shares the Related lines state and R shortcut across 2D and 3D', async () => {
    render(<App />);
    const twoD = screen.getByRole('button', { name: 'Related lines' });
    expect(twoD).toHaveAttribute('aria-pressed', 'false');
    fireEvent.keyDown(document.body, { key: 'r' });
    expect(twoD).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: '3D' }));
    const threeD = await screen.findByRole('button', { name: '3D Related lines' });
    expect(threeD).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(threeD);

    fireEvent.click(screen.getByRole('button', { name: 'Galaxy' }));
    expect(screen.getByRole('button', { name: 'Related lines' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('does not toggle Related lines while typing or using browser modifiers', () => {
    render(<App />);
    const related = screen.getByRole('button', { name: 'Related lines' });
    const search = screen.getByRole('searchbox', { name: 'Search articles' });
    fireEvent.keyDown(search, { key: 'r' });
    fireEvent.keyDown(document.body, { key: 'r', ctrlKey: true });
    expect(related).toHaveAttribute('aria-pressed', 'false');
  });

  it('marks the active segment via aria-pressed (coral active state)', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Galaxy' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: '3D' }));
    expect(screen.getByRole('button', { name: '3D' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Galaxy' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('disables the 3D segment when WebGL is unavailable (#31 decision 7)', () => {
    webglState.available = false;
    try {
      render(<App />);
      const threeD = screen.getByRole('button', { name: '3D' });
      expect(threeD).toBeDisabled();
      expect(threeD).toHaveAttribute('title', '3D view requires WebGL');
      // Review repair regression (a11y #2): the exclusion reason must be
      // present as text in the control group, not only in the title tooltip.
      expect(screen.getByText(/does not support WebGL/i)).toBeInTheDocument();
      // Galaxy remains the default and reachable.
      expect(
        screen.getByRole('img', { name: 'Interactive galaxy map of IT knowledge articles' }),
      ).toBeInTheDocument();
    } finally {
      webglState.available = true;
    }
  });

  it('hides the control on narrow viewports where the list is forced', () => {
    (globalThis as unknown as { __setNarrowViewport: (v: boolean) => void }).__setNarrowViewport(
      true,
    );
    render(<App />);
    expect(screen.queryByRole('button', { name: 'List' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '3D' })).not.toBeInTheDocument();
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
