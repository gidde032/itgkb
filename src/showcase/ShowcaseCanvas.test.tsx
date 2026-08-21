import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

// Wrapper-level test: the Scene subtree and r3f's Canvas are mocked — the
// chrome (orbit toggle, reset, chips, labels, HUD) is what's under test. The
// math underneath lives in pure modules with their own unit tests.
vi.mock('./Scene', () => ({ Scene: () => null }));
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children?: ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
}));

import { ShowcaseCanvas } from './ShowcaseCanvas';
import { loadContent } from '../content/load';
import { CuratedForceLayout } from '../layout/curatedForce';

const content = loadContent();
const positions = new CuratedForceLayout().layout(content.articles, content.constellations);

function renderShowcase(overrides: Record<string, unknown> = {}) {
  const props = {
    articles: content.articles,
    constellations: content.constellations,
    positions,
    selectedId: null,
    onSelect: vi.fn(),
    matchIds: null,
    focus: null,
    ...overrides,
  };
  return render(<ShowcaseCanvas {...props} />);
}

describe('ShowcaseCanvas chrome (#31 decisions 2, 5, 10, 13)', () => {
  it('renders an orbit toggle pressed-on by default; clicking turns it off', () => {
    renderShowcase();
    const orbit = screen.getByRole('button', { name: 'Orbit' });
    expect(orbit).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(orbit);
    expect(orbit).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders a reset-view control in house style', () => {
    renderShowcase();
    expect(screen.getByRole('button', { name: 'Reset view' })).toBeInTheDocument();
  });

  it('renders one bracketed catalog label per article (decision 10)', () => {
    const { container } = renderShowcase();
    const labels = container.querySelectorAll('.s-label');
    expect(labels).toHaveLength(content.articles.length);
  });

  it('renders one clickable constellation chip per constellation (decision 13)', () => {
    renderShowcase();
    for (const c of content.constellations) {
      expect(screen.getByRole('button', { name: c.name })).toBeInTheDocument();
    }
  });

  it('constellation chip clicks issue a framing request without crashing', () => {
    renderShowcase();
    fireEvent.click(screen.getByRole('button', { name: content.constellations[0].name }));
    expect(
      screen.getByRole('button', { name: content.constellations[0].name }),
    ).toBeInTheDocument();
  });

  it('renders the HUD readout with object and field counts', () => {
    const { container } = renderShowcase();
    const hud = container.querySelector('.hud');
    expect(hud).not.toBeNull();
    expect(hud).toHaveTextContent(String(content.articles.length));
    expect(hud).toHaveTextContent(String(content.constellations.length));
  });

  it('exposes an accessible role for the 3D map surface', () => {
    renderShowcase();
    expect(
      screen.getByRole('img', { name: 'Interactive 3D map of IT knowledge articles' }),
    ).toBeInTheDocument();
  });
});
